📦 Sticker Upgrade V2 — Part 1

Pendahuluan, Tujuan & Arsitektur Baru

«Status: Perencanaan Arsitektur

Dokumen ini menjadi pedoman utama sebelum proses pengembangan dimulai. Seluruh perubahan pada Sticker V2 harus mengikuti standar yang dijelaskan di bawah agar struktur tetap konsisten, mudah dikembangkan, mudah dirawat, dan memiliki performa tinggi.»

---

1. Latar Belakang

Sistem Sticker saat ini telah berjalan dengan baik untuk kebutuhan dasar, namun seiring bertambahnya fitur, mulai muncul beberapa keterbatasan.

Beberapa fungsi masih saling bergantung dalam satu file sehingga proses pengembangan menjadi lebih sulit. Penambahan fitur baru sering kali mengharuskan perubahan pada bagian lain yang sebenarnya tidak berhubungan.

Selain itu, proses pengolahan media masih dapat dioptimalkan agar lebih cepat, penggunaan memori lebih efisien, serta lebih mudah dikembangkan untuk fitur-fitur mendatang.

Karena itu dibuatlah Sticker Upgrade V2, yaitu sebuah pembaruan besar yang memisahkan seluruh proses menjadi beberapa mesin (Engine) yang memiliki tugas masing-masing.

---

2. Tujuan Sticker V2

Sticker V2 dibuat dengan beberapa tujuan utama.

🚀 Performa Tinggi

Seluruh proses harus berjalan secepat mungkin.

Target utama:

- Image Sticker secepat mungkin.
- Smeme Image tetap cepat meskipun melakukan render teks.
- Video Sticker tetap stabil dengan waktu proses yang wajar.
- Mengurangi proses yang tidak diperlukan.
- Meminimalkan penggunaan disk dan operasi baca/tulis file.

---

🧩 Modular

Seluruh proses dipisahkan menjadi beberapa Engine.

Setiap Engine hanya memiliki satu tanggung jawab.

Contoh:

- Engine gambar hanya menangani gambar.
- Engine video hanya menangani video.
- Engine font hanya menangani font.
- Engine emoji hanya menangani emoji.
- Engine cache hanya menangani cache.

Dengan demikian setiap bagian dapat diperbarui tanpa memengaruhi bagian lainnya.

---

⚡ Mudah Dikembangkan

Penambahan fitur baru tidak boleh mengubah struktur lama.

Contoh fitur yang nantinya dapat ditambahkan:

- Quote Sticker
- Circle Sticker
- AI Sticker
- Remove Background
- Crop Sticker
- Animated Sticker
- Watermark Sticker
- Telegram Style Sticker

Seluruh fitur tersebut cukup dibuat sebagai Engine baru tanpa mengubah sistem utama.

---

🛡 Stabil

Seluruh proses harus memiliki penanganan error yang baik.

Target utama:

- Tidak mudah crash.
- Tidak menghasilkan file sementara yang tertinggal.
- Tidak terjadi memory leak.
- Tidak terjadi proses yang menggantung.
- Seluruh resource dilepas setelah selesai digunakan.

---

📚 Mudah Dipahami

Setiap file hanya memiliki satu fungsi utama.

Developer lain dapat memahami struktur proyek tanpa harus membaca ribuan baris kode.

---

3. Filosofi Sticker V2

Sticker V2 dibangun berdasarkan beberapa prinsip utama.

Single Responsibility

Satu file hanya memiliki satu tugas.

Contoh:

- Font hanya mengurus font.
- FFmpeg hanya mengurus FFmpeg.
- Cache hanya mengurus cache.

Tidak ada file yang mengerjakan banyak hal sekaligus.

---

Reusable

Engine yang dibuat harus dapat digunakan oleh fitur lain.

Contoh:

Canvas Engine tidak hanya digunakan oleh Smeme.

Tetapi juga dapat digunakan oleh:

- Quote Sticker
- Welcome Card
- Rank Card
- Profile Card
- Dan fitur render lainnya.

---

Independent

Setiap Engine harus dapat bekerja secara mandiri.

Jika suatu Engine diperbarui, Engine lain tidak perlu ikut diubah.

---

Maintainable

Kode harus mudah dirawat.

Apabila ditemukan bug, lokasi perbaikannya langsung diketahui berdasarkan tugas Engine tersebut.

---

4. Target Besar Sticker V2

Sticker V2 bukan hanya melakukan refactor.

Sticker V2 adalah pembangunan ulang sistem Sticker menjadi sebuah modul yang lebih profesional.

Target akhirnya adalah:

- Lebih cepat.
- Lebih ringan.
- Lebih stabil.
- Lebih mudah dikembangkan.
- Lebih mudah dipelihara.

---

5. Tanpa API Eksternal

Seluruh proses dilakukan secara lokal.

Sticker V2 tidak bergantung pada API pihak ketiga.

Semua proses dilakukan langsung oleh bot menggunakan library lokal.

Keuntungan pendekatan ini:

- Tidak bergantung pada koneksi internet.
- Tidak bergantung pada server pihak ketiga.
- Tidak ada risiko API mati.
- Tidak ada batas request.
- Waktu proses lebih stabil.
- Seluruh optimasi berada dalam kendali penuh.

Seluruh proses mulai dari membaca media hingga menghasilkan sticker dilakukan secara lokal.

---

6. Struktur Arsitektur Baru

Mulai versi ini, "sticker.js" tidak lagi menjadi tempat seluruh logika.

"sticker.js" berubah menjadi pusat pengatur (Orchestrator).

Seluruh pekerjaan dipindahkan ke Engine yang memiliki tanggung jawab masing-masing.

Secara konsep, alurnya menjadi:

Command
    │
    ▼
sticker.js
    │
    ├── Memilih Engine yang sesuai
    ├── Mengatur urutan proses
    ├── Menangani validasi awal
    └── Mengembalikan hasil akhir

Dengan cara ini "sticker.js" tetap kecil, mudah dibaca, dan hanya bertugas mengatur alur.

---

7. Konsep Engine

Setiap Engine adalah modul yang memiliki satu tanggung jawab.

Contohnya:

- Image Engine
- Video Engine
- Canvas Engine
- FFmpeg Engine
- Cache Engine
- Cleanup Engine
- Temp Engine
- Font Engine
- Emoji Engine
- WebP Engine
- Exif Engine

Seluruh Engine saling bekerja sama tetapi tidak saling bergantung secara langsung.

Komunikasi dilakukan melalui "sticker.js".

---

8. Alur Umum Sticker V2

Secara umum seluruh proses akan mengikuti pola berikut:

WhatsApp
    │
    ▼
Download Media
    │
    ▼
Buffer
    │
    ▼
Sticker Engine
    │
    ├── Validasi
    ├── Deteksi Media
    ├── Pemrosesan
    ├── Optimasi
    ├── Konversi
    ├── Metadata
    └── Finalisasi
    │
    ▼
Sticker Buffer
    │
    ▼
WhatsApp

Setiap jenis media hanya akan menggunakan Engine yang diperlukan.

Engine yang tidak digunakan tidak akan dijalankan.

---

9. Standar Pengembangan

Seluruh pengembangan Sticker V2 wajib mengikuti aturan berikut:

- Tidak membuat fungsi dengan banyak tanggung jawab.
- Tidak melakukan duplikasi kode.
- Mengutamakan penggunaan Buffer dibanding file sementara jika memungkinkan.
- Mengutamakan pemrosesan lokal.
- Menghindari proses yang tidak diperlukan.
- Selalu mempertimbangkan performa sebelum menambah fitur.
- Seluruh fitur baru harus mengikuti arsitektur Engine.
- Kompatibilitas dengan sistem lama tetap dijaga selama memungkinkan.

---

10. Penutup Part 1

Part ini berfungsi sebagai pondasi dari seluruh Sticker V2.

Part berikutnya akan mulai membahas struktur folder baru, Engine yang akan dibuat, hubungan antar Engine, serta pembagian tugas masing-masing modul secara rinci sebelum implementasi dimulai.

(perubahan text untuk penjelasan part 2)

# 📦 Sticker Upgrade V2 — Part 2A
# Struktur Folder & Pembagian Engine

> Status : Draft Arsitektur
>
> Part ini menjelaskan bagaimana struktur baru Sticker V2 akan dibangun beserta alasan dari setiap perubahan. Fokus utama pada part ini adalah pembagian tanggung jawab setiap modul agar sistem menjadi jauh lebih rapi, mudah dikembangkan, serta memiliki performa yang lebih baik dibandingkan versi sebelumnya.

---

# 1. Kondisi Saat Ini

Saat ini sistem Sticker masih memiliki struktur yang cukup sederhana.

```
musume/
└── sticker/
    ├── fonts/
    │   ├── impact.ttf
    │   ├── ImpactRegular.otf
    │   └── anton.ttf
    │
    ├── smeme.js
    ├── stickermeme.json
    └── STICKER_UPGRADE.md
```

Untuk kebutuhan saat ini struktur tersebut masih dapat digunakan, namun mulai memiliki beberapa keterbatasan ketika fitur Sticker semakin berkembang.

Beberapa proses yang berbeda masih berada dalam satu file sehingga tanggung jawab antar fitur mulai bercampur.

Contohnya:

- Rendering gambar.
- Rendering teks.
- Font.
- Canvas.
- Metadata.
- Sharp.
- Konversi gambar.

Seluruh proses tersebut masih saling berhubungan di dalam file yang sama.

Dalam jangka panjang kondisi ini akan membuat proses maintenance menjadi semakin sulit.

Karena itulah Sticker V2 akan memulai proses pemisahan seluruh tanggung jawab menjadi beberapa Engine yang berdiri sendiri.

---

# 2. Tujuan Perubahan Struktur

Perubahan struktur folder bukan sekadar memindahkan file.

Tujuan utama Sticker V2 adalah membangun sebuah sistem Sticker yang benar-benar modular.

Beberapa target utamanya adalah:

- Mempermudah proses maintenance.
- Mempermudah debugging.
- Mempermudah optimasi performa.
- Mempermudah penambahan fitur baru.
- Mengurangi duplikasi kode.
- Mengurangi ketergantungan antar modul.
- Mempermudah proses pengembangan dalam jangka panjang.

Dengan struktur yang baru, setiap file hanya akan mengerjakan satu tugas utama.

---

# 3. Struktur Folder Baru

Target struktur Sticker V2 adalah sebagai berikut.

```
musume/
└── sticker/
    ├── sticker.js
    ├── smeme.js
    ├── stickermeme.json
    ├── STICKER_UPGRADE.md
    │
    ├── fonts/
    │   ├── impact.ttf
    │   └── anton.ttf
    │
    └── stickerEngine/
        ├── index.js
        ├── imageEngine.js
        ├── videoEngine.js
        ├── canvasEngine.js
        ├── ffmpegEngine.js
        ├── webpEngine.js
        ├── exifEngine.js
        ├── mediaEngine.js
        ├── metadataEngine.js
        ├── textEngine.js
        ├── fontEngine.js
        ├── emojiEngine.js
        ├── cacheEngine.js
        ├── tempEngine.js
        ├── cleanupEngine.js
        └── workerEngine.js
```

Tidak semua Engine wajib dibuat sekaligus.

Engine dapat ditambahkan secara bertahap selama tetap mengikuti struktur Sticker V2.

---

# 4. sticker.js

Mulai Sticker V2, `sticker.js` berubah total.

File ini **bukan lagi tempat seluruh logika Sticker berada.**

Mulai versi ini, sticker.js hanya menjadi pusat pengatur seluruh proses.

Tugas utama sticker.js adalah:

- menerima request dari command;
- membaca jenis media;
- menentukan jalur proses;
- memilih Engine yang sesuai;
- mengatur urutan proses;
- mengembalikan hasil akhir.

Dengan demikian ukuran file sticker.js akan tetap kecil meskipun nantinya jumlah fitur Sticker terus bertambah.

Sticker.js tidak boleh lagi berisi kode rendering ataupun kode FFmpeg secara langsung.

---

# 5. Konsep Sticker Engine

Seluruh fitur Sticker akan dijalankan menggunakan sistem Engine.

Engine merupakan modul kecil yang hanya mempunyai satu tanggung jawab.

Setiap Engine hanya mengurus bidangnya masing-masing.

Contohnya:

Image Engine hanya mengurus gambar.

Video Engine hanya mengurus video.

Text Engine hanya mengurus teks.

Emoji Engine hanya mengurus emoji.

Cache Engine hanya mengurus cache.

Dengan cara ini setiap Engine dapat diperbarui tanpa memengaruhi Engine lainnya.

---

# 6. Aturan Engine

Seluruh Engine wajib mengikuti beberapa aturan berikut.

## Single Responsibility

Satu Engine hanya memiliki satu tugas utama.

Tidak boleh mengerjakan tugas Engine lain.

Sebagai contoh:

Image Engine tidak boleh mengurus Font.

Font Engine tidak boleh mengurus FFmpeg.

FFmpeg Engine tidak boleh mengurus Metadata.

Metadata Engine tidak boleh mengurus Canvas.

Dengan aturan ini struktur proyek akan tetap bersih meskipun nantinya jumlah Engine semakin banyak.

---

## Independent

Seluruh Engine harus dapat bekerja secara mandiri.

Perubahan pada satu Engine tidak boleh memaksa perubahan pada Engine lainnya.

Setiap Engine hanya berkomunikasi melalui sticker.js.

---

## Reusable

Seluruh Engine harus dapat digunakan oleh fitur lain.

Sebagai contoh:

Canvas Engine nantinya tidak hanya dipakai oleh Smeme.

Namun juga dapat digunakan oleh:

- Quote Sticker
- Welcome Card
- Rank Card
- Profile Card
- Thumbnail Generator
- Dan seluruh fitur lain yang membutuhkan proses rendering.

---

# 7. Pembagian Engine

## Image Engine

Image Engine bertanggung jawab terhadap seluruh Sticker berbasis gambar.

Engine ini nantinya menangani:

- PNG
- JPG
- JPEG
- WEBP Static

Seluruh proses resize, crop, rotate, flip, normalisasi ukuran, serta optimasi gambar dilakukan pada Engine ini.

Engine lain tidak perlu mengetahui bagaimana gambar diproses.

Mereka hanya menerima hasil akhirnya.

---

## Video Engine

Video Engine hanya bertugas mengurus media video.

Engine ini menangani:

- MP4
- MOV
- WEBM
- Video WhatsApp

Beberapa proses yang berada di dalamnya antara lain:

- pengecekan durasi;
- normalisasi ukuran;
- FPS;
- persiapan FFmpeg;
- validasi media.

Seluruh proses video dipusatkan di sini agar tidak tersebar pada banyak file.

---

## Canvas Engine

Canvas Engine merupakan pusat rendering seluruh gambar berbasis Canvas.

Engine ini digunakan oleh:

- Smeme
- Quote Sticker
- Welcome Card
- Rank Card
- Profile Card
- Generator gambar lainnya.

Canvas Engine hanya bertugas melakukan rendering.

Engine ini tidak mengurus metadata maupun konversi Sticker.

---

## Text Engine

Seluruh algoritma teks dipindahkan menuju Engine ini.

Meliputi:

- Wrap Text.
- Auto Font Size.
- Line Height.
- Stroke.
- Shadow.
- Alignment.
- Padding.
- Smart Position.
- Break Long Word.

Dengan begitu seluruh fitur dapat menggunakan algoritma teks yang sama tanpa perlu membuat ulang fungsi serupa.

---

## Font Engine

Font Engine bertanggung jawab terhadap seluruh proses yang berhubungan dengan font.

Mulai Sticker V2, seluruh proses registrasi font tidak lagi berada di `smeme.js`.

Semua proses dipindahkan ke Font Engine agar dapat digunakan kembali oleh seluruh fitur yang membutuhkan rendering teks.

Beberapa tanggung jawab Font Engine antara lain:

- Registrasi font.
- Cache font.
- Validasi font.
- Fallback font.
- Load font.
- Font Family.
- Font Weight.
- Font Style.

Dengan pendekatan ini, apabila suatu saat ditambahkan font baru, cukup dilakukan pada Font Engine tanpa mengubah Engine lainnya.

---

## Emoji Engine

Emoji Engine merupakan Engine khusus yang menangani seluruh proses emoji.

Target utama Sticker V2 adalah mendukung emoji Unicode secara penuh.

Engine ini akan bertugas:

- Mendeteksi emoji.
- Memisahkan emoji dari teks biasa.
- Melakukan rendering emoji.
- Menggabungkan emoji dengan teks.
- Cache hasil render emoji.
- Fallback apabila emoji gagal dirender.

Apabila suatu Sticker tidak menggunakan emoji, maka Emoji Engine tidak dijalankan sehingga tidak memengaruhi performa.

Pendekatan ini menjaga agar Sticker biasa tetap memiliki kecepatan maksimal.

---

## Metadata Engine

Metadata Engine bertanggung jawab membaca seluruh informasi media.

Contohnya:

- Width
- Height
- Format
- Orientation
- Alpha Channel
- MIME Type
- Frame Count
- Duration
- FPS

Seluruh proses pembacaan metadata hanya dilakukan satu kali.

Hasil metadata kemudian dibagikan kepada Engine lain sehingga tidak perlu membaca media berulang kali.

Pendekatan ini mengurangi proses I/O dan meningkatkan performa.

---

## FFmpeg Engine

FFmpeg Engine merupakan pusat seluruh proses video.

Engine ini bertanggung jawab terhadap:

- Encode.
- Decode.
- Resize Video.
- Trim.
- FPS.
- Filter.
- Drawtext.
- Animated Sticker.
- Timeout Process.
- Kill Process.
- Error Recovery.

Seluruh pemanggilan FFmpeg harus dilakukan melalui Engine ini.

Tidak diperbolehkan memanggil FFmpeg secara langsung dari Sticker Engine lain.

Dengan demikian seluruh konfigurasi FFmpeg berada pada satu tempat.

---

## WebP Engine

WebP Engine bertanggung jawab terhadap seluruh proses konversi menuju format WebP.

Engine ini menangani:

- Static Sticker.
- Animated Sticker.
- Optimasi ukuran.
- Optimasi kualitas.
- Optimasi encoding.

Engine lain cukup memberikan Buffer hasil akhir.

Seluruh proses WebP akan dilakukan oleh Engine ini.

---

## Exif Engine

Exif Engine hanya bertugas menyisipkan metadata Sticker.

Contohnya:

- Packname.
- Author.
- Sticker Categories.
- Metadata WhatsApp.

Dengan pemisahan ini, perubahan metadata tidak akan memengaruhi proses rendering maupun konversi gambar.

---

## Cache Engine

Cache Engine bertanggung jawab terhadap seluruh cache Sticker.

Contoh cache yang akan digunakan:

- Font Cache.
- Emoji Cache.
- Measure Text Cache.
- Fit Font Cache.
- Metadata Cache.
- Render Cache.
- Image Cache.

Cache dibuat agar proses yang sama tidak perlu dihitung ulang.

Namun seluruh cache wajib memiliki batas ukuran agar penggunaan RAM tetap stabil.

---

## Temp Engine

Temp Engine bertanggung jawab terhadap seluruh file sementara.

Engine ini hanya digunakan apabila suatu proses memang membutuhkan file fisik.

Selama proses masih dapat menggunakan Buffer, Temp Engine tidak akan digunakan.

Apabila Temp Engine digunakan, maka seluruh file yang dibuat wajib didaftarkan ke Cleanup Engine.

---

## Cleanup Engine

Cleanup Engine bertanggung jawab membersihkan seluruh resource setelah proses selesai.

Target utama Engine ini adalah memastikan tidak ada file sementara yang tertinggal.

Urutan kerjanya adalah sebagai berikut:

1. File Temporary dibuat.
2. File digunakan.
3. Proses selesai.
4. File langsung dihapus.

Apabila proses berhenti secara tidak normal, Cleanup Engine akan melakukan pembersihan otomatis berdasarkan TTL yang telah ditentukan.

Dengan demikian tidak akan terjadi penumpukan file sampah pada penyimpanan.

---

## Worker Engine

Worker Engine digunakan untuk pekerjaan berat.

Contohnya:

- Video panjang.
- Animated Sticker.
- Rendering Canvas yang kompleks.
- Rendering Emoji dalam jumlah besar.

Seluruh proses berat akan dipindahkan ke Worker Thread sehingga Main Thread tetap responsif.

Pendekatan ini menjaga agar bot tetap dapat menerima pesan lain ketika proses Sticker sedang berlangsung.

---

# 8. Hubungan Antar Engine

Seluruh Engine saling bekerja sama, namun tidak saling bergantung secara langsung.

Seluruh komunikasi dilakukan melalui `sticker.js`.

Diagram sederhananya sebagai berikut.

```
Command
    │
    ▼
sticker.js
    │
    ├── Media Engine
    ├── Image Engine
    ├── Video Engine
    ├── Smeme Engine
    ├── Canvas Engine
    ├── WebP Engine
    ├── Exif Engine
    ├── Cleanup Engine
    └── Return Buffer
```

Dengan pendekatan ini setiap Engine tetap independen namun tetap dapat digunakan secara bersamaan.

---

# 9. Alur Sticker Image

```
Image
   │
   ▼
Download Buffer
   │
   ▼
Metadata Engine
   │
   ▼
Image Engine
   │
   ▼
WebP Engine
   │
   ▼
Exif Engine
   │
   ▼
Cleanup Engine
   │
   ▼
Sticker Buffer
```

Seluruh proses dilakukan menggunakan Buffer selama memungkinkan.

Penggunaan file sementara hanya dilakukan apabila benar-benar dibutuhkan.

---

# 10. Alur Sticker Video

```
Video
   │
   ▼
Download Buffer
   │
   ▼
Metadata Engine
   │
   ▼
Video Engine
   │
   ▼
FFmpeg Engine
   │
   ▼
WebP Engine
   │
   ▼
Exif Engine
   │
   ▼
Cleanup Engine
   │
   ▼
Sticker Buffer
```

Video Engine bertanggung jawab melakukan validasi sebelum FFmpeg dijalankan.

---

# 11. Alur Smeme

```
Image / Video
      │
      ▼
Metadata Engine
      │
      ▼
Canvas Engine
      │
      ▼
Text Engine
      │
      ▼
Font Engine
      │
      ▼
Emoji Engine (Opsional)
      │
      ▼
Render PNG
      │
      ▼
WebP Engine
      │
      ▼
Exif Engine
      │
      ▼
Cleanup Engine
      │
      ▼
Sticker Buffer
```

Apabila teks tidak mengandung emoji, Emoji Engine akan dilewati sehingga proses rendering tetap cepat.

---

# 12. Catatan Penting

Seluruh Engine pada Sticker V2 dirancang agar dapat digunakan kembali oleh fitur lain.

Sebagai contoh, apabila di masa mendatang ditambahkan fitur seperti Quote Sticker, Brat Sticker, Welcome Card, Rank Card, atau generator gambar lainnya, fitur tersebut cukup memanfaatkan Engine yang sudah tersedia tanpa membuat ulang sistem dari awal.

Pendekatan ini mengurangi duplikasi kode dan menjaga konsistensi perilaku seluruh fitur Sticker.

---

# Penutup Part 2

Pada Part 2 telah dijelaskan struktur folder baru beserta pembagian tanggung jawab masing-masing Engine.

Mulai Part 3, pembahasan akan difokuskan pada **Smeme V2**, yang merupakan perubahan terbesar pada Sticker Upgrade.

Smeme V2 tidak hanya mengalami refactor, tetapi juga akan mendapatkan peningkatan algoritma rendering teks, dukungan media yang lebih luas, peningkatan kualitas visual, optimasi performa, serta arsitektur baru yang memanfaatkan seluruh Engine pada Sticker V2.


# 📦 Sticker Upgrade V2 — Part 3A
# Smeme V2 — Konsep & Tujuan

> Status : Draft Arsitektur Smeme V2

Part ini membahas perubahan terbesar pada Sticker Upgrade V2, yaitu pembangunan ulang sistem Smeme.

Smeme bukan lagi sekadar fitur penambah teks pada gambar, melainkan sebuah Engine yang dibangun di atas Sticker Engine sehingga dapat memanfaatkan seluruh sistem yang telah dibuat sebelumnya.

---

# 1. Latar Belakang

Pada versi sebelumnya, Smeme hanya berfungsi untuk membuat Sticker Meme menggunakan gambar.

Walaupun hasilnya sudah cukup baik, masih terdapat beberapa keterbatasan.

Contohnya:

- Hanya mendukung gambar.
- Seluruh proses berada dalam satu file.
- Registrasi font masih berada di dalam Smeme.
- Algoritma ukuran font belum optimal.
- Hasil teks kadang terlalu kecil.
- Emoji belum didukung.
- Belum memiliki sistem cache.
- Belum menggunakan Engine bersama.

Semakin banyak fitur yang ditambahkan, file Smeme menjadi semakin besar dan sulit dirawat.

Karena itu Smeme akan dibangun ulang mengikuti standar Sticker V2.

---

# 2. Tujuan Smeme V2

Smeme V2 memiliki beberapa tujuan utama.

## Rendering Lebih Cepat

Seluruh proses rendering harus dilakukan secepat mungkin.

Target utama:

- Mengurangi proses yang tidak diperlukan.
- Mengurangi resize berulang.
- Mengurangi pembacaan metadata berulang.
- Mengurangi alokasi object.
- Mengurangi penggunaan file temporary.
- Mengutamakan penggunaan Buffer.

---

## Hasil Lebih Natural

Target Smeme bukan sekadar menghasilkan teks.

Target utamanya adalah menghasilkan Sticker Meme yang terlihat seperti dibuat secara manual.

Artinya:

- Font besar.
- Mudah dibaca.
- Tidak terlalu kecil.
- Tidak terlalu rapat.
- Tidak terlalu jauh.
- Posisi lebih natural.

---

## Mendukung Lebih Banyak Media

Versi sebelumnya hanya mendukung gambar.

Smeme V2 ditargetkan mampu bekerja pada:

- JPG
- JPEG
- PNG
- WEBP
- Static Sticker
- Animated Sticker
- GIF
- Video WhatsApp
- MP4
- MOV
- WEBM

Dengan demikian pengguna cukup menggunakan satu command tanpa perlu memikirkan jenis media.

---

## Menggunakan Sticker Engine

Smeme tidak lagi bekerja sendiri.

Seluruh proses akan menggunakan Engine yang telah tersedia.

Contohnya:

- Font Engine
- Canvas Engine
- Metadata Engine
- Cache Engine
- Cleanup Engine
- WebP Engine
- Exif Engine

Smeme hanya bertugas mengatur proses rendering.

---

# 3. Perubahan Besar

Smeme V2 bukan sekadar optimasi.

Melainkan pembangunan ulang.

Perubahan utama antara lain:

- Arsitektur baru.
- Rendering baru.
- Sistem font baru.
- Sistem emoji baru.
- Sistem cache baru.
- Dukungan video.
- Dukungan animated sticker.
- Optimasi Buffer.
- Optimasi Canvas.
- Optimasi Sharp.
- Optimasi FFmpeg.

---

# 4. Perubahan Fungsi Smeme

Pada versi sebelumnya Smeme memiliki tanggung jawab yang cukup banyak.

Mulai Sticker V2 tanggung jawab tersebut dipersempit.

Smeme hanya bertanggung jawab terhadap:

- menerima media;
- menerima teks atas;
- menerima teks bawah;
- meminta Engine melakukan rendering;
- menerima hasil render;
- mengembalikan hasil akhir.

Selain proses di atas seluruh pekerjaan dipindahkan menuju Engine yang sesuai.

---

# 5. Alur Baru Smeme

Alur kerja Smeme berubah menjadi lebih sederhana.

```
Reply Media
      │
      ▼
Command .smeme
      │
      ▼
sticker.js
      │
      ▼
smeme.js
      │
      ▼
Sticker Engine
      │
      ▼
Return Sticker
```

Smeme tidak lagi menangani seluruh proses sendirian.

---

# 6. Filosofi Smeme V2

Seluruh pengembangan Smeme mengikuti beberapa prinsip.

## Cepat

Seluruh proses harus selesai secepat mungkin.

---

## Stabil

Tidak boleh menghasilkan crash.

---

## Modular

Seluruh fitur dipisahkan ke Engine.

---

## Mudah Dikembangkan

Penambahan fitur baru tidak boleh merusak struktur lama.

---

## Reusable

Seluruh algoritma yang dibuat harus dapat digunakan kembali oleh fitur lain.

Sebagai contoh:

Algoritma font tidak hanya dipakai Smeme.

Tetapi juga dapat digunakan oleh:

- Quote Sticker.
- Welcome Card.
- Rank Card.
- Thumbnail Generator.
- Dan seluruh fitur render lainnya.

---

# 7. Target Akhir

Smeme V2 ditargetkan menjadi sistem render Sticker paling lengkap di dalam proyek.

Target akhirnya adalah:

✅ Lebih cepat.

✅ Lebih ringan.

✅ Lebih stabil.

✅ Hasil lebih rapi.

✅ Mendukung gambar.

✅ Mendukung video.

✅ Mendukung emoji.

✅ Mudah dikembangkan.

✅ Menggunakan seluruh Engine Sticker V2.

---

# Penutup Part 3A

Part selanjutnya akan membahas bagaimana struktur internal Smeme V2 dibangun, Engine apa saja yang digunakan, pembagian tugas masing-masing modul, serta bagaimana seluruh proses rendering berlangsung dari awal hingga Sticker selesai dibuat.

# 📦 Sticker Upgrade V2 — Part 3B
# Arsitektur Internal Smeme V2

> Status : Draft Arsitektur Internal

Part ini menjelaskan bagaimana Smeme V2 bekerja di dalam sistem Sticker V2.

Mulai versi ini Smeme tidak lagi menjadi sebuah file besar yang menangani seluruh proses rendering sendiri.

Smeme berubah menjadi sebuah modul yang memanfaatkan seluruh Engine Sticker V2.

---

# 1. Filosofi Baru Smeme

Pada versi sebelumnya seluruh proses berada di dalam satu file.

Mulai dari:

- Membaca gambar.
- Resize.
- Registrasi Font.
- Rendering Canvas.
- Perhitungan ukuran font.
- Wrap Text.
- Stroke.
- Shadow.
- Posisi teks.

Seluruh proses tersebut berada di dalam `smeme.js`.

Cara tersebut masih dapat digunakan, namun kurang ideal ketika ukuran proyek mulai berkembang.

Smeme V2 mengubah seluruh pendekatan tersebut.

Mulai versi ini Smeme hanya menjadi pengatur proses rendering.

Seluruh pekerjaan berat dipindahkan menuju Engine yang memang dibuat khusus untuk tugas tersebut.

---

# 2. Smeme Tidak Lagi Berdiri Sendiri

Mulai Sticker V2, Smeme bukan lagi sistem yang berdiri sendiri.

Smeme akan menggunakan seluruh Engine yang telah tersedia.

Sebagai contoh:

```
Smeme
   │
   ├── Metadata Engine
   ├── Font Engine
   ├── Text Engine
   ├── Canvas Engine
   ├── Emoji Engine
   ├── Cache Engine
   ├── Cleanup Engine
   ├── WebP Engine
   └── Exif Engine
```

Dengan demikian Smeme tidak perlu lagi membuat ulang fungsi yang sebenarnya sudah dimiliki oleh Engine lain.

---

# 3. Pembagian Tanggung Jawab

Mulai versi ini Smeme hanya memiliki beberapa tanggung jawab.

Yaitu:

- menerima media;
- menerima teks atas;
- menerima teks bawah;
- menentukan mode render;
- meminta bantuan Engine;
- mengembalikan hasil akhir.

Selain proses tersebut seluruh pekerjaan dipindahkan ke Engine.

Hal ini membuat ukuran `smeme.js` menjadi jauh lebih kecil dibanding versi sebelumnya.

---

# 4. Alur Baru Rendering

Secara umum proses Smeme akan menjadi seperti berikut.

```
Reply Media
      │
      ▼
Download Buffer
      │
      ▼
Metadata Engine
      │
      ▼
Validasi Media
      │
      ▼
Canvas Engine
      │
      ▼
Text Engine
      │
      ▼
Emoji Engine (Opsional)
      │
      ▼
Render PNG
      │
      ▼
WebP Engine
      │
      ▼
Exif Engine
      │
      ▼
Cleanup Engine
      │
      ▼
Sticker
```

Urutan tersebut berlaku untuk seluruh media gambar.

Sedangkan video memiliki alur tersendiri yang akan dijelaskan pada part berikutnya.

---

# 5. Dukungan Media

Target Smeme V2 adalah menggunakan satu command untuk seluruh media.

Contohnya:

```
.smeme atas|bawah
```

Command tersebut diharapkan dapat digunakan pada:

- JPG
- JPEG
- PNG
- WEBP
- Sticker
- GIF
- MP4
- MOV
- WEBM
- Video WhatsApp

Pengguna tidak perlu mengetahui bagaimana media diproses.

Seluruh proses akan dipilih secara otomatis oleh Sticker Engine.

---

# 6. Deteksi Media Otomatis

Smeme tidak lagi memaksa seluruh media diproses dengan cara yang sama.

Engine akan mendeteksi media terlebih dahulu.

Sebagai contoh:

```
Image
```

langsung menuju Image Pipeline.

Sedangkan

```
Video
```

langsung menuju Video Pipeline.

Begitu pula Animated WebP.

Dengan cara ini proses menjadi lebih cepat karena setiap media menggunakan jalur yang paling sesuai.

---

# 7. Image Pipeline

Apabila media berupa gambar.

Proses yang dilakukan kurang lebih sebagai berikut.

```
Image
   │
   ▼
Metadata
   │
   ▼
Resize
   │
   ▼
Canvas
   │
   ▼
Render Text
   │
   ▼
PNG
   │
   ▼
WebP
   │
   ▼
Sticker
```

Pipeline ini dioptimalkan agar tidak melakukan resize maupun pembacaan metadata lebih dari satu kali.

---

# 8. Video Pipeline

Apabila media berupa video.

Pipeline berubah menjadi:

```
Video
   │
   ▼
Metadata
   │
   ▼
Validasi
   │
   ▼
FFmpeg
   │
   ▼
Animated WebP
   │
   ▼
Sticker
```

Rendering video tidak menggunakan jalur gambar.

Dengan demikian proses video tidak akan memperlambat proses image.

---

# 9. Buffer First

Salah satu perubahan terbesar pada Smeme V2 adalah penggunaan Buffer sebagai prioritas utama.

Selama suatu proses masih dapat dilakukan menggunakan Buffer, maka tidak boleh membuat file sementara.

Contohnya:

```
WhatsApp

↓

Buffer

↓

Sharp

↓

Canvas

↓

PNG Buffer

↓

WebP Buffer

↓

Sticker
```

Pendekatan ini jauh lebih cepat dibanding harus membuat file pada penyimpanan.

---

# 10. Temporary File

Walaupun Buffer menjadi prioritas utama, beberapa proses masih mungkin membutuhkan file sementara.

Contohnya:

- Video panjang.
- Animated Sticker.
- FFmpeg tertentu.

Pada kondisi tersebut Temp Engine akan digunakan.

Namun seluruh file temporary wajib didaftarkan ke Cleanup Engine.

Setelah proses selesai file langsung dihapus.

Apabila proses gagal maka Cleanup Engine akan membersihkannya menggunakan sistem TTL.

Dengan demikian tidak akan terjadi penumpukan file sampah.

---

# Penutup Part 3B

Part berikutnya akan mulai membahas algoritma terbesar pada Smeme V2, yaitu sistem rendering teks yang benar-benar baru.

Mulai dari algoritma ukuran font, Smart Wrap, Smart Position, Dynamic Stroke, Dynamic Padding, hingga sistem yang membuat hasil Smeme terlihat seperti dibuat secara manual namun tetap memiliki performa yang tinggi.

# 📦 Sticker Upgrade V2 — Part 3C
# Smart Rendering System

> Status : Draft Rendering Engine

Part ini menjelaskan sistem rendering baru pada Smeme V2.

Target utama sistem ini bukan hanya menghasilkan Sticker Meme, tetapi menghasilkan Sticker Meme dengan kualitas yang menyerupai meme yang dibuat secara manual.

Seluruh algoritma baru difokuskan pada tiga hal utama.

- Hasil yang lebih natural.
- Performa setinggi mungkin.
- Dapat digunakan kembali oleh fitur lain.

---

# 1. Permasalahan Smeme Lama

Pada Smeme versi sebelumnya terdapat beberapa permasalahan yang masih sering muncul.

Contohnya:

- Font terlalu kecil.
- Font terlalu cepat mengecil.
- Wrap Text kurang natural.
- Padding tidak mengikuti ukuran font.
- Stroke kurang proporsional.
- Posisi teks terkadang terlalu jauh dari tepi gambar.
- Hasil terlihat seperti teks yang ditempel, bukan meme yang dibuat secara manual.

Semua permasalahan tersebut akan diperbaiki pada Smeme V2.

---

# 2. Filosofi Rendering Baru

Smeme V2 tidak lagi memiliki target:

"Yang penting teks muat."

Melainkan memiliki target:

"Gunakan ukuran font terbesar yang masih terlihat bagus."

Artinya ukuran font menjadi prioritas utama.

Apabila teks belum muat maka sistem akan mencoba melakukan Wrap Text terlebih dahulu.

Ukuran font hanya akan diperkecil apabila seluruh kemungkinan Wrap Text sudah tidak mampu lagi mempertahankan ukuran font.

Dengan pendekatan tersebut hasil akhirnya akan jauh lebih natural.

---

# 3. Prioritas Rendering

Seluruh proses rendering memiliki urutan prioritas.

```
Ukuran Font

↓

Wrap Text

↓

Posisi

↓

Stroke

↓

Shadow

↓

Final Render
```

Selama ukuran font masih dapat dipertahankan, sistem tidak diperbolehkan langsung mengecilkan font.

---

# 4. Smart Font Algorithm

Algoritma baru menggunakan pendekatan berikut.

1. Menggunakan ukuran font terbesar.
2. Mengukur seluruh teks.
3. Apabila tidak muat:
   - lakukan Wrap Text.
4. Ukur kembali.
5. Apabila masih belum muat:
   - kecilkan font sedikit.
6. Ulangi hingga hasil terbaik ditemukan.

Target algoritma ini adalah mempertahankan ukuran font selama mungkin.

---

# 5. Smart Wrap

Wrap Text tidak lagi dilakukan secara sederhana.

Versi sebelumnya hanya memecah teks ketika panjang baris melebihi batas.

Pada Smeme V2 sistem akan mempertimbangkan:

- jumlah kata;
- panjang kata;
- panjang setiap baris;
- keseimbangan antar baris.

Target akhirnya adalah menghasilkan bentuk teks yang seimbang.

Contoh:

Kurang baik:

```
HALO TEMAN
YANG SANGAT
BAIK SEKALI
```

Lebih baik:

```
HALO
TEMAN YANG
SANGAT BAIK
SEKALI
```

Walaupun jumlah baris sama, bentuk kedua jauh lebih mudah dibaca.

---

# 6. Smart Position

Posisi teks juga mengalami perubahan.

Versi sebelumnya menggunakan nilai padding tetap.

Contohnya:

```
24 px
```

Pada Smeme V2 padding menjadi dinamis.

Semakin besar font maka padding ikut bertambah.

Semakin kecil font maka padding ikut mengecil.

Dengan demikian posisi teks akan selalu terlihat proporsional.

---

# 7. Dynamic Stroke

Stroke tidak lagi menggunakan ukuran tetap.

Pada Smeme V2 ukuran Stroke mengikuti ukuran font.

Contohnya:

```
Font 20

↓

Stroke kecil
```

Sedangkan:

```
Font 70

↓

Stroke lebih tebal
```

Hal ini membuat hasil akhir jauh lebih konsisten.

---

# 8. Dynamic Line Height

Jarak antar baris juga berubah.

Smeme lama menggunakan jarak yang relatif tetap.

Pada Smeme V2 tinggi antar baris dihitung berdasarkan ukuran font.

Dengan demikian teks besar tidak terlihat saling bertabrakan.

Sedangkan teks kecil tidak terlihat terlalu renggang.

---

# 9. Smart Padding

Padding atas maupun bawah dihitung ulang.

Bukan lagi angka tetap.

Beberapa faktor yang dipertimbangkan:

- ukuran font;
- jumlah baris;
- posisi gambar;
- tinggi canvas.

Pendekatan ini membuat teks selalu berada pada posisi yang nyaman dilihat.

---

# 10. Dynamic Canvas Rendering

Canvas tidak lagi melakukan pekerjaan yang tidak diperlukan.

Target baru adalah:

- hanya menggambar satu kali;
- tidak melakukan resize berulang;
- tidak membaca metadata berulang;
- tidak melakukan scaling berulang.

Semua proses berat dipindahkan ke Engine lain sebelum masuk ke Canvas.

Canvas hanya bertugas melakukan rendering.

---

# 11. Smart Rendering Pipeline

Pipeline baru menjadi:

```
Metadata

↓

Resize

↓

Canvas

↓

Smart Font

↓

Smart Wrap

↓

Smart Position

↓

Stroke

↓

Shadow

↓

PNG Buffer
```

Pipeline ini jauh lebih efisien dibanding versi sebelumnya.

---

# 12. Reusable Rendering

Seluruh algoritma yang dibuat pada Smeme tidak hanya digunakan oleh Smeme.

Target akhirnya seluruh algoritma rendering dapat digunakan kembali oleh:

- Quote Sticker.
- Brat Sticker.
- Welcome Card.
- Rank Card.
- Thumbnail Generator.
- Banner Generator.
- Dan seluruh fitur render lain.

Dengan demikian algoritma cukup dirawat pada satu tempat.

---

# 13. Target Akhir

Target utama Rendering Engine adalah:

✅ Font tetap besar.

✅ Wrap lebih natural.

✅ Stroke proporsional.

✅ Padding dinamis.

✅ Posisi lebih rapi.

✅ Hasil menyerupai meme buatan tangan.

✅ Tidak ada resize yang tidak diperlukan.

✅ Tidak ada proses rendering berulang.

✅ Siap digunakan oleh seluruh fitur render pada Sticker V2.

---

# Penutup Part 3C

Setelah sistem rendering selesai dirancang, tahap berikutnya adalah membahas dukungan Emoji, Video, Cache, serta seluruh optimasi performa yang menjadi fokus utama Smeme V2.

Part selanjutnya akan membahas bagaimana Smeme mampu mendukung media video, emoji Unicode berwarna, cache pintar, serta target performa agar Sticker tetap dapat dikirim secepat mungkin tanpa mengorbankan kualitas hasil render.

# 📦 Sticker Upgrade V2 — Part 3D
# Emoji, Video & Performance Engine

> Status : Draft Performance Architecture

Part ini membahas seluruh peningkatan besar yang akan dimiliki Smeme V2 selain sistem rendering.

Mulai dari dukungan Emoji Unicode, dukungan Video, sistem Cache baru, hingga berbagai optimasi yang bertujuan menghasilkan Sticker secepat mungkin tanpa mengurangi kualitas hasil render.

---

# 1. Tujuan Performance Smeme V2

Performa merupakan salah satu fokus utama pada Sticker Upgrade V2.

Target akhirnya bukan hanya menghasilkan Sticker yang bagus.

Namun juga menghasilkan Sticker dengan waktu proses yang sesingkat mungkin.

Seluruh optimasi dilakukan tanpa mengurangi kualitas visual.

---

# 2. Target Waktu Rendering

Target performa Smeme V2 dibagi berdasarkan jenis media.

## Image

Target rata-rata:

```
300 ms ~ 900 ms
```

Target maksimum:

```
< 1 Detik
```

---

## Image + Emoji

Target rata-rata:

```
700 ms ~ 2 Detik
```

Emoji memang membutuhkan proses rendering tambahan sehingga waktu proses akan sedikit meningkat.

Namun apabila media tidak mengandung Emoji maka seluruh proses Emoji akan dilewati.

---

## Video

Target rata-rata:

```
1 Detik ~ 3 Detik
```

Waktu tersebut bergantung pada:

- Durasi video.
- Resolusi.
- FPS.
- Performa perangkat.

---

# 3. Dukungan Emoji

Smeme V2 dirancang agar mampu mendukung Emoji Unicode.

Targetnya bukan sekadar menampilkan karakter Emoji.

Melainkan menghasilkan Emoji berwarna seperti yang terlihat pada aplikasi modern.

Engine Emoji nantinya bertanggung jawab terhadap:

- Deteksi Emoji.
- Parsing Unicode.
- Rendering Emoji.
- Cache Emoji.
- Penyusunan ulang posisi Emoji dengan teks.

---

# 4. Emoji Bersifat Opsional

Engine Emoji tidak selalu dijalankan.

Apabila teks tidak mengandung Emoji.

Maka seluruh proses berikut dilewati.

- Parsing Emoji.
- Rendering Emoji.
- Cache Emoji.

Dengan demikian performa Sticker biasa tetap berada pada tingkat maksimal.

---

# 5. Dukungan Video

Salah satu perubahan terbesar Smeme V2 adalah dukungan Video.

Target akhirnya adalah pengguna cukup menggunakan command yang sama.

Contoh:

```
.smeme Santai|Kawan
```

Command tersebut dapat digunakan pada:

- Image.
- Sticker.
- GIF.
- Video.

Smeme akan menentukan sendiri jalur proses yang sesuai.

---

# 6. Pipeline Video

Apabila media berupa Video.

Pipeline akan berubah menjadi:

```
Video

↓

Metadata

↓

Video Engine

↓

FFmpeg Engine

↓

Canvas Render

↓

Animated WebP

↓

Exif

↓

Sticker
```

Dengan demikian pengguna tidak perlu memikirkan proses konversi secara manual.

---

# 7. Target Render Video

Target utama Smeme Video bukan membuat efek yang kompleks.

Melainkan membuat Meme Sticker bergerak.

Karena itu proses render harus mengutamakan:

- Kecepatan.
- Stabilitas.
- Konsistensi.

Selama hasil akhir masih terlihat baik.

Performa harus menjadi prioritas.

---

# 8. Cache Rendering

Smeme V2 akan memiliki beberapa jenis Cache.

Contohnya:

- Font Cache.
- Measure Cache.
- Fit Font Cache.
- Emoji Cache.
- Metadata Cache.
- Image Cache.
- Render Cache.

Cache digunakan agar proses yang sama tidak perlu dihitung ulang.

Hal ini sangat membantu apabila pengguna menggunakan media yang sama berulang kali.

---

# 9. Cache Memiliki Batas

Seluruh Cache wajib memiliki batas penggunaan.

Apabila ukuran Cache melebihi batas yang ditentukan.

Cache lama akan dibersihkan secara otomatis.

Target utama:

- RAM tetap stabil.
- Tidak terjadi Memory Leak.
- Tidak terjadi penumpukan Cache.

---

# 10. Optimasi Sharp

Sharp tetap menjadi Engine utama untuk pemrosesan gambar.

Target optimasi meliputi:

- Resize hanya satu kali.
- Metadata hanya dibaca satu kali.
- Menghindari proses konversi berulang.
- Menggunakan SIMD apabila tersedia.
- Menggunakan Concurrency optimal.

Dengan demikian beban Canvas dapat dikurangi.

---

# 11. Optimasi Canvas

Canvas hanya digunakan untuk proses rendering.

Canvas tidak lagi bertanggung jawab terhadap:

- Resize.
- Metadata.
- Crop.
- Rotate.

Seluruh proses tersebut dilakukan sebelum media masuk ke Canvas.

Canvas cukup menerima gambar yang sudah siap dirender.

---

# 12. Optimasi FFmpeg

Seluruh konfigurasi FFmpeg dipusatkan pada FFmpeg Engine.

Target utama:

- Preset tercepat.
- Thread optimal.
- Timeout.
- Kill Process.
- Pipe apabila memungkinkan.
- Mengurangi penggunaan file sementara.

Dengan demikian proses Video Sticker dapat berjalan lebih cepat.

---

# 13. Prioritas Buffer

Buffer menjadi prioritas utama.

Selama suatu proses dapat dilakukan menggunakan Buffer.

Maka proses tersebut tidak boleh membuat file sementara.

Target pipeline:

```
WhatsApp

↓

Buffer

↓

Sharp

↓

Canvas

↓

PNG Buffer

↓

WebP Buffer

↓

Sticker
```

Pendekatan ini jauh lebih cepat dibanding proses berbasis file.

---

# 14. Temporary File

Temporary File hanya dibuat apabila benar-benar diperlukan.

Contohnya:

- FFmpeg tertentu.
- Animated WebP tertentu.
- Video yang membutuhkan proses tambahan.

Begitu proses selesai.

File langsung dihapus.

Apabila terjadi Crash.

Cleanup Engine akan menghapusnya menggunakan sistem TTL.

---

# 15. Worker Thread

Rendering Video maupun proses berat dapat dijalankan menggunakan Worker Thread.

Dengan demikian Main Thread tetap dapat menerima pesan lain.

Target akhirnya:

- Bot tetap responsif.
- Sticker tetap diproses.
- Tidak terjadi blocking pada Event Loop.

---

# 16. Zero Error Philosophy

Seluruh Engine wajib memiliki Error Handling.

Target utama bukan menyembunyikan Error.

Melainkan:

- Memberikan Error yang jelas.
- Membersihkan Resource.
- Menghapus Temporary File.
- Mengembalikan kondisi Engine seperti semula.

Dengan demikian satu proses gagal tidak akan memengaruhi proses Sticker lainnya.

---

# 17. Target Akhir Smeme V2

Setelah seluruh perubahan selesai.

Smeme V2 ditargetkan memiliki kemampuan berikut.

✅ Mendukung Image.

✅ Mendukung Sticker.

✅ Mendukung Video.

✅ Mendukung GIF.

✅ Mendukung Emoji Unicode.

✅ Rendering jauh lebih cepat.

✅ Font lebih besar.

✅ Layout lebih natural.

✅ Cache lebih pintar.

✅ Temporary File terkendali.

✅ Zero Memory Leak.

✅ Zero Resource Leak.

✅ Mudah dikembangkan.

✅ Memanfaatkan seluruh Sticker Engine V2.

---

# Penutup Part 3D

Dengan selesainya Part 3, rancangan besar Smeme V2 telah selesai dibahas.

Tahap berikutnya akan berfokus pada implementasi Sticker Engine secara menyeluruh, termasuk detail setiap Engine, alur komunikasi antar Engine, standar coding, strategi migrasi dari sistem lama, serta benchmark yang akan digunakan untuk memastikan seluruh fitur Sticker V2 berjalan sesuai target performa dan kualitas yang telah ditentukan.


# 📦 Sticker Upgrade V2 — Part 4
# Sticker Engine V2

> Status : Draft Sticker Engine

Part ini menjelaskan bagaimana Sticker Engine V2 bekerja sebagai pusat seluruh sistem Sticker.

Mulai versi ini seluruh fitur Sticker akan menggunakan satu Engine utama yang bertugas mengatur seluruh alur pemrosesan media.

Dengan pendekatan ini seluruh fitur dapat menggunakan pipeline yang sama tanpa perlu membuat ulang sistem dari awal.

---

# 1. Tujuan Sticker Engine

Sticker Engine merupakan inti dari seluruh sistem Sticker.

Engine ini bertanggung jawab mengatur seluruh proses mulai dari media diterima hingga Sticker selesai dibuat.

Sticker Engine bukan bertugas melakukan rendering.

Sticker Engine bertugas mengatur Engine lain.

Dengan demikian seluruh proses memiliki alur yang konsisten.

---

# 2. Perubahan Besar

Pada sistem sebelumnya beberapa fitur masih berjalan sendiri-sendiri.

Contohnya:

- Smeme memiliki pipeline sendiri.
- Sticker biasa memiliki pipeline sendiri.
- Animated Sticker memiliki pipeline sendiri.

Pada Sticker V2 seluruh fitur menggunakan satu pipeline utama.

Perbedaannya hanya Engine yang dipanggil.

---

# 3. Sticker.js

Mulai Sticker V2.

`sticker.js`

berubah menjadi pusat seluruh sistem.

File ini tidak lagi berisi proses:

- FFmpeg.
- Sharp.
- Canvas.
- Metadata.
- Font.
- Emoji.

Seluruh proses dipindahkan menuju Engine masing-masing.

Sticker.js hanya bertugas sebagai Orchestrator.

---

# 4. Tugas Sticker.js

Sticker.js hanya memiliki beberapa tugas.

- Validasi input.
- Membaca jenis media.
- Menentukan pipeline.
- Memanggil Engine.
- Menunggu hasil.
- Mengembalikan Buffer Sticker.

Selain itu seluruh pekerjaan dilakukan oleh Engine.

---

# 5. Pipeline Sticker

Secara umum seluruh Sticker mengikuti pipeline berikut.

```
Command

↓

Sticker.js

↓

Media Detection

↓

Pipeline Selection

↓

Engine

↓

WebP

↓

Exif

↓

Cleanup

↓

Sticker Buffer

↓

WhatsApp
```

Dengan demikian seluruh fitur memiliki alur yang sama.

---

# 6. Pipeline Berdasarkan Media

Sticker Engine akan memilih jalur terbaik berdasarkan media.

Image akan menggunakan Image Pipeline.

Video akan menggunakan Video Pipeline.

GIF akan menggunakan Animated Pipeline.

Smeme akan menggunakan Smeme Pipeline.

Pengguna tidak perlu memilih mode secara manual.

Seluruh proses dilakukan secara otomatis.

---

# 7. Modular Pipeline

Pipeline tidak dibuat secara tetap.

Pipeline akan disusun berdasarkan kebutuhan.

Sebagai contoh.

Sticker biasa.

```
Media

↓

Image Engine

↓

WebP

↓

Exif
```

Sedangkan Smeme.

```
Media

↓

Canvas

↓

Text

↓

Emoji (Opsional)

↓

WebP

↓

Exif
```

Dengan demikian Engine yang tidak diperlukan tidak akan dijalankan.

---

# 8. Buffer First

Sticker Engine menggunakan prinsip Buffer First.

Seluruh proses sebisa mungkin dilakukan menggunakan Buffer.

Target utama.

```
Buffer

↓

Buffer

↓

Buffer

↓

Sticker
```

Tanpa membuat file sementara.

File hanya dibuat apabila suatu proses memang tidak dapat dilakukan menggunakan Buffer.

---

# 9. Temporary File

Apabila Engine membutuhkan file.

Maka Temp Engine akan membuat file tersebut.

Setelah proses selesai.

Cleanup Engine akan langsung menghapus file.

TTL hanya menjadi sistem cadangan apabila proses berhenti secara tidak normal.

Dengan demikian tidak akan terjadi penumpukan file sampah.

---

# 10. Error Handling

Seluruh Engine wajib mengembalikan Error yang jelas.

Apabila terjadi Error.

Engine wajib:

- Membersihkan Resource.
- Menghapus Temporary File.
- Menghentikan Process.
- Mengembalikan Error ke Sticker.js.

Sticker.js hanya bertugas meneruskan Error tersebut kepada command.

---

# 11. Logging

Seluruh proses Sticker akan memiliki Logging internal.

Logging digunakan untuk:

- Debugging.
- Benchmark.
- Pengujian.
- Audit.

Logging tidak boleh mengganggu performa.

Mode Production dapat mematikan Logging tertentu.

---

# 12. Benchmark

Target Sticker Engine.

Image.

```
300 ms ~ 700 ms
```

Smeme.

```
500 ms ~ 1 Detik
```

Video.

```
1 ~ 3 Detik
```

Target tersebut bergantung pada spesifikasi perangkat.

Namun seluruh optimasi Sticker V2 akan diarahkan agar sedekat mungkin dengan target tersebut.

---

# 13. Kompatibilitas

Walaupun struktur berubah cukup besar.

Cara penggunaan dari command sebisa mungkin tetap dipertahankan.

Sebagai contoh.

```
.sticker
```

Tetap bekerja.

```
.smeme
```

Tetap bekerja.

Perubahan hanya terjadi pada sistem internal.

Dengan demikian seluruh command lama tetap dapat digunakan tanpa perubahan besar.

---

# 14. Tujuan Akhir Sticker Engine

Sticker Engine V2 dibangun agar menjadi fondasi seluruh sistem Sticker.

Target akhirnya adalah.

✅ Cepat.

✅ Modular.

✅ Stabil.

✅ Mudah dikembangkan.

✅ Mudah dirawat.

✅ Mudah diuji.

✅ Tidak bergantung pada API.

✅ Seluruh fitur menggunakan Engine yang sama.

---

# Penutup Part 4

Setelah Sticker Engine selesai dirancang.

Tahap berikutnya akan membahas sistem optimasi tingkat lanjut.

Mulai dari strategi Cache, Memory Management, Worker Thread, Buffer Management, hingga berbagai teknik optimasi yang digunakan agar Sticker V2 mampu mempertahankan performa tinggi meskipun jumlah fitur terus bertambah.


# 📦 Sticker Upgrade V2 — Part 5
# Performance Optimization & Resource Management

> Status : Draft Performance Design

Part ini menjelaskan seluruh strategi optimasi yang akan diterapkan pada Sticker V2.

Tujuan utama bukan sekadar membuat Sticker berjalan lebih cepat.

Namun juga memastikan seluruh proses tetap stabil, hemat resource, mudah dipelihara, dan mampu berjalan dalam waktu lama tanpa mengalami penurunan performa.

---

# 1. Filosofi Optimasi

Sticker V2 memiliki tiga target utama.

- Cepat.
- Ringan.
- Stabil.

Seluruh optimasi harus mengikuti prinsip tersebut.

Optimasi tidak boleh mengurangi kualitas Sticker.

Optimasi juga tidak boleh membuat struktur proyek menjadi sulit dipahami.

---

# 2. Buffer First

Seluruh proses akan mengutamakan penggunaan Buffer.

Selama suatu proses dapat dilakukan menggunakan Buffer.

Maka proses tersebut tidak diperbolehkan membuat file sementara.

Contoh pipeline.

```
WhatsApp

↓

Buffer

↓

Sharp

↓

Canvas

↓

WebP

↓

Buffer

↓

WhatsApp
```

Pendekatan ini mengurangi:

- I/O Storage.
- Waktu baca.
- Waktu tulis.
- Fragmentasi file.

Sekaligus meningkatkan performa secara keseluruhan.

---

# 3. Temporary File

Walaupun Buffer menjadi prioritas.

Masih terdapat beberapa proses yang membutuhkan file sementara.

Contohnya.

- Animated Sticker tertentu.
- Video panjang.
- Proses FFmpeg tertentu.

Pada kondisi tersebut.

Temp Engine akan membuat file sementara.

Namun setelah proses selesai.

Cleanup Engine wajib langsung menghapus file tersebut.

Apabila proses gagal.

Cleanup Engine akan menghapusnya menggunakan TTL.

Dengan demikian tidak akan terjadi penumpukan file sampah.

---

# 4. Cache System

Sticker V2 memiliki beberapa jenis Cache.

Diantaranya.

- Font Cache.
- Emoji Cache.
- Metadata Cache.
- Measure Cache.
- Fit Font Cache.
- Render Cache.
- Image Cache.
- WebP Cache.

Seluruh Cache dipusatkan pada Cache Engine.

Tidak diperbolehkan membuat Cache tersebar pada banyak file.

---

# 5. Cache Policy

Seluruh Cache wajib mengikuti beberapa aturan.

- Memiliki batas ukuran.
- Memiliki masa hidup.
- Mudah dibersihkan.
- Tidak menyebabkan Memory Leak.

Apabila Cache telah mencapai batas.

Cache lama akan dihapus secara otomatis.

Dengan demikian penggunaan RAM tetap stabil.

---

# 6. Metadata Optimization

Metadata media hanya boleh dibaca satu kali.

Informasi tersebut kemudian dibagikan kepada Engine lain.

Contohnya.

```
Metadata Engine

↓

Width

↓

Height

↓

Format

↓

Orientation

↓

Frame

↓

Duration

↓

Engine lain menggunakan hasil tersebut.
```

Pendekatan ini mengurangi proses pembacaan media yang berulang.

---

# 7. Sharp Optimization

Sharp menjadi Engine utama untuk pengolahan gambar.

Target optimasinya.

- Resize satu kali.
- Decode satu kali.
- Metadata satu kali.
- Tidak melakukan konversi berulang.
- SIMD aktif apabila tersedia.
- Concurrency mengikuti CPU.

Canvas hanya menerima hasil akhir dari Sharp.

---

# 8. Canvas Optimization

Canvas hanya bertugas melakukan rendering.

Canvas tidak lagi melakukan.

- Resize.
- Rotate.
- Crop.
- Metadata.

Semua proses tersebut dilakukan sebelum media masuk ke Canvas.

Hal ini membuat proses rendering jauh lebih ringan.

---

# 9. FFmpeg Optimization

Seluruh proses FFmpeg dipusatkan pada FFmpeg Engine.

Optimasi yang diterapkan antara lain.

- Preset tercepat.
- Thread optimal.
- Timeout otomatis.
- Kill Process otomatis.
- Pipe apabila memungkinkan.
- Mengurangi penggunaan file sementara.

Dengan demikian proses Video Sticker menjadi lebih stabil.

---

# 10. Memory Management

Sticker V2 harus mampu berjalan dalam waktu lama.

Karena itu seluruh penggunaan memori harus diawasi.

Target utama.

- Tidak ada Memory Leak.
- Tidak ada Buffer yang tertinggal.
- Tidak ada Object yang terus bertambah.
- Tidak ada Cache tanpa batas.

Setelah suatu proses selesai.

Seluruh Resource wajib dilepas.

---

# 11. Cleanup Strategy

Cleanup tidak hanya menghapus file.

Namun juga bertugas.

- Membersihkan Cache sementara.
- Membersihkan Worker.
- Membersihkan Process.
- Membersihkan Buffer yang tidak lagi digunakan.

Dengan demikian Engine selalu kembali ke kondisi siap digunakan.

---

# 12. Worker Thread

Worker Thread digunakan untuk pekerjaan berat.

Contohnya.

- Video.
- Animated Sticker.
- Render Emoji kompleks.
- Canvas besar.

Main Thread tetap digunakan untuk menerima pesan.

Dengan pendekatan ini bot tetap responsif meskipun sedang membuat Sticker.

---

# 13. Error Recovery

Apabila suatu Engine gagal.

Engine tersebut wajib.

- Menghentikan proses.
- Membersihkan Resource.
- Menghapus Temporary File.
- Mengembalikan Error yang jelas.

Engine lain tidak boleh ikut berhenti.

Targetnya adalah satu proses gagal tidak memengaruhi proses Sticker lainnya.

---

# 14. Benchmark Target

Target performa Sticker V2.

Image Sticker.

```
300 ~ 700 ms
```

Smeme Image.

```
500 ms ~ 1 Detik
```

Smeme Image + Emoji.

```
700 ms ~ 2 Detik
```

Video Sticker.

```
1 ~ 3 Detik
```

Target tersebut dapat berubah sesuai spesifikasi perangkat.

Namun seluruh optimasi akan diarahkan agar sedekat mungkin dengan angka tersebut.

---

# 15. Zero Leak Philosophy

Sticker V2 memiliki target khusus.

Setelah satu proses selesai.

Tidak boleh ada.

- Temporary File tertinggal.
- Worker yang masih berjalan.
- Buffer yang masih direferensikan.
- Cache liar.
- Process FFmpeg yang masih aktif.

Engine harus kembali ke kondisi bersih sebelum menerima pekerjaan berikutnya.

---

# 16. Future Optimization

Struktur Sticker V2 juga dipersiapkan untuk optimasi berikutnya.

Contohnya.

- Multi Thread Rendering.
- GPU Rendering apabila tersedia.
- SIMD tambahan.
- Smart Render Queue.
- Batch Rendering.
- Progressive Rendering.
- Shared Buffer.
- Persistent Cache.

Seluruh optimasi tersebut dapat ditambahkan tanpa mengubah struktur utama Sticker Engine.

---

# Penutup Part 5

Dengan seluruh strategi optimasi di atas.

Sticker V2 diharapkan mampu memberikan performa tinggi tanpa mengorbankan kualitas hasil Sticker.

Seluruh optimasi dilakukan secara lokal tanpa bergantung pada API pihak ketiga sehingga seluruh proses berada di bawah kendali penuh bot.


# 📦 Sticker Upgrade V2 — Part 6A
# Strategi Migrasi V1 → V2

> Status : Draft Migration Plan

Part ini menjelaskan bagaimana proses migrasi dari sistem Sticker lama menuju Sticker V2 dilakukan.

Migrasi dilakukan secara bertahap agar seluruh fitur tetap berjalan selama proses pengembangan berlangsung.

Target utama migrasi bukan sekadar memindahkan file.

Namun membangun ulang struktur internal tanpa merusak kompatibilitas command yang sudah ada.

---

# 1. Filosofi Migrasi

Migrasi dilakukan secara bertahap.

Tidak seluruh file diubah sekaligus.

Setiap tahap harus berada dalam kondisi yang dapat dijalankan.

Dengan demikian apabila terjadi bug, proses perbaikan menjadi jauh lebih mudah dibandingkan melakukan perubahan besar dalam satu waktu.

---

# 2. Prioritas Migrasi

Urutan migrasi harus mengikuti prioritas berikut.

1. Membangun struktur folder baru.
2. Membuat Sticker Engine.
3. Membuat Engine dasar.
4. Memindahkan fungsi lama.
5. Menghubungkan seluruh Engine.
6. Menghapus kode lama.
7. Melakukan optimasi.
8. Benchmark.
9. Audit.
10. Finalisasi.

Urutan tersebut tidak boleh dibalik karena setiap tahap bergantung pada tahap sebelumnya.

---

# 3. Prinsip Kompatibilitas

Selama proses migrasi.

Seluruh command lama sebisa mungkin tetap dapat digunakan.

Contohnya.

```
.sticker
```

tetap menghasilkan Sticker.

```
.smeme
```

tetap menghasilkan Smeme.

Yang berubah hanyalah sistem internal.

Pengguna tidak perlu mengetahui adanya perubahan struktur.

---

# 4. Tahap Pertama

Tahap pertama adalah membangun struktur proyek.

Pada tahap ini belum ada optimasi.

Belum ada perubahan algoritma.

Fokus utamanya adalah menyiapkan fondasi.

Yang dilakukan antara lain.

- Membuat folder stickerEngine.
- Membuat sticker.js.
- Membuat index.js.
- Menyiapkan struktur Engine.

Belum ada proses pemindahan fungsi.

---

# 5. Tahap Kedua

Mulai memindahkan fungsi dari Smeme.

Contohnya.

Registrasi Font.

↓

Dipindahkan ke Font Engine.

Wrap Text.

↓

Dipindahkan ke Text Engine.

Measure Text.

↓

Dipindahkan ke Text Engine.

Cache.

↓

Dipindahkan ke Cache Engine.

Cleanup.

↓

Dipindahkan ke Cleanup Engine.

Smeme hanya memanggil Engine tersebut.

---

# 6. Tahap Ketiga

Mulai membangun Sticker Engine.

Sticker Engine menjadi pusat seluruh proses.

Pada tahap ini.

Sticker biasa.

Smeme.

Animated Sticker.

Video Sticker.

Masih dapat menggunakan implementasi lama.

Namun seluruh request sudah melewati Sticker Engine.

Dengan demikian Engine mulai menjadi pusat sistem.

---

# 7. Tahap Keempat

Mulai menghubungkan seluruh Engine.

Target tahap ini.

Seluruh Engine sudah dapat saling bekerja sama.

Namun belum dilakukan optimasi besar.

Fokus utama.

- Stabilitas.
- Kompatibilitas.
- Validasi.

---

# 8. Tahap Kelima

Setelah seluruh Engine berjalan.

Baru dilakukan optimasi.

Contohnya.

- Cache.
- Worker.
- Sharp.
- FFmpeg.
- Canvas.
- Buffer.
- Metadata.

Seluruh optimasi dilakukan setelah struktur selesai.

Bukan sebelumnya.

---

# 9. Penghapusan Kode Lama

Kode lama tidak langsung dihapus.

Penghapusan dilakukan setelah.

- Engine baru selesai.
- Fitur telah diuji.
- Benchmark selesai.
- Tidak ditemukan bug.

Dengan demikian apabila ditemukan masalah.

Kode lama masih dapat dijadikan referensi.

---

# 10. Audit Setiap Tahap

Setelah setiap tahap selesai.

Harus dilakukan audit.

Audit meliputi.

- Seluruh command masih berjalan.
- Tidak ada Error baru.
- Tidak ada Memory Leak.
- Tidak ada Temporary File tertinggal.
- Tidak ada fungsi yang hilang.

Tahap berikutnya tidak boleh dimulai sebelum audit selesai.

---

# 11. Target Migrasi

Migrasi dianggap selesai apabila.

✅ Seluruh command lama masih berjalan.

✅ Sticker Engine menjadi pusat sistem.

✅ Smeme menggunakan Engine baru.

✅ Tidak ada kode lama yang masih bergantung pada struktur sebelumnya.

✅ Seluruh Engine bekerja sesuai tugas masing-masing.

---

# Penutup Part 6A

Part selanjutnya akan membahas Checklist Implementasi secara rinci.

Checklist tersebut akan menjadi pedoman selama proses pengembangan berlangsung sehingga seluruh fitur dapat dimigrasikan tanpa ada bagian yang terlewat.

# 📦 Sticker Upgrade V2 — Part 6B
# Checklist Implementasi & Validasi

> Status : Implementation Checklist

Part ini berisi seluruh daftar pekerjaan yang harus diselesaikan selama proses migrasi menuju Sticker V2.

Checklist dibuat agar seluruh proses pengembangan dapat dilakukan secara bertahap tanpa ada fitur yang terlewat.

Seluruh checklist di bawah harus diperiksa kembali sebelum Sticker V2 dinyatakan selesai.

---

# 1. Persiapan Struktur

## Folder

- [ ] Membuat folder `stickerEngine/`.
- [ ] Membuat `sticker.js`.
- [ ] Membuat `index.js`.
- [ ] Memastikan struktur folder sesuai dokumentasi.

---

## Dokumentasi

- [ ] Memastikan seluruh dokumentasi Sticker Upgrade telah selesai.
- [ ] Memastikan struktur folder sesuai dokumentasi.
- [ ] Memastikan seluruh Engine memiliki tugas yang jelas.

---

# 2. Sticker Engine

## sticker.js

- [ ] Menjadikan `sticker.js` sebagai Orchestrator.
- [ ] Menghapus seluruh logika berat dari `sticker.js`.
- [ ] Memastikan `sticker.js` hanya mengatur alur.
- [ ] Memastikan seluruh proses menggunakan Engine.

---

## Index Engine

- [ ] Membuat pusat export seluruh Engine.
- [ ] Memastikan seluruh Engine dapat dipanggil dari satu tempat.
- [ ] Menghindari import yang berulang.

---

# 3. Engine Dasar

## Image Engine

- [ ] Resize.
- [ ] Crop.
- [ ] Rotate.
- [ ] Flip.
- [ ] Optimasi Sharp.
- [ ] Validasi ukuran.
- [ ] Buffer Output.

---

## Video Engine

- [ ] Validasi Video.
- [ ] Resize.
- [ ] FPS.
- [ ] Duration.
- [ ] Animated Sticker.
- [ ] Buffer Output.

---

## Metadata Engine

- [ ] Width.
- [ ] Height.
- [ ] Format.
- [ ] MIME.
- [ ] Orientation.
- [ ] Frame Count.
- [ ] Duration.

Metadata hanya boleh dibaca satu kali.

---

# 4. Smeme

## Rendering

- [ ] Migrasi ke Engine baru.
- [ ] Menggunakan Sticker Engine.
- [ ] Menggunakan Buffer.
- [ ] Tidak membuat file sementara apabila tidak diperlukan.

---

## Font

- [ ] Registrasi Font dipindahkan.
- [ ] Font Cache.
- [ ] Font Fallback.
- [ ] Font Validation.

---

## Text

- [ ] Wrap Text.
- [ ] Smart Font.
- [ ] Dynamic Padding.
- [ ] Dynamic Stroke.
- [ ] Dynamic Line Height.
- [ ] Smart Position.

---

## Emoji

- [ ] Deteksi Emoji.
- [ ] Render Emoji.
- [ ] Emoji Cache.
- [ ] Emoji Fallback.

---

## Video Smeme

- [ ] Deteksi Video.
- [ ] Pipeline Video.
- [ ] Render Video.
- [ ] Animated WebP.

---

# 5. Cache

## Cache Engine

- [ ] Font Cache.
- [ ] Metadata Cache.
- [ ] Measure Cache.
- [ ] Fit Font Cache.
- [ ] Render Cache.
- [ ] Emoji Cache.
- [ ] Image Cache.

---

## Validasi Cache

- [ ] Memiliki batas ukuran.
- [ ] Memiliki TTL apabila diperlukan.
- [ ] Tidak menyebabkan Memory Leak.
- [ ] Mudah dibersihkan.

---

# 6. Temporary File

## Temp Engine

- [ ] Membuat Temporary File apabila diperlukan.
- [ ] Registrasi seluruh Temporary File.
- [ ] Buffer menjadi prioritas utama.

---

## Cleanup Engine

- [ ] Auto Delete.
- [ ] TTL Cleanup.
- [ ] Cleanup ketika Error.
- [ ] Cleanup ketika Process selesai.
- [ ] Cleanup ketika FFmpeg berhenti.

---

# 7. WebP

## WebP Engine

- [ ] Static Sticker.
- [ ] Animated Sticker.
- [ ] Optimasi ukuran.
- [ ] Optimasi kualitas.

---

## Exif

- [ ] Packname.
- [ ] Author.
- [ ] Metadata WhatsApp.
- [ ] Sticker Categories.

---

# 8. Worker

## Worker Thread

- [ ] Rendering berat.
- [ ] Video.
- [ ] Animated Sticker.
- [ ] Emoji Rendering.

---

## Validasi

- [ ] Main Thread tetap responsif.
- [ ] Worker tidak tertinggal.
- [ ] Worker berhenti setelah proses selesai.

---

# 9. Error Handling

Seluruh Engine wajib memiliki Error Handling.

Checklist.

- [ ] Error mudah dipahami.
- [ ] Resource dibersihkan.
- [ ] Temporary File dihapus.
- [ ] Worker dihentikan.
- [ ] Process dihentikan.
- [ ] Buffer dilepas.

---

# 10. Benchmark

## Image

- [ ] Benchmark Image.
- [ ] Benchmark Sticker.
- [ ] Benchmark Smeme.

---

## Video

- [ ] Benchmark Video.
- [ ] Benchmark Animated Sticker.
- [ ] Benchmark Smeme Video.

---

## Emoji

- [ ] Benchmark Emoji.
- [ ] Benchmark tanpa Emoji.
- [ ] Benchmark dengan Emoji.

---

# 11. Audit

Checklist akhir.

- [ ] Tidak ada Memory Leak.
- [ ] Tidak ada Resource Leak.
- [ ] Tidak ada Temporary File tertinggal.
- [ ] Tidak ada Cache liar.
- [ ] Tidak ada Worker tertinggal.
- [ ] Tidak ada Process FFmpeg yang masih aktif.

---

# 12. Kompatibilitas

Seluruh command lama wajib tetap berjalan.

Checklist.

- [ ] `.sticker`
- [ ] `.smeme`
- [ ] Sticker Image.
- [ ] Sticker Video.
- [ ] Sticker WebP.
- [ ] Animated Sticker.

Apabila terdapat perubahan perilaku.

Harus dicatat pada dokumentasi migrasi.

---

# 13. Final Validation

Sticker V2 dinyatakan selesai apabila seluruh poin berikut telah terpenuhi.

✅ Seluruh Engine selesai dibuat.

✅ Seluruh fitur berhasil dimigrasikan.

✅ Tidak ada fungsi yang masih bergantung pada struktur lama.

✅ Benchmark sesuai target.

✅ Audit berhasil.

✅ Dokumentasi diperbarui.

✅ Seluruh command berjalan normal.

---

# Penutup Part 6B

Dengan selesainya checklist implementasi ini, seluruh proses migrasi memiliki acuan yang jelas.

Setiap perubahan dapat diverifikasi menggunakan checklist di atas sehingga kemungkinan adanya fitur yang terlupakan dapat diminimalkan.

Part berikutnya akan menjadi penutup dokumentasi Sticker Upgrade V2, berisi standar pengembangan, aturan penulisan Engine, roadmap pengembangan, serta fitur-fitur yang dipersiapkan untuk masa mendatang agar seluruh sistem tetap konsisten seiring bertambahnya kemampuan Sticker Engine.


# 📦 Sticker Upgrade V2 — Part 7
# Development Standard, Roadmap & Final Notes

> Status : Final Documentation

Part ini merupakan penutup dari seluruh dokumentasi Sticker Upgrade V2.

Seluruh aturan pada part ini menjadi standar utama dalam pengembangan fitur Sticker di masa mendatang.

Setiap fitur baru wajib mengikuti aturan yang dijelaskan pada dokumen ini.

---

# 1. Tujuan Standar

Standar ini dibuat agar.

- Struktur proyek tetap rapi.
- Engine tidak saling bercampur.
- Performa tetap stabil.
- Fitur baru mudah ditambahkan.
- Bug lebih mudah dicari.
- Maintenance lebih mudah dilakukan.

Dengan adanya standar ini diharapkan Sticker V2 dapat terus berkembang tanpa harus melakukan Refactor besar kembali.

---

# 2. Aturan Penambahan Fitur Baru

Setiap fitur Sticker baru wajib mengikuti beberapa aturan.

## Tidak mengubah Sticker Engine

Sticker Engine merupakan pusat sistem.

Fitur baru tidak boleh mengubah alur utama apabila perubahan tersebut tidak benar-benar diperlukan.

Sebisa mungkin cukup menambahkan Engine baru.

---

## Gunakan Engine Yang Sudah Ada

Apabila suatu proses sudah dimiliki Engine lain.

Maka Engine tersebut harus digunakan kembali.

Tidak diperbolehkan membuat ulang fungsi yang sama.

Contoh.

Apabila membutuhkan.

- Resize.
- Metadata.
- Font.
- Wrap Text.
- Emoji.

Maka gunakan Engine yang telah tersedia.

---

## Hindari Duplikasi Kode

Seluruh fungsi yang dapat digunakan kembali harus dipindahkan menuju Engine.

Tidak diperbolehkan membuat fungsi serupa pada banyak file.

Target utama.

Satu fungsi.

Satu tempat.

---

# 3. Standar Penamaan

Seluruh Engine menggunakan format.

```
namaEngine.js
```

Contoh.

```
imageEngine.js

videoEngine.js

fontEngine.js

cacheEngine.js
```

Nama Engine harus menggambarkan tanggung jawabnya.

---

# 4. Standar Struktur Engine

Setiap Engine wajib memiliki struktur yang konsisten.

Contohnya.

- Import.
- Konfigurasi.
- Konstanta.
- Cache.
- Helper.
- Function Internal.
- Export.

Dengan demikian seluruh Engine memiliki bentuk yang seragam.

---

# 5. Standar Buffer

Buffer menjadi prioritas utama.

Seluruh proses harus mengutamakan.

```
Buffer

↓

Buffer

↓

Buffer
```

Daripada.

```
File

↓

File

↓

File
```

Semakin sedikit proses I/O.

Semakin baik performa Sticker.

---

# 6. Standar Temporary File

Temporary File hanya dibuat apabila benar-benar diperlukan.

Seluruh Temporary File wajib.

- Terdaftar.
- Mudah dihapus.
- Dibersihkan setelah proses selesai.

Tidak diperbolehkan meninggalkan file sementara pada penyimpanan.

---

# 7. Standar Error

Seluruh Engine wajib mengembalikan Error yang jelas.

Error harus.

- Mudah dipahami.
- Mudah dilacak.
- Mudah diperbaiki.

Error tidak boleh menghentikan Engine lain.

---

# 8. Standar Logging

Logging hanya digunakan untuk.

- Debug.
- Benchmark.
- Audit.

Mode Production harus dapat mengurangi Logging yang tidak diperlukan.

Target utama.

Debug mudah.

Performa tetap tinggi.

---

# 9. Standar Cache

Seluruh Cache wajib.

- Memiliki batas.
- Mudah dibersihkan.
- Tidak menyebabkan Memory Leak.

Tidak diperbolehkan membuat Cache tanpa batas.

---

# 10. Standar Benchmark

Setiap fitur baru wajib diuji.

Minimal.

Image.

Video.

Emoji.

Animated Sticker.

Smeme.

Hasil Benchmark wajib dibandingkan dengan target Sticker V2.

Apabila terjadi penurunan performa.

Penyebabnya harus ditemukan sebelum fitur dinyatakan selesai.

---

# 11. Standar Dokumentasi

Seluruh perubahan besar wajib didokumentasikan.

Minimal meliputi.

- Tujuan.
- Cara kerja.
- Engine yang digunakan.
- Dampak terhadap Engine lain.
- Benchmark.
- Catatan kompatibilitas.

Dokumentasi merupakan bagian dari proses pengembangan.

Bukan pekerjaan tambahan setelah coding selesai.

---

# 12. Roadmap Sticker V2

Beberapa fitur yang dipersiapkan setelah Sticker V2 selesai antara lain.

- Quote Sticker.
- Brat Sticker.
- Circle Sticker.
- Crop Sticker.
- Remove Background.
- Telegram Style Sticker.
- AI Sticker.
- Auto Outline.
- Auto Shadow.
- Auto Watermark.
- Batch Sticker.
- Sticker Filter.
- Sticker Effect.
- Sticker Enhancement.
- Sticker Compression.
- Sticker Template.

Seluruh fitur tersebut diharapkan dapat dibuat menggunakan Engine yang sudah tersedia tanpa mengubah arsitektur utama.

---

# 13. Future Improvement

Sticker V2 juga dipersiapkan untuk berbagai optimasi di masa mendatang.

Contohnya.

- Smart Render Queue.
- GPU Rendering.
- SIMD Optimization.
- Shared Cache.
- Shared Worker.
- Background Rendering.
- Progressive Rendering.
- Batch Rendering.
- Lazy Engine Loading.
- Persistent Cache.
- Dynamic Quality Control.

Seluruh peningkatan tersebut diharapkan cukup dilakukan pada Engine terkait tanpa memengaruhi Engine lainnya.

---

# 14. Target Akhir Sticker V2

Setelah seluruh migrasi selesai.

Sticker V2 diharapkan memiliki karakteristik berikut.

✅ Seluruh proses berjalan secara lokal.

✅ Tidak bergantung pada API pihak ketiga.

✅ Modular.

✅ Mudah dirawat.

✅ Mudah dikembangkan.

✅ Cepat.

✅ Stabil.

✅ Zero Memory Leak.

✅ Zero Resource Leak.

✅ Zero Temporary File.

✅ Mendukung Image.

✅ Mendukung Video.

✅ Mendukung Animated Sticker.

✅ Mendukung Emoji.

✅ Mendukung Smeme generasi baru.

---

# 15. Penutup

Sticker Upgrade V2 merupakan perubahan terbesar pada sistem Sticker di dalam proyek ini.

Perubahan ini bukan hanya berfokus pada peningkatan performa, tetapi juga membangun fondasi baru yang lebih modern, modular, dan siap untuk dikembangkan dalam jangka panjang.

Dengan diterapkannya sistem Engine, pembagian tanggung jawab yang jelas, penggunaan Buffer sebagai prioritas utama, optimasi resource, serta dokumentasi yang lengkap, seluruh fitur Sticker diharapkan dapat berkembang tanpa perlu melakukan refactor besar kembali.

Mulai setelah dokumen ini selesai diterapkan, seluruh pengembangan Sticker wajib mengikuti standar yang telah ditetapkan pada Sticker Upgrade V2 agar kualitas, performa, dan konsistensi proyek tetap terjaga.