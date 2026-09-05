/**
 * apiGlobal/providers/fgmods.provider.js
 * -----------------------------------------------------------------------
 * Provider: fgmods.xyz — dipakai sebagai fallback ke-2/ke-3 untuk
 * pencarian Pinterest dan pencarian/unduh Spotify (sebelumnya hardcoded
 * langsung di naze.js & musume/upgrade/tracendd.js).
 */

import { request } from '../core/httpClient.js';

const BASE = 'https://api.fgmods.xyz/api';

export function fgmodsPinterestSearch(query, timeout) {
	return {
		name: 'fgmods',
		timeout,
		run: () => request({ url: `${BASE}/search/pinterest`, params: { q: query }, timeoutMs: timeout })
	};
}

export function fgmodsSpotifySearch(query, timeout) {
	return {
		name: 'fgmods',
		timeout,
		run: () => request({ url: `${BASE}/search/spotify`, params: { q: query }, timeoutMs: timeout })
	};
}

export function fgmodsSpotifyDownload(url, timeout) {
	return {
		name: 'fgmods',
		timeout,
		run: () => request({ url: `${BASE}/downloader/spotify`, params: { url }, timeoutMs: timeout })
	};
}

export default { fgmodsPinterestSearch, fgmodsSpotifySearch, fgmodsSpotifyDownload };
