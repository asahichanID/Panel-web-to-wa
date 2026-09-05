/**
 * ============================================================
 *  Sticker Engine V2 — Font Engine
 * ============================================================
 *
 * Tujuan: Mengelola seluruh Font — registrasi, fallback, cache,
 * dan validasi — dipakai oleh Text Engine & Canvas Engine.
 *
 * Public API : register() / get() / validate()
 * Return     : Font Object -> { family, path, weight, loaded }
 * Worker     : Tidak.
 * Cache      : Ya (Font Cache, lewat Cache Engine).
 * Cleanup    : Tidak diperlukan (font tetap teregistrasi selama proses hidup).
 * Common Failure : Font Not Found, Invalid Font, Registration Failed.
 * Performance Target : < 5 ms
 *
 * Dependency Rule: hanya boleh memakai Canvas library (lewat
 * canvasLib.js) dan Cache Engine (leaf module) — TIDAK memakai
 * Canvas Engine/Text Engine supaya tidak ada Circular Dependency.
 * ============================================================
 */

import fs from 'fs'
import path from 'path'
import { StickerEngineError, ERROR_CODES, createLogger, PERFORMANCE_TARGET } from './constants.js'
import { cacheEngine } from './cacheEngine.js'
import { loadCanvasLib } from './canvasLib.js'
import { loadConfig } from './config.js'

const logger = createLogger('FontEngine')
const NS = 'font'

cacheEngine.configureNamespace(NS, { max: 50, ttl: 0 })

// Nama family internal yang kita kontrol penuh (menghindari tabrakan
// dengan font sistem yang mungkin punya nama mirip, mis. "Impact").
const PRIMARY_FAMILY = 'SE2Primary'
const FALLBACK_FAMILY = 'SE2Fallback'

const VALID_EXT = ['.ttf', '.otf', '.woff', '.woff2', '.ttc']

/** validate(): pengecekan cepat (tanpa I/O berat) apakah path font valid & bisa dipakai. */
function validate(fontPath) {
	if (!fontPath || typeof fontPath !== 'string') return false
	try {
		if (!fs.existsSync(fontPath)) return false
	} catch (_) {
		return false
	}
	const ext = path.extname(fontPath).toLowerCase()
	return VALID_EXT.includes(ext)
}

async function registerOne(family, fontPath, weight) {
	const cacheKey = `${family}:${fontPath}`
	const cached = cacheEngine.get(NS, cacheKey)
	if (cached.hit) return cached.value

	if (!validate(fontPath)) {
		throw new StickerEngineError(
			'FontEngine',
			ERROR_CODES.FONT_NOT_FOUND,
			`File font tidak ditemukan/tidak valid: ${fontPath}`
		)
	}

	const lib = await loadCanvasLib()
	try {
		lib.registerFont(fontPath, family)
	} catch (err) {
		throw new StickerEngineError(
			'FontEngine',
			ERROR_CODES.REGISTRATION_FAILED,
			`Gagal mendaftarkan font ${fontPath}: ${err.message}`,
			{ fontPath },
			err
		)
	}

	const fontObject = { family, path: fontPath, weight: weight || 'normal', loaded: true }
	cacheEngine.set(NS, cacheKey, fontObject)
	return fontObject
}

let registerPromise = null

/**
 * register(): daftarkan font utama + fallback dari config (sekali per
 * proses; concurrent call berbagi Promise yang sama supaya tidak
 * terjadi Duplicate Processing pada registrasi font).
 */
async function register(overrideFontConfig) {
	if (registerPromise && !overrideFontConfig) return registerPromise

	const run = (async () => {
		const start = process.hrtime.bigint()
		const fontConfig = overrideFontConfig || loadConfig().font
		const result = { primary: null, fallback: null }

		try {
			result.primary = await registerOne(PRIMARY_FAMILY, fontConfig.file, fontConfig.weight)
		} catch (err) {
			logger.warn(`Font utama gagal didaftarkan (${err.message})`)
		}

		try {
			result.fallback = await registerOne(FALLBACK_FAMILY, fontConfig.fallback, fontConfig.weight)
		} catch (err) {
			logger.warn(`Font fallback gagal didaftarkan (${err.message})`)
		}

		if (!result.primary && !result.fallback) {
			throw new StickerEngineError(
				'FontEngine',
				ERROR_CODES.FONT_NOT_FOUND,
				'Tidak ada font (utama maupun fallback) yang berhasil didaftarkan. Rendering teks akan memakai font sistem default.'
			)
		}

		const ms = Number(process.hrtime.bigint() - start) / 1_000_000
		if (ms > PERFORMANCE_TARGET.font * 10) logger.warn(`register() lambat: ${ms.toFixed(2)}ms`)
		return result
	})()

	if (!overrideFontConfig) registerPromise = run
	return run
}

/**
 * get(): ambil Font Object siap pakai. name: 'primary' | 'fallback'.
 * Otomatis jatuh ke sisi lain apabila salah satu gagal register,
 * supaya Canvas/Text Engine tetap bisa merender teks (graceful
 * degradation, bukan hard failure).
 */
async function get(name = 'primary') {
	let fonts
	try {
		fonts = await register()
	} catch (err) {
		// Baik primary maupun fallback gagal total: kembalikan null,
		// pemanggil (Text Engine) yang memutuskan fallback ke font sistem.
		logger.warn(`get('${name}') tidak menemukan font ter-register: ${err.message}`)
		return null
	}
	if (name === 'fallback') return fonts.fallback || fonts.primary || null
	return fonts.primary || fonts.fallback || null
}

/** Daftar nama family CSS-like (dengan fallback chain) untuk dipakai langsung sebagai ctx.font family. */
async function activeFamily() {
	let fonts
	try {
		fonts = await register()
	} catch (_) {
		fonts = { primary: null, fallback: null }
	}
	const names = []
	if (fonts.primary) names.push(PRIMARY_FAMILY)
	if (fonts.fallback) names.push(FALLBACK_FAMILY)
	if (names.length === 0) names.push('sans-serif')
	return names.map((n) => (n === 'sans-serif' ? n : `"${n}"`)).join(', ')
}

export const fontEngine = {
	register,
	get,
	validate,
	activeFamily,
	PRIMARY_FAMILY,
	FALLBACK_FAMILY
}

export default fontEngine
