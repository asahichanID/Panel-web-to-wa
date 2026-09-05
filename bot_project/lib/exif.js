/**
 * ============================================================
 *  lib/exif.js — Compatibility Layer ke Sticker Engine V2
 * ============================================================
 *
 * Implementasi lama (spawn ffmpeg manual utk static image, gif, video,
 * lalu node-webpmux lewat temp file) sudah DIMIGRASIKAN sepenuhnya ke
 * Sticker Engine V2 (musume/sticker/sticker.js + stickerEngine/*),
 * sesuai musume/sticker/ARCHITECTURE.md & musume/sticker/ENGINE_API.md:
 *   Media Engine -> Metadata Engine -> Image/Video Engine -> FFmpeg
 *   Engine (khusus animasi) -> WebP Engine -> Exif Engine -> Cleanup Engine.
 *
 * File ini sekarang murni COMPATIBILITY SHIM: 4 fungsi berikut
 * dipertahankan APA ADANYA (nama & kontrak — menerima Buffer ATAU path,
 * MENGEMBALIKAN PATH FILE webp sementara) karena `naze.sendMedia()`
 * (src/message.js) memakai `writeExif()` dan membutuhkan path file
 * (dipakai sbg `{url: path}` pada Baileys sendMessage), BUKAN Buffer.
 *
 * Untuk performa terbaik (Buffer First, TANPA temp file tambahan),
 * `naze.sendAsSticker()` (jalur utama SELURUH command sticker:
 * .sticker/.stiker/.s/.stickergif/.sgif/.stickerwm/.swm/.wm/.curi/
 * .colong/.take/.stickergifwm/.sgifwm/.smeme) memanggil LANGSUNG
 * `createSticker()` dari musume/sticker/sticker.js, TIDAK lewat file
 * ini — lihat src/message.js.
 * ============================================================
 */

import fsp from 'fs/promises'
import { createSticker } from '../musume/sticker/sticker.js'
import { tempEngine } from '../musume/sticker/stickerEngine/index.js'

/**
 * Jalankan Sticker Engine V2 penuh (Media->Metadata->Image/Video-FFmpeg->
 * WebP->Exif), lalu tulis hasil Buffer ke SATU temp file dan kembalikan
 * path-nya — mempertahankan kontrak lama demi kompatibilitas naze.sendMedia().
 */
async function toTempWebpPath(media, options = {}) {
	const buffer = await createSticker(media, options)
	const resource = tempEngine.create('webp')
	await fsp.writeFile(resource.path, buffer)
	return resource.path
}

async function gifToWebp(media) {
	return toTempWebpPath(media, {})
}

async function imageToWebp(media) {
	return toTempWebpPath(media, {})
}

async function videoToWebp(media) {
	return toTempWebpPath(media, {})
}

async function writeExif(media, data = {}) {
	return toTempWebpPath(media, data || {})
}

export { imageToWebp, videoToWebp, writeExif, gifToWebp };
