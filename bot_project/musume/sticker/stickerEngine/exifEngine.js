/**
 * ============================================================
 *  Sticker Engine V2 — Exif Engine
 * ============================================================
 *
 * Tujuan: Menyuntikkan metadata sticker pack WhatsApp (packname,
 * author/publisher, categories/emojis) ke dalam container WEBP —
 * tahap TERAKHIR sebelum Cleanup Engine. Sepenuhnya Buffer First:
 * TIDAK menyentuh disk sama sekali (node-webpmux mendukung load()
 * dari Buffer dan save(null) mengembalikan Buffer langsung),
 * berbeda dari implementasi lama yang selalu menulis file temp
 * tambahan untuk tahap ini.
 *
 * Public API : inject(context)
 * Fungsi     : packname, author, categories, whatsapp metadata
 * Return     : Sticker Buffer (langsung, hasil akhir Pipeline)
 * Error      : Invalid Metadata, Invalid Sticker
 * Performance Target : < 10 ms
 *
 * Format EXIF mengikuti struktur yang SAMA PERSIS dengan yang sudah
 * terbukti bekerja pada implementasi lama (lib/exif.js) supaya
 * sticker yang dihasilkan tetap kompatibel dengan WhatsApp:
 * header TIFF 22-byte + JSON UTF-8, panjang JSON ditulis pada offset 14.
 * ============================================================
 */

import webp from 'node-webpmux'
import { StickerEngineError, ERROR_CODES, createLogger, PERFORMANCE_TARGET } from './constants.js'

const logger = createLogger('ExifEngine')

// Header TIFF/EXIF baku WhatsApp sticker (identik dgn implementasi lama —
// JANGAN diubah, ini adalah kontrak biner yang dibaca klien WhatsApp).
const EXIF_HEADER = Buffer.from([
	0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
])

function buildExifBuffer(options = {}) {
	const packId = options.pack_id || options.packId || globalThis.author || 'sticker-engine-v2'
	const packname = options.packname || globalThis.packname || 'Bot WhatsApp'
	const author = options.author || globalThis.author || 'Sticker Engine V2'
	const categories = Array.isArray(options.categories) && options.categories.length ? options.categories : ['']
	const isAvatar = options.isAvatar ? 1 : 0

	const json = {
		'sticker-pack-id': String(packId),
		'sticker-pack-name': String(packname),
		'sticker-pack-publisher': String(author),
		emojis: categories,
		'is-avatar-sticker': isAvatar
	}

	const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8')
	const exif = Buffer.concat([EXIF_HEADER, jsonBuffer])
	exif.writeUIntLE(jsonBuffer.length, 14, 4)
	return exif
}

/**
 * inject(context): context = { buffer(WEBP), options:{packname,author,
 * categories,pack_id,isAvatar}, resource }.
 */
async function inject(context) {
	const start = process.hrtime.bigint()

	if (!context || !Buffer.isBuffer(context.buffer) || context.buffer.length === 0) {
		throw new StickerEngineError('ExifEngine', ERROR_CODES.INVALID_STICKER, 'context.buffer harus berupa Buffer WEBP yang valid.')
	}

	const options = context.options || {}

	let img
	try {
		img = new webp.Image()
		await img.load(context.buffer)
	} catch (err) {
		throw new StickerEngineError(
			'ExifEngine',
			ERROR_CODES.INVALID_STICKER,
			`Gagal memuat WEBP untuk injeksi EXIF: ${err.message}`,
			undefined,
			err
		)
	}

	try {
		img.exif = buildExifBuffer(options)
	} catch (err) {
		throw new StickerEngineError('ExifEngine', ERROR_CODES.INVALID_METADATA, `Metadata sticker pack tidak valid: ${err.message}`, undefined, err)
	}

	let outputBuffer
	try {
		outputBuffer = await img.save(null)
	} catch (err) {
		throw new StickerEngineError(
			'ExifEngine',
			ERROR_CODES.INVALID_STICKER,
			`Gagal menyimpan WEBP dengan EXIF: ${err.message}`,
			undefined,
			err
		)
	}

	if (!Buffer.isBuffer(outputBuffer)) {
		throw new StickerEngineError('ExifEngine', ERROR_CODES.INVALID_STICKER, 'node-webpmux tidak mengembalikan Buffer yang valid.')
	}

	context.resource?.trackBuffer(outputBuffer)

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	if (ms > PERFORMANCE_TARGET.exif * 5) logger.warn(`inject() melebihi target performa: ${ms.toFixed(2)}ms`)
	else logger.debug(`inject() selesai ${ms.toFixed(2)}ms (${outputBuffer.length} bytes)`)

	return outputBuffer
}

export const exifEngine = {
	inject
}

export default exifEngine
