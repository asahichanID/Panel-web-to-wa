/**
 * apiGlobal/services/upload/uploader.js
 * -----------------------------------------------------------------------
 * Layanan upload file sementara. Menggantikan `UguuSe()` yang sebelumnya
 * ada di lib/uploader.js (dipakai antara lain oleh alur `.qc` untuk
 * meng-host gambar hasil sementara).
 */

import { runProviders } from '../../core/requestEngine.js';
import { uguuUpload } from '../../providers/uguu.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'upload';

/**
 * @param {string} filePath - Path file lokal yang akan di-upload.
 * @returns {Promise<{result: string, provider: string, raw: any}>} `result` = URL file yang sudah di-upload.
 */
export async function apiUploadFile(filePath) {
	if (!filePath) throw new ValidationError('apiUploadFile: parameter "filePath" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [uguuUpload(filePath, timeout)];

	const { raw, providerName } = await runProviders('upload.file', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	return envelope(raw, providerName, raw);
}

export default { apiUploadFile };
