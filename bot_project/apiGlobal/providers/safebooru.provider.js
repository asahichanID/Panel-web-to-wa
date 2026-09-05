/**
 * apiGlobal/providers/safebooru.provider.js
 * -----------------------------------------------------------------------
 * Provider: safebooru.org — sumber utama gambar untuk layanan waifu/neko.
 * (Sebelumnya hardcoded di naze.js case 'waifu'/'neko'.)
 */

import { request } from '../core/httpClient.js';

const SAFE_TAGS = [
	'1girl', 'solo', 'smile', 'cute', 'blush', 'looking_at_viewer',
	'-monster_girl', '-mecha', '-horror', '-old_woman'
];

export function safebooruRandom(timeout) {
	return {
		name: 'safebooru',
		timeout,
		run: () => {
			const page = Math.floor(Math.random() * 200);
			return request({
				url: 'https://safebooru.org/index.php',
				params: {
					page: 'dapi', s: 'post', q: 'index', json: 1,
					limit: 100, pid: page, tags: SAFE_TAGS.join('+')
				},
				timeoutMs: timeout
			});
		}
	};
}

export default { safebooruRandom };
