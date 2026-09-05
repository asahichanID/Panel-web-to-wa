/**
 * ============================================================
 *  Sticker Engine V2 — Text Engine
 * ============================================================
 *
 * Tujuan: Menghitung seluruh Layout teks (posisi, ukuran, susunan)
 * SEBELUM proses Rendering dimulai. Engine ini TIDAK melakukan
 * Rendering — hanya kalkulasi (smart wrap, smart font size, dynamic
 * line height/stroke/padding, smart position), sesuai STICKER_UPGRADE.md.
 *
 * Public API : layout(context)
 * Parameter  : { text, canvasWidth, canvasHeight, position, config }
 * Return     : { lines, fontSize, lineHeight, stroke, padding, position }
 * Worker     : Tidak.
 * Cache      : Ya (Measure Cache di sini, Font Cache lewat Font Engine).
 * Cleanup    : Tidak memiliki Resource.
 * Common Failure : Empty Text, Invalid Font, Invalid Configuration.
 * Performance Target : < 20 ms
 *
 * Dependency Rule: HANYA memakai Font Engine. Untuk mengukur lebar
 * teks (measureText) Engine ini butuh sebuah canvas context — supaya
 * TIDAK bergantung pada Canvas Engine (yang justru bergantung pada
 * Text Engine, sehingga akan jadi Circular Dependency bila dibalik),
 * pengukuran memakai canvasLib.js (Internal Helper / library canvas
 * mentah), BUKAN modul canvasEngine.js.
 * ============================================================
 */

import { StickerEngineError, ERROR_CODES, createLogger, PERFORMANCE_TARGET } from './constants.js'
import { cacheEngine } from './cacheEngine.js'
import { fontEngine } from './fontEngine.js'
import { loadCanvasLib } from './canvasLib.js'

const logger = createLogger('TextEngine')
const NS = 'measure'

cacheEngine.configureNamespace(NS, { max: 500, ttl: 5 * 60 * 1000 })

let measureCtxPromise = null
/** Canvas kecil, dipakai ulang (reuse) HANYA untuk ctx.measureText — tidak pernah di-draw/diekspor. */
async function getMeasureContext() {
	if (measureCtxPromise) return measureCtxPromise
	measureCtxPromise = (async () => {
		const lib = await loadCanvasLib()
		const canvas = lib.createCanvas(16, 16)
		return canvas.getContext('2d')
	})()
	return measureCtxPromise
}

function splitWords(text) {
	return text.split(/\s+/).filter(Boolean)
}

/** Pecah satu "kata" yang sendirian sudah melebihi maxWidth (mis. URL panjang tanpa spasi). */
function hardWrap(ctx, line, maxWidth) {
	if (ctx.measureText(line).width <= maxWidth) return [line]
	const out = []
	let current = ''
	for (const ch of line) {
		const test = current + ch
		if (current && ctx.measureText(test).width > maxWidth) {
			out.push(current)
			current = ch
		} else {
			current = test
		}
	}
	if (current) out.push(current)
	return out
}

function wrapWords(ctx, words, maxWidth) {
	const lines = []
	let current = ''
	for (const word of words) {
		const test = current ? `${current} ${word}` : word
		if (current && ctx.measureText(test).width > maxWidth) {
			lines.push(current)
			current = word
		} else {
			current = test
		}
	}
	if (current) lines.push(current)
	return lines.flatMap((line) => hardWrap(ctx, line, maxWidth))
}

/**
 * layout(context): kalkulasi murni, tidak melakukan I/O berat.
 */
async function layout(context) {
	const start = process.hrtime.bigint()

	const rawText = context?.text
	if (!rawText || !String(rawText).trim()) {
		throw new StickerEngineError('TextEngine', ERROR_CODES.EMPTY_TEXT, 'Teks kosong, tidak ada yang perlu di-layout.')
	}

	const cfg = context.config && typeof context.config === 'object' ? context.config : {}
	const fontCfg = cfg.font || {}
	const textCfg = cfg.text || {}
	const canvasWidth = context.canvasWidth || cfg.render?.canvas || 512
	const canvasHeight = context.canvasHeight || cfg.render?.canvas || 512
	const position = context.position === 'bottom' ? 'bottom' : 'top'
	const posCfg = (cfg.position && cfg.position[position]) || {}

	let text = String(rawText).trim()
	if (fontCfg.uppercase) text = text.toUpperCase()

	const maxLines = textCfg.maxLines || 3
	const minSize = fontCfg.minSize || 18
	const maxSize = fontCfg.maxSize || 72
	const baseSize = fontCfg.size || maxSize
	const paddingLeft = posCfg.paddingLeft ?? 14
	const paddingRight = posCfg.paddingRight ?? 14
	const paddingTop = posCfg.paddingTop ?? 14
	const paddingBottom = posCfg.paddingBottom ?? 14
	const maxTextWidth = Math.max(10, canvasWidth - paddingLeft - paddingRight)

	const cacheKey = [
		text,
		canvasWidth,
		canvasHeight,
		position,
		JSON.stringify(fontCfg),
		JSON.stringify(textCfg),
		JSON.stringify(posCfg)
	].join('|')

	const cached = cacheEngine.get(NS, cacheKey)
	if (cached.hit) return cached.value

	let ctx
	let family
	try {
		ctx = await getMeasureContext()
		family = await fontEngine.activeFamily()
	} catch (err) {
		throw new StickerEngineError('TextEngine', ERROR_CODES.INVALID_FONT, `Gagal menyiapkan pengukuran font: ${err.message}`, undefined, err)
	}

	const weight = fontCfg.weight === 'bold' ? 'bold' : 'normal'
	const words = splitWords(text)

	// Smart Font Size + Vertical Fit
    let fontSize = maxSize
    let lines = []
    
    const availableHeight =
    	canvasHeight -
    	paddingTop -
    	paddingBottom
    
    const lineSpacingPx =
    	fontCfg.lineSpacing || 0
    
    while (fontSize >= minSize) {
    
    	ctx.font = `${weight} ${fontSize}px ${family}`
    
    	const candidate =
    		wrapWords(ctx, words, maxTextWidth)
    
    	const candidateLineHeight =
    		Math.round(fontSize * 1.15 + lineSpacingPx)
    
    	const totalHeight =
    		(candidate.length - 1) *
    		candidateLineHeight +
    		fontSize
    
    	if (
    		candidate.length <= maxLines &&
    		totalHeight <= availableHeight
    	) {
    
    		lines = candidate
    		break
    
    	}
    
    	fontSize -= 2
    
    }
    
    if (!lines.length) {   
    	fontSize = minSize   
    	ctx.font = `${weight} ${fontSize}px ${family}`  
    	lines =
    		wrapWords(ctx, words, maxTextWidth)
    		.slice(0, maxLines)
    
    }
    
	// Dynamic line height: proporsional terhadap fontSize final (STICKER_UPGRADE.md: "Dynamic Line Height").
	const lineHeight =
	Math.round(
		fontSize * 1.15 +
		lineSpacingPx
	)

    const totalTextHeight =
    	(lines.length - 1) *
    	lineHeight +
    	fontSize
    
    const visualMargin =
    	Math.round(fontSize * 0.35)
	// Dynamic stroke: skala mengikuti rasio fontSize saat ini terhadap
	// baseSize yang dikonfigurasi, supaya teks kecil tidak dapat outline
	// setebal teks besar (STICKER_UPGRADE.md: "Dynamic Stroke").
	const strokeEnabled = textCfg.stroke !== false
	const baseStrokeWidth = textCfg.strokeWidth ?? 5
	const strokeWidth = strokeEnabled ? Math.max(1, Math.round(baseStrokeWidth * (fontSize / baseSize))) : 0

	// Dynamic padding: padding horizontal tetap dari config, padding
	// vertikal dipakai untuk menentukan anchor Y baris pertama.
	let firstLineY

    if (position === 'top') {
    
    	firstLineY =
    		paddingTop +
    		visualMargin +
    		fontSize
    
    } else {
    
    	firstLineY =
    		canvasHeight -
    		paddingBottom -
    		visualMargin -
    		totalTextHeight +
    		fontSize
    
    }
    
    const lastLineY =
    	firstLineY +
    	(lines.length - 1) *
    	lineHeight
    
    const bottomLimit =
    	canvasHeight -
    	paddingBottom
    
    if (lastLineY > bottomLimit) {
    
    	firstLineY -=
    		lastLineY -
    		bottomLimit
    
    }
    
    if (firstLineY < paddingTop + fontSize) {
    
    	firstLineY =
    		paddingTop +
    		fontSize
    
    }

	const result = {
		lines,
		fontSize,
		lineHeight,
		stroke: {
			enabled: strokeEnabled,
			width: strokeWidth,
			color: textCfg.strokeColor || '#000000'
		},
		padding: {
			left: paddingLeft,
			right: paddingRight,
			top: paddingTop,
			bottom: paddingBottom
		},
		position: {
			align: fontCfg.align || 'center',
			x: canvasWidth / 2,
			y: firstLineY,
			anchor: position
		},
		fill: textCfg.fill || '#FFFFFF',
		shadow: textCfg.shadow
			? {
					enabled: true,
					color: textCfg.shadowColor || '#000000',
					blur: textCfg.shadowBlur || 0,
					offsetX: textCfg.shadowOffsetX || 0,
					offsetY: textCfg.shadowOffsetY || 0
			  }
			: { enabled: false },
		fontFamily: family,
		fontWeight: weight
	}

	cacheEngine.set(NS, cacheKey, result)

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	if (ms > PERFORMANCE_TARGET.text * 3) logger.warn(`layout() melebihi target performa: ${ms.toFixed(2)}ms`)
	else logger.debug(`layout() selesai ${ms.toFixed(2)}ms (${lines.length} baris @ ${fontSize}px)`)

	return result
}

export const textEngine = {
	layout
}

export default textEngine
