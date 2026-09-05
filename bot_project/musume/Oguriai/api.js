/**
 * musume/Oguriai/api.js
 * -----------------------------------------------------------------------
 * MIGRASI KE apiGlobal.
 *
 * Implementasi asli (3 endpoint Naze dicoba berurutan: /ai/chat ->
 * /ai/message -> /ai/llama) sekarang sepenuhnya ditangani oleh
 * apiGlobal/services/ai/ai.js (fungsi apiOguriChat). File ini hanya
 * menjadi pembungkus tipis supaya `oguriAI.js` (pemanggil satu-satunya
 * fungsi ini) TIDAK PERLU diubah sama sekali — signature & bentuk
 * kembalian (string) dipertahankan persis seperti sebelumnya.
 */

import { apiOguriChat } from '../../apiGlobal/index.js'

export async function chatOguri(messages) {
	const { result } = await apiOguriChat(messages)
	return result
}
