/**
 * apiGlobal/services/games/games.js
 * -----------------------------------------------------------------------
 * Layanan soal untuk game tebak-tebakan. Menggantikan seluruh
 * `fetchApi('/games/*')` yang sebelumnya ada langsung di naze.js.
 *
 * apiGlobal hanya bertanggung jawab MENGAMBIL soal dari provider.
 * Logika sesi game (timeout, penyimpanan jawaban, dsb) tetap menjadi
 * tanggung jawab command — di luar ruang lingkup API_ARCHITECTURE.md.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';

const SERVICE_GROUP = 'games';

async function runGame(name, path) {
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest(path, {}, { timeout })];
	const { raw, providerName } = await runProviders(`games.${name}`, providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw?.result ?? null, providerName, raw);
}

export const apiGameTekaTeki = () => runGame('tekateki', '/games/tekateki');
export const apiGameTebakLirik = () => runGame('tebaklirik', '/games/tebaklirik');
export const apiGameTebakKata = () => runGame('tebakkata', '/games/tebakkata');
export const apiGameFamily100 = () => runGame('family100', '/games/family100');
export const apiGameSusunKata = () => runGame('susunkata', '/games/susunkata');
export const apiGameTebakKimia = () => runGame('tebakkimia', '/games/tebakkimia');
export const apiGameCakLontong = () => runGame('caklontong', '/games/caklontong');
export const apiGameTebakNegara = () => runGame('tebaknegara', '/games/tebaknegara');
export const apiGameTebakGambar = () => runGame('tebakgambar', '/games/tebakgambar');
export const apiGameTebakBendera = () => runGame('tebakbendera', '/games/tebakbendera');

export default {
	apiGameTekaTeki,
	apiGameTebakLirik,
	apiGameTebakKata,
	apiGameFamily100,
	apiGameSusunKata,
	apiGameTebakKimia,
	apiGameCakLontong,
	apiGameTebakNegara,
	apiGameTebakGambar,
	apiGameTebakBendera
};
