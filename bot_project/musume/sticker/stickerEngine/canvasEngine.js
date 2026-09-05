/**
 * ============================================================
 *  Sticker Engine V2 — Canvas Engine
 * ============================================================
 *
 * Tujuan: Melakukan seluruh proses Rendering visual — Draw Image,
 * Draw Text, Draw Emoji, Draw Layer — menghasilkan satu PNG Buffer
 * akhir yang siap masuk ke WebP Engine. Dipakai HANYA oleh jalur
 * smeme (gambar + teks); jalur sticker polos tidak melewati Engine ini.
 *
 * Public API : render(context)
 * Fungsi     : Draw Image, Draw Text, Draw Emoji, Draw Layer
 * Return     : PNG Buffer (langsung, tidak dibungkus objek)
 * Error      : Canvas Failed, Render Failed, Invalid Canvas, Invalid Font
 * Performance Target : < 120 ms
 *
 * Dependency Rule: HANYA memakai Font Engine, Text Engine, Emoji
 * Engine — TIDAK memakai Sharp/FFmpeg/Metadata Engine secara langsung.
 * ============================================================
 */

import { StickerEngineError, ERROR_CODES, createLogger, PERFORMANCE_TARGET } from './constants.js'
import { textEngine } from './textEngine.js'
import { emojiEngine } from './emojiEngine.js'
import { fontEngine } from './fontEngine.js'
import { loadCanvasLib } from './canvasLib.js'

const logger = createLogger('CanvasEngine')

/** Gambar base image supaya memenuhi kanvas (image sudah di-resize Image Engine, tinggal di-tengahkan). */
function drawBaseImage(ctx, image, canvasWidth, canvasHeight) {
	const iw = image.width || canvasWidth
	const ih = image.height || canvasHeight
	const x = Math.round((canvasWidth - iw) / 2)
	const y = Math.round((canvasHeight - ih) / 2)
	ctx.drawImage(image, x, y, iw, ih)
}

/**
 * drawPreviewOverlay(): Preview Editor untuk `.smemec` — HANYA digambar
 * apabila context.previewMetadata diisi (opsional, aditif; tidak
 * memengaruhi render `.smeme`/`.sticker` biasa yang tidak pernah mengisi
 * field ini). Seluruh koordinat memakai PERSEN (bukan pixel) sesuai
 * spesifikasi Sticker Meme Custom, supaya konsisten pada ukuran kanvas
 * berapa pun. Canvas Engine tetap hanya bertugas merender — data grid/
 * ruler/garis sudah disiapkan penuh oleh smemeCustom.buildPreviewMetadata().
 */
function drawPreviewOverlay(ctx, canvasWidth, canvasHeight, preview) {
	if (!preview || !preview.enabled) return

	const supportsDash = typeof ctx.setLineDash === 'function'
	ctx.save()

	if (preview.showGrid) {
		ctx.strokeStyle = 'rgba(255,255,255,0.15)'
		ctx.lineWidth = 1
		for (let p = 10; p < 100; p += 10) {
			const x = (p / 100) * canvasWidth
			const y = (p / 100) * canvasHeight
			ctx.beginPath()
			ctx.moveTo(x, 0)
			ctx.lineTo(x, canvasHeight)
			ctx.stroke()
			ctx.beginPath()
			ctx.moveTo(0, y)
			ctx.lineTo(canvasWidth, y)
			ctx.stroke()
		}
	}

	if (preview.showRuler && preview.ruler) {
		ctx.fillStyle = 'rgba(255,255,255,0.65)'
		ctx.font = '10px sans-serif'
		ctx.textAlign = 'left'
		ctx.textBaseline = 'top'
		for (const mark of preview.ruler.marks) {
			if (preview.ruler.horizontal) ctx.fillText(String(mark), (mark / 100) * canvasWidth + 2, 2)
			if (preview.ruler.vertical) ctx.fillText(String(mark), 2, (mark / 100) * canvasHeight + 2)
		}
	}

	const drawPercentLine = (percent, color, label) => {
		if (typeof percent !== 'number') return
		const y = (percent / 100) * canvasHeight
		ctx.strokeStyle = color
		ctx.lineWidth = 2
		ctx.beginPath()
		ctx.moveTo(0, y)
		ctx.lineTo(canvasWidth, y)
		ctx.stroke()
		if (label) {
			ctx.fillStyle = color
			ctx.font = 'bold 11px sans-serif'
			ctx.textAlign = 'left'
			ctx.textBaseline = 'alphabetic'
			ctx.fillText(label, 4, Math.max(12, y - 4))
		}
	}

	if (preview.showTopLine && preview.lines?.top) drawPercentLine(preview.lines.top.percent, preview.lines.top.color, preview.lines.top.label)
	if (preview.showBottomLine && preview.lines?.bottom) drawPercentLine(preview.lines.bottom.percent, preview.lines.bottom.color, preview.lines.bottom.label)
	if (preview.showCenterLine && preview.lines?.center) drawPercentLine(preview.lines.center.percent, preview.lines.center.color, preview.lines.center.label)

	if (preview.showSafeArea && preview.lines?.safeArea) {
		const marginPercent = preview.lines.safeArea.percent || 0
		const mx = (marginPercent / 100) * canvasWidth
		const my = (marginPercent / 100) * canvasHeight
		ctx.strokeStyle = preview.lines.safeArea.color
		ctx.lineWidth = 2
		if (supportsDash) ctx.setLineDash([6, 4])
		ctx.strokeRect(mx, my, canvasWidth - mx * 2, canvasHeight - my * 2)
		if (supportsDash) ctx.setLineDash([])
	}

	ctx.restore()
}

/**
 * Gambar satu baris teks (Draw Text) sekaligus Draw Emoji inline pada
 * posisi yang tepat di dalam baris tsb — token demi token supaya alignment
 * (center/left/right) tetap presisi walau ada campuran teks+emoji.
 */
function drawLine(ctx, line, anchorX, y, layout, emojiLayerMap) {
	const tokens = emojiEngine.segment(line)
	ctx.font = `${layout.fontWeight} ${layout.fontSize}px ${layout.fontFamily}`
	ctx.textBaseline = 'alphabetic'
	ctx.textAlign = 'left' // posisi token dikontrol manual lewat cursor X

	const widths = tokens.map((t) => (t.type === 'emoji' ? layout.fontSize : ctx.measureText(t.value).width))
	const totalWidth = widths.reduce((a, b) => a + b, 0)

	let cursor
	if (layout.position.align === 'right') cursor = anchorX - totalWidth
	else if (layout.position.align === 'left') cursor = anchorX
	else cursor = anchorX - totalWidth / 2 // center (default)

	if (layout.shadow?.enabled) {
		ctx.shadowColor = layout.shadow.color
		ctx.shadowBlur = layout.shadow.blur
		ctx.shadowOffsetX = layout.shadow.offsetX
		ctx.shadowOffsetY = layout.shadow.offsetY
	} else {
		ctx.shadowColor = 'rgba(0,0,0,0)'
		ctx.shadowBlur = 0
		ctx.shadowOffsetX = 0
		ctx.shadowOffsetY = 0
	}

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i]
		const w = widths[i]
		if (token.type === 'emoji') {
			const layer = emojiLayerMap.get(token.value)
			if (layer && layer.image) {
				const emojiSize = layout.fontSize
				// Baseline sejajar: pakai actualBoundingBoxAscent/Descent bila
				// dilaporkan canvas library (font metric asli) supaya emoji
				// benar-benar sejajar optically dgn teks pada ukuran apa pun —
				// bukan rasio hardcode. Fallback ke rasio empiris hanya bila
				// metric tsb tidak tersedia pada backend canvas yang dipakai.
				const metrics = ctx.measureText('M')
				let emojiY
				if (
					metrics &&
					typeof metrics.actualBoundingBoxAscent === 'number' &&
					typeof metrics.actualBoundingBoxDescent === 'number' &&
					metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent > 0
				) {
					const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
					const centerY = y - metrics.actualBoundingBoxAscent + textHeight / 2
					emojiY = centerY - emojiSize / 2
				} else {
					emojiY = y - emojiSize * 0.82
				}
				ctx.drawImage(layer.image, cursor, emojiY, emojiSize, emojiSize)
			}
			// Emoji Unsupported (gagal render): dilewati saja, bukan error fatal.
		} else if (token.value) {
			if (layout.stroke?.enabled && layout.stroke.width > 0) {
				ctx.lineJoin = 'round'
				ctx.miterLimit = 2
				ctx.lineWidth = layout.stroke.width
				ctx.strokeStyle = layout.stroke.color
				ctx.strokeText(token.value, cursor, y)
			}
			ctx.fillStyle = layout.fill
			ctx.fillText(token.value, cursor, y)
		}
		cursor += w
	}
}

/**
 * render(context): nama internal `renderCanvas` (bukan `render` saja di
 * scope module supaya konsisten dgn pola penamaan seluruh file; tidak ada
 * konflik dgn global karena `render` bukan identifier global Node.js —
 * penamaan tetap dipisah untuk konsistensi & keterbacaan).
 *
 * context yang dipakai:
 *  - buffer      : PNG Buffer base image, hasil Image Engine (sudah di-resize)
 *  - topText     : string, opsional
 *  - bottomText  : string, opsional
 *  - config      : stickermeme.json config (font/text/position/render/emoji)
 *  - resource    : job resource tracker (Cleanup Engine)
 */
async function renderCanvas(context) {
	const start = process.hrtime.bigint()

	if (!context || !Buffer.isBuffer(context.buffer) || context.buffer.length === 0) {
		throw new StickerEngineError('CanvasEngine', ERROR_CODES.INVALID_CANVAS, 'context.buffer (base image PNG) harus berupa Buffer yang valid.')
	}

	const cfg = context.config && typeof context.config === 'object' ? context.config : {}
	const canvasSize = cfg.render?.canvas || 512
	const topText = (context.topText || '').toString()
	const bottomText = (context.bottomText || '').toString()

	if (!topText.trim() && !bottomText.trim()) {
		// Tidak ada teks sama sekali: Canvas Engine tetap valid dipanggil
		// (API completeness), cukup kembalikan base image apa adanya.
		logger.debug('render() dipanggil tanpa teks; mengembalikan base image tanpa overlay.')
	}

	let lib
	try {
		lib = await loadCanvasLib()
	} catch (err) {
		throw new StickerEngineError('CanvasEngine', ERROR_CODES.CANVAS_FAILED, `Canvas library tidak tersedia: ${err.message}`, undefined, err)
	}

	let baseImage
	try {
		baseImage = await lib.loadImage(context.buffer)
	} catch (err) {
		throw new StickerEngineError('CanvasEngine', ERROR_CODES.RENDER_FAILED, `Gagal memuat base image ke Canvas: ${err.message}`, undefined, err)
	}

	let canvas
	let ctx
	try {
		canvas = lib.createCanvas(canvasSize, canvasSize)
		ctx = canvas.getContext('2d')
	} catch (err) {
		throw new StickerEngineError('CanvasEngine', ERROR_CODES.INVALID_CANVAS, `Gagal membuat Canvas: ${err.message}`, undefined, err)
	}

	if (cfg.render?.smoothing !== false && 'imageSmoothingEnabled' in ctx) {
		ctx.imageSmoothingEnabled = true
		if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high'
	}

	ctx.clearRect(0, 0, canvasSize, canvasSize)
	drawBaseImage(ctx, baseImage, canvasSize, canvasSize)

	// Pastikan Font Engine sudah teregistrasi sebelum layout/draw memakainya.
	await fontEngine.register().catch((err) => {
		logger.warn(`Font Engine gagal register penuh, lanjut dgn fallback: ${err.message}`)
	})

	const layouts = []
	try {
		if (topText.trim()) {
			layouts.push(
				await textEngine.layout({ text: topText, canvasWidth: canvasSize, canvasHeight: canvasSize, position: 'top', config: cfg })
			)
		}
		if (bottomText.trim()) {
			layouts.push(
				await textEngine.layout({ text: bottomText, canvasWidth: canvasSize, canvasHeight: canvasSize, position: 'bottom', config: cfg })
			)
		}
	} catch (err) {
		throw new StickerEngineError('CanvasEngine', ERROR_CODES.RENDER_FAILED, `Text Engine gagal melakukan layout: ${err.message}`, undefined, err)
	}

	// Emoji Engine HANYA dijalankan bila ada emoji pada salah satu teks
	// (Draw Emoji bersifat opsional, nol overhead bila tidak dibutuhkan).
	const emojiLayerMap = new Map()
	if (cfg.emoji?.enabled !== false) {
		for (const layout of layouts) {
			const combined = layout.lines.join(' ')
			if (!emojiEngine.hasEmoji(combined)) continue
			try {
				const emojiResult = await emojiEngine.render({ text: combined, size: layout.fontSize, resource: context.resource })
				for (const layer of emojiResult.layers) emojiLayerMap.set(layer.char, layer)
			} catch (err) {
				logger.warn(`Emoji Engine gagal untuk sebagian teks, dilewati: ${err.message}`)
			}
		}
	}

	// Draw Text + Draw Emoji per baris.
	for (const layout of layouts) {
		let y = layout.position.y
		for (const line of layout.lines) {
			drawLine(ctx, line, layout.position.x, y, layout, emojiLayerMap)
			y += layout.lineHeight
		}
	}

	// Emoji Layer cleanup: lepas referensi lokal. Bitmap tetap tersimpan di
	// Emoji Cache (Cache Engine) untuk dipakai ulang oleh request berikutnya.
	emojiLayerMap.clear()

	// Preview Editor (.smemec): HANYA digambar bila context.previewMetadata
	// diisi eksplisit — tidak pernah terjadi pada `.smeme`/`.sticker` biasa.
	if (context.previewMetadata) {
		try {
			drawPreviewOverlay(ctx, canvasSize, canvasSize, context.previewMetadata)
		} catch (err) {
			logger.warn(`Preview overlay gagal digambar (diabaikan, tidak menggagalkan render): ${err.message}`)
		}
	}

	let outputBuffer
	try {
		outputBuffer = canvas.toBuffer('image/png')
	} catch (err) {
		throw new StickerEngineError('CanvasEngine', ERROR_CODES.RENDER_FAILED, `Gagal encode Canvas ke PNG: ${err.message}`, undefined, err)
	}

	context.resource?.trackBuffer(outputBuffer)

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	if (ms > PERFORMANCE_TARGET.canvas * 2) logger.warn(`render() melebihi target performa: ${ms.toFixed(2)}ms`)
	else logger.debug(`render() selesai ${ms.toFixed(2)}ms`)

	return outputBuffer
}

export const canvasEngine = {
	render: renderCanvas
}

export default canvasEngine
