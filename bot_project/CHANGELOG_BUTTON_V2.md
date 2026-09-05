# sendButtonMsg V2 — Root Cause Analysis & Rewrite

## 1. Root Cause

**Bukan bug protobuf, bukan bug `relayMessage`, bukan salah pasang parameter di project ini.**
Akar masalahnya adalah **deprecation di sisi platform WhatsApp**: tipe pesan lama
`buttonsMessage` (dipakai `sendButtonMsg` versi lama) sudah dihentikan
dukungannya oleh client resmi WhatsApp (Android/iOS/Web), terlepas dari
Baileys ataupun kode project ini.

Bukti pendukung (independen dari kode project ini):

- Komunitas maintainer lib WhatsApp-Web (Baileys, WWebJS, open-wa, WppConnect,
  Cobalt) resmi mengumumkan mereka **menghentikan dukungan tombol/list lama**
  karena WhatsApp terus mem-patch jalur itu di sisi server.
- Issue resmi Baileys (#2465, April 2026): pesan list/button legacy "tidak
  error tapi tidak pernah muncul sebagai interactive di client mobile" —
  dikonfirmasi sebagai **perubahan server-side WhatsApp**, bukan bug library.
- Dokumentasi teknis Baileys (DeepWiki) menyatakan eksplisit: pendekatan
  modern **wajib** `interactiveMessage`, sedangkan `buttonsMessage` /
  `templateMessage` **"may not work without WhatsApp Business API partner
  status"**.

## 2. Analisa Teknis (perbandingan langsung, bukan asumsi)

Sebelum rewrite, `sendListMsg` dan `sendButtonMsg` berada di file yang sama
(`src/message.js`) dan bisa dibandingkan baris-per-baris:

| Aspek | `sendListMsg` (normal) | `sendButtonMsg` lama (bermasalah) |
|---|---|---|
| Container pesan | `interactiveMessage` | `buttonsMessage` |
| Tombol | `nativeFlowMessage.buttons[]` | `buttons[]` legacy |
| Pembentukan `contextInfo` | spread mentah `{...contextInfo, ...options.contextInfo, mentionedJid, quoted}` | **identik**, spread mentah yang sama |
| `externalAdReply` | passthrough tanpa transformasi | **identik**, passthrough tanpa transformasi |
| `generateWAMessageFromContent()` | dipanggil sama | dipanggil sama |
| `relayMessage()` + `additionalNodes` (biz/interactive/native_flow) | sesuai (memang native_flow) | **dikirim juga**, padahal isi pesannya `buttonsMessage`, bukan native_flow → sinyal biner tidak konsisten dengan tipe pesan yang sebenarnya dikirim |

Kesimpulan dari tabel di atas: jalur `contextInfo`/`externalAdReply` **sudah
terbukti identik** sebelum rewrite — sehingga itu **bukan** akar masalah.
Satu-satunya variabel struktural yang berbeda adalah **jenis container
pesan itu sendiri** (`buttonsMessage` vs `interactiveMessage`), yang persis
cocok dengan gejala yang dilaporkan:

- **Preview terlihat oleh pengirim** → device pengirim menampilkan echo lokal
  dari apa yang *dikirim*, bukan apa yang *diterima & dirender* client lain.
- **Kadang terlihat oleh bot lain** → bot lain (mis. sesama Baileys) membaca
  protobuf mentah dari WebSocket, bukan melalui jalur render resmi client
  WhatsApp — jadi mereka "melihat" data yang sudah di-drop client resmi.
- **Sebagian besar user WhatsApp tidak melihat apa-apa** → client resmi sudah
  berhenti merender `buttonsMessage`.
- **`sendListMsg` tidak bermasalah** → karena dari awal sudah memakai jalur
  yang masih didukung resmi (`interactiveMessage` + `nativeFlowMessage`).

Bug sekunder yang ikut ditemukan (kontributif, bukan akar utama): karena
`sendButtonMsg` lama tetap melampirkan `additionalNodes` bertipe
`native_flow` walau isi pesannya `buttonsMessage`, ada ketidakkonsistenan
sinyal biner antara metadata dan payload aktual — makin memperbesar variasi
perilaku antar-client.

## 3. Perubahan

`sendButtonMsg` ditulis ulang total (bukan patch) untuk memakai
`interactiveMessage` + `nativeFlowMessage`, memakai **jalur pengiriman yang
sama persis** dengan `sendListMsg` lewat helper baru `sendInteractiveCore()`
— sehingga kedua helper **tidak bisa lagi** diam-diam punya payload
`contextInfo`/`externalAdReply`/`relayMessage` yang berbeda di masa depan.

File yang diubah: `src/message.js` (satu-satunya file yang mendefinisikan
kedua helper ini; tidak ada file command yang diubah).

### Fungsi modular baru
- `convertLegacyButtons()` — format lama → NativeFlow (lihat §4)
- `convertContext()` — gabungkan `contextInfo` + `quoted` + `mentions`
- `convertMedia()` — upload media (image/video/document/location, dll)
- `convertHeader()` — bangun `InteractiveMessage.Header`
- `convertExternalAdReply()` — titik tunggal untuk field `externalAdReply`
- `convertNativeFlow()` — normalisasi satu tombol → `{name, buttonParamsJson}`
- `sendInteractiveCore()` — satu-satunya jalur bangun + kirim, dipakai
  `sendListMsg` **dan** `sendButtonMsg`

`sendListMsg` juga direfactor supaya memanggil `sendInteractiveCore()` yang
sama (murni ekstraksi, mapping tombolnya tetap baris-per-baris identik
dengan sebelumnya — tidak ada perubahan perilaku pada `sendListMsg`).

## 4. Converter Legacy → Native (backward compatibility)

`convertLegacyButtons()` mendukung **semua** bentuk yang benar-benar dipakai
di ±334 command project ini (diverifikasi lewat pencarian menyeluruh ke
seluruh command sebelum rewrite), plus bentuk tambahan sesuai checklist:

| Bentuk input (lama) | Dikenali dari | Hasil NativeFlow |
|---|---|---|
| `{ buttonId, buttonText:{displayText}, type:1 }` (paling umum, dipakai di `naze.js` `.coba` & menu) | tidak ada field lain yang cocok | `quick_reply` |
| `{ buttonId, buttonText, nativeFlowInfo:{name, paramsJson}, type:2 }` (dipakai `lib/template_menu.js` untuk `single_select`) | `nativeFlowInfo.name` ada | passthrough sesuai `nativeFlowInfo` |
| `{ name, buttonParamsJson }` (format native modern) | `name` + `buttonParamsJson` ada | passthrough |
| `{ urlButton:{displayText,url} }` | `urlButton` ada | `cta_url` |
| `{ callButton:{displayText,phoneNumber} }` | `callButton` ada | `cta_call` |
| `{ copyButton:{displayText,copyCode} }` / `copyCode` langsung | `copyButton`/`copyCode` ada | `cta_copy` |

`headerType` (angka 1–6 dari `buttonsMessage` lama) tetap **diterima** di
signature `sendButtonMsg` supaya caller lama tidak error, tapi **tidak lagi
dipakai** — tipe header (image/video/document/location) sekarang otomatis
terdeteksi dari *key* media yang dikirim, sama seperti `sendListMsg`
(satu-satunya cara yang valid di `InteractiveMessage.Header`, yang tidak
punya field numerik `headerType`).

## 5. Validasi

Diuji dengan memuat **kode asli hasil ekstraksi (bukan tulisan ulang)** dari
`src/message.js`, memakai stub `proto`/`generateWAMessageFromContent` agar
bisa dijalankan tanpa koneksi WhatsApp sungguhan:

1. Payload `contextInfo`/`externalAdReply`/`additionalNodes` dari
   `sendListMsg` vs `sendButtonMsg` V2 — **identik** (13/13 assertion pass).
2. Tiga pemanggilan asli disimulasikan **tanpa mengubah argumen aslinya**:
   - `.coba` (`naze.js`) — 2 tombol legacy polos
   - Menu `type 1` (`lib/template_menu.js`) — legacy polos + `quoted`
   - Menu `type 2` — **campuran** legacy polos + hybrid `nativeFlowInfo`
     (`single_select` dengan banyak section)
   - Menu `type 3` — header `document` + `externalAdReply` +
     `forwardedNewsletterMessageInfo` + tombol `single_select`
   Semua terkirim benar tanpa satu pun command file diedit.
3. `node --check` ke seluruh file `.js` project — bersih, tidak ada syntax
   error.

## 6. Breaking Change

**Tidak ada.** Semua command lama (`.menu`, `.profile`, `.shop`, `.afk`,
`.academy`, `.owner`, `.coba`, dll) memanggil `naze.sendButtonMsg(...)`
dengan signature yang sama persis; konversi format terjadi otomatis di
dalam helper.

Satu-satunya perilaku yang berubah secara sengaja: pesan yang dikirim lewat
`sendButtonMsg` sekarang secara struktural adalah `interactiveMessage`
(bukan `buttonsMessage`) — ini **tujuan dari perbaikan**, bukan efek samping
yang tidak diinginkan.

## 7. Cara Rollback

Karena hanya `src/message.js` yang diubah, rollback dilakukan dengan
mengembalikan definisi `naze.sendListMsg` dan `naze.sendButtonMsg` (serta
menghapus blok helper `sendInteractiveCore` dkk. tepat sebelum
`async function Solving`) ke versi sebelum commit ini — tidak ada file lain
yang perlu disentuh. Disarankan pakai git:


---

# Addendum — Bug Lanjutan: Menu Hanya Sampai ke Pengirim di Grup

## Gejala (berbeda dari bug externalAdReply sebelumnya)

- Audio (`naze.sendMessage`) → sampai ke semua anggota grup, ada status "Tersampaikan".
- Menu / All Menu (`naze.sendButtonMsg` / `sendListMsg`) → **hanya pengirim** yang lihat, anggota lain **nol**, tidak ada di daftar "Tersampaikan" sama sekali.

Ini gejala yang jauh lebih berat dari sebelumnya (dulu: sebagian client tidak *render*; sekarang: pesan sepertinya tidak pernah *sampai* ke perangkat lain sama sekali). Ini butuh root cause yang berbeda dari addendum sebelumnya.

## Yang terbukti langsung dari kode project ini (fakta, bukan dugaan)

1. `naze.relayMessage` **tidak pernah** di-override di project ini — murni method bawaan Baileys.
2. **Semua** pemanggilan `relayMessage()` langsung di project ini (helper button/list, anti-toxic, menfes, dsb.) **tidak pernah** melakukan fetch/refresh metadata grup sebelum relay.
3. Audio dikirim lewat `naze.sendMessage()` — fungsi tingkat tinggi bawaan Baileys yang menurut dokumentasi resminya *"will try to get the group participant list (to encrypt the message to each participant)"* ketika tujuannya grup. Ini langkah yang **tidak ada** pada jalur `relayMessage()` manual.
4. Socket di `index.js` **tidak dikonfigurasi** dengan `cachedGroupMetadata` — diperiksa langsung di opsi `WAConnection()`, tidak ada.

## Batasan investigasi (disampaikan apa adanya)

Untuk memastikan **apakah `relayMessage()` di Baileys RC13 melakukan sendiri** langkah resolusi participant grup itu atau tidak, perlu membaca source literal `messages-send.ts`/`messages-send.js` versi rc13. Dari lingkungan audit ini:

- Tidak ada akses `npm install` (jaringan bash dinonaktifkan).
- `node_modules/baileys` tidak ikut ter-upload bersama project (hanya `package.json`).
- Fetch ke GitHub raw & CDN (unpkg/jsDelivr) untuk file source spesifik ditolak oleh alat pencarian di lingkungan ini (hanya bisa membuka URL yang persis muncul di hasil pencarian, tidak bisa menebak path file).

Karena itu, klaim "field/baris spesifik di source RC13 yang menyebabkan bug" **tidak** dicantumkan di sini — itu akan jadi dugaan yang justru dilarang dilakukan. Yang dicantumkan hanya yang benar-benar terverifikasi: dokumentasi resmi Baileys (dikutip persis di atas) + audit kode project ini sendiri.

## Perbaikan yang diterapkan (benar di kedua kemungkinan)

Karena tidak bisa dipastikan 100% apakah `relayMessage()` sendiri sudah menangani resolusi participant grup atau tidak, perbaikan dibuat supaya **benar terlepas dari itu**:

1. **`sendInteractiveCore()` kini memaksa refresh metadata grup sebelum relay** bila `jid` berakhiran `@g.us` — persis langkah yang didokumentasikan dipakai `sendMessage()` untuk grup. Kalau refresh gagal, pengiriman tetap lanjut pakai cache lama (tidak mati total).
2. **`cachedGroupMetadata` kini dikonfigurasi di `index.js`**, disambungkan ke cache `store.groupMetadata` yang sudah dipakai project ini di tempat lain — sesuai rekomendasi resmi README Baileys.
3. **Instrumentasi diagnostik opt-in** (`NAZE_RELAY_DEBUG=1` di environment) ditambahkan di `sendInteractiveCore()` — mencetak jumlah participant grup yang terbaca tepat sebelum relay, dan hasil `relayMessage()` sesudahnya. Ini supaya begitu dijalankan di sesi WhatsApp sungguhan, ada **bukti pasti** dari perilaku server yang sebenarnya — sesuatu yang tidak bisa saya hasilkan dari sandbox offline ini. Cara pakai:
   ```bash
   NAZE_RELAY_DEBUG=1 node index.js
   ```
   lalu kirim `.allmenu` di grup dan lihat log `[NAZE_RELAY_DEBUG]` untuk `participantCount` dan hasil relay.

## File yang diubah pada addendum ini

- `index.js` — tambah `cachedGroupMetadata`.
- `src/message.js` — `sendInteractiveCore()` kini menerima parameter `store`, melakukan priming metadata grup, dan punya log diagnostik opt-in. `sendListMsg`/`sendButtonMsg` diteruskan `store` (tidak ada perubahan pada signature yang dipanggil command manapun — tetap backward compatible 100%).

## Jika setelah ini masalah masih terjadi

Kalau dengan `NAZE_RELAY_DEBUG=1` log menunjukkan `participantCount` sudah benar (bukan 0/UNKNOWN) dan `relayMessage()` tetap tidak sampai ke anggota lain, itu bukti kuat bahwa penyebabnya ada di luar kontrol payload (mis. pembatasan WhatsApp di level akun/nomor terhadap jenis pesan interaktif ke grup). Pada titik itu, solusi yang jujur bukan lagi "field mana yang salah", melainkan mengganti strategi pengiriman menu grup ke format yang terbukti selalu sampai (teks biasa bernomor + baca balasan sebagai pilihan), sambil tetap memakai Interactive Message untuk chat pribadi. Beri tahu saya hasil log-nya dan saya bantu implementasikan fallback itu kalau memang diperlukan.

