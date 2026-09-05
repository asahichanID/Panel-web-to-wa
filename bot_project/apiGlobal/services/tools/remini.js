/**
 * apiGlobal/services/tools/remini.js
 * -----------------------------------------------------------------------
 * Layanan peningkatan kualitas gambar (.remini/.tohd/.hd). Menggantikan
 * `fetchApi('/tools/remini', form, { stream: true })`.
 *
 * Fallback lokal berbasis ffmpeg (upscale kasar bila provider gagal)
 * TETAP menjadi tanggung jawab command, bukan apiGlobal — karena itu
 * bukan komunikasi ke provider eksternal.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, validated } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'image';

/**
 * Hasil stream/auto-download yang SUKSES selalu berupa path file (string).
 * Lihat catatan yang sama di services/creator/maker.js.
 */
const isFilePath = (raw) => typeof raw === 'string' && raw.length > 0;

/**
 * @param {import('form-data')} form - FormData berisi field `buffer` (gambar sumber).
 * @returns {Promise<{result: string, provider: string, raw: string}>} `result` = path file gambar sementara.
 */
export async function apiRemini(form) {
	if (!form) throw new ValidationError('apiRemini: parameter "form" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [
		validated(neoxrRequest('/remini', {}, { timeout, responseType: 'stream', form }), isFilePath),
		nazeRequest('/tools/remini', {}, { timeout, responseType: 'stream', form })
	];
	const { raw, providerName } = await runProviders('tools.remini', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw, providerName, raw);
}

export default { apiRemini };
