API_ARCHITECTURE.md

Part 1 — Latar Belakang, Tujuan, dan Filosofi Sistem apiGlobal

Pendahuluan

Project ini telah berkembang menjadi bot WhatsApp dengan jumlah fitur yang sangat banyak dan akan terus bertambah seiring waktu. Seiring berkembangnya project, penggunaan API eksternal juga semakin meningkat. Saat ini terdapat banyak command yang menggunakan API secara langsung, baik untuk downloader, AI, pencarian, image generation, pencarian anime, musik, video, maupun berbagai layanan lainnya.

Pada sistem lama, sebagian besar command memanggil endpoint API secara langsung di dalam file command masing-masing. Setiap command memiliki cara implementasi sendiri, memiliki URL sendiri, API Key sendiri, serta struktur request yang berbeda-beda.

Cara tersebut memang masih dapat digunakan ketika jumlah command masih sedikit, namun menjadi masalah besar ketika project berkembang menjadi puluhan bahkan ratusan fitur.

---

Permasalahan Sistem Lama

Saat ini terdapat beberapa masalah utama yang ingin diselesaikan.

1. API tersebar di banyak file

Sebagian besar command memiliki URL API sendiri.

Sebagai contoh:

- play
- ytmp3
- ytmp4
- TikTok
- Instagram
- Facebook
- Pinterest
- AI
- Anime
- Search

Seluruhnya dapat menggunakan API yang berbeda.

Akibatnya apabila saya ingin mengganti provider API, saya harus membuka banyak file dan mengganti implementasi satu per satu.

Semakin banyak command, semakin sulit proses maintenance.

Hal ini meningkatkan risiko bug serta memperbesar kemungkinan ada command yang lupa diperbarui.

---

2. API Key tersebar

Sebagian API menggunakan API Key.

Beberapa command bahkan menyimpan API Key secara langsung di dalam command.

Cara tersebut membuat konfigurasi menjadi tidak terpusat.

Ketika API Key berubah, saya harus mencari seluruh lokasi yang menggunakan API tersebut.

Pada project besar, hal ini sangat tidak efisien.

---

3. Sulit mengganti provider

Contoh sederhana.

Hari ini command ".play" menggunakan Provider A.

Besok Provider A mati.

Artinya saya harus membuka command tersebut, mengganti URL, mengubah response parser, mengubah struktur JSON, dan melakukan pengujian ulang.

Jika terdapat puluhan command yang mengalami kondisi serupa, proses maintenance menjadi sangat melelahkan.

---

4. Setiap provider memiliki response berbeda

Contoh.

Provider A mengembalikan:

{
  "status": true,
  "result": {
    "title": "...",
    "url": "..."
  }
}

Sedangkan Provider B mengembalikan:

{
  "success": true,
  "data": {
    "name": "...",
    "download": "..."
  }
}

Sedangkan Provider C:

{
  "code": 200,
  "response": {
    "music": "...",
    "link": "..."
  }
}

Akibatnya setiap command harus mengetahui bentuk JSON masing-masing provider.

Hal tersebut membuat command menjadi sangat bergantung terhadap provider tertentu.

Saya ingin menghilangkan ketergantungan tersebut.

---

5. Tidak memiliki sistem cadangan

Saat provider utama mengalami gangguan, command langsung gagal.

Padahal sebenarnya masih banyak provider lain yang dapat digunakan.

Saat ini belum terdapat sistem yang mampu berpindah provider secara otomatis.

---

6. Sulit melakukan pengembangan

Semakin banyak fitur baru, semakin banyak implementasi API baru.

Lama-kelamaan struktur project menjadi tidak konsisten.

Sebagian command menggunakan axios.

Sebagian menggunakan fetch.

Sebagian menggunakan helper.

Sebagian membuat request sendiri.

Saya ingin seluruh project memiliki satu standar yang sama.

---

Solusi

Untuk menyelesaikan seluruh permasalahan tersebut akan dibuat sebuah sistem baru bernama apiGlobal.

apiGlobal bukan sekadar folder berisi kumpulan request API.

apiGlobal merupakan sebuah lapisan abstraksi (abstraction layer) yang menjadi satu-satunya gerbang komunikasi antara seluruh project dengan provider API eksternal.

Seluruh command, plugin, game, AI, downloader, scheduler, economy, maupun fitur lainnya tidak lagi berkomunikasi langsung dengan internet.

Mereka hanya akan berkomunikasi dengan apiGlobal.

Kemudian apiGlobal yang menentukan provider mana yang akan digunakan.

---

Filosofi apiGlobal

Prinsip utama sistem ini adalah:

«Command tidak boleh mengetahui provider.»

Command tidak boleh mengetahui:

- URL API
- API Key
- Header
- Endpoint
- Response asli
- Struktur JSON provider
- Timeout
- Retry
- Fallback
- Prioritas provider

Seluruh informasi tersebut hanya diketahui oleh apiGlobal.

Command hanya mengetahui bahwa ia membutuhkan sebuah data.

Bagaimana data tersebut diperoleh sepenuhnya menjadi tanggung jawab apiGlobal.

---

Gambaran Cara Kerja

Alur lama:

Command
    │
    ▼
Request API
    │
    ▼
Response

Alur baru:

Command
    │
    ▼
apiGlobal
    │
    ▼
Provider
    │
    ▼
Normalisasi Response
    │
    ▼
Command

Dengan sistem tersebut command tidak perlu mengetahui provider mana yang sedang aktif.

---

Tujuan Jangka Panjang

Sistem ini dibuat agar project dapat berkembang tanpa harus mengubah struktur dasar.

Target akhirnya adalah seluruh layanan API hanya memiliki satu pintu masuk, yaitu apiGlobal.

Apabila suatu hari provider utama diganti, saya cukup mengubah implementasi di dalam apiGlobal tanpa menyentuh command.

Apabila suatu hari terdapat provider baru yang lebih baik, provider tersebut cukup ditambahkan ke dalam apiGlobal.

Command tetap berjalan tanpa perubahan.

Dengan demikian biaya maintenance akan jauh lebih kecil, struktur project tetap konsisten, dan pengembangan fitur baru menjadi lebih mudah.

Inilah tujuan utama dibangunnya sistem apiGlobal.


Part 2 — Struktur Folder, Tanggung Jawab Setiap File, dan Filosofi Modularisasi

Tujuan Struktur Baru

Folder "apiGlobal" bukan dibuat hanya sebagai tempat menyimpan kumpulan request API.

Folder ini merupakan sebuah modul independen yang bertanggung jawab penuh terhadap seluruh komunikasi dengan layanan eksternal.

Dengan kata lain, seluruh bagian project selain "apiGlobal" tidak boleh mengetahui bagaimana cara sebuah data diperoleh.

Command hanya meminta data.

apiGlobal yang bertugas mencari, memilih provider, melakukan request, memproses response, hingga akhirnya mengembalikan data yang telah dinormalisasi.

Karena alasan tersebut, struktur folder harus dibuat modular.

Modular bukan sekadar memisahkan file, tetapi memisahkan tanggung jawab.

Setiap file hanya memiliki satu tanggung jawab utama.

Hal ini akan membuat project jauh lebih mudah dipelajari, dirawat, diperbaiki, dan dikembangkan.

---

Filosofi Modularisasi

Project ini akan terus berkembang.

Jumlah command kemungkinan akan mencapai ratusan.

Jumlah layanan API kemungkinan akan mencapai puluhan.

Jumlah provider untuk setiap layanan juga dapat bertambah seiring waktu.

Apabila seluruh implementasi API diletakkan pada satu file besar, maka file tersebut akan menjadi sangat sulit dibaca.

Perubahan kecil berpotensi memengaruhi layanan lain.

Konflik saat pengembangan juga akan semakin besar.

Karena itu setiap layanan WAJIB dipisahkan menjadi file masing-masing.

---

Contoh Pemisahan Layanan

Contoh yang benar:

play.js

Hanya bertanggung jawab terhadap fitur Play.

Tidak boleh berisi TikTok.

Tidak boleh berisi Pinterest.

Tidak boleh berisi AI.

---

youtube.js

Hanya bertanggung jawab terhadap layanan YouTube.

Misalnya:

- ytmp3
- ytmp4

Seluruh provider YouTube berada di file ini.

---

tiktok.js

Hanya bertanggung jawab terhadap seluruh layanan TikTok.

---

instagram.js

Hanya bertanggung jawab terhadap Instagram.

---

ai.js

Hanya bertanggung jawab terhadap layanan AI.

---

Dengan cara ini setiap file memiliki tanggung jawab yang jelas.

---

Jangan Menggabungkan Banyak Layanan

Contoh yang TIDAK diperbolehkan:

downloader.js

berisi

- Play
- TikTok
- Instagram
- Facebook
- Pinterest
- Spotify

Walaupun semuanya merupakan downloader, seluruh layanan tersebut memiliki provider yang berbeda, endpoint berbeda, response berbeda, bahkan kemungkinan berkembang dengan cara berbeda.

Menggabungkannya hanya akan membuat file semakin besar.

Project ini lebih mengutamakan modularitas daripada jumlah file yang sedikit.

---

Struktur Folder

Claude bebas menentukan struktur terbaik.

Namun struktur tersebut harus mengikuti prinsip modular.

Contoh:

apiGlobal/
│
├── API_ARCHITECTURE.md
│
├── index.js
│
├── config/
│   ├── index.js
│   ├── provider.js
│   └── timeout.js
│
├── providers/
│
├── play.js
├── youtube.js
├── tiktok.js
├── instagram.js
├── facebook.js
├── pinterest.js
├── spotify.js
├── anime.js
├── image.js
├── ai.js
├── lyrics.js
├── github.js
├── search.js
│
├── helper.js
├── logger.js
├── cache.js
├── errors.js
└── normalizer.js

Struktur tersebut hanya contoh.

Claude boleh membuat struktur yang lebih baik apabila memang lebih sesuai.

---

Fungsi index.js

File ini merupakan gerbang utama folder apiGlobal.

Command nantinya cukup melakukan import dari satu lokasi.

Contoh:

import { apiPlay } from "./apiGlobal/index.js"

atau

import { apiYtmp3 } from "./apiGlobal/index.js"

Command tidak perlu mengetahui lokasi sebenarnya dari implementasi.

Seluruh export dikumpulkan pada index.js.

Dengan cara tersebut apabila struktur folder berubah di masa depan, command tidak perlu ikut diubah.

---

Fungsi config

Seluruh konfigurasi harus dipusatkan.

Contohnya:

Base URL

API Key

Timeout

Retry

Header

Default Configuration

Provider Priority

Seluruh konfigurasi tersebut tidak boleh berada di dalam command.

Bahkan sebisa mungkin tidak berada langsung di file layanan.

File seperti play.js hanya meminta konfigurasi yang sudah tersedia.

---

Base URL

Project ini akan menggunakan provider utama.

Provider utama saat ini adalah Neoxr API.

Seluruh Base URL harus berasal dari konfigurasi.

Contohnya secara konsep:

https://api.neoxr.eu/api

Namun jangan melakukan hardcode di banyak lokasi.

Base URL cukup berada pada satu file konfigurasi.

---

API Key

Hal yang sama berlaku terhadap API Key.

API Key tidak boleh tersebar.

API Key tidak boleh ditulis pada command.

API Key tidak boleh ditulis ulang di setiap layanan.

API Key cukup berada di satu lokasi konfigurasi.

Apabila suatu hari API Key berubah, saya hanya ingin mengubah satu file.

Seluruh layanan otomatis ikut menggunakan API Key terbaru.

---

File Layanan

Contohnya:

play.js

File ini hanya mengetahui bahwa ia harus meminta konfigurasi.

Kemudian membuat endpoint.

Lalu mengirim request.

Tidak lebih.

play.js tidak boleh mengetahui API Key disimpan di mana.

play.js tidak boleh mengetahui provider lain.

play.js tidak boleh mengetahui command mana yang memanggilnya.

Semakin sedikit ketergantungan antar modul, semakin baik desainnya.

---

Prinsip Dependency

Setiap file harus memiliki dependency seminimal mungkin.

Semakin sedikit sebuah file bergantung kepada file lain, semakin mudah file tersebut diuji, diperbaiki, dan dikembangkan.

Tujuan akhirnya adalah membuat setiap modul dapat berdiri sendiri namun tetap bekerja sama melalui arsitektur yang konsisten.

Inilah dasar utama mengapa apiGlobal dibangun secara modular.



Part 3 — Provider System, Fallback, Prioritas, dan Alur Kerja Internal

Pendahuluan

Salah satu tujuan utama dibuatnya "apiGlobal" adalah agar project tidak lagi bergantung pada satu provider API.

Dalam jangka panjang, provider dapat berubah kapan saja.

Provider dapat mengalami:

- Maintenance
- Server Down
- Timeout
- Perubahan Endpoint
- Perubahan Response
- Perubahan Harga
- Pembatasan Request
- Penghapusan Endpoint
- API Key Expired
- Rate Limit
- Bahkan berhenti beroperasi.

Apabila seluruh project hanya bergantung pada satu provider, maka seluruh fitur dapat ikut berhenti bekerja.

Karena itu setiap layanan di apiGlobal harus dirancang agar mampu menggunakan banyak provider tanpa perlu mengubah command.

---

Filosofi Provider

Command tidak boleh mengetahui provider.

Command hanya mengetahui bahwa ia membutuhkan suatu data.

Contoh:

await apiPlay(query)

Command tidak boleh mengetahui apakah data tersebut berasal dari:

- Neoxr
- Provider A
- Provider B
- Self Host
- API Pribadi
- Provider lain

Seluruh keputusan tersebut merupakan tanggung jawab apiGlobal.

---

Provider Utama

Saat sistem pertama kali dibuat, provider utama adalah:

Neoxr API

Base URL:

https://api.neoxr.eu/api

Seluruh endpoint utama akan menggunakan provider ini terlebih dahulu.

Namun desain sistem tidak boleh mengunci project pada Neoxr.

Neoxr hanyalah provider prioritas pertama.

Apabila suatu hari saya berpindah provider, saya tidak ingin mengubah command.

Saya hanya ingin mengubah konfigurasi provider.

---

Provider Bukan Hardcode

Kesalahan yang sering terjadi adalah menulis:

Provider 1

↓

Provider 2

↓

Provider 3

langsung di dalam function.

Saya tidak menginginkan desain seperti itu.

Provider harus dapat ditambah atau dihapus tanpa perlu mengubah logika utama.

Dengan kata lain, sistem provider harus fleksibel.

---

Jumlah Provider Tidak Dibatasi

Project ini mungkin hanya memiliki dua provider saat ini.

Namun di masa depan dapat berkembang menjadi:

5 Provider

10 Provider

15 Provider

20 Provider

atau lebih.

Arsitektur harus tetap stabil.

Jumlah provider tidak boleh memengaruhi struktur project.

---

Provider Tidak Selalu Sama

Setiap layanan memiliki provider yang berbeda.

Contoh:

Play

Provider:

- Neoxr
- API A
- API B
- API C

Sedangkan TikTok mungkin memiliki:

- Neoxr
- API X
- API Y

Sedangkan AI mungkin memiliki:

- Gemini
- Claude
- OpenAI
- Groq

Artinya setiap layanan memiliki daftar provider masing-masing.

Jangan membuat asumsi bahwa seluruh layanan memakai provider yang sama.

---

Prioritas Provider

Setiap layanan harus memiliki urutan prioritas.

Contoh:

Play

Prioritas:

1. Neoxr
2. Provider A
3. Provider B
4. Provider C

Saat command memanggil:

apiPlay()

apiGlobal akan mencoba provider pertama.

Apabila berhasil maka proses selesai.

Provider berikutnya tidak perlu dipanggil.

---

Sistem Fallback

Apabila provider pertama gagal karena alasan apa pun, sistem tidak boleh langsung mengembalikan Error.

Sistem harus mencoba provider berikutnya.

Contoh:

Provider 1

↓

Timeout

↓

Provider 2

↓

Server Error

↓

Provider 3

↓

Success

↓

Return Result

Seluruh proses tersebut harus terjadi secara otomatis.

Command tidak perlu mengetahui perpindahan provider tersebut.

---

Seluruh Provider Gagal

Apabila seluruh provider gagal maka barulah sistem mengembalikan Error.

Namun Error yang diberikan harus jelas.

Contoh:

- Tidak ada provider yang berhasil.
- Seluruh provider timeout.
- Semua provider mengembalikan error.
- Endpoint tidak tersedia.

Jangan mengembalikan Error yang membingungkan.

---

Retry

Retry berbeda dengan fallback.

Retry berarti mencoba provider yang sama kembali.

Fallback berarti berpindah provider.

Contoh:

Neoxr

↓

Timeout

↓

Retry 1

↓

Timeout

↓

Retry 2

↓

Masih gagal

↓

Provider berikutnya

Retry tidak wajib dilakukan.

Namun apabila diterapkan, gunakan jumlah yang wajar.

Jangan sampai membuat user menunggu terlalu lama.

---

Timeout

Setiap request harus memiliki timeout.

Jangan pernah membiarkan request menunggu tanpa batas.

Timeout harus dapat diatur melalui konfigurasi.

Apabila timeout tercapai maka provider dianggap gagal.

Sistem langsung mencoba provider berikutnya.

---

Response Normalization

Provider A mungkin memberikan:

title

Provider B memberikan:

name

Provider C memberikan:

music

Semua itu harus diubah menjadi satu format yang sama.

Contoh:

title

Dengan demikian command tidak pernah mengetahui response asli provider.

---

Provider Tidak Boleh Mengubah Command

Misalnya hari ini saya menggunakan Neoxr.

Besok saya mengganti menjadi API pribadi.

Saya tidak ingin mengubah:

- play.js
- command
- plugin
- downloader
- game

Saya hanya ingin mengubah daftar provider.

Karena itu seluruh command harus sepenuhnya bergantung pada apiGlobal.

Bukan bergantung pada provider.

---

Tujuan Jangka Panjang

Target akhir sistem provider adalah membuat project menjadi independen terhadap layanan API mana pun.

Provider boleh berganti.

Provider boleh bertambah.

Provider boleh dihapus.

Namun command tetap sama.

Command cukup memanggil:

await apiPlay(query)

Sedangkan seluruh proses berikut:

- memilih provider
- membuat endpoint
- mengambil API Key
- mengirim request
- timeout
- retry
- fallback
- normalisasi response
- validasi hasil
- pengembalian data

sepenuhnya menjadi tanggung jawab apiGlobal.

Dengan desain seperti ini, penambahan provider baru hanya memerlukan perubahan pada satu modul tanpa memengaruhi ratusan command lain yang menggunakan layanan tersebut.


Part 4 — Migrasi Seluruh Project Menuju apiGlobal

Tujuan Part Ini

Tujuan utama dari proses ini bukan sekadar membuat folder "apiGlobal", melainkan menjadikan "apiGlobal" sebagai satu-satunya pusat komunikasi API pada seluruh project.

Artinya, setelah sistem ini selesai dibangun, tidak boleh ada lagi file yang melakukan request API secara langsung di luar "apiGlobal", kecuali memang terdapat alasan teknis yang sangat kuat dan sudah dirancang sebagai pengecualian.

Seluruh akses API harus melewati lapisan "apiGlobal".

---

Seluruh Project Harus Dicek

Jangan hanya melihat command utama.

Lakukan pengecekan terhadap seluruh project.

Cari seluruh file yang memiliki kemungkinan melakukan request API.

Termasuk namun tidak terbatas pada:

- Command
- Plugin
- Upgrade
- Downloader
- AI
- Search
- Game
- Economy
- Event
- Handler
- Library
- Helper
- Utility
- Service
- Scheduler
- Background Task
- Seluruh folder lain yang berkaitan dengan komunikasi internet.

Jangan menganggap API hanya berada di dalam command.

---

Jangan Hanya Mengecek Folder Command

Pada project ini terdapat beberapa fitur yang tidak memanggil API secara langsung dari command.

Sebagian command hanya memanggil function dari file lain.

Sebagai contoh:

Command

↓

play.js

↓

Function Internal

↓

Request API

Artinya request API sebenarnya berada di file lain.

Karena itu jangan hanya mencari pada folder command.

Telusuri seluruh alur pemanggilan function.

---

Wajib Menelusuri Dependency

Apabila suatu command memanggil:

play()

Maka telusuri function tersebut.

Apabila function tersebut kembali memanggil helper lain.

Telusuri kembali.

Lanjutkan hingga ditemukan lokasi request API sebenarnya.

Barulah request tersebut dipindahkan menuju apiGlobal.

Jangan hanya memperbaiki lapisan paling atas.

---

Cari Seluruh Request API

Lakukan pencarian terhadap seluruh bentuk request.

Contohnya:

- axios
- fetch
- got
- request
- node-fetch
- ky
- superagent

dan library lain yang digunakan project.

Selain itu cari juga:

- URL HTTP
- URL HTTPS
- Base URL
- Endpoint
- API Key
- Authorization Header
- Bearer Token
- Cookie
- Webhook
- Remote Service

Seluruh komunikasi jaringan harus diperiksa.

---

Cari API Yang Disembunyikan

Tidak semua request mudah ditemukan.

Beberapa helper mungkin memiliki function seperti:

fetchJson()

atau

fetchApi()

atau helper lain.

Jangan menganggap helper tersebut bukan API.

Periksa isi helper tersebut.

Apabila helper tersebut melakukan request internet maka helper tersebut termasuk bagian dari sistem API.

---

Jangan Merusak Project Lama

Apabila menemukan command lama yang menggunakan API secara langsung.

Jangan langsung menghapus implementasinya.

Prioritaskan pembangunan pondasi apiGlobal.

Migrasi dilakukan secara bertahap.

Project harus tetap dapat dijalankan selama proses migrasi berlangsung.

---

Apabila Belum Ada File Layanan

Kemungkinan besar tidak seluruh layanan akan langsung dibuat.

Contoh.

Command memerlukan:

spotify.js

Namun file tersebut belum dibuat.

Dalam kondisi tersebut:

WAJIB membuat pondasi terlebih dahulu.

Minimal:

- File tersedia.
- Function tersedia.
- Export tersedia.
- Struktur tersedia.

Implementasi provider dapat ditambahkan kemudian.

Dengan demikian struktur project tetap konsisten.

---

Placeholder Bukan Error

Apabila suatu layanan belum memiliki provider.

Jangan membuat project gagal dijalankan.

Lebih baik menyediakan placeholder yang jelas.

Contohnya:

Function sudah tersedia.

Tetapi mengembalikan pesan bahwa provider belum diimplementasikan.

Dengan cara tersebut seluruh import tetap berjalan.

Dependency tetap utuh.

Migrasi dapat dilakukan sedikit demi sedikit.

---

Jangan Memaksa Seluruh Layanan Menggunakan Desain Yang Sama

Setiap API memiliki karakteristik berbeda.

Contoh.

Play

Menggunakan query.

TikTok

Menggunakan URL.

Pinterest

Menggunakan keyword.

AI

Menggunakan prompt.

Anime

Menggunakan id.

Image Generation

Menggunakan prompt dan parameter tambahan.

Karena itu jangan membuat satu function generik yang memaksa seluruh layanan menggunakan parameter yang sama.

Biarkan setiap layanan memiliki interface yang sesuai dengan kebutuhannya.

Namun struktur internal tetap mengikuti standar apiGlobal.

---

Kompatibilitas Antar Provider

Provider yang berbeda memiliki endpoint yang berbeda.

Contoh.

Provider A

/play

Provider B

/search/play

Provider C

/music

Walaupun endpoint berbeda, command tidak boleh ikut berubah.

Seluruh penyesuaian endpoint dilakukan di dalam file layanan masing-masing.

---

Kompatibilitas Response

Provider A

title

Provider B

name

Provider C

music

Seluruhnya harus dinormalisasi.

Command cukup mengenal:

title

Tidak boleh ada pengecekan berdasarkan provider di dalam command.

---

Jangan Membuat Ketergantungan Baru

Tujuan apiGlobal adalah mengurangi ketergantungan.

Bukan menambah ketergantungan.

Command tidak boleh mengetahui:

- Provider
- Base URL
- Endpoint
- API Key
- Response Provider

Command cukup mengetahui function yang dipanggil.

---

Audit Seluruh Project

Sebelum pekerjaan dianggap selesai.

Lakukan audit terhadap seluruh project.

Pastikan tidak ada lagi request API yang tertinggal di luar apiGlobal.

Apabila masih ditemukan request API.

Catat lokasinya.

Kemudian tentukan apakah:

- Harus dipindahkan ke apiGlobal.
- Memerlukan file layanan baru.
- Memerlukan helper baru.
- Memerlukan normalizer baru.
- Memerlukan provider baru.

Jangan mengabaikan request tersebut.

---

Prioritas Utama

Prioritas pekerjaan adalah sebagai berikut.

1. Bangun pondasi apiGlobal.
2. Bangun struktur folder.
3. Bangun konfigurasi.
4. Bangun provider system.
5. Bangun fallback system.
6. Bangun normalizer.
7. Bangun helper.
8. Audit seluruh project.
9. Identifikasi seluruh request API.
10. Siapkan migrasi bertahap hingga seluruh komunikasi internet hanya melalui apiGlobal.

---

Target Akhir

Target akhir dari project ini bukan sekadar memiliki folder bernama apiGlobal.

Target akhirnya adalah seluruh project memiliki satu jalur komunikasi yang konsisten.

Apa pun fiturnya.

Apa pun providernya.

Apa pun endpointnya.

Apa pun bentuk response-nya.

Seluruh komunikasi internet harus melalui apiGlobal.

Dengan demikian saya dapat mengganti provider, menambah provider, menghapus provider, maupun memindahkan layanan tanpa perlu mengubah puluhan hingga ratusan file lain di dalam project.

Inilah tujuan utama yang harus selalu dijadikan acuan selama proses pembangunan sistem apiGlobal.