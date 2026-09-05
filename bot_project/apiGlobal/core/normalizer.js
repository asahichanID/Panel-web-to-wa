/**
 * apiGlobal/core/normalizer.js
 * -----------------------------------------------------------------------
 * Perkakas bantu generik untuk menormalisasi response provider yang
 * berbeda-beda menjadi satu bentuk yang konsisten (lihat Part 3
 * API_ARCHITECTURE.md — "Response Normalization").
 *
 * Perkakas di file ini TIDAK tahu apa-apa tentang domain tertentu
 * (youtube/tiktok/ai/dsb). Normalisasi yang benar-benar spesifik per
 * domain (mis. field apa saja yang dianggap "judul" pada layanan
 * YouTube) tetap ditulis di masing-masing file layanan, supaya setiap
 * layanan tetap punya kontrol penuh atas bentuk datanya sendiri sesuai
 * prinsip "Jangan Memaksa Seluruh Layanan Menggunakan Desain Yang Sama".
 */

/**
 * Ambil nilai pertama yang ADA (bukan undefined/null) dari beberapa
 * kemungkinan path/nama field. Berguna karena Provider A mungkin memakai
 * "title", Provider B memakai "name", dst.
 *
 * @example
 * pickField(providerJson, ['title', 'name', 'judul']) // -> nilai pertama yang ketemu
 */
export function pickField(source, candidates = [], fallback = undefined) {
	if (!source || typeof source !== 'object') return fallback;
	for (const key of candidates) {
		const value = key.includes('.')
			? key.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), source)
			: source[key];
		if (value !== undefined && value !== null && value !== '') return value;
	}
	return fallback;
}

/**
 * Bungkus hasil akhir yang sudah dinormalisasi ke dalam "amplop" standar
 * yang dipakai di seluruh apiGlobal:
 *
 *   { result: <data ternormalisasi>, provider: <nama provider pemenang>, raw: <response asli> }
 *
 * Properti `result` SENGAJA dipertahankan sebagai nama top-level supaya
 * seluruh command lama yang sudah terbiasa melakukan
 * `const { result } = await ...` tetap kompatibel tanpa perubahan,
 * sekaligus memenuhi prinsip "Command hanya mengenal satu bentuk data".
 */
export function envelope(result, providerName, raw) {
	return { result, provider: providerName, raw };
}

/**
 * Bungkus satu ProviderDescriptor supaya dianggap GAGAL (sehingga engine
 * lanjut ke provider berikutnya) bukan hanya saat exception dilempar,
 * tapi juga saat hasilnya "kurang layak" secara data (mis. array kosong,
 * field penting kosong). Ini mereplikasi perilaku validasi yang sudah
 * ada di beberapa command lama sebelum migrasi (mis. pencarian Spotify
 * yang butuh minimal 2 hasil sebelum dianggap sukses).
 *
 * @param {import('./requestEngine.js').ProviderDescriptor} provider
 * @param {(raw: any) => boolean} isValid - true jika hasil dianggap layak dipakai.
 * @param {string} [reason] - Pesan error jika validasi gagal.
 */
export function validated(provider, isValid, reason = 'Hasil tidak memenuhi syarat minimum.') {
	return {
		...provider,
		run: async () => {
			const raw = await provider.run();
			if (!isValid(raw)) throw new Error(reason);
			return raw;
		}
	};
}

export default { pickField, envelope, validated };
