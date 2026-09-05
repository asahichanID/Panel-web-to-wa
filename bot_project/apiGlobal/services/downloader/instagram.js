/**
 * apiGlobal/services/downloader/instagram.js
 * -----------------------------------------------------------------------
 * Layanan Instagram. Prioritas: NeoXR (`/ig`) → Naze (`/download/instagram2`).
 *
 * Bentuk response berbeda antar provider:
 *   - Naze  : { result: { urls: [{ url, is_video }], caption } }
 *   - NeoXR : { data: [{ type, url }] }  (tidak ada caption — lihat NEOXR_ENDPOINTS.md)
 *
 * Command (naze.js) sudah ditulis mengikuti bentuk Naze (`result.urls`,
 * `result.caption`), jadi response NeoXR dipetakan ke bentuk yang sama.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, validated } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'instagram';

/** Petakan bentuk response NeoXR ke bentuk yang sama seperti Naze. */
function normalizeNeoxr(data) {
	if (!Array.isArray(data)) return null;
	return {
		urls: data.map((item) => ({
			url: item.url,
			is_video: item.type === 'mp4' || item.type === 'video'
		})),
		caption: null // NeoXR tidak mengembalikan caption untuk endpoint ini.
	};
}

/**
 * @param {string} url - URL postingan/reel Instagram.
 * @returns {Promise<{result: {urls: Array<{url:string, is_video:boolean}>, caption: string}, provider: string, raw: any}>}
 */
export async function apiInstagramDownload(url) {
	if (!url) throw new ValidationError('apiInstagramDownload: parameter "url" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => Array.isArray(raw?.data) && raw.data.length > 0;

	const providers = [
		validated(neoxrRequest('/ig', { url }, { timeout }), isValid),
		nazeRequest('/download/instagram2', { url }, { timeout })
	];

	const { raw, providerName } = await runProviders('instagram.download', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	const result = Array.isArray(raw?.data) ? normalizeNeoxr(raw.data) : (raw?.result ?? null);
	return envelope(result, providerName, raw);
}

export default { apiInstagramDownload };
