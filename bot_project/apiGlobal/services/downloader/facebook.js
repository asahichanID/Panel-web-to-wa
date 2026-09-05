/**
 * apiGlobal/services/downloader/facebook.js
 * -----------------------------------------------------------------------
 * Layanan Facebook. Prioritas: NeoXR (`/fb`) → Naze (`/download/facebook`).
 *
 * Bentuk response berbeda antar provider:
 *   - Naze  : { result: { hd, sd, title } }
 *   - NeoXR : { data: [{ quality: 'SD'|'HD', url, response }] }  (tidak ada title)
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, validated } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'facebook';

/** Petakan bentuk response NeoXR (array kualitas) ke bentuk yang sama seperti Naze. */
function normalizeNeoxr(data) {
	if (!Array.isArray(data)) return null;
	const hd = data.find((d) => String(d.quality).toUpperCase() === 'HD')?.url ?? null;
	const sd = data.find((d) => String(d.quality).toUpperCase() === 'SD')?.url ?? null;
	return { hd, sd: sd ?? hd, title: '' };
}

/**
 * @param {string} url - URL video Facebook.
 * @returns {Promise<{result: {hd?: string, sd?: string, title?: string}, provider: string, raw: any}>}
 */
export async function apiFacebookDownload(url) {
	if (!url) throw new ValidationError('apiFacebookDownload: parameter "url" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => Array.isArray(raw?.data) && raw.data.some((d) => d.url);

	const providers = [
		validated(neoxrRequest('/fb', { url }, { timeout }), isValid),
		nazeRequest('/download/facebook', { url }, { timeout })
	];

	const { raw, providerName } = await runProviders('facebook.download', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	const result = Array.isArray(raw?.data) ? normalizeNeoxr(raw.data) : (raw?.result ?? null);
	return envelope(result, providerName, raw);
}

export default { apiFacebookDownload };
