/**
 * ============================================================
 *  Sticker Engine V2 — smemeCustom.js (Sticker Meme Custom)
 * ============================================================
 *
 * SATU-SATUNYA tempat untuk mengelola seluruh fitur custom layout
 * Sticker Meme (.smemec). File ini BUKAN renderer, BUKAN Text Engine,
 * BUKAN Canvas Engine — murni controller konfigurasi yang dipakai
 * engine lain (textEngine, canvasEngine) untuk MEMBACA config final.
 *
 * Tanggung jawab (sesuai spesifikasi Sticker Meme Custom Part 1-5):
 *   • parsing parameter custom (format ".smemec t18|b84|f42|s7")
 *   • validasi parameter (registry-based, bukan switch-case panjang)
 *   • normalisasi nilai
 *   • merge dengan default config (config.js tetap satu-satunya
 *     "default" layer — TIDAK diduplikasi di sini)
 *   • preset management (classic/modern/anime/compact/outline/large)
 *   • custom profile & session runtime
 *   • export config final (dibaca textEngine & canvasEngine)
 *   • preview metadata (dipakai Canvas Engine untuk preview editor)
 *   • backward compatibility penuh (.smeme tanpa parameter custom
 *     HARUS identik seperti sebelum smemeCustom ada)
 *
 * Command lama `.smeme atas|bawah` TIDAK PERNAH melewati file ini —
 * hanya `.smemec` yang memanggil smemeCustom. Ini sendiri sudah
 * menjamin backward compatibility 100% pada level arsitektur.
 * ============================================================
 */

import { StickerEngineError, ERROR_CODES, createLogger } from './constants.js'
import { cacheEngine } from './cacheEngine.js'
import { loadConfig } from './config.js'

const logger = createLogger('SmemeCustom')
const NS_CONFIG = 'smemeCustomConfig'
const NS_PARSE = 'smemeCustomParse'

cacheEngine.configureNamespace(NS_CONFIG, { max: 100, ttl: 10 * 60 * 1000 })
cacheEngine.configureNamespace(NS_PARSE, { max: 200, ttl: 10 * 60 * 1000 })

/**
 * ============================================================
 * 1) NORMALIZER
 * ============================================================
 * Fungsi normalisasi generik dipakai registry parameter di bawah.
 * Tetap berada di file ini (tidak dipecah ke file lain).
 */
const normalize = {
	int(raw) {
		const n = parseInt(raw, 10)
		return Number.isFinite(n) ? n : NaN
	},
	float(raw) {
		const n = parseFloat(raw)
		return Number.isFinite(n) ? n : NaN
	},
	percent(raw) {
		const n = parseFloat(raw)
		if (!Number.isFinite(n)) return NaN
		return Math.min(100, Math.max(0, n))
	},
	boolean(raw) {
		const s = String(raw).trim().toLowerCase()
		if (s === '1' || s === 'true' || s === 'on' || s === 'yes') return true
		if (s === '0' || s === 'false' || s === 'off' || s === 'no') return false
		return undefined
	},
	alignment(raw) {
		const s = String(raw).trim().toLowerCase()
		if (s === 'l' || s === 'left') return 'left'
		if (s === 'c' || s === 'center' || s === 'centre') return 'center'
		if (s === 'r' || s === 'right') return 'right'
		return undefined
	},
	string(raw) {
		return String(raw).trim()
	}
}

/**
 * ============================================================
 * 2) VALIDATOR
 * ============================================================
 * Setiap validator mengembalikan `true` bila nilai valid, atau
 * string alasan (message) bila tidak valid — dipakai registry.
 */
const validate = {
	range(min, max) {
		return (value) => {
			if (!Number.isFinite(value)) return `Nilai harus berupa angka.`
			if (value < min || value > max) return `Nilai harus berada di antara ${min}-${max}.`
			return true
		}
	},
	min(min) {
		return (value) => {
			if (!Number.isFinite(value)) return `Nilai harus berupa angka.`
			if (value < min) return `Nilai minimal ${min}.`
			return true
		}
	},
	oneOf(options) {
		return (value) => {
			if (value === undefined || !options.includes(value)) {
				return `Nilai harus salah satu dari: ${options.join(', ')}.`
			}
			return true
		}
	},
	boolean() {
		return (value) => {
			if (value === undefined) return 'Nilai harus 0/1, true/false, atau on/off.'
			return true
		}
	}
}

/**
 * ============================================================
 * 3) REGISTRY PARAMETER
 * ============================================================
 * Sumber tunggal seluruh parameter `.smemec`. Menambah parameter
 * baru CUKUP menambah entri di sini — parser, validator, dan
 * normalizer otomatis mengikuti (tidak perlu mengubah logic parser).
 *
 * Setiap entri: { prefix, key, path, type, normalizer, validator,
 * default, min, max, description, category, target }.
 *
 * `path` = lokasi field pada config final (dot notation), supaya
 * parser bisa langsung menulis ke object config tanpa switch-case.
 */
const PARAMETER_REGISTRY = Object.freeze([
	{
		prefix: 't', key: 'topPosition', path: 'position.top.percent', type: 'percent',
		normalizer: normalize.percent, validator: validate.range(0, 100), default: 14,
		description: 'Posisi teks atas (0-100%)', category: 'position', target: 'textEngine'
	},
	{
		prefix: 'b', key: 'bottomPosition', path: 'position.bottom.percent', type: 'percent',
		normalizer: normalize.percent, validator: validate.range(0, 100), default: 86,
		description: 'Posisi teks bawah (0-100%)', category: 'position', target: 'textEngine'
	},
	{
		prefix: 'f', key: 'fontSize', path: 'font.size', type: 'int',
		normalizer: normalize.int, validator: validate.min(1), default: 68,
		description: 'Ukuran font dasar', category: 'font', target: 'textEngine'
	},
	{
		prefix: 'fn', key: 'fontMin', path: 'font.minSize', type: 'int',
		normalizer: normalize.int, validator: validate.min(1), default: 18,
		description: 'Ukuran font minimum (auto-shrink)', category: 'font', target: 'textEngine'
	},
	{
		prefix: 'fx', key: 'fontMax', path: 'font.maxSize', type: 'int',
		normalizer: normalize.int, validator: validate.min(1), default: 72,
		description: 'Ukuran font maksimum', category: 'font', target: 'textEngine'
	},
	{
		prefix: 's', key: 'strokeWidth', path: 'text.strokeWidth', type: 'float',
		normalizer: normalize.float, validator: validate.min(0), default: 5,
		description: 'Ketebalan stroke/outline teks', category: 'stroke', target: 'textEngine'
	},
	{
		prefix: 'sb', key: 'shadowBlur', path: 'text.shadowBlur', type: 'float',
		normalizer: normalize.float, validator: validate.min(0), default: 0,
		description: 'Blur bayangan teks', category: 'shadow', target: 'textEngine'
	},
	{
		prefix: 'sx', key: 'shadowOffsetX', path: 'text.shadowOffsetX', type: 'float',
		normalizer: normalize.float, validator: validate.range(-100, 100), default: 0,
		description: 'Offset X bayangan teks', category: 'shadow', target: 'textEngine'
	},
	{
		prefix: 'sy', key: 'shadowOffsetY', path: 'text.shadowOffsetY', type: 'float',
		normalizer: normalize.float, validator: validate.range(-100, 100), default: 0,
		description: 'Offset Y bayangan teks', category: 'shadow', target: 'textEngine'
	},
	{
		prefix: 'pt', key: 'paddingTop', path: 'position.top.paddingTop', type: 'int',
		normalizer: normalize.int, validator: validate.range(0, 500), default: 14,
		description: 'Padding atas', category: 'padding', target: 'textEngine'
	},
	{
		prefix: 'pb', key: 'paddingBottom', path: 'position.bottom.paddingBottom', type: 'int',
		normalizer: normalize.int, validator: validate.range(0, 500), default: 14,
		description: 'Padding bawah', category: 'padding', target: 'textEngine'
	},
	{
		prefix: 'pl', key: 'paddingLeft', path: 'position.top.paddingLeft', type: 'int',
		normalizer: normalize.int, validator: validate.range(0, 500), default: 14,
		description: 'Padding kiri', category: 'padding', target: 'textEngine'
	},
	{
		prefix: 'pr', key: 'paddingRight', path: 'position.top.paddingRight', type: 'int',
		normalizer: normalize.int, validator: validate.range(0, 500), default: 14,
		description: 'Padding kanan', category: 'padding', target: 'textEngine'
	},
	{
		prefix: 'ls', key: 'lineSpacing', path: 'font.lineSpacing', type: 'float',
		normalizer: normalize.float, validator: validate.range(-50, 200), default: 2,
		description: 'Jarak antar baris tambahan (px)', category: 'spacing', target: 'textEngine'
	},
	{
		prefix: 'lh', key: 'lineHeightRatio', path: 'font.lineHeightRatio', type: 'float',
		normalizer: normalize.float, validator: validate.range(50, 300), default: 115,
		description: 'Rasio tinggi baris (%), 115 = 1.15x fontSize', category: 'spacing', target: 'textEngine'
	},
	{
		prefix: 'a', key: 'align', path: 'font.align', type: 'alignment',
		normalizer: normalize.alignment, validator: validate.oneOf(['left', 'center', 'right']), default: 'center',
		description: 'Perataan teks (left/center/right)', category: 'layout', target: 'textEngine'
	},
	{
		prefix: 'ml', key: 'maxLines', path: 'text.maxLines', type: 'int',
		normalizer: normalize.int, validator: validate.range(1, 10), default: 3,
		description: 'Jumlah baris maksimum', category: 'layout', target: 'textEngine'
	},
	{
		prefix: 'uc', key: 'uppercase', path: 'font.uppercase', type: 'boolean',
		normalizer: normalize.boolean, validator: validate.boolean(), default: true,
		description: 'Paksa huruf kapital (0/1)', category: 'layout', target: 'textEngine'
	},
	{
		prefix: 'sa', key: 'safeArea', path: 'layout.safeAreaPercent', type: 'percent',
		normalizer: normalize.percent, validator: validate.range(0, 50), default: 4,
		description: 'Margin aman dari tepi kanvas (%)', category: 'layout', target: 'textEngine'
	},
	{
		prefix: 'es', key: 'emojiScale', path: 'emoji.scale', type: 'float',
		normalizer: normalize.float, validator: validate.range(10, 300), default: 100,
		description: 'Skala ukuran emoji relatif thd font (%)', category: 'emoji', target: 'canvasEngine'
	},
	{
		prefix: 'ex', key: 'emojiOffsetX', path: 'emoji.offsetX', type: 'float',
		normalizer: normalize.float, validator: validate.range(-100, 100), default: 0,
		description: 'Offset X posisi emoji', category: 'emoji', target: 'canvasEngine'
	},
	{
		prefix: 'ey', key: 'emojiOffsetY', path: 'emoji.offsetY', type: 'float',
		normalizer: normalize.float, validator: validate.range(-100, 100), default: 0,
		description: 'Offset Y posisi emoji', category: 'emoji', target: 'canvasEngine'
	}
])

/** Index registry berdasarkan prefix untuk lookup O(1) saat parsing. */
const REGISTRY_BY_PREFIX = new Map(PARAMETER_REGISTRY.map((entry) => [entry.prefix, entry]))

function setPath(target, path, value) {
	const parts = path.split('.')
	let node = target
	for (let i = 0; i < parts.length - 1; i++) {
		const key = parts[i]
		if (typeof node[key] !== 'object' || node[key] === null) node[key] = {}
		node = node[key]
	}
	node[parts[parts.length - 1]] = value
}

/**
 * ============================================================
 * 4) PARSER
 * ============================================================
 * Parser registry-based — MENGENALI prefix apa pun yang terdaftar,
 * TANPA switch-case. Format: "t18|b84|f42|s7", urutan bebas, jumlah
 * parameter bebas (1 sampai semua), seluruhnya opsional.
 */
function tokenize(paramString) {
	if (!paramString || typeof paramString !== 'string') return []
	return paramString
		.split('|')
		.map((tok) => tok.trim())
		.filter(Boolean)
}

/**
 * splitPrefixValue(): pisahkan token seperti "t18" atau "lh60" menjadi
 * { prefix:'t', value:'18' } / { prefix:'lh', value:'60' }. Prefix bisa
 * lebih dari satu huruf (mis. fn/fx/pt/pb/pl/pr/ls/lh/sb/sx/sy/uc/sa/es/ex/ey),
 * sehingga dicocokkan terhadap REGISTRY_BY_PREFIX dari yang PALING PANJANG
 * dahulu supaya "fn10" tidak salah kepotong jadi prefix "f" + value "n10".
 */
const SORTED_PREFIXES = [...REGISTRY_BY_PREFIX.keys()].sort((a, b) => b.length - a.length)

function splitPrefixValue(token) {
	for (const prefix of SORTED_PREFIXES) {
		if (token.startsWith(prefix)) {
			const rest = token.slice(prefix.length)
			if (rest.length > 0 && /^-?[0-9.]/.test(rest)) {
				return { prefix, value: rest }
			}
			// Prefix alfabetik (mis. alignment "a") boleh diikuti huruf, bukan hanya angka.
			if (rest.length > 0) return { prefix, value: rest }
		}
	}
	return null
}

/**
 * parse(paramString): parsing MURNI (tanpa validasi/exception) — dipakai
 * internal maupun untuk keperluan introspeksi (mis. menampilkan parameter
 * apa saja yang dikenali dari input user). Mengembalikan array
 * { entry, raw, token }; token yang tidak dikenali tetap disertakan dengan
 * entry:null supaya buildConfigFromParams() bisa melaporkan error yang jelas.
 */
function parse(paramString) {
	const tokens = tokenize(paramString)
	return tokens.map((token) => {
		const split = splitPrefixValue(token)
		if (!split) return { token, entry: null, raw: null }
		const entry = REGISTRY_BY_PREFIX.get(split.prefix)
		return { token, entry, raw: split.value }
	})
}

/**
 * ============================================================
 * 5) VALIDATOR + NORMALIZER PIPELINE
 * ============================================================
 * Terapkan normalizer lalu validator utk satu token hasil parse().
 * Parameter yang salah TIDAK PERNAH membuat engine crash — selalu
 * StickerEngineError yang konsisten & jelas.
 */
function applyParam(parsed, target, jobLogger) {
	const { token, entry, raw } = parsed
	if (!entry) {
		throw new StickerEngineError(
			'SmemeCustom',
			ERROR_CODES.INVALID_CONFIGURATION,
			`Parameter custom tidak dikenali: "${token}". Gunakan format seperti t20, b85, f42, s7, dst.`
		)
	}

	const normalized = entry.normalizer(raw)
	if (normalized === undefined || (typeof normalized === 'number' && Number.isNaN(normalized))) {
		throw new StickerEngineError(
			'SmemeCustom',
			ERROR_CODES.INVALID_CONFIGURATION,
			`Nilai parameter "${entry.prefix}" tidak valid: "${raw}". ${entry.description}.`
		)
	}

	const validationResult = entry.validator(normalized)
	if (validationResult !== true) {
		throw new StickerEngineError(
			'SmemeCustom',
			ERROR_CODES.INVALID_CONFIGURATION,
			`Parameter "${entry.prefix}" (${entry.description}): ${validationResult}`
		)
	}

	setPath(target, entry.path, normalized)
	;(jobLogger || logger).debug(`Parameter diterapkan: ${entry.prefix}=${normalized} -> ${entry.path}`)
	return { key: entry.key, path: entry.path, value: normalized }
}

/**
 * buildConfigFromParams(paramString): parse + validate + normalize seluruh
 * token, kembalikan { overrides, applied } — overrides adalah object
 * ter-nested (siap di-deepMerge ke config final), applied adalah daftar
 * ringkas parameter yang berhasil diterapkan (dipakai preview/log).
 */
function buildConfigFromParams(paramString) {
	const parsedTokens = parse(paramString)
	const overrides = {}
	const applied = []
	for (const parsed of parsedTokens) {
		applied.push(applyParam(parsed, overrides))
	}
	return { overrides, applied }
}

/**
 * ============================================================
 * 6) PRESET
 * ============================================================
 * Preset HANYA berisi konfigurasi (bukan logic). Tetap di file ini
 * sesuai spesifikasi (Belum perlu database/JSON terpisah).
 */
const PRESETS = Object.freeze({
	classic: {
		font: { size: 68, minSize: 18, maxSize: 72, uppercase: true, align: 'center' },
		text: { strokeWidth: 5, maxLines: 3 },
		position: { top: { percent: 14 }, bottom: { percent: 86 } }
	},
	modern: {
		font: { size: 60, minSize: 16, maxSize: 64, uppercase: false, align: 'center' },
		text: { strokeWidth: 3, maxLines: 3, shadow: true, shadowBlur: 6, shadowOffsetX: 0, shadowOffsetY: 2 },
		position: { top: { percent: 10 }, bottom: { percent: 90 } }
	},
	anime: {
		font: { size: 64, minSize: 18, maxSize: 70, uppercase: false, align: 'center' },
		text: { strokeWidth: 4, maxLines: 4 },
		emoji: { scale: 120 },
		position: { top: { percent: 8 }, bottom: { percent: 92 } }
	},
	compact: {
		font: { size: 48, minSize: 14, maxSize: 52, uppercase: true, align: 'center' },
		text: { strokeWidth: 3, maxLines: 2 },
		position: { top: { percent: 18 }, bottom: { percent: 82 } }
	},
	outline: {
		font: { size: 68, minSize: 18, maxSize: 72, uppercase: true, align: 'center' },
		text: { strokeWidth: 9, maxLines: 3 },
		position: { top: { percent: 14 }, bottom: { percent: 86 } }
	},
	large: {
		font: { size: 80, minSize: 24, maxSize: 88, uppercase: true, align: 'center' },
		text: { strokeWidth: 6, maxLines: 2 },
		position: { top: { percent: 10 }, bottom: { percent: 90 } }
	}
})

function getPreset(name) {
	if (!name) return null
	const preset = PRESETS[String(name).toLowerCase()]
	if (!preset) {
		throw new StickerEngineError(
			'SmemeCustom',
			ERROR_CODES.INVALID_CONFIGURATION,
			`Preset tidak ditemukan: "${name}". Preset tersedia: ${Object.keys(PRESETS).join(', ')}.`
		)
	}
	return preset
}

function listPresets() {
	return Object.keys(PRESETS)
}

/**
 * ============================================================
 * 7) PREVIEW CONFIG DEFAULT
 * ============================================================
 * Disediakan sesuai spesifikasi (Part 4-5) — sistem preview belum
 * diisi asset (localPath/rawGithubUrl sengaja kosong, diisi manual
 * nanti). Preview generator sendiri (canvas drawing ruler/grid) berada
 * di Canvas Engine (membaca metadata dari sini, sesuai pembagian tugas
 * "Canvas Engine tetap hanya bertugas merender").
 */
const DEFAULT_PREVIEW_CONFIG = Object.freeze({
	enabled: true,
	showGrid: true,
	showRuler: true,
	showSafeArea: true,
	showTopLine: true,
	showBottomLine: true,
	showCenterLine: true,
	showFontPreview: true,
	showStrokePreview: true,
	showShadowPreview: true,
	background: {
		useLocal: true,
		useRemote: false,
		localPath: '',
		rawGithubUrl: '',
		cache: true,
		timeout: 10000
	}
})

/**
 * ============================================================
 * 8) SESSION RUNTIME
 * ============================================================
 * Session HANYA berlaku selama proses editor (.smemec) berjalan utk
 * satu user/job — tidak memengaruhi user lain, tidak mengubah default
 * config global. Disimpan in-memory (Map), key = sessionId (mis. jid
 * pengirim), otomatis kembali ke default setelah session berakhir
 * (endSession) atau kedaluwarsa lewat Cache Engine TTL.
 */
const NS_SESSION = 'smemeCustomSession'
cacheEngine.configureNamespace(NS_SESSION, { max: 500, ttl: 15 * 60 * 1000 })

function startSession(sessionId, overrides = {}) {
	if (!sessionId) {
		throw new StickerEngineError('SmemeCustom', ERROR_CODES.INVALID_CONFIGURATION, 'sessionId wajib diisi untuk memulai session custom.')
	}
	cacheEngine.set(NS_SESSION, sessionId, { overrides, startedAt: Date.now() })
	logger.debug(`Session custom dimulai: ${sessionId}`)
	return { sessionId, overrides }
}

function getSession(sessionId) {
	if (!sessionId) return null
	const cached = cacheEngine.get(NS_SESSION, sessionId)
	return cached.hit ? cached.value : null
}

function endSession(sessionId) {
	if (!sessionId) return false
	cacheEngine.delete(NS_SESSION, sessionId)
	logger.debug(`Session custom diakhiri: ${sessionId}`)
	return true
}

/**
 * ============================================================
 * 9) DEEP MERGE (lokal, tidak mengimpor dari config.js supaya
 * smemeCustom.js tetap satu file mandiri sesuai spesifikasi —
 * config.js sendiri juga punya deepMerge internal yang setara,
 * TIDAK ada perilaku baru yang diperkenalkan, murni util identik).
 * ============================================================
 */
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
 * ============================================================
 * 10) MERGE PRIORITAS (Public API utama)
 * ============================================================
 * default (config.js, SATU-SATUNYA source of truth default)
 *   -> preset (opsional)
 *   -> runtime/session (opsional)
 *   -> parameter command (.smemec t..|b..|..)
 *   -> config final
 *
 * Engine lain (textEngine/canvasEngine) CUKUP membaca config final ini —
 * tidak perlu (dan tidak boleh) mem-parsing ulang.
 */
function resolveConfig({ presetName, sessionId, paramString } = {}) {
	const cacheKey = `${presetName || ''}::${sessionId || ''}::${paramString || ''}`
	const cached = cacheEngine.get(NS_PARSE, cacheKey)
	if (cached.hit) return cached.value

	let finalConfig = loadConfig() // default (source of truth tunggal, TIDAK diduplikasi)
	const appliedLog = { preset: null, session: false, params: [] }

	if (presetName) {
		const preset = getPreset(presetName)
		finalConfig = deepMerge(finalConfig, preset)
		appliedLog.preset = presetName
	}

	if (sessionId) {
		const session = getSession(sessionId)
		if (session?.overrides) {
			finalConfig = deepMerge(finalConfig, session.overrides)
			appliedLog.session = true
		}
	}

	if (paramString) {
		const { overrides, applied } = buildConfigFromParams(paramString)
		finalConfig = deepMerge(finalConfig, overrides)
		appliedLog.params = applied.map((a) => `${a.key}=${a.value}`)
	}

	finalConfig.preview = deepMerge(DEFAULT_PREVIEW_CONFIG, finalConfig.preview || {})

	const result = { config: finalConfig, applied: appliedLog }
	cacheEngine.set(NS_PARSE, cacheKey, result)
	logger.debug(
		`resolveConfig() -> preset=${appliedLog.preset || '-'} session=${appliedLog.session} params=[${appliedLog.params.join(', ') || '-'}]`
	)
	return result
}

/**
 * ============================================================
 * 11) PREVIEW METADATA (bukan render — hanya metadata)
 * ============================================================
 * Menghasilkan data siap pakai Canvas Engine untuk menggambar ruler,
 * grid, safe area, garis top/bottom/center, dan contoh font/stroke/
 * shadow — SEMUA nilai dalam PERSEN (bukan pixel), sesuai spesifikasi.
 */
function buildPreviewMetadata(configFinal) {
	const preview = configFinal.preview || DEFAULT_PREVIEW_CONFIG
	if (!preview.enabled) return { enabled: false }

	const rulerMarks = []
	for (let i = 0; i <= 100; i += 5) rulerMarks.push(i)

	return {
		enabled: true,
		showGrid: !!preview.showGrid,
		showRuler: !!preview.showRuler,
		showSafeArea: !!preview.showSafeArea,
		showTopLine: !!preview.showTopLine,
		showBottomLine: !!preview.showBottomLine,
		showCenterLine: !!preview.showCenterLine,
		showFontPreview: !!preview.showFontPreview,
		showStrokePreview: !!preview.showStrokePreview,
		showShadowPreview: !!preview.showShadowPreview,
		ruler: { unit: 'percent', marks: rulerMarks, horizontal: true, vertical: true },
		lines: {
			top: { percent: configFinal.position?.top?.percent ?? 14, color: '#ff3b30', label: 'Top Position' },
			bottom: { percent: configFinal.position?.bottom?.percent ?? 86, color: '#007aff', label: 'Bottom Position' },
			center: { percent: 50, color: '#8e8e93', label: 'Center' },
			safeArea: { percent: configFinal.layout?.safeAreaPercent ?? 4, color: '#34c759', label: 'Safe Area' }
		},
		fontSample: {
			size: configFinal.font?.size ?? 68,
			minSize: configFinal.font?.minSize ?? 18,
			maxSize: configFinal.font?.maxSize ?? 72,
			align: configFinal.font?.align ?? 'center',
			uppercase: configFinal.font?.uppercase ?? true
		},
		strokeSample: { width: configFinal.text?.strokeWidth ?? 5 },
		shadowSample: {
			enabled: !!configFinal.text?.shadow,
			blur: configFinal.text?.shadowBlur ?? 0,
			offsetX: configFinal.text?.shadowOffsetX ?? 0,
			offsetY: configFinal.text?.shadowOffsetY ?? 0
		},
		background: { ...preview.background }
	}
}

/**
 * ============================================================
 * 12) PUBLIC API
 * ============================================================
 */
export const smemeCustom = {
	// Parser & config resolution (dipakai sticker.js utk .smemec)
	parse,
	buildConfigFromParams,
	resolveConfig,
	buildPreviewMetadata,

	// Preset
	getPreset,
	listPresets,

	// Session runtime (.smemec editor)
	startSession,
	getSession,
	endSession,

	// Introspeksi registry (dipakai bila perlu menampilkan bantuan parameter ke user)
	getRegistry: () => PARAMETER_REGISTRY,
	getParameterHelp: () =>
		PARAMETER_REGISTRY.map((e) => `${e.prefix} = ${e.description} (default: ${e.default})`),

	// Konstanta preview default (read-only, dipakai canvasEngine bila config.preview kosong)
	DEFAULT_PREVIEW_CONFIG
}

export default smemeCustom
