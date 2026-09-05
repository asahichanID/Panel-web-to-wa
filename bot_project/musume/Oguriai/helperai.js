// helperai.js

export function buildKey(chat, sender) {
	return `${chat}:${sender}`
}

export function cleanMessage(text = '') {
	return text
		.replace(/^oguri[\s,.:!?-]*/i, '')
		.replace(/^(hai|halo|hei|oi)\s+oguri[\s,.:!?-]*/i, '')
		.trim()
}

export function randomDelay(min = 1200, max = 2500) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export function shouldIgnore(m) {
console.log({
    fromMe: m.fromMe,
    isBaileys: m.isBaileys,
    sender: m.sender
})
	if (!m?.body && !m?.text) return true
	if (m.isBaileys) return true
	if (m.fromMe) return true

	if (
	m.type !== 'conversation' &&
	m.type !== 'extendedTextMessage'
	) return true
}

export async function sendTyping(naze, chat) {
	try {
		await naze.sendPresenceUpdate('composing', chat)
	} catch {
		// ignore — tidak kritis jika presence gagal
	}
}

export function formatHistory(history = [], prompt = '') {
	return [
		{ role: 'system', content: prompt },
		...history
	]
}
