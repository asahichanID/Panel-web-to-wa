/**
 * apiGlobal/services/anime/waifu.js
 * -----------------------------------------------------------------------
 * Layanan gambar waifu/neko (.waifu/.neko). Prioritas: NeoXR (`/waifu`)
 * → Safebooru → NekosAPI → Nekos.best.
 *
 * PERBAIKAN BUG (migrasi V3): sebelumnya provider NeoXR ditulis sebagai
 * `validated(Promise.all(Array.from({length:5}, () => neoxrRequest('/waifu'))), ...)`.
 * Ini SALAH TOTAL — `neoxrRequest(...)` mengembalikan sebuah
 * ProviderDescriptor `{name, run}` secara sinkron (BUKAN Promise), jadi
 * membungkusnya di `Promise.all([...5 descriptor...])` tidak pernah benar-
 * benar memanggil `.run()`. Lalu `validated()` mengharapkan SATU
 * ProviderDescriptor, bukan sebuah Promise — akibatnya `provider.run` selalu
 * `undefined` dan seluruh percobaan NeoXR pasti gagal setiap saat.
 * Endpoint `/waifu` sendiri sebenarnya hanya perlu DIPANGGIL SEKALI
 * (mengembalikan satu gambar acak per panggilan, lihat NEOXR_ENDPOINTS.md),
 * jadi tidak pernah butuh 5 percobaan paralel sejak awal.
 */

import { runProviders } from '../../core/requestEngine.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { safebooruRandom } from '../../providers/safebooru.provider.js';
import { nekosapiRandom } from '../../providers/nekosapi.provider.js';
import { nekosbestRandom } from '../../providers/nekosbest.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, pickField, validated } from '../../core/normalizer.js';

const SERVICE_GROUP = 'anime';

function extractImageUrl(raw) {
	// NeoXR: { data: { url } }.
	if (raw?.data?.url) return raw.data.url;
	// Safebooru: array langsung, tiap item punya sample_url atau file_url.
	if (Array.isArray(raw) && raw.length) {
		const random = raw[Math.floor(Math.random() * raw.length)];
		if (random?.sample_url || random?.file_url) return random.sample_url || random.file_url;
	}
	// NekosAPI: { items: [{ image_url }] }.
	const nekosapiUrl = pickField(raw, ['items.0.image_url']);
	if (nekosapiUrl) return nekosapiUrl;
	// Nekos.best: { results: [{ url }] }.
	return pickField(raw, ['results.0.url']);
}

/**
 * Ambil satu gambar waifu/neko acak. Prioritas: NeoXR → Safebooru → NekosAPI → Nekos.best.
 *
 * @returns {Promise<{result: string, provider: string, raw: any}>} `result` = URL gambar.
 */
export async function apiWaifuRandom() {
	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => Boolean(extractImageUrl(raw));

	const providers = [
		validated(neoxrRequest('/waifu', {}, { timeout }), isValid),
		validated(safebooruRandom(timeout), isValid),
		validated(nekosapiRandom(timeout), isValid),
		validated(nekosbestRandom('waifu', timeout), isValid)
	];

	const { raw, providerName } = await runProviders('anime.waifu', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	return envelope(extractImageUrl(raw), providerName, raw);
}

export default { apiWaifuRandom };
