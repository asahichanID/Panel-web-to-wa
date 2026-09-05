/**
 * apiGlobal/services/lyrics/lyrics.js
 * -----------------------------------------------------------------------
 * PONDASI/PLACEHOLDER — fitur pencarian lirik lagu BELUM ADA di project
 * ini sebelum migrasi (perlu dibedakan dari `.tebaklirik`, yang merupakan
 * GAME tebak lirik lewat `/games/tebaklirik`, bukan pencarian lirik).
 * Sesuai Part 4 API_ARCHITECTURE.md, file ini tetap dibuat sebagai
 * pondasi supaya struktur apiGlobal lengkap dan siap dipakai kapan saja.
 *
 * Cara mengaktifkan di masa depan:
 *   1. Tambahkan fungsi provider di apiGlobal/providers/<nama>.provider.js
 *   2. Panggil fungsi tersebut lewat runProviders() di bawah ini
 *   3. Hapus NotImplementedError setelah provider terpasang
 */

import { NotImplementedError } from '../../core/errors.js';

/**
 * @param {string} title - Judul lagu yang dicari liriknya.
 * @throws {NotImplementedError} Selalu — layanan ini belum memiliki provider aktif.
 */
export async function apiLyricsSearch(title) {
	throw new NotImplementedError('lyrics.search');
}

export default { apiLyricsSearch };
