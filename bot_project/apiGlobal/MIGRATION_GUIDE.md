# MIGRATION_GUIDE.md — Menambah Layanan/Provider Baru di apiGlobal

Panduan singkat untuk pengembang yang ingin menambah command baru, provider baru,
atau memperluas layanan yang sudah ada. Baca `API_ARCHITECTURE.md` terlebih dahulu
untuk memahami filosofi dasarnya.

---

## A. Menambah Command yang Memakai Layanan yang SUDAH ADA

Cukup impor dari satu tempat:

```js
import { apiTiktokDownload } from './apiGlobal/index.js'

const { result } = await apiTiktokDownload(url)
console.log(result.download.video.nowm_hd)
```

Tidak perlu tahu provider mana yang dipakai, tidak perlu tahu API Key, tidak perlu
menangani retry/fallback manual — semua sudah ditangani di dalam.

Jika seluruh provider gagal, fungsi akan **throw** `AllProvidersFailedError`. Tangkap
seperti error biasa:

```js
try {
  const { result } = await apiTiktokDownload(url)
} catch (e) {
  m.reply('Maaf, videonya gagal diambil: ' + e.message)
}
```

---

## B. Menambah Provider Baru pada Layanan yang Sudah Ada

Contoh: menambah provider baru untuk layanan TikTok.

1. Buat fungsi provider mentah di `apiGlobal/providers/<nama>.provider.js`:

```js
// apiGlobal/providers/contohcdn.provider.js
import { request } from '../core/httpClient.js';

export function contohcdnTiktok(url, timeout) {
  return {
    name: 'contohcdn',
    timeout,
    run: () => request({ url: 'https://contohcdn.example/tiktok', params: { url }, timeoutMs: timeout })
  };
}
```

2. Tambahkan sebagai salah satu provider di file layanan terkait
   (`apiGlobal/services/downloader/tiktok.js`), pada posisi prioritas yang diinginkan:

```js
import { contohcdnTiktok } from '../../providers/contohcdn.provider.js';
// ...
const providers = [
  nazeRequest('/download/tiktok', { url }, { timeout }),
  contohcdnTiktok(url, timeout)   // <- fallback baru
];
```

Selesai — command yang memakai `apiTiktokDownload` otomatis mendapat fallback baru
ini tanpa perlu diubah sama sekali.

---

## C. Menambah Layanan Baru dari Nol

1. Tentukan domain (mis. `services/downloader/`, atau bikin folder domain baru bila perlu).
2. Buat file provider mentah di `providers/` (base URL, key, bentuk request).
3. Buat file layanan di `services/<domain>/<nama>.js` yang:
   - Menyusun daftar provider (pakai `runProviders()` dari `core/requestEngine.js`).
   - Menormalisasi hasil (pakai `pickField`/`envelope` dari `core/normalizer.js` bila perlu).
   - Melempar `ValidationError` (dari `core/errors.js`) bila parameter wajib kosong.
4. Ekspor fungsi barunya di `apiGlobal/index.js`.
5. Jalankan `node --check` pada file baru, lalu pastikan importnya resolve.

Template minimal:

```js
// apiGlobal/services/<domain>/<nama>.js
import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

export async function apiContoh(param) {
  if (!param) throw new ValidationError('apiContoh: parameter wajib diisi.');
  const timeout = getTimeout('tools');
  const providers = [nazeRequest('/endpoint/contoh', { param }, { timeout })];
  const { raw, providerName } = await runProviders('contoh', providers, {
    defaultTimeout: timeout, defaultRetry: DEFAULT_RETRY
  });
  return envelope(raw?.result ?? null, providerName, raw);
}
```

---

## D. Mengaktifkan Layanan Placeholder (`anime.js` / `lyrics.js`)

1. Buat file provider baru (mis. `providers/anilist.provider.js`).
2. Buka `services/anime/anime.js`, ganti isi fungsi `apiAnimeSearch` mengikuti
   template di bagian C (hapus `throw new NotImplementedError(...)`).
3. Tidak perlu mengubah `apiGlobal/index.js` — export-nya sudah ada.

---

## E. Mengubah API Key / Base URL

Jangan edit provider satu-satu. Cukup ubah di **satu tempat**:

- Lewat command bot: `.setapikey naze <key>` / `.setapikey neo <key>` (tetap berfungsi seperti sebelum migrasi, tersimpan di `settings.js`).
- Lewat environment variable (override tanpa mengubah kode sama sekali):
  ```
  APIGLOBAL_NAZE_APIKEY=xxxxx
  APIGLOBAL_NEOXR_BASEURL=https://api.neoxr.eu/api
  ```
- Lewat `apiGlobal/config/providers.config.js` (nilai default bawaan, prioritas paling rendah).

---

## F. Checklist Sebelum Commit

- [ ] `node --check` pada file yang diubah/ditambah.
- [ ] Tidak ada URL/API Key yang hardcode di luar `providers/` dan `config/`.
- [ ] Command tidak mengimpor apa pun selain dari `apiGlobal/index.js`.
- [ ] Layanan baru sudah diekspor di `apiGlobal/index.js`.
- [ ] Jika layanan punya lebih dari 1 provider, urutan prioritas sudah sesuai (yang paling stabil di posisi pertama).
