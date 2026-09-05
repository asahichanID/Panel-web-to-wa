# AUDIT_REPORT_V3.md — Migrasi ke API Global V3 (NeoXR sebagai Provider Utama)

Dokumen ini melengkapi `AUDIT_REPORT.md` (migrasi awal ke apiGlobal). Fokus
dokumen ini: audit & perbaikan migrasi ke **API_GLOBAL_V3.md**, menjadikan
**NeoXR sebagai provider utama** dengan **Naze (dan fallback lain yang sudah
ada) tetap dipertahankan sebagai fallback**, mengikuti `NEOXR_ENDPOINTS.md`
sebagai satu-satunya referensi endpoint.

Project yang diaudit adalah hasil migrasi V3 SEBELUMNYA yang sudah berjalan
sebagian tapi mengandung banyak bug (nama file zip: `Oguri-cap_ERROR_apiGlobal.zip`).
Seluruh bug di bawah ini ditemukan & diperbaiki pada sesi ini.

---

## 1. Bug Kritis (Menyebabkan Bot Gagal Total)

| # | Lokasi | Masalah | Dampak | Perbaikan |
|---|---|---|---|---|
| 1 | `musume/upgrade/tracendd.js:273` | Syntax error `if (!result?)` — `?.` tanpa properti setelahnya | **Seluruh project gagal di-parse Node.js** (tidak bisa jalan sama sekali) | Diperbaiki jadi `if (!result)` |
| 2 | `apiGlobal/providers/nexoracle.provider.js` | **File ini benar-benar hilang dari project**, padahal diimpor & dipakai di `pinterest.js` | `import` akan gagal (`Cannot find module`) saat `apiGlobal/index.js` dimuat — karena `pinterest.js` diekspor lewat gerbang utama, **seluruh apiGlobal (dan seluruh bot) gagal dimuat**, bukan cuma fitur Pinterest | File dibuat ulang sesuai pola provider search Pinterest yang sudah ada (fgmods/maelyn) |
| 3 | `apiGlobal/services/anime/waifu.js` | Provider NeoXR ditulis `validated(Promise.all(Array.from({length:5}, () => neoxrRequest('/waifu'))), ...)` | `neoxrRequest()` mengembalikan objek `{name,run}` biasa (bukan Promise), jadi `Promise.all([...5 descriptor])` tidak pernah memanggil `.run()`. `validated()` lalu menerima sebuah Promise, bukan ProviderDescriptor → `provider.run` selalu `undefined` → **setiap panggilan `.waifu`/`.neko` selalu gagal di percobaan NeoXR** sebelum sempat fallback dengan benar | Diganti jadi satu panggilan `neoxrRequest('/waifu')` biasa (endpoint ini memang cukup dipanggil sekali per gambar) |
| 4 | `apiGlobal/services/tools/emojimix.js` | `neoxrRequest` dipakai tapi **tidak diimpor** | `ReferenceError: neoxrRequest is not defined` setiap kali `.emojimix` dipanggil | Import ditambahkan |
| 5 | `apiGlobal/services/search/pinterest.js` | `nexoraclePinterestSearch` dipakai tapi **tidak diimpor** (selain file-nya sendiri hilang, lihat #2) | `ReferenceError` | Import ditambahkan setelah file provider dibuat ulang |

---

## 2. Bug Fungsional (Fitur "Berhasil" Tapi Sebenarnya Rusak/Salah)

| # | Lokasi | Masalah | Dampak | Perbaikan |
|---|---|---|---|---|
| 6 | `apiGlobal/providers/neoxr.provider.js` | Base URL & API Key dibaca langsung dari `global.APIs?.neoxr` / `global.APIKeys?.neoxr` — padahal `global.APIKeys` sebenarnya di-key oleh **Base URL**, bukan nama provider, dan `global.APIs` tidak pernah punya entri `neoxr` (hanya `naze`/`neosantara`, lihat `settings.js`) | Base URL & API Key NeoXR **tidak pernah benar-benar terbaca dari konfigurasi** — hanya kebetulan jatuh ke nilai default hardcode. Env var `APIGLOBAL_NEOXR_*` dan config terpusat sama sekali tidak berfungsi | Diganti memakai `getBaseUrl('neoxr')`/`getApiKey('neoxr')` dari `config/index.js` (satu-satunya sumber kebenaran, sudah mendukung override env var) |
| 7 | `apiGlobal/providers/neoxr.provider.js` | Opsi auto-download membaca `options.stream`, padahal **seluruh pemanggil** (dan `httpClient.js`) memakai nama `streamTo` | Path tujuan file custom (mis. per-frame video di `apiBratVideoFrame`, dipakai `.bratvid`) **selalu diabaikan diam-diam** dan diganti nama file acak — merusak proses penggabungan frame video di command | Diganti jadi `streamTo` (konsisten dengan `naze.provider.js`) |
| 8 | `apiGlobal/services/ai/ai.js` (`apiAiPremiumChat`) | Ada gate `if (!isConfigured('neosantara')) throw ...` di AWAL fungsi, SEBELUM mencoba NeoXR sama sekali | Bot owner yang belum mengisi API Key Neosantara akan **selalu gagal total** untuk `.claude`/`.grok`/`.archipelago`/`.deepseek`, padahal NeoXR (yang tidak butuh key Neosantara) semestinya tetap bisa dicoba lebih dulu | Gate dihapus; Neosantara sekarang HANYA ditambahkan ke daftar provider bila memang sudah terkonfigurasi, tidak lagi memblokir NeoXR |
| 9 | `apiGlobal/services/ai/ai.js` (`apiAiQuick`) | Path endpoint ditulis `'./gpt4'` (ada `.` nyasar di depan) | URL yang terbentuk jadi `.../api/./gpt4` — berpotensi salah/rapuh tergantung normalisasi path di sisi server | Diperbaiki jadi `/gpt4` |
| 10 | `apiGlobal/services/ai/ai.js` (`apiAiPremiumChat`) | `neoxrRequest('/claude', {model, messages, thinking}, {timeout})` — **tanpa `method: 'POST'`**, sehingga default GET dipakai | `messages` adalah array kompleks; dikirim lewat GET berarti dipaksa masuk ke `URLSearchParams`, menghasilkan query string rusak seperti `messages=%5Bobject+Object%5D` — **request ke NeoXR pasti gagal/salah** | Ditambahkan `method: 'POST'` |
| 11 | `apiGlobal/services/downloader/youtube.js` | `normalize()` membaca `title`/`channel`/`views`/`publish` dari objek yang SAMA dengan `filename`/`size`/`url` — padahal response NeoXR menaruh metadata (title/channel/views/publish) di level ATAS, sedangkan info file di dalam `data.*` | Untuk hasil dari NeoXR, `title`/`author`/`views`/`ago` **selalu kosong** (field-nya ada tapi dicari di level yang salah) | Ditambahkan `mergeNeoxr()` yang menggabungkan kedua level sebelum normalisasi |
| 12 | `apiGlobal/services/downloader/youtube.js` | Field `views` dari NeoXR berbentuk string dengan pemisah ribuan titik (mis. `"219.774.380"`); command memanggil `Number(views).toLocaleString(...)` | `Number("219.774.380")` → `NaN`, caption menampilkan "NaN" alih-alih jumlah views | `normalize()` sekarang membersihkan karakter non-digit sebelum dikonversi ke Number |
| 13 | `apiGlobal/services/downloader/youtube.js` (`apiYoutubeDownload`) | Kualitas video dikirim apa adanya (`'720'`) padahal NeoXR mencontohkan format `"720p"` | Kemungkinan endpoint NeoXR tidak mengenali kualitas tanpa akhiran `p` | Angka polos otomatis diberi akhiran `p`; `'2k'/'4k'/'8k'` dibiarkan apa adanya |
| 14 | `apiGlobal/services/downloader/tiktok.js` | Path endpoint ditulis `'download/tiktok'` (harusnya `/tiktok` sesuai NEOXR_ENDPOINTS.md); response `envelope(raw?.result ?? null, ...)` tidak pernah menangani bentuk NeoXR (`data.caption`/`data.video`/`data.videoWM`/`data.audio`/`data.music`, tanpa `.result`) | Bila NeoXR berhasil merespons, `result` selalu `null` → command menampilkan "Video tidak ditemukan" walau NeoXR sebenarnya sukses | Path diperbaiki; ditambahkan `normalizeNeoxr()` yang memetakan bentuk NeoXR ke bentuk yang sama seperti Naze (`desc`, `author.nickname`, `create_time`, `download.video.{nowm_hd,nowm,wm}`, `download.audio`, `download.music`, `download.music_info`) |
| 15 | `apiGlobal/services/downloader/instagram.js` | Response NeoXR (`data: [{type,url}]`, array langsung) tidak pernah dipetakan — hanya bentuk Naze (`result.urls`) yang dibaca | Hasil dari NeoXR selalu `null` → command menampilkan "Postingan Tidak Tersedia" walau NeoXR sukses | Ditambahkan `normalizeNeoxr()` memetakan array NeoXR ke `{urls:[{url,is_video}], caption:null}` |
| 16 | `apiGlobal/services/downloader/facebook.js`, `mediafire.js` | Kedua layanan ini **belum sama sekali** memakai NeoXR (tertinggal dari migrasi sebelumnya) | NeoXR tidak dipakai sebagai provider utama untuk Facebook & Mediafire, bertentangan dengan target utama migrasi V3 | NeoXR (`/fb`, `/mediafire`) ditambahkan sebagai provider utama, Naze tetap fallback; response dipetakan ke bentuk yang sama seperti Naze |
| 17 | `apiGlobal/services/search/pinterest.js` | Item hasil NeoXR (`/pinterest-v2`) menaruh URL gambar di `content[0].url` (bukan field `.url` rata), sedangkan command (`naze.js`) membaca `item.url`/`item.image`/`item.link` secara rata | Hasil pencarian dari NeoXR akan **selalu terfilter habis** (URL tidak ditemukan → dianggap format tidak valid) meski NeoXR sebenarnya mengembalikan gambar | Item dinormalisasi supaya selalu punya `.url` rata (diambil dari `content[0].url` bila ada); field `.source` (link pin asli, sudah didukung NeoXR) tetap disertakan |
| 18 | `naze.js` case `'pinterest'` | Ekstraksi ID pin asli murni mengandalkan regex angka 15-19 digit di seluruh teks response, dicocokkan berdasarkan urutan index (`semuaAngka[urut]`) | Berpotensi salah pasangan bila ada angka 15-19 digit lain di response (mis. `author.id`) sebelum ID pin yang sesungguhnya | Bila item punya `source` langsung dari NeoXR (link asli), dipakai langsung — regex hanya jadi fallback untuk provider lama yang tidak menyediakan `source` |
| 19 | `naze.js` case `'wallpaper'` | Membaca `result.urls.original`, `result.pin` — field khas Naze yang **tidak ada** di hasil NeoXR (`content[]`, `source`) | **Crash** (`Cannot read properties of undefined`) tertangkap oleh try/catch, menampilkan "Server wallpaper sedang offline!" walau NeoXR sebenarnya berhasil | Akses field dibuat defensif: `result.urls?.original || result.url || result.content?.[0]?.url`, dst |

---

## 3. Bug/Kesenjangan yang Ditemukan di Luar Cakupan Awal Dokumentasi

Ditemukan saat audit menyeluruh (bukan bagian dari `NEOXR_ENDPOINTS.md`, tapi
melanggar "HTTP Rule" API_GLOBAL_V3.md — command/service dilarang melakukan
HTTP request langsung):

| # | Lokasi | Masalah | Perbaikan |
|---|---|---|---|
| 20 | `naze.js` — fitur `.chess` (5 titik berbeda: vs bot, 2 pemain, start, lanjutan, vs bot ulang) | `axios.get()` MENTAH langsung di 5 tempat, masing-masing mengulang daftar 5 URL render papan catur yang sama | Dipindahkan ke `apiGlobal/providers/chessRender.provider.js` + `apiGlobal/services/games/chessboard.js` (`apiChessBoardImage(fen, {flip})`), dipakai ulang di seluruh 5 titik command |
| 21 | `naze.js` case `'cekmati'` | `axios.get('https://api.agify.io/?name=...')` MENTAH langsung di command | Dipindahkan ke `apiGlobal/providers/agify.provider.js` + `apiGlobal/services/misc/agify.js` (`apiAgifyPredict`) |

---

## 4. Kategori yang Diverifikasi Sudah Benar (Tidak Perlu Diubah)

Sesuai catatan eksplisit di `NEOXR_ENDPOINTS.md` ("tidak terpakai" / tidak ada
endpoint terdokumentasi), file-file berikut diverifikasi TIDAK memakai NeoXR
dan sengaja dibiarkan Naze-only:

- `services/creator/skintone.js`, `services/creator/maker.js` bagian `apiQuoteCreate`/`apiWastedImage`/`apiTriggeredImage`
- `services/search/search.js` (google/pixiv/meloboom/npm/tenor)
- `services/tools/tts.js`, `translate.js`, `qrcode.js`, `recolor.js`, `screenshot.js`, `weather.js`, `styletext.js`, `shortlink.js`
- `services/misc/github.js`, `urbandictionary.js`, `coffee.js`
- `services/upload/uploader.js`
- `services/games/games.js`, `services/random/random.js`, `services/lyrics/lyrics.js`
- `services/ai/ai.js` bagian `apiOguriChat` (sesuai catatan eksplisit di NEOXR_ENDPOINTS.md: "ini sebenarnya file gagal, jadi abaikan saja" / NeoXR belum ditentukan untuk layanan ini)

`services/downloader/spotify.js` diverifikasi **sudah benar sejak awal** —
NeoXR (`/spotify-search`, `/spotify`) sudah terpasang sebagai prioritas
utama dengan bentuk response yang kompatibel.

---

## 5. Layanan Baru yang Diaktifkan

- **`apiAnimeSearch`** (`services/anime/anime.js`) — sebelumnya placeholder
  (`NotImplementedError`), sekarang aktif memakai NeoXR `/anime`. **Catatan:**
  belum ada command `.anime` di `naze.js` yang memanggilnya — fungsi sudah
  siap pakai, tinggal disambungkan ke command baru kapan pun dibutuhkan
  (sengaja tidak ditambahkan di sesi ini karena menambah command baru berada
  di luar cakupan "migrasi & perbaikan bug").

---

## 6. Verifikasi yang Dilakukan

- ✅ `node --check` pada **seluruh file `.js`** di project — 100% lolos, tanpa syntax error.
- ✅ Verifikasi statis seluruh relative import di `apiGlobal/**` — 100% resolve ke file yang benar-benar ada (termasuk setelah `nexoracle.provider.js` dibuat ulang).
- ✅ **Uji impor runtime sungguhan** (bukan cuma parsing): `apiGlobal/index.js` diimpor langsung oleh Node.js (dengan `axios`/`form-data`/`file-type` di-stub karena lingkungan pengerjaan tidak memiliki akses jaringan/npm install) — seluruh 70 fungsi berhasil dimuat tanpa error.
- ✅ **Uji end-to-end rantai fallback**: setiap layanan yang memakai NeoXR (tiktok, pinterest, waifu, ai.chat4, chessboard) dipanggil dengan axios yang SELALU gagal — dikonfirmasi setiap provider dicoba SESUAI URUTAN PRIORITAS (NeoXR lebih dulu, baru fallback), dan ketika semua gagal, error `AllProvidersFailedError` yang jelas dilempar (bukan crash tak tertangani).
- ✅ Grep akhir memastikan tidak ada lagi `axios.`/`fetchApi(`/`fetchJson(` di `naze.js`/`musume/upgrade/*.js`/`musume/Oguriai/api.js` kecuali 2 pengecualian yang sudah didokumentasikan di `AUDIT_REPORT.md` (fetch config internal `lang.json`, dan command `.fetch`/`.get` yang secara sengaja generik mem-proxy URL apa pun milik user).

**Catatan jujur soal batasan verifikasi:** karena lingkungan pengerjaan ini
tidak memiliki akses jaringan sungguhan, verifikasi di atas TIDAK mencakup
uji terhadap response asli dari api.neoxr.eu. Bentuk response yang dipakai
sebagai acuan normalisasi sepenuhnya berdasarkan contoh di `NEOXR_ENDPOINTS.md`.
Sangat disarankan pemilik bot mencoba command kunci (`.play`, `.tt`, `.pinterest`,
`.waifu`, `.ai`, `.claude`, `.iqc`, `.brat`, `.bratvid`, `.remini`, `.emojimix`,
`.chess`, `.cekmati`) di lingkungan nyata sebelum deploy ke production, dan
melaporkan bila ada bentuk response NeoXR yang ternyata berbeda dari dokumentasi
supaya normalizer terkait bisa disesuaikan lebih lanjut.
