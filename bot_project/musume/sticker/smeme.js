/**
 * ============================================================
 *  musume/sticker/smeme.js — Sticker Engine V2 (thin wrapper)
 * ============================================================
 *
 * File ini SEKARANG hanya membungkus (delegate) ke Sticker Engine V2
 * (./sticker.js -> renderSmeme -> Media/Image/Canvas/Text/Font/Emoji
 * Engine). Implementasi lama (parsing font manual, wrap/fit manual,
 * drawStrokedLine, dst) sudah dipindah & disempurnakan di dalam
 * stickerEngine/ sesuai musume/sticker/ARCHITECTURE.md &
 * musume/sticker/ENGINE_API.md.
 *
 * KONTRAK PUBLIK TIDAK BERUBAH (demi kompatibilitas naze.js):
 *   import { smeme } from './musume/sticker/smeme.js'
 *   const pngBuffer = await smeme(imageBuffer, topText, bottomText)
 *
 * naze.js (`.smeme`/`.stickmeme`/`.stikmeme`/`.stickermeme`/`.stikermeme`)
 * memanggil fungsi ini lalu meneruskan hasilnya (PNG Buffer) ke
 * `naze.sendAsSticker()` — TIDAK ADA PERUBAHAN pada naze.js.
 * ============================================================
 */

import { renderSmeme, renderSmemeCustom } from './sticker.js'

/**
 * @param {Buffer} imageBuffer - gambar dasar (image/video/sticker hasil download quoted message)
 * @param {string} topText - teks atas (opsional)
 * @param {string} bottomText - teks bawah (opsional)
 * @returns {Promise<Buffer>} PNG Buffer siap diteruskan ke naze.sendAsSticker()
 */
export async function smeme(imageBuffer, topText = '', bottomText = '') {
	return renderSmeme(imageBuffer, topText, bottomText, {})
}

/**
 * smemec(): varian Sticker Meme CUSTOM (`.smemec`) — memakai smemeCustom.js
 * (preset/param registry/session/preview) lewat renderSmemeCustom(). Fungsi
 * smeme() di atas TIDAK disentuh — `.smeme` tetap identik seperti sebelumnya.
 *
 * @param {Buffer} imageBuffer
 * @param {string} topText
 * @param {string} bottomText
 * @param {object} customOptions - { presetName, sessionId, paramString, preview }
 * @returns {Promise<Buffer>} PNG Buffer siap diteruskan ke naze.sendAsSticker()
 */
export async function smemec(imageBuffer, topText = '', bottomText = '', customOptions = {}) {
	return renderSmemeCustom(imageBuffer, topText, bottomText, customOptions)
}

export default smeme
