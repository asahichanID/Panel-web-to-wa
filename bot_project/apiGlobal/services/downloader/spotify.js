/**
 * apiGlobal/services/downloader/spotify.js
 * -----------------------------------------------------------------------
 * Layanan Spotify (pencarian & unduh). Menggantikan pencarian/unduh yang
 * sebelumnya hardcoded terpisah di:
 *   - musume/upgrade/tracendd.js (cariSpotify / unduhSpotify — 3 provider)
 *   - naze.js case 'spotifydl'   (1 provider: Naze)
 *
 * CATATAN KOMPATIBILITAS PENTING:
 * Bentuk response 3 provider ini TIDAK seragam (kadang di bawah `.result`,
 * kadang `.data`, kadang array langsung), dan command lama sengaja
 * membaca banyak kemungkinan nama field sekaligus (title/name,
 * artist/artists[0].name, dst) karena tidak tahu provider mana yang akan
 * merespons. Supaya migrasi ini AMAN (tidak mengubah perilaku), fungsi
 * di bawah ini TIDAK memaksakan satu bentuk baru — cukup mengembalikan
 * data mentah provider yang menang (`result`), dan command tetap boleh
 * memakai logika pembacaan field yang sudah ada sebelumnya.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { fgmodsSpotifySearch, fgmodsSpotifyDownload } from '../../providers/fgmods.provider.js';
import { vihangaytSpotifySearch, vihangaytSpotifyDownload } from '../../providers/vihangayt.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, validated } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'spotify';

function pickResult(raw) {
	return raw?.result ?? raw?.data ?? raw?.list ?? raw;
}

function extractSearchArray(raw) {
	const data = pickResult(raw);
	return Array.isArray(data) ? data : [];
}

/**
 * Cari lagu di Spotify. Prioritas: Naze → fgmods → vihangayt.
 * Sesuai perilaku asli, provider hanya dianggap berhasil jika mengembalikan
 * minimal 2 hasil.
 *
 * @param {string} query
 * @returns {Promise<{result: any[], provider: string, raw: any}>}
 */
export async function apiSpotifySearch(query) {
	if (!query) throw new ValidationError('apiSpotifySearch: parameter "query" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => extractSearchArray(raw).length >= 2;

	const providers = [
	    validated(neoxrRequest('/spotify-search', { q: query }, { timeout }), isValid),
		validated(nazeRequest('/search/spotify', { query }, { timeout }), isValid),
		validated(fgmodsSpotifySearch(query, timeout), isValid),
		validated(vihangaytSpotifySearch(query, timeout), isValid)
	];

	const { raw, providerName } = await runProviders('spotify.search', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	return envelope(extractSearchArray(raw).slice(0, 10), providerName, raw);
}

/**
 * Unduh audio Spotify berdasarkan URL lagu. Prioritas: Naze → fgmods → vihangayt.
 * `result` dikembalikan apa adanya dari provider yang menang — lihat
 * catatan kompatibilitas di atas file ini.
 *
 * @param {string} url
 */
export async function apiSpotifyDownload(url) {
	if (!url) throw new ValidationError('apiSpotifyDownload: parameter "url" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => {
		const data = pickResult(raw);
		return Boolean(data && (data.url || data.download));
	};

	const providers = [
	    validated(neoxrRequest('/spotify', { url }, { timeout }), isValid),
		validated(nazeRequest('/download/spotify', { url }, { timeout }), isValid),
		validated(fgmodsSpotifyDownload(url, timeout), isValid),
		validated(vihangaytSpotifyDownload(url, timeout), isValid)
	];

	const { raw, providerName } = await runProviders('spotify.download', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	return envelope(pickResult(raw), providerName, raw);
}

export default { apiSpotifySearch, apiSpotifyDownload };
