# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 1 — Core Architecture

> Status : Technical Design Document
>
> Dokumen ini menjelaskan arsitektur teknis Sticker Engine V2.
>
> Berbeda dengan `STICKER_UPGRADE.md` yang berisi tujuan, roadmap, dan proses migrasi, dokumen ini berfokus pada bagaimana seluruh Engine bekerja secara internal.
>
> Seluruh implementasi Sticker V2 wajib mengikuti arsitektur yang dijelaskan pada dokumen ini.

---

# 1. Tujuan Architecture

Architecture ini dibuat agar seluruh sistem Sticker memiliki struktur yang konsisten.

Target utamanya bukan hanya membuat fitur Sticker bekerja.

Namun memastikan seluruh Engine dapat berkembang selama bertahun-tahun tanpa perlu dilakukan Refactor besar kembali.

Architecture ini menjadi acuan utama seluruh Engine.

Seluruh implementasi wajib mengikuti standar yang terdapat di dalam dokumen ini.

---

# 2. Filosofi Architecture

Sticker Engine V2 dibangun berdasarkan beberapa prinsip utama.

## Modular

Seluruh proses dipisahkan menjadi Engine kecil.

Setiap Engine hanya memiliki satu tanggung jawab.

Semakin kecil tanggung jawab Engine.

Semakin mudah proses maintenance.

---

## Independent

Engine tidak boleh saling bergantung secara langsung.

Engine hanya mengetahui tugasnya sendiri.

Seluruh komunikasi dilakukan melalui Sticker Engine.

Dengan demikian perubahan pada satu Engine tidak memengaruhi Engine lainnya.

---

## Reusable

Engine harus dapat digunakan kembali.

Sebagai contoh.

Text Engine.

Tidak hanya digunakan oleh Smeme.

Namun dapat digunakan kembali oleh.

- Quote Sticker.
- Welcome Card.
- Rank Card.
- Banner Generator.
- Thumbnail Generator.
- Dan fitur lain yang membutuhkan rendering teks.

---

## Buffer First

Buffer merupakan prioritas utama.

Seluruh proses wajib menggunakan Buffer apabila memungkinkan.

Temporary File hanya dibuat apabila benar-benar diperlukan.

Pendekatan ini dipilih untuk mengurangi I/O Storage dan meningkatkan performa.

---

## Zero Leak

Seluruh Engine wajib kembali ke kondisi bersih setelah selesai digunakan.

Tidak boleh ada.

- Buffer tertinggal.
- Worker tertinggal.
- Temporary File tertinggal.
- Cache liar.
- Process yang masih berjalan.

---

# 3. Struktur Folder

Target struktur akhir Sticker Engine.

```
sticker/
│
├── sticker.js
├── smeme.js
├── stickermeme.json
├── ARCHITECTURE.md
├── STICKER_UPGRADE.md
│
├── fonts/
│
└── stickerEngine/
    │
    ├── index.js
    │
    ├── imageEngine.js
    ├── videoEngine.js
    ├── mediaEngine.js
    ├── metadataEngine.js
    │
    ├── canvasEngine.js
    ├── textEngine.js
    ├── fontEngine.js
    ├── emojiEngine.js
    │
    ├── webpEngine.js
    ├── exifEngine.js
    ├── ffmpegEngine.js
    │
    ├── cacheEngine.js
    ├── tempEngine.js
    ├── cleanupEngine.js
    └── workerEngine.js
```

Seluruh Engine berada pada satu folder agar mudah ditemukan.

---

# 4. Core Layer

Sticker Engine dibagi menjadi beberapa Layer.

```
Command Layer

↓

Sticker Layer

↓

Processing Layer

↓

Output Layer
```

Setiap Layer memiliki tanggung jawab masing-masing.

---

## Command Layer

Layer ini menerima request dari command.

Contohnya.

```
.sticker

.smeme

.take

.qc
```

Layer ini tidak melakukan rendering.

Layer ini hanya meneruskan request menuju Sticker Engine.

---

## Sticker Layer

Layer ini diwakili oleh.

```
sticker.js
```

Sticker Layer bertugas.

- Validasi awal.
- Menentukan jenis media.
- Menentukan Pipeline.
- Memanggil Engine.
- Mengembalikan hasil akhir.

Sticker Layer tidak melakukan pekerjaan berat.

---

## Processing Layer

Layer ini merupakan kumpulan seluruh Engine.

Contohnya.

- Image Engine.
- Video Engine.
- Canvas Engine.
- Text Engine.
- FFmpeg Engine.
- WebP Engine.

Seluruh pekerjaan berat dilakukan pada Layer ini.

---

## Output Layer

Layer terakhir bertanggung jawab menghasilkan.

- Sticker Buffer.
- PNG Buffer.
- WEBP Buffer.

Kemudian hasil tersebut dikembalikan menuju command.

---

# 5. Engine Communication

Seluruh Engine tidak diperbolehkan saling memanggil secara langsung.

Contoh yang tidak diperbolehkan.

```
Image Engine

↓

FFmpeg Engine

↓

Cleanup Engine
```

Sebaliknya.

Seluruh komunikasi harus melalui Sticker Engine.

```
Sticker.js

↓

Image Engine

↓

Sticker.js

↓

Cleanup Engine
```

Pendekatan ini membuat alur komunikasi menjadi jauh lebih mudah dipahami.

---

# 6. Dependency Rule

Setiap Engine memiliki Dependency seminimal mungkin.

Contohnya.

Text Engine.

↓

Tidak boleh mengimpor FFmpeg.

Canvas Engine.

↓

Tidak boleh mengimpor Metadata Engine.

Image Engine.

↓

Tidak boleh mengimpor Emoji Engine.

Semakin sedikit Dependency.

Semakin mudah Engine dipelihara.

---

# 7. Import Rule

Import hanya dilakukan apabila benar-benar diperlukan.

Engine tidak diperbolehkan mengimpor seluruh Engine sekaligus.

Contohnya.

Image Engine.

↓

Hanya mengimpor Sharp.

Canvas Engine.

↓

Hanya mengimpor Canvas.

Cache Engine.

↓

Tidak boleh mengimpor FFmpeg.

Dengan demikian Startup Time menjadi lebih cepat.

---

# 8. Export Rule

Seluruh Engine hanya boleh melakukan Export terhadap Public Function.

Helper Internal tidak boleh diekspor.

Contohnya.

```
Engine

↓

Internal Helper

↓

Private
```

Sedangkan.

```
Engine

↓

createSticker()

↓

Public
```

Pendekatan ini menjaga agar API Engine tetap kecil dan mudah dipelajari.

---

# 9. Lifecycle Engine

Seluruh Engine memiliki Lifecycle yang sama.

```
Receive

↓

Validate

↓

Process

↓

Return

↓

Cleanup
```

Tidak diperbolehkan melewati salah satu tahap tersebut.

Setiap Engine wajib menyelesaikan seluruh Lifecycle sebelum mengembalikan hasil.

---

# 10. Prinsip Pengembangan

Seluruh Engine baru wajib mengikuti prinsip berikut.

- Tidak melakukan duplikasi kode.
- Tidak mengubah Engine lain tanpa alasan.
- Tidak menambah Dependency apabila masih dapat menggunakan Engine yang ada.
- Tidak membuat Utility baru apabila fungsi tersebut sudah dimiliki Engine lain.
- Selalu mengutamakan performa.
- Selalu mengutamakan stabilitas.
- Selalu mengutamakan kompatibilitas.

---

# 11. Target Architecture

Architecture Sticker Engine V2 ditargetkan mampu menjadi fondasi bagi seluruh fitur Sticker di masa mendatang.

Dengan Architecture ini diharapkan penambahan fitur baru hanya memerlukan Engine baru tanpa mengubah struktur utama yang telah dibangun.

---

# Penutup Part 1

Part berikutnya akan mulai membahas spesifikasi teknis setiap Engine secara rinci.

Mulai dari Input, Output, Return Type, Dependency, Lifecycle, Error Handling, hingga hubungan masing-masing Engine dengan Sticker Engine sehingga implementasi dapat dilakukan secara konsisten pada seluruh modul.


# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 2A — Core Engine Specification

> Status : Technical Engine Specification
>
> Part ini menjelaskan spesifikasi teknis Engine utama yang menjadi fondasi seluruh Sticker Engine V2.
>
> Seluruh Engine pada part ini merupakan Core Engine yang hampir selalu digunakan pada setiap proses pembuatan Sticker.

---

# 1. Media Engine

## Tujuan

Media Engine merupakan gerbang pertama seluruh media yang masuk ke Sticker Engine.

Engine ini bertugas melakukan identifikasi media sebelum media diproses oleh Engine lainnya.

Media Engine tidak melakukan rendering.

Media Engine hanya bertugas menentukan jenis media serta Pipeline yang akan digunakan.

---

## Tanggung Jawab

Media Engine bertanggung jawab terhadap.

- Identifikasi media.
- Validasi MIME.
- Deteksi Image.
- Deteksi Video.
- Deteksi Animated WebP.
- Deteksi Sticker.
- Menentukan Pipeline.

---

## Input

Media Engine menerima.

```
Buffer

atau

Quoted Message

atau

Media Object
```

---

## Output

Media Engine mengembalikan.

```
{
    type,
    mime,
    animated,
    pipeline,
    buffer
}
```

Output ini digunakan oleh Sticker Engine untuk menentukan Engine berikutnya.

---

## Dependency

Media Engine hanya diperbolehkan menggunakan.

- Metadata Engine.

Media Engine tidak boleh melakukan import.

- Canvas Engine.
- FFmpeg Engine.
- Emoji Engine.

---

## Lifecycle

```
Receive

↓

Validate

↓

Detect

↓

Pipeline Selection

↓

Return
```

---

# 2. Metadata Engine

## Tujuan

Metadata Engine bertugas membaca seluruh informasi media.

Seluruh metadata hanya boleh dibaca satu kali.

Engine lain tidak diperbolehkan membaca metadata kembali.

---

## Informasi Yang Dibaca

Metadata Engine membaca.

- Width.
- Height.
- Format.
- MIME.
- Orientation.
- Alpha.
- Duration.
- FPS.
- Frame Count.
- File Size.

---

## Input

```
Buffer
```

---

## Output

```
{
    width,
    height,
    format,
    mime,
    orientation,
    animated,
    duration,
    fps,
    frames
}
```

---

## Dependency

Metadata Engine hanya menggunakan.

- Sharp.

atau.

- FFprobe.

Apabila media berupa video.

---

## Lifecycle

```
Buffer

↓

Read Metadata

↓

Normalize

↓

Return Metadata
```

---

# 3. Image Engine

## Tujuan

Image Engine merupakan pusat seluruh proses pengolahan gambar.

Engine ini bertanggung jawab menyiapkan gambar sebelum memasuki proses rendering.

---

## Tanggung Jawab

Image Engine menangani.

- Resize.
- Crop.
- Rotate.
- Flip.
- Normalisasi ukuran.
- Konversi format.
- Optimasi Sharp.

---

## Input

```
Image Buffer

+

Metadata
```

---

## Output

```
Optimized Image Buffer
```

---

## Dependency

Image Engine hanya diperbolehkan menggunakan.

- Sharp.

Image Engine tidak boleh mengetahui.

- Canvas.
- Emoji.
- Font.
- WebP.

---

## Lifecycle

```
Buffer

↓

Resize

↓

Normalize

↓

Optimize

↓

Return
```

---

# 4. Video Engine

## Tujuan

Video Engine bertanggung jawab terhadap seluruh media bergerak.

Engine ini tidak melakukan konversi Sticker.

Video Engine hanya menyiapkan Video agar siap diproses FFmpeg.

---

## Tanggung Jawab

Video Engine menangani.

- Validasi Video.
- FPS.
- Duration.
- Resize.
- Frame Selection.
- Pipeline Preparation.

---

## Input

```
Video Buffer

+

Metadata
```

---

## Output

```
Prepared Video Buffer
```

atau.

```
Video Task
```

Apabila proses akan diteruskan menuju Worker.

---

## Dependency

Video Engine hanya diperbolehkan menggunakan.

- Metadata Engine.
- FFmpeg Engine.

Video Engine tidak boleh mengimpor.

- Canvas Engine.
- Emoji Engine.

---

## Lifecycle

```
Receive

↓

Validate

↓

Prepare

↓

Return
```

---

# 5. Canvas Engine

## Tujuan

Canvas Engine merupakan pusat seluruh proses rendering.

Engine ini bertanggung jawab menggambar.

- Image.
- Text.
- Emoji.
- Overlay.

Canvas Engine tidak melakukan resize.

Canvas Engine tidak membaca metadata.

Canvas Engine hanya melakukan rendering.

---

## Tanggung Jawab

Canvas Engine menangani.

- Draw Image.
- Draw Text.
- Draw Emoji.
- Draw Layer.
- Export PNG.

---

## Input

Canvas Engine menerima.

```
Optimized Image

+

Render Instruction
```

---

## Output

```
PNG Buffer
```

---

## Dependency

Canvas Engine hanya diperbolehkan menggunakan.

- Font Engine.
- Text Engine.
- Emoji Engine.

Canvas Engine tidak boleh menggunakan.

- Sharp.
- FFmpeg.
- Metadata.

---

## Lifecycle

```
Canvas

↓

Render

↓

PNG Buffer

↓

Return
```

---

# 6. Hubungan Antar Engine

Urutan kerja Core Engine.

```
Media Engine

↓

Metadata Engine

↓

Image Engine

↓

Canvas Engine

↓

Sticker Engine
```

Apabila media berupa Video.

```
Media Engine

↓

Metadata Engine

↓

Video Engine

↓

FFmpeg Engine

↓

Sticker Engine
```

Dengan pendekatan ini setiap Engine hanya memahami pekerjaannya sendiri tanpa mengetahui bagaimana Engine lain bekerja.

---

# Penutup Part 2A

Part berikutnya akan membahas Engine lanjutan yang bertugas menangani rendering teks, registrasi font, emoji Unicode, cache, WebP, Exif, FFmpeg, Worker Thread, hingga Cleanup Engine yang menjadi fondasi utama performa Sticker Engine V2.

# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 2B — Advanced Engine Specification

> Status : Technical Engine Specification
>
> Part ini menjelaskan spesifikasi teknis Engine lanjutan yang bertanggung jawab terhadap rendering teks, font, emoji, cache, hingga proses akhir pembuatan Sticker.

---

# 1. Text Engine

## Tujuan

Text Engine bertanggung jawab terhadap seluruh proses pengolahan teks sebelum dilakukan rendering ke Canvas.

Engine ini merupakan pusat seluruh algoritma teks.

Seluruh fitur yang membutuhkan teks wajib menggunakan Engine ini.

---

## Tanggung Jawab

Text Engine menangani.

- Smart Wrap.
- Smart Font Size.
- Dynamic Line Height.
- Dynamic Stroke.
- Dynamic Padding.
- Smart Alignment.
- Smart Position.
- Break Long Word.
- Text Normalization.

---

## Input

```
{
    text,
    canvasWidth,
    canvasHeight,
    config
}
```

---

## Output

```
{
    lines,
    fontSize,
    stroke,
    padding,
    lineHeight,
    position
}
```

---

## Dependency

Text Engine hanya diperbolehkan menggunakan.

- Font Engine.

Text Engine tidak boleh mengimpor.

- Sharp.
- Canvas.
- FFmpeg.
- WebP.

---

## Lifecycle

```
Receive

↓

Normalize

↓

Wrap

↓

Calculate Font

↓

Calculate Layout

↓

Return
```

---

# 2. Font Engine

## Tujuan

Font Engine bertanggung jawab terhadap seluruh proses registrasi dan pengelolaan font.

Registrasi font hanya boleh dilakukan satu kali selama aplikasi berjalan.

---

## Tanggung Jawab

Font Engine menangani.

- Register Font.
- Font Validation.
- Font Cache.
- Font Fallback.
- Font Family.
- Font Weight.
- Font Style.

---

## Input

```
Font Configuration
```

---

## Output

```
Registered Font Object
```

---

## Dependency

Font Engine hanya diperbolehkan menggunakan library Canvas.

---

## Lifecycle

```
Initialize

↓

Register

↓

Cache

↓

Return
```

---

# 3. Emoji Engine

## Tujuan

Emoji Engine bertanggung jawab terhadap seluruh proses rendering Emoji Unicode.

Engine ini hanya dijalankan apabila teks mengandung Emoji.

---

## Tanggung Jawab

Emoji Engine menangani.

- Emoji Detection.
- Unicode Parsing.
- Emoji Rendering.
- Emoji Cache.
- Emoji Position.
- Emoji Fallback.

---

## Input

```
Text

+

Render Instruction
```

---

## Output

```
Emoji Layer
```

---

## Dependency

Emoji Engine hanya diperbolehkan menggunakan.

- Canvas Engine.

atau.

Library Emoji Renderer.

---

## Lifecycle

```
Detect

↓

Parse

↓

Render

↓

Return
```

---

# 4. Cache Engine

## Tujuan

Cache Engine merupakan pusat seluruh cache Sticker.

Tidak diperbolehkan membuat cache baru di luar Engine ini.

---

## Jenis Cache

Cache Engine menangani.

- Font Cache.
- Metadata Cache.
- Measure Cache.
- Render Cache.
- Emoji Cache.
- Image Cache.
- WebP Cache.

---

## Input

```
Cache Key

+

Data
```

---

## Output

```
Cached Data
```

atau.

```
Cache Miss
```

---

## Dependency

Cache Engine tidak memiliki dependency terhadap Engine lain.

---

## Lifecycle

```
Lookup

↓

Hit ?

↓

Return

↓

Miss

↓

Store

↓

Return
```

---

# 5. WebP Engine

## Tujuan

WebP Engine bertanggung jawab terhadap seluruh proses konversi menuju format Sticker.

---

## Tanggung Jawab

- Static Sticker.
- Animated Sticker.
- Quality.
- Compression.
- Encoding.

---

## Input

```
PNG Buffer

atau

Video Task
```

---

## Output

```
WEBP Buffer
```

---

## Dependency

WebP Engine hanya diperbolehkan menggunakan.

- FFmpeg.

atau.

Encoder WebP.

---

## Lifecycle

```
Receive

↓

Encode

↓

Optimize

↓

Return
```

---

# 6. Exif Engine

## Tujuan

Exif Engine bertanggung jawab menambahkan metadata Sticker.

---

## Metadata

Engine ini menangani.

- Packname.
- Author.
- Categories.
- WhatsApp Sticker Metadata.

---

## Input

```
WEBP Buffer

+

Metadata
```

---

## Output

```
Sticker Buffer
```

---

## Lifecycle

```
Receive

↓

Inject Metadata

↓

Return
```

---

# 7. FFmpeg Engine

## Tujuan

FFmpeg Engine menjadi pusat seluruh proses Video.

Semua proses FFmpeg wajib melalui Engine ini.

---

## Tanggung Jawab

Engine menangani.

- Animated Sticker.
- GIF.
- Video Sticker.
- Video Resize.
- Drawtext.
- FPS.
- Duration.
- Filter.
- Timeout.
- Kill Process.

---

## Input

```
Video Buffer

+

Task
```

---

## Output

```
WEBP Buffer

atau

PNG Sequence
```

---

## Dependency

FFmpeg Engine tidak boleh mengetahui.

- Canvas.
- Font.
- Emoji.

---

## Lifecycle

```
Receive

↓

Spawn Process

↓

Monitor

↓

Finish

↓

Cleanup

↓

Return
```

---

# 8. Worker Engine

## Tujuan

Worker Engine bertugas menjalankan pekerjaan berat pada Worker Thread.

---

## Tanggung Jawab

Worker Engine digunakan untuk.

- Video.
- Animated Sticker.
- Batch Rendering.
- Emoji Rendering besar.
- Rendering kompleks.

---

## Input

```
Worker Task
```

---

## Output

```
Task Result
```

---

## Lifecycle

```
Create Worker

↓

Execute

↓

Return

↓

Terminate
```

---

# 9. Cleanup Engine

## Tujuan

Cleanup Engine bertanggung jawab mengembalikan seluruh sistem ke kondisi bersih setelah proses selesai.

---

## Tanggung Jawab

Cleanup Engine menangani.

- Temporary File.
- Worker.
- Cache Sementara.
- Process.
- Resource.

---

## Input

```
Cleanup Task
```

---

## Output

```
Completed
```

---

## Lifecycle

```
Receive

↓

Delete

↓

Verify

↓

Return
```

---

# 10. Hubungan Engine Lanjutan

Diagram hubungan seluruh Engine.

```
Sticker.js

↓

Media Engine

↓

Metadata Engine

↓

───────────────
│             │
│             │
▼             ▼

Image       Video

│             │

▼             ▼

Canvas     FFmpeg

│             │

▼             ▼

Text       WebP

│

▼

Font

│

▼

Emoji (Opsional)

│

▼

WebP

│

▼

Exif

│

▼

Cleanup

│

▼

Sticker Buffer
```

Seluruh Engine hanya mengetahui tugasnya masing-masing.

Tidak ada Engine yang boleh mengambil alih tanggung jawab Engine lain.

---

# 11. Technical Rule

Seluruh Engine wajib memenuhi aturan berikut.

- Satu Engine hanya memiliki satu tanggung jawab utama.
- Tidak boleh terjadi Circular Dependency.
- Tidak boleh terjadi Import berantai.
- Seluruh Engine harus mendukung Promise.
- Seluruh Engine wajib menggunakan Error Handling.
- Seluruh Engine wajib mendukung Cleanup.
- Seluruh Engine wajib mengembalikan Return Type yang konsisten.
- Seluruh Engine harus dapat diuji secara terpisah.

---

# Penutup Part 2B

Dengan selesainya spesifikasi seluruh Engine, Architecture Sticker V2 kini telah memiliki fondasi teknis yang lengkap.

Part berikutnya akan membahas **Pipeline Architecture**, yaitu bagaimana seluruh Engine saling bekerja sama untuk membentuk alur pemrosesan Sticker, mulai dari media diterima hingga Sticker berhasil dikirim ke WhatsApp.

# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 3A — Pipeline Architecture

> Status : Processing Pipeline Design
>
> Part ini menjelaskan bagaimana seluruh Engine bekerja sama ketika sebuah command Sticker dijalankan.
>
> Berbeda dengan Part sebelumnya yang membahas setiap Engine secara terpisah, pada Part ini seluruh Engine mulai digabung menjadi satu Pipeline yang utuh.

---

# 1. Tujuan Pipeline

Pipeline dibuat agar seluruh proses Sticker memiliki urutan kerja yang konsisten.

Setiap media akan melewati beberapa tahap.

Tidak ada Engine yang boleh dilewati tanpa alasan.

Dengan adanya Pipeline.

- Error lebih mudah ditemukan.
- Benchmark lebih mudah dilakukan.
- Optimasi lebih mudah diterapkan.
- Penambahan fitur baru menjadi jauh lebih sederhana.

---

# 2. Pipeline Philosophy

Pipeline Sticker V2 memiliki beberapa prinsip utama.

## Linear Processing

Seluruh media diproses secara bertahap.

```
Receive

↓

Validate

↓

Process

↓

Encode

↓

Cleanup

↓

Return
```

Setiap tahap harus selesai sebelum tahap berikutnya dimulai.

---

## Conditional Pipeline

Tidak semua Engine dijalankan.

Pipeline dipilih berdasarkan jenis media.

Contohnya.

Image.

↓

Tidak menjalankan FFmpeg.

Video.

↓

Tidak menjalankan Image Engine.

Smeme tanpa Emoji.

↓

Emoji Engine dilewati.

Dengan demikian performa tetap optimal.

---

## Zero Duplicate Processing

Satu pekerjaan hanya dilakukan satu kali.

Contohnya.

Metadata.

↓

Dibaca satu kali.

Resize.

↓

Dilakukan satu kali.

Render.

↓

Dilakukan satu kali.

Engine lain menggunakan hasil tersebut tanpa mengulang proses.

---

# 3. Pipeline Awal

Seluruh command akan memasuki Pipeline yang sama.

```
Command

↓

Sticker.js

↓

Media Engine

↓

Pipeline Selection
```

Setelah Media dikenali.

Baru dipilih jalur proses yang sesuai.

---

# 4. Media Detection

Media Engine menentukan jenis media.

Contohnya.

```
Image

↓

Image Pipeline
```

```
Video

↓

Video Pipeline
```

```
Animated WEBP

↓

Animated Pipeline
```

```
Static Sticker

↓

Sticker Pipeline
```

```
Smeme

↓

Smeme Pipeline
```

Pengguna tidak perlu memilih Pipeline secara manual.

---

# 5. Image Pipeline

Apabila media berupa gambar.

Pipeline menjadi.

```
Receive Buffer

↓

Media Engine

↓

Metadata Engine

↓

Image Engine

↓

WebP Engine

↓

Exif Engine

↓

Cleanup Engine

↓

Sticker Buffer
```

Pipeline ini merupakan Pipeline tercepat.

Karena tidak membutuhkan proses rendering tambahan.

---

# 6. Sticker Pipeline

Apabila media merupakan Sticker.

Pipeline berubah menjadi.

```
Sticker

↓

Decode WEBP

↓

Metadata

↓

Image Engine

↓

WebP Engine

↓

Exif

↓

Sticker
```

Pipeline ini mempertahankan kualitas Sticker selama memungkinkan.

---

# 7. Smeme Pipeline

Smeme memiliki Pipeline tersendiri.

Karena membutuhkan proses rendering.

Pipeline menjadi.

```
Receive

↓

Media Engine

↓

Metadata Engine

↓

Image Engine

↓

Canvas Engine

↓

Text Engine

↓

Font Engine

↓

Emoji Engine (Opsional)

↓

PNG Buffer

↓

WebP Engine

↓

Exif Engine

↓

Cleanup Engine

↓

Sticker Buffer
```

Pipeline ini merupakan Pipeline paling kompleks untuk media gambar.

---

# 8. Video Pipeline

Media Video menggunakan jalur yang berbeda.

```
Receive

↓

Media Engine

↓

Metadata Engine

↓

Video Engine

↓

FFmpeg Engine

↓

Animated WEBP

↓

Exif Engine

↓

Cleanup Engine

↓

Sticker Buffer
```

Canvas tidak dijalankan apabila memang tidak diperlukan.

---

# 9. Smeme Video Pipeline

Apabila pengguna menggunakan.

```
.smeme atas|bawah
```

pada Video.

Pipeline berubah menjadi.

```
Video

↓

Media Engine

↓

Metadata

↓

Video Engine

↓

FFmpeg

↓

Canvas

↓

Text

↓

Emoji (Opsional)

↓

Animated WEBP

↓

Exif

↓

Cleanup

↓

Sticker
```

Pipeline ini merupakan Pipeline terpanjang pada Sticker Engine.

Namun tetap mempertahankan prinsip Buffer First.

---

# 10. Pipeline Selection

Pipeline dipilih menggunakan beberapa parameter.

Contohnya.

- MIME.
- Animated.
- Duration.
- Extension.
- Command.
- Media Type.

Pipeline tidak boleh dipilih menggunakan nama file.

Karena nama file dapat berubah.

---

# 11. Buffer Flow

Seluruh Pipeline menggunakan Buffer sebagai prioritas.

```
WhatsApp

↓

Buffer

↓

Engine

↓

Buffer

↓

Engine

↓

Buffer

↓

Sticker
```

Target utama.

Tidak membuat File.

Tidak membaca File.

Tidak menulis File.

Kecuali benar-benar diperlukan.

---

# 12. Cleanup Flow

Setelah Pipeline selesai.

Seluruh Resource harus dibersihkan.

```
Sticker

↓

Cleanup Engine

↓

Temp File

↓

Worker

↓

Cache Temporary

↓

Release Memory

↓

Return
```

Dengan demikian Engine selalu kembali pada kondisi awal.

---

# 13. Pipeline Standard

Seluruh Pipeline wajib memenuhi aturan berikut.

- Tidak boleh membaca Metadata dua kali.
- Tidak boleh Resize dua kali.
- Tidak boleh Encode dua kali.
- Tidak boleh membuat Temporary File tanpa alasan.
- Tidak boleh meninggalkan Process yang masih berjalan.
- Tidak boleh meninggalkan Worker aktif.
- Tidak boleh mengembalikan Buffer yang belum selesai diproses.

---

# Penutup Part 3A

Part selanjutnya akan membahas Pipeline tingkat lanjut, termasuk Queue Management, Parallel Processing, Worker Thread, Lifecycle Buffer, Error Propagation, serta strategi optimasi agar seluruh Pipeline mampu bekerja secara maksimal tanpa mengorbankan stabilitas maupun kualitas hasil Sticker.


# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 3B — Advanced Pipeline & Lifecycle

> Status : Internal Processing Architecture
>
> Part ini menjelaskan bagaimana Pipeline bekerja secara internal mulai dari Job dibuat hingga seluruh Resource dibersihkan.
>
> Seluruh implementasi Engine wajib mengikuti Lifecycle yang dijelaskan pada dokumen ini.

---

# 1. Processing Lifecycle

Seluruh proses Sticker memiliki Lifecycle yang sama.

```
Job Created

↓

Queue

↓

Validation

↓

Pipeline

↓

Rendering

↓

Encoding

↓

Cleanup

↓

Result
```

Tidak diperbolehkan melewati salah satu tahap tersebut.

---

# 2. Job Creation

Setiap Command akan menghasilkan sebuah Job.

Job merupakan representasi seluruh proses yang akan dikerjakan Sticker Engine.

Contohnya.

```
.sticker

↓

Sticker Job
```

```
.smeme

↓

Smeme Job
```

```
.take

↓

Take Job
```

Job akan berisi seluruh informasi yang dibutuhkan Engine.

Contohnya.

- Command.
- Media Buffer.
- MIME.
- Metadata.
- Pipeline.
- Konfigurasi.
- Status.

---

# 3. Queue Management

Seluruh Job masuk ke Queue sebelum diproses.

Queue digunakan agar.

- Tidak terjadi benturan proses.
- Resource tetap stabil.
- Worker tidak kelebihan beban.

Queue juga mempermudah Benchmark.

Karena setiap Job memiliki waktu mulai dan waktu selesai.

---

# 4. Priority Queue

Tidak seluruh Job memiliki prioritas yang sama.

Contohnya.

Priority Tinggi.

- Image Sticker.
- Smeme Image.

Priority Sedang.

- Animated Sticker.

Priority Rendah.

- Video panjang.
- Batch Sticker.

Dengan sistem ini.

Sticker sederhana tidak perlu menunggu Video panjang selesai.

---

# 5. Worker Selection

Setelah Job masuk Queue.

Sticker Engine menentukan.

Apakah Job cukup dikerjakan oleh Main Thread.

Atau dipindahkan menuju Worker Thread.

Sebagai contoh.

Image biasa.

↓

Main Thread.

Video.

↓

Worker Thread.

Animated Sticker.

↓

Worker Thread.

---

# 6. Validation Stage

Tahap berikutnya adalah Validation.

Validation memastikan.

- Buffer tersedia.
- MIME valid.
- Media tidak rusak.
- Ukuran sesuai.
- Durasi sesuai batas.
- Command valid.

Apabila Validation gagal.

Pipeline langsung dihentikan.

Cleanup tetap dijalankan.

---

# 7. Pipeline Stage

Apabila Validation berhasil.

Pipeline mulai dijalankan.

Pipeline dipilih berdasarkan.

- Media.
- Command.
- Animated.
- MIME.

Pipeline tidak boleh berubah selama proses berlangsung.

---

# 8. Rendering Stage

Rendering merupakan tahap paling berat.

Rendering dapat berupa.

Canvas Rendering.

Video Rendering.

Animated Rendering.

Emoji Rendering.

Rendering hanya dilakukan satu kali.

Apabila hasil sudah tersedia.

Tidak diperbolehkan melakukan Render ulang.

---

# 9. Encoding Stage

Setelah Rendering selesai.

Media memasuki tahap Encoding.

Tahapan ini mengubah hasil Render menjadi.

Static WEBP.

atau.

Animated WEBP.

Encoding juga bertugas melakukan optimasi ukuran sebelum Sticker dikirim.

---

# 10. Cleanup Stage

Tahap Cleanup selalu dijalankan.

Baik proses berhasil.

Maupun gagal.

Cleanup bertanggung jawab.

- Menghapus Temp File.
- Menghentikan Worker.
- Menghapus Process.
- Membersihkan Cache sementara.
- Melepas Buffer.

Cleanup tidak boleh dilewati.

---

# 11. Buffer Lifecycle

Seluruh Buffer memiliki siklus hidup.

```
Receive

↓

Read

↓

Process

↓

Return

↓

Release
```

Buffer tidak boleh disimpan tanpa alasan.

Setelah proses selesai.

Referensi Buffer harus dilepas agar Garbage Collector dapat bekerja.

---

# 12. Temporary File Lifecycle

Apabila File sementara dibuat.

Lifecycle menjadi.

```
Create

↓

Register

↓

Use

↓

Delete

↓

Verify
```

Apabila proses berhenti sebelum selesai.

Cleanup Engine wajib menyelesaikan Lifecycle tersebut.

---

# 13. Worker Lifecycle

Worker Thread memiliki siklus hidup tersendiri.

```
Create

↓

Receive Task

↓

Execute

↓

Return Result

↓

Terminate
```

Worker tidak boleh tetap aktif setelah Task selesai.

---

# 14. Error Propagation

Apabila suatu Engine mengalami Error.

Error tidak boleh dihentikan di Engine tersebut.

Error harus diteruskan menuju Sticker Engine.

Contohnya.

```
Canvas Engine

↓

Sticker Engine

↓

Command
```

Dengan demikian seluruh Error berasal dari satu jalur.

Hal ini mempermudah proses Debugging.

---

# 15. Retry Policy

Tidak semua Error harus diulang.

Contohnya.

Buffer rusak.

↓

Tidak perlu Retry.

FFmpeg gagal karena Timeout.

↓

Dapat dilakukan Retry sesuai kebijakan Engine.

Retry harus memiliki batas.

Engine tidak boleh melakukan Retry tanpa henti.

---

# 16. State Management

Setiap Job memiliki Status.

Contohnya.

```
Waiting

↓

Queued

↓

Running

↓

Rendering

↓

Encoding

↓

Cleanup

↓

Completed
```

Apabila terjadi Error.

Status berubah menjadi.

```
Failed
```

Status digunakan untuk Logging dan Benchmark.

---

# 17. Resource Ownership

Setiap Resource hanya boleh dimiliki oleh satu Engine pada satu waktu.

Contohnya.

Buffer yang sedang diproses Image Engine.

Tidak boleh diubah oleh Engine lain.

Hal ini mencegah terjadinya konflik data selama Pipeline berjalan.

---

# 18. Pipeline Consistency

Pipeline wajib bersifat deterministik.

Input yang sama harus menghasilkan Output yang sama.

Dengan konfigurasi yang sama.

Engine tidak boleh menghasilkan perilaku yang berbeda.

Kecuali terdapat perubahan konfigurasi secara eksplisit.

---

# Penutup Part 3B

Dengan selesainya pembahasan Pipeline Architecture, seluruh alur internal Sticker Engine kini telah terdefinisi secara lengkap.

Part berikutnya akan membahas **Internal API Contract**, yaitu standar komunikasi antar Engine, format Input dan Output, struktur Object, Error Contract, Return Type, hingga aturan Dependency Injection yang akan digunakan agar seluruh Engine dapat saling berkomunikasi secara konsisten tanpa menciptakan ketergantungan yang berlebihan.


# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 4A — Internal API Contract

> Status : Internal Technical Specification
>
> Part ini menjelaskan standar komunikasi internal antar Engine.
>
> Seluruh Engine wajib mengikuti Contract yang terdapat pada dokumen ini agar seluruh sistem Sticker V2 memiliki perilaku yang konsisten, mudah dipelihara, serta mudah dikembangkan.

---

# 1. Tujuan Internal Contract

Internal Contract dibuat agar seluruh Engine memiliki standar yang sama.

Dengan demikian.

- Seluruh Engine mudah dipahami.
- Return Value selalu konsisten.
- Error mudah ditangani.
- Logging lebih sederhana.
- Benchmark lebih mudah.

Contract ini berlaku untuk seluruh Engine.

Tanpa pengecualian.

---

# 2. Prinsip Internal API

Internal API Sticker V2 memiliki beberapa prinsip.

## Predictable

Seluruh Engine harus menghasilkan Output yang dapat diprediksi.

Input yang sama.

Harus menghasilkan Output yang sama.

---

## Stateless

Engine tidak boleh menyimpan State permanen.

State hanya hidup selama Job berlangsung.

Apabila membutuhkan penyimpanan.

Gunakan Cache Engine.

---

## Immutable

Input Engine tidak boleh diubah secara langsung.

Apabila diperlukan perubahan.

Engine harus membuat Object baru.

Dengan demikian Engine lain tetap menerima data yang konsisten.

---

## Single Entry

Seluruh Engine hanya memiliki satu Public Entry Point.

Contoh.

```
process()

atau

render()

atau

execute()
```

Helper Internal tidak boleh dipanggil dari luar Engine.

---

# 3. Sticker Job

Seluruh proses dimulai dari sebuah Sticker Job.

Sticker Job menjadi pusat informasi seluruh Pipeline.

Contoh struktur.

```
Sticker Job

↓

Job ID

↓

Command

↓

Media

↓

Metadata

↓

Pipeline

↓

Configuration

↓

Status
```

Seluruh Engine menerima Job yang sama.

Namun hanya menggunakan data yang dibutuhkan.

---

# 4. Pipeline Context

Pipeline Context merupakan Object yang dibawa sepanjang proses.

Context bertugas membawa seluruh informasi yang diperlukan Engine.

Contohnya.

- Metadata.
- Buffer.
- Config.
- Font.
- Cache.
- Logger.
- Temporary File.
- Worker.

Engine tidak boleh membuat Context baru.

Engine hanya memperbarui Context yang sudah ada.

---

# 5. Return Contract

Seluruh Engine wajib mengembalikan hasil dengan struktur yang konsisten.

Return minimal harus berisi.

```
Status

↓

Data

↓

Meta
```

Apabila terjadi Error.

Engine mengembalikan.

```
Status

↓

Error

↓

Meta
```

Dengan demikian Sticker Engine dapat menangani seluruh Engine menggunakan cara yang sama.

---

# 6. Error Contract

Seluruh Error wajib memiliki informasi yang cukup.

Minimal.

- Nama Engine.
- Tahap Pipeline.
- Penyebab Error.
- Informasi tambahan apabila tersedia.

Error tidak boleh hanya berupa.

```
Unknown Error
```

Karena akan menyulitkan proses Debugging.

---

# 7. Buffer Contract

Buffer hanya boleh berpindah melalui Pipeline.

Engine tidak diperbolehkan menyimpan Buffer secara permanen.

Buffer memiliki beberapa Status.

```
Received

↓

Validated

↓

Processed

↓

Encoded

↓

Released
```

Setelah Status Released.

Buffer tidak boleh digunakan kembali.

---

# 8. Metadata Contract

Metadata hanya boleh dibuat oleh Metadata Engine.

Engine lain hanya membaca Metadata.

Tidak diperbolehkan mengubah Metadata secara langsung.

Apabila membutuhkan informasi tambahan.

Gunakan Field baru pada Metadata.

Jangan menimpa informasi lama.

---

# 9. Configuration Contract

Seluruh konfigurasi berasal dari Config.

Engine tidak diperbolehkan memiliki konfigurasi tersembunyi.

Apabila suatu nilai dapat diubah.

Nilai tersebut harus berada pada Configuration.

Dengan demikian seluruh perilaku Engine dapat dikontrol dari satu tempat.

---

# 10. Cache Contract

Cache hanya boleh diakses melalui Cache Engine.

Engine lain tidak diperbolehkan membuat Cache sendiri.

Contoh yang diperbolehkan.

```
Text Engine

↓

Cache Engine

↓

Measure Cache
```

Contoh yang tidak diperbolehkan.

```
Text Engine

↓

Map()

↓

Cache Sendiri
```

Hal ini menjaga agar seluruh Cache dapat diaudit dari satu tempat.

---

# 11. Logger Contract

Seluruh Logging dilakukan melalui Logger yang terdapat pada Pipeline Context.

Engine tidak diperbolehkan membuat sistem Logging sendiri.

Dengan demikian seluruh Log memiliki format yang sama.

Logger juga dapat dimatikan pada Mode Production.

---

# 12. Cleanup Contract

Setiap Engine bertanggung jawab mendaftarkan Resource yang dibuat.

Contohnya.

- Temporary File.
- Worker.
- Child Process.
- Timer.

Cleanup Engine akan menggunakan daftar tersebut untuk melakukan pembersihan otomatis.

Engine tidak boleh menghapus Resource Engine lain.

---

# 13. Dependency Contract

Engine hanya boleh menggunakan Dependency yang telah ditentukan.

Contohnya.

Text Engine.

↓

Font Engine.

Canvas Engine.

↓

Text Engine.

Video Engine.

↓

FFmpeg Engine.

Dependency di luar daftar tersebut harus melalui Sticker Engine.

---

# 14. Async Contract

Seluruh Engine wajib menggunakan Promise.

Engine tidak diperbolehkan melakukan Blocking Process tanpa alasan.

Task yang berat harus dipindahkan menuju Worker apabila memungkinkan.

Dengan demikian Event Loop tetap responsif.

---

# 15. Version Compatibility

Apabila suatu Engine mengalami perubahan besar.

Versi Contract harus tetap dipertahankan.

Perubahan yang merusak kompatibilitas harus dicatat pada dokumentasi migrasi.

Target utama.

Engine lama tetap dapat digunakan selama masa transisi.

---

# Penutup Part 4A

Dengan adanya Internal API Contract, seluruh Engine kini memiliki standar komunikasi yang sama.

Part selanjutnya akan membahas **Event System, Hook System, Dependency Injection, Internal Scheduler


# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 4B — Event System, Resource Manager & Engine Coordination

> Status : Internal Runtime Architecture
>
> Part ini menjelaskan bagaimana seluruh Engine saling berkomunikasi selama Runtime berlangsung tanpa menciptakan ketergantungan langsung (Direct Dependency).

---

# 1. Tujuan Runtime Architecture

Runtime Architecture dibuat agar seluruh Engine dapat bekerja secara bersamaan namun tetap independen.

Target utamanya.

- Loose Coupling.
- Mudah dikembangkan.
- Mudah diuji.
- Mudah dioptimasi.
- Tidak menghasilkan Circular Dependency.

---

# 2. Engine Registry

Seluruh Engine didaftarkan pada Engine Registry.

Engine Registry merupakan tempat Sticker Engine mengambil seluruh Engine.

Contoh.

```
Sticker Engine

↓

Engine Registry

↓

Image Engine

↓

Video Engine

↓

Canvas Engine

↓

Text Engine

↓

WebP Engine
```

Dengan cara ini.

Sticker Engine tidak perlu mengetahui lokasi setiap Engine.

---

# 3. Engine Registry Rule

Engine Registry hanya memiliki beberapa tugas.

- Menyimpan Engine.
- Mengembalikan Engine.
- Memastikan Engine tersedia.
- Menghindari Import berulang.

Engine Registry tidak menjalankan proses Rendering.

---

# 4. Event System

Sticker Engine menggunakan Event System internal.

Event digunakan agar Engine dapat mengetahui perubahan proses tanpa saling memanggil secara langsung.

Contoh.

```
Media Loaded

↓

Render Started

↓

Render Finished

↓

Encoding Started

↓

Encoding Finished

↓

Cleanup Started

↓

Cleanup Finished
```

Event hanya digunakan sebagai notifikasi.

Bukan sebagai tempat menjalankan logika utama.

---

# 5. Hook System

Selain Event.

Sticker Engine juga menyediakan Hook.

Hook digunakan untuk menjalankan proses tambahan pada titik tertentu.

Contoh Hook.

```
beforeValidate

afterValidate

beforeRender

afterRender

beforeEncode

afterEncode

beforeCleanup

afterCleanup
```

Hook bersifat opsional.

Apabila tidak digunakan.

Pipeline tetap berjalan normal.

---

# 6. Hook Rule

Hook memiliki beberapa aturan.

- Tidak boleh mengubah Pipeline.
- Tidak boleh mengubah Metadata.
- Tidak boleh menghentikan Engine lain.
- Tidak boleh mengubah Job secara langsung tanpa izin.

Hook hanya bertugas melakukan proses tambahan.

Contohnya.

- Logging.
- Benchmark.
- Statistik.
- Analisis.

---

# 7. Resource Manager

Seluruh Resource dikelola oleh Resource Manager.

Resource meliputi.

- Buffer.
- Temporary File.
- Worker.
- Child Process.
- Timer.
- Cache Sementara.

Engine tidak diperbolehkan mengelola Resource Engine lain.

---

# 8. Resource Registration

Setiap Resource yang dibuat wajib didaftarkan.

Contoh.

```
FFmpeg

↓

Register Process

↓

Cleanup
```

```
Worker

↓

Register Worker

↓

Cleanup
```

```
Temp File

↓

Register File

↓

Cleanup
```

Dengan demikian Cleanup Engine mengetahui seluruh Resource yang harus dibersihkan.

---

# 9. Scheduler

Scheduler bertugas menentukan kapan suatu Job dijalankan.

Scheduler mempertimbangkan.

- Queue.
- Priority.
- Worker Availability.
- Resource.

Scheduler tidak melakukan Rendering.

Scheduler hanya mengatur urutan pekerjaan.

---

# 10. Scheduler Rule

Scheduler wajib memastikan.

- Job tidak saling bertabrakan.
- Worker tidak kelebihan beban.
- Queue tetap stabil.
- Prioritas tetap dipertahankan.

Target utama.

Throughput tinggi.

Latency rendah.

---

# 11. Dependency Injection

Seluruh Engine memperoleh Dependency melalui Sticker Engine.

Contohnya.

```
Sticker Engine

↓

Canvas Engine

↓

Text Engine
```

Bukan.

```
Canvas Engine

↓

Import Text Engine
```

Pendekatan ini mengurangi ketergantungan langsung antar Engine.

---

# 12. Shared Context

Seluruh Engine menggunakan Context yang sama.

Context berisi.

- Job.
- Metadata.
- Config.
- Logger.
- Cache.
- Resource.
- Benchmark.

Engine tidak diperbolehkan membuat Context baru.

---

# 13. Resource Ownership

Setiap Resource hanya memiliki satu pemilik.

Contoh.

Image Buffer.

↓

Dimiliki Image Engine.

Canvas.

↓

Dimiliki Canvas Engine.

Worker.

↓

Dimiliki Worker Engine.

Cleanup hanya menghapus Resource berdasarkan daftar kepemilikan tersebut.

---

# 14. Event Flow

Contoh Event selama proses Sticker.

```
Job Created

↓

Media Loaded

↓

Validation Completed

↓

Pipeline Selected

↓

Rendering Started

↓

Rendering Finished

↓

Encoding Started

↓

Encoding Finished

↓

Cleanup Started

↓

Cleanup Finished

↓

Job Completed
```

Urutan Event harus selalu konsisten.

---

# 15. Failure Flow

Apabila terjadi Error.

Pipeline berubah menjadi.

```
Job

↓

Error

↓

Register Error

↓

Cleanup

↓

Return Error
```

Cleanup tetap wajib dijalankan.

Tidak ada pengecualian.

---

# 16. Runtime Safety

Runtime Sticker Engine memiliki beberapa aturan.

- Tidak boleh terjadi Circular Event.
- Tidak boleh terjadi Infinite Loop.
- Tidak boleh terjadi Double Cleanup.
- Tidak boleh terjadi Double Encoding.
- Tidak boleh terjadi Double Rendering.
- Tidak boleh terjadi Resource Ownership Conflict.

---

# 17. Future Plugin System

Arsitektur Sticker V2 dipersiapkan agar mendukung Plugin.

Contohnya.

```
Quote Plugin

↓

Sticker Engine

↓

Render
```

```
Brat Plugin

↓

Sticker Engine

↓

Render
```

Plugin hanya perlu mengikuti Contract yang telah ditentukan.

Tidak perlu mengubah Sticker Engine.

---

# 18. Architecture Goal

Dengan Runtime Architecture ini.

Seluruh Engine diharapkan mampu.

✅ Berjalan secara independen.

✅ Berkomunikasi tanpa Direct Dependency.

✅ Mudah dikembangkan.

✅ Mudah diuji.

✅ Mudah dioptimasi.

✅ Tetap stabil meskipun jumlah Engine bertambah.

---

# Penutup Part 4B

Dengan selesainya Runtime Architecture, fondasi komunikasi internal Sticker Engine V2 kini telah lengkap.

Part berikutnya akan membahas **Performance Architecture**, yaitu strategi optimasi tingkat rendah seperti Memory Management, Buffer Pool, Object Pool, Garbage Collection Strategy, Smart Cache, Parallel Processing, Worker Scheduling, serta Benchmark System yang menjadi dasar performa Sticker Engine V2.


# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 5A — Performance Architecture

> Status : Low-Level Performance Design
>
> Part ini menjelaskan bagaimana Sticker Engine V2 mengelola performa secara internal.
>
> Fokus utama bukan hanya membuat Sticker selesai diproses, tetapi memastikan setiap proses menggunakan CPU, RAM, Storage, dan Resource lain secara seefisien mungkin.

---

# 1. Tujuan Performance Architecture

Performance Architecture dibangun agar seluruh Engine memiliki standar optimasi yang sama.

Target utama.

- Latency rendah.
- Throughput tinggi.
- Penggunaan RAM stabil.
- Penggunaan CPU efisien.
- Tidak menghasilkan Resource Leak.
- Tidak terjadi penurunan performa setelah berjalan lama.

Performance bukan hanya diukur dari kecepatan.

Tetapi juga dari kestabilan Engine ketika digunakan secara terus-menerus.

---

# 2. Performance Philosophy

Sticker Engine V2 menggunakan beberapa prinsip utama.

## Buffer First

Buffer menjadi media utama perpindahan data.

Seluruh Engine harus mengutamakan Buffer dibanding File.

```
Receive Buffer

↓

Processing

↓

Return Buffer
```

Storage hanya digunakan apabila benar-benar diperlukan.

---

## Single Processing

Satu pekerjaan.

Satu kali proses.

Contohnya.

Metadata.

↓

Tidak boleh dibaca dua kali.

Resize.

↓

Tidak boleh dilakukan dua kali.

Encoding.

↓

Tidak boleh dilakukan dua kali.

---

## Lazy Processing

Engine hanya memproses sesuatu apabila benar-benar diperlukan.

Contohnya.

Emoji Engine.

↓

Tidak dijalankan apabila teks tidak mengandung Emoji.

FFmpeg.

↓

Tidak dijalankan apabila media berupa Image.

Canvas.

↓

Tidak dijalankan apabila proses tidak membutuhkan Rendering.

---

# 3. Memory Management

Memory merupakan Resource paling penting pada Sticker Engine.

Target utama.

- Memory stabil.
- Tidak terjadi Memory Leak.
- Tidak terjadi Buffer Leak.
- Garbage Collector bekerja secara optimal.

Seluruh Engine harus segera melepas Resource yang sudah tidak digunakan.

---

# 4. Buffer Lifecycle

Setiap Buffer memiliki siklus hidup.

```
Allocate

↓

Receive

↓

Process

↓

Encode

↓

Return

↓

Release
```

Setelah Release.

Buffer tidak boleh digunakan kembali.

---

# 5. Buffer Ownership

Buffer hanya dimiliki oleh satu Engine.

Contohnya.

```
Image Buffer

↓

Image Engine
```

Setelah selesai.

Buffer diteruskan menuju Engine berikutnya.

Engine sebelumnya tidak boleh lagi mengakses Buffer tersebut.

---

# 6. Memory Allocation

Memory hanya dialokasikan apabila diperlukan.

Engine tidak diperbolehkan membuat Buffer kosong tanpa alasan.

Target.

- Sedikit alokasi.
- Sedikit salinan Buffer.
- Sedikit Fragmentasi.

---

# 7. Object Lifecycle

Selain Buffer.

Object juga memiliki Lifecycle.

```
Create

↓

Use

↓

Release
```

Object yang sudah tidak digunakan harus segera dilepas.

Engine tidak boleh menyimpan Object hanya untuk berjaga-jaga.

---

# 8. Temporary File Strategy

Temporary File merupakan pilihan terakhir.

Pipeline ideal.

```
WhatsApp

↓

Buffer

↓

Sharp

↓

Canvas

↓

WEBP

↓

WhatsApp
```

Pipeline di atas tidak membuat File sama sekali.

Apabila FFmpeg membutuhkan File.

Baru Temp Engine digunakan.

---

# 9. CPU Optimization

Sticker Engine harus memanfaatkan CPU secara efisien.

Beberapa aturan.

- Hindari Loop berulang.
- Hindari Render ganda.
- Hindari Resize berulang.
- Hindari Decode berulang.
- Hindari Encode berulang.

Target utama.

Setiap CPU Cycle menghasilkan pekerjaan yang benar-benar diperlukan.

---

# 10. Sharp Optimization

Sharp menjadi Engine utama Image Processing.

Strategi optimasi.

- Decode satu kali.
- Metadata satu kali.
- Resize satu kali.
- Encode satu kali.

Seluruh proses lain dilakukan setelah Image siap.

---

# 11. Canvas Optimization

Canvas hanya digunakan untuk Rendering.

Canvas tidak bertanggung jawab.

- Resize.
- Rotate.
- Metadata.
- MIME Detection.

Canvas hanya menerima media yang sudah siap digambar.

Hal ini membuat proses Rendering menjadi jauh lebih ringan.

---

# 12. FFmpeg Optimization

Seluruh proses Video dipusatkan pada FFmpeg Engine.

Optimasi utama.

- Thread optimal.
- Preset tercepat.
- Pipe apabila memungkinkan.
- Kill Process otomatis.
- Timeout otomatis.
- Cleanup otomatis.

FFmpeg tidak boleh berjalan lebih lama dari yang diperlukan.

---

# 13. Smart Resource Usage

Setiap Engine hanya menggunakan Resource yang diperlukan.

Contohnya.

Image Sticker.

↓

Tidak membuat Worker.

Tidak membuat Temp File.

Tidak menjalankan FFmpeg.

Tidak menjalankan Emoji apabila tidak diperlukan.

Semakin sedikit Engine yang dijalankan.

Semakin cepat proses Sticker selesai.

---

# 14. Performance Goal

Target performa Sticker V2.

Image Sticker.

```
300 ms — 700 ms
```

Smeme.

```
500 ms — 1000 ms
```

Image + Emoji.

```
700 ms — 2000 ms
```

Video Sticker.

```
1000 ms — 3000 ms
```

Target tersebut merupakan sasaran pada perangkat yang memenuhi spesifikasi minimum proyek.

---

# 15. Performance Rule

Seluruh Engine wajib memenuhi aturan berikut.

- Tidak melakukan pekerjaan yang sama dua kali.
- Tidak membuat Resource tanpa alasan.
- Tidak mempertahankan Resource


# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 5B — Advanced Performance & Runtime Optimization

> Status : Advanced Performance Architecture
>
> Part ini menjelaskan strategi optimasi tingkat lanjut yang menjadi fondasi performa Sticker Engine V2.
>
> Sebagian optimasi dapat diimplementasikan secara bertahap sesuai kebutuhan tanpa mengubah Architecture utama.

---

# 1. Tujuan Advanced Optimization

Optimasi tingkat lanjut dibuat agar Sticker Engine mampu mempertahankan performa tinggi ketika.

- Digunakan terus menerus.
- Memproses banyak Sticker.
- Memproses Video.
- Menjalankan banyak Worker.
- Memiliki banyak Cache.

Target utamanya adalah menjaga performa tetap stabil dalam jangka panjang.

---

# 2. Smart Cache

Cache tidak hanya berfungsi menyimpan data.

Cache juga bertugas mengurangi pekerjaan Engine.

Contohnya.

```
Measure Text

↓

Cache

↓

Reuse
```

```
Metadata

↓

Cache

↓

Reuse
```

```
Emoji Render

↓

Cache

↓

Reuse
```

Semakin sedikit pekerjaan yang diulang.

Semakin tinggi performa Engine.

---

# 3. Cache Lifetime

Setiap Cache memiliki umur.

Contohnya.

```
Create

↓

Active

↓

Expire

↓

Delete
```

Cache yang tidak pernah digunakan kembali harus segera dibersihkan.

Target utamanya.

- RAM tetap stabil.
- Tidak terjadi Cache Leak.

---

# 4. Buffer Pool

Pada versi mendatang.

Sticker Engine dapat menggunakan Buffer Pool.

Buffer Pool bertugas menyimpan Buffer yang dapat digunakan kembali.

Pipeline menjadi.

```
Request Buffer

↓

Use

↓

Release

↓

Return To Pool
```

Dengan demikian jumlah alokasi Memory dapat dikurangi.

---

# 5. Object Pool

Selain Buffer.

Object tertentu juga dapat digunakan kembali.

Contohnya.

- Render Context.
- Pipeline Context.
- Job Object.
- Worker Task.

Object Pool membantu mengurangi Garbage Collection.

---

# 6. Worker Scheduling

Worker tidak dibuat setiap kali Job masuk.

Worker Engine bertugas mengatur.

- Worker Idle.
- Worker Busy.
- Worker Available.

Scheduler akan memilih Worker yang paling sesuai.

Target.

Mengurangi waktu pembuatan Worker.

---

# 7. Dynamic Worker

Apabila beban meningkat.

Worker dapat ditambah.

Apabila beban menurun.

Worker dapat dikurangi.

Jumlah Worker mengikuti kondisi Runtime.

Bukan jumlah tetap.

---

# 8. Parallel Processing

Engine tertentu dapat bekerja secara paralel.

Contohnya.

```
Metadata

─────────────

Cache Lookup
```

atau.

```
Register Cleanup

─────────────

Prepare Render
```

Namun.

Rendering utama tetap dilakukan secara terurut agar hasil tetap konsisten.

---

# 9. Pipeline Profiling

Seluruh Pipeline dapat diukur.

Contohnya.

```
Metadata

25 ms
```

```
Resize

48 ms
```

```
Canvas

82 ms
```

```
WebP

91 ms
```

Dengan Profiling.

Bottle Neck dapat ditemukan dengan cepat.

---

# 10. Performance Profiler

Profiler bertugas mencatat.

- CPU Time.
- Memory Usage.
- Worker Time.
- FFmpeg Time.
- Canvas Time.
- Sharp Time.

Profiler hanya digunakan pada Debug Mode.

Production dapat mematikannya.

---

# 11. Garbage Collection Strategy

Sticker Engine tidak mengendalikan Garbage Collector.

Namun.

Sticker Engine dapat membantu Garbage Collector bekerja lebih cepat.

Caranya.

- Melepas Reference.
- Menghapus Timer.
- Menghapus Worker.
- Menghapus Buffer.
- Menghapus Temporary Object.

Semakin sedikit Object yang masih direferensikan.

Semakin cepat Garbage Collector bekerja.

---

# 12. Smart Queue

Queue tidak hanya menyimpan Job.

Queue juga dapat mengatur.

- Priority.
- Retry.
- Timeout.
- Worker Assignment.

Target utama.

Job ringan tidak tertahan oleh Job berat.

---

# 13. Adaptive Pipeline

Pipeline dapat berubah sesuai kondisi.

Contohnya.

Image tanpa Emoji.

↓

Emoji Engine dilewati.

Sticker tanpa Metadata tambahan.

↓

Exif tambahan dilewati.

Pipeline selalu memilih jalur tercepat.

---

# 14. Adaptive Rendering

Rendering juga dapat berubah.

Contohnya.

Apabila.

- Tidak ada Shadow.

↓

Shadow Engine dilewati.

Apabila.

- Tidak ada Stroke.

↓

Stroke Rendering dilewati.

Engine hanya menjalankan proses yang benar-benar dibutuhkan.

---

# 15. Benchmark Framework

Seluruh Benchmark menggunakan metode yang sama.

Setiap Benchmark mencatat.

- Start Time.
- End Time.
- CPU Time.
- Memory Peak.
- Worker Count.
- Temporary File.
- Cache Hit.
- Cache Miss.

Dengan Benchmark yang konsisten.

Perubahan performa dapat diketahui dengan mudah.

---

# 16. Stress Test

Selain Benchmark.

Sticker Engine juga harus memiliki Stress Test.

Contohnya.

100 Sticker berturut-turut.

100 Smeme.

100 Animated Sticker.

100 Video Sticker.

Targetnya memastikan Engine tetap stabil.

---

# 17. Regression Test

Setiap perubahan Engine harus diuji.

Apabila performa menurun.

Perubahan tersebut tidak boleh digabungkan sebelum penyebabnya ditemukan.

Target utama.

Performa tidak boleh menurun seiring bertambahnya fitur.

---

# 18. Future Optimization

Architecture Sticker V2 dipersiapkan agar mendukung.

- SIMD Processing.
- GPU Rendering.
- Shared Memory.
- Shared Worker.
- Distributed Render Queue.
- Progressive Rendering.
- Background Rendering.
- Batch Rendering.
- Incremental Rendering.

Seluruh peningkatan tersebut dapat ditambahkan tanpa mengubah struktur utama Sticker Engine.

---

# 19. Performance Target

Architecture Sticker V2 dirancang agar mampu mempertahankan.

✅ Latency rendah.

✅ Throughput tinggi.

✅ Penggunaan RAM stabil.

✅ Penggunaan CPU efisien.

✅ Zero Memory Leak.

✅ Zero Resource Leak.

✅ Zero Temporary File Leak.

✅ Zero Duplicate Processing.

---

# Penutup Part 5B

Dengan selesainya Performance Architecture, seluruh fondasi optimasi Sticker Engine V2 kini telah lengkap.

Part berikutnya akan membahas **Developer Specification**, meliputi standar implementasi Engine, struktur file, standar penamaan Function, aturan Promise, Error Handling, Code Style, Testing Strategy, serta Quality Assurance yang wajib dipatuhi selama pengembangan Sticker Engine V2.


# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 6 — Developer Specification

> Status : Development Standard
>
> Part ini menjelaskan standar implementasi yang wajib diikuti oleh seluruh Developer ketika menambahkan, mengubah, maupun memperbaiki Engine pada Sticker Engine V2.
>
> Seluruh aturan pada part ini bersifat wajib agar kualitas kode tetap konsisten meskipun jumlah Engine terus bertambah.

---

# 1. Tujuan Developer Specification

Developer Specification dibuat untuk memastikan seluruh Engine memiliki kualitas yang sama.

Target utama.

- Konsisten.
- Mudah dipahami.
- Mudah diuji.
- Mudah dipelihara.
- Mudah dikembangkan.

Dengan adanya standar ini.

Seluruh Engine akan terlihat seperti ditulis oleh satu Developer.

---

# 2. Struktur Engine

Setiap Engine wajib mengikuti struktur berikut.

```
Import

↓

Constant

↓

Configuration

↓

Private Variable

↓

Private Helper

↓

Public Function

↓

Export
```

Urutan tersebut tidak boleh diubah tanpa alasan yang jelas.

---

# 3. Single Responsibility Principle

Satu Engine.

Satu tanggung jawab.

Contoh.

```
Image Engine

↓

Image Processing
```

```
Font Engine

↓

Font Management
```

```
Cleanup Engine

↓

Cleanup
```

Engine tidak boleh mengambil pekerjaan Engine lain.

---

# 4. Public API

Setiap Engine hanya memiliki sedikit Public Function.

Idealnya.

```
1

sampai

3
```

Public Function.

Sisanya menjadi Helper Internal.

Dengan demikian API Engine tetap kecil dan mudah dipahami.

---

# 5. Private Helper

Seluruh Helper Internal bersifat Private.

Helper tidak boleh digunakan oleh Engine lain.

Apabila Helper dibutuhkan oleh banyak Engine.

Helper tersebut harus dipindahkan menjadi Utility atau Engine tersendiri.

---

# 6. Async Standard

Seluruh Engine wajib menggunakan Promise.

Walaupun suatu proses terlihat sederhana.

Engine tetap menggunakan Async agar Pipeline memiliki perilaku yang konsisten.

Target utama.

Seluruh Pipeline dapat di-Await tanpa pengecualian.

---

# 7. Error Standard

Error wajib.

- Mudah dipahami.
- Mudah dilacak.
- Memiliki Context.
- Memiliki Source Engine.

Contoh Error.

```
Canvas Engine

↓

Render Failed

↓

Image Buffer Invalid
```

Bukan.

```
Unknown Error
```

---

# 8. Return Standard

Seluruh Engine harus memiliki Return Type yang konsisten.

Engine tidak boleh.

Kadang mengembalikan Buffer.

Kadang Boolean.

Kadang String.

Tanpa aturan yang jelas.

Return harus mengikuti Internal Contract.

---

# 9. Configuration Rule

Magic Number tidak diperbolehkan.

Seluruh nilai konfigurasi harus berasal dari Config.

Contohnya.

Padding.

Font.

Quality.

Timeout.

TTL.

Semua berasal dari Configuration.

---

# 10. Dependency Rule

Engine hanya boleh menggunakan Dependency yang benar-benar diperlukan.

Import yang tidak digunakan harus dihapus.

Circular Dependency tidak diperbolehkan.

Engine tidak boleh saling Import secara langsung apabila dapat melalui Sticker Engine.

---

# 11. Memory Rule

Engine wajib melepas seluruh Resource setelah selesai.

Contohnya.

- Buffer.
- Canvas.
- Timer.
- Worker.
- Child Process.

Engine tidak boleh mempertahankan Resource tanpa alasan.

---

# 12. Temporary File Rule

Seluruh Temporary File harus dibuat melalui Temp Engine.

Tidak diperbolehkan membuat File langsung menggunakan.

```
fs.writeFile()
```

Tanpa registrasi.

Seluruh File harus dapat dibersihkan oleh Cleanup Engine.

---

# 13. Logging Rule

Logging hanya digunakan.

- Debug.
- Benchmark.
- Audit.

Logging tidak boleh digunakan sebagai pengganti Error Handling.

Logging juga tidak boleh memperlambat Pipeline.

---

# 14. Documentation Rule

Setiap Public Function wajib memiliki dokumentasi.

Minimal berisi.

- Tujuan.
- Parameter.
- Return.
- Error yang mungkin muncul.

Dokumentasi menjadi bagian dari implementasi.

Bukan pekerjaan setelah Coding selesai.

---

# 15. Testing Rule

Setiap Engine wajib dapat diuji secara terpisah.

Engine tidak boleh bergantung pada Engine lain selama proses Unit Test.

Targetnya.

Setiap Engine dapat diuji tanpa harus menjalankan seluruh Sticker Engine.

---

# 16. Performance Rule

Seluruh perubahan wajib mempertahankan target performa Sticker V2.

Developer tidak boleh mengorbankan performa hanya untuk mengurangi jumlah baris kode.

Apabila terdapat dua solusi.

Pilih solusi yang.

- Stabil.
- Mudah dipelihara.
- Memiliki performa lebih baik.

---

# 17. Review Rule

Sebelum perubahan digabungkan.

Harus dipastikan.

- Tidak ada Resource Leak.
- Tidak ada Memory Leak.
- Tidak ada Circular Dependency.
- Tidak ada Duplicate Code.
- Tidak ada Regression Performance.

Apabila salah satu poin gagal.

Perubahan harus diperbaiki terlebih dahulu.

---

# 18. Future Compatibility

Seluruh Engine harus dipersiapkan untuk pengembangan di masa depan.

Contohnya.

- AI Sticker.
- Quote Sticker.
- Brat Sticker.
- Batch Sticker.
- Plugin.
- Background Removal.
- Smart Effect.

Penambahan fitur tersebut tidak boleh memerlukan perubahan besar pada Engine yang sudah ada.

---

# 19. Quality Assurance

Sticker Engine V2 dianggap memenuhi standar apabila.

✅ Seluruh Engine mengikuti Architecture.

✅ Seluruh Engine mengikuti Internal Contract.

✅ Seluruh Engine mengikuti Performance Architecture.

✅ Seluruh Engine lulus Benchmark.

✅ Seluruh Engine lulus Stress Test.

✅ Seluruh Engine lulus Audit.

---

# Penutup Part 6

Dengan adanya Developer Specification.

Seluruh pengembangan Sticker Engine memiliki standar implementasi yang sama.

Hal ini memastikan bahwa kualitas kode tetap konsisten meskipun jumlah Engine, fitur, maupun Developer terus bertambah.


# 🏗️ Sticker Engine V2
# ARCHITECTURE.md
## Part 7 — Future Architecture, Extension System & Final Notes

> Status : Final Architecture Specification
>
> Part ini merupakan penutup dari seluruh Architecture Sticker Engine V2.
>
> Dokumen ini menjelaskan bagaimana Architecture dipertahankan dalam jangka panjang, bagaimana Engine baru ditambahkan, bagaimana kompatibilitas dijaga, serta bagaimana sistem berkembang tanpa memerlukan Refactor besar.

---

# 1. Tujuan Future Architecture

Architecture Sticker Engine V2 dirancang agar dapat berkembang selama bertahun-tahun.

Target utamanya.

- Mudah diperluas.
- Mudah dipelihara.
- Mudah dioptimasi.
- Tetap kompatibel.
- Tidak memerlukan Refactor besar.

Semua pengembangan berikutnya harus mengikuti Architecture yang telah ditetapkan.

---

# 2. Core Engine Policy

Tidak seluruh Engine memiliki tingkat fleksibilitas yang sama.

Beberapa Engine dikategorikan sebagai Core Engine.

Core Engine meliputi.

- Sticker Engine.
- Media Engine.
- Metadata Engine.
- Image Engine.
- Video Engine.
- Canvas Engine.
- WebP Engine.
- Cleanup Engine.

Core Engine merupakan fondasi utama Architecture.

Perubahan terhadap Core Engine harus dilakukan dengan sangat hati-hati.

---

# 3. Extension Engine

Selain Core Engine.

Sticker V2 mendukung Extension Engine.

Extension Engine dapat ditambahkan tanpa mengubah Core Engine.

Contohnya.

- Quote Engine.
- Brat Engine.
- AI Sticker Engine.
- Watermark Engine.
- Effect Engine.
- Enhancement Engine.
- Telegram Sticker Engine.
- Discord Sticker Engine.

Extension Engine hanya perlu mengikuti Internal Contract yang telah ditetapkan.

---

# 4. Plugin Architecture

Seluruh Plugin berada di luar Core Engine.

Contoh.

```
Plugin

↓

Sticker Engine

↓

Pipeline

↓

Result
```

Plugin tidak diperbolehkan mengubah Lifecycle utama.

Plugin hanya menambahkan kemampuan baru.

---

# 5. Compatibility Policy

Seluruh perubahan wajib menjaga kompatibilitas.

Perubahan besar tidak boleh langsung menghapus perilaku lama.

Selama masa transisi.

Versi lama masih harus dapat berjalan apabila memungkinkan.

---

# 6. Deprecation Policy

Apabila suatu Engine akan dihentikan.

Tahapan yang digunakan.

```
Supported

↓

Deprecated

↓

Migration

↓

Removed
```

Engine tidak boleh langsung dihapus.

Harus tersedia waktu migrasi yang memadai.

---

# 7. Version Policy

Architecture menggunakan Versioning.

Contoh.

```
V2.0

↓

V2.1

↓

V2.2

↓

V3.0
```

Minor Version.

Digunakan untuk.

- Optimasi.
- Bug Fix.
- Penambahan Engine kecil.

Major Version.

Digunakan apabila terjadi perubahan Architecture.

---

# 8. Migration Policy

Seluruh migrasi dilakukan secara bertahap.

Tahapan migrasi.

```
Planning

↓

Implementation

↓

Validation

↓

Benchmark

↓

Migration

↓

Cleanup

↓

Release
```

Seluruh perubahan harus dapat ditelusuri melalui dokumentasi.

---

# 9. Performance Evolution

Target performa dapat meningkat seiring perkembangan Engine.

Contoh.

V2.

```
Image

< 1 Detik
```

V2.x.

```
Image

500 ms
```

V3.

```
Image

300 ms
```

Optimasi dilakukan tanpa mengubah perilaku dasar Sticker Engine.

---

# 10. Scalability

Architecture dipersiapkan agar mampu menangani.

- Banyak Command.
- Banyak Engine.
- Banyak Plugin.
- Banyak Worker.
- Banyak Pipeline.

Penambahan fitur tidak boleh memperumit struktur yang telah ada.

---

# 11. Security

Seluruh Engine wajib memperhatikan keamanan.

Minimal.

- Validasi Input.
- Validasi MIME.
- Validasi Buffer.
- Validasi Ukuran.
- Validasi Durasi.
- Validasi Resource.

Engine tidak boleh mempercayai Input secara langsung.

---

# 12. Maintainability

Kode harus mudah dipelihara.

Target utama.

- Struktur jelas.
- Nama konsisten.
- Dokumentasi lengkap.
- Fungsi kecil.
- Engine modular.

Maintenance harus lebih mudah daripada implementasi awal.

---

# 13. Documentation Policy

Setiap perubahan Architecture wajib disertai dokumentasi.

Minimal mencakup.

- Tujuan perubahan.
- Dampak terhadap Engine.
- Dampak terhadap Pipeline.
- Benchmark.
- Catatan kompatibilitas.

Dokumentasi merupakan bagian dari Architecture.

Bukan pelengkap.

---

# 14. Long-Term Roadmap

Pengembangan jangka panjang yang dipersiapkan.

- Smart Render Pipeline.
- Background Rendering.
- AI Sticker.
- AI Upscaler.
- Smart Watermark.
- Dynamic Effect.
- Batch Rendering.
- Distributed Rendering.
- GPU Rendering.
- SIMD Optimization.
- Shared Worker.
- Shared Buffer.

Seluruh fitur tersebut harus dapat ditambahkan tanpa mengubah fondasi utama Architecture.

---

# 15. Architecture Goals

Architecture Sticker Engine V2 memiliki tujuan akhir.

✅ Modular.

✅ Independent.

✅ Reusable.

✅ Buffer First.

✅ Zero Leak.

✅ Zero Duplicate Processing.

✅ Zero Circular Dependency.

✅ High Performance.

✅ Easy Maintenance.

✅ Easy Debugging.

✅ Easy Benchmarking.

✅ Easy Future Expansion.

---

# 16. Final Architecture Flow

Gambaran akhir seluruh sistem.

```
WhatsApp Command

↓

Sticker Engine

↓

Pipeline Manager

↓

Engine Registry

↓

Processing Engine

↓

Encoding Engine

↓

Cleanup Engine

↓

Sticker Buffer

↓

WhatsApp
```

Seluruh Engine berada di bawah koordinasi Sticker Engine.

Engine tidak saling bergantung secara langsung.

Seluruh komunikasi dilakukan melalui Pipeline yang telah ditentukan.

---

# 17. Final Statement

Sticker Engine V2 bukan sekadar kumpulan fungsi untuk membuat Sticker.

Architecture ini dirancang sebagai fondasi jangka panjang yang mampu mendukung seluruh fitur Sticker saat ini maupun fitur yang akan datang.

Seluruh Engine dikembangkan dengan prinsip modularitas, tanggung jawab tunggal, komunikasi yang konsisten, optimasi performa, serta pengelolaan resource yang ketat.

Dengan fondasi ini, pengembangan fitur baru diharapkan cukup dilakukan melalui penambahan Engine atau Extension tanpa perlu mengubah struktur utama yang telah dibangun.

Architecture ini menjadi standar resmi seluruh sistem Sticker pada proyek dan wajib dijadikan acuan dalam setiap implementasi, optimasi, maupun proses refactor di masa mendatang.

---

# Penutup ARCHITECTURE.md

Dokumen ini menjadi referensi teknis utama bagi seluruh implementasi Sticker Engine V2.

Seluruh Engine, Pipeline, Plugin, Extension, Benchmark, maupun pengembangan berikutnya harus mengikuti Architecture yang telah ditetapkan agar sistem tetap konsisten, stabil, mudah dikembangkan, serta mampu mempertahankan performa tinggi dalam jangka panjang.