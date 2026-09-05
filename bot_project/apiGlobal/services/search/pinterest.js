/**
 * apiGlobal/services/search/pinterest.js
 * -----------------------------------------------------------------------
 * Layanan pencarian gambar Pinterest (.pinterest/.pin/.wallpaper).
 * Prioritas: NeoXR (`/pinterest-v2`) → Naze → maelyn.tech → fgmods.xyz → nexoracle.com.
 *
 * PERBAIKAN BUG (migrasi V3):
 *   1. `nexoraclePinterestSearch` dipakai di daftar provider tapi TIDAK
 *      PERNAH diimpor — setiap pemanggilan apiPinterestSearch akan
 *      langsung crash dengan ReferenceError. Sudah ditambahkan importnya.
 *   2. NeoXR (`/pinterest-v2`) menaruh URL gambar di dalam
 *      `content[0].url` (bukan field `url` rata di setiap item), dan
 *      menyediakan `source` (link pin asli) secara langsung. Item
 *      sekarang dinormalisasi supaya punya `url` rata (diambil dari
 *      `content[0].url`) DAN `source` tetap disertakan apa adanya —
 *      sesuai catatan di NEOXR_ENDPOINTS.md ("sudah support source asli").
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { maelynPinterestSearch } from '../../providers/maelyn.provider.js';
import { fgmodsPinterestSearch } from '../../providers/fgmods.provider.js';
import { nexoraclePinterestSearch } from '../../providers/nexoracle.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, validated } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'search';

/** Ambil array hasil mentah dari berbagai kemungkinan bentuk provider. */
function extractRawList(raw) {
	const list = raw?.result ?? raw?.data ?? raw?.images ?? [];
	return Array.isArray(list) ? list : [];
}

/**
 * Ratakan tiap item supaya selalu punya `.url` di level atas, apa pun
 * provider-nya. NeoXR menaruh URL gambar sesungguhnya di `content[0].url`;
 * provider lain (Naze/maelyn/fgmods/nexoracle) sudah rata dari sananya.
 */
function normalizeItem(item) {
	if (typeof item === 'string') return { url: item };
	if (item?.content?.[0]?.url) {
		return { ...item, url: item.content[0].url };
	}
	return item;
}

function extractList(raw) {
	return extractRawList(raw).map(normalizeItem);
}

/**
 * Cari gambar di Pinterest. Provider dianggap berhasil hanya jika
 * mengembalikan minimal 1 gambar (sesuai perilaku asli sebelum migrasi).
 *
 * @param {string} query
 * @returns {Promise<{result: {list: any[], raw: string}, provider: string, raw: any}>}
 */
export async function apiPinterestSearch(query) {
	if (!query) throw new ValidationError('apiPinterestSearch: parameter "query" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => extractRawList(raw).length > 0;

	const providers = [
		validated(neoxrRequest('/pinterest-v2', { q: query, show: 10, type: 'image' }, { timeout }), isValid),
		validated(nazeRequest('/search/pinterest', { query }, { timeout }), isValid),
		validated(maelynPinterestSearch(query, timeout), isValid),
		validated(fgmodsPinterestSearch(query, timeout), isValid),
		validated(nexoraclePinterestSearch(query, timeout), isValid)
	];

	const { raw, providerName } = await runProviders('search.pinterest', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	// `raw` sebagai string dipertahankan supaya command bisa tetap mencari
	// ID pin asli lewat regex di seluruh isi response (perilaku asli, dipakai
	// sebagai fallback bila item tidak punya `source` langsung dari NeoXR).
	return envelope({ list: extractList(raw), raw: JSON.stringify(raw) }, providerName, raw);
}

export default { apiPinterestSearch };
