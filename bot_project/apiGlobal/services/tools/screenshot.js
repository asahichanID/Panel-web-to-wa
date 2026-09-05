/**
 * apiGlobal/services/tools/screenshot.js
 * -----------------------------------------------------------------------
 * Layanan tangkapan layar situs web (.ssweb). Menggantikan
 * `fetchApi('/tools/ss', { url }, { stream: true })`.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'tools';

/**
 * @param {string} url - URL situs web yang akan di-screenshot.
 * @returns {Promise<{result: string, provider: string, raw: string}>} `result` = path file gambar sementara.
 */
export async function apiScreenshot(url) {
	if (!url) throw new ValidationError('apiScreenshot: parameter "url" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest('/tools/ss', { url }, { timeout, responseType: 'stream' })];
	const { raw, providerName } = await runProviders('tools.screenshot', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw, providerName, raw);
}

export default { apiScreenshot };
