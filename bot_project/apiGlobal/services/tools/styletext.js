/**
 * apiGlobal/services/tools/styletext.js
 * -----------------------------------------------------------------------
 * Layanan variasi gaya teks (.style). Menggantikan
 * `fetchApi('/tools/styletext', { text })`.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'tools';

/**
 * @param {string} text
 * @returns {Promise<{result: Array<{name: string, result: string}>, provider: string, raw: any}>}
 */
export async function apiStyleText(text) {
	if (!text) throw new ValidationError('apiStyleText: parameter "text" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest('/tools/styletext', { text }, { timeout })];
	const { raw, providerName } = await runProviders('tools.styletext', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw?.result ?? [], providerName, raw);
}

export default { apiStyleText };
