/**
 * apiGlobal/services/downloader/mediafire.js
 * -----------------------------------------------------------------------
 * Layanan Mediafire. Prioritas: NeoXR (`/mediafire`) → Naze (`/download/mediafire`).
 *
 * Bentuk response berbeda antar provider:
 *   - Naze  : { result: { link, filename, size } }
 *   - NeoXR : { data: { title, size, bytes, mime, extension, url } }
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, validated } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'mediafire';

/** Petakan bentuk response NeoXR ke bentuk yang sama seperti Naze. */
function normalizeNeoxr(data) {
	if (!data) return null;
	return { link: data.url ?? null, filename: data.title ?? null, size: data.size ?? null };
}

/**
 * @param {string} url - URL file Mediafire.
 * @returns {Promise<{result: {link: string, filename: string, size: string}, provider: string, raw: any}>}
 */
export async function apiMediafireDownload(url) {
	if (!url) throw new ValidationError('apiMediafireDownload: parameter "url" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => Boolean(raw?.data?.url);

	const providers = [
		validated(neoxrRequest('/mediafire', { url }, { timeout }), isValid),
		nazeRequest('/download/mediafire', { url }, { timeout })
	];

	const { raw, providerName } = await runProviders('mediafire.download', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	const result = raw?.data ? normalizeNeoxr(raw.data) : (raw?.result ?? null);
	return envelope(result, providerName, raw);
}

export default { apiMediafireDownload };
