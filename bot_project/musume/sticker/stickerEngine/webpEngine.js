/**
 * ============================================================
 *  Sticker Engine V2 — WebP Engine
 * ============================================================
 *
 * Tujuan: Encoding akhir ke format WEBP — statis (lewat Sharp,
 * jauh lebih cepat drpd ffmpeg utk kasus ini) maupun animasi
 * (didelegasikan ke FFmpeg Engine, sesuai Dependency Rule "FFmpeg
 * atau WebP encoder"). Dipakai untuk jalur gambar statis & smeme;
 * jalur video/animasi pada praktiknya SUDAH menghasilkan WEBP
 * langsung dari Video Engine -> FFmpeg Engine (lihat sticker.js),
 * namun kapabilitas encodeAnimated() di sini tetap disediakan penuh
 * supaya fitur tidak berkurang dan API tetap lengkap sesuai dokumentasi.
 *
 * Public API : encode(context)
 * Fungsi     : static, animated, quality, compression, encoding
 * Return     : WEBP Buffer (langsung)
 * Performance Target : 100 – 400 ms
 *
 * Dependency Rule: HANYA Sharp atau FFmpeg Engine.
 * ============================================================
 */

import sharp from 'sharp'
import { StickerEngineError, ERROR_CODES, createLogger, PERFORMANCE_TARGET, STICKER_LIMITS, fastFingerprint } from './constants.js'
import { cacheEngine } from './cacheEngine.js'
import { ffmpegEngine } from './ffmpegEngine.js'

const logger = createLogger('WebpEngine')
const NS = 'webp'

cacheEngine.configureNamespace(NS, { max: 50, ttl: 60 * 1000 })

/**
 * Encode statis lewat Sharp, dengan quality-stepping otomatis apabila
 * hasil masih melebihi STICKER_LIMITS.maxOutputBytes — mencegah sticker
 * gagal terkirim akibat ukuran file berlebih (stabilitas > memaksakan
 * quality config apa adanya).
 */
async function encodeStatic(buffer, options = {}) {
	let quality = Math.min(100, Math.max(1, options.quality ?? 90))
	const maxBytes = options.maxBytes || STICKER_LIMITS.maxOutputBytes
	const floor = 35
	let out

	for (let i = 0; i < 5; i++) {
		try {
			out = await sharp(buffer).webp({ quality, effort: 4, alphaQuality: 100 }).toBuffer()
		} catch (err) {
			throw new StickerEngineError('WebpEngine', ERROR_CODES.ENCODE_FAILED, `Gagal encode static WEBP: ${err.message}`, undefined, err)
		}
		if (out.length <= maxBytes || quality <= floor) break
		quality = Math.max(floor, quality - 15)
	}

	return out
}

/** Encode animasi: didelegasikan ke FFmpeg Engine (dependency yang diizinkan). */
async function encodeAnimated(buffer, options = {}) {
	const result = await ffmpegEngine.execute({
		input: buffer,
		inputExt: options.inputExt || 'input',
		size: options.size || STICKER_LIMITS.maxDimension,
		fps: options.fps || STICKER_LIMITS.maxFps,
		duration: options.duration || STICKER_LIMITS.maxDurationSec,
		resource: options.resource
	})
	return result.buffer
}

/**
 * encode(context): nama internal `encodeContext` dipakai secara konsisten
 * untuk keterbacaan; tidak ada isu shadowing di sini karena `encode`
 * bukan identifier global.
 */
async function encodeContext(context) {
	const start = process.hrtime.bigint()

	if (!context || !Buffer.isBuffer(context.buffer) || context.buffer.length === 0) {
		throw new StickerEngineError('WebpEngine', ERROR_CODES.INVALID_PNG, 'context.buffer harus berupa Buffer gambar yang valid.')
	}

	const metadata = context.metadata || {}
	const animated = !!metadata.animated
	const cfg = context.config || {}
	const quality = cfg.image?.quality ?? 90

	const cacheKey = fastFingerprint(context.buffer, `webp:${animated}:${quality}`)
	const cached = cacheEngine.get(NS, cacheKey)
	if (cached.hit) {
		context.resource?.trackBuffer(cached.value)
		return cached.value
	}

	let buffer
	if (animated) {
		buffer = await encodeAnimated(context.buffer, {
			size: cfg.render?.canvas,
			fps: metadata.fps,
			duration: metadata.duration,
			resource: context.resource
		})
	} else {
		buffer = await encodeStatic(context.buffer, { quality })
	}

	context.resource?.trackBuffer(buffer)
	cacheEngine.set(NS, cacheKey, buffer)

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	const target = animated ? PERFORMANCE_TARGET.webpMax : PERFORMANCE_TARGET.webpMin
	if (ms > target * 2) logger.warn(`encode() melebihi target performa: ${ms.toFixed(2)}ms`)
	else logger.debug(`encode() selesai ${ms.toFixed(2)}ms (${buffer.length} bytes, animated=${animated})`)

	return buffer
}

export const webpEngine = {
	encode: encodeContext,
	encodeStatic,
	encodeAnimated
}

export default webpEngine
