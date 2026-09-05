/**
 * apiGlobal/services/misc/agify.js
 * -----------------------------------------------------------------------
 * Layanan prediksi usia berdasarkan nama (.cekmati). Menggantikan
 * `axios.get('https://api.agify.io/?name=...')` yang sebelumnya ada
 * langsung di naze.js (ditemukan saat audit migrasi V3).
 */

import { runProviders } from '../../core/requestEngine.js';
import { agifyPredict } from '../../providers/agify.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'misc';

/**
 * @param {string} name
 * @returns {Promise<{result: {name: string, age: number|null, count: number}, provider: string, raw: any}>}
 */
export async function apiAgifyPredict(name) {
	if (!name) throw new ValidationError('apiAgifyPredict: parameter "name" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [agifyPredict(name, timeout)];

	const { raw, providerName } = await runProviders('misc.agify', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	return envelope(raw ?? { age: null }, providerName, raw);
}

export default { apiAgifyPredict };
