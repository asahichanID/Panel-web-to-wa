# apiGlobal

Lapisan abstraksi tunggal untuk seluruh komunikasi ke API/provider eksternal di
project **Oguri-hitori-v2**. Dibangun sesuai spesifikasi di **[`API_ARCHITECTURE.md`](./API_ARCHITECTURE.md)**
— baca dokumen itu terlebih dahulu untuk memahami filosofi & aturan dasarnya.

## Kenapa apiGlobal?

Sebelum migrasi, setiap command memanggil API pihak ketiga langsung dari dalam
`naze.js`/`musume/**` — lengkap dengan URL, API Key, dan penanganan error yang
ditulis ulang di puluhan tempat berbeda, dengan gaya yang tidak konsisten. Jika
satu provider berubah/down, setiap command yang memakainya harus diperbaiki
satu per satu.

`apiGlobal` menyatukan semua itu jadi satu gerbang:

```js
import { apiPlay, apiTiktokDownload, apiOguriChat } from './apiGlobal/index.js'
```

Command tidak perlu tahu:
- URL/endpoint provider
- API Key
- Provider mana yang dipakai (atau berapa banyak provider fallback-nya)
- Bentuk JSON asli tiap provider (semua dinormalisasi ke bentuk konsisten)

## Cara Pakai Cepat

```js
import { apiTranslate } from './apiGlobal/index.js'

const { result } = await apiTranslate('halo dunia', 'en')
console.log(result.translate) // "hello world"
```

Setiap fungsi `api*` mengembalikan:

```js
{ result: <data>, provider: '<provider yang berhasil>', raw: <response asli> }
```

Jika seluruh provider gagal, fungsi melempar `AllProvidersFailedError` — tangkap
dengan try/catch seperti biasa.

## Dokumen Lain

- **[`AUDIT_REPORT.md`](./AUDIT_REPORT.md)** — hasil audit lengkap seluruh penggunaan API di project ini sebelum migrasi, beserta peta command → fungsi apiGlobal.
- **[`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)** — cara menambah command/provider/layanan baru.

## Struktur Folder

```
apiGlobal/
├── index.js          <- satu-satunya file yang boleh diimpor command
├── config/           <- Base URL, API Key, timeout, retry (terpusat)
├── core/              <- mesin fallback/retry/timeout, normalizer, error, logger, cache
├── providers/          <- adapter mentah per provider eksternal (tidak tahu "bisnis")
└── services/           <- fungsi `api*` yang dipakai command, dikelompokkan per domain
```

## Prinsip Utama

1. **Satu gerbang** — command hanya boleh `import ... from './apiGlobal/index.js'`.
2. **Fallback otomatis** — tiap layanan bisa punya banyak provider; command tidak perlu tahu.
3. **Normalisasi** — bentuk data yang dikembalikan konsisten, tidak tergantung provider mana yang menjawab.
4. **Config terpusat** — Base URL & API Key hanya ada di `config/providers.config.js` (plus jembatan ke `settings.js`/`.setapikey` yang sudah ada).
5. **Placeholder bukan error** — layanan yang belum punya provider (`anime.js`, `lyrics.js`) tetap aman diimpor, hanya melempar `NotImplementedError` yang jelas saat benar-benar dipanggil.
