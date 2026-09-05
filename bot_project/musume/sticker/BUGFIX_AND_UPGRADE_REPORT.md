# Laporan Perbaikan Bug FFmpeg & Upgrade Sticker Engine V2

Status: **SELESAI**. Laporan ini merangkum audit, perbaikan bug FFmpeg
timeout, StickerToVideo Engine, Sticker Meme Custom, dan upgrade Twemoji.

---

## 1. Penjelasan Bug `FFMPEG_TIMEOUT`

**Log:**
```
StickerEngineError: FFmpeg gagal setelah 2 percobaan: FFmpeg timeout setelah 20000ms
FFmpegEngine.execute() -> createSticker() -> sendAsSticker() -> message.js -> naze.js
```

### Akar Masalah (bukan sekadar "timeout kurang besar")

1. **Filter chain lama memakai `palettegen`/`paletteuse`** — teknik reduksi
   256 warna khas GIF — padahal target encode adalah **libwebp**, yang sudah
   mendukung RGBA penuh secara native. Dua pass analisis warna tambahan ini
   murni overhead komputasi (histogram warna + build palet + dither) yang
   TIDAK dibutuhkan sama sekali oleh libwebp. Pada resolusi 512x512 dengan
   banyak frame (mis. 10 detik @15fps = 150 frame), biaya komputasinya cukup
   besar untuk mendorong durasi encode melewati 20 detik pada CPU terbatas
   (VPS/Railway/Replit) — **inilah penyebab utama timeout**: bukan proses
   yang deadlock, melainkan pipeline yang secara struktural boros untuk
   codec ini.
2. libwebp encoder tidak diberi parameter kecepatan eksplisit
   (`-compression_level`), sehingga memakai default ffmpeg yang tidak
   dioptimalkan untuk skenario sticker real-time.
3. **Retry lama mengulang task dengan parameter IDENTIK** setelah timeout.
   Timeout bukan kegagalan transient seperti flaky network — mengulang
   operasi yang sudah terbukti terlalu berat dengan parameter yang sama
   persis nyaris pasti timeout lagi, hanya menggandakan waktu tunggu user
   (2x20 detik = 40 detik) tanpa peluang nyata berhasil.
4. Timeout memakai angka tetap (20000ms) untuk semua kombinasi
   durasi/fps/ukuran, padahal beban kerja riil (jumlah frame yang diproses)
   bisa berbeda jauh antar request.

### Perbaikan yang Diterapkan (di `ffmpegEngine.js`)

| # | Perbaikan | Detail |
|---|-----------|--------|
| A | Filter chain WEBP disederhanakan | scale -> fps -> pad, TANPA palettegen/paletteuse. Warna tetap penuh (RGBA), encode jauh lebih cepat. |
| B | `-compression_level` eksplisit | 3 untuk percobaan pertama (cepat, kualitas wajar), 1 untuk retry (tercepat). |
| C | Retry adaptif, bukan identik | Bila kegagalan sebelumnya FFMPEG_TIMEOUT, retry memakai resolusi & fps yang diturunkan + compression level tercepat — peluang nyata selesai dalam anggaran waktu, bukan mengulang operasi yang sudah terbukti gagal. |
| D | Timeout proporsional beban kerja | estimateTimeout() menghitung anggaran berdasar perkiraan jumlah frame (duration x fps), dibatasi 15-45 detik — bukan angka tetap. |
| E | Child process kill terverifikasi | SIGKILL + verifikasi via event exit, SIGKILL kedua bila proses belum berhenti dalam 1.5 detik (mencegah orphan process yang membebani request lain). |
| F | `-y` dipindah ke posisi semantik yang benar | Output options, bukan input options. |

**Tidak ada perubahan yang hanya menaikkan angka timeout** — seluruh
perbaikan menyasar penyebab struktural (filter chain boros + retry naif),
sesuai instruksi.

---

## 2. FFmpeg Engine Digeneralisasi (Tanpa Duplicate Logic)

`ffmpegEngine.js` sekarang punya SATU mesin eksekusi bersama
(`runTaskWithRetry`) dengan dua profil:
- `execute(task)` — profil `webpSticker` (animated sticker), perilaku &
  signature TIDAK berubah dari sebelumnya (backward compatible penuh
  untuk `videoEngine.js` dan `webpEngine.js`).
- `transcode(task)` — profil `mp4Video` (BARU, dipakai StickerToVideo
  Engine).

Spawn FFmpeg HANYA terjadi di satu tempat (`runOnce()` di dalam
`ffmpegEngine.js`) — diverifikasi lewat audit (grep seluruh
`stickerEngine/*.js`): tidak ada implementasi FFmpeg kedua di mana pun.

---

## 3. StickerToVideo Engine (BARU)

File: `musume/sticker/stickerEngine/stickerToVideo.js` (sebelumnya berisi
teks spesifikasi Part 1-4, sekarang implementasi nyata).

- Bukan pengganti Sticker Engine / sendAsSticker() / createSticker().
- Input: Buffer, path file, atau Readable Stream.
- Pipeline: Input Resolution -> Media Validation (magic bytes) -> Metadata
  Reader (reuse Metadata Engine) -> Animated Detection -> Cache Check ->
  FFmpeg Processing (ffmpegEngine.transcode(), profil mp4) -> Output
  Validation -> Cache Store -> Cleanup -> Return.
- Output: MP4 (H264, yuv420p, +faststart, AAC otomatis bila sumber
  punya audio track).
- Menolak media statis (bukan animasi) dengan StickerEngineError yang
  jelas (UNSUPPORTED_FORMAT).
- Cache berdasar fingerprint konten + mime + parameter target (mencegah
  encode ulang untuk media identik).
- Public API: `stickerToVideo.convert(input, options)`.
- **Sudah diintegrasikan ke command WhatsApp**: `.tovid` (alias
  `.stickertovideo`/`.stovid`/`.s2v`) di `naze.js` — reply sticker
  animasi/gif/video dengan caption `.tovid`, bot mengirim balik hasilnya
  sebagai video MP4 biasa (`{video: buffer, mimetype:'video/mp4'}`, Buffer
  First, tanpa temp file tambahan di level command). Struktur command
  meniru pola command lain di project (react ⏳ -> proses -> react ✅/❌,
  `try/catch` dgn pesan gagal yang jelas).

Perubahan pendukung (aditif, tidak mengubah perilaku lama):
`metadataEngine.js` menambahkan field `hasAudio` pada hasil `read()`
(dipakai StickerToVideo untuk memutuskan penyertaan track AAC).

---

## 4. Sticker Meme Custom (`.smemec`)

File: `musume/sticker/stickerEngine/smemeCustom.js` (sebelumnya berisi teks
spesifikasi Part 1-5, sekarang implementasi nyata).

- Registry 21 parameter: t,b,f,fn,fx,s,sb,sx,sy,pt,pb,pl,pr,ls,lh,a,ml,uc,sa,es,ex,ey.
- Parser registry-based (bukan switch-case panjang), longest-prefix-match
  supaya "fn10" tidak salah kepotong jadi "f"+"n10".
- Validator + normalizer per parameter (range, min, oneOf, boolean, int,
  float, percent, alignment).
- 6 preset siap pakai: classic, modern, anime, compact, outline, large.
- Session runtime (`.smemec` editor) — in-memory per sessionId, TTL 15
  menit, tidak memengaruhi default global maupun user lain.
- Merge prioritas: default (config.js, satu-satunya source of truth) ->
  preset -> session -> parameter command -> config final.
- buildPreviewMetadata() — metadata Preview Editor (grid/ruler/garis
  top-bottom-center/safe-area) dalam persen, bukan pixel.

### Integrasi (tanpa memindahkan tanggung jawab antar Engine)

- `sticker.js`: fungsi BARU `renderSmemeCustom()` — sibling dari
  `renderSmeme()` yang tidak disentuh sama sekali. Satu-satunya
  perbedaan: `context.config` berasal dari `smemeCustom.resolveConfig()`,
  bukan `loadConfig()` polos. Image Engine & Canvas Engine dipanggil
  PERSIS seperti renderSmeme() — keduanya tetap hanya membaca
  context.config apa adanya, tidak tahu (dan tidak perlu tahu) asalnya.
- `smeme.js`: fungsi BARU `smemec()` — sibling dari `smeme()` yang
  tidak disentuh sama sekali.
- `naze.js`: command BARU `.smemec` (+ alias .stickmemec/.stikmemec/
  .stickermemec/.stikermemec), meniru struktur .smeme persis (limit
  check, validasi quoted, try/catch, setLimit, reaksi checkmark/silang).
  Format: `.smemec atas|bawah|parameter` (mis. `.smemec HALO|DUNIA|f42|s8|aleft`).
  `.smeme` asli tidak diubah satu baris pun.

### Preview Editor

- `canvasEngine.js`: fungsi BARU `drawPreviewOverlay()` — HANYA
  digambar bila `context.previewMetadata` diisi eksplisit (tidak pernah
  terjadi pada .smeme/.sticker biasa). Grid, ruler, garis top/bottom/
  center, safe area — seluruhnya koordinat persen. Dibungkus try/catch
  agar kegagalan overlay tidak pernah menggagalkan render sticker utama.

---

## 5. Upgrade Twemoji (`emojiEngine.js`)

- fillText() dihapus untuk rendering emoji — diganti drawImage() memakai
  asset Twemoji (identik di semua platform, tidak lagi bergantung font
  emoji sistem yang bisa berbeda-beda/tidak ada di beberapa OS/container).
- Konversi emoji -> code point -> nama file Twemoji (algoritma standar:
  hex code point digabung tanda hubung, variation selector FE0F dibuang
  kecuali sequence keycap).
- Asset dicari di lokasi lokal (node_modules/twemoji/assets/72x72/, hasil
  `npm install twemoji` — seluruh asset ada di disk lokal setelah
  instalasi, tidak ada fetch internet saat runtime, sesuai aturan "wajib
  berjalan lokal"). `twemoji` ditambahkan ke package.json.
- Fallback wajib: bila asset untuk suatu emoji tidak ditemukan di disk,
  jatuh kembali ke rendering font sistem (perilaku lama) HANYA untuk glyph
  tsb — dicatat lewat logger, tidak pernah membuat pipeline gagal.
- Cache: asset path (emojiAsset, tanpa TTL — asset lokal tidak berubah)
  dan Emoji Layer (emoji, TTL 10 menit) — dua lapis cache terpisah.
- Baseline sejajar: canvasEngine.js (satu-satunya pemanggil Emoji Layer)
  memakai actualBoundingBoxAscent/Descent dari ctx.measureText() saat
  tersedia (font metric asli) untuk memposisikan emoji vertikal, bukan
  rasio hardcode — dengan fallback ke rasio empiris bila backend canvas
  tidak melaporkan metric tsb.
- Public API (render, detect, hasEmoji, stripEmoji, segment) tidak
  berubah signature-nya sama sekali.

Catatan jujur soal keterbatasan sandbox implementasi: asset PNG Twemoji
sungguhan (ribuan file) tidak bisa diverifikasi isinya satu per satu tanpa
akses npm install di lingkungan ini; kode diuji lewat smoke test dengan
paket belum terpasang — fallback graceful terbukti bekerja (log peringatan,
tanpa crash). Setelah `npm install` dijalankan di server produksi, asset
akan otomatis tersedia lokal dan dipakai (drawImage), tanpa perlu ubah kode.

---

## 6. Daftar Seluruh File yang Diubah

| File | Jenis Perubahan |
|------|------------------|
| musume/sticker/stickerEngine/ffmpegEngine.js | Ditulis ulang — perbaikan bug timeout + generalisasi (execute + transcode) |
| musume/sticker/stickerEngine/metadataEngine.js | Aditif — field hasAudio |
| musume/sticker/stickerEngine/emojiEngine.js | Ditulis ulang — upgrade Twemoji |
| musume/sticker/stickerEngine/canvasEngine.js | Field layer.image (menyesuaikan Twemoji) + baseline metric asli + drawPreviewOverlay() (aditif) |
| musume/sticker/stickerEngine/index.js | Aditif — export stickerToVideo, smemeCustom |
| musume/sticker/sticker.js | Aditif — renderSmemeCustom() (sibling renderSmeme(), tidak disentuh) |
| musume/sticker/smeme.js | Aditif — smemec() (sibling smeme(), tidak disentuh) |
| naze.js | Aditif — command .smemec + .tovid + import smemec/stickerToVideo |
| package.json | Aditif — dependency twemoji |

## 7. Daftar File Baru (Implementasi, Menggantikan Teks Spesifikasi)

| File | Isi |
|------|-----|
| musume/sticker/stickerEngine/stickerToVideo.js | StickerToVideo Engine — implementasi penuh (sebelumnya teks spesifikasi Part 1-4) |
| musume/sticker/stickerEngine/smemeCustom.js | Sticker Meme Custom — implementasi penuh (sebelumnya teks spesifikasi Part 1-5) |
| musume/sticker/BUGFIX_AND_UPGRADE_REPORT.md | Laporan ini |

---

## 8. Hasil Audit Akhir

Audit dilakukan pada seluruh file yang diubah/terpengaruh (bukan seluruh
project — sesuai instruksi):

- Lulus `node --check` di seluruh file musume/sticker/**/*.js (termasuk
  file yang tidak disentuh sesi ini, sebagai gerbang akhir).
- Dependency graph diverifikasi terprogram: DAG murni, tidak ada
  Circular Dependency (termasuk edge baru dari stickerToVideo.js dan
  smemeCustom.js).
- Tidak ada implementasi FFmpeg kedua — fluent-ffmpeg hanya di-spawn
  untuk encode di satu tempat (ffmpegEngine.js); metadataEngine.js
  hanya memakai ffmpeg.ffprobe() (read-only, bukan encode, tidak berubah).
- Unused import ditemukan & diperbaiki (StickerEngineError, ERROR_CODES
  pada emojiEngine.js versi Twemoji baru — dihapus, bukan dipaksakan dipakai).
- textEngine.js (sudah dimodifikasi sebelumnya di luar sesi ini, tidak
  disentuh) diverifikasi tetap mengembalikan bentuk object yang identik
  (lines, fontSize, lineHeight, stroke, padding, position, fill, shadow,
  fontFamily, fontWeight) — kompatibel penuh dengan perubahan canvasEngine.js.
- Smoke test end-to-end (stub lokal, tanpa internet) — 12 skenario lulus:
  regresi .sticker statis, regresi .sticker animasi (mesin FFmpeg yang
  sudah diperbaiki), regresi .smeme (utuh, tidak berubah), parser/validator/
  normalizer smemeCustom, penanganan parameter tidak valid, preset,
  renderSmemeCustom + preview overlay, StickerToVideo (WEBP->MP4,
  GIF->MP4, penolakan media statis), Twemoji dengan fallback graceful, dan
  ffmpegEngine.transcode() langsung.
- Resource cleanup diverifikasi: tidak ada temp file bocor pada seluruh
  skenario di atas (termasuk skenario StickerToVideo yang menulis file
  MP4 sementara).
- Seluruh Engine baru/berubah memakai createLogger, StickerEngineError,
  ERROR_CODES, dan Cache Engine sesuai konvensi yang sudah ada — tidak ada
  console.log liar, tidak ada error mentah (raw string/Error biasa).

API publik yang TIDAK berubah (diverifikasi eksplisit): smeme(),
renderSmeme(), createSticker(), sendAsSticker(), imageToWebp(),
videoToWebp(), gifToWebp(), writeExif(), ffmpegEngine.execute(),
seluruh command lama (.sticker, .stiker, .s, .stickergif, .sgif,
.stickerwm, .swm, .wm, .curi, .colong, .take, .stickergifwm,
.sgifwm, .smeme, .stickmeme, .stikmeme, .stickermeme, .stikermeme).
