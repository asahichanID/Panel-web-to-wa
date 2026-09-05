/**
 * apiGlobal/services/tools/qrcode.js
 * -----------------------------------------------------------------------
 * Layanan pembuatan QR Code (.toqr/.qr). Menggantikan
 * `fetchApi('/tools/to-qr', { data: text }, { stream: true })`.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'tools';

/**
 * @param {string} data - Teks yang akan diubah menjadi QR Code.
 * @returns {Promise<{result: string, provider: string, raw: string}>} `result` = path file gambar sementara.
 */
export async function apiQrCodeGenerate(data) {
	if (!data) throw new ValidationError('apiQrCodeGenerate: parameter "data" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest('/tools/to-qr', { data }, { timeout, responseType: 'stream' })];
	const { raw, providerName } = await runProviders('tools.qrcode', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw, providerName, raw);
}

export default { apiQrCodeGenerate };
