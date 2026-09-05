// ===============================================
// 🛠 TRACEN SHOP HELPER
// ===============================================
//
// Utility Center seluruh sistem Shop Tracen.
// Banner.js, Limited.js, Exchange.js, Recruit,
// MyUma, Race, maupun fitur Shop lainnya
// wajib menggunakan helper ini.
//
// File ini TIDAK mengatur:
// • Banner Logic
// • Exchange Logic
// • Limited Logic
// • Character Database
//
// File ini HANYA menyediakan utility bersama.

import { allCharacters, getCharacterById } from './karakterHelper.js'
import { getActiveLimitedIcon } from './limited.js'

// ===============================================
// 🎲 RANDOM SYSTEM
// ===============================================

export const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

export const pickRandom = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

export const randomChance = (chance) => Math.random() < chance

export const weightedRandom = (items, weights) => {
  if (!items?.length || !weights?.length) return null
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return items[i]
  }
  return items[items.length - 1]
}

// ===============================================
// 🎯 CHANCE SYSTEM
// ===============================================

export const BASE_RATES = {
  rare: 0.60,
  epic: 0.35,
  legend: 0.05
}

export const SOFT_PITY_BONUS = 0.06

export const calcLegendRate = (pityCount, softPity, hardPity, baseRate) => {
  if (pityCount >= hardPity) return 1.0
  const bonus = Math.max(0, pityCount - softPity) * SOFT_PITY_BONUS
  return Math.min(1.0, baseRate + bonus)
}

export const rollRarity = (pityCount, softPity = 60, hardPity = 90, legendRate = 0.05) => {
  const legendChance = calcLegendRate(pityCount, softPity, hardPity, legendRate)
  if (Math.random() < legendChance) return 'legend'
  // Epic ~36.8% dari sisa peluang (0.35 / 0.95 ≈ 0.368)
  if (Math.random() < 0.368) return 'epic'
  return 'rare'
}

export const rollCharacter = (pool, rateUpCharacters = [], rateUpBonus = 0.5) => {
  if (!pool?.length) return null
  if (rateUpCharacters.length && Math.random() < rateUpBonus) {
    const rateUpPool = pool.filter(c => rateUpCharacters.includes(c.id))
    if (rateUpPool.length) return pickRandom(rateUpPool)
  }
  const offPool = pool.filter(c => !rateUpCharacters.includes(c.id))
  return pickRandom(offPool.length ? offPool : pool)
}

// ===============================================
// 💰 CARATS SYSTEM
// ===============================================

export const hasEnoughCarats = (user, amount) =>
  (user?.money ?? 0) >= amount

export const spendCarats = (user, amount) => {
  if (!hasEnoughCarats(user, amount)) return false
  user.money -= amount
  return true
}

export const addCarats = (user, amount) => {
  if (!user) return false
  user.money = (user.money ?? 0) + amount
  return true
}

export const formatCarats = (amount) =>
  (amount ?? 0).toLocaleString('id-ID')

// ===============================================
// 🏅 MEDAL SYSTEM
// ===============================================

const ensureMedal = (user) => { if (user.medal == null) user.medal = 0 }

export const addMedal = (user, amount) => {
  ensureMedal(user)
  user.medal += amount
}

export const spendMedal = (user, amount) => {
  ensureMedal(user)
  if (user.medal < amount) return false
  user.medal -= amount
  return true
}

export const hasEnoughMedal = (user, amount) => {
  ensureMedal(user)
  return user.medal >= amount
}

export const formatMedal = (amount) =>
  (amount ?? 0).toLocaleString('id-ID')

// ===============================================
// 🎫 TICKET SYSTEM
// ===============================================

const ensureTicket = (user) => {
  if (!user.tickets) user.tickets = {}
  if (user.tickets.banner == null) user.tickets.banner = 0
  if (user.tickets.limited == null) user.tickets.limited = 0
}

export const addTicket = (user, type = 'banner', amount = 1) => {
  ensureTicket(user)
  user.tickets[type] = (user.tickets[type] ?? 0) + amount
}

export const spendTicket = (user, type = 'banner', amount = 1) => {
  ensureTicket(user)
  if ((user.tickets[type] ?? 0) < amount) return false
  user.tickets[type] -= amount
  return true
}

export const getTicketCount = (user, type = 'banner') => {
  ensureTicket(user)
  return user.tickets[type] ?? 0
}

// ===============================================
// 📦 INVENTORY SYSTEM
// ===============================================

const ensureInventory = (user) => {
  if (!user.inventory) user.inventory = []
}

export const addCharacterToInventory = (user, character, source = 'banner') => {
  ensureInventory(user)
  const existing = user.inventory.find(c => c.id === character.id)
  if (existing) {
    existing.copies = (existing.copies ?? 1) + 1
    return { isDuplicate: true, copies: existing.copies }
  }
  user.inventory.push({
    id: character.id,
    name: character.name,
    rarity: character.rarity,
    copies: 1,
    obtainedAt: Date.now(),
    obtainedFrom: source
  })
  return { isDuplicate: false, copies: 1 }
}

export const hasCharacter = (user, characterId) => {
  ensureInventory(user)
  return user.inventory.some(c => c.id === characterId)
}

export const inventoryCount = (user) => {
  ensureInventory(user)
  return user.inventory.length
}

export const findInInventory = (user, characterId) => {
  ensureInventory(user)
  return user.inventory.find(c => c.id === characterId) ?? null
}

export const searchCharacter = (query) => {
  if (!query) return []
  const lower = query.toLowerCase().trim()
  return allCharacters.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.id.toLowerCase().includes(lower)
  )
}

// ===============================================
// 📊 STATISTIC SYSTEM
// ===============================================

export const ensureBannerStat = (user, bannerType = 'permanent') => {
  if (!user.bannerStats) user.bannerStats = {}
  if (!user.bannerStats[bannerType]) {
    user.bannerStats[bannerType] = {
      totalPull: 0,
      totalRare: 0,
      totalEpic: 0,
      totalLegend: 0,
      totalLimited: 0,
      totalDuplicate: 0,
      totalMedal: 0,
      totalCaratsSpent: 0
    }
  }
  return user.bannerStats[bannerType]
}

export const recordPullStat = (user, rarity, isDuplicate, medalGained, caratSpent, bannerType = 'permanent') => {
  const stat = ensureBannerStat(user, bannerType)
  stat.totalPull++
  stat.totalCaratsSpent = (stat.totalCaratsSpent ?? 0) + (caratSpent ?? 0)
  if (rarity === 'rare') stat.totalRare++
  else if (rarity === 'epic') stat.totalEpic++
  else if (rarity === 'legend') stat.totalLegend++
  else if (rarity === 'limited') stat.totalLimited++
  if (isDuplicate) stat.totalDuplicate++
  if (medalGained) stat.totalMedal += medalGained
}

export const formatStat = (stat) => {
  if (!stat) return '─ Belum ada data ─'
  return [
    `📊 Total Pull    : ${stat.totalPull ?? 0}`,
    `🔵 Rare          : ${stat.totalRare ?? 0}`,
    `🟣 Epic          : ${stat.totalEpic ?? 0}`,
    `🟡 Legend        : ${stat.totalLegend ?? 0}`,
    `🌸 Limited       : ${stat.totalLimited ?? 0}`,
    `📦 Duplikat      : ${stat.totalDuplicate ?? 0}`,
    `🏅 Medal didapat : ${stat.totalMedal ?? 0}`,
    `💰 Carats terpakai: ${formatCarats(stat.totalCaratsSpent ?? 0)}`
  ].join('\n')
}

// ===============================================
// 📜 HISTORY SYSTEM
// ===============================================

export const ensureBannerHistory = (user, bannerType = 'permanent') => {
  if (!user.bannerHistory) user.bannerHistory = {}
  if (!user.bannerHistory[bannerType]) user.bannerHistory[bannerType] = []
  return user.bannerHistory[bannerType]
}

export const recordPullHistory = (user, character, rarity, isDuplicate, bannerType = 'permanent') => {
  const history = ensureBannerHistory(user, bannerType)
  history.unshift({
    id: character.id,
    name: character.name,
    rarity,
    isDuplicate,
    time: Date.now()
  })
  if (history.length > 50) history.splice(50)
}

export const formatHistory = (user, bannerType = 'permanent', limit = 10) => {
  const history = ensureBannerHistory(user, bannerType)
  if (!history.length) return '─ Belum ada riwayat ─'
  return history
    .slice(0, limit)
    .map((h, i) => {
      const dup = h.isDuplicate ? ' ✨dup' : ''
      const t = new Date(h.time).toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit'
      })
      return `${i + 1}. ${getRarityIcon(getCharacterById(h.id))} ${h.name}${dup} — ${t}`
    })
    .join('\n')
}
// ===============================================
// ⏳ COOLDOWN SYSTEM
// ===============================================

const cooldownStore = {}
const cooldownWarn = {}

export const checkCooldown = (key, durationMs) => {
  const now = Date.now()
  const last = cooldownStore[key] ?? 0
  const sisa = durationMs - (now - last)
  if (sisa > 0) {
    const warned = !!cooldownWarn[key]
    if (!warned) cooldownWarn[key] = true
    return { ok: false, sisa, warned }
  }
  cooldownStore[key] = now
  delete cooldownWarn[key]
  return { ok: true, sisa: 0 }
}

export const resetCooldown = (key) => {
  delete cooldownStore[key]
  delete cooldownWarn[key]
}

export const formatCooldown = (ms) => {
  if (ms <= 0) return '0s'
  const menit = Math.floor(ms / 60000)
  const detik = Math.floor((ms % 60000) / 1000)
  if (menit > 0) return `${menit}m ${detik}s`
  return `${detik}s`
}

// ===============================================
// 🏆 PITY SYSTEM
// ===============================================

export const ensurePity = (user, bannerType = 'permanent') => {
  if (!user.pity) user.pity = {}
  if (!user.pity[bannerType]) user.pity[bannerType] = { count: 0, lastLegend: 0 }
  return user.pity[bannerType]
}

export const incrementPity = (user, bannerType = 'permanent') => {
  const p = ensurePity(user, bannerType)
  p.count++
  return p.count
}

export const resetPity = (user, bannerType = 'permanent') => {
  const p = ensurePity(user, bannerType)
  p.lastLegend = p.count
  p.count = 0
}

export const getPityCount = (user, bannerType = 'permanent') =>
  ensurePity(user, bannerType).count

// ===============================================
// 🎁 REWARD SYSTEM
// ===============================================

export const calcMedalReward = (character) =>
  character?.medalReward ?? 5

export const calcDuplicateReward = (character) =>
  character?.duplicateReward ?? 10

export const giveDuplicateReward = (user, character) => {
  const medal = calcMedalReward(character)
  const carats = calcDuplicateReward(character)
  addMedal(user, medal)
  addCarats(user, carats)
  return { medal, carats }
}

// ===============================================
// 🎬 ANIMATION SYSTEM
// ===============================================

export const delay = (ms) => new Promise(r => setTimeout(r, ms))

export const rarityRevealText = (rarity) => {
  const map = {
    rare: '🔵 𝗥𝗔𝗥𝗘',
    epic: '🟣 𝗘𝗣𝗜𝗖',
    legend: '🌟 𝗟𝗘𝗚𝗘𝗡𝗗',
    limited: `🌸${getActiveLimitedIcon()} 𝗟𝗜𝗠𝗜𝗧𝗘𝗗`
  }
  return map[rarity] ?? '⬜ ???'
}

// ===============================================
// 📝 FORMATTER SYSTEM
// ===============================================

export const rarityLabel = (rarity) => {
  const map = { rare: '🔵 Rare', epic: '🟣 Epic', legend: '🟡 Legend', limited: `🌸${getActiveLimitedIcon()} Limited` }
  return map[rarity] ?? rarity
}

export const getRarityIcon = (character) => {

  if (!character) return '⬜'

  if (character.rarity === 'limited') {
    return `🌸${character.limitedIcon ?? '✨'}`
  }

  return {
    legend: '🟡',
    epic: '🟣',
    rare: '🔵'
  }[character.rarity] ?? '⬜'

}

export const buildPullCaption = (character, rarity, isDuplicate, reward, pityCount) => {
  const lines = [
    rarityRevealText(rarity),
    '',
    `🏇 ${character.name}`,
    '',
    `📝 ${character.description ?? '-'}`
  ]
  if (isDuplicate && reward) {
    lines.push('', `✨ Duplikat!`, `🏅 Medal +${reward.medal ?? 0}`, `💰 Carats +${reward.carats ?? 0}`)
  }
  lines.push('', `💬 "${character.quotePull ?? character.quoteWin ?? '🏇 Siap berlari!'}"`)
  if (pityCount != null) lines.push('', `🎯 Pity berikutnya: ${pityCount} pull`)
  return lines.join('\n')
}

export const buildMultiCaption = (results, totalMedal, totalCarats) => {
  // ── STACK DUPLICATE (Fitur 1-3) ──────────────────────────
  // Kumpulkan hasil dengan urutan kemunculan pertama.
  // Stack hanya memengaruhi tampilan — inventory/reward tidak diubah.
  const stackMap = new Map() // key: character.id → { r, count }
  const order = []           // urutan kemunculan pertama

  for (const r of results) {
    const id = r.character.id
    if (stackMap.has(id)) {
      const entry = stackMap.get(id)
      entry.count++
      // Pertahankan flag isDuplicate: jika salah satu baris dup, tandai dup
      if (r.isDuplicate) entry.isDuplicate = true
    } else {
      stackMap.set(id, { r, count: 1, isDuplicate: r.isDuplicate })
      order.push(id)
    }
  }

  const lines = order.map((id, i) => {
    const { r, count, isDuplicate } = stackMap.get(id)
    const dupIcon = isDuplicate ? ' ✨' : ''
    const countSuffix = count > 1 ? ` ×${count}` : ''
    return `${i + 1}. ${getRarityIcon(r.character)} ${r.character.name}${dupIcon}${countSuffix}`
  })

  const footer = []
  if (totalMedal > 0) footer.push(`🏅 Medal +${totalMedal}`)
  if (totalCarats > 0) footer.push(`💰 Carats +${totalCarats}`)
  return [
    `🎊 𝗠𝗨𝗟𝗧𝗜 𝗣𝗨𝗟𝗟 ×${results.length}`,
    '',
    ...lines,
    ...(footer.length ? ['', footer.join('  |  ')] : [])
  ].join('\n')
}

// ===============================================
// 🔍 VALIDATION SYSTEM
// ===============================================

export const validateUser = (user) =>
  user != null && typeof user === 'object'

export const validateAmount = (amount, min = 1) => {
  const n = Number(amount)
  return !isNaN(n) && n >= min && isFinite(n)
}

export const safePositive = (value) =>
  Math.max(0, value ?? 0)

// ===============================================
// 📅 EVENT SYSTEM
// ===============================================

export const isEventActive = (event) => {
  if (!event?.active) return false
  const now = Date.now()
  if (event.startTime && now < event.startTime) return false
  if (event.endTime && now > event.endTime) return false
  return true
}

export const formatCountdown = (endTime) => {
  if (!endTime) return 'Tanpa batas'
  const sisa = endTime - Date.now()
  if (sisa <= 0) return 'Berakhir'
  const hari = Math.floor(sisa / 86400000)
  const jam = Math.floor((sisa % 86400000) / 3600000)
  const menit = Math.floor((sisa % 3600000) / 60000)
  if (hari > 0) return `${hari}h ${jam}j ${menit}m`
  if (jam > 0) return `${jam}j ${menit}m`
  return `${menit}m`
}

// ===============================================
// 👑 OWNER SYSTEM
// ===============================================

export const isOwnerSender = (sender) => {
  if (!global.owner?.length) return false
  return global.owner
    .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    .includes(sender)
}

export const ownerGiveCharacter = (user, charId) => {
  const char = allCharacters.find(c => c.id === charId)
  if (!char) return { success: false, message: `❌ Karakter '${charId}' tidak ditemukan.` }
  const result = addCharacterToInventory(user, char, 'owner')
  return { success: true, character: char, isDuplicate: result.isDuplicate, copies: result.copies }
}

// ===============================================
// 🚀 SHARED EXPORT
// ===============================================
//
// Seluruh helper diexport dari file ini.
// File lain tidak perlu membuat helper sendiri.

console.log('🛠 SHOP HELPER LOADED')
