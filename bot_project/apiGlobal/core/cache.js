/**
 * apiGlobal/core/cache.js
 * -----------------------------------------------------------------------
 * Cache in-memory sederhana berbasis TTL (Time To Live).
 *
 * Dipakai OPSIONAL oleh layanan yang datanya tidak wajib selalu baru
 * (mis. hasil pencarian, gambar random dari sumber yang jarang berubah)
 * supaya tidak membebani provider dengan request berulang dalam waktu
 * singkat. Layanan yang butuh data selalu fresh (random/games) TIDAK
 * perlu memakai cache ini sama sekali — pemakaian bersifat per-layanan.
 */

const store = new Map();

function now() {
	return Date.now();
}

export const cache = {
	/** Ambil value jika masih berlaku (belum expired), selain itu null. */
	get(key) {
		const entry = store.get(key);
		if (!entry) return null;
		if (entry.expiresAt < now()) {
			store.delete(key);
			return null;
		}
		return entry.value;
	},

	/** Simpan value dengan umur `ttlMs` milidetik. */
	set(key, value, ttlMs = 60_000) {
		store.set(key, { value, expiresAt: now() + ttlMs });
		return value;
	},

	has(key) {
		return cache.get(key) !== null;
	},

	delete(key) {
		store.delete(key);
	},

	clear() {
		store.clear();
	},

	/** Bantu debugging: jumlah entri yang sedang tersimpan. */
	size() {
		return store.size;
	}
};

export default cache;
