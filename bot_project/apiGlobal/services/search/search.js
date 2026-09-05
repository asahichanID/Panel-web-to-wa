/**
 * apiGlobal/services/search/search.js
 * -----------------------------------------------------------------------
 * Layanan pencarian umum yang seluruhnya memakai pola sama (satu
 * provider Naze, query sederhana): Google Image, Pixiv, Meloboom (musik),
 * NPM registry, Tenor (GIF). Menggantikan pemanggilan `/search/*` yang
 * sebelumnya ada langsung di naze.js.
 *
 * Bentuk `result` sengaja dikembalikan APA ADANYA dari provider (bukan
 * dipaksa satu bentuk umum) karena tiap sumber pencarian ini memang
 * https://... memiliki struktur data yang secara alami berbeda (hasil
 * Google Custom Search ≠ hasil Pixiv ≠ hasil NPM registry). Memaksakan
 * satu bentuk generik di sini justru akan menyembunyikan informasi yang
 * dibutuhkan command. Lihat prinsip "Jangan Memaksa Seluruh Layanan
 * Menggunakan Desain yang Sama" di API_ARCHITECTURE.md.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'search';

async function runSingleNazeSearch(label, path, query) {
	if (!query) throw new ValidationError(`${label}: parameter "query" wajib diisi.`);
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest(path, { query }, { timeout })];
	const { raw, providerName } = await runProviders(label, providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw?.result ?? null, providerName, raw);
}

/** Pencarian gambar Google Custom Search (.gimage/.bingimg). */
export function apiSearchGoogle(query) {
	return runSingleNazeSearch('search.google', '/search/google', query);
}

/** Pencarian ilustrasi Pixiv (.pixiv). */
export function apiSearchPixiv(query) {
	return runSingleNazeSearch('search.pixiv', '/search/pixiv', query);
}

/** Pencarian musik Meloboom (.ringtone). */
export function apiSearchMeloboom(query) {
	return runSingleNazeSearch('search.meloboom', '/search/meloboom', query);
}

/** Pencarian paket NPM (.npm/.npmjs). */
export function apiSearchNpm(query) {
	return runSingleNazeSearch('search.npm', '/search/npm', query);
}

/** Pencarian GIF Tenor (.tenor). */
export function apiSearchTenor(query) {
	return runSingleNazeSearch('search.tenor', '/search/tenor', query);
}

export default { apiSearchGoogle, apiSearchPixiv, apiSearchMeloboom, apiSearchNpm, apiSearchTenor };
