/**
 * apiGlobal/services/anime/anime.js
 * -----------------------------------------------------------------------
 * Layanan pencarian anime (.anime). Diaktifkan pada migrasi V3 setelah
 * endpoint NeoXR `/anime` terdokumentasi di NEOXR_ENDPOINTS.md (sebelumnya
 * placeholder karena tidak ada endpoint yang terverifikasi).
 *
 * Tidak ada provider fallback lain untuk layanan ini (Naze tidak pernah
 * memiliki endpoint pencarian anime) — NeoXR satu-satunya provider.
 *
 * CATATAN: NEOXR_ENDPOINTS.md hanya mencontohkan response untuk endpoint
 * ini, tidak mencontohkan nama parameter request secara eksplisit. Nama
 * parameter `q` dan `query` dikirim SEKALIGUS (tidak saling mengganggu)
 * supaya kompatibel dengan kemungkinan implementasi mana pun tanpa
 * mengira-ngira satu nama secara sepihak.
 */

import { runProviders } from '../../core/requestEngine.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'anime';

/**
 * @param {string} query - Judul anime yang dicari.
 * @returns {Promise<{result: Array<{title:string, score:string, type:string, url:string}>, provider: string, raw: any}>}
 */
export async function apiAnimeSearch(query) {
	if (!query) throw new ValidationError('apiAnimeSearch: parameter "query" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [
		neoxrRequest('/anime', { q: query, query }, { timeout })
	];

	const { raw, providerName } = await runProviders('anime.search', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	return envelope(raw?.data ?? [], providerName, raw);
}

export default { apiAnimeSearch };
