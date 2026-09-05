# Sticker Engine V2 — Laporan Migrasi & Audit

Status: **SELESAI**. Dokumen ini merangkum implementasi, keputusan desain,
serta hasil audit sebelum serah terima.

Source of truth yang diikuti:
- `musume/sticker/STICKER_UPGRADE.md`
- `musume/sticker/ARCHITECTURE.md`
- `musume/sticker/ENGINE_API.md`

---

## 1. Struktur Akhir

```
musume/sticker/
├── ARCHITECTURE.md            (tidak diubah — source of truth)
├── ENGINE_API.md               (tidak diubah — source of truth)
├── STICKER_UPGRADE.md          (tidak diubah — source of truth)
├── MIGRATION_REPORT.md         (dokumen ini)
├── stickermeme.json            (diperbaiki: bug path font + tambahan section V2)
├── sticker.js                  (BARU — orchestrator/Sticker Engine publik)
├── smeme.js                    (DITULIS ULANG — thin wrapper, kontrak publik sama persis)
├── fonts/                      (tidak diubah)
└── stickerEngine/               (BARU — seluruh Engine)
    ├── index.js                 (registry/barrel)
    ├── constants.js              (konstanta, Performance Target, error code, StickerEngineError)
    ├── config.js                 (loader stickermeme.json + default aman)
    ├── canvasLib.js               (helper internal: loader @napi-rs/canvas dgn fallback ke canvas)
    ├── cacheEngine.js
    ├── tempEngine.js
    ├── cleanupEngine.js
    ├── fontEngine.js
    ├── metadataEngine.js
    ├── mediaEngine.js
    ├── imageEngine.js
    ├── textEngine.js
    ├── emojiEngine.js
    ├── canvasEngine.js
    ├── ffmpegEngine.js
    ├── videoEngine.js
    ├── webpEngine.js
    ├── exifEngine.js
    ├── workerEngine.js
    └── workerScript.js

lib/exif.js        — DITULIS ULANG sbg compatibility shim ke Sticker Engine V2
src/message.js      — sendAsSticker() dipindah ke pipeline Buffer First (createSticker)
package.json         — tambah dependency eksplisit "sharp" (sebelumnya hanya transitive/optional lewat baileys)
```

Seluruh 15 Engine pada ENGINE_API.md sudah diimplementasikan dengan Public API
persis seperti yang didokumentasikan (`process`, `read`, `render`, `layout`,
`register/get/validate`, `get/set/delete/clear/cleanup`, `encode`, `inject`,
`execute`, `run/terminate/broadcast`, `create/remove/exists/cleanup`).

## 2. Pipeline yang Berjalan

```
Sticker Engine (sticker.js)
  -> Media Engine (+ Metadata Engine di dalamnya)
  -> passthrough jika mime sudah image/webp (lihat §4)
  -> Video Engine -> FFmpeg Engine        [jalur animasi: gif/webp-animasi/video]
     ATAU
     Image Engine -> WebP Engine          [jalur statis]
  -> [Canvas Engine, HANYA utk .smeme, sebelum WebP Engine]
  -> Exif Engine
  -> Cleanup Engine (SELALU, lewat finally)
```

`createSticker(input, options)` = pipeline lengkap (dipakai seluruh command
sticker lewat `naze.sendAsSticker`).
`renderSmeme(imageBuffer, top, bottom, options)` = Image Engine + Canvas Engine
saja (mengembalikan PNG); WebP+Exif tetap lewat `createSticker` yang sudah
dipanggil `naze.sendAsSticker` — persis alur `.smeme` versi lama, sehingga
tidak ada Duplicate Encoding.

## 3. Kompatibilitas Command (tidak ada yang berubah)

Command berikut TIDAK mengalami perubahan kode di `naze.js` sama sekali —
hanya implementasi *di belakang* `smeme()` dan `naze.sendAsSticker()` yang
bermigrasi ke Sticker Engine V2:

`.sticker` `.stiker` `.s` `.stickergif` `.stikergif` `.sgif` `.stickerwm`
`.swm` `.wm` `.curi` `.colong` `.take` `.stickergifwm` `.sgifwm`
`.smeme` `.stickmeme` `.stikmeme` `.stickermeme` `.stikermeme`

`.emojimix` tetap berfungsi (memakai `sendAsSticker` dgn URL hasil API
emoji-kitchen eksternal miliknya sendiri — di luar cakupan Sticker Engine,
lihat §6).

## 4. Keputusan Desain Penting (saat dokumentasi ambigu)

1. **Passthrough WEBP**: input yang mime asli-nya sudah `image/webp` (mis.
   membalas sticker utk `.take`/`.curi`/`.colong`) TIDAK di-resize/re-encode
   ulang — persis perilaku `lib/exif.js` lama. Mencegah Duplicate Encoding &
   degradasi kualitas dari re-encode yang tidak perlu.
2. **Emoji Engine memakai library canvas langsung** (bukan Canvas Engine)
   karena Canvas Engine sudah bergantung ke Emoji Engine — memilih arah
   sebaliknya akan membentuk Circular Dependency. ARCHITECTURE.md sendiri
   mengizinkan ini ("Canvas Engine ATAU Library Emoji Renderer").
3. **Text Engine mengukur teks lewat canvasLib.js** (bukan Canvas Engine),
   dengan alasan yang sama seperti poin 2.
4. **Video Engine tidak memanggil FFmpeg Engine secara langsung** — Video
   Engine hanya menyiapkan `task` (validasi durasi/resolusi/fps, cepat,
   sesuai Performance Target <100ms), lalu Sticker Engine (orchestrator)
   yang menjalankan `ffmpegEngine.execute(task)` sebagai tahap Pipeline
   berikutnya. Ini konsisten dengan perbedaan tajam Performance Target
   Video Engine (<100ms) vs FFmpeg Engine (500-2500ms).
5. **WebP Engine dilewati pada jalur animasi** karena FFmpeg Engine sudah
   menghasilkan WEBP final dalam satu pass (scale+pad+fps+palette+encode) —
   memanggil WebP Engine lagi akan jadi Duplicate Encoding. Kapabilitas
   `webpEngine.encodeAnimated()` tetap ada & berfungsi penuh (didelegasikan
   ke FFmpeg Engine) untuk pemakaian langsung di masa depan.
6. **Dimensi disatukan ke 512×512** (STICKER_LIMITS.maxDimension) di seluruh
   jalur (`.sticker` polos, gif, video) — implementasi lama memakai 512/500/320
   yang tidak konsisten antar fungsi; ini diperbaiki mengikuti stickermeme.json
   (`image.maxWidth/maxHeight: 512`) sbg acuan.
7. **Worker Engine nyata & berfungsi** (worker_threads sungguhan, sudah diuji
   end-to-end), namun **nonaktif secara default** (`stickermeme.json` ->
   `worker.enabled:false`) karena perilaku native addon (Sharp/Canvas) di
   dalam worker thread bervariasi antar environment deployment dan tidak bisa
   diverifikasi menyeluruh pada sandbox implementasi ini (tanpa registry npm).
   Fitur TIDAK dikurangi — seluruh Public API (`run/terminate/broadcast`)
   tersedia & bekerja bila diaktifkan secara eksplisit lewat config.
8. **Emoji rendering 100% lokal** — hanya memakai font emoji berwarna bila
   tersedia di sistem (mis. paket `Noto Color Emoji`); tidak ada pengunduhan
   aset emoji dari internet dalam bentuk apa pun (`emoji-regex`, sudah jadi
   dependency proyek, dipakai utk deteksi/segmentasi teks — 100% offline).

## 5. Bug Diperbaiki

| # | Bug | Lokasi Lama | Perbaikan |
|---|-----|-------------|-----------|
| 1 | `font.file` menunjuk `ImpactRegular.ttf`, file asli `.otf` | `stickermeme.json` | Path diperbaiki ke `.otf` |
| 2 | Resource leak: `pathMedia` tidak dihapus bila `writeExif` gagal (di luar try/finally) | `src/message.js` `sendAsSticker` | Dipindah ke dalam try/finally penuh |
| 3 | `sharp` hanya *optional peer dependency* transitif lewat `baileys`, tidak dideklarasikan eksplisit | `package.json` | Ditambahkan sbg dependency langsung (`^0.35.2`, versi yg sudah ter-lock) |
| 4 | Dimensi tidak konsisten (512/500/320) antar image/gif/video | `lib/exif.js` | Disatukan 512 di seluruh Engine |
| 5 | Static image di-convert lewat ffmpeg (lambat) padahal Sharp native mendukung | `lib/exif.js` `imageToWebp` | Image Engine (Sharp) dipakai utk jalur statis — jauh lebih cepat |
| 6 | `worker.unref()` pada Worker Engine berisiko proses keluar sebelum task worker selesai | ditemukan saat pengujian implementasi baru | Dihapus; worker tetap "ref" selama pool aktif |
| 7 | Key `wrf: {}` (sisa rest-spread) ikut masuk ke JSON EXIF | `lib/exif.js` `writeExif` | Tidak direplikasi pada `exifEngine.js` (JSON EXIF lebih bersih, tanpa mengubah field yg dipakai WhatsApp) |

## 6. Di Luar Cakupan (sengaja tidak disentuh)

- `.emojimix` (Emoji Kitchen API eksternal) — bukan bagian dari Sticker
  Engine V2 yang didokumentasikan, dan secara inheren butuh sumber gambar
  dari API pihak ketiga; tidak diminta utk diubah/dihapus.
- `naze.sendMedia()` (`src/message.js`) — tetap memakai `writeExif()` dari
  `lib/exif.js` (kontrak path file dipertahankan) krn butuh path utk
  `{url: path}` pada Baileys; secara internal SUDAH memakai Sticker Engine V2.
- `index.js` shutdown handler — tidak diberi hook `workerEngine.terminate()`
  krn Worker Engine nonaktif secara default; dicatat di sini sbg catatan bila
  suatu saat diaktifkan permanen.
- File `ARCHITECTURE.md` di root project (bukan `musume/sticker/`) — dokumen
  arsitektur umum bot, tidak berkaitan dgn Sticker Engine.

## 7. Pengujian yang Dilakukan

Karena sandbox implementasi tidak memiliki akses registry npm (offline),
seluruh dependency eksternal (`sharp`, `@napi-rs/canvas`, `fluent-ffmpeg`,
`file-type`, `node-webpmux`, `emoji-regex`) disimulasikan lewat stub lokal
untuk menjalankan (bukan sekadar `node --check`) seluruh pipeline end-to-end:

- ✅ Jalur statis penuh: Media→Metadata→Image→WebP→Exif→Cleanup
- ✅ Jalur animasi penuh: Media→Metadata→Video→FFmpeg→Exif→Cleanup (termasuk retry 1x pada kegagalan simulasi)
- ✅ Passthrough WEBP
- ✅ `renderSmeme` (Image+Canvas+Text+Font+Emoji, termasuk teks+emoji campur)
- ✅ Alur `.smeme` penuh (`renderSmeme` -> `createSticker`)
- ✅ Worker Engine (`run`/`terminate`) end-to-end nyata lewat `worker_threads`
- ✅ Error handling terstruktur (`StickerEngineError` dgn `code`/`engine`) utk buffer kosong, tipe input tidak valid, path tidak ditemukan
- ✅ Cleanup selalu berjalan & tidak ada temp file bocor — diverifikasi baik pada skenario sukses maupun gagal (termasuk setelah 2x percobaan FFmpeg gagal)
- ✅ Cache tidak menyebabkan kebocoran data antar request berbeda (packname/author berbeda -> EXIF berbeda, walau body WEBP di-cache)
- ✅ Dependency graph diverifikasi terprogram: **DAG murni, tanpa Circular Dependency**, cocok dgn seluruh aturan Dependency di ARCHITECTURE.md
- ✅ `node --check` (syntax) lulus di seluruh file baru/diubah

Seluruh file test & stub dependency SUDAH dihapus dari deliverable akhir
(hanya dipakai utk verifikasi selama pengerjaan).

## 8. Catatan Deployment

- `package-lock.json` **perlu di-regenerate** (`npm install`) sekali setelah
  deploy, karena ditambahkan dependency eksplisit `sharp` pada
  `package.json` (sebelumnya sudah resolve scr transitive, jadi ini hanya
  membuatnya eksplisit & tidak rapuh — tidak ada breaking change).
- Tidak ada dependency baru yang ditambahkan di luar itu — seluruh Engine
  memakai package yang SUDAH ada di `package.json`/`package-lock.json`
  (`sharp`, `@napi-rs/canvas`, `fluent-ffmpeg`, `file-type`, `node-webpmux`,
  `emoji-regex`).
- Seluruh proses berjalan lokal (Sharp/Canvas/FFmpeg), tanpa API internet.
