/**
 * apiGlobal/providers/neoxr.provider.js
 * -----------------------------------------------------------------------
 * Provider: NeoXR API (https://api.neoxr.eu/api) — PROVIDER UTAMA project
 * ini sesuai API_GLOBAL_V3.md.
 *
 * Endpoint yang didukung mengikuti `NEOXR_ENDPOINTS.md` sebagai satu-
 * satunya referensi endpoint/parameter/response — tidak ada endpoint yang
 * ditebak. Naze tetap dipasang sebagai fallback pada setiap layanan yang
 * memakai NeoXR, sehingga command tidak berhenti bekerja walau NeoXR
 * sedang bermasalah.
 *
 * `neoxrRequest(endpoint, params, options)` adalah primitif generik yang
 * dipakai oleh seluruh file layanan (services/**) untuk membangun
 * ProviderDescriptor siap pakai. Mendukung GET, POST JSON, POST FormData,
 * dan auto-download (banyak endpoint NeoXR mengembalikan JSON berisi
 * `data.url` menunjuk ke file sesungguhnya — lihat NEOXR_ENDPOINTS.md).
 *
 * PERBAIKAN BUG (migrasi V3):
 *   1. Sebelumnya fungsi ini membaca `global.APIs?.neoxr` /
 *      `global.APIKeys?.neoxr` langsung — SELALU undefined karena
 *      global.APIKeys sebenarnya di-key oleh Base URL (bukan nama
 *      provider), sehingga Base URL/API Key NeoXR TIDAK PERNAH benar-benar
 *      terbaca dari konfigurasi (hanya kebetulan jatuh ke nilai default
 *      hardcode). Sekarang memakai getBaseUrl()/getApiKey() dari
 *      config/index.js — satu-satunya sumber kebenaran konfigurasi.
 *   2. Sebelumnya opsi auto-download membaca `options.stream` padahal
 *      SELURUH pemanggil (dan httpClient.js) memakai nama `streamTo`.
 *      Akibatnya path tujuan file custom (mis. per-frame video di
 *      apiBratVideoFrame) SELALU diabaikan diam-diam dan diganti nama
 *      file acak. Sekarang konsisten memakai `streamTo`.
 */

import { request } from '../core/httpClient.js';
import { getBaseUrl, getApiKey, getTimeout } from '../config/index.js';

/**
 * @param {string} endpoint - Path endpoint NeoXR, mis. '/youtube' atau 'youtube'.
 * @param {Object} [params] - Query params (GET) atau body (POST).
 * @param {Object} [options]
 * @param {'GET'|'POST'} [options.method='GET']
 * @param {number} [options.timeout]
 * @param {'json'|'stream'|'buffer'} [options.responseType='json']
 * @param {Object} [options.headers]
 * @param {Object} [options.body] - Field tambahan untuk body POST JSON (digabung dengan params).
 * @param {import('form-data')} [options.form] - Kirim sebagai multipart/form-data bila diisi.
 * @param {string} [options.streamTo] - Path tujuan file jika responseType='stream'.
 * @param {string} [options.extensionHint]
 */
export function neoxrRequest(endpoint, params = {}, options = {}) {
	const {
		method = 'GET',
		timeout = getTimeout('tools'),
		responseType = 'json',
		headers = {},
		body = null,
		form = null,
		streamTo = null,
		extensionHint = null
	} = options;

	return {
		name: 'neoxr',
		endpoint,
		params,
		options,
		timeout,

		async run() {
			const base = getBaseUrl('neoxr');
			const apikey = getApiKey('neoxr');
			const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

			const requestOptions = {
				timeoutMs: timeout,
				headers,
				extensionHint
			};

			let response;

			// ===========================
			// GET
			// ===========================
			if (method.toUpperCase() === 'GET') {
				const query = new URLSearchParams({ ...params, apikey });

				response = await request({
					...requestOptions,
					url: `${base}${path}?${query}`,
					method: 'GET',
					responseType: 'json'
				});

			// ===========================
			// FORM DATA
			// ===========================
			} else if (form) {
            	form.append('apikey', apikey);
            
            	response = await request({
            		...requestOptions,
            		url: `${base}${path}`,
            		method: 'POST',
            		data: form,
            		responseType: 'json',
            		headers: {
            			...(typeof form.getHeaders === 'function' ? form.getHeaders() : {}),
            			...headers
            		}
            	});
            
            console.log('===== NEOXR REMINI RESPONSE =====')
            console.dir(response, { depth: null })

			// ===========================
			// POST JSON
			// ===========================
			} else {
				response = await request({
					...requestOptions,
					url: `${base}${path}`,
					method: 'POST',
					responseType: 'json',
					headers: {
						'content-type': 'application/json',
						...headers
					},
					data: {
						...params,
						...(body || {}),
						apikey
					}
				});
			}

			// ===========================
			// AUTO STREAM / BUFFER
			// ===========================
			// Banyak endpoint NeoXR (iqc/brat/bratvid/nulis/remini/waifu/dst)
			// mengembalikan JSON berisi `data.url` yang menunjuk ke file
			// sesungguhnya (lihat NEOXR_ENDPOINTS.md). Jika command meminta
			// 'stream'/'buffer', provider WAJIB otomatis mengunduh file itu
			// sendiri supaya command tidak perlu tahu ada 2 langkah request.
			if (responseType === 'stream' || responseType === 'buffer') {
			console.log('Resolved fileUrl:', fileUrl)
				const fileUrl =
                    response?.data?.url ??
                    response?.data?.result ??
                    response?.data?.image ??
                    response?.data?.video ??
                    response?.data?.audio ??
                    response?.url ??
                    response?.result

				if (!fileUrl) return response;

				return await request({
					url: fileUrl,
					method: 'GET',
					responseType,
					timeoutMs: timeout,
					streamTo,
					extensionHint
				});
			}

			return response;
		}
	};
}

export default { neoxrRequest };
