/**
 * ============================================================
 *  Sticker Engine V2 — Image Engine
 * ============================================================
 *
 * Tujuan: Mengoptimalkan seluruh media gambar (statis maupun
 * animasi gif/webp) sebelum memasuki proses Rendering/Encoding.
 *
 * Public API : process(context)
 * Fungsi     : Resize, Rotate, Normalize, Crop, Convert
 * Return     : { buffer, metadata }
 * Error      : Resize Failed, Invalid Image, Decode Failed, Encode Failed
 * Performance Target : < 80 ms
 *
 * Dependency Rule: HANYA memakai Sharp — TIDAK memakai Canvas Engine,
 * Emoji Engine, Font Engine, ataupun WebP Engine.
 *
 * Catatan desain (memperbaiki inkonsistensi implementasi lama):
 *  - Implementasi lama (lib/exif.js) memakai dimensi berbeda-beda utk
 *    tiap jenis media (512 utk image statis, 500 utk gif, 320 utk
 *    video) — sekarang disatukan memakai STICKER_LIMITS.maxDimension
 *    (512, selaras dengan stickermeme.json `image.maxWidth/maxHeight`).
 *  - Gambar statis: fit "inside" (tanpa padding), SAMA seperti
 *    perilaku imageToWebp lama — supaya sticker gambar non-persegi
 *    tidak mendapat bar putih/transparan yang tidak diminta.
 *  - Gambar animasi (gif/webp animasi): fit "contain" + padding alpha
 *    transparan ke kanvas persegi, SAMA seperti perilaku gifToWebp
 *    lama (yang memakai trik "white@0.0") — di sini dilakukan lebih
 *    benar lewat alpha channel asli, bukan warna putih transparan.
 * ============================================================
 */

import sharp from 'sharp'
import { StickerEngineError, ERROR_CODES, createLogger, PERFORMANCE_TARGET, STICKER_LIMITS, fastFingerprint } from './constants.js'
import { cacheEngine } from './cacheEngine.js'

const logger = createLogger('ImageEngine')
const NS = 'image'

cacheEngine.configureNamespace(NS, { max: 50, ttl: 60 * 1000 })

/**
 * process(context): nama internal `processImage` (bukan `process`)
 * supaya tidak men-shadow global Node.js `process` yang dipakai untuk
 * process.hrtime di seluruh file ini.
 */
async function processImage(context) {
	const start = process.hrtime.bigint()

	if (!context || !Buffer.isBuffer(context.buffer) || context.buffer.length === 0) {
		throw new StickerEngineError('ImageEngine', ERROR_CODES.INVALID_IMAGE, 'context.buffer harus berupa Buffer gambar yang valid.')
	}

	const metadata = context.metadata || {}
	const animated = !!metadata.animated
	const dim = context.config?.image?.maxWidth || STICKER_LIMITS.maxDimension
	const crop = context.options?.crop

	const cacheKey = fastFingerprint(context.buffer, `image:${dim}:${animated}:${crop ? JSON.stringify(crop) : ''}`)
	const cached = cacheEngine.get(NS, cacheKey)
	if (cached.hit) {
		context.resource?.trackBuffer(cached.value.buffer)
		return cached.value
	}

	let pipeline
	try {
		pipeline = sharp(context.buffer, { animated, limitInputPixels: false })

		// Rotate: auto-orient berdasarkan tag EXIF Orientation SEBELUM resize,
		// supaya foto dari kamera HP (potret/landscape) tidak terbalik.
		pipeline = pipeline.rotate()

		// Crop opsional (dipakai hanya bila caller eksplisit meminta lewat
		// context.options.crop — tidak dipakai oleh command bawaan saat ini,
		// disediakan sebagai kapabilitas Engine sesuai dokumentasi "Crop").
		if (crop && Number.isFinite(crop.left) && Number.isFinite(crop.top) && crop.width > 0 && crop.height > 0) {
			pipeline = pipeline.extract({
				left: Math.max(0, Math.round(crop.left)),
				top: Math.max(0, Math.round(crop.top)),
				width: Math.round(crop.width),
				height: Math.round(crop.height)
			})
		}

		if (animated) {
			pipeline = pipeline.resize(dim, dim, {
				fit: 'contain',
				background: { r: 0, g: 0, b: 0, alpha: 0 },
				withoutEnlargement: false
			})
		} else {
			pipeline = pipeline.resize(dim, dim, {
				fit: 'inside',
				withoutEnlargement: false
			})
		}

		// Normalize: pastikan alpha channel selalu ada (dibutuhkan Canvas
		// Engine untuk kompositing teks di atas background transparan) —
		// BUKAN sharp .normalize() (yang men-stretch contrast/warna dan
		// akan mengubah tampilan visual gambar user, tidak diinginkan utk sticker).
		pipeline = pipeline.ensureAlpha()

		// Convert: intermediate format selalu PNG (lossless, mendukung alpha,
		// format yang sama dipakai Canvas Engine) supaya WebP Engine hanya
		// perlu menangani SATU format masukan. compressionLevel 0 dipakai
		// karena PNG ini transient (langsung di-encode ulang ke WEBP),
		// memaksimalkan kecepatan, bukan ukuran file.
		pipeline = pipeline.png({ compressionLevel: 0, adaptiveFiltering: false })
	} catch (err) {
		throw new StickerEngineError(
			'ImageEngine',
			ERROR_CODES.DECODE_FAILED,
			`Gagal menyiapkan pipeline Sharp: ${err.message}`,
			undefined,
			err
		)
	}

	let buffer
	let outInfo
	try {
		const result = await pipeline.toBuffer({ resolveWithObject: true })
		buffer = result.data
		outInfo = result.info
	} catch (err) {
		throw new StickerEngineError(
			'ImageEngine',
			ERROR_CODES.RESIZE_FAILED,
			`Gagal resize/convert gambar: ${err.message}`,
			undefined,
			err
		)
	}

	const resultMetadata = {
		...metadata,
		width: outInfo.width,
		height: outInfo.height,
		format: 'png',
		alpha: true,
		animated
	}

	const output = { buffer, metadata: resultMetadata }
	context.resource?.trackBuffer(buffer)
	cacheEngine.set(NS, cacheKey, output)

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	if (ms > PERFORMANCE_TARGET.image * 2) {
		logger.warn(`process() melebihi target performa: ${ms.toFixed(2)}ms`)
	} else {
		logger.debug(`process() selesai ${ms.toFixed(2)}ms (${outInfo.width}x${outInfo.height}, animated=${animated})`)
	}

	return output
}

export const imageEngine = {
	process: processImage
}

export default imageEngine
