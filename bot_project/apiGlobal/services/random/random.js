/**
 * apiGlobal/services/random/random.js
 * -----------------------------------------------------------------------
 * Layanan konten acak (quotes/motivasi/dsb). Menggantikan seluruh
 * `fetchApi('/random/*')` yang sebelumnya ada langsung di naze.js.
 *
 * Setiap kategori dikembalikan APA ADANYA dari provider (`result`) karena
 * bentuknya memang berbeda per kategori (string biasa, atau object
 * dengan field quotes/author, atau color_blind[], dst) dan hanya ada
 * satu provider nyata untuk masing-masing saat ini.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';

const SERVICE_GROUP = 'random';

async function runRandom(category, path) {
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest(path, {}, { timeout })];
	const { raw, providerName } = await runProviders(`random.${category}`, providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw?.result ?? null, providerName, raw);
}

export const apiRandomMotivasi = () => runRandom('motivasi', '/random/motivasi');
export const apiRandomBijak = () => runRandom('bijak', '/random/bijak');
export const apiRandomDare = () => runRandom('dare', '/random/dare');
export const apiRandomQuotes = () => runRandom('quotes', '/random/quotes');
export const apiRandomTruth = () => runRandom('truth', '/random/truth');
export const apiRandomRenungan = () => runRandom('renungan', '/random/renungan');
export const apiRandomBucin = () => runRandom('bucin', '/random/bucin');
export const apiRandomColorBlind = () => runRandom('colorBlind', '/random/color-blind');

export default {
	apiRandomMotivasi,
	apiRandomBijak,
	apiRandomDare,
	apiRandomQuotes,
	apiRandomTruth,
	apiRandomRenungan,
	apiRandomBucin,
	apiRandomColorBlind
};
