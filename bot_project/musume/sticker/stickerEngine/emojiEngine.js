/**
 * ============================================================
 *  Sticker Engine V2 — Emoji Engine (UPGRADE: Twemoji)
 * ============================================================
 *
 * Tujuan: Mendeteksi dan merender emoji pada teks smeme menjadi
 * "Emoji Layer" terpisah yang di-komposit Canvas Engine lewat
 * drawImage(). Engine ini OPSIONAL — tidak dijalankan sama sekali
 * apabila teks tidak mengandung emoji (nol overhead kasus umum).
 *
 * ------------------------------------------------------------
 * UPGRADE TWEMOJI (menggantikan fillText() + font emoji sistem):
 * ------------------------------------------------------------
 * Pendekatan lama menggambar emoji sbg TEKS (ctx.fillText) memakai font
 * emoji sistem (Noto/Apple/Segoe Color Emoji) — hasilnya TIDAK konsisten
 * antar platform (Android/Linux/Windows/Docker/Railway/VPS/Termux bisa
 * menampilkan glyph berbeda, atau kotak kosong "tofu" bila font emoji
 * tidak terpasang di OS).
 *
 * Sekarang emoji digambar sbg IMAGE (drawImage) memakai asset Twemoji —
 * hasil identik di SEMUA platform krn tidak lagi bergantung pada font
 * emoji bawaan OS. Pipeline: emoji -> unicode codepoint -> asset Twemoji
 * (PNG lokal, dari paket npm "twemoji" yg terpasang lewat `npm install` —
 * seluruh asset sudah berada di disk lokal setelah instalasi, TIDAK ADA
 * fetch ke internet saat runtime) -> cache -> load image -> drawImage ->
 * Canvas Engine -> render.
 *
 * FALLBACK (wajib, tidak boleh crash): apabila asset Twemoji utk suatu
 * emoji tidak ditemukan di disk (mis. paket belum ter-install penuh),
 * engine jatuh kembali ke rendering berbasis font emoji sistem (perilaku
 * lama) HANYA utk glyph tsb — teks tetap utuh, tidak ada error yang
 * menghentikan pipeline, dicatat lewat logger.
 *
 * Public API : render(context), detect(), hasEmoji(), stripEmoji(), segment()
 *              — SELURUHNYA tetap kompatibel (tidak ada perubahan signature).
 * Return     : Emoji Layer -> { hasEmoji, layers:[{char,image,size}] }
 * Cache      : Ya — cache unicode->filename, cache Image asset, cache Layer.
 * Cleanup    : Emoji Layer dilepas referensinya setelah dikomposit.
 * Common Failure : Emoji Unsupported, Missing Renderer (-> fallback font).
 * Performance Target : 20 – 300 ms.
 *
 * Dependency Rule: TETAP memakai canvasLib.js langsung (bukan modul
 * canvasEngine.js) — Canvas Engine sudah bergantung pada Emoji Engine,
 * memilih arah sebaliknya akan membentuk Circular Dependency.
 * ============================================================
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import emojiRegexFactory from 'emoji-regex'
import { createLogger, PERFORMANCE_TARGET } from './constants.js'
import { cacheEngine } from './cacheEngine.js'
import { loadCanvasLib } from './canvasLib.js'

const logger = createLogger('EmojiEngine')
const NS_LAYER = 'emoji'
const NS_ASSET = 'emojiAsset'

cacheEngine.configureNamespace(NS_LAYER, { max: 300, ttl: 10 * 60 * 1000 })
cacheEngine.configureNamespace(NS_ASSET, { max: 500, ttl: 0 }) // asset lokal tidak berubah, tidak perlu TTL

// Fallback font stack (HANYA dipakai bila asset Twemoji utk suatu emoji
// tidak ditemukan di disk — lihat FALLBACK di header file).
const EMOJI_FONT_STACK = '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "Noto Emoji", sans-serif'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Kandidat lokasi asset Twemoji (paket npm "twemoji", terpasang lokal lewat
// `npm install twemoji` — struktur folder standar paket tsb membundel PNG
// 72x72 di bawah node_modules/twemoji/assets/72x72/<codepoint>.png). Beberapa
// versi/fork paket punya struktur sedikit berbeda, karena itu dicoba
// berurutan supaya tetap tangguh (robust) tanpa perlu mengubah kode.
const TWEMOJI_ASSET_CANDIDATES = [
	path.join(__dirname, '..', '..', '..', 'node_modules', 'twemoji', 'assets', '72x72'),
	path.join(__dirname, '..', '..', '..', 'node_modules', '@twemoji', 'svg', '..', '72x72'),
	path.join(__dirname, '..', 'assets', 'twemoji', '72x72')
]

let resolvedAssetDir = null
let assetDirChecked = false

function resolveAssetDir() {
	if (assetDirChecked) return resolvedAssetDir
	assetDirChecked = true
	for (const candidate of TWEMOJI_ASSET_CANDIDATES) {
		try {
			if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
				resolvedAssetDir = candidate
				logger.info(`Twemoji asset directory ditemukan: ${candidate}`)
				break
			}
		} catch (_) {
			/* lanjut coba kandidat berikutnya */
		}
	}
	if (!resolvedAssetDir) {
		logger.warn(
			'Twemoji asset directory tidak ditemukan (paket "twemoji" belum ter-install?). ' +
				'Emoji akan memakai fallback font sistem sampai `npm install` dijalankan.'
		)
	}
	return resolvedAssetDir
}

function detect(text) {
	if (!text) return []
	const regex = emojiRegexFactory()
	return Array.from(String(text).matchAll(regex), (m) => m[0])
}

function hasEmoji(text) {
	if (!text) return false
	const regex = emojiRegexFactory()
	return regex.test(String(text))
}

/** Hapus emoji dari teks (dipakai Canvas Engine bila memilih strategi gambar teks tanpa emoji lalu tempel emoji di atasnya). */
function stripEmoji(text) {
	if (!text) return text
	const regex = emojiRegexFactory()
	return String(text).replace(regex, '').replace(/\s{2,}/g, ' ').trim()
}

/**
 * segment(): pecah satu baris teks menjadi token { type:'text'|'emoji', value }
 * berurutan sesuai kemunculan aslinya. Dipakai Canvas Engine.
 */
function segment(text) {
	if (!text) return [{ type: 'text', value: '' }]
	const str = String(text)
	const regex = emojiRegexFactory()
	const tokens = []
	let lastIndex = 0
	for (const match of str.matchAll(regex)) {
		const idx = match.index
		if (idx > lastIndex) tokens.push({ type: 'text', value: str.slice(lastIndex, idx) })
		tokens.push({ type: 'emoji', value: match[0] })
		lastIndex = idx + match[0].length
	}
	if (lastIndex < str.length) tokens.push({ type: 'text', value: str.slice(lastIndex) })
	if (tokens.length === 0) tokens.push({ type: 'text', value: '' })
	return tokens
}

/** Pecah string emoji (bisa berupa sequence ZWJ/modifier) menjadi array code point Unicode. */
function toCodePoints(str) {
	const codePoints = []
	let i = 0
	while (i < str.length) {
		const codePoint = str.codePointAt(i)
		codePoints.push(codePoint)
		i += codePoint > 0xffff ? 2 : 1
	}
	return codePoints
}

/**
 * toTwemojiFilename(): algoritma konversi standar Twemoji — gabungkan
 * code point (hex, huruf kecil) dengan tanda hubung. Variation selector
 * (U+FE0F) dibuang KECUALI pada sequence keycap (digit/# /* + U+20E3),
 * yang memang mempertahankannya sesuai konvensi asset resmi Twemoji.
 */
function toTwemojiFilename(emojiChar) {
	let codePoints = toCodePoints(emojiChar)
	const isKeycap = codePoints.includes(0x20e3)
	if (!isKeycap) {
		codePoints = codePoints.filter((cp) => cp !== 0xfe0f)
	}
	return codePoints.map((cp) => cp.toString(16)).join('-')
}

/** Cari path asset PNG Twemoji utk satu karakter emoji, dgn cache lookup. */
function findAssetPath(emojiChar) {
	const cacheKey = emojiChar
	const cached = cacheEngine.get(NS_ASSET, cacheKey)
	if (cached.hit) return cached.value

	const assetDir = resolveAssetDir()
	let result = null
	if (assetDir) {
		const filename = toTwemojiFilename(emojiChar)
		const candidatePath = path.join(assetDir, `${filename}.png`)
		if (fs.existsSync(candidatePath)) {
			result = candidatePath
		} else {
			// Sebagian sequence (mis. dgn ZWJ) kadang tidak punya asset gabungan
			// tersendiri — coba fallback ke code point PERTAMA saja (base emoji),
			// lebih baik menampilkan versi sederhana drpd tidak sama sekali.
			const baseFilename = toCodePoints(emojiChar)[0]?.toString(16)
			const basePath = baseFilename ? path.join(assetDir, `${baseFilename}.png`) : null
			if (basePath && fs.existsSync(basePath)) result = basePath
		}
	}

	cacheEngine.set(NS_ASSET, cacheKey, result)
	return result
}

/** Render fallback berbasis font (perilaku lama) — HANYA dipakai saat asset Twemoji tidak ditemukan. */
async function renderFallbackGlyph(char, size) {
	const lib = await loadCanvasLib()
	const canvas = lib.createCanvas(size, size)
	const ctx = canvas.getContext('2d')
	ctx.clearRect(0, 0, size, size)
	ctx.font = `${Math.round(size * 0.85)}px ${EMOJI_FONT_STACK}`
	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'
	ctx.fillText(char, size / 2, size / 2)
	return canvas
}

/** Render lewat asset Twemoji (drawImage, BUKAN fillText). */
async function renderTwemojiGlyph(assetPath, size) {
	const lib = await loadCanvasLib()
	const image = await lib.loadImage(assetPath)
	// Asset Twemoji asli berukuran tetap (mis. 72x72) — di-drawImage ke kanvas
	// kecil seukuran `size` supaya Canvas Engine bisa langsung memakainya tanpa
	// perlu tahu ukuran asli asset (kontrak Emoji Layer tetap konsisten).
	const canvas = lib.createCanvas(size, size)
	const ctx = canvas.getContext('2d')
	ctx.clearRect(0, 0, size, size)
	if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = true
	ctx.drawImage(image, 0, 0, size, size)
	return canvas
}

async function renderGlyph(char, size) {
	const assetPath = findAssetPath(char)
	if (assetPath) {
		try {
			return await renderTwemojiGlyph(assetPath, size)
		} catch (err) {
			logger.warn(`Gagal memuat asset Twemoji utk '${char}' (${assetPath}): ${err.message} — jatuh ke fallback font.`)
		}
	}
	return renderFallbackGlyph(char, size)
}

/**
 * render(context): context = { text, size }. Nama internal `renderEmoji`
 * dipakai konsisten (menghindari kebingungan penamaan dengan method Canvas
 * Engine yang juga bernama `render`).
 */
async function renderEmoji(context) {
	const start = process.hrtime.bigint()
	const text = context?.text || ''
	const size = context?.size || 64

	if (!hasEmoji(text)) {
		return { hasEmoji: false, layers: [] }
	}

	const uniqueChars = Array.from(new Set(detect(text)))
	const layers = []

	for (const char of uniqueChars) {
		const cacheKey = `${char}:${size}`
		const cached = cacheEngine.get(NS_LAYER, cacheKey)
		if (cached.hit) {
			layers.push(cached.value)
			continue
		}
		try {
			const canvas = await renderGlyph(char, size)
			// Field `image` (bukan lagi `canvas` saja) merefleksikan bahwa sumber
			// gambar sekarang bisa berasal dari asset Twemoji (drawImage) maupun
			// fallback font — keduanya tetap berupa objek Canvas kecil yang siap
			// langsung di-drawImage() oleh Canvas Engine tanpa perlu tahu asalnya.
			const layer = { char, image: canvas, size }
			cacheEngine.set(NS_LAYER, cacheKey, layer)
			layers.push(layer)
			context.resource?.trackBuffer(canvas)
		} catch (err) {
			// Emoji Unsupported: JANGAN gagalkan seluruh pipeline hanya karena
			// satu glyph emoji tidak bisa dirender — degradasi graceful.
			logger.warn(`Gagal merender emoji '${char}': ${err.message}`)
		}
	}

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	if (ms > PERFORMANCE_TARGET.emojiMax) logger.warn(`render() melebihi target performa: ${ms.toFixed(2)}ms`)
	else logger.debug(`render() selesai ${ms.toFixed(2)}ms (${layers.length} emoji unik)`)

	return { hasEmoji: true, layers }
}

export const emojiEngine = {
	render: renderEmoji,
	detect,
	hasEmoji,
	stripEmoji,
	segment
}

export default emojiEngine
