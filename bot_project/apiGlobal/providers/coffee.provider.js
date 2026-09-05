/**
 * apiGlobal/providers/coffee.provider.js
 * -----------------------------------------------------------------------
 * Provider ganda untuk gambar kopi acak (sebelumnya hardcoded di naze.js
 * case 'coffe'/'kopi').
 *
 * - alexflipnote: URL statis yang me-redirect ke gambar acak setiap kali
 *   diakses. Tidak perlu di-fetch sebagai JSON — cukup dikembalikan
 *   sebagai URL, karena begitulah cara command lama memakainya
 *   (langsung dioper ke naze.sendFileUrl).
 * - sampleapis: fallback nyata berupa daftar JSON, dipilih satu secara acak.
 */

import { request } from '../core/httpClient.js';

const ALEXFLIPNOTE_URL = 'https://coffee.alexflipnote.dev/random';

export function alexflipnoteCoffee(timeout) {
	return {
		name: 'alexflipnote',
		timeout,
		// Tidak ada request sungguhan di sini: URL ini sendiri yang bersifat
		// acak di sisi server setiap kali diakses/di-download oleh pengirim
		// pesan. Kita hanya perlu memvalidasi server itu hidup dengan HEAD
		// request ringan supaya fallback tetap berfungsi bila server down.
		run: async () => {
			await request({ url: ALEXFLIPNOTE_URL, method: 'GET', responseType: 'buffer', timeoutMs: timeout });
			return ALEXFLIPNOTE_URL;
		}
	};
}

export function sampleapisCoffee(timeout) {
	return {
		name: 'sampleapis',
		timeout,
		run: () => request({ url: 'https://api.sampleapis.com/coffee/hot', timeoutMs: timeout })
	};
}

export default { alexflipnoteCoffee, sampleapisCoffee };
