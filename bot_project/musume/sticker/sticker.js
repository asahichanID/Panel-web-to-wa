/**
 * ============================================================
 *  Sticker Engine V2 — sticker.js (Orchestrator)
 * ============================================================
 *
 * Satu-satunya titik masuk publik Sticker Engine V2. Mengikat
 * seluruh Engine di stickerEngine/ menjadi Pipeline sesuai
 * ARCHITECTURE.md / ENGINE_API.md:
 *
 *   Sticker Engine -> Media Engine -> Metadata Engine ->
 *   (Image Engine | Video Engine -> FFmpeg Engine) ->
 *   [Canvas Engine (khusus smeme)] -> WebP Engine ->
 *   Exif Engine -> Cleanup Engine (SELALU berjalan, lewat finally).
 *
 * Dua fungsi publik:
 *  - createSticker(input, options): pipeline LENGKAP, dipakai oleh
 *    seluruh command sticker (.sticker/.stiker/.s/.stickergif/.sgif/
 *    .stickerwm/.swm/.wm/.curi/.colong/.take/.stickergifwm/.sgifwm)
 *    lewat src/message.js `sendAsSticker`, dan juga oleh `.smeme`
 *    (dipanggil dari sendAsSticker yang SAMA setelah renderSmeme()).
 *  - renderSmeme(imageBuffer, topText, bottomText, options): HANYA
 *    tahap Image+Canvas Engine (resize + Draw Text/Emoji), mengembalikan
 *    PNG Buffer — dipakai oleh musume/sticker/smeme.js. Encoding WEBP+EXIF
 *    tetap dilakukan lewat createSticker() (dipanggil naze.js lewat
 *    sendAsSticker persis seperti alur lama), sehingga TIDAK ada
 *    Duplicate Encoding.
 *
 * Kompatibilitas: input boleh berupa Buffer ATAU path file (string) —
 * menyamai kontrak lama (naze.downloadAndSaveMediaMessage mengembalikan
 * path, smeme()/emojimix mengembalikan/menerima Buffer).
 * ============================================================
 */

import fs from 'fs'
import fsp from 'fs/promises'
import crypto from 'crypto'
import {
	mediaEngine,
	videoEngine,
	imageEngine,
	canvasEngine,
	webpEngine,
	exifEngine,
	ffmpegEngine,
	cleanupEngine,
	loadConfig,
	initializeEngines,
	smemeCustom,
	ENGINE_VERSION
} from './stickerEngine/index.js'
import { StickerEngineError, ERROR_CODES, createLogger } from './stickerEngine/constants.js'

const logger = createLogger('StickerEngine')

// Housekeeping ringan (sweep temp basi + maintenance loop cache) — aman
// dipanggil berkali-kali, hanya benar-benar jalan sekali (idempotent).
initializeEngines()

function makeJobId() {
	return crypto.randomBytes(4).toString('hex')
}

/** Terima Buffer ATAU path file yang sudah ada di disk (kontrak lama). */
async function resolveInputBuffer(input) {
	if (Buffer.isBuffer(input)) return input
	if (typeof input === 'string' && input.length > 0) {
		if (fs.existsSync(input)) return fsp.readFile(input)
		throw new StickerEngineError('StickerEngine', ERROR_CODES.INVALID_BUFFER, `Path input tidak ditemukan: ${input}`)
	}
	throw new StickerEngineError('StickerEngine', ERROR_CODES.INVALID_BUFFER, 'Input harus berupa Buffer atau path file yang valid.')
}

function createContext(buffer, options, commandLabel) {
	const jobId = makeJobId()
	return {
		job: { id: jobId, command: commandLabel || 'sticker', startedAt: Date.now() },
		buffer,
		mime: null,
		metadata: null,
		config: loadConfig(),
		options: options || {},
		logger: createLogger(`Job:${jobId}`),
		resource: cleanupEngine.createJobResource(jobId),
		_tempInputPath: null
	}
}

/**
 * createSticker(input, options): pipeline lengkap, mengembalikan Buffer
 * WEBP siap kirim (sudah berisi EXIF sticker pack). Cleanup SELALU
 * dijalankan lewat finally, baik sukses maupun gagal.
 */
async function createSticker(input, options = {}) {
	const buffer = await resolveInputBuffer(input)
	const context = createContext(buffer, options, options.command || 'sticker')

	try {
		// Tahap 1: Media Engine (memanggil Metadata Engine di dalamnya).
		const mediaResult = await mediaEngine.process(context)
		context.mime = mediaResult.data.mime
		context.metadata = mediaResult.data.metadata

		// Passthrough: input yang SUDAH berformat webp (mis. balasan sticker
		// pada .take/.curi/.colong/.sticker) TIDAK di-resize/re-encode ulang —
		// PERSIS seperti perilaku lib/exif.js versi lama (`/webp/.test(mime)`
		// -> pakai apa adanya). Ini menghindari Duplicate Encoding sekaligus
		// mencegah degradasi kualitas dari re-encode yang tidak perlu.
		if (context.mime === 'image/webp') {
			context.logger.debug('Input sudah berformat webp, passthrough tanpa resize/re-encode.')
			const finalBuffer = await exifEngine.inject(context)
			return finalBuffer
		}

		if (mediaResult.data.metadata.animated) {
			// Tahap 2 (jalur animasi): Video Engine (validasi+prepare, cepat)
			// -> FFmpeg Engine (encode langsung ke animated WEBP, SATU pass).
			// WebP Engine dilewati di jalur ini karena FFmpeg Engine SUDAH
			// menghasilkan WEBP final — memanggil WebP Engine lagi di sini
			// akan jadi Duplicate Encoding.
			const videoResult = await videoEngine.process(context)
			const ffmpegResult = await ffmpegEngine.execute(videoResult.task)
			context.buffer = ffmpegResult.buffer
			context.metadata = ffmpegResult.metadata
		} else {
			// Tahap 2 (jalur statis): Image Engine (Sharp resize/normalize)
			// -> WebP Engine (Sharp encode, cepat).
			const imageResult = await imageEngine.process(context)
			context.buffer = imageResult.buffer
			context.metadata = imageResult.metadata

			const webpBuffer = await webpEngine.encode(context)
			context.buffer = webpBuffer
		}

		// Tahap akhir: Exif Engine (selalu).
		const finalBuffer = await exifEngine.inject(context)
		return finalBuffer
	} finally {
		// Cleanup Engine SELALU berjalan, sukses maupun gagal.
		await cleanupEngine.cleanup(context)
	}
}

/**
 * renderSmeme(): tahap Image Engine (resize ke kanvas) + Canvas Engine
 * (Draw Image/Text/Emoji) SAJA. Mengembalikan PNG Buffer — encoding
 * WEBP+EXIF dilakukan terpisah lewat createSticker() (dipanggil naze.js
 * lewat sendAsSticker, identik dengan alur `.smeme` versi lama).
 */
async function renderSmeme(imageBuffer, topText = '', bottomText = '', options = {}) {
	if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
		throw new StickerEngineError('StickerEngine', ERROR_CODES.EMPTY_BUFFER, 'imageBuffer untuk smeme harus berupa Buffer yang valid.')
	}

	const context = createContext(imageBuffer, options, 'smeme')

	try {
		const mediaResult = await mediaEngine.process(context)
		context.mime = mediaResult.data.mime

		// smeme SELALU menghasilkan output statis satu frame — konsisten
		// dengan perilaku smeme.js versi lama, walau input berupa sticker
		// animasi/video (hanya frame pertama yang dipakai sebagai base image).
		context.metadata = { ...mediaResult.data.metadata, animated: false }

		const imageResult = await imageEngine.process(context)
		context.buffer = imageResult.buffer
		context.metadata = imageResult.metadata

		context.topText = topText
		context.bottomText = bottomText

		const pngBuffer = await canvasEngine.render(context)
		return pngBuffer
	} finally {
		await cleanupEngine.cleanup(context)
	}
}

/**
 * renderSmemeCustom(): varian `.smemec` dari renderSmeme() — SATU-SATUNYA
 * perbedaan adalah sumber `context.config` (hasil smemeCustom.resolveConfig(),
 * bukan loadConfig() polos) dan context.previewMetadata opsional. Image
 * Engine & Canvas Engine dipanggil PERSIS seperti renderSmeme() — tidak ada
 * tanggung jawab yang berpindah antar Engine, keduanya tetap hanya membaca
 * context.config apa adanya tanpa tahu (atau perlu tahu) asalnya dari
 * smemeCustom. `.smeme` (renderSmeme di atas) TIDAK disentuh sama sekali.
 */
async function renderSmemeCustom(imageBuffer, topText = '', bottomText = '', customOptions = {}) {
	if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
		throw new StickerEngineError('StickerEngine', ERROR_CODES.EMPTY_BUFFER, 'imageBuffer untuk smemec harus berupa Buffer yang valid.')
	}

	const { presetName, sessionId, paramString, preview, ...options } = customOptions || {}
	const context = createContext(imageBuffer, options, 'smemec')

	try {
		const { config: resolvedConfig } = smemeCustom.resolveConfig({ presetName, sessionId, paramString })
		context.config = resolvedConfig

		if (preview) {
			context.previewMetadata = smemeCustom.buildPreviewMetadata(resolvedConfig)
		}

		const mediaResult = await mediaEngine.process(context)
		context.mime = mediaResult.data.mime

		// smemec, sama seperti smeme, selalu menghasilkan output statis satu frame.
		context.metadata = { ...mediaResult.data.metadata, animated: false }

		const imageResult = await imageEngine.process(context)
		context.buffer = imageResult.buffer
		context.metadata = imageResult.metadata

		context.topText = topText
		context.bottomText = bottomText

		const pngBuffer = await canvasEngine.render(context)
		return pngBuffer
	} finally {
		await cleanupEngine.cleanup(context)
	}
}

export const stickerEngineV2 = {
	createSticker,
	renderSmeme,
	renderSmemeCustom,
	ENGINE_VERSION
}

export { createSticker, renderSmeme, renderSmemeCustom, ENGINE_VERSION }
export default stickerEngineV2
