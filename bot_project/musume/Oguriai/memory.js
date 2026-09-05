export function getMemory(db, key) {
	db.oguriAI ??= {}

	if (!db.oguriAI[key]) {
		db.oguriAI[key] = { history: [] }
	}

	return db.oguriAI[key]
}

export function addUserMemory(db, key, text) {
	const memory = getMemory(db, key)
	memory.history.push({ role: 'user', content: text })
	if (memory.history.length > 10) memory.history.shift()
}

export function addBotMemory(db, key, text) {
	const memory = getMemory(db, key)
	memory.history.push({ role: 'assistant', content: text })
	if (memory.history.length > 10) memory.history.shift()
}

export function clearMemory(db, key) {
	if (!db.oguriAI) return
	delete db.oguriAI[key]
}

export function clearAllMemory(db) {
	db.oguriAI = {}
}
