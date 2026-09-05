/**
 * ============================================================
 *  Sticker Engine V2 — stickerEngine/index.js (Registry)
 * ============================================================
 *
 * Titik ekspor tunggal seluruh Engine. sticker.js (orchestrator,
 * satu level di atas folder ini) HANYA boleh mengimpor Engine
 * lewat file ini, supaya seluruh dependency graph Engine tetap
 * terlihat jelas dari satu tempat (memudahkan audit Circular
 * Dependency di masa depan).
 * ============================================================
 */

import { mediaEngine } from './mediaEngine.js'
import { metadataEngine } from './metadataEngine.js'
import { imageEngine } from './imageEngine.js'
import { videoEngine } from './videoEngine.js'
import { canvasEngine } from './canvasEngine.js'
import { textEngine } from './textEngine.js'
import { fontEngine } from './fontEngine.js'
import { emojiEngine } from './emojiEngine.js'
import { cacheEngine } from './cacheEngine.js'
import { webpEngine } from './webpEngine.js'
import { exifEngine } from './exifEngine.js'
import { ffmpegEngine } from './ffmpegEngine.js'
import { workerEngine } from './workerEngine.js'
import { tempEngine } from './tempEngine.js'
import { cleanupEngine } from './cleanupEngine.js'
import { stickerToVideo } from './stickerToVideo.js'
import { smemeCustom } from './smemeCustom.js'
import { loadConfig, reloadConfig } from './config.js'
import { ENGINE_VERSION, createLogger } from './constants.js'

const logger = createLogger('Registry')

export {
	mediaEngine,
	metadataEngine,
	imageEngine,
	videoEngine,
	canvasEngine,
	textEngine,
	fontEngine,
	emojiEngine,
	cacheEngine,
	webpEngine,
	exifEngine,
	ffmpegEngine,
	workerEngine,
	tempEngine,
	cleanupEngine,
	stickerToVideo,
	smemeCustom,
	loadConfig,
	reloadConfig,
	ENGINE_VERSION
}

let initialized = false

/**
 * initializeEngines(): dipanggil sekali saat modul Sticker Engine V2
 * pertama kali dimuat (lewat sticker.js). Melakukan housekeeping ringan:
 * sapu temp file basi peninggalan proses sebelumnya (mis. bot crash),
 * dan menyalakan maintenance loop periodik (cache TTL sweep). Aman
 * dipanggil berkali-kali (idempotent).
 */
function initializeEngines() {
	if (initialized) return
	initialized = true
	tempEngine.sweepStale().catch((err) => logger.warn(`sweepStale awal gagal: ${err.message}`))
	cleanupEngine.startMaintenance()
	logger.info(`Sticker Engine V2 (${ENGINE_VERSION}) siap.`)
}

export { initializeEngines }

export default {
	mediaEngine,
	metadataEngine,
	imageEngine,
	videoEngine,
	canvasEngine,
	textEngine,
	fontEngine,
	emojiEngine,
	cacheEngine,
	webpEngine,
	exifEngine,
	ffmpegEngine,
	workerEngine,
	tempEngine,
	cleanupEngine,
	stickerToVideo,
	smemeCustom,
	loadConfig,
	reloadConfig,
	initializeEngines,
	ENGINE_VERSION
}
