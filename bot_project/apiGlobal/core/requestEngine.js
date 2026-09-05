/**
 * apiGlobal/core/requestEngine.js
 * -----------------------------------------------------------------------
 * INI ADALAH JANTUNG apiGlobal.
 *
 * Bertanggung jawab atas seluruh alur di Part 3 API_ARCHITECTURE.md:
 *   - Mencoba provider sesuai urutan prioritas.
 *   - Retry (mencoba ULANG provider yang sama) jika diminta.
 *   - Fallback (BERPINDAH ke provider berikutnya) jika provider gagal.
 *   - Timeout per provider supaya tidak ada request menunggu tanpa batas.
 *   - Jika seluruh provider gagal → melempar SATU error yang jelas
 *     (AllProvidersFailedError), bukan error mentah dari provider tertentu.
 *
 * Service files TIDAK melakukan fallback/retry sendiri — mereka cukup
 * menyusun daftar provider lalu menyerahkan ke `runProviders()` di sini.
 */

import { logger } from './logger.js';
import { AllProvidersFailedError, TimeoutError } from './errors.js';

/**
 * @typedef {Object} ProviderDescriptor
 * @property {string} name - Nama provider (untuk logging & pesan error saja).
 * @property {number} [timeout] - Timeout khusus provider ini (ms).
 * @property {number} [retry] - Berapa kali provider ini boleh dicoba ULANG sebelum fallback.
 * @property {() => Promise<any>} run - Fungsi yang benar-benar melakukan request.
 */

async function runWithTimeout(runFn, timeoutMs, providerName) {
	let timer;
	try {
		return await Promise.race([
			Promise.resolve().then(runFn),
			new Promise((_, reject) => {
				timer = setTimeout(() => reject(new TimeoutError(providerName, timeoutMs)), timeoutMs);
			})
		]);
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Jalankan daftar provider secara berurutan sesuai prioritas.
 *
 * @param {string} serviceName - Nama layanan, untuk log & pesan error (mis. "youtube.audio").
 * @param {ProviderDescriptor[]} providers - Daftar provider terurut dari prioritas tertinggi.
 * @param {Object} [options]
 * @param {number} [options.defaultTimeout=15000]
 * @param {number} [options.defaultRetry=0]
 * @returns {Promise<{ raw: any, providerName: string }>}
 */
export async function runProviders(serviceName, providers, options = {}) {
	const { defaultTimeout = 15000, defaultRetry = 0 } = options;

	if (!Array.isArray(providers) || providers.length === 0) {
		throw new AllProvidersFailedError(serviceName, [
			{ providerName: '(tidak ada provider terdaftar)', attempt: 0, message: 'Daftar provider kosong.' }
		]);
	}

	const attempts = [];

	for (const provider of providers) {
		const timeoutMs = provider.timeout ?? defaultTimeout;
		const maxRetry = provider.retry ?? defaultRetry;

		for (let attempt = 0; attempt <= maxRetry; attempt++) {
			try {
				const raw = await runWithTimeout(provider.run, timeoutMs, provider.name);
				logger.attempt(serviceName, provider.name, true);
				return { raw, providerName: provider.name };
			} catch (err) {
				const message = err?.message || String(err);
				attempts.push({ providerName: provider.name, attempt, message });
				logger.attempt(serviceName, provider.name, false, message);
			}
		}
	}

	throw new AllProvidersFailedError(serviceName, attempts);
}

export default { runProviders };
