/**
 * apiGlobal/providers/nekosbest.provider.js
 * -----------------------------------------------------------------------
 * Provider: nekos.best — fallback terakhir untuk layanan waifu/neko.
 */

import { request } from '../core/httpClient.js';

export function nekosbestRandom(category = 'waifu', timeout) {
	return {
		name: 'nekosbest',
		timeout,
		run: () => request({ url: `https://nekos.best/api/v2/${category}`, timeoutMs: timeout })
	};
}

export default { nekosbestRandom };
