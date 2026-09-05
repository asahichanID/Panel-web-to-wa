# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 1 — Engine API Standard

> Status : Implementation Reference
>
> Dokumen ini merupakan referensi implementasi seluruh Engine pada Sticker Engine V2.
>
> Berbeda dengan `ARCHITECTURE.md` yang menjelaskan desain sistem, dokumen ini menjelaskan bagaimana setiap Engine harus dibuat, dipanggil, serta berkomunikasi dengan Engine lainnya.
>
> Dokumen ini menjadi acuan utama ketika melakukan implementasi kode.

---

# 1. Tujuan ENGINE API

ENGINE API dibuat agar seluruh Engine memiliki antarmuka (Interface) yang konsisten.

Target utama.

- Konsisten.
- Mudah digunakan.
- Mudah diuji.
- Mudah dikembangkan.
- Mudah dipelihara.

Setiap Engine wajib mengikuti standar yang dijelaskan pada dokumen ini.

---

# 2. Filosofi API

Seluruh Engine memiliki API yang sederhana.

Engine tidak boleh memiliki puluhan Public Function.

Idealnya.

```
1

sampai

3 Public Function
```

Seluruh pekerjaan lainnya dilakukan oleh Helper Internal.

---

# 3. Public Function

Contoh.

```
imageEngine.process()

videoEngine.process()

textEngine.layout()

fontEngine.register()

cleanupEngine.cleanup()
```

Public Function harus memiliki nama yang mudah dipahami.

Nama Function harus menggambarkan tugas Engine.

---

# 4. Return Rule

Seluruh Engine wajib mengembalikan Promise.

Tidak diperbolehkan mencampur.

Promise.

Callback.

Sync.

Dalam satu Engine.

Pipeline harus sepenuhnya Async.

---

# 5. Parameter Rule

Parameter wajib menggunakan Object.

Contoh.

```
process({
    buffer,
    metadata,
    config
})
```

Bukan.

```
process(buffer, metadata, config)
```

Pendekatan Object mempermudah penambahan parameter baru tanpa mengubah API.

---

# 6. Return Object

Seluruh Engine mengembalikan Object.

Minimal.

```
{
    success,
    data,
    meta
}
```

Apabila gagal.

```
{
    success,
    error,
    meta
}
```

Engine tidak boleh mengembalikan tipe data yang berubah-ubah.

---

# 7. Error Rule

Error harus berasal dari Engine.

Contoh.

```
Image Engine

↓

Image terlalu besar
```

```
Canvas Engine

↓

Render gagal
```

Bukan.

```
Unknown Error
```

---

# 8. Meta Information

Meta digunakan untuk menyimpan informasi tambahan.

Contohnya.

- Processing Time.
- Cache Hit.
- Worker.
- Quality.
- Pipeline.
- Resource.

Meta tidak boleh memengaruhi hasil utama.

---

# 9. Naming Standard

Nama Public Function harus menggunakan kata kerja.

Contoh.

```
process()

render()

encode()

cleanup()

register()

measure()

layout()
```

Tidak diperbolehkan menggunakan nama yang ambigu.

---

# 10. Async Rule

Seluruh Public Function wajib.

```
async
```

Walaupun proses sangat kecil.

Hal ini menjaga konsistensi Pipeline.

---

# 11. Dependency Rule

Engine tidak boleh membuat Instance Engine lain.

Seluruh Dependency diberikan melalui Sticker Engine.

Contoh.

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

new TextEngine()
```

---

# 12. Internal Helper

Helper Internal tidak boleh diekspor.

Helper hanya digunakan oleh Engine tersebut.

Apabila Helper mulai digunakan oleh banyak Engine.

Helper harus dipindahkan menjadi Utility atau Engine baru.

---

# 13. Configuration Rule

Seluruh konfigurasi berasal dari Config.

Tidak diperbolehkan menggunakan.

Magic Number.

Hardcode.

Konstanta tersembunyi.

---

# 14. Lifecycle Rule

Setiap Public Function memiliki Lifecycle.

```
Receive

↓

Validate

↓

Execute

↓

Return

↓

Cleanup
```

Seluruh Engine wajib mengikuti urutan tersebut.

---

# 15. API Stability

Setelah Public API dirilis.

Perubahan harus dijaga agar tetap kompatibel.

Apabila perubahan besar diperlukan.

Gunakan proses Deprecation terlebih dahulu.

---

# Penutup Part 1

Part berikutnya akan membahas spesifikasi API setiap Engine secara rinci, meliputi Input, Output, Return Type, Error Contract, Performance Target, serta contoh implementasi untuk seluruh Engine utama pada Sticker Engine V2.

# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 2A — Core Engine API

> Status : Engine API Reference
>
> Part ini menjelaskan API untuk Core Engine yang menjadi fondasi seluruh Sticker Engine V2.
>
> Setiap Engine memiliki Interface yang konsisten sehingga mudah digunakan oleh Sticker Engine maupun Engine lainnya.

---

# 1. Media Engine

## Tujuan

Media Engine merupakan pintu masuk seluruh media.

Engine ini bertugas menentukan jenis media yang diterima sebelum Pipeline dimulai.

---

## Public API

```
process(context)
```

---

## Parameter

```
context
```

Berisi.

- Buffer.
- MIME.
- Command.
- Config.

---

## Return

```
{
    success,
    data,
    meta
}
```

---

## Data

```
{
    type,
    mime,
    animated,
    pipeline,
    metadata
}
```

---

## Error

Media Engine dapat menghasilkan.

- Invalid Buffer.
- Unsupported MIME.
- Unknown Media.
- Empty Buffer.

---

## Performance Target

```
< 5 ms
```

---

# 2. Metadata Engine

## Tujuan

Membaca seluruh Metadata media.

Metadata hanya dibaca satu kali.

---

## Public API

```
read(context)
```

---

## Parameter

```
context.buffer
```

---

## Return

```
{
    width,
    height,
    format,
    mime,
    duration,
    fps,
    animated,
    alpha,
    frames
}
```

---

## Error

- Invalid Image.
- Invalid Video.
- Unsupported Format.
- Metadata Failed.

---

## Performance Target

```
< 10 ms
```

Image.

```
< 30 ms
```

Video.

---

# 3. Image Engine

## Tujuan

Mengoptimalkan seluruh media gambar sebelum memasuki proses Rendering.

---

## Public API

```
process(context)
```

---

## Fungsi

Engine akan.

- Resize.
- Rotate.
- Normalize.
- Crop.
- Convert.

---

## Return

```
{
    buffer,
    metadata
}
```

---

## Error

- Resize Failed.
- Invalid Image.
- Decode Failed.
- Encode Failed.

---

## Performance Target

```
< 80 ms
```

---

# 4. Video Engine

## Tujuan

Menyiapkan Video sebelum diproses FFmpeg.

---

## Public API

```
process(context)
```

---

## Fungsi

Engine menangani.

- Validate.
- Resize.
- FPS.
- Duration.
- Normalize.

---

## Return

```
{
    task,
    metadata
}
```

---

## Error

- Invalid Video.
- Duration Too Long.
- Decode Failed.
- Unsupported Codec.

---

## Performance Target

```
< 100 ms
```

---

# 5. Canvas Engine

## Tujuan

Melakukan seluruh proses Rendering.

---

## Public API

```
render(context)
```

---

## Fungsi

Canvas Engine bertugas.

- Draw Image.
- Draw Text.
- Draw Emoji.
- Draw Layer.

---

## Return

```
PNG Buffer
```

---

## Error

- Canvas Failed.
- Render Failed.
- Invalid Canvas.
- Invalid Font.

---

## Performance Target

```
< 120 ms
```

---

# 6. Engine Context

Seluruh Engine di atas menerima Context yang sama.

Contohnya.

```
Context

↓

Job

↓

Buffer

↓

Metadata

↓

Configuration

↓

Logger

↓

Resource

↓

Cache
```

Engine hanya menggunakan informasi yang dibutuhkan.

---

# 7. API Contract

Seluruh Core Engine wajib.

- Async.
- Promise.
- Stateless.
- Immutable.
- Cleanup Friendly.

---

# 8. Dependency

Hubungan antar Core Engine.

```
Sticker Engine

↓

Media Engine

↓

Metadata Engine

↓

──────────────

Image Engine

Video Engine

──────────────

↓

Canvas Engine
```

Engine tidak boleh melewati urutan tersebut.

---

# 9. API Stability

Core Engine merupakan API yang paling stabil.

Perubahan Interface harus dihindari.

Apabila perubahan diperlukan.

Harus melalui proses Versioning.

---

# Penutup Part 2A

Part berikutnya akan membahas API untuk Engine lanjutan seperti Text Engine, Font Engine, Emoji Engine, Cache Engine, WebP Engine, Exif Engine, FFmpeg Engine, Worker Engine, Temp Engine, serta Cleanup Engine.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 2B — Advanced Engine API

> Status : Engine API Reference
>
> Part ini menjelaskan API untuk seluruh Engine lanjutan yang bertanggung jawab terhadap Rendering, Cache, Encoding, Cleanup, hingga Runtime Management.

---

# 1. Text Engine

## Tujuan

Text Engine bertanggung jawab menghitung seluruh Layout teks sebelum proses Rendering dimulai.

Engine ini tidak melakukan Rendering.

Engine hanya menghitung posisi, ukuran, serta susunan teks.

---

## Public API

```
layout(context)
```

---

## Parameter

Context.

Berisi.

- Text.
- Canvas Width.
- Canvas Height.
- Font.
- Configuration.

---

## Return

```
{
    lines,
    fontSize,
    lineHeight,
    stroke,
    padding,
    position
}
```

---

## Worker Support

Tidak.

---

## Cache Support

Ya.

- Measure Cache.
- Font Cache.

---

## Cleanup

Tidak memiliki Resource.

---

## Common Failure

- Empty Text.
- Invalid Font.
- Invalid Configuration.

---

## Performance Target

```
< 20 ms
```

---

# 2. Font Engine

## Tujuan

Mengelola seluruh Font.

Registrasi Font.

Fallback.

Cache.

Validation.

---

## Public API

```
register()

get()

validate()
```

---

## Return

```
Font Object
```

---

## Worker Support

Tidak.

---

## Cache Support

Ya.

Font Cache.

---

## Cleanup

Tidak diperlukan.

---

## Common Failure

- Font Not Found.
- Invalid Font.
- Registration Failed.

---

## Performance Target

```
< 5 ms
```

---

# 3. Emoji Engine

## Tujuan

Merender Emoji Unicode.

Engine hanya dijalankan apabila memang terdapat Emoji.

---

## Public API

```
render(context)
```

---

## Return

```
Emoji Layer
```

---

## Worker Support

Ya.

Untuk Rendering besar.

---

## Cache Support

Ya.

Emoji Cache.

---

## Cleanup

Emoji Layer.

---

## Common Failure

- Emoji Unsupported.
- Render Failed.
- Missing Renderer.

---

## Performance Target

```
20–300 ms
```

Tergantung jumlah Emoji.

---

# 4. Cache Engine

## Tujuan

Mengelola seluruh Cache Sticker Engine.

---

## Public API

```
get()

set()

delete()

clear()

cleanup()
```

---

## Return

```
Cache Entry
```

---

## Worker Support

Tidak.

---

## Cleanup

Ya.

TTL.

Manual.

Shutdown.

---

## Common Failure

- Cache Miss.
- Invalid Key.
- Cache Full.

---

## Performance Target

```
< 1 ms
```

---

# 5. WebP Engine

## Tujuan

Mengubah media menjadi Sticker WEBP.

---

## Public API

```
encode(context)
```

---

## Return

```
WEBP Buffer
```

---

## Worker Support

Opsional.

Untuk Animated Sticker.

---

## Cleanup

Temporary Buffer.

---

## Common Failure

- Encode Failed.
- Invalid PNG.
- Invalid Animation.

---

## Performance Target

```
100–400 ms
```

---

# 6. Exif Engine

## Tujuan

Menambahkan Metadata Sticker.

---

## Public API

```
inject(context)
```

---

## Return

```
Sticker Buffer
```

---

## Worker Support

Tidak.

---

## Cleanup

Tidak diperlukan.

---

## Common Failure

- Invalid Metadata.
- Invalid Sticker.

---

## Performance Target

```
< 10 ms
```

---

# 7. FFmpeg Engine

## Tujuan

Menangani seluruh proses Video.

---

## Public API

```
execute(task)
```

---

## Return

```
Video Result
```

---

## Worker Support

Ya.

---

## Cleanup

- Child Process.
- Pipe.
- Temporary File.

---

## Common Failure

- Timeout.
- Unsupported Codec.
- Spawn Failed.
- Process Crashed.

---

## Retry Policy

Retry maksimal.

```
1 kali
```

Apabila Error bersifat sementara.

---

## Performance Target

```
500–2500 ms
```

---

# 8. Worker Engine

## Tujuan

Mengelola seluruh Worker Thread.

---

## Public API

```
run()

terminate()

broadcast()
```

---

## Return

```
Worker Result
```

---

## Cleanup

Terminate Worker.

---

## Common Failure

- Worker Timeout.
- Worker Crash.
- Invalid Task.

---

## Performance Target

```
< 5 ms

Startup
```

---

# 9. Temp Engine

## Tujuan

Mengelola seluruh File sementara.

---

## Public API

```
create()

remove()

exists()

cleanup()
```

---

## Return

```
Temporary Resource
```

---

## Cleanup

Ya.

Selalu.

---

## Common Failure

- Permission Denied.
- File Locked.
- Path Invalid.

---

## Performance Target

```
< 5 ms
```

---

# 10. Cleanup Engine

## Tujuan

Menghapus seluruh Resource setelah Pipeline selesai.

---

## Public API

```
cleanup(context)
```

---

## Resource

- Buffer.
- Worker.
- Temp File.
- Timer.
- Child Process.

---

## Return

```
Completed
```

---

## Common Failure

- Resource Busy.
- Permission Denied.
- Already Released.

---

## Performance Target

```
< 20 ms
```

---

# 11. Engine Priority

Prioritas Runtime.

```
Cleanup

★★★★★

Metadata

★★★★★

Image

★★★★★

Canvas

★★★★★

WebP

★★★★★

FFmpeg

★★★★☆

Emoji

★★★★☆

Cache

★★★★★

Worker

★★★★☆

Temp

★★★☆☆
```

Prioritas digunakan ketika Resource terbatas.

---

# 12. Runtime Requirement

Seluruh Advanced Engine wajib memenuhi.

✅ Async.

✅ Promise.

✅ Stateless.

✅ Cleanup Friendly.

✅ Benchmark Ready.

✅ Cache Compatible.

✅ Worker Compatible.

---

# Penutup Part 2B

Dengan selesainya Part ini, seluruh spesifikasi API untuk seluruh Engine utama maupun Engine lanjutan telah terdokumentasi.

Part berikutnya akan membahas contoh implementasi Pipeline menggunakan API tersebut, termasuk alur pemanggilan antar Engine, Context Flow, Resource Management, serta contoh integrasi lengkap pada `.sticker`, `.smeme`, dan Sticker Video.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 3A — Pipeline API & Context Flow

> Status : Runtime API Reference
>
> Part ini menjelaskan bagaimana seluruh Engine dipanggil oleh Sticker Engine selama proses pembuatan Sticker.
>
> Dokumen ini menjadi acuan implementasi utama pada `sticker.js`.

---

# 1. Tujuan Pipeline API

Pipeline API dibuat agar seluruh Engine dipanggil menggunakan pola yang sama.

Target utama.

- Konsisten.
- Mudah dibaca.
- Mudah diubah.
- Mudah dioptimasi.
- Mudah di-debug.

Sticker Engine menjadi satu-satunya komponen yang mengetahui urutan Pipeline.

Engine lain tidak mengetahui urutan tersebut.

---

# 2. Pipeline Context

Seluruh Engine menerima Object yang sama.

```
Context
```

Context merupakan pusat seluruh data Runtime.

Engine tidak diperbolehkan membuat Context baru.

Engine hanya memperbarui Context yang diterima.

---

# 3. Isi Context

Context minimal berisi.

```
Job

Media

Metadata

Buffer

Configuration

Logger

Cache

Resource

Pipeline

Result
```

Field tambahan dapat ditambahkan.

Namun tidak boleh menghapus Field standar.

---

# 4. Context Ownership

Context dimiliki oleh Sticker Engine.

Engine hanya diperbolehkan.

- Membaca.
- Menambahkan informasi.
- Memperbarui bagian yang menjadi tanggung jawabnya.

Engine tidak boleh menghapus Data milik Engine lain.

---

# 5. Pipeline API

Pipeline dijalankan secara bertahap.

```
Sticker Engine

↓

Media Engine

↓

Metadata Engine

↓

Pipeline Selection

↓

Processing Engine

↓

Encoding Engine

↓

Cleanup Engine

↓

Return
```

Setiap Engine wajib menyelesaikan pekerjaannya sebelum Pipeline dilanjutkan.

---

# 6. Image Sticker Flow

Pipeline Image.

```
Receive

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

Return Sticker
```

Pipeline ini digunakan oleh.

```
.sticker
```

untuk media gambar.

---

# 7. Smeme Flow

Pipeline Smeme.

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

WebP Engine

↓

Exif Engine

↓

Cleanup Engine

↓

Return Sticker
```

Canvas Engine hanya bertugas menggambar.

Seluruh perhitungan Layout dilakukan oleh Text Engine.

---

# 8. Video Sticker Flow

Pipeline Video.

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

WebP Engine

↓

Exif Engine

↓

Cleanup Engine

↓

Return Sticker
```

Video tidak melewati Canvas apabila tidak diperlukan.

---

# 9. Smeme Video Flow

Pipeline Smeme Video.

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

Canvas Engine

↓

Text Engine

↓

Emoji Engine (Opsional)

↓

Animated WebP

↓

Exif Engine

↓

Cleanup Engine

↓

Return Sticker
```

Pipeline ini merupakan Pipeline terpanjang.

---

# 10. Engine Calling Rule

Engine hanya boleh dipanggil oleh.

```
Sticker Engine
```

Engine tidak boleh memanggil Engine lain secara langsung.

Contoh.

```
Canvas Engine

×

Image Engine
```

Hal tersebut tidak diperbolehkan.

---

# 11. Pipeline Cancellation

Pipeline dapat dihentikan apabila.

- Media rusak.
- MIME tidak didukung.
- Buffer kosong.
- Timeout.
- User membatalkan proses.

Walaupun Pipeline dihentikan.

Cleanup tetap wajib dijalankan.

---

# 12. Retry Flow

Retry hanya dilakukan oleh Sticker Engine.

Engine tidak boleh melakukan Retry sendiri.

Contoh.

```
Sticker Engine

↓

FFmpeg Error

↓

Retry

↓

FFmpeg Engine
```

Retry memiliki batas.

Tidak boleh berjalan tanpa henti.

---

# 13. Result Flow

Setelah Pipeline selesai.

Result dikembalikan.

```
Engine

↓

Sticker Engine

↓

Command

↓

WhatsApp
```

Command tidak boleh membaca Resource internal Engine.

Command hanya menerima hasil akhir.

---

# 14. Timeout Rule

Setiap Pipeline memiliki batas waktu.

Contoh.

Image.

```
3 Detik
```

Smeme.

```
5 Detik
```

Video.

```
15 Detik
```

Apabila melebihi batas.

Pipeline dihentikan.

Cleanup langsung dijalankan.

---

# 15. Pipeline Completion

Pipeline dianggap selesai apabila.

✅ Seluruh Engine berhasil.

✅ Cleanup selesai.

✅ Result berhasil dibuat.

Pipeline tidak dianggap selesai apabila Cleanup belum dijalankan.

---

# Penutup Part 3A

Part berikutnya akan membahas Runtime API yang lebih dalam, termasuk Job Manager, Queue API, Event API, Hook API, Resource API, Benchmark API, Logger API, serta Debug API yang digunakan selama proses pengembangan Sticker Engine V2.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 3B — Runtime API

> Status : Runtime Engine API
>
> Part ini menjelaskan API Runtime yang digunakan selama Sticker Engine berjalan.
>
> API pada bagian ini tidak berhubungan dengan Rendering secara langsung, melainkan mengatur bagaimana Job, Queue, Resource, Event, Benchmark, serta Debugging bekerja selama Runtime berlangsung.

---

# 1. Runtime API

Runtime API merupakan kumpulan API yang mengatur jalannya Sticker Engine.

Runtime API tidak membuat Sticker.

Runtime API hanya mengatur proses yang sedang berjalan.

Komponen Runtime meliputi.

- Job Manager.
- Queue Manager.
- Resource Manager.
- Event Manager.
- Hook Manager.
- Logger.
- Benchmark.
- Debugger.

---

# 2. Job Manager API

## Tujuan

Job Manager bertugas membuat serta mengelola seluruh Job.

Satu Command.

Menghasilkan satu Job.

---

## Public API

```
create()

update()

complete()

cancel()

destroy()
```

---

## Job Status

Job memiliki Status.

```
Created

↓

Waiting

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

Apabila gagal.

```
Failed
```

---

## Job Ownership

Job hanya dimiliki oleh Sticker Engine.

Engine lain tidak boleh mengubah Status Job secara langsung.

---

# 3. Queue API

## Tujuan

Mengatur urutan Job.

---

## Public API

```
push()

next()

remove()

clear()

size()
```

---

## Queue Rule

Queue menggunakan.

```
FIFO
```

Namun dapat memberikan Priority.

Priority lebih tinggi.

Diproses lebih dahulu.

---

## Queue Target

Queue harus mampu menangani.

- Banyak Image.
- Banyak Video.
- Banyak Smeme.

Tanpa menyebabkan Blocking Process.

---

# 4. Resource Manager API

## Tujuan

Mengelola seluruh Resource Runtime.

---

## Public API

```
register()

release()

cleanup()

exists()
```

---

## Resource

Resource meliputi.

- Buffer.
- Worker.
- Temp File.
- Timer.
- Child Process.
- Canvas.

---

## Rule

Resource wajib didaftarkan segera setelah dibuat.

---

# 5. Event API

## Tujuan

Memberikan informasi mengenai perubahan Pipeline.

---

## Public API

```
emit()

on()

once()

off()
```

---

## Event

Contoh Event.

```
Job Created

Pipeline Selected

Rendering Started

Rendering Finished

Encoding Started

Encoding Finished

Cleanup Started

Cleanup Finished

Job Completed
```

---

## Rule

Event tidak boleh mengubah Pipeline.

Event hanya memberikan notifikasi.

---

# 6. Hook API

## Tujuan

Menjalankan proses tambahan.

---

## Public API

```
before()

after()

remove()
```

---

## Contoh Hook

```
beforeRender

afterRender

beforeEncode

afterEncode

beforeCleanup

afterCleanup
```

---

## Rule

Hook bersifat opsional.

Pipeline harus tetap berjalan walaupun tidak ada Hook.

---

# 7. Logger API

## Tujuan

Mencatat aktivitas Runtime.

---

## Public API

```
debug()

info()

warn()

error()
```

---

## Rule

Logger tidak boleh memperlambat Pipeline.

Logger dapat dimatikan pada Mode Production.

---

# 8. Benchmark API

## Tujuan

Mengukur performa setiap Engine.

---

## Public API

```
start()

stop()

measure()

report()
```

---

## Informasi

Benchmark mencatat.

- Processing Time.
- Memory Usage.
- CPU Time.
- Worker Time.
- Cache Hit.
- Cache Miss.

---

## Rule

Benchmark tidak memengaruhi hasil Rendering.

---

# 9. Debug API

## Tujuan

Membantu proses Debugging.

---

## Public API

```
enable()

disable()

trace()

snapshot()
```

---

## Snapshot

Snapshot dapat berisi.

- Pipeline.
- Resource.
- Cache.
- Worker.
- Job.

Snapshot digunakan saat terjadi Error.

---

# 10. Statistics API

## Tujuan

Mencatat statistik Runtime.

---

## Public API

```
increment()

decrement()

reset()

report()
```

---

## Statistik

Contohnya.

- Total Sticker.
- Total Smeme.
- Total Video.
- Total Error.
- Cache Hit.
- Cache Miss.
- Average Processing Time.

---

# 11. Runtime Context

Seluruh Runtime API menggunakan Context yang sama.

```
Runtime Context

↓

Job

↓

Queue

↓

Logger

↓

Benchmark

↓

Resource

↓

Cache
```

Tidak diperbolehkan membuat Runtime Context baru.

---

# 12. Failure Handling

Apabila Runtime mengalami Error.

Urutan yang digunakan.

```
Register Error

↓

Logger

↓

Benchmark

↓

Cleanup

↓

Return Error
```

Seluruh Resource harus tetap dibersihkan.

---

# 13. Runtime Rule

Runtime wajib memenuhi.

✅ Stateless.

✅ Async.

✅ Promise.

✅ Cleanup Friendly.

✅ Resource Safe.

✅ Thread Safe.

---

# 14. Performance Target

Runtime API.

Target.

Job Manager.

```
< 1 ms
```

Queue.

```
< 1 ms
```

Logger.

```
< 1 ms
```

Benchmark.

```
< 2 ms
```

Event.

```
< 1 ms
```

Hook.

```
< 1 ms
```

Resource Manager.

```
< 2 ms
```

Target tersebut memastikan Runtime tidak menjadi bottleneck pada Pipeline.

---

# 15. Runtime Goal

Runtime API dirancang agar.

- Ringan.
- Cepat.
- Mudah dipelihara.
- Mudah diperluas.

Runtime tidak boleh menjadi sumber penurunan performa Sticker Engine.

---

# Penutup Part 3B

Dengan selesainya Runtime API, seluruh mekanisme internal Sticker Engine kini telah memiliki antarmuka yang konsisten.

Part berikutnya akan membahas **Implementation Example & Integration Guide**, yaitu contoh implementasi nyata penggunaan seluruh Engine API pada `.sticker`, `.smeme`, `.take`, `.wm`, serta Pipeline Video, lengkap dengan urutan pemanggilan Engine dan contoh struktur implementasi yang direkomendasikan.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 4A — Implementation Example & Integration Guide

> Status : Implementation Reference
>
> Part ini menjelaskan bagaimana Sticker Engine menggunakan seluruh Engine API selama proses pembuatan Sticker.
>
> Dokumen ini menjadi acuan implementasi utama pada `sticker.js`.

---

# 1. Tujuan

Seluruh Command Sticker menggunakan Pipeline yang sama.

Yang membedakan hanyalah.

- Jenis Media.
- Jenis Command.
- Pipeline yang dipilih.

Dengan demikian seluruh proses tetap konsisten.

---

# 2. Sticker Engine

Sticker Engine merupakan Orchestrator.

Sticker Engine tidak melakukan.

- Resize.
- Rendering.
- Encode.
- Metadata.
- Cleanup.

Sticker Engine hanya.

- Membuat Job.
- Menentukan Pipeline.
- Memanggil Engine.
- Mengembalikan Result.

---

# 3. Pipeline Selection

Setelah Media diterima.

Sticker Engine menentukan Pipeline.

Contoh.

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
Sticker

↓

Sticker Pipeline
```

```
Smeme

↓

Smeme Pipeline
```

```
Animated Sticker

↓

Animated Pipeline
```

---

# 4. Image Sticker

Pipeline.

```
Receive Media

↓

Create Job

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

Return Sticker
```

Pipeline ini merupakan Pipeline tercepat.

---

# 5. Sticker Reply

Apabila media yang diterima merupakan Sticker.

Pipeline menjadi.

```
Receive Sticker

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

Cleanup

↓

Return
```

Tujuan Pipeline ini adalah mempertahankan kualitas Sticker.

---

# 6. Smeme Image

Pipeline.

```
Receive Image

↓

Create Job

↓

Media Engine

↓

Metadata

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

WebP Engine

↓

Exif

↓

Cleanup

↓

Return
```

Emoji Engine hanya dijalankan apabila diperlukan.

---

# 7. Smeme Video

Pipeline.

```
Receive Video

↓

Create Job

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

Font

↓

Emoji (Opsional)

↓

Animated WEBP

↓

Exif

↓

Cleanup

↓

Return
```

Pipeline ini merupakan Pipeline terberat.

---

# 8. Video Sticker

Pipeline.

```
Receive Video

↓

Create Job

↓

Media Engine

↓

Metadata

↓

Video Engine

↓

FFmpeg

↓

Animated WEBP

↓

Exif

↓

Cleanup

↓

Return
```

Canvas tidak dijalankan.

Karena tidak diperlukan.

---

# 9. Pipeline Branch

Pipeline dapat berubah.

Contoh.

```
Smeme

↓

Ada Emoji ?

↓

Ya

↓

Emoji Engine

↓

Lanjut
```

```
Tidak

↓

Lewati Emoji Engine
```

Engine hanya dijalankan apabila benar-benar diperlukan.

---

# 10. Cleanup

Setelah seluruh Engine selesai.

Cleanup wajib dijalankan.

Urutan.

```
Temporary File

↓

Worker

↓

Process

↓

Buffer

↓

Canvas

↓

Cache Temporary

↓

Return
```

---

# 11. Retry

Retry hanya dilakukan.

Pada Engine tertentu.

Misalnya.

```
FFmpeg

↓

Retry

↓

Maksimal

1 kali
```

Image Engine.

Tidak memiliki Retry.

Karena Error biasanya berasal dari Input.

---

# 12. Error Flow

Apabila terjadi Error.

Pipeline berubah.

```
Engine

↓

Sticker Engine

↓

Logger

↓

Benchmark

↓

Cleanup

↓

Return Error
```

Cleanup tetap wajib dijalankan.

---

# 13. Performance Notes

Image Pipeline.

Target.

```
< 700 ms
```

Smeme.

```
< 1 Detik
```

Smeme + Emoji.

```
1–2 Detik
```

Video.

```
1–3 Detik
```

Target tersebut merupakan sasaran Architecture V2.

---

# 14. Integration Rule

Sticker Engine tidak boleh mengetahui implementasi internal Engine.

Sticker Engine hanya mengetahui.

- Nama Engine.
- Public API.
- Return Value.

Implementasi internal sepenuhnya menjadi tanggung jawab masing-masing Engine.

---

# 15. Compatibility

Seluruh Pipeline harus kompatibel dengan.

- `.sticker`
- `.stiker`
- `.s`
- `.smeme`
- `.take`
- `.wm`
- `.swm`
- `.curi`
- `.colong`

Tanpa membuat Pipeline baru.

Perbedaannya hanya terdapat pada konfigurasi.

---

# Penutup Part 4A

Dengan adanya panduan integrasi ini, `sticker.js` cukup bertindak sebagai Orchestrator yang memilih Pipeline, memanggil Engine sesuai urutan, menangani Error, lalu mengembalikan hasil akhir tanpa perlu mengetahui implementasi internal masing-masing Engine.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 4B — Advanced Integration & Runtime Example

> Status : Runtime Integration Reference
>
> Part ini menjelaskan bagaimana seluruh Engine saling bekerja sama selama Runtime berlangsung.
>
> Fokus utama bukan lagi pada masing-masing Engine, tetapi bagaimana Sticker Engine mengatur seluruh proses dari awal hingga selesai.

---

# 1. Runtime Lifecycle

Setiap Command memiliki Runtime yang sama.

```
Receive Command

↓

Create Job

↓

Create Context

↓

Validate

↓

Select Pipeline

↓

Execute Engine

↓

Encode

↓

Cleanup

↓

Return
```

Runtime hanya berakhir setelah Cleanup selesai.

---

# 2. Job Context Flow

Seluruh Engine menerima Context yang sama.

```
Sticker Engine

↓

Context

↓

Media Engine

↓

Metadata Engine

↓

Processing Engine

↓

Encoding Engine

↓

Cleanup Engine
```

Engine tidak membuat Context baru.

Engine hanya memperbarui informasi yang menjadi tanggung jawabnya.

---

# 3. Context Mutation Rule

Engine hanya boleh mengubah Field miliknya.

Contoh.

Image Engine.

↓

Image Buffer.

Metadata Engine.

↓

Metadata.

Canvas Engine.

↓

PNG Buffer.

Cleanup Engine.

↓

Resource Status.

Engine tidak boleh menghapus informasi Engine lain.

---

# 4. Resource Registration

Setiap Resource yang dibuat.

Harus segera didaftarkan.

Contoh.

```
Canvas

↓

Register

↓

Render

↓

Cleanup
```

```
Worker

↓

Register

↓

Execute

↓

Cleanup
```

```
Temp File

↓

Register

↓

Use

↓

Cleanup
```

---

# 5. Engine Execution Order

Engine dijalankan berdasarkan Pipeline.

Tidak boleh berdasarkan.

- Import.
- Nama File.
- Folder.

Urutan hanya berasal dari Pipeline Manager.

---

# 6. Conditional Engine

Tidak semua Engine wajib berjalan.

Contohnya.

Image biasa.

↓

Tidak menjalankan.

- Emoji Engine.
- FFmpeg Engine.
- Worker Engine.

Smeme.

↓

Menjalankan.

- Canvas.
- Text.
- Font.

Emoji hanya dijalankan apabila diperlukan.

---

# 7. Resource Ownership

Setiap Resource memiliki satu pemilik.

Contoh.

Canvas.

↓

Canvas Engine.

Worker.

↓

Worker Engine.

FFmpeg Process.

↓

FFmpeg Engine.

Cleanup hanya membaca daftar Resource tersebut.

---

# 8. Async Flow

Seluruh Engine bekerja menggunakan Promise.

```
await

↓

Engine

↓

Return

↓

Next Engine
```

Engine tidak boleh menggunakan Callback.

Pipeline harus tetap konsisten.

---

# 9. Parallel Task

Task tertentu dapat berjalan bersamaan.

Contohnya.

```
Metadata

────────────

Cache Lookup
```

atau.

```
Register Cleanup

────────────

Prepare Context
```

Namun Rendering utama tetap dilakukan secara berurutan.

---

# 10. Timeout Flow

Apabila Engine melewati batas waktu.

```
Timeout

↓

Cancel Job

↓

Cleanup

↓

Return Error
```

Engine tidak boleh tetap berjalan setelah Timeout.

---

# 11. Retry Flow

Retry hanya dilakukan apabila Error bersifat sementara.

Contoh.

```
Spawn FFmpeg gagal.

↓

Retry.
```

Namun.

```
Buffer rusak.

↓

Tidak Retry.
```

Retry dilakukan oleh Sticker Engine.

Bukan oleh Engine.

---

# 12. Error Propagation

Error selalu mengikuti jalur berikut.

```
Engine

↓

Sticker Engine

↓

Logger

↓

Cleanup

↓

Command
```

Tidak boleh langsung dikirim menuju Command.

---

# 13. Cancellation

Pipeline dapat dibatalkan.

Contohnya.

- Timeout.
- User membatalkan.
- Resource habis.
- Fatal Error.

Walaupun dibatalkan.

Cleanup tetap wajib berjalan.

---

# 14. Completion

Pipeline dianggap berhasil apabila.

```
Processing

↓

Encoding

↓

Cleanup

↓

Return
```

Selama Cleanup belum selesai.

Pipeline belum dianggap selesai.

---

# 15. Runtime Optimization

Runtime selalu memilih jalur tercepat.

Contohnya.

```
Emoji Tidak Ada

↓

Skip Emoji Engine
```

```
Static Sticker

↓

Skip FFmpeg
```

```
Image Sudah 512x512

↓

Skip Resize
```

Semakin sedikit Engine yang dijalankan.

Semakin rendah Latency.

---

# 16. Integration Goal

Seluruh Engine diintegrasikan dengan tujuan.

✅ Modular.

✅ Mudah dipindahkan.

✅ Mudah diganti.

✅ Mudah dioptimasi.

✅ Tidak saling bergantung.

---

# Penutup Part 4B

Dengan selesainya Runtime Integration, seluruh mekanisme penggunaan Engine kini telah terdokumentasi.

Part berikutnya akan menjelaskan API khusus untuk Optimasi, Cache, Memory, Worker, Garbage Collection, Benchmark, serta strategi implementasi yang digunakan agar Sticker Engine mampu mempertahankan performa tinggi dalam penggunaan jangka panjang.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 5A — Best Practice & Implementation Guideline

> Status : Development Guideline
>
> Part ini berisi standar implementasi seluruh Engine pada Sticker Engine V2.
>
> Seluruh Developer disarankan mengikuti panduan ini agar kualitas kode, performa, dan stabilitas tetap konsisten.

---

# 1. Tujuan

Dokumen ini bukan menjelaskan API.

Namun menjelaskan.

Bagaimana API tersebut sebaiknya digunakan.

Target utama.

- Cepat.
- Stabil.
- Konsisten.
- Mudah dipelihara.
- Mudah dioptimasi.

---

# 2. Image Engine

## Disarankan

✅ Decode sekali.

✅ Resize sekali.

✅ Encode sekali.

✅ Gunakan Buffer.

✅ Gunakan Sharp.

✅ Release Buffer setelah selesai.

---

## Hindari

❌ Resize berulang.

❌ Decode dua kali.

❌ Encode dua kali.

❌ Menyimpan File sementara.

❌ Membuat salinan Buffer tanpa alasan.

---

# 3. Video Engine

## Disarankan

✅ Validasi Duration terlebih dahulu.

✅ Validasi Codec.

✅ Resize sebelum FFmpeg apabila memungkinkan.

✅ Gunakan Pipe.

---

## Hindari

❌ Memproses Video terlalu panjang.

❌ Spawn FFmpeg berulang.

❌ Menjalankan FFmpeg tanpa Timeout.

---

# 4. Canvas Engine

## Disarankan

✅ Gambar sekali.

✅ Render sekali.

✅ Export sekali.

---

## Hindari

❌ Menggambar ulang Layer yang sama.

❌ Membuat Canvas baru tanpa alasan.

❌ Mengubah ukuran gambar menggunakan Canvas.

Resize dilakukan oleh Image Engine.

---

# 5. Text Engine

## Disarankan

✅ Hitung Layout sekali.

✅ Cache MeasureText.

✅ Cache Font.

✅ Cache Smart Layout.

---

## Hindari

❌ Menghitung Font Size berkali-kali.

❌ MeasureText berulang untuk String yang sama.

❌ Render sebelum Layout selesai.

---

# 6. Emoji Engine

## Disarankan

Jalankan hanya apabila ditemukan Emoji.

Gunakan Cache.

Render satu kali.

---

## Hindari

❌ Menjalankan Emoji Engine pada seluruh Text.

❌ Render Emoji satu per satu apabila dapat dirender sekaligus.

---

# 7. Cache Engine

## Disarankan

Gunakan.

- TTL.
- Maximum Size.
- Cleanup.

---

## Hindari

❌ Cache tanpa batas.

❌ Menyimpan Object besar tanpa alasan.

❌ Cache yang tidak pernah dibersihkan.

---

# 8. FFmpeg Engine

## Disarankan

✅ Gunakan Pipe.

✅ Register Child Process.

✅ Timeout.

✅ Kill otomatis.

✅ Cleanup otomatis.

---

## Hindari

❌ Spawn dua kali.

❌ Menunggu Process tanpa batas.

❌ Membiarkan Child Process hidup setelah selesai.

---

# 9. Worker Engine

## Disarankan

Worker hanya digunakan untuk.

- Video.

- Animated Sticker.

- Batch Render.

- Emoji berat.

---

## Hindari

❌ Worker untuk Image sederhana.

❌ Worker untuk proses kurang dari beberapa milidetik.

---

# 10. Cleanup Engine

Cleanup merupakan Engine terakhir.

Seluruh Resource wajib dilepas.

Checklist.

✅ Buffer.

✅ Canvas.

✅ Worker.

✅ Process.

✅ Temp File.

✅ Timer.

---

# 11. Buffer

Buffer merupakan prioritas utama.

Pipeline ideal.

```
Receive Buffer

↓

Processing

↓

Encoding

↓

Return Buffer
```

Storage hanya digunakan apabila benar-benar diperlukan.

---

# 12. Temporary File

Temporary File merupakan pilihan terakhir.

Apabila harus dibuat.

Wajib.

Register.

↓

Use.

↓

Delete.

↓

Verify.

---

# 13. Performance

Selalu pilih.

```
Sedikit Engine.

↓

Sedikit Buffer.

↓

Sedikit Copy.

↓

Sedikit I/O.
```

Target.

Latency serendah mungkin.

---

# 14. Resource

Resource tidak boleh hidup lebih lama daripada Job.

Setelah Job selesai.

Seluruh Resource harus ikut selesai.

---

# 15. Error

Error tidak boleh disembunyikan.

Error harus.

- Jelas.

- Mudah dipahami.

- Mudah ditelusuri.

- Memiliki Source Engine.

---

# 16. Logging

Logging digunakan.

Untuk.

- Debug.

- Benchmark.

- Audit.

Bukan sebagai pengganti Error Handling.

---

# 17. Benchmark

Seluruh perubahan Engine wajib diuji.

Minimal.

Image.

Smeme.

Video.

Animated.

Emoji.

Target.

Tidak boleh lebih lambat dari versi sebelumnya.

---

# 18. Optimization Checklist

Sebelum Engine dianggap selesai.

Pastikan.

✅ Tidak ada Duplicate Processing.

✅ Tidak ada Duplicate Rendering.

✅ Tidak ada Duplicate Resize.

✅ Tidak ada Duplicate Metadata.

✅ Tidak ada Resource Leak.

✅ Tidak ada Memory Leak.

✅ Tidak ada Child Process tertinggal.

✅ Tidak ada Worker tertinggal.

---

# 19. Golden Rule

Engine terbaik bukanlah Engine yang memiliki kode paling sedikit.

Namun Engine yang.

- Mudah dipahami.

- Stabil.

- Cepat.

- Modular.

- Mudah dikembangkan.

- Mudah dioptimasi.

Seluruh implementasi Sticker Engine V2 harus selalu mengutamakan kualitas Architecture dibanding sekadar mempersingkat kode.

---

# Penutup Part 5A

Dengan mengikuti Best Practice ini, setiap Engine yang dibangun di atas Sticker Engine V2 diharapkan memiliki kualitas implementasi yang seragam, performa yang optimal, serta mudah dipelihara dalam jangka panjang tanpa memerlukan Refactor besar.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 5B — Optimization Cookbook & Troubleshooting

> Status : Performance Optimization Guide
>
> Part ini berisi kumpulan panduan optimasi, analisis bottleneck, troubleshooting, serta langkah-langkah yang direkomendasikan ketika Sticker Engine mengalami penurunan performa maupun Error Runtime.

---

# 1. Tujuan

Optimization Cookbook dibuat agar proses analisis masalah menjadi jauh lebih cepat.

Developer tidak perlu menebak-nebak penyebab Error.

Seluruh masalah umum telah memiliki prosedur pemeriksaan yang direkomendasikan.

---

# 2. Sticker Lambat

## Gejala

Image membutuhkan lebih dari target waktu.

Contoh.

```
Image

>

1 Detik
```

---

## Pemeriksaan

Periksa.

- Metadata dibaca berapa kali.
- Resize dilakukan berapa kali.
- Encode dilakukan berapa kali.
- Buffer disalin berapa kali.
- Canvas dibuat berapa kali.

---

## Kemungkinan Penyebab

- Duplicate Resize.
- Duplicate Encode.
- Duplicate Metadata.
- Buffer Copy berlebihan.
- Render ulang.

---

## Solusi

Gunakan.

- Single Decode.
- Single Resize.
- Single Encode.
- Buffer Reuse.
- Smart Cache.

---

# 3. Smeme Lambat

## Pemeriksaan

Periksa.

- Font Engine.
- Text Engine.
- Canvas.
- Emoji Engine.

---

## Penyebab Umum

- MeasureText terlalu sering.

- Font berubah setiap baris.

- Layout dihitung berulang.

- Canvas dibuat lebih dari satu kali.

---

## Solusi

Gunakan.

- Measure Cache.

- Font Cache.

- Smart Layout.

- Single Canvas.

---

# 4. Emoji Lambat

## Pemeriksaan

Pastikan.

Emoji benar-benar diperlukan.

---

## Penyebab

- Emoji dirender satu per satu.

- Tidak menggunakan Cache.

- Menggunakan Font yang tidak mendukung Emoji.

---

## Solusi

- Render sekaligus.

- Gunakan Emoji Cache.

- Lewati Emoji Engine apabila tidak ditemukan Emoji.

---

# 5. Video Lambat

## Pemeriksaan

Periksa.

- FFmpeg.

- Thread.

- Preset.

- Pipe.

- Resize.

---

## Penyebab

- Preset terlalu berat.

- Video terlalu panjang.

- Resize setelah Encode.

- Temporary File terlalu banyak.

---

## Solusi

- Gunakan Pipe.

- Resize sebelum Encode.

- Timeout.

- Cleanup otomatis.

---

# 6. RAM Terus Naik

## Pemeriksaan

Periksa.

- Buffer.

- Canvas.

- Worker.

- Cache.

- Temporary File.

---

## Penyebab

- Memory Leak.

- Cache Leak.

- Worker belum ditutup.

- Canvas belum dilepas.

---

## Solusi

Pastikan.

```
Release

↓

Cleanup

↓

GC
```

Seluruh Resource dilepas.

---

# 7. CPU Selalu Tinggi

## Pemeriksaan

Cari.

Loop.

Rendering.

Resize.

Encode.

---

## Penyebab

- Duplicate Process.

- Duplicate Rendering.

- Loop tidak perlu.

- Worker terlalu banyak.

---

## Solusi

Kurangi pekerjaan.

Jangan mengurangi kualitas Architecture.

---

# 8. FFmpeg Tidak Berhenti

## Pemeriksaan

Pastikan.

Child Process sudah diregistrasi.

---

## Penyebab

- Timeout tidak berjalan.

- Cleanup gagal.

- Process tidak di-Kill.

---

## Solusi

Seluruh Process wajib.

Register.

↓

Kill.

↓

Cleanup.

↓

Verify.

---

# 9. Temporary File Menumpuk

## Pemeriksaan

Lihat.

Folder Temp.

---

## Penyebab

Cleanup tidak berjalan.

---

## Solusi

Cleanup Engine harus.

- Scan.

- Delete.

- Verify.

Sebelum Job dianggap selesai.

---

# 10. Worker Tidak Mati

## Pemeriksaan

Lihat Worker yang masih aktif.

---

## Penyebab

Worker tidak di-Terminate.

---

## Solusi

Gunakan.

```
finally

↓

Terminate
```

Worker tidak boleh hidup setelah Job selesai.

---

# 11. Cache Tidak Efektif

## Pemeriksaan

Bandingkan.

Cache Hit.

Cache Miss.

---

## Penyebab

Key berubah terus.

TTL terlalu pendek.

Cache terlalu kecil.

---

## Solusi

Gunakan Key yang konsisten.

TTL yang sesuai.

Maximum Size.

---

# 12. Canvas Lambat

## Pemeriksaan

Periksa.

- DrawImage.

- DrawText.

- Export PNG.

---

## Penyebab

Layer terlalu banyak.

Render berulang.

Canvas terlalu besar.

---

## Solusi

Gunakan.

Single Render.

Single Export.

Single Canvas.

---

# 13. Sticker Pecah

## Pemeriksaan

Periksa.

Resize.

Interpolation.

Encode.

---

## Penyebab

Resize berkali-kali.

Canvas terlalu kecil.

Encode berulang.

---

## Solusi

Resize sekali.

Render resolusi penuh.

Encode sekali.

---

# 14. Font Bermasalah

## Pemeriksaan

Periksa.

Font Engine.

Fallback.

Register.

---

## Penyebab

Font gagal dimuat.

Fallback salah.

Register gagal.

---

## Solusi

Gunakan.

Primary Font.

↓

Fallback.

↓

System Font.

---

# 15. Smeme Tidak Simetris

## Pemeriksaan

Periksa.

Layout.

Padding.

Alignment.

---

## Penyebab

Layout dihitung sebelum Font siap.

---

## Solusi

Urutan.

Font.

↓

Layout.

↓

Canvas.

↓

Render.

---

# 16. Duplicate Processing

Checklist.

Pastikan.

❌ Metadata dua kali.

❌ Resize dua kali.

❌ Encode dua kali.

❌ Draw dua kali.

❌ Cleanup dua kali.

Seluruh proses idealnya hanya terjadi satu kali.

---

# 17. Benchmark Analysis

Apabila terjadi penurunan performa.

Bandingkan.

- CPU.

- RAM.

- Worker.

- Cache.

- Pipeline.

Jangan langsung mengubah Engine.

Temukan Bottleneck terlebih dahulu.

---

# 18. Debug Strategy

Urutan Debug.

```
Logger

↓

Benchmark

↓

Profiler

↓

Pipeline

↓

Engine

↓

Source
```

Jangan langsung menyimpulkan penyebab Error.

---

# 19. Golden Optimization Rule

Optimasi terbaik bukanlah.

Kode paling pendek.

Namun.

Pekerjaan paling sedikit.

Semakin sedikit pekerjaan yang dilakukan Pipeline.

Semakin tinggi performa Sticker Engine.

---

# 20. Final Checklist

Sebelum Release.

Pastikan.

✅ Tidak ada Memory Leak.

✅ Tidak ada Resource Leak.

✅ Tidak ada Worker Leak.

✅ Tidak ada Temp File Leak.

✅ Tidak ada Duplicate Process.

✅ Tidak ada Duplicate Render.

✅ Tidak ada Duplicate Encode.

✅ Tidak ada Duplicate Resize.

✅ Tidak ada Duplicate Metadata.

✅ Benchmark memenuhi target.

Apabila seluruh Checklist terpenuhi.

Sticker Engine siap digunakan pada Production.

---

# Penutup Part 5B

Optimization Cookbook menjadi panduan utama ketika melakukan Debugging, Benchmark, maupun Optimasi pada Sticker Engine V2.

Seluruh proses analisis performa diharapkan mengikuti panduan ini agar perubahan yang dilakukan benar-benar berdasarkan data, bukan sekadar dugaan.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 6 — Testing, Validation & Quality Assurance

> Status : Quality Assurance Specification
>
> Part ini menjelaskan standar pengujian Sticker Engine V2 sebelum sebuah perubahan dianggap layak digunakan pada Production.
>
> Seluruh Engine, Pipeline, maupun fitur baru wajib melalui proses pengujian yang dijelaskan pada dokumen ini.

---

# 1. Tujuan

Testing bukan hanya mencari Bug.

Testing bertujuan memastikan.

- Fungsi berjalan benar.
- Performa tetap stabil.
- Resource tidak bocor.
- Pipeline tetap konsisten.
- Architecture tetap dipatuhi.

---

# 2. Tingkatan Testing

Sticker Engine menggunakan beberapa tingkatan pengujian.

```
Unit Test

↓

Integration Test

↓

Pipeline Test

↓

Stress Test

↓

Regression Test

↓

Benchmark

↓

Production Validation
```

Seluruh tahap memiliki tujuan yang berbeda.

---

# 3. Unit Test

Setiap Engine wajib dapat diuji secara terpisah.

Contohnya.

Image Engine.

↓

Hanya menguji.

- Resize.
- Normalize.
- Rotate.

Tanpa menjalankan Engine lain.

---

# 4. Integration Test

Menguji komunikasi antar Engine.

Contohnya.

```
Image Engine

↓

Canvas Engine

↓

WebP Engine
```

Pipeline harus menghasilkan Sticker yang benar.

---

# 5. Pipeline Test

Pipeline diuji sebagai satu kesatuan.

Contoh Pipeline.

```
Image Sticker

Smeme

Video Sticker

Animated Sticker

Smeme Video
```

Setiap Pipeline wajib menghasilkan Output yang benar.

---

# 6. Functional Test

Pastikan seluruh fitur berjalan.

Checklist.

✅ Sticker.

✅ Sticker Reply.

✅ Smeme.

✅ Smeme Video.

✅ WM.

✅ Take.

✅ Curi.

✅ Colong.

✅ Animated Sticker.

---

# 7. Input Validation Test

Seluruh jenis Input wajib diuji.

Contoh.

- JPG.
- PNG.
- WEBP.
- GIF.
- MP4.
- WEBM.

Selain itu.

Uji.

- Buffer kosong.
- Buffer rusak.
- MIME salah.
- File terlalu besar.
- Durasi terlalu panjang.

---

# 8. Emoji Test

Emoji Engine wajib diuji menggunakan.

- Emoji tunggal.
- Banyak Emoji.
- Campuran Emoji dan teks.
- Emoji di awal.
- Emoji di akhir.
- Emoji berurutan.

Pastikan posisi dan ukuran tetap benar.

---

# 9. Font Test

Uji.

Primary Font.

↓

Fallback Font.

↓

System Font.

Pastikan seluruh jalur menghasilkan Output yang layak.

---

# 10. Memory Test

Selama pengujian.

Pantau.

- RAM.
- Buffer.
- Worker.
- Canvas.

Pastikan penggunaan Memory kembali stabil setelah seluruh Job selesai.

---

# 11. Cleanup Test

Setelah Pipeline selesai.

Pastikan.

- Buffer dilepas.
- Canvas dilepas.
- Worker berhenti.
- Child Process berhenti.
- Temporary File dihapus.
- Timer dibersihkan.

Tidak boleh ada Resource yang tertinggal.

---

# 12. Stress Test

Lakukan pengujian berulang.

Contoh.

```
100 Sticker.

↓

100 Smeme.

↓

100 Video.

↓

100 Animated Sticker.
```

Engine harus tetap stabil.

Tidak boleh terjadi penurunan performa yang signifikan.

---

# 13. Benchmark Test

Catat.

- Waktu proses.
- Penggunaan RAM.
- Penggunaan CPU.
- Cache Hit.
- Cache Miss.

Bandingkan dengan hasil sebelumnya.

---

# 14. Regression Test

Setiap perubahan Engine wajib diuji kembali.

Target.

Perubahan baru tidak boleh merusak fitur lama.

Pipeline lama harus tetap berjalan dengan benar.

---

# 15. Failure Test

Simulasikan kondisi gagal.

Contoh.

- Buffer rusak.
- Font hilang.
- FFmpeg gagal.
- Worker Crash.
- Timeout.

Pastikan Error ditangani dengan benar.

Cleanup tetap wajib berjalan.

---

# 16. Recovery Test

Setelah Error.

Pastikan Engine dapat memproses Job berikutnya tanpa perlu Restart.

Error pada satu Job tidak boleh memengaruhi Job lainnya.

---

# 17. Production Validation

Sebelum Release.

Lakukan pengujian pada kondisi nyata.

Contoh.

- Image kecil.
- Image besar.
- Video pendek.
- Video maksimum.
- Banyak Request secara bersamaan.

Pastikan Engine tetap stabil.

---

# 18. Release Checklist

Sebelum Release.

Pastikan.

✅ Seluruh Unit Test lulus.

✅ Seluruh Integration Test lulus.

✅ Seluruh Pipeline Test lulus.

✅ Seluruh Stress Test lulus.

✅ Seluruh Benchmark memenuhi target.

✅ Tidak ada Memory Leak.

✅ Tidak ada Resource Leak.

✅ Tidak ada Regression.

---

# 19. Quality Standard

Sticker Engine V2 dianggap memenuhi standar apabila.

- Seluruh Pipeline berjalan.
- Seluruh Engine stabil.
- Tidak ada Crash.
- Tidak ada Resource bocor.
- Performa sesuai target.
- Dokumentasi tetap sinkron dengan implementasi.

---

# 20. Final QA Rule

Tidak ada perubahan yang boleh digabungkan ke Branch utama sebelum seluruh pengujian pada dokumen ini selesai dilakukan.

Kualitas dan stabilitas selalu menjadi prioritas utama dibanding kecepatan pengembangan.

---

# Penutup Part 6

Dokumen ini menjadi standar resmi proses pengujian Sticker Engine V2.

Seluruh perubahan wajib melalui proses validasi yang konsisten agar Engine tetap memiliki kualitas tinggi, performa optimal, serta siap digunakan pada lingkungan Production.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 7 — Reference & Glossary

> Status : Reference Documentation
>
> Part ini berisi daftar istilah, definisi, serta konsep yang digunakan di seluruh Sticker Engine V2.
>
> Seluruh dokumentasi lain mengacu pada definisi yang dijelaskan pada bagian ini.

---

# 1. Sticker Engine

Sticker Engine merupakan Orchestrator utama.

Tugasnya.

- Membuat Job.
- Memilih Pipeline.
- Menjalankan Engine.
- Mengembalikan Result.
- Menangani Error.
- Menjalankan Cleanup.

Sticker Engine tidak melakukan proses Image Processing maupun Rendering secara langsung.

---

# 2. Engine

Engine adalah modul yang memiliki satu tanggung jawab.

Contoh.

- Image Engine.
- Video Engine.
- Canvas Engine.
- Cleanup Engine.

Setiap Engine bekerja secara independen.

---

# 3. Pipeline

Pipeline adalah urutan Engine yang dijalankan untuk menyelesaikan satu Job.

Pipeline menentukan.

- Engine apa yang dipakai.
- Urutan Engine.
- Jalur proses.

Pipeline tidak berisi implementasi.

Pipeline hanya mengatur alur kerja.

---

# 4. Job

Job merupakan representasi satu proses Sticker.

Satu Command.

↓

Satu Job.

Job memiliki informasi seperti.

- Status.
- Pipeline.
- Resource.
- Context.
- Result.

---

# 5. Context

Context merupakan Object utama yang dibawa selama Runtime.

Context menjadi media komunikasi antar Engine.

Context dapat berisi.

- Buffer.
- Metadata.
- Configuration.
- Cache.
- Logger.
- Benchmark.
- Resource.

Seluruh Engine menerima Context yang sama.

---

# 6. Buffer

Buffer merupakan bentuk utama pertukaran data.

Sticker Engine menggunakan pendekatan.

```
Buffer First
```

Selama memungkinkan.

Data tidak disimpan ke Storage.

---

# 7. Resource

Resource adalah seluruh objek Runtime yang memerlukan pengelolaan.

Contoh.

- Buffer.
- Canvas.
- Worker.
- Child Process.
- Temporary File.
- Timer.

Seluruh Resource wajib didaftarkan.

---

# 8. Worker

Worker adalah proses terpisah yang digunakan untuk pekerjaan berat.

Worker digunakan apabila pekerjaan dapat dipindahkan dari Main Thread.

Contoh.

- Video.
- Animated Sticker.
- Emoji berat.

---

# 9. Cache

Cache digunakan untuk menghindari pekerjaan yang sama.

Contoh.

- Font.
- MeasureText.
- Metadata.
- Emoji.
- Layout.

Cache bukan tempat penyimpanan permanen.

---

# 10. Cache Hit

Cache Hit terjadi ketika data berhasil ditemukan di Cache.

Pipeline dapat langsung menggunakan data tersebut.

Tanpa melakukan proses ulang.

---

# 11. Cache Miss

Cache Miss terjadi ketika data belum tersedia.

Engine harus membuat data baru.

Kemudian menyimpannya ke Cache apabila diperlukan.

---

# 12. TTL

TTL.

(Time To Live)

Merupakan batas umur Cache.

Setelah TTL habis.

Cache dapat dihapus oleh Cache Engine.

---

# 13. Temporary File

Temporary File merupakan File sementara.

Hanya digunakan apabila Buffer tidak dapat digunakan.

Setelah Job selesai.

Temporary File wajib dihapus.

---

# 14. Rendering

Rendering merupakan proses menggambar seluruh Layer.

Contohnya.

- Image.
- Text.
- Emoji.
- Watermark.

Rendering dilakukan oleh Canvas Engine.

---

# 15. Encoding

Encoding merupakan proses mengubah hasil Rendering menjadi format akhir.

Contohnya.

PNG.

↓

WEBP.

Encoding dilakukan oleh WebP Engine.

---

# 16. Metadata

Metadata adalah informasi mengenai media.

Contohnya.

- Width.
- Height.
- Format.
- FPS.
- Duration.
- Alpha.
- Frame Count.

Metadata dibaca satu kali.

---

# 17. Exif

Exif merupakan Metadata tambahan yang disisipkan pada Sticker.

Contohnya.

- Packname.
- Author.
- Identifier.

Exif ditambahkan setelah proses Encoding selesai.

---

# 18. Benchmark

Benchmark merupakan proses pengukuran performa.

Benchmark mencatat.

- Waktu.
- RAM.
- CPU.
- Worker.
- Cache.

Benchmark digunakan untuk membandingkan performa antar versi.

---

# 19. Logger

Logger mencatat aktivitas Runtime.

Logger digunakan untuk.

- Debug.
- Audit.
- Error.
- Informasi.

Logger bukan pengganti Error Handling.

---

# 20. Hook

Hook merupakan titik tambahan yang dapat digunakan sebelum atau sesudah suatu proses.

Contoh.

```
beforeRender

afterRender

beforeCleanup

afterCleanup
```

Hook bersifat opsional.

---

# 21. Event

Event merupakan notifikasi Runtime.

Event hanya memberikan informasi.

Event tidak mengubah Pipeline.

---

# 22. Cleanup

Cleanup merupakan proses pelepasan seluruh Resource.

Cleanup selalu menjadi tahap terakhir Pipeline.

Pipeline tidak dianggap selesai sebelum Cleanup berhasil.

---

# 23. Stateless

Stateless berarti Engine tidak menyimpan kondisi Runtime sebelumnya.

Setiap Job diproses secara independen.

Hal ini mempermudah Testing serta meningkatkan stabilitas.

---

# 24. Throughput

Throughput adalah jumlah Job yang mampu diproses dalam periode tertentu.

Semakin tinggi Throughput.

Semakin baik kemampuan Sticker Engine menangani banyak Request.

---

# 25. Latency

Latency merupakan waktu yang dibutuhkan satu Job hingga selesai.

Target utama Sticker Engine adalah menjaga Latency tetap rendah tanpa mengorbankan kualitas hasil.

---

# 26. Production

Production merupakan lingkungan penggunaan sebenarnya.

Seluruh optimasi, Benchmark, serta Testing bertujuan memastikan Sticker Engine siap digunakan pada lingkungan Production secara stabil dalam jangka panjang.

---

# Penutup Part 7

Bagian ini menjadi kamus resmi seluruh istilah yang digunakan pada Sticker Engine V2.

Seluruh dokumentasi lain harus menggunakan definisi yang sama agar tidak terjadi perbedaan interpretasi selama proses pengembangan maupun pemeliharaan proyek.


# 📚 Sticker Engine V2
# ENGINE_API.md
## Part 8 — Versioning, Compatibility, Future Roadmap & Final Statement

> Status : Final Documentation
>
> Part ini merupakan penutup resmi ENGINE_API.md.
>
> Seluruh aturan, standar, serta filosofi yang dijelaskan pada bagian ini menjadi pedoman jangka panjang bagi seluruh pengembangan Sticker Engine V2.

---

# 1. Tujuan

ENGINE_API.md dibuat agar seluruh implementasi Engine memiliki standar yang sama.

Dokumen ini tidak hanya berlaku untuk versi saat ini.

Namun juga menjadi acuan bagi seluruh pengembangan di masa mendatang.

---

# 2. Philosophy

Sticker Engine V2 dibangun berdasarkan beberapa prinsip utama.

## Buffer First

Seluruh Pipeline sebisa mungkin menggunakan Buffer.

Storage hanya digunakan apabila benar-benar diperlukan.

---

## Engine First

Seluruh pekerjaan dilakukan oleh Engine.

Bukan oleh Sticker Engine.

Sticker Engine hanya bertugas mengatur jalannya Pipeline.

---

## Single Responsibility

Satu Engine.

↓

Satu Tanggung Jawab.

Engine tidak boleh mengambil pekerjaan Engine lain.

---

## Single Processing

Satu pekerjaan.

↓

Satu kali proses.

Tidak boleh terjadi.

- Duplicate Decode.
- Duplicate Resize.
- Duplicate Metadata.
- Duplicate Encode.
- Duplicate Render.

---

## Cleanup Always

Cleanup bukan fitur tambahan.

Cleanup merupakan bagian wajib dari setiap Pipeline.

Tidak ada Pipeline yang selesai sebelum Cleanup selesai.

---

## Modular Architecture

Seluruh Engine harus dapat.

- Dipindahkan.
- Diganti.
- Diuji.
- Dikembangkan.

Tanpa memengaruhi Engine lain.

---

# 3. Version Policy

Sticker Engine menggunakan Semantic Version.

Contoh.

```
2.0.0

Major

↓

Minor

↓

Patch
```

---

## Major

Digunakan apabila.

- Architecture berubah.
- Internal Contract berubah.
- Breaking Change.

---

## Minor

Digunakan apabila.

- Engine baru.
- Optimasi.
- Pipeline baru.
- Fitur baru.

Tanpa merusak kompatibilitas.

---

## Patch

Digunakan untuk.

- Bug Fix.
- Hotfix.
- Perbaikan kecil.

---

# 4. Compatibility Policy

Seluruh perubahan harus menjaga kompatibilitas.

Command lama.

↓

Tetap berjalan.

Pipeline lama.

↓

Tetap tersedia.

Config lama.

↓

Tetap dikenali.

Apabila terdapat perubahan.

Harus tersedia jalur migrasi.

---

# 5. Deprecation Policy

Engine tidak boleh langsung dihapus.

Tahapan.

```
Supported

↓

Deprecated

↓

Migration

↓

Removal
```

Developer harus diberikan waktu untuk melakukan migrasi.

---

# 6. Engine Evolution

Engine dapat berkembang.

Contoh.

```
Image Engine

↓

V2

↓

V2.5

↓

V3
```

Namun.

Public API tetap dijaga agar tetap stabil.

---

# 7. Future Roadmap

Beberapa fitur yang dipersiapkan.

- AI Sticker.
- AI Background Removal.
- AI Upscaler.
- Quote Sticker.
- Brat Sticker.
- Batch Sticker.
- Batch Rendering.
- Background Rendering.
- GPU Rendering.
- SIMD Optimization.
- Shared Worker.
- Shared Memory.
- Progressive Rendering.
- Distributed Rendering.
- Remote Worker.
- Plugin Marketplace.

Seluruh fitur tersebut dapat ditambahkan tanpa mengubah fondasi utama Sticker Engine.

---

# 8. Plugin Policy

Plugin wajib mengikuti.

Internal Contract.

Plugin tidak boleh.

- Mengubah Pipeline utama.
- Mengubah Runtime.
- Mengubah Context secara sembarangan.

Plugin hanya menambahkan kemampuan baru.

---

# 9. Extension Policy

Extension diperbolehkan.

Namun.

Harus memenuhi.

- Async.
- Promise.
- Cleanup Friendly.
- Stateless.
- Modular.
- Benchmark Ready.

Extension tidak boleh menurunkan kualitas Architecture.

---

# 10. Documentation Policy

Setiap perubahan wajib memperbarui.

- STICKER_UPGRADE.md
- ARCHITECTURE.md
- ENGINE_API.md

Dokumentasi harus selalu lebih dahulu diperbarui sebelum implementasi besar dilakukan.

---

# 11. Performance Commitment

Seluruh pengembangan wajib mempertahankan target berikut.

Image Sticker.

```
< 1 Detik
```

Smeme.

```
≈ 1 Detik
```

Smeme + Emoji.

```
≈ 1–2 Detik
```

Video Sticker.

```
≈ 1–3 Detik
```

Target tersebut dapat ditingkatkan pada versi berikutnya.

Namun tidak boleh menurun.

---

# 12. Long-Term Goals

Sticker Engine V2 dirancang agar mampu.

- Berjalan selama bertahun-tahun.
- Menangani ribuan Request.
- Tetap stabil.
- Tetap mudah dipelihara.
- Tetap mudah dikembangkan.

Architecture dipilih untuk mengurangi kebutuhan Refactor besar pada masa depan.

---

# 13. Core Principles

Prinsip berikut tidak boleh dilanggar.

✅ Buffer First.

✅ Single Responsibility.

✅ Single Processing.

✅ Modular Architecture.

✅ Cleanup Always.

✅ Stateless Engine.

✅ No Circular Dependency.

✅ No Resource Leak.

✅ No Memory Leak.

✅ No Duplicate Processing.

---

# 14. Developer Commitment

Setiap Developer yang mengubah Sticker Engine diharapkan.

- Memahami Architecture.
- Mengikuti Internal Contract.
- Memperbarui Dokumentasi.
- Menjalankan Testing.
- Menjalankan Benchmark.

Tidak ada perubahan yang boleh dilakukan tanpa memahami struktur yang sudah ada.

---

# 15. Final Summary

Sticker Engine V2 bukan sekadar kumpulan utilitas untuk membuat Sticker.

Engine ini dirancang sebagai Framework Sticker lokal yang seluruh prosesnya berjalan secara mandiri tanpa bergantung pada layanan API eksternal.

Seluruh proses, mulai dari analisis media, pengolahan gambar, rendering teks, pengelolaan emoji, encoding WEBP, hingga cleanup resource dilakukan melalui Engine yang saling terpisah namun bekerja sama melalui Pipeline yang terstruktur.

Pendekatan ini memberikan keuntungan berupa performa yang tinggi, struktur yang mudah dipelihara, proses debugging yang lebih sederhana, serta kemampuan untuk menambahkan fitur baru tanpa mengubah fondasi sistem yang telah ada.

Dokumentasi ini menjadi acuan resmi bagi seluruh implementasi Sticker Engine V2 dan diharapkan tetap relevan untuk pengembangan pada versi-versi berikutnya.

---

# Penutup

ENGINE_API.md menjadi referensi implementasi resmi seluruh Engine pada Sticker Engine V2.

Bersama dengan:

- STICKER_UPGRADE.md
- ARCHITECTURE.md

dokumen ini membentuk satu kesatuan dokumentasi yang menjelaskan tujuan pengembangan, desain Architecture, serta standar implementasi Sticker Engine V2 secara menyeluruh.

Seluruh perubahan pada masa mendatang diharapkan tetap mengikuti prinsip-prinsip yang telah ditetapkan agar Sticker Engine terus berkembang tanpa kehilangan konsistensi, kualitas, maupun performanya.

====================================================

END OF DOCUMENT

Sticker Engine V2 Documentation
Version : 2.x
Status : Completed
Documentation Type : Official Technical Documentation