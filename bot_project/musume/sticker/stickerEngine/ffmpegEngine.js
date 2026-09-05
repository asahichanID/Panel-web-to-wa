/**
 * ============================================================
 *  Sticker Engine V2 — FFmpeg Engine (AUDIT & PERBAIKAN BUG FFMPEG_TIMEOUT)
 * ============================================================
 *
 * Tujuan: Satu-satunya tempat proses memanggil binary FFmpeg di seluruh
 * Sticker Engine — dipakai baik untuk encode Animated Sticker (WEBP) MAUPUN
 * StickerToVideo Engine (WEBP/GIF/WEBM -> MP4). Kedua use case berbagi SATU
 * mesin eksekusi (`runTaskWithRetry`) supaya tidak ada implementasi FFmpeg
 * kedua/duplicate logic — hanya profil output (codec/filter/format) yang
 * berbeda.
 *
 * ------------------------------------------------------------
 * AKAR MASALAH FFMPEG_TIMEOUT (ditemukan lewat audit, BUKAN
 * ditambal dengan menaikkan angka timeout):
 * ------------------------------------------------------------
 * 1) Filter chain lama memakai `split -> palettegen -> paletteuse`
 *    (teknik reduksi palet 256 warna khas GIF) padahal target
 *    encode adalah LIBWEBP, yang sudah mendukung RGBA penuh secara
 *    native. Dua pass analisis warna tambahan ini murni overhead
 *    komputasi (histogram warna + build palet + dither) yang TIDAK
 *    dibutuhkan sama sekali oleh libwebp, dan pada resolusi 512x512
 *    dengan banyak frame (mis. 10 detik @15fps = 150 frame) biaya
 *    komputasinya cukup besar utk mendorong durasi encode melewati
 *    20 detik pada CPU yang terbatas (VPS/Railway/Replit) — inilah
 *    penyebab UTAMA timeout, bukan proses yang "menggantung"
 *    (deadlock), melainkan pipeline yang secara struktural boros
 *    utk target codec ini.
 * 2) libwebp encoder tidak diberi parameter kecepatan eksplisit
 *    (`-compression_level`), sehingga memakai default ffmpeg yang
 *    tidak dioptimalkan utk skenario sticker (real-time, banyak
 *    request bersamaan).
 * 3) Retry lama mengulang task dengan PARAMETER IDENTIK setelah
 *    timeout. Timeout bukan kegagalan transient seperti flaky
 *    network — mengulang operasi yang sudah terbukti terlalu berat
 *    dengan parameter yang SAMA PERSIS nyaris pasti akan timeout
 *    lagi, hanya menggandakan waktu tunggu user (2x20 detik = 40
 *    detik) tanpa peluang nyata untuk berhasil.
 * 4) Timeout memakai angka tetap (20000ms) utk SEMUA kombinasi
 *    durasi/fps/ukuran, padahal beban kerja riil (jumlah frame yang
 *    diproses) bisa berbeda jauh antar request.
 *
 * ------------------------------------------------------------
 * PERBAIKAN YANG DITERAPKAN:
 * ------------------------------------------------------------
 * A) Filter chain WEBP disederhanakan (scale -> fps -> pad -> langsung
 *    encode libwebp), TANPA palettegen/paletteuse. Kualitas warna
 *    tetap penuh (RGBA) krn memang tanggung jawab native libwebp,
 *    dan encode jauh lebih cepat krn tidak ada dua pass tambahan.
 * B) `-compression_level` diset eksplisit (default cepat utk
 *    percobaan pertama, lebih cepat lagi utk percobaan retry).
 * C) Retry HANYA dilakukan dengan konfigurasi yang DIPERKECIL
 *    (resolusi & fps diturunkan, compression level dipercepat) saat
 *    kegagalan sebelumnya adalah FFMPEG_TIMEOUT — memberi peluang
 *    nyata percobaan kedua selesai dalam anggaran waktu, bukan
 *    mengulang task yang sudah terbukti gagal.
 * D) Timeout dihitung proporsional terhadap beban kerja (perkiraan
 *    jumlah frame = duration x fps), dengan batas bawah & atas yang
 *    wajar — bukan sekadar menaikkan satu angka tetap.
 * E) Child process dipastikan benar-benar berhenti: kirim SIGKILL,
 *    lalu verifikasi lewat event 'exit' dgn fallback SIGKILL kedua
 *    apabila proses belum juga berhenti dalam waktu singkat
 *    (mencegah orphan process yang membebani CPU utk request
 *    berikutnya — salah satu potensi penyebab timeout beruntun).
 * F) `-y` dipindah ke output options (posisi semantik yang benar).
 *
 * Public API : execute(task)      -> profil WEBP (animated sticker, LAMA, tidak berubah)
 *              transcode(task)    -> profil umum (dipakai StickerToVideo, BARU)
 * Return     : Video Result -> { buffer, metadata }
 * Retry      : maksimal 1 kali, dengan parameter diperkecil bila
 *              kegagalan sebelumnya adalah timeout.
 * Performance Target : 500 – 2500 ms (utk beban kerja normal, non-timeout)
 * Cleanup    : child process (kill terverifikasi), temp file.
 *
 * Dependency Rule: TIDAK memakai Canvas/Font/Emoji Engine — murni
 * wrapper di atas fluent-ffmpeg (binary ffmpeg sistem).
 * ============================================================
 */

import fsp from 'fs/promises'
import ffmpeg from 'fluent-ffmpeg'
import { StickerEngineError, ERROR_CODES, createLogger, PERFORMANCE_TARGET, STICKER_LIMITS } from './constants.js'
import { tempEngine } from './tempEngine.js'

const logger = createLogger('FFmpegEngine')

const DEFAULT_TIMEOUT_MS = 20_000
const MIN_TIMEOUT_MS = 15_000
const MAX_TIMEOUT_MS = 45_000
const MS_BUDGET_PER_FRAME = 150 // anggaran waktu per frame (heuristik, ffmpeg @512px)

const MAX_ATTEMPTS = 2 // percobaan pertama + 1 retry (retry adaptif)

// Kecepatan encode libwebp: 0 (tercepat, kompresi paling longgar) - 6 (paling
// lambat, kompresi terbaik). Percobaan pertama memprioritaskan kecepatan yang
// masih menjaga kualitas wajar; percobaan retry (setelah timeout) memakai
// level tercepat supaya benar-benar punya peluang selesai.
const COMPRESSION_LEVEL_PRIMARY = 3
const COMPRESSION_LEVEL_FALLBACK = 1

/**
 * Perkirakan anggaran timeout berdasarkan beban kerja riil (jumlah frame),
 * bukan angka tetap yang sama utk semua request.
 */
function estimateTimeout({ duration, fps }, explicitTimeoutMs) {
	if (explicitTimeoutMs) return explicitTimeoutMs
	const estimatedFrames = Math.max(1, Math.round((duration || STICKER_LIMITS.maxDurationSec) * (fps || STICKER_LIMITS.maxFps)))
	const budget = estimatedFrames * MS_BUDGET_PER_FRAME
	return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, budget))
}

/**
 * Filter chain WEBP: scale (preserve aspect) -> fps cap -> pad ke kanvas
 * persegi (alpha transparan). TIDAK ADA palettegen/paletteuse — libwebp
 * menangani warna penuh (RGBA) secara native.
 */
function buildWebpFilterChain({ size, fps }) {
	return (
		`scale='min(${size},iw)':'min(${size},ih)':force_original_aspect_ratio=decrease,` +
		`fps=${fps},` +
		`pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`
	)
}

/** Filter chain MP4: scale genap (H264 butuh dimensi kelipatan 2) preserve aspect, fps cap. */
function buildMp4FilterChain({ size, fps }) {
	return (
		`scale='min(${size},iw)':'min(${size},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,` +
		`fps=${fps},` +
		'format=yuv420p'
	)
}

const OUTPUT_PROFILES = {
	webpSticker: {
		ext: 'webp',
		format: 'webp',
		buildOutputOptions: ({ size, fps, compressionLevel }) => [
			'-y',
			'-vcodec', 'libwebp',
			'-vf', buildWebpFilterChain({ size, fps }),
			'-loop', '0',
			'-an',
			'-vsync', '0',
			'-lossless', '0',
			'-compression_level', String(compressionLevel),
			'-preset', 'default'
		]
	},
	mp4Video: {
		ext: 'mp4',
		format: 'mp4',
		buildOutputOptions: ({ size, fps, compressionLevel, hasAudio }) => [
			'-y',
			'-vcodec', 'libx264',
			'-vf', buildMp4FilterChain({ size, fps }),
			'-preset', compressionLevel <= 1 ? 'ultrafast' : 'veryfast',
			'-crf', '23',
			'-pix_fmt', 'yuv420p',
			'-movflags', '+faststart',
			...(hasAudio ? ['-acodec', 'aac', '-b:a', '128k'] : ['-an'])
		]
	}
}

/** Pastikan child process benar-benar berhenti (verifikasi, bukan fire-and-forget). */
function forceKill(command, resource) {
	const proc = command.ffmpegProc
	try {
		command.kill('SIGKILL')
	} catch (_) {
		/* proses mungkin sudah selesai/mati */
	}
	if (!proc || typeof proc.once !== 'function') return
	if (proc.exitCode !== null || proc.killed) return
	// Verifikasi singkat: bila dalam 1.5 detik proses belum juga keluar,
	// kirim SIGKILL sekali lagi (defense in depth thd orphan process).
	const verifyTimer = setTimeout(() => {
		try {
			if (proc.exitCode === null && !proc.killed) proc.kill('SIGKILL')
		} catch (_) {
			/* abaikan */
		}
	}, 1500)
	verifyTimer.unref?.()
	resource?.trackTimer(verifyTimer)
	proc.once('exit', () => clearTimeout(verifyTimer))
}

function runOnce(inputPath, outputPath, profile, params) {
	return new Promise((resolve, reject) => {
		let settled = false
		let timer = null

		const command = ffmpeg(inputPath)
		if (params.duration && params.duration > 0) command.duration(params.duration)

		command
			.outputOptions(profile.buildOutputOptions(params))
			.toFormat(profile.format)
			.on('start', (cmdLine) => {
				logger.debug(`ffmpeg start: ${cmdLine}`)
				if (params.resource && command.ffmpegProc) params.resource.trackChildProcess(command.ffmpegProc)
			})
			.on('error', (err) => {
				if (settled) return
				settled = true
				if (timer) clearTimeout(timer)
				reject(err)
			})
			.on('end', () => {
				if (settled) return
				settled = true
				if (timer) clearTimeout(timer)
				resolve()
			})
			.save(outputPath)

		timer = setTimeout(() => {
			if (settled) return
			settled = true
			forceKill(command, params.resource)
			reject(new StickerEngineError('FFmpegEngine', ERROR_CODES.FFMPEG_TIMEOUT, `FFmpeg timeout setelah ${params.timeoutMs}ms`))
		}, params.timeoutMs)
		if (params.resource) params.resource.trackTimer(timer)
	})
}

/**
 * buildRetryParams(): retry TIDAK mengulang parameter identik. Bila
 * kegagalan sebelumnya adalah timeout, konfigurasi diperkecil (resolusi &
 * fps diturunkan, compression level dipercepat) supaya percobaan kedua
 * punya peluang nyata selesai dalam anggaran waktu.
 */
function buildRetryParams(base, lastErr) {
	if (lastErr?.code !== ERROR_CODES.FFMPEG_TIMEOUT) {
		return { ...base, compressionLevel: COMPRESSION_LEVEL_FALLBACK }
	}
	const reducedSize = Math.max(256, Math.round(base.size * 0.75))
	const reducedFps = Math.max(8, Math.round(base.fps * 0.66))
	const reducedDuration = Math.max(1, Math.min(base.duration, STICKER_LIMITS.maxDurationSec * 0.7))
	return {
		...base,
		size: reducedSize,
		fps: reducedFps,
		duration: reducedDuration,
		compressionLevel: COMPRESSION_LEVEL_FALLBACK,
		timeoutMs: Math.max(base.timeoutMs, estimateTimeout({ duration: reducedDuration, fps: reducedFps }))
	}
}

/**
 * runTaskWithRetry(): mesin eksekusi BERSAMA dipakai baik oleh execute()
 * (profil webpSticker, LAMA) maupun transcode() (profil umum termasuk
 * mp4Video, BARU dipakai StickerToVideo) — satu-satunya tempat spawn
 * FFmpeg terjadi, supaya tidak ada implementasi FFmpeg kedua.
 */
async function runTaskWithRetry(task, profile) {
	const start = process.hrtime.bigint()

	if (!task || (!Buffer.isBuffer(task.input) && !task.inputPath)) {
		throw new StickerEngineError('FFmpegEngine', ERROR_CODES.INVALID_BUFFER, 'task.input (Buffer) atau task.inputPath wajib diisi.')
	}

	const baseSize = Math.min(task.size || STICKER_LIMITS.maxDimension, STICKER_LIMITS.maxDimension)
	const baseFps = Math.min(task.fps || STICKER_LIMITS.maxFps, STICKER_LIMITS.maxFps)
	const baseDuration = Math.min(task.duration || STICKER_LIMITS.maxDurationSec, STICKER_LIMITS.maxDurationSec)
	const baseTimeoutMs = estimateTimeout({ duration: baseDuration, fps: baseFps }, task.timeoutMs)

	let inputResource = null
	let inputPath = task.inputPath
	if (!inputPath) {
		inputResource = await tempEngine.createFromBuffer(task.input, task.inputExt || 'input')
		inputPath = inputResource.path
		task.resource?.trackTempFile(inputPath)
	}

	let currentParams = {
		size: baseSize,
		fps: baseFps,
		duration: baseDuration,
		timeoutMs: baseTimeoutMs,
		compressionLevel: COMPRESSION_LEVEL_PRIMARY,
		hasAudio: !!task.hasAudio,
		resource: task.resource
	}

	let lastErr = null
	let attempt = 0
	let outputResource = null

	while (attempt < MAX_ATTEMPTS) {
		attempt++
		if (attempt > 1) currentParams = buildRetryParams(currentParams, lastErr)

		// Output baru per percobaan (path unik) — mencegah percobaan kedua
		// menabrak/membaca file sisa percobaan pertama (race condition antar percobaan).
		outputResource = await tempEngine.create(profile.ext)
		task.resource?.trackTempFile(outputResource.path)

		try {
			logger.debug(
				`Percobaan ke-${attempt} (${profile.format}): size=${currentParams.size} fps=${currentParams.fps} ` +
					`duration=${currentParams.duration}s compressionLevel=${currentParams.compressionLevel} timeout=${currentParams.timeoutMs}ms`
			)
			await runOnce(inputPath, outputResource.path, profile, currentParams)
			lastErr = null
			break
		} catch (err) {
			lastErr = err
			logger.warn(`Percobaan ke-${attempt} gagal: ${err.message}`)
			await tempEngine.remove(outputResource)
			outputResource = null
		}
	}

	if (lastErr) {
		if (inputResource) await tempEngine.remove(inputResource)
		throw new StickerEngineError(
			'FFmpegEngine',
			lastErr.code === ERROR_CODES.FFMPEG_TIMEOUT ? ERROR_CODES.FFMPEG_TIMEOUT : ERROR_CODES.FFMPEG_FAILED,
			`FFmpeg gagal setelah ${attempt} percobaan: ${lastErr.message}`,
			undefined,
			lastErr
		)
	}

	let buffer
	try {
		buffer = await fsp.readFile(outputResource.path)
		if (!buffer || buffer.length === 0) {
			throw new StickerEngineError('FFmpegEngine', ERROR_CODES.FFMPEG_FAILED, 'Output FFmpeg kosong (0 byte).')
		}
	} catch (err) {
		if (err instanceof StickerEngineError) throw err
		throw new StickerEngineError('FFmpegEngine', ERROR_CODES.FFMPEG_FAILED, `Gagal membaca hasil output FFmpeg: ${err.message}`, undefined, err)
	} finally {
		if (inputResource) await tempEngine.remove(inputResource)
		await tempEngine.remove(outputResource)
	}

	const ms = Number(process.hrtime.bigint() - start) / 1_000_000
	if (ms > PERFORMANCE_TARGET.ffmpegMax) logger.warn(`${profile.format} selesai lambat: ${ms.toFixed(2)}ms`)
	else logger.debug(`${profile.format} selesai ${ms.toFixed(2)}ms (attempt=${attempt})`)

	return {
		buffer,
		metadata: {
			width: currentParams.size,
			height: currentParams.size,
			format: profile.format,
			animated: true,
			fps: currentParams.fps,
			duration: currentParams.duration
		}
	}
}

/** execute(task): profil WEBP (animated sticker) — API & perilaku TIDAK berubah dari sebelumnya. */
async function execute(task) {
	return runTaskWithRetry(task, OUTPUT_PROFILES.webpSticker)
}

/**
 * transcode(task): profil umum (saat ini: mp4Video) — dipakai StickerToVideo
 * Engine. Berbagi mesin eksekusi yang SAMA dgn execute() (runTaskWithRetry),
 * sehingga tidak ada implementasi FFmpeg kedua/duplicate logic.
 * task tambahan: { profile: 'mp4', hasAudio }
 */
async function transcode(task) {
	const profileKey = task?.profile === 'mp4' ? 'mp4Video' : null
	const profile = OUTPUT_PROFILES[profileKey]
	if (!profile) {
		throw new StickerEngineError('FFmpegEngine', ERROR_CODES.INVALID_CONFIGURATION, `Profil transcode tidak dikenal: ${task?.profile}`)
	}
	return runTaskWithRetry(task, profile)
}

export const ffmpegEngine = {
	execute,
	transcode
}

export default ffmpegEngine
