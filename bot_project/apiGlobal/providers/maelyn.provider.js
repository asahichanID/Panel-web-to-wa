/**
 * apiGlobal/providers/maelyn.provider.js
 * -----------------------------------------------------------------------
 * Provider: api.maelyn.tech — fallback ke-2 untuk pencarian Pinterest
 * (sebelumnya hardcoded di naze.js case 'pinterest').
 */

import { request } from '../core/httpClient.js';

const BASE = 'https://api.maelyn.tech/api';

export function maelynPinterestSearch(query, timeout) {
	return {
		name: 'maelyn',
		timeout,
		run: () => request({ url: `${BASE}/search/pinterest`, params: { q: query }, timeoutMs: timeout })
	};
}

export default { maelynPinterestSearch };
