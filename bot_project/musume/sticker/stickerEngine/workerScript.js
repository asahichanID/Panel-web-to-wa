/**
 * ============================================================
 *  Sticker Engine V2 — Worker Script (dijalankan di dalam worker_threads)
 * ============================================================
 *
 * File ini BUKAN dijalankan langsung oleh kode aplikasi — hanya
 * dimuat oleh workerEngine.js lewat `new Worker(...)`. Berjalan di
 * thread terpisah, menerima task lewat postMessage, dan mengirim
 * balik hasil yang WAJIB serializable (Buffer/plain object) karena
 * object native seperti Canvas tidak bisa melewati structured clone.
 * ============================================================
 */

import { parentPort } from 'worker_threads'

if (parentPort) {
	parentPort.on('message', async (msg) => {
		const { id, type, payload } = msg || {}
		if (type === 'broadcast') return // worker stateless, tidak ada state utk disinkronkan

		try {
			let result
			switch (type) {
				case 'renderEmojiBuffer': {
					const { emojiEngine } = await import('./emojiEngine.js')
					const emojiResult = await emojiEngine.render(payload)
					// Canvas native object tidak bisa di-postMessage -> konversi ke PNG Buffer.
					result = {
						hasEmoji: emojiResult.hasEmoji,
						layers: emojiResult.layers.map((l) => ({
							char: l.char,
							size: l.size,
							buffer: l.canvas.toBuffer('image/png')
						}))
					}
					break
				}
				case 'layoutText': {
					const { textEngine } = await import('./textEngine.js')
					result = await textEngine.layout(payload)
					break
				}
				default:
					throw new Error(`Tipe task worker tidak dikenal: ${type}`)
			}
			parentPort.postMessage({ id, success: true, result })
		} catch (err) {
			parentPort.postMessage({ id, success: false, error: { message: err?.message || String(err) } })
		}
	})
}
