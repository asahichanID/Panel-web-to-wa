/**
 * apiGlobal/providers/neosantara.provider.js
 * -----------------------------------------------------------------------
 * Provider: Neosantara AI (https://api.neosantara.xyz/v1)
 * Dipakai untuk model AI "premium" (dulu diakses via fetchApi(path, data,
 * { api: 2, headers: { Authorization: 'Bearer <key>' } }) di naze.js).
 *
 * Bentuk response: OpenAI-compatible chat completion
 *   { choices: [ { message: { content } } ], ... }
 */

import { request } from '../core/httpClient.js';
import { getBaseUrl, getApiKey } from '../config/index.js';

/**
 * @param {Object} payload
 * @param {string} payload.model
 * @param {Array<{role:string, content:string}>} payload.messages
 * @param {boolean} [payload.thinking]
 * @param {number} [timeout]
 */
export function neosantaraChatCompletion({ model, messages, thinking }, timeout) {
	return {
		name: 'neosantara',
		timeout,
		run: () =>
			request({
				url: `${getBaseUrl('neosantara')}/chat/completions`,
				method: 'POST',
				data: { model, messages, ...(thinking !== undefined ? { thinking } : {}) },
				headers: {
					'content-type': 'application/json',
					Authorization: `Bearer ${getApiKey('neosantara')}`
				},
				responseType: 'json',
				timeoutMs: timeout
			})
	};
}

export default { neosantaraChatCompletion };
