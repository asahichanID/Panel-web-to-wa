/**
 * ============================================================
 *  Sticker Engine V2 — Metadata Engine
 * ============================================================
 *
 * Tujuan: Membaca seluruh metadata media. Metadata hanya dibaca
 * SATU KALI per Buffer — baik dalam satu Pipeline run (lewat
 * context.metadata yang dipakai ulang oleh Image/Video/Canvas/WebP
 * Engine) maupun lintas request (lewat Cache Engine, keyed dari
 * fingerprint konten Buffer).
 *
 * Public API : read(context)
 * Parameter  : context.buffer (+ context.mime hasil Media Engine)
 * Return     : { width, height, format, mime, duration, fps, animated, alpha, frames }
 * Error      : Invalid Image, Invalid Video, Unsupported Format, Metadata Failed
 * Performance Target : < 10 ms (image) / < 30 ms (video)
 *
 * Dependency Rule: hanya boleh memakai Sharp atau FFprobe (lewat
 * fluent-ffmpeg) — TIDAK memakai Canvas/FFmpeg-encode/Emoji Engine.
 * ============================================================
 */

import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import { StickerEngineError, ERROR_CODES, createLogger, PERFORMANCE_TARGET, fastFingerprint } from './constants.js'
import { cacheEngine } from './cacheEngine.js'
import { tempEngine } from './tempEngine.js'

const logger = createLogger('MetadataEngine')
const NS = 'metadata'

cacheEngine.configureNamespace(NS, { max: 200, ttl: 5 * 60 * 1000 })

function emptyMetadata(overrides = {}) {
	return {
		width: 0,
		height: 0,
		format: 'unknown',
		mime: 'application/octet-stream',
		duration: 0,
		fps: 0,
		animated: false,
		alpha: false,
		frames: 1,
		hasAudio: false,
		...overrides
	}
}

async function readImageMetadata(buffer) {
	let meta
	try {
		meta = await sharp(buffer, { animated: true, limitInputPixels: false }).metadata()
	} catch (err) {
		throw new StickerEngineError(
			'MetadataEngine',
			ERROR_CODES.INVALID_IMAGE,
			`Gagal membaca metadata gambar: ${err.message}`,
			undefined,
			err
		)
	}

	const frames = meta.pages && meta.pages > 0 ? meta.pages : 1
	const animated = frames > 1

	let fps = 0
	if (animated && Array.isArray(meta.delay) && meta.delay.length > 0) {
		const avgDelayMs = meta.delay.reduce((a, b) => a + b, 0) / meta.delay.length
		fps = avgDelayMs > 0 ? Math.round(1000 / avgDelayMs) : 0
	}

	const durationSec = animated && Array.isArray(meta.delay)
		? meta.delay.reduce((a, b) => a + b, 0) / 1000
		: 0

	return emptyMetadata({
		width: meta.width || 0,
		height: animated ? (meta.pageHeight || meta.height || 0) : (meta.height || 0),
		format: meta.format || 'unknown',
		mime: meta.format ? `image/${meta.format}` : 'application/octet-stream',
		duration: durationSec,
		fps,
		animated,
		alpha: !!meta.hasAlpha,
		frames
	})
}

function ffprobeAsync(filePath) {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filePath, (err, data) => {
			if (err) return reject(err)
			resolve(data)
		})
	})
}

async function readVideoMetadata(context) {
	const filePath = await tempEngine.getOrCreateInputFile(context, 'probe')

	let probe
	try {
		probe = await ffprobeAsync(filePath)
	} catch (err) {
		throw new StickerEngineError(
			'MetadataEngine',
			ERROR_CODES.INVALID_VIDEO,
			`ffprobe gagal membaca metadata video: ${err.message}`,
			undefined,
			err
		)
	}

	const videoStream = (probe.streams || []).find((s) => s.codec_type === 'video')
	if (!videoStream) {
		throw new StickerEngineError('MetadataEngine', ERROR_CODES.INVALID_VIDEO, 'Tidak ditemukan video stream pada file.')
	}
	// hasAudio: dipakai StickerToVideo Engine utk memutuskan penyertaan
	// track AAC pada output MP4 (field aditif, tidak mengubah konsumen lama
	// yang belum membaca field ini).
	const hasAudio = (probe.streams || []).some((s) => s.codec_type === 'audio')

	let fps = 0
	if (videoStream.avg_frame_rate && videoStream.avg_frame_rate !== '0/0') {
		const [num, den] = videoStream.avg_frame_rate.split('/').map(Number)
		fps = den ? Math.round(num / den) : 0
	} else if (videoStream.r_frame_rate && videoStream.r_frame_rate !== '0/0') {
		const [num, den] = videoStream.r_frame_rate.split('/').map(Number)
		fps = den ? Math.round(num / den) : 0
	}

	const duration = Number(videoStream.duration || probe.format?.duration || 0)

	return emptyMetadata({
		width: videoStream.width || 0,
		height: videoStream.height || 0,
		format: videoStream.codec_name || 'unknown',
		mime: context.mime || 'video/mp4',
		duration,
		fps,
		animated: true,
		alpha: false,
		hasAudio,
		frames: fps > 0 && duration > 0 ? Math.round(fps * duration) : 0
	})
}

/**
 * read(context): dispatch ke Sharp (image) atau FFprobe (video)
 * berdasarkan context.mime. Hasil di-cache per fingerprint Buffer
 * supaya konten identik tidak diproses berulang lintas request.
 */
async function read(context) {
	if (!context || !Buffer.isBuffer(context.buffer) || context.buffer.length === 0) {
		throw new StickerEngineError('MetadataEngine', ERROR_CODES.EMPTY_BUFFER, 'Buffer kosong/tidak valid untuk dibaca metadata-nya.')
	}

	const isVideo = typeof context.mime === 'string' && context.mime.startsWith('video/')
	const cacheKey = fastFingerprint(context.buffer, isVideo ? 'video' : 'image')

	const cached = cacheEngine.get(NS, cacheKey)
	if (cached.hit) {
		logger.debug('cache hit, metadata tidak dibaca ulang')
		return cached.value
	}

	const start = process.hrtime.bigint()
	const result = isVideo ? await readVideoMetadata(context) : await readImageMetadata(context.buffer)
	const ms = Number(process.hrtime.bigint() - start) / 1_000_000

	const target = isVideo ? PERFORMANCE_TARGET.metadataVideo : PERFORMANCE_TARGET.metadataImage
	if (ms > target * 3) logger.warn(`read() melebihi target performa: ${ms.toFixed(2)}ms (target ${target}ms)`)
	else logger.debug(`read() selesai dalam ${ms.toFixed(2)}ms`)

	cacheEngine.set(NS, cacheKey, result)
	return result
}

export const metadataEngine = {
	read
}

export default metadataEngine
