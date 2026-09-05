/**
 * ============================================================
 *  Sticker Engine V2 — constants.js
 * ============================================================
 *
 * Sumber kebenaran (source of truth) untuk seluruh konstanta,
 * default konfigurasi, kode error, dan Performance Target yang
 * dipakai bersama oleh seluruh Engine di stickerEngine/.
 *
 * Dokumen acuan:
 *  - musume/sticker/ARCHITECTURE.md
 *  - musume/sticker/ENGINE_API.md
 *  - musume/sticker/STICKER_UPGRADE.md
 *
 * File ini TIDAK memiliki dependency ke Engine lain (leaf module),
 * sehingga aman di-import oleh Engine manapun tanpa risiko
 * Circular Dependency.
 * ============================================================
 */

import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Root folder musume/sticker (satu level di atas stickerEngine/)
export const STICKER_ROOT = path.join(__dirname, '..')

// Root project (perkiraan; dipakai untuk temp dir yang konsisten
// dengan konvensi lama: <project>/database/temp)
export const PROJECT_ROOT = path.join(STICKER_ROOT, '..', '..')

export const TEMP_DIR = path.join(PROJECT_ROOT, 'database', 'temp')

export const FONTS_DIR = path.join(STICKER_ROOT, 'fonts')

export const CONFIG_PATH = path.join(STICKER_ROOT, 'stickermeme.json')

export const ENGINE_VERSION = '2.0.0'

/**
 * Performance Target — nilai acuan (ms) sesuai ENGINE_API.md.
 * Dipakai untuk instrumentation/logging, BUKAN untuk memaksa gagal
 * (soft target, bukan hard timeout) kecuali disebutkan lain
 * (mis. FFmpeg Engine punya timeout keras sendiri).
 */
export const PERFORMANCE_TARGET = Object.freeze({
	media: 5,
	metadataImage: 10,
	metadataVideo: 30,
	image: 80,
	video: 100,
	canvas: 120,
	text: 20,
	font: 5,
	emojiMin: 20,
	emojiMax: 300,
	cache: 1,
	webpMin: 100,
	webpMax: 400,
	exif: 10,
	ffmpegMin: 500,
	ffmpegMax: 2500,
	workerStartup: 5,
	temp: 5,
	cleanup: 20
})

/**
 * Batas keras (hard limit) sticker — dipakai sebagai jaring pengaman
 * di dalam Engine (defense in depth), terlepas dari validasi yang
 * sudah dilakukan di level command (naze.js) supaya command lama TIDAK
 * diubah tetapi tetap aman apabila dipanggil dari jalur lain.
 */
export const STICKER_LIMITS = Object.freeze({
	maxDimension: 512, // WhatsApp sticker canvas standar
	maxDurationSec: 10, // animated sticker
	maxFps: 15,
	maxAnimatedFrames: 150, // safety net (10s * 15fps)
	maxOutputBytes: 1_000_000 // ~1MB, soft cap kualitas WEBP
})

export const SUPPORTED_IMAGE_MIME = Object.freeze([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/bmp',
	'image/tiff'
])

export const SUPPORTED_VIDEO_MIME = Object.freeze([
	'video/mp4',
	'video/webm',
	'video/quicktime',
	'video/x-matroska',
	'video/3gpp',
	'video/x-msvideo'
])

/** Kode error terstandar (Error Rule — ENGINE_API.md Part 1 #7) */
export const ERROR_CODES = Object.freeze({
	// Media Engine
	INVALID_BUFFER: 'INVALID_BUFFER',
	EMPTY_BUFFER: 'EMPTY_BUFFER',
	UNSUPPORTED_MIME: 'UNSUPPORTED_MIME',
	UNKNOWN_MEDIA: 'UNKNOWN_MEDIA',
	// Metadata Engine
	INVALID_IMAGE: 'INVALID_IMAGE',
	INVALID_VIDEO: 'INVALID_VIDEO',
	UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
	METADATA_FAILED: 'METADATA_FAILED',
	// Image Engine
	RESIZE_FAILED: 'RESIZE_FAILED',
	DECODE_FAILED: 'DECODE_FAILED',
	ENCODE_FAILED: 'ENCODE_FAILED',
	// Video Engine
	DURATION_TOO_LONG: 'DURATION_TOO_LONG',
	UNSUPPORTED_CODEC: 'UNSUPPORTED_CODEC',
	// Canvas Engine
	CANVAS_FAILED: 'CANVAS_FAILED',
	RENDER_FAILED: 'RENDER_FAILED',
	INVALID_CANVAS: 'INVALID_CANVAS',
	INVALID_FONT: 'INVALID_FONT',
	// Text Engine
	EMPTY_TEXT: 'EMPTY_TEXT',
	INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
	// Font Engine
	FONT_NOT_FOUND: 'FONT_NOT_FOUND',
	REGISTRATION_FAILED: 'REGISTRATION_FAILED',
	// Emoji Engine
	EMOJI_UNSUPPORTED: 'EMOJI_UNSUPPORTED',
	MISSING_RENDERER: 'MISSING_RENDERER',
	// Cache Engine
	CACHE_MISS: 'CACHE_MISS',
	INVALID_KEY: 'INVALID_KEY',
	CACHE_FULL: 'CACHE_FULL',
	// WebP Engine
	INVALID_PNG: 'INVALID_PNG',
	INVALID_ANIMATION: 'INVALID_ANIMATION',
	// Exif Engine
	INVALID_METADATA: 'INVALID_METADATA',
	INVALID_STICKER: 'INVALID_STICKER',
	// FFmpeg Engine
	FFMPEG_FAILED: 'FFMPEG_FAILED',
	FFMPEG_TIMEOUT: 'FFMPEG_TIMEOUT',
	FFMPEG_NOT_FOUND: 'FFMPEG_NOT_FOUND',
	// Worker Engine
	WORKER_FAILED: 'WORKER_FAILED',
	WORKER_TIMEOUT: 'WORKER_TIMEOUT',
	// Temp Engine
	TEMP_CREATE_FAILED: 'TEMP_CREATE_FAILED',
	// Generic
	PIPELINE_FAILED: 'PIPELINE_FAILED',
	UNKNOWN_ERROR: 'UNKNOWN_ERROR'
})

/**
 * StickerEngineError — Error terstruktur seragam untuk seluruh Engine.
 * Selalu memiliki: code, engine, message, details (opsional), cause (opsional).
 * Tidak pernah di-swallow; selalu naik ke pemanggil (Sticker Engine)
 * untuk diputuskan fallback/final handling-nya.
 */
export class StickerEngineError extends Error {
	constructor(engine, code, message, details = undefined, cause = undefined) {
		super(message || code)
		this.name = 'StickerEngineError'
		this.engine = engine
		this.code = code || ERROR_CODES.UNKNOWN_ERROR
		this.details = details
		if (cause) this.cause = cause
		Error.captureStackTrace?.(this, StickerEngineError)
	}
}

/**
 * Logger minimal & seragam. Tidak menggunakan library eksternal supaya
 * Cache/Cleanup/Temp Engine (leaf-ish module) tidak menambah dependency baru.
 * Disable-able lewat env STICKER_ENGINE_SILENT=1 (mis. saat testing).
 */
export function createLogger(scope) {
	const silent = process.env.STICKER_ENGINE_SILENT === '1'
	const prefix = `[StickerEngineV2:${scope}]`
	return {
		debug(...args) {
			if (silent) return
			if (process.env.STICKER_ENGINE_DEBUG === '1') console.log(prefix, ...args)
		},
		info(...args) {
			if (silent) return
			console.log(prefix, ...args)
		},
		warn(...args) {
			if (silent) return
			console.warn(prefix, ...args)
		},
		error(...args) {
			if (silent) return
			console.error(prefix, ...args)
		}
	}
}

/**
 * Fingerprint cepat untuk Buffer, dipakai sebagai cache key lintas
 * Engine (Metadata/Image/WebP) supaya konten yang identik (mis. sticker
 * viral yang sama dikirim banyak user) tidak diproses berulang kali
 * (mencegah Duplicate Processing/Resize/Encode secara global, bukan
 * hanya dalam satu job/pipeline run).
 *
 * Sengaja TIDAK meng-hash seluruh Buffer (bisa mahal untuk file besar);
 * cukup sampel ukuran + potongan awal/tengah/akhir supaya tetap O(1)
 * terhadap ukuran Buffer dan aman dipakai di jalur yang punya
 * Performance Target ketat (< 10-30ms).
 */
export function fastFingerprint(buffer, extra = '') {
	if (!Buffer.isBuffer(buffer) || buffer.length === 0) return `empty:${extra}`
	const size = buffer.length
	const sampleSize = 256
	const head = buffer.subarray(0, Math.min(sampleSize, size))
	const midStart = Math.max(0, Math.floor(size / 2) - sampleSize / 2)
	const mid = buffer.subarray(midStart, Math.min(midStart + sampleSize, size))
	const tail = buffer.subarray(Math.max(0, size - sampleSize), size)
	const hash = crypto.createHash('sha1')
	hash.update(head)
	hash.update(mid)
	hash.update(tail)
	hash.update(String(size))
	if (extra) hash.update(String(extra))
	return `${size}:${hash.digest('hex')}`
}

/** Util kecil: ukur durasi eksekusi function async, dipakai untuk instrumentation Performance Target. */
export async function withTiming(scope, label, fn) {
	const logger = createLogger(scope)
	const start = process.hrtime.bigint()
	try {
		return await fn()
	} finally {
		const end = process.hrtime.bigint()
		const ms = Number(end - start) / 1_000_000
		logger.debug(`${label} selesai dalam ${ms.toFixed(2)}ms`)
	}
}
