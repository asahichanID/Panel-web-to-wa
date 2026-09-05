/**
 * apiGlobal/services/tools/recolor.js
 * -----------------------------------------------------------------------
 * Layanan pewarnaan ulang gambar (.dehaze/.colorize/.colorfull).
 * Menggantikan `fetchApi('/tools/recolor', form, { stream: true })`.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'image';

/**
 * @param {import('form-data')} form - FormData berisi field `buffer` (gambar sumber).
 * @returns {Promise<{result: string, provider: string, raw: string}>} `result` = path file gambar sementara.
 */
export async function apiRecolor(form) {
	if (!form) throw new ValidationError('apiRecolor: parameter "form" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest('/tools/recolor', {}, { timeout, responseType: 'stream', form })];
	const { raw, providerName } = await runProviders('tools.recolor', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw, providerName, raw);
}

export default { apiRecolor };
