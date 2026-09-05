/**
 * apiGlobal/providers/vihangayt.provider.js
 * -----------------------------------------------------------------------
 * Provider: vihangayt.me — fallback terakhir untuk pencarian & unduh
 * Spotify (sebelumnya hardcoded di musume/upgrade/tracendd.js).
 */

import { request } from '../core/httpClient.js';

const BASE = 'https://vihangayt.me';

export function vihangaytSpotifySearch(query, timeout) {
	return {
		name: 'vihangayt',
		timeout,
		run: () => request({ url: `${BASE}/search/spotify`, params: { q: query }, timeoutMs: timeout })
	};
}

export function vihangaytSpotifyDownload(url, timeout) {
	return {
		name: 'vihangayt',
		timeout,
		run: () => request({ url: `${BASE}/download/spotify`, params: { url }, timeoutMs: timeout })
	};
}

export default { vihangaytSpotifySearch, vihangaytSpotifyDownload };
