const cooldown = new Map()

export function cekCooldown(id, delay = 3000) {
	const now = Date.now()
	const last = cooldown.get(id) || 0

	if (now - last < delay) return false

	cooldown.set(id, now)

	// Auto-cleanup setelah cooldown habis agar tidak leak
	setTimeout(() => cooldown.delete(id), delay + 100)

	return true
}

export function resetCooldown(id) {
	cooldown.delete(id)
}

export function clearCooldown() {
	cooldown.clear()
}
