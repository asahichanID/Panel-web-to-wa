/**
 * apiGlobal/providers/github.provider.js
 * -----------------------------------------------------------------------
 * Provider: api.github.com — API publik, tidak butuh API Key untuk
 * lookup user dasar. (Sebelumnya hardcoded di naze.js case 'ghstalk'.)
 */

import { request } from '../core/httpClient.js';

export function githubUser(username, timeout) {
	return {
		name: 'github',
		timeout,
		run: () => request({ url: `https://api.github.com/users/${encodeURIComponent(username)}`, timeoutMs: timeout })
	};
}

export default { githubUser };
