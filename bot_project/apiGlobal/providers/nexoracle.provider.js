/**
 * apiGlobal/providers/nexoracle.provider.js
 * -----------------------------------------------------------------------
 * Provider: api.nexoracle.com — fallback terakhir untuk pencarian
 * Pinterest (dipakai di apiGlobal/services/search/pinterest.js).
 *
 * CATATAN PERBAIKAN (migrasi V3): file ini SEBELUMNYA HILANG dari project
 * padahal sudah diimpor & dipakai di pinterest.js — setiap pemanggilan
 * apiPinterestSearch akan gagal total (Cannot find module) sebelum
 * sempat mencoba provider mana pun, karena error terjadi saat proses
 * import module (bukan saat runtime request). Ini kemungkinan besar
 * penyebab utama seluruh project gagal dijalankan sebelum migrasi V3 ini.
 */

import { request } from '../core/httpClient.js';

const BASE = 'https://api.nexoracle.com';

export function nexoraclePinterestSearch(query, timeout) {
	return {
		name: 'nexoracle',
		timeout,
		run: () => request({ url: `${BASE}/search/pinterest`, params: { q: query }, timeoutMs: timeout })
	};
}

export default { nexoraclePinterestSearch };
