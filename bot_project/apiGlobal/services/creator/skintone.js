/**
 * apiGlobal/services/creator/skintone.js
 * -----------------------------------------------------------------------
 * Layanan efek "skin tone" pada foto (.hitamkan/.toblack).
 * Menggantikan `fetchApi('/create/skin-tone', form, { stream: true })`
 * yang sebelumnya ada langsung di naze.js.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'image';

/**
 * @param {import('form-data')} form - FormData yang sudah berisi field `style` dan `buffer` (gambar sumber).
 * @returns {Promise<{result: string, provider: string, raw: string}>} `result` = path file gambar sementara.
 */
export async function apiSkinTone(form) {
	if (!form) throw new ValidationError('apiSkinTone: parameter "form" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest('/create/skin-tone', {}, { timeout, responseType: 'stream', form })];
	const { raw, providerName } = await runProviders('image.skinTone', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw, providerName, raw);
}

export default { apiSkinTone };
