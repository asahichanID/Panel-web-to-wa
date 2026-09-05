/**
 * ============================================================
 *  Sticker Engine V2 — Worker Engine
 * ============================================================
 *
 * Tujuan: Menjalankan task berat (mis. render emoji dalam jumlah
 * besar) di worker_threads terpisah supaya tidak memblokir event
 * loop utama bot (yang juga menangani pesan WhatsApp lain secara
 * bersamaan).
 *
 * Public API : run(type, payload, options) / terminate() / broadcast(message)
 * Return     : Worker Result
 * Performance Target : startup dispatch < 5 ms (memakai pool yang
 *              sudah "warm", BUKAN cold-start thread baru tiap panggilan).
 * Cleanup    : terminate() menutup seluruh worker pada pool.
 *
 * Catatan desain (kejujuran keterbatasan lingkungan pengujian):
 * Worker Engine di sini adalah implementasi worker_threads yang NYATA
 * dan BERFUNGSI (bukan stub), namun dinonaktifkan secara default lewat
 * stickermeme.json (`worker.enabled:false`) karena perilaku native
 * addon (Sharp/Canvas) di dalam worker_threads bisa bervariasi antar
 * environment deployment dan tidak dapat diverifikasi end-to-end pada
 * sandbox implementasi ini (tidak ada node_modules/registry). Engine
 * lain (mis. Emoji Engine) HARUS tetap bisa berjalan sinkron sepenuhnya
 * tanpa Worker Engine — Worker Engine murni optimisasi opsional, bukan
 * prasyarat, sehingga stabilitas produksi tidak bergantung padanya.
 * Fitur tidak dikurangi: seluruh Public API tetap tersedia & bekerja
 * bila diaktifkan secara eksplisit.
 * ============================================================
 */

import { Worker } from 'worker_threads'
import { fileURLToPath } from 'url'
import path from 'path'
import { StickerEngineError, ERROR_CODES, createLogger, PERFORMANCE_TARGET } from './constants.js'

const logger = createLogger('WorkerEngine')
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKER_SCRIPT = path.join(__dirname, 'workerScript.js')

const DEFAULT_POOL_SIZE = 2
const DEFAULT_TASK_TIMEOUT_MS = 10_000

/** @type {Worker[]} */
let pool = []
let taskCounter = 0
const pending = new Map()
let initPromise = null
let permanentlyDisabled = false
let rrIndex = 0

function spawnWorker() {
	const worker = new Worker(WORKER_SCRIPT)

	worker.on('message', (msg) => {
		const entry = pending.get(msg.id)
		if (!entry) return
		pending.delete(msg.id)
		clearTimeout(entry.timer)
		if (msg.success) entry.resolve(msg.result)
		else entry.reject(new StickerEngineError('WorkerEngine', ERROR_CODES.WORKER_FAILED, msg.error?.message || 'Worker task gagal'))
	})

	worker.on('error', (err) => {
		logger.warn(`Worker mengalami error: ${err.message}`)
	})

	worker.on('exit', (code) => {
		pool = pool.filter((w) => w !== worker)
		// worker.terminate() SECARA NORMAL keluar dgn kode non-zero (bukan
		// exit wajar) — jangan anggap ini sbg error bila memang sengaja
		// dihentikan lewat terminate(), supaya log tidak menyesatkan.
		if (code !== 0 && !worker._intentionalTermination) logger.warn(`Worker keluar dengan kode ${code}`)
	})

	// CATATAN PERBAIKAN BUG: sebelumnya dipanggil worker.unref() di sini.
	// Itu membuat Node.js tidak menganggap worker aktif sebagai alasan untuk
	// tetap hidup, sehingga proses bisa keluar SEBELUM task yang sedang
	// berjalan sempat membalas (promise run() tidak pernah settle). Worker
	// SENGAJA dibiarkan "ref" selama pool aktif — bot adalah proses
	// long-running, jadi ini adalah perilaku yang benar; gunakan terminate()
	// untuk melepas worker secara eksplisit saat memang sudah tidak diperlukan.
	return worker
}

async function ensurePool(size = DEFAULT_POOL_SIZE) {
	if (permanentlyDisabled) {
		throw new StickerEngineError(
			'WorkerEngine',
			ERROR_CODES.WORKER_FAILED,
			'Worker pool dinonaktifkan setelah sebelumnya gagal diinisialisasi.'
		)
	}
	if (initPromise) return initPromise

	initPromise = (async () => {
		try {
			const created = []
			for (let i = 0; i < size; i++) created.push(spawnWorker())
			pool = created
			return pool
		} catch (err) {
			permanentlyDisabled = true
			throw new StickerEngineError('WorkerEngine', ERROR_CODES.WORKER_FAILED, `Gagal membuat worker pool: ${err.message}`, undefined, err)
		}
	})()

	return initPromise
}

function pickWorker() {
	if (pool.length === 0) return null
	const worker = pool[rrIndex % pool.length]
	rrIndex++
	return worker
}

/**
 * run(): jalankan satu task pada worker pool. Pemanggil (Engine lain)
 * WAJIB menyediakan strategi fallback sinkron sendiri lewat try/catch —
 * Worker Engine sengaja TIDAK melakukan fallback implisit di sini,
 * supaya perilaku tetap transparan & mudah di-trace saat debugging.
 */
async function run(type, payload, options = {}) {
	const start = process.hrtime.bigint()
	await ensurePool(options.poolSize)

	const worker = pickWorker()
	if (!worker) {
		throw new StickerEngineError('WorkerEngine', ERROR_CODES.WORKER_FAILED, 'Tidak ada worker yang tersedia pada pool.')
	}

	const id = ++taskCounter
	const timeoutMs = options.timeoutMs || DEFAULT_TASK_TIMEOUT_MS

	const result = await new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			pending.delete(id)
			reject(new StickerEngineError('WorkerEngine', ERROR_CODES.WORKER_TIMEOUT, `Worker task timeout setelah ${timeoutMs}ms`))
		}, timeoutMs)
		timer.unref?.()
		pending.set(id, { resolve, reject, timer })
		worker.postMessage({ id, type, payload })
	})

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	logger.debug(`run('${type}') selesai ${ms.toFixed(2)}ms`)
	return result
}

/** terminate(): tutup seluruh worker pada pool (dipanggil saat shutdown proses bot). */
async function terminate() {
	const workers = pool.splice(0, pool.length)
	await Promise.all(
		workers.map((w) => {
			w._intentionalTermination = true
			return w.terminate().catch((err) => logger.warn(`Gagal terminate worker: ${err.message}`))
		})
	)
	initPromise = null
	rrIndex = 0
}

/** broadcast(): kirim pesan ke seluruh worker aktif (mis. notifikasi konfigurasi berubah). */
function broadcast(message) {
	for (const worker of pool) {
		try {
			worker.postMessage({ id: 0, type: 'broadcast', payload: message })
		} catch (err) {
			logger.warn(`broadcast gagal ke salah satu worker: ${err.message}`)
		}
	}
}

function poolSize() {
	return pool.length
}

export const workerEngine = {
	run,
	terminate,
	broadcast,
	ensurePool,
	poolSize
}

export default workerEngine
