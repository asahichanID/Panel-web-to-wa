/**
 * apiGlobal/services/tools/emojimix.js
 * -----------------------------------------------------------------------
 * Layanan penggabung 2 emoji jadi stiker (.emojimix). Menggantikan
 * `fetchApi('/tools/emojimix', { emoji1, emoji2 })`.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, validated } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'tools';

/**
 * @param {string} emoji1
 * @param {string} emoji2
 * @returns {Promise<{result: Array<{url: string}>, provider: string, raw: any}>}
 */
export async function apiEmojiMix(emoji1, emoji2) {
	if (!emoji1 || !emoji2) throw new ValidationError('apiEmojiMix: parameter "emoji1" dan "emoji2" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	// NEOXR_ENDPOINTS.md hanya mencantumkan path `/emoji` tanpa contoh
	// response, jadi bentuknya belum terverifikasi. Validasi di bawah
	// memastikan hanya response yang benar-benar berisi URL gambar yang
	// diterima — selain itu otomatis jatuh ke fallback Naze (sudah terbukti).
	const extractUrl = (raw) => raw?.data?.url ?? raw?.data?.[0]?.url ?? raw?.result?.[0]?.url ?? null;
	const isValid = (raw) => Boolean(extractUrl(raw));

	const providers = [
		validated(neoxrRequest('/emoji', { emoji1, emoji2 }, { timeout }), isValid),
		nazeRequest('/tools/emojimix', { emoji1, emoji2 }, { timeout })
	];
	const { raw, providerName } = await runProviders('tools.emojimix', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	const neoxrUrl = extractUrl(raw);
	const result = neoxrUrl ? [{ url: neoxrUrl }] : (raw?.result ?? []);
	return envelope(result, providerName, raw);
}

export default { apiEmojiMix };
