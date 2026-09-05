/**
 * apiGlobal/providers/naze.provider.js
 * -----------------------------------------------------------------------
 * Provider: Naze API (https://api.naze.biz.id)
 *
 * Ini adalah provider yang SUDAH TERBUKTI berjalan di hampir seluruh
 * fitur project ini sebelum migrasi (dulu diakses lewat global.fetchApi
 * di index.js / fetchApi di lib/fetch.js). Karena Naze adalah API
 * multi-endpoint generik (satu base URL, banyak path), satu fungsi
 * generik di bawah ini cukup untuk melayani seluruh kebutuhan path-nya —
 * berbeda dengan provider lain yang butuh 1 fungsi per endpoint.
 *
 * Bentuk response Naze (JSON): { status: bool, result: <data> }
 */

import { request } from '../core/httpClient.js';
import { getBaseUrl, getApiKey } from '../config/index.js';

/**
 * @param {string} path - Path endpoint, contoh: '/download/youtube'.
 * @param {Object} [params] - Query params (GET) atau body (POST).
 * @param {Object} [opts]
 * @param {'GET'|'POST'} [opts.method='GET']
 * @param {'json'|'buffer'|'stream'} [opts.responseType='json']
 * @param {number} [opts.timeout] - Timeout khusus (ms), jika tidak diisi memakai default layanan pemanggil.
 * @param {Object} [opts.headers]
 * @param {string} [opts.streamTo]
 * @param {string} [opts.extensionHint]
 * @param {import('form-data')} [opts.form] - Kirim sebagai multipart/form-data bila diisi (menggantikan `params` sebagai body).
 */
export function nazeRequest(path, params = {}, opts = {}) {
	const {
		method = 'GET',
		responseType = 'json',
		timeout,
		headers = {},
		streamTo,
		extensionHint,
		form
	} = opts;

	return {
		name: 'naze',
		timeout,
		run: () => {
			const baseUrl = getBaseUrl('naze');
			const apikey = getApiKey('naze');
			const url = `${baseUrl}${path}`;

			if (form) {
				return request({
					url,
					method: 'POST',
					data: form,
					headers,
					responseType,
					streamTo,
					extensionHint,
					timeoutMs: timeout
				});
			}

			if (method.toUpperCase() === 'GET') {
				return request({
					url,
					method: 'GET',
					params: { ...params, apikey },
					headers,
					responseType,
					streamTo,
					extensionHint,
					timeoutMs: timeout
				});
			}

			return request({
				url,
				method: 'POST',
				data: { ...params, apikey },
				headers: { 'content-type': 'application/json', ...headers },
				responseType,
				streamTo,
				extensionHint,
				timeoutMs: timeout
			});
		}
	};
}

export default { nazeRequest };
