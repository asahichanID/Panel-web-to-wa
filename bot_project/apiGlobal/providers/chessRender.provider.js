/**
 * apiGlobal/providers/chessRender.provider.js
 * -----------------------------------------------------------------------
 * Provider untuk layanan render papan catur dari string FEN. Beberapa
 * layanan publik menyediakan ini sebagai URL gambar langsung (tanpa JSON,
 * tanpa API Key) — ditemukan selama audit V3 sebagai pelanggaran "HTTP
 * Rule" (5 titik `axios.get()` mentah langsung di naze.js, lihat
 * apiGlobal/services/games/chessboard.js untuk detail perbaikannya).
 */

import { request } from '../core/httpClient.js';

/**
 * @param {string} name - Nama render engine (untuk logging).
 * @param {string} url - URL gambar papan catur yang sudah lengkap dengan query param.
 * @param {number} [timeout]
 */
export function chessRenderUrl(name, url, timeout) {
	return {
		name: `chess:${name}`,
		timeout,
		run: () => request({ url, method: 'GET', responseType: 'buffer', timeoutMs: timeout })
	};
}

export default { chessRenderUrl };
