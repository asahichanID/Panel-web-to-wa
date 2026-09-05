/**
 * apiGlobal/providers/agify.provider.js
 * -----------------------------------------------------------------------
 * Provider: api.agify.io — API publik (tidak butuh API Key), prediksi usia
 * berdasarkan nama. Ditemukan selama audit migrasi V3: sebelumnya dipanggil
 * langsung lewat `axios.get()` di naze.js (case 'cekmati'), melanggar
 * "HTTP Rule" API_GLOBAL_V3.md.
 */

import { request } from '../core/httpClient.js';

export function agifyPredict(name, timeout) {
	return {
		name: 'agify',
		timeout,
		run: () => request({ url: 'https://api.agify.io/', params: { name }, timeoutMs: timeout })
	};
}

export default { agifyPredict };
