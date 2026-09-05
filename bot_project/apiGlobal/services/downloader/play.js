/**
 * apiGlobal/services/downloader/play.js
 * -----------------------------------------------------------------------
 * Layanan khusus untuk command `.play` (cari lagu lalu unduh audio).
 * API_ARCHITECTURE.md secara eksplisit menyebut `play.js` sebagai file
 * terpisah dari `youtube.js` (walau keduanya memakai provider yang sama)
 * karena keduanya mewakili KEBUTUHAN command yang berbeda:
 *   - play.js    -> input: hasil pencarian (query lagu)
 *   - youtube.js -> input: URL video langsung
 *
 * Pencarian judul lagu (yt-search) tetap menjadi tanggung jawab command,
 * BUKAN apiGlobal — apiGlobal hanya menangani komunikasi ke provider
 * unduhan, sesuai ruang lingkup di API_ARCHITECTURE.md.
 */

import { apiYoutubeAudio } from './youtube.js';

/**
 * @param {string} videoUrl - URL video YouTube hasil pencarian yt-search.
 */
export async function apiPlay(videoUrl) {
	return apiYoutubeAudio(videoUrl);
}

export default { apiPlay };
