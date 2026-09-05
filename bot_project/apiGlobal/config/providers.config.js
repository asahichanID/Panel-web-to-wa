/**
 * apiGlobal/config/providers.config.js
 * -----------------------------------------------------------------------
 * SATU-SATUNYA tempat Base URL & API Key provider disimpan.
 * Sesuai Part 2 API_ARCHITECTURE.md: "API Key cukup berada di satu
 * lokasi konfigurasi. Apabila suatu hari API Key berubah, saya hanya
 * ingin mengubah satu file."
 *
 * PENTING — Kompatibilitas dengan sistem lama:
 * Project ini SUDAH memiliki mekanisme `global.APIs` / `global.APIKeys`
 * (diisi dari settings.js) yang bisa diubah live lewat command
 * ".setapikey" (lihat naze.js case 'setapikey'/'setbotapikey', yang
 * memanggil updateSettings() di lib/function.js). Supaya command itu
 * TETAP BERFUNGSI tanpa perubahan apa pun, resolver di bawah ini
 * membaca `global.APIs`/`global.APIKeys` secara LIVE (bukan sekali saat
 * import), baru jatuh ke nilai default bawaan apiGlobal jika belum ada.
 *
 * Urutan prioritas resolusi (paling tinggi ke rendah):
 *   1. Environment variable  (APIGLOBAL_<PROVIDER>_APIKEY / _BASEURL)
 *   2. global.APIs / global.APIKeys (live, diubah lewat .setapikey)
 *   3. Nilai default bawaan apiGlobal (DEFAULTS di bawah)
 */

/**
 * Nilai default. `naze` & `neoxr` diambil dari kredensial yang SUDAH
 * dipakai secara nyata di project ini sebelum migrasi (settings.js dan
 * musume/upgrade/play.js), supaya tidak ada fitur yang mendadak berhenti
 * bekerja hanya karena proses migrasi ke apiGlobal.
 */
const DEFAULTS = {
	naze: {
		baseUrl: 'https://api.naze.biz.id',
		key: 'nz-880c23d4fd'
	},
	neosantara: {
		baseUrl: 'https://api.neosantara.xyz/v1',
		key: 'API_KEY_NEOSANTARA_AI' // placeholder — wajib diganti pemilik bot
	},
	// Neoxr adalah provider utama menurut API_ARCHITECTURE.md Part 2/3.
	// Endpoint yang SUDAH terbukti berjalan di project ini hanyalah
	// endpoint YouTube (lihat musume/upgrade/play.js). Endpoint lain pada
	// Neoxr belum pernah dipakai di project ini sebelumnya, sehingga
	// path/response persis untuk layanan lain PERLU diverifikasi ulang
	// oleh pemilik bot sebelum diaktifkan penuh (lihat AUDIT_REPORT.md).
	neoxr: {
		baseUrl: 'https://api.neoxr.eu/api',
		key: 'j3i3mg'
	},
	// Provider fallback tambahan yang sebelumnya sudah dipakai secara
	// hardcoded langsung di dalam command (spotify & pinterest search).
	// Dipindahkan ke sini supaya tidak lagi tersebar di banyak file.
	fgmods: { baseUrl: 'https://api.fgmods.xyz/api' },
	vihangayt: { baseUrl: 'https://vihangayt.me' },
	maelyn: { baseUrl: 'https://api.maelyn.tech/api' },
	nexoracle: { baseUrl: 'https://api.nexoracle.com' },

	// Provider murni publik (tidak butuh API Key).
	safebooru: { baseUrl: 'https://safebooru.org/index.php' },
	nekosapi: { baseUrl: 'https://api.nekosapi.com/v4' },
	nekosbest: { baseUrl: 'https://nekos.best/api/v2' },
	github: { baseUrl: 'https://api.github.com' },
	urbandictionary: { baseUrl: 'https://api.urbandictionary.com/v0' },
	sampleapis: { baseUrl: 'https://api.sampleapis.com' },
	alexflipnote: { baseUrl: 'https://coffee.alexflipnote.dev' },
	uguu: { baseUrl: 'https://uguu.se' }
};

function envOverride(providerName, suffix) {
	const key = `APIGLOBAL_${providerName.toUpperCase()}_${suffix}`;
	const value = process.env[key];
	return value && value.trim() ? value.trim() : null;
}

/** Baca dari jembatan global.APIs/global.APIKeys (live, bisa berubah runtime). */
function readLegacyGlobal(providerName) {
	try {
		// `global` disediakan langsung oleh runtime Node.js (bukan import).
		// Project ini mengisinya lewat settings.js (global.APIs/global.APIKeys)
		// dan bisa diubah runtime lewat command ".setapikey".
		const base = typeof global !== 'undefined' ? global.APIs?.[providerName] : undefined;
		if (!base) return { baseUrl: null, key: null };
		const keys = typeof global !== 'undefined' ? global.APIKeys : undefined;
		return { baseUrl: base, key: keys?.[base] ?? null };
	} catch {
		return { baseUrl: null, key: null };
	}
}

/**
 * @param {string} providerName
 * @returns {string} Base URL provider (tanpa trailing slash).
 */
export function getBaseUrl(providerName) {
	const legacy = readLegacyGlobal(providerName);
	const url =
		envOverride(providerName, 'BASEURL') ||
		legacy.baseUrl ||
		DEFAULTS[providerName]?.baseUrl ||
		null;
	return url ? url.replace(/\/+$/, '') : null;
}

/**
 * @param {string} providerName
 * @returns {string} API Key provider (string kosong jika tidak butuh/tidak diset).
 */
export function getApiKey(providerName) {
	const legacy = readLegacyGlobal(providerName);
	return (
		envOverride(providerName, 'APIKEY') ||
		legacy.key ||
		DEFAULTS[providerName]?.key ||
		''
	);
}

/** Apakah API Key provider ini sudah diisi dengan nilai yang valid (bukan placeholder)? */
export function isConfigured(providerName) {
	const key = getApiKey(providerName);
	return Boolean(key) && !/^API_KEY_/.test(key);
}

export default { getBaseUrl, getApiKey, isConfigured, DEFAULTS };
