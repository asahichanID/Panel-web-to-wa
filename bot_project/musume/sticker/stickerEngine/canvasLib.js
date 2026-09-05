/**
 * ============================================================
 *  Sticker Engine V2 — canvasLib.js (Internal Helper)
 * ============================================================
 *
 * BUKAN salah satu dari 15 Engine resmi pada ARCHITECTURE.md/
 * ENGINE_API.md — ini adalah "Internal Helper" (ENGINE_API.md
 * Part 1 #12) yang menyatukan logika loading library canvas
 * (dengan fallback) satu kali, supaya Font Engine, Canvas Engine,
 * dan Emoji Engine tidak menduplikasi logika yang sama.
 *
 * Font Engine, Canvas Engine, dan Emoji Engine masing-masing
 * memang diizinkan bergantung pada "Canvas library" (bukan pada
 * Engine lain), sehingga memusatkan logic import-nya di sini TIDAK
 * menambah Circular Dependency ataupun melanggar Dependency Rule —
 * ini murni memindahkan kode duplikat (yang sebelumnya ada di
 * smeme.js versi lama) ke satu tempat.
 *
 * Prioritas:
 *  1) @napi-rs/canvas (prebuilt binary, tanpa toolchain native,
 *     lebih cepat start-nya, direkomendasikan untuk production).
 *  2) canvas (node-canvas, fallback bila napi-rs tidak terpasang).
 * ============================================================
 */

import { StickerEngineError, ERROR_CODES, createLogger } from './constants.js'

const logger = createLogger('CanvasLib')

let libPromise = null

async function loadCanvasLib() {
	if (libPromise) return libPromise

	libPromise = (async () => {
		try {
			const napi = await import('@napi-rs/canvas')
			logger.debug('menggunakan @napi-rs/canvas')
			return {
				name: '@napi-rs/canvas',
				skia: true,
				createCanvas: napi.createCanvas,
				loadImage: napi.loadImage,
				Image: napi.Image,
				registerFont(filePath, family) {
					napi.GlobalFonts.registerFromPath(filePath, family)
				},
				hasFont(family) {
					return napi.GlobalFonts.has ? napi.GlobalFonts.has(family) : true
				}
			}
		} catch (_) {
			// lanjut coba fallback
		}

		try {
			const nodeCanvas = await import('canvas')
			logger.debug('menggunakan canvas (node-canvas) sebagai fallback')
			return {
				name: 'canvas',
				skia: false,
				createCanvas: nodeCanvas.createCanvas,
				loadImage: nodeCanvas.loadImage,
				Image: nodeCanvas.Image,
				registerFont(filePath, family) {
					nodeCanvas.registerFont(filePath, { family })
				},
				hasFont() {
					return true
				}
			}
		} catch (_) {
			// tidak ada engine yang tersedia
		}

		throw new StickerEngineError(
			'CanvasLib',
			ERROR_CODES.CANVAS_FAILED,
			'Tidak ada library canvas yang terpasang. Install salah satu: "@napi-rs/canvas" (disarankan) atau "canvas".'
		)
	})()

	return libPromise
}

export { loadCanvasLib }
export default loadCanvasLib
