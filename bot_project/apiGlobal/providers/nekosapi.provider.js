/**
 * apiGlobal/providers/nekosapi.provider.js
 * -----------------------------------------------------------------------
 * Provider: api.nekosapi.com — fallback ke-2 untuk layanan waifu/neko.
 */

import { request } from '../core/httpClient.js';

export function nekosapiRandom(timeout) {
	return {
		name: 'nekosapi',
		timeout,
		run: () => request({
			url: 'https://api.nekosapi.com/v4/images/random',
			params: { rating: 'safe' },
			timeoutMs: timeout
		})
	};
}

export default { nekosapiRandom };
