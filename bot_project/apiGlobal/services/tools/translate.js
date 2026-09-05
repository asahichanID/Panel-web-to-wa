/**
 * apiGlobal/services/tools/translate.js
 * -----------------------------------------------------------------------
 * Layanan Translate (.translate/.tr). Menggantikan
 * `fetchApi('/tools/translate', { text, lang })`.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'tools';

/**
 * @param {string} text
 * @param {string} lang - Kode bahasa tujuan, mis. 'id', 'en'.
 * @returns {Promise<{result: {translate: string}, provider: string, raw: any}>}
 */
export async function apiTranslate(text, lang) {
	if (!text) throw new ValidationError('apiTranslate: parameter "text" wajib diisi.');
	if (!lang) throw new ValidationError('apiTranslate: parameter "lang" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest('/tools/translate', { text, lang }, { timeout })];

	const { raw, providerName } = await runProviders('tools.translate', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	return envelope(raw?.result ?? null, providerName, raw);
}

export default { apiTranslate };
