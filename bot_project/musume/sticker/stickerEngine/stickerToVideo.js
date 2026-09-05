/**
 * ============================================================
 *  Sticker Engine V2 — StickerToVideo Engine
 * ============================================================
 *
 * PROJECT BARU — bukan pengganti Sticker Engine, bukan pengganti
 * sendAsSticker(), bukan pengganti createSticker(). Engine khusus yang
 * mengubah media ANIMASI menjadi MP4:
 *
 *   Animated Sticker (WEBP)  -> MP4
 *   Animated GIF             -> MP4
 *   WEBM                     -> MP4
 *
 * Seluruh proses berjalan lokal memakai FFmpeg (tanpa API internet),
 * mengikuti arsitektur Sticker Engine yang sudah ada (constants, logger,
 * ERROR_CODES/StickerEngineError, cacheEngine, resource tracking lewat
 * cleanupEngine). Konversi FFmpeg didelegasikan ke ffmpegEngine.transcode()
 * (profil 'mp4') — MESIN FFMPEG YANG SAMA dipakai animated-sticker
 * pipeline (execute()), sehingga TIDAK ADA implementasi FFmpeg kedua.
 *
 * Public API : convert(input, options)
 * Input      : Buffer | path file (string) | Readable Stream
 * Return     : Buffer MP4 (H264 + yuv420p + faststart, AAC bila audio ada)
 *
 * Pipeline   : Input -> Validate -> Read Metadata -> Animated Detection ->
 *              Cache Check -> Convert (FFmpeg Engine) -> Validate Output ->
 *              Cache Store -> Cleanup -> Return
 *
 * Dependency : Metadata Engine (baca metadata, tanpa duplikasi ffprobe),
 *              FFmpeg Engine (transcode, satu-satunya jalur spawn ffmpeg),
 *              Cache Engine, Cleanup Engine, Temp Engine (lewat FFmpeg Engine).
 *              TIDAK memakai Canvas/Text/Font/Emoji Engine — di luar
 *              cakupannya (StickerToVideo murni transcoding media).
 * ============================================================
 */

import fs from 'fs'
import fsp from 'fs/promises'
import FileType from 'file-type'
import { StickerEngineError, ERROR_CODES, createLogger, STICKER_LIMITS, fastFingerprint } from './constants.js'
import { cacheEngine } from './cacheEngine.js'
import { cleanupEngine } from './cleanupEngine.js'
import { metadataEngine } from './metadataEngine.js'
import { ffmpegEngine } from './ffmpegEngine.js'

const logger = createLogger('StickerToVideo')
const NS = 'stickerToVideo'

cacheEngine.configureNamespace(NS, { max: 30, ttl: 5 * 60 * 1000 })

// StickerToVideo HANYA menerima media yang berpotensi animasi. Static-only
// mime (image/jpeg, image/png, dst) langsung ditolak sebelum baca metadata
// (Validasi lebih awal = lebih murah, sesuai prinsip "Jangan encode dua kali").
const ACCEPTED_MIME = ['image/webp', 'image/gif', 'video/webm', 'video/mp4']

function isReadableStream(value) {
	return !!value && typeof value === 'object' && typeof value.pipe === 'function' && typeof value.on === 'function'
}

function streamToBuffer(stream) {
	return new Promise((resolve, reject) => {
		const chunks = []
		stream.on('data', (chunk) => chunks.push(chunk))
		stream.on('end', () => resolve(Buffer.concat(chunks)))
		stream.on('error', (err) => reject(err))
	})
}

/**
 * Terima Buffer, path file, ATAU Readable Stream — dinormalisasi menjadi
 * satu Buffer internal supaya seluruh pipeline di bawahnya konsisten
 * (satu jalur, tidak melompat-lompat sesuai spesifikasi).
 */
async function resolveInput(input) {
	if (Buffer.isBuffer(input)) return input
	if (isReadableStream(input)) return streamToBuffer(input)
	if (typeof input === 'string' && input.length > 0) {
		if (!fs.existsSync(input)) {
			throw new StickerEngineError('StickerToVideo', ERROR_CODES.INVALID_BUFFER, `Path input tidak ditemukan: ${input}`)
		}
		return fsp.readFile(input)
	}
	throw new StickerEngineError(
		'StickerToVideo',
		ERROR_CODES.INVALID_BUFFER,
		'Input harus berupa Buffer, path file, atau Readable Stream.'
	)
}

/** Validate: deteksi mime asli lewat magic bytes (bukan ekstensi/klaim pengirim). */
async function validateMedia(buffer) {
	if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
		throw new StickerEngineError('StickerToVideo', ERROR_CODES.EMPTY_BUFFER, 'Buffer media kosong.')
	}

	let detected
	try {
		detected = await FileType.fromBuffer(buffer)
	} catch (err) {
		throw new StickerEngineError('StickerToVideo', ERROR_CODES.INVALID_BUFFER, `Gagal mendeteksi tipe media: ${err.message}`, undefined, err)
	}

	const mime = detected?.mime
	if (!mime || !ACCEPTED_MIME.includes(mime)) {
		throw new StickerEngineError(
			'StickerToVideo',
			ERROR_CODES.UNSUPPORTED_MIME,
			`Media tidak didukung StickerToVideo (diterima: WEBP/GIF/WEBM/MP4): ${mime || 'tidak diketahui'}`
		)
	}
	return mime
}

/**
 * Validate Output: pastikan hasil MP4 benar-benar valid sebelum
 * dikembalikan — bukan re-probe penuh (itu duplicate processing thd
 * ffmpeg yang baru saja sukses), melainkan pemeriksaan ringan namun berarti:
 * ukuran > 0, metadata durasi/resolusi masuk akal, dan signature container
 * MP4 (box "ftyp") benar-benar ada.
 */
function validateOutput(buffer, metadata) {
	if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
		throw new StickerEngineError('StickerToVideo', ERROR_CODES.FFMPEG_FAILED, 'Output MP4 kosong (0 byte).')
	}
	if (!metadata || !(metadata.duration > 0)) {
		throw new StickerEngineError('StickerToVideo', ERROR_CODES.FFMPEG_FAILED, 'Output MP4 tidak memiliki durasi yang valid.')
	}
	if (!metadata.width || !metadata.height) {
		throw new StickerEngineError('StickerToVideo', ERROR_CODES.FFMPEG_FAILED, 'Output MP4 tidak memiliki resolusi yang valid.')
	}
	const headerBox = buffer.length >= 12 ? buffer.toString('latin1', 4, 12) : ''
	if (!headerBox.includes('ftyp')) {
		throw new StickerEngineError('StickerToVideo', ERROR_CODES.FFMPEG_FAILED, 'Output bukan container MP4 yang valid (box "ftyp" tidak ditemukan).')
	}
	return true
}

/**
 * convert(input, options): pipeline utama StickerToVideo.
 *
 * Input       -> Media Validation -> Metadata Reader -> Animated Detection
 * -> Cache Check -> FFmpeg Processing (Convert) -> Output Validation
 * -> Cache Store -> Cleanup -> Return Result
 *
 * options: { size, fps, duration } — opsional, default mengikuti
 * STICKER_LIMITS/metadata sumber (perilaku aman tanpa perlu diisi).
 */
async function convert(input, options = {}) {
	const start = process.hrtime.bigint()
	const jobId = `s2v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
	const resource = cleanupEngine.createJobResource(jobId)
	const context = { buffer: null, mime: null, resource, _tempInputPath: null }

	try {
		// 1) Input Resolution (Buffer / Path / Stream -> Buffer)
		const buffer = await resolveInput(input)
		context.buffer = buffer
		resource.trackBuffer(buffer)
		logger.debug(`Input diterima (${buffer.length} bytes).`)

		// 2) Media Validation (magic bytes)
		const mime = await validateMedia(buffer)
		context.mime = mime
		logger.debug(`Media tervalidasi: ${mime}`)

		// 3) Metadata Reader — reuse Metadata Engine (tidak ada ffprobe/sharp kedua).
		let metadata
		try {
			metadata = await metadataEngine.read(context)
		} catch (err) {
			if (err instanceof StickerEngineError) throw err
			throw new StickerEngineError('StickerToVideo', ERROR_CODES.METADATA_FAILED, `Gagal membaca metadata: ${err.message}`, undefined, err)
		}
		logger.debug(`Metadata berhasil: ${metadata.width}x${metadata.height} animated=${metadata.animated} durasi=${metadata.duration}s fps=${metadata.fps}`)

		// 4) Animated Detection — StickerToVideo HANYA menerima media animasi
		// (sticker statis/gambar biasa bukan tanggung jawab engine ini).
		if (!metadata.animated) {
			throw new StickerEngineError(
				'StickerToVideo',
				ERROR_CODES.UNSUPPORTED_FORMAT,
				'Media bukan animasi — StickerToVideo hanya menerima animated sticker (WEBP), GIF, WEBM, atau MP4.'
			)
		}

		// 5) Normalisasi parameter target (Normalize)
		const targetSize = Math.min(options.size || STICKER_LIMITS.maxDimension, STICKER_LIMITS.maxDimension)
		const targetFps = Math.min(options.fps || metadata.fps || STICKER_LIMITS.maxFps, STICKER_LIMITS.maxFps)
		const targetDuration = Math.min(options.duration || metadata.duration || STICKER_LIMITS.maxDurationSec, STICKER_LIMITS.maxDurationSec)

		// 6) Cache Check — media identik (fingerprint+mime+parameter target)
		// tidak diproses/di-encode dua kali.
		const cacheKey = fastFingerprint(buffer, `s2v:${mime}:${targetSize}:${targetFps}:${targetDuration}:${!!metadata.hasAudio}`)
		const cached = cacheEngine.get(NS, cacheKey)
		if (cached.hit) {
			logger.info('Cache hit — melewati konversi FFmpeg (media identik sudah pernah dikonversi).')
			return cached.value
		}

		// 7) FFmpeg Processing (Convert) — didelegasikan ke FFmpeg Engine
		// (profil mp4Video), MESIN YANG SAMA dgn animated-sticker pipeline.
		logger.info(`Konversi dimulai: ${mime} -> MP4 (${targetSize}px, ${targetFps}fps, ${targetDuration}s, audio=${!!metadata.hasAudio}).`)
		let result
		try {
			result = await ffmpegEngine.transcode({
				inputPath: context._tempInputPath || undefined,
				input: context._tempInputPath ? undefined : buffer,
				inputExt: 'input',
				profile: 'mp4',
				size: targetSize,
				fps: targetFps,
				duration: targetDuration,
				hasAudio: !!metadata.hasAudio,
				resource
			})
		} catch (err) {
			if (err instanceof StickerEngineError) throw err
			throw new StickerEngineError('StickerToVideo', ERROR_CODES.FFMPEG_FAILED, `Konversi FFmpeg gagal: ${err.message}`, undefined, err)
		}
		logger.info('Konversi selesai.')

		// 8) Output Validation
		validateOutput(result.buffer, result.metadata)

		// 9) Cache Store
		cacheEngine.set(NS, cacheKey, result.buffer)

		const ms = Number(process.hrtime.bigint() - start) / 1_000_000
		logger.debug(`convert() selesai dalam ${ms.toFixed(2)}ms.`)

		return result.buffer
	} finally {
		// 10) Cleanup — SELALU berjalan (sukses maupun gagal): temp file,
		// child process, timer, referensi buffer.
		await cleanupEngine.cleanup({ resource })
		logger.debug('Cleanup selesai.')
	}
}

export const stickerToVideo = {
	convert
}

export default stickerToVideo
