/**
 * ============================================================
 *  Sticker Engine V2 — Cleanup Engine
 * ============================================================
 *
 * Tujuan: Menjamin SELURUH resource yang dipakai selama satu
 * Pipeline (satu "job" pembuatan sticker) dibersihkan, apa pun
 * hasil akhirnya (sukses ataupun error) — "Cleanup selalu berjalan".
 *
 * Resource yang ditangani: Buffer, Worker, Tempfile, Timer, ChildProcess.
 *
 * Public API : cleanup(context) , createJobResource() , runMaintenance()
 * Return     : Completed -> { completed, cleaned }
 * Performance Target : < 20 ms
 *
 * Dependency: Cleanup Engine boleh memakai Temp Engine & Cache Engine
 * (keduanya leaf module, tanpa dependency balik ke Cleanup Engine)
 * sehingga tidak menimbulkan Circular Dependency.
 * ============================================================
 */

import { createLogger, PERFORMANCE_TARGET } from './constants.js'
import { tempEngine } from './tempEngine.js'
import { cacheEngine } from './cacheEngine.js'

const logger = createLogger('CleanupEngine')

/**
 * Bungkus seluruh resource yang lahir selama satu job/pipeline run.
 * Dipakai oleh sticker.js (orchestrator) dan diteruskan lewat context
 * ke tiap Engine supaya Engine bisa "mendaftarkan" resource yang ia buat.
 */
function createJobResource(jobId) {
	return {
		jobId,
		buffers: [],
		workers: [],
		tempFiles: [],
		timers: [],
		childProcesses: [],
		trackBuffer(buf) {
			if (buf) this.buffers.push(buf)
			return buf
		},
		trackWorker(worker) {
			if (worker) this.workers.push(worker)
			return worker
		},
		trackTempFile(resourceOrPath) {
			if (resourceOrPath) this.tempFiles.push(resourceOrPath)
			return resourceOrPath
		},
		trackTimer(handle) {
			if (handle) this.timers.push(handle)
			return handle
		},
		trackChildProcess(cp) {
			if (cp) this.childProcesses.push(cp)
			return cp
		}
	}
}

/**
 * Jalankan cleanup untuk satu context/job. Urutan penting:
 * timer -> childprocess -> worker -> tempfile -> buffer reference.
 * Setiap tahap dibungkus try/catch masing-masing supaya SATU
 * kegagalan (mis. worker sudah mati duluan) tidak menggagalkan
 * pembersihan resource lainnya.
 */
async function cleanup(context) {
	const start = process.hrtime.bigint()
	const resource = context?.resource
	const cleaned = { timers: 0, childProcesses: 0, workers: 0, tempFiles: 0, buffers: 0 }

	if (!resource) {
		return { completed: true, cleaned }
	}

	for (const timer of resource.timers.splice(0)) {
		try {
			clearTimeout(timer)
			clearInterval(timer)
			cleaned.timers++
		} catch (err) {
			logger.warn(`gagal clear timer: ${err.message}`)
		}
	}

	for (const cp of resource.childProcesses.splice(0)) {
		try {
			if (cp && cp.exitCode === null && !cp.killed) {
				cp.kill('SIGKILL')
			}
			cleaned.childProcesses++
		} catch (err) {
			logger.warn(`gagal mematikan child process: ${err.message}`)
		}
	}

	for (const worker of resource.workers.splice(0)) {
		try {
			if (worker && typeof worker.terminate === 'function') {
				await worker.terminate()
			}
			cleaned.workers++
		} catch (err) {
			logger.warn(`gagal terminate worker: ${err.message}`)
		}
	}

	for (const tempFile of resource.tempFiles.splice(0)) {
		try {
			const ok = await tempEngine.remove(tempFile)
			if (ok) cleaned.tempFiles++
		} catch (err) {
			logger.warn(`gagal menghapus temp file: ${err.message}`)
		}
	}

	// Buffer di JS dikelola Garbage Collector; yang bisa kita lakukan
	// adalah melepas referensi secepat mungkin supaya GC bisa bekerja
	// lebih cepat pada Buffer besar (mencegah tekanan memori menumpuk
	// selama proses bot berjalan lama / banyak sticker berurutan).
	cleaned.buffers = resource.buffers.length
	resource.buffers.length = 0

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	if (ms > PERFORMANCE_TARGET.cleanup * 3) {
		logger.warn(`cleanup job=${resource.jobId} lambat: ${ms.toFixed(2)}ms`)
	} else {
		logger.debug(`cleanup job=${resource.jobId} selesai (${ms.toFixed(2)}ms)`, cleaned)
	}

	return { completed: true, cleaned }
}

let maintenanceHandle = null

/**
 * Housekeeping periodik: sapu Cache Engine (TTL) + Temp Engine (file basi).
 * Opsional — dipanggil sekali oleh index.js/sticker.js saat modul dimuat.
 * Interval memakai unref() supaya tidak mengganjal proses Node keluar.
 */
function startMaintenance(intervalMs = 5 * 60 * 1000) {
	if (maintenanceHandle) return maintenanceHandle
	maintenanceHandle = setInterval(async () => {
		try {
			cacheEngine.cleanup()
			await tempEngine.sweepStale()
		} catch (err) {
			logger.warn(`maintenance loop gagal: ${err.message}`)
		}
	}, intervalMs)
	maintenanceHandle.unref?.()
	return maintenanceHandle
}

function stopMaintenance() {
	if (maintenanceHandle) {
		clearInterval(maintenanceHandle)
		maintenanceHandle = null
	}
}

async function runMaintenance() {
	const cacheResult = cacheEngine.cleanup()
	const tempResult = await tempEngine.sweepStale()
	return { cache: cacheResult, temp: tempResult }
}

export const cleanupEngine = {
	createJobResource,
	cleanup,
	startMaintenance,
	stopMaintenance,
	runMaintenance
}

export default cleanupEngine
