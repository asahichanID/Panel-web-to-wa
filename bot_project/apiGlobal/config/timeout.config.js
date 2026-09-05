/**
 * apiGlobal/config/timeout.config.js
 * -----------------------------------------------------------------------
 * Pusat pengaturan timeout & retry. Sesuai Part 2 API_ARCHITECTURE.md,
 * nilai-nilai ini TIDAK BOLEH ditulis berulang di setiap file layanan —
 * cukup diminta dari sini.
 *
 * Boleh di-override lewat environment variable tanpa mengubah kode:
 *   APIGLOBAL_DEFAULT_TIMEOUT_MS=20000
 *   APIGLOBAL_DEFAULT_RETRY=1
 */

export const DEFAULT_TIMEOUT_MS = Number(process.env.APIGLOBAL_DEFAULT_TIMEOUT_MS) || 15_000;
export const DEFAULT_RETRY = Number(process.env.APIGLOBAL_DEFAULT_RETRY) || 0;

/**
 * Timeout per kelompok layanan (ms). Layanan yang butuh waktu lebih lama
 * (mis. AI, TTS, image processing, download video) diberi angka lebih
 * besar dari default supaya tidak terlalu cepat dianggap gagal.
 */
export const SERVICE_TIMEOUTS = {
	youtube: 30_000,
	tiktok: 20_000,
	instagram: 20_000,
	facebook: 20_000,
	mediafire: 20_000,
	spotify: 15_000,
	ai: 30_000,
	image: 30_000,
	tools: 20_000,
	search: 15_000,
	random: 10_000,
	games: 10_000,
	anime: 12_000,
	misc: 10_000,
	upload: 30_000
};

/**
 * @param {string} group - Nama kelompok layanan, mis. "youtube".
 * @returns {number} timeout dalam milidetik.
 */
export function getTimeout(group) {
	return SERVICE_TIMEOUTS[group] ?? DEFAULT_TIMEOUT_MS;
}

export default { DEFAULT_TIMEOUT_MS, DEFAULT_RETRY, SERVICE_TIMEOUTS, getTimeout };
