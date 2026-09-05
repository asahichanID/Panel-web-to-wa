/**
 * ============================================================
 *  Sticker Engine V2 — config.js (Internal Helper)
 * ============================================================
 *
 * Memuat musume/sticker/stickermeme.json, digabung (deep merge)
 * dengan default yang aman, lalu dipakai bersama oleh Font/Text/
 * Image/Canvas/Video/WebP Engine.
 *
 * Bukan salah satu dari 15 Engine resmi — ini "Internal Helper"
 * (ENGINE_API.md Part 1 #12) tanpa dependency ke Engine lain.
 * ============================================================
 */

import fs from 'fs'
import path from 'path'
import { CONFIG_PATH, FONTS_DIR, PROJECT_ROOT, createLogger } from './constants.js'

const logger = createLogger('Config')

const DEFAULT_CONFIG = {
	packname: '',
	author: '',
	font: {
		file: path.join(FONTS_DIR, 'impact.ttf'),
		fallback: path.join(FONTS_DIR, 'anton.ttf'),
		uppercase: true,
		size: 68,
		minSize: 18,
		maxSize: 72,
		autoResize: true,
		letterSpacing: 0,
		lineSpacing: 2,
		align: 'center',
		weight: 'bold'
	},
	text: {
		maxLines: 3,
		wrap: true,
		stroke: true,
		strokeColor: '#000000',
		strokeWidth: 5,
		fill: '#FFFFFF',
		shadow: false,
		shadowColor: '#000000',
		shadowBlur: 0,
		shadowOffsetX: 0,
		shadowOffsetY: 0
	},
	position: {
		top: { paddingTop: 14, paddingLeft: 14, paddingRight: 14 },
		bottom: { paddingBottom: 14, paddingLeft: 14, paddingRight: 14 }
	},
	image: {
		quality: 100,
		background: 'transparent',
		allowSticker: true,
		allowImage: true,
		keepAspectRatio: true,
		maxWidth: 512,
		maxHeight: 512
	},
	render: {
		canvas: 512,
		smoothing: true,
		antialias: true,
		highQuality: true
	},
	emoji: {
		enabled: true
	},
	cache: {
		enabled: true,
		max: 100
	},
	limits: {
		maxTopLength: 120,
		maxBottomLength: 120
	},
	video: {
		maxDurationSec: 10,
		maxFps: 15,
		maxDimension: 512
	},
	worker: {
		enabled: false,
		emojiThreshold: 6
	}
}

function isPlainObject(v) {
	return v && typeof v === 'object' && !Array.isArray(v)
}

function deepMerge(base, override) {
	if (!isPlainObject(override)) return base
	const out = { ...base }
	for (const key of Object.keys(override)) {
		if (isPlainObject(base[key]) && isPlainObject(override[key])) {
			out[key] = deepMerge(base[key], override[key])
		} else {
			out[key] = override[key]
		}
	}
	return out
}

/**
 * Path font pada stickermeme.json ditulis relatif terhadap root
 * project (mis. "./musume/sticker/fonts/impact.ttf"). Kita resolve
 * memakai PROJECT_ROOT absolut (bukan process.cwd()) supaya tetap
 * benar berapa pun direktori kerja saat proses Node dijalankan.
 */
function resolveFontPath(value, fallback) {
	if (!value || typeof value !== 'string') return fallback
	if (path.isAbsolute(value)) return value
	return path.resolve(PROJECT_ROOT, value)
}

let cached = null

function loadConfig({ fresh = false } = {}) {
	if (cached && !fresh) return cached

	let fileConfig = {}
	try {
		if (fs.existsSync(CONFIG_PATH)) {
			const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
			fileConfig = JSON.parse(raw)
		}
	} catch (err) {
		logger.warn(`Gagal membaca stickermeme.json (${err.message}), memakai default bawaan.`)
		fileConfig = {}
	}

	const merged = deepMerge(DEFAULT_CONFIG, fileConfig)

	merged.font.file = resolveFontPath(fileConfig?.font?.file, DEFAULT_CONFIG.font.file)
	merged.font.fallback = resolveFontPath(fileConfig?.font?.fallback, DEFAULT_CONFIG.font.fallback)

	cached = merged
	return cached
}

function reloadConfig() {
	return loadConfig({ fresh: true })
}

export { loadConfig, reloadConfig, DEFAULT_CONFIG }
export default loadConfig
