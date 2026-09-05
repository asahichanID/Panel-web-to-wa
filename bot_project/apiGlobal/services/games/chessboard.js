/**
 * apiGlobal/services/games/chessboard.js
 * -----------------------------------------------------------------------
 * Layanan render papan catur (dipakai fitur `.chess`). Ditemukan selama
 * audit migrasi V3: sebelumnya ADA 5 titik pemanggilan `axios.get()`
 * MENTAH langsung di dalam naze.js (masing-masing mengulang daftar 5 URL
 * fallback yang sama persis), melanggar "HTTP Rule" API_GLOBAL_V3.md
 * ("Command/Service DILARANG melakukan HTTP request langsung — hanya
 * Provider yang boleh"). Dipindahkan ke sini sebagai satu layanan
 * bersama, dipakai ulang oleh seluruh varian command catur.
 *
 * Provider (seluruhnya render gambar statis dari FEN, tanpa API Key):
 *   1. chess.com dynboard (gaya standar)
 *   2. chess.com dynboard (gaya graffiti)
 *   3. chessboardimage.com
 *   4. backscattering.de web-boardimage
 *   5. fen2image.chessvision.ai
 */

import { runProviders } from '../../core/requestEngine.js';
import { chessRenderUrl } from '../../providers/chessRender.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'games';

/**
 * @param {string} fen - Posisi papan dalam notasi FEN (belum di-encode).
 * @param {Object} [opts]
 * @param {boolean} [opts.flip=false] - Balik orientasi papan (giliran pemain kedua/hitam).
 * @returns {Promise<{result: Buffer, provider: string, raw: Buffer}>}
 */
export async function apiChessBoardImage(fen, { flip = false } = {}) {
	if (!fen) throw new ValidationError('apiChessBoardImage: parameter "fen" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const encodedFen = encodeURI(fen);
	const flipQS = flip ? '&flip=true' : '';

	const providers = [
		chessRenderUrl('chesscom', `https://www.chess.com/dynboard?fen=${encodedFen}&size=3&coordinates=inside${flipQS}`, timeout),
		chessRenderUrl('chesscom-graffiti', `https://www.chess.com/dynboard?fen=${encodedFen}&board=graffiti&piece=graffiti&size=3&coordinates=inside${flipQS}`, timeout),
		chessRenderUrl('chessboardimage', `https://chessboardimage.com/${encodedFen}${flip ? '-flip' : ''}.png`, timeout),
		chessRenderUrl('backscattering', `https://backscattering.de/web-boardimage/board.png?fen=${encodedFen}&coordinates=true&size=765${flip ? '&orientation=black' : ''}`, timeout),
		chessRenderUrl('fen2image', `https://fen2image.chessvision.ai/${encodedFen}/${flip ? '?pov=black' : ''}`, timeout)
	];

	const { raw, providerName } = await runProviders('games.chessboard', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	return envelope(raw, providerName, raw);
}

export default { apiChessBoardImage };
