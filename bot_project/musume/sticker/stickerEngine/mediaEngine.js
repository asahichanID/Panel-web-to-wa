/**
 * ============================================================
 *  Sticker Engine V2 — Media Engine
 * ============================================================
 *
 * Tujuan: Pintu masuk seluruh media. Menentukan jenis media
 * SEBELUM Pipeline dimulai — memakai magic bytes (bukan ekstensi
 * ataupun mimetype yang diklaim pengirim, supaya tidak gampang keliru
 * seperti implementasi lama yang kadang mengandalkan `mime` dari
 * WhatsApp message langsung).
 *
 * Public API : process(context)
 * Parameter  : context berisi Buffer, MIME (klaim awal), Command, Config
 * Return     : { success, data, meta }
 * Data       : { type, mime, animated, pipeline, metadata }
 * Error      : Invalid Buffer, Unsupported MIME, Unknown Media, Empty Buffer
 * Performance Target : < 5 ms
 *
 * Dependency Rule: HANYA boleh memakai Metadata Engine (dipanggil di
 * dalam untuk mengisi `data.metadata`, sesuai Dependency di
 * ARCHITECTURE.md/ENGINE_API.md — bukan dependency baru/melanggar).
 * ============================================================
 */

import FileType from 'file-type'
import {
	StickerEngineError,
	ERROR_CODES,
	createLogger,
	PERFORMANCE_TARGET,
	SUPPORTED_IMAGE_MIME,
	SUPPORTED_VIDEO_MIME
} from './constants.js'
import { metadataEngine } from './metadataEngine.js'

const logger = createLogger('MediaEngine')

// WEBP butuh perlakuan khusus: WhatsApp sticker BALASAN (reply sticker)
// biasanya sudah berformat webp (statis maupun animasi) dan tetap masuk
// jalur "image" (Image Engine pakai Sharp yang native mendukung webp).
function classifyType(mime) {
	if (!mime) return null
	if (SUPPORTED_IMAGE_MIME.includes(mime)) return 'image'
	if (SUPPORTED_VIDEO_MIME.includes(mime)) return 'video'
	if (mime.startsWith('image/')) return 'image'
	if (mime.startsWith('video/')) return 'video'
	return null
}

/**
 * process(context): fungsi asli diberi nama internal `processMedia`
 * (BUKAN `process`) supaya tidak men-shadow object global Node.js
 * `process` (yang dipakai untuk process.hrtime di seluruh Engine).
 * Nama publik tetap `process` lewat key pada object yang di-export
 * di bagian bawah file — sesuai Public API pada ENGINE_API.md.
 */
async function processMedia(context) {
	const start = process.hrtime.bigint()

	if (!context || !Buffer.isBuffer(context.buffer)) {
		throw new StickerEngineError('MediaEngine', ERROR_CODES.INVALID_BUFFER, 'context.buffer harus berupa Buffer.')
	}
	if (context.buffer.length === 0) {
		throw new StickerEngineError('MediaEngine', ERROR_CODES.EMPTY_BUFFER, 'Buffer media kosong.')
	}

	let detected
	try {
		detected = await FileType.fromBuffer(context.buffer)
	} catch (err) {
		throw new StickerEngineError(
			'MediaEngine',
			ERROR_CODES.INVALID_BUFFER,
			`Gagal mendeteksi tipe media: ${err.message}`,
			undefined,
			err
		)
	}

	// Fallback ke klaim mimetype pengirim HANYA apabila magic bytes
	// tidak bisa dideteksi (mis. beberapa varian webp lama) — tetap
	// diprioritaskan hasil deteksi asli demi keamanan & akurasi.
	const mime = detected?.mime || context.mime || null
	const type = classifyType(mime)

	if (!type) {
		throw new StickerEngineError(
			'MediaEngine',
			ERROR_CODES.UNSUPPORTED_MIME,
			`Tipe media tidak didukung: ${mime || 'tidak diketahui'}`
		)
	}

	context.mime = mime

	let metadata
	try {
		metadata = await metadataEngine.read(context)
	} catch (err) {
		throw new StickerEngineError(
			'MediaEngine',
			ERROR_CODES.UNKNOWN_MEDIA,
			`Gagal membaca metadata media: ${err.message}`,
			undefined,
			err
		)
	}

	// pipeline: 'image' (statis/animasi ditangani Sharp), atau 'video'
	// (butuh FFmpeg). animated dipakai downstream (Canvas/WebP Engine)
	// untuk memutuskan static vs animated WEBP encode.
	const pipeline = type

	const data = {
		type,
		mime,
		animated: !!metadata.animated,
		pipeline,
		metadata
	}

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	if (ms > PERFORMANCE_TARGET.media * 10) logger.warn(`process() melebihi target performa: ${ms.toFixed(2)}ms`)
	else logger.debug(`process() selesai dalam ${ms.toFixed(2)}ms — type=${type} mime=${mime} animated=${data.animated}`)

	return {
		success: true,
		data,
		meta: { durationMs: ms, engine: 'MediaEngine' }
	}
}

export const mediaEngine = {
	process: processMedia
}

export default mediaEngine
