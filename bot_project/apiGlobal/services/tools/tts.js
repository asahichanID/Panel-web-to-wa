/**
 * apiGlobal/services/tools/tts.js
 * -----------------------------------------------------------------------
 * Layanan Text-to-Speech (.tts). Menggantikan
 * `fetchApi('/tools/tts', { text }, { stream: true })`.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'tools';

/**
 * @param {string} text
 * @returns {Promise<{result: string, provider: string, raw: string}>} `result` = path file audio sementara.
 */
export async function apiTextToSpeech(text) {
	if (!text) throw new ValidationError('apiTextToSpeech: parameter "text" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest('/tools/tts', { text }, { timeout, responseType: 'stream' })];
	const { raw, providerName } = await runProviders('tools.tts', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw, providerName, raw);
}

export default { apiTextToSpeech };
