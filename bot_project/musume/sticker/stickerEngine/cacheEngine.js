/**
 * ============================================================
 *  Sticker Engine V2 — Cache Engine
 * ============================================================
 *
 * Tujuan (ARCHITECTURE.md / ENGINE_API.md):
 *   Mengelola seluruh Cache Sticker Engine: Font Cache, Metadata
 *   Cache, Measure Cache, Fit Font Cache, Render Cache, Emoji
 *   Cache, Image Cache, dan WebP Cache — masing-masing sebagai
 *   "namespace" independen dengan batas ukuran (LRU) dan TTL.
 *
 * Public API : get(namespace,key) / set(namespace,key,value,opts) /
 *              delete(namespace,key) / clear(namespace?) /
 *              cleanup(namespace?)
 * Return     : Cache Entry -> { hit, value, key, namespace }
 * Worker     : Tidak.
 * Cleanup    : Ya (TTL sweep, manual clear, shutdown saat proses berhenti).
 * Performance Target : < 1 ms per operasi.
 *
 * Dependency Rule: Cache Engine TIDAK bergantung pada Engine lain
 * (leaf module) — mencegah Circular Dependency dengan Engine manapun
 * yang memakainya (Font/Text/Metadata/Emoji/Image/WebP Engine, dst).
 * ============================================================
 */

import { createLogger, ERROR_CODES, StickerEngineError, PERFORMANCE_TARGET } from './constants.js'

const logger = createLogger('CacheEngine')

const DEFAULT_MAX = 100
const DEFAULT_TTL = 0 // 0 = tidak pernah kedaluwarsa otomatis (dikontrol lewat clear/cleanup manual)

/**
 * Bounded LRU+TTL store untuk satu namespace.
 * Implementasi LRU sederhana memakai Map (insertion order dipakai
 * ulang sebagai recency order): setiap `get` yang hit akan
 * re-insert key ke posisi paling akhir (most recently used).
 */
class BoundedStore {
	constructor(name, { max = DEFAULT_MAX, ttl = DEFAULT_TTL } = {}) {
		this.name = name
		this.max = max > 0 ? max : DEFAULT_MAX
		this.ttl = ttl >= 0 ? ttl : DEFAULT_TTL
		/** @type {Map<string, {value:any, expireAt:number, size:number}>} */
		this.store = new Map()
		this.hits = 0
		this.misses = 0
	}

	_isExpired(entry) {
		return entry.expireAt > 0 && entry.expireAt <= Date.now()
	}

	get(key) {
		const entry = this.store.get(key)
		if (!entry) {
			this.misses++
			return { hit: false, value: undefined }
		}
		if (this._isExpired(entry)) {
			this.store.delete(key)
			this.misses++
			return { hit: false, value: undefined }
		}
		// Re-insert supaya jadi "most recently used" (LRU).
		this.store.delete(key)
		this.store.set(key, entry)
		this.hits++
		return { hit: true, value: entry.value }
	}

	set(key, value, ttlOverride) {
		const ttl = typeof ttlOverride === 'number' ? ttlOverride : this.ttl
		const expireAt = ttl > 0 ? Date.now() + ttl : 0
		if (this.store.has(key)) this.store.delete(key)
		this.store.set(key, { value, expireAt })
		// Evict entry paling lama (least recently used) apabila melebihi batas.
		while (this.store.size > this.max) {
			const oldestKey = this.store.keys().next().value
			this.store.delete(oldestKey)
		}
		return true
	}

	delete(key) {
		return this.store.delete(key)
	}

	clear() {
		this.store.clear()
	}

	/** Sapu (sweep) entry yang sudah lewat TTL. Dipanggil berkala oleh Cleanup Engine. */
	cleanup() {
		let removed = 0
		for (const [key, entry] of this.store) {
			if (this._isExpired(entry)) {
				this.store.delete(key)
				removed++
			}
		}
		return removed
	}

	stats() {
		return {
			namespace: this.name,
			size: this.store.size,
			max: this.max,
			ttl: this.ttl,
			hits: this.hits,
			misses: this.misses
		}
	}
}

/**
 * Preset default per-namespace, selaras dengan daftar Cache pada
 * ARCHITECTURE.md (Font/Metadata/Measure/FitFont/Render/Emoji/Image/WebP).
 * Engine tetap boleh memanggil configureNamespace() untuk override.
 */
const NAMESPACE_PRESETS = {
	font: { max: 50, ttl: 0 }, // font jarang berubah, tidak perlu TTL
	metadata: { max: 200, ttl: 5 * 60 * 1000 },
	measure: { max: 500, ttl: 5 * 60 * 1000 },
	fitFont: { max: 500, ttl: 5 * 60 * 1000 },
	render: { max: 50, ttl: 60 * 1000 },
	emoji: { max: 300, ttl: 10 * 60 * 1000 },
	image: { max: 50, ttl: 60 * 1000 },
	webp: { max: 50, ttl: 60 * 1000 }
}

/** @type {Map<string, BoundedStore>} */
const namespaces = new Map()

function getStore(namespace) {
	if (!namespace || typeof namespace !== 'string') {
		throw new StickerEngineError('CacheEngine', ERROR_CODES.INVALID_KEY, 'Nama namespace cache tidak valid')
	}
	let store = namespaces.get(namespace)
	if (!store) {
		const preset = NAMESPACE_PRESETS[namespace] || {}
		store = new BoundedStore(namespace, preset)
		namespaces.set(namespace, store)
	}
	return store
}

/** Izinkan Engine mengatur ulang batas cache miliknya sendiri sebelum dipakai. */
function configureNamespace(namespace, opts = {}) {
	const store = new BoundedStore(namespace, { ...(NAMESPACE_PRESETS[namespace] || {}), ...opts })
	namespaces.set(namespace, store)
	return store.stats()
}

function get(namespace, key) {
	const start = process.hrtime.bigint()
	const store = getStore(namespace)
	const result = store.get(String(key))
	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	if (ms > PERFORMANCE_TARGET.cache * 5) {
		logger.warn(`get('${namespace}') lambat: ${ms.toFixed(2)}ms`)
	}
	return { namespace, key, hit: result.hit, value: result.value }
}

function set(namespace, key, value, opts = {}) {
	const store = getStore(namespace)
	store.set(String(key), value, opts.ttl)
	return { namespace, key, hit: true, value }
}

function del(namespace, key) {
	const store = getStore(namespace)
	return store.delete(String(key))
}

/** clear(): tanpa argumen -> bersihkan SEMUA namespace. Dengan argumen -> satu namespace saja. */
function clear(namespace) {
	if (!namespace) {
		for (const store of namespaces.values()) store.clear()
		return true
	}
	const store = namespaces.get(namespace)
	if (store) store.clear()
	return true
}

/** cleanup(): sapu entry kedaluwarsa. Tanpa argumen -> semua namespace. */
function cleanup(namespace) {
	let removed = 0
	if (!namespace) {
		for (const store of namespaces.values()) removed += store.cleanup()
	} else {
		const store = namespaces.get(namespace)
		if (store) removed += store.cleanup()
	}
	if (removed > 0) logger.debug(`cleanup: ${removed} entry kedaluwarsa dihapus`)
	return { cleaned: removed }
}

function stats(namespace) {
	if (namespace) {
		const store = namespaces.get(namespace)
		return store ? store.stats() : null
	}
	const all = {}
	for (const [name, store] of namespaces) all[name] = store.stats()
	return all
}

/** Dipanggil oleh Cleanup Engine saat proses shutdown / lifecycle akhir. */
function shutdown() {
	for (const store of namespaces.values()) store.clear()
	namespaces.clear()
	logger.debug('shutdown: seluruh cache dikosongkan')
}

/**
 * Helper tingkat tinggi: ambil dari cache, kalau miss hitung via
 * `factory()` lalu simpan. Mengurangi duplicate processing di
 * pemanggil (Text/Font/Metadata/Image/Emoji/WebP Engine).
 */
async function getOrCompute(namespace, key, factory, opts = {}) {
	const cached = get(namespace, key)
	if (cached.hit) return cached.value
	const value = await factory()
	set(namespace, key, value, opts)
	return value
}

export const cacheEngine = {
	get,
	set,
	delete: del,
	clear,
	cleanup,
	stats,
	shutdown,
	configureNamespace,
	getOrCompute
}

export default cacheEngine
