/**
 * apiGlobal/providers/urbandictionary.provider.js
 * -----------------------------------------------------------------------
 * Provider: api.urbandictionary.com — API publik, tidak butuh API Key.
 * (Sebelumnya hardcoded di naze.js case 'urban'.)
 */

import { request } from '../core/httpClient.js';

export function urbanDefine(term, timeout) {
	return {
		name: 'urbandictionary',
		timeout,
		run: () => request({
			url: 'https://api.urbandictionary.com/v0/define',
			params: { term },
			timeoutMs: timeout
		})
	};
}

export default { urbanDefine };
