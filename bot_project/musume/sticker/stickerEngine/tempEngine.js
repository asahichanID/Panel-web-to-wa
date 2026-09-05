/**
 * ============================================================
 *  Sticker Engine V2 — Temp Engine
 * ============================================================
 *
 * Tujuan: Mengelola siklus hidup file sementara (temp file) yang
 * TIDAK BISA dihindari untuk Engine yang mewajibkan I/O disk
 * (terutama FFmpeg Engine, karena binary ffmpeg butuh path file,
 * bukan Buffer).
 *
 * Public API : create() / remove() / exists() / cleanup()
 * Return     : Temporary Resource -> { path, createdAt, remove() }
 * Performance Target : < 5 ms
 *
 * Prinsip:
 *  - Setiap resource yang dibuat WAJIB terdaftar di registry lokal
 *    supaya cleanup() global bisa menyapu file yang lolos dari
 *    pemanggil yang lupa/gagal membersihkannya sendiri (defense in
 *    depth terhadap Resource Leak).
 *  - Dependency Rule: Temp Engine tidak bergantung pada Engine lain.
 * ============================================================
 */

import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { TEMP_DIR, createLogger, StickerEngineError, ERROR_CODES } from './constants.js'

const logger = createLogger('TempEngine')

/** @type {Set<string>} — registry seluruh path temp yang masih dianggap "hidup". */
const registry = new Set()

let dirEnsured = false
function ensureDir() {
	if (dirEnsured) return
	if (!fs.existsSync(TEMP_DIR)) {
		fs.mkdirSync(TEMP_DIR, { recursive: true })
	}
	dirEnsured = true
}

function randomName(ext = 'tmp') {
	const rand = crypto.randomBytes(8).toString('hex')
	const cleanExt = String(ext || 'tmp').replace(/^\./, '')
	return `se2_${Date.now().toString(36)}_${rand}.${cleanExt}`
}

/**
 * Membuat "slot" resource sementara (belum tentu menulis apa-apa ke disk;
 * pemanggil bebas menulis sendiri ke `resource.path`).
 * @param {string} ext ekstensi file tanpa titik, mis. 'mp4', 'webp'
 */
function create(ext = 'tmp') {
	ensureDir()
	const filePath = path.join(TEMP_DIR, randomName(ext))
	registry.add(filePath)
	return {
		path: filePath,
		createdAt: Date.now(),
		async remove() {
			return remove(filePath)
		}
	}
}

/** Tulis Buffer ke temp file baru sekaligus (helper umum dipakai FFmpeg Engine). */
async function createFromBuffer(buffer, ext = 'tmp') {
	const resource = create(ext)
	await fsp.writeFile(resource.path, buffer)
	return resource
}

function exists(target) {
	const p = typeof target === 'string' ? target : target?.path
	if (!p) return false
	return fs.existsSync(p)
}

async function remove(target) {
	const p = typeof target === 'string' ? target : target?.path
	if (!p) return false
	registry.delete(p)
	try {
		if (fs.existsSync(p)) {
			await fsp.unlink(p)
		}
		return true
	} catch (err) {
		logger.warn(`gagal menghapus temp file ${p}: ${err.message}`)
		return false
	}
}

/** Versi sync untuk dipakai di blok finally yang tidak async (paritas dgn kode lama). */
function removeSync(target) {
	const p = typeof target === 'string' ? target : target?.path
	if (!p) return false
	registry.delete(p)
	try {
		if (fs.existsSync(p)) fs.unlinkSync(p)
		return true
	} catch (err) {
		logger.warn(`gagal menghapus temp file (sync) ${p}: ${err.message}`)
		return false
	}
}

/**
 * Bersihkan SELURUH resource yang masih terdaftar di registry.
 * Dipanggil oleh Cleanup Engine di akhir Pipeline (selalu berjalan,
 * baik sukses maupun gagal) supaya tidak ada temp file yang lolos.
 */
async function cleanup() {
	const targets = Array.from(registry)
	let removed = 0
	for (const p of targets) {
		const ok = await remove(p)
		if (ok) removed++
	}
	if (removed > 0) logger.debug(`cleanup: ${removed} temp file dihapus`)
	return { cleaned: removed }
}

/**
 * Sapu file basi (stale) di TEMP_DIR yang tertinggal dari proses
 * sebelumnya (mis. bot crash sebelum sempat cleanup). Aman dipanggil
 * sekali saat startup. Hanya menghapus file dengan prefix `se2_`
 * milik Sticker Engine V2 supaya tidak menyentuh temp file modul lain.
 */
async function sweepStale(maxAgeMs = 30 * 60 * 1000) {
	ensureDir()
	let removed = 0
	try {
		const files = await fsp.readdir(TEMP_DIR)
		const now = Date.now()
		for (const file of files) {
			if (!file.startsWith('se2_')) continue
			const full = path.join(TEMP_DIR, file)
			try {
				const stat = await fsp.stat(full)
				if (now - stat.mtimeMs > maxAgeMs) {
					await fsp.unlink(full)
					removed++
				}
			} catch (_) {
				// file mungkin sudah dihapus proses lain, aman diabaikan
			}
		}
	} catch (err) {
		logger.warn(`sweepStale gagal membaca ${TEMP_DIR}: ${err.message}`)
	}
	if (removed > 0) logger.info(`sweepStale: ${removed} temp file basi dihapus`)
	return { cleaned: removed }
}

function registrySize() {
	return registry.size
}

/**
 * Beberapa Engine (Metadata Engine untuk ffprobe, FFmpeg Engine untuk
 * transcode) sama-sama butuh Buffer video ditulis ke disk lebih dulu
 * (binary ffmpeg/ffprobe tidak menerima Buffer langsung). Supaya TIDAK
 * terjadi duplicate write untuk Buffer yang sama dalam satu job, path
 * temp file di-memoize langsung di object `context` milik job tsb.
 */
async function getOrCreateInputFile(context, ext = 'bin') {
	if (context._tempInputPath && exists(context._tempInputPath)) {
		return context._tempInputPath
	}
	const resource = await createFromBuffer(context.buffer, ext)
	context._tempInputPath = resource.path
	context.resource?.trackTempFile(resource.path)
	return resource.path
}

export const tempEngine = {
	create,
	createFromBuffer,
	exists,
	remove,
	removeSync,
	cleanup,
	sweepStale,
	registrySize,
	getOrCreateInputFile
}

export default tempEngine
