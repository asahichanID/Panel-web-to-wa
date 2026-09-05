/**
 * apiGlobal/services/tools/shortlink.js
 * -----------------------------------------------------------------------
 * Layanan pemendek URL (.tinyurl/.shorturl/.shortlink). Menggantikan
 * `fetchApi('/other/tinyurl', { url })` yang sebelumnya ada langsung di naze.js.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'tools';

/**
 * @param {string} url - URL panjang yang akan dipendekkan.
 * @returns {Promise<{result: string, provider: string, raw: any}>} `result` = URL pendek.
 */
export async function apiShortlink(url) {
	if (!url) throw new ValidationError('apiShortlink: parameter "url" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest('/other/tinyurl', { url }, { timeout })];
	const { raw, providerName } = await runProviders('tools.shortlink', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw?.result ?? null, providerName, raw);
}

export default { apiShortlink };
