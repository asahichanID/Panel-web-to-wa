# AUDIT_REPORT.md — Audit & Migrasi apiGlobal

Dokumen ini adalah hasil audit menyeluruh terhadap seluruh penggunaan API eksternal
di project **Oguri-hitori-v2** sebelum & sesudah migrasi ke `apiGlobal`, sesuai
permintaan di `apiGlobal/API_ARCHITECTURE.md`.

---

## 1. Ringkasan

| Metode audit | Hasil |
|---|---|
| File yang memakai `axios`/`fetch`/`node-fetch` | 8 file (`naze.js`, `index.js`, `lib/function.js`, `lib/fetch.js`, `lib/uploader.js`, `musume/uma.js`, `musume/upgrade/play.js`, `musume/upgrade/tracendd.js`, `src/message.js`) |
| Total titik panggil API bisnis (business API call sites) ditemukan | **63** |
| Titik panggil yang berhasil dimigrasi ke apiGlobal | **63 / 63** |
| Provider eksternal yang teridentifikasi | 14 (Naze, Neoxr, Neosantara, fgmods, vihangayt, maelyn, nexoracle, Safebooru, NekosAPI, Nekos.best, GitHub, Urban Dictionary, SampleAPIs, alexflipnote, uguu.se) |
| Dependency baru yang ditambahkan | **0** (seluruhnya memakai `axios`/`form-data`/`file-type` yang sudah ada di `package.json`) |
| File lama yang dihapus | **0** (lihat bagian "Kompatibilitas" di bawah) |

---

## 2. Metodologi Audit

Audit dilakukan dengan menelusuri seluruh project (bukan hanya folder command) untuk kata kunci:
`axios`, `fetch(`, `node-fetch`, `http.request`, `https.request`, `got`, `superagent`, `ky`,
serta pola URL `http(s)://` yang hardcoded. Setiap hasil ditelusuri manual untuk membedakan:

- **Panggilan API bisnis** (butuh key/endpoint/parsing JSON/berpotensi gagal) → target migrasi.
- **URL aset statis** (gambar/game asset di GitHub raw, dsb, tanpa key, tanpa parsing JSON) → di luar ruang lingkup apiGlobal, karena bukan "komunikasi ke provider" dalam pengertian arsitektur ini.

### Dikecualikan dari migrasi (dengan alasan)

| Lokasi | Alasan |
|---|---|
| `naze.js` — fetch `bot/lang.json` dari repo GitHub bot sendiri | Konfigurasi internal milik proyek ini sendiri, bukan API pihak ketiga untuk fitur user. |
| `musume/uma.js`, `musume/umaimage.js`, `musume/helperpreview.js`, `musume/economy/academy.js`, `sounds.js`, `lib/template_menu.js`, `lib/game.js` | URL aset statis (gambar/suara game) tanpa API key & tanpa response JSON untuk diparse — bukan "provider" dalam pengertian arsitektur ini. |
| `src/message.js` | Penggunaan `axios`/`fetch` di sini untuk keperluan penanganan media pesan WhatsApp (bukan pemanggilan API pihak ketiga). |
| `.git`/`.gitclone` (repo zipball URL) | Hanya membangun URL statis (tanpa key, tanpa parsing), dioper langsung ke pengirim dokumen WhatsApp. |
| `runUpdate()` di `lib/function.js` (self-update bot) | Infrastruktur internal bot, bukan fitur API untuk user. |

---

## 3. Peta Migrasi Lengkap (per command / fungsi)

| Command / Fungsi | File asal | Endpoint asli | Fungsi apiGlobal pengganti |
|---|---|---|---|
| `.play` | `musume/upgrade/play.js` | Neoxr `/youtube` (key hardcoded `j3i3mg`) | `apiPlay` / `apiYoutubeAudio` |
| `.ytmp3`/`.yta` | `musume/upgrade/tracendd.js` | Naze `/download/youtube?format=mp3` | `apiYoutubeDownload` |
| `.ytmp4`/`.ytv` | `musume/upgrade/tracendd.js` | Naze `/download/youtube?format=<kualitas>` | `apiYoutubeDownload` |
| `.tt`/`.tiktok` | `musume/upgrade/tracendd.js` | Naze `/download/tiktok` | `apiTiktokDownload` |
| `.ttmp3` | `musume/upgrade/tracendd.js` | Naze `/download/tiktok` | `apiTiktokDownload` |
| `.spotify` (cari) | `musume/upgrade/tracendd.js` | Naze/fgmods/vihangayt `/search/spotify` (3 provider) | `apiSpotifySearch` |
| `.spotify` (unduh) | `musume/upgrade/tracendd.js` | Naze/fgmods/vihangayt `/download/spotify` (3 provider) | `apiSpotifyDownload` |
| `.spotifydl` | `naze.js` | Naze `/download/spotify` | `apiSpotifyDownload` (kini otomatis punya 2 fallback tambahan) |
| `.ig`/`.instagram` | `naze.js` | Naze `/download/instagram2` | `apiInstagramDownload` |
| `.fb`/`.facebook` | `naze.js` | Naze `/download/facebook` | `apiFacebookDownload` |
| `.mediafire`/`.mf` | `naze.js` | Naze `/download/mediafire` | `apiMediafireDownload` |
| Chat AI karakter "Oguri" | `musume/Oguriai/api.js` | Naze `/ai/chat` → `/ai/message` → `/ai/llama` (3 endpoint) | `apiOguriChat` |
| `.cai`/`.roomai` | `naze.js` | Naze `/ai/chat4` | `apiAiChat4` |
| `.ai`/`.gemini`/`.bard` | `naze.js` | Naze `/ai/gemini-flash-lite` | `apiAiQuick` |
| `.grok`/`.glm`/`.claude`/`.archipelago` | `naze.js` | Neosantara `/chat/completions` (Bearer token) | `apiAiPremiumChat` |
| `.deepseek`/`.r1` | `naze.js` | Neosantara `/chat/completions` (+thinking) | `apiAiPremiumChat` |
| `.tts` | `naze.js` | Naze `/tools/tts` (stream) | `apiTextToSpeech` |
| `.translate`/`.tr` | `naze.js` | Naze `/tools/translate` | `apiTranslate` |
| `.toqr` | `naze.js` | Naze `/tools/to-qr` (stream) | `apiQrCodeGenerate` |
| `.remini`/`.tohd` | `naze.js` | Naze `/tools/remini` (form, stream) | `apiRemini` |
| `.dehaze`/`.colorize` | `naze.js` | Naze `/tools/recolor` (form, stream) | `apiRecolor` |
| `.hitamkan`/`.toblack` | `naze.js` | Naze `/create/skin-tone` (form, stream) | `apiSkinTone` |
| `.ssweb` | `naze.js` | Naze `/tools/ss` (stream) | `apiScreenshot` |
| `.cuaca`/`.weather` | `naze.js` | Naze `/tools/cuaca` | `apiWeather` |
| `.emojimix` | `naze.js` | Naze `/tools/emojimix` | `apiEmojiMix` |
| `.style` | `naze.js` | Naze `/tools/styletext` | `apiStyleText` |
| `.tinyurl`/`.shorturl` | `naze.js` | Naze `/other/tinyurl` | `apiShortlink` |
| `.iqc` | `naze.js` | Naze `/create/iqc` (stream) | `apiIqcCreate` |
| `.qc`/`.quote`/`.fakechat` | `naze.js` | Naze `/create/qc` (POST, buffer) + uguu.se upload | `apiQuoteCreate` + `apiUploadFile` |
| `.brat` | `naze.js` | Naze `/create/brat` → `/create/brat3` (2 provider) | `apiBratSticker` |
| `.bratvid` | `naze.js` | Naze `/create/brat2` → `/create/brat4` per-frame (2 provider) | `apiBratVideoFrame` |
| `.wasted` | `naze.js` | Naze `/create/wasted` (form, stream) | `apiWastedImage` |
| `.trigger`/`.triggered` | `naze.js` | Naze `/create/triggered` (form, stream) | `apiTriggeredImage` |
| `.nuliskanan`/`.nuliskiri`/`.foliokanan`/`.foliokiri` | `naze.js` | Naze `/create/nulis/<variant>` (stream) | `apiNulisCreate` |
| `.gimage`/`.bingimg` | `naze.js` | Naze `/search/google` | `apiSearchGoogle` |
| `.pixiv` | `naze.js` | Naze `/search/pixiv` | `apiSearchPixiv` |
| `.pinterest`/`.pin` | `naze.js` | Naze/maelyn/fgmods/nexoracle `/search/pinterest` (4 provider) | `apiPinterestSearch` |
| `.wallpaper` | `naze.js` | Naze `/search/pinterest` (1 provider, tanpa fallback) | `apiPinterestSearch` (kini punya 3 fallback tambahan) |
| `.ringtone` | `naze.js` | Naze `/search/meloboom` | `apiSearchMeloboom` |
| `.npm`/`.npmjs` | `naze.js` | Naze `/search/npm` | `apiSearchNpm` |
| `.tenor` | `naze.js` | Naze `/search/tenor` | `apiSearchTenor` |
| `.urban` | `naze.js` | api.urbandictionary.com langsung | `apiUrbanDefine` |
| `.ghstalk`/`.githubstalk` | `naze.js` | api.github.com langsung | `apiGithubUser` |
| `.motivasi`, `.bijak`, `.dare`, `.quotes`, `.truth`, `.renungan`, `.bucin` | `naze.js` | Naze `/random/*` (7 endpoint) | `apiRandom*` (7 fungsi) |
| Tebak-tebakan (10 jenis game) | `naze.js` | Naze `/games/*` (10 endpoint) | `apiGame*` (10 fungsi) |
| Tebak warna buta | `naze.js` | Naze `/random/color-blind` | `apiRandomColorBlind` |
| `.waifu`/`.neko` | `naze.js` | Safebooru → NekosAPI → Nekos.best (3 provider) | `apiWaifuRandom` |
| `.coffe`/`.kopi` | `naze.js` | alexflipnote → sampleapis (2 provider) | `apiRandomCoffee` |
| `.tourl` | `naze.js` | uguu.se (lewat `lib/uploader.js`) | `apiUploadFile` |

---

## 4. Provider "Neoxr" — Catatan Penting

`API_ARCHITECTURE.md` menyebut **Neoxr** sebagai provider utama project ini. Namun
audit menunjukkan endpoint Neoxr yang **benar-benar sudah terbukti berjalan** sebelum
migrasi hanyalah endpoint **YouTube** (dipakai `.play`, key `j3i3mg` — sebelumnya
hardcoded langsung di `musume/upgrade/play.js`).

Endpoint Neoxr lain (TikTok/Instagram/Facebook/Spotify/AI/dst) **belum pernah dipakai**
di project ini sebelum migrasi, sehingga path & bentuk response persisnya belum
terverifikasi. Sesuai prinsip *"Placeholder Bukan Error"*, `apiGlobal/providers/neoxr.provider.js`
**sengaja hanya berisi fungsi untuk endpoint YouTube** — menambahkan fungsi untuk
endpoint lain tanpa bukti nyata berisiko memberi jaminan palsu.

**Rekomendasi untuk pemilik bot:** jika ingin memperluas cakupan Neoxr ke layanan lain,
cukup tambahkan fungsi baru di `apiGlobal/providers/neoxr.provider.js` mengikuti pola
`neoxrYoutube()`, lalu sisipkan sebagai provider prioritas pertama di file layanan
terkait (mis. `apiGlobal/services/downloader/tiktok.js`). Provider Naze yang sudah
terbukti jalan tetap dipasang sebagai fallback otomatis, sehingga menambah Neoxr
TIDAK BERISIKO mematikan fitur meskipun endpoint yang ditambahkan ternyata salah/berubah.

---

## 5. Layanan yang Masih Placeholder (Belum Ada Sebelum Migrasi)

Sesuai contoh struktur di `API_ARCHITECTURE.md`, dua file berikut dibuat sebagai
**pondasi/placeholder** karena fiturnya memang belum ada di project ini sebelum migrasi:

- **`apiGlobal/services/anime/anime.js`** (`apiAnimeSearch`) — pencarian anime (mis. AniList/Jikan). Tidak ditemukan command terkait di `naze.js`.
- **`apiGlobal/services/lyrics/lyrics.js`** (`apiLyricsSearch`) — pencarian lirik lagu. Perlu dibedakan dari `.tebaklirik` yang merupakan GAME tebak lirik (`/games/tebaklirik`, sudah dimigrasi ke `apiGameTebakLirik`), bukan pencarian lirik.

Kedua fungsi ini melempar `NotImplementedError` yang jelas jika dipanggil — import tetap
aman, project tidak crash, tinggal diisi providernya kapan pun dibutuhkan.

---

## 6. Perbaikan Fungsional yang Didapat "Gratis" dari Migrasi

Beberapa command yang SEBELUMNYA hanya punya 1 provider (tanpa fallback) kini otomatis
mendapat fallback tambahan karena memakai fungsi layanan yang sama dengan command lain:

- **`.spotifydl`** — sebelumnya hanya Naze; kini otomatis fallback ke fgmods → vihangayt (lewat `apiSpotifyDownload`, fungsi yang sama dipakai `.spotify`).
- **`.wallpaper`** — sebelumnya hanya Naze `/search/pinterest`; kini otomatis fallback ke maelyn → fgmods → nexoracle (lewat `apiPinterestSearch`, fungsi yang sama dipakai `.pinterest`).

Kode di `naze.js` untuk kedua command ini dibuat defensif (memakai *optional chaining*
pada field yang bentuknya bisa sedikit berbeda antar-provider) agar tidak crash bila
provider fallback yang menjawab.

---

## 7. Kompatibilitas & File Lama

Sesuai prinsip *"jangan merusak project lama"*, fungsi/berkas berikut **tidak dihapus**
meskipun sudah tidak dipakai lagi oleh `naze.js` maupun `musume/**` setelah migrasi:

- `global.fetchApi` (didefinisikan di `index.js`)
- `fetchApi` & `fetchjson` (`lib/fetch.js`)
- `UguuSe` (`lib/uploader.js`)

Ketiganya diberi komentar `⚠️ DEPRECATED` yang mengarahkan ke `apiGlobal/index.js`,
tapi tetap berfungsi seperti biasa apabila ada skrip lain di luar cakupan audit ini
yang ternyata masih memanggilnya.

`global.APIs` dan `global.APIKeys` (diisi dari `settings.js`) **tetap menjadi sumber
kebenaran** untuk Base URL & API Key Naze/Neosantara — `apiGlobal/config/providers.config.js`
membacanya secara langsung (live), sehingga command `.setapikey` **tetap berfungsi
tanpa perubahan apa pun**.

---

## 8. Verifikasi yang Sudah Dilakukan

- ✅ `node --check` pada **seluruh file `.js`** di project (termasuk seluruh file baru di `apiGlobal/`) — semua lolos, tanpa syntax error.
- ✅ Verifikasi statis: seluruh relative import di `apiGlobal/**` dan di file yang dimigrasi (`naze.js`, `musume/upgrade/play.js`, `musume/upgrade/tracendd.js`, `musume/Oguriai/api.js`) resolve ke file yang benar-benar ada.
- ✅ Verifikasi dependency: `axios`, `form-data`, `file-type` yang dipakai `apiGlobal` sudah ada di `package.json` — **tidak ada dependency baru** yang perlu di-install.
- ✅ Grep akhir memastikan **tidak ada lagi** pemanggilan `fetchApi(`/`fetchJson(` di `naze.js`, `musume/upgrade/play.js`, `musume/upgrade/tracendd.js`, `musume/Oguriai/api.js` kecuali 1 fetch internal (`bot/lang.json`) yang memang dikecualikan (lihat bagian 2).

**Catatan jujur soal batasan verifikasi:** karena lingkungan pengerjaan ini tidak
memiliki akses jaringan maupun `node_modules` ter-install, verifikasi di atas bersifat
**statis** (parsing & resolusi import), BUKAN uji-jalan sungguhan yang benar-benar
memanggil provider. Sangat disarankan pemilik bot menjalankan `npm install` lalu
mencoba beberapa command kunci (`.play`, `.ai`, `.pinterest`, `.tiktok`) di lingkungan
nyata sebelum deploy ke production.

---

## 9. Struktur Akhir `apiGlobal/`

```
apiGlobal/
├── API_ARCHITECTURE.md      (acuan utama, tidak diubah)
├── AUDIT_REPORT.md          (dokumen ini)
├── MIGRATION_GUIDE.md       (panduan menambah layanan/provider baru)
├── README.md                (ringkasan & cara pakai cepat)
├── index.js                 (gerbang tunggal — satu-satunya yang diimpor command)
│
├── config/
│   ├── index.js
│   ├── providers.config.js  (Base URL & API Key seluruh provider)
│   └── timeout.config.js    (timeout & retry per kelompok layanan)
│
├── core/
│   ├── httpClient.js        (eksekusi HTTP mentah — hanya dipanggil providers/*)
│   ├── requestEngine.js     (mesin fallback + retry + timeout)
│   ├── normalizer.js        (pickField, envelope, validated)
│   ├── errors.js            (ApiGlobalError & turunannya)
│   ├── logger.js
│   └── cache.js
│
├── providers/                (14 file, satu per provider eksternal)
│
└── services/                 (29 file, dikelompokkan per domain)
    ├── downloader/  (youtube, play, tiktok, instagram, facebook, mediafire, spotify)
    ├── ai/          (ai.js)
    ├── creator/     (maker.js, skintone.js)
    ├── tools/       (tts, translate, qrcode, remini, recolor, screenshot, weather, emojimix, styletext, shortlink)
    ├── search/      (search.js, pinterest.js)
    ├── random/      (random.js)
    ├── games/       (games.js)
    ├── anime/       (waifu.js, anime.js [placeholder])
    ├── lyrics/      (lyrics.js [placeholder])
    ├── misc/        (github.js, urbandictionary.js, coffee.js)
    └── upload/      (uploader.js)
```
