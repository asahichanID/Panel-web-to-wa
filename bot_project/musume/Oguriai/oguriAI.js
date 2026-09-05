import { oguriPrompt } from './prompt.js'
import { oguriTrigger } from './trigger.js'
import { chatOguri } from './api.js'
import { cekCooldown } from './cd.js'
import {
	buildKey,
	cleanMessage,
	shouldIgnore,
	sendTyping,
	randomDelay,
	sleep,
	formatHistory
} from './helperai.js'
import {
	getMemory,
	addUserMemory,
	addBotMemory,
	clearMemory
} from './memory.js'

export async function oguriAI(naze, m, db) {
	try {
	
		// 1. Harus grup
		if (!m.isGroup) return

		// 2. Cek fitur aktif di grup ini
		const groupData = db.groups?.[m.chat]
		if (!groupData?.oguriAI?.enable) return
        console.log(groupData)
        
		// 3. Filter pesan yang tidak perlu diproses
		if (shouldIgnore(m)) return
        console.log("2. Ignore OK")
        
		// 4. Cek apakah ada trigger atau reply ke pesan bot
		const text = (typeof m.text === 'string' ? m.text : m.body || '').trim()
		const textLower = text.toLowerCase()

		const isReplyToBot = m.quoted?.fromMe === true
		const hasTrigger = oguriTrigger.some(t => {
			// exact match atau diawali trigger + spasi
			return textLower === t || textLower.startsWith(t + ' ')
		})
		console.log({
            text,
            hasTrigger,
            isReplyToBot
        })

		if (!hasTrigger && !isReplyToBot) return
        console.log("3. Trigger OK")
        
		// 5. Jangan proses jika ini adalah command bot
		const listprefix = global.listprefix || ['.', '!', '+']
		if (listprefix.some(p => text.startsWith(p))) return

		// 6. Cooldown per user per grup (5 detik)
		const cooldownKey = `${m.chat}:${m.sender}`
		if (!cekCooldown(cooldownKey, 5000)) return
        console.log("4. Cooldown OK")
        
		// 7. Build key memory (isolasi per grup + per user)
		const memKey = buildKey(m.chat, m.sender)

		// 8. Ambil memory
		const memory = getMemory(db, memKey)

		// 9. Bersihkan teks dari trigger prefix
		const cleanText = isReplyToBot && !hasTrigger
			? text
			: cleanMessage(text)

		// 10. Jika teks kosong setelah dibersihkan, skip
		if (!cleanText) return

		// 11. Simpan pesan user ke history
		addUserMemory(db, memKey, cleanText)

		// 12. Format history + system prompt untuk dikirim ke API
		const messages = formatHistory(memory.history, oguriPrompt)

		// 13. Kirim typing indicator
		await sendTyping(naze, m.chat)

		// 14. Delay natural agar tidak terasa robot
		await sleep(randomDelay(1000, 2200))

		// 15. Request ke API (dengan fallback otomatis)
		console.log("5. API...")
		const reply = await chatOguri(messages)
        console.log("6. Reply:", reply)
        
		// 16. Simpan balasan bot ke history
		addBotMemory(db, memKey, reply)

		// 17. Kirim balasan ke grup
		await m.reply(reply)

	} catch (e) {
		console.error('[OguriAI] Error:', e.message || e)
		// Tidak balas error ke user agar tidak spam
	}
}

// Export clearMemory untuk dipakai command .oguriAI clearmemory
export { clearMemory }
