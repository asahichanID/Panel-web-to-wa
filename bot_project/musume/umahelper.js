import { allCharacterPool, getCharacterById } from './shop/karakter.js'

// ===============================================
// 🛠 UMA HELPER — Utility khusus Uma Musume game
// ===============================================
//
// File ini menyediakan utility untuk sistem game Uma:
// race, training, feed, myuma, dll.
//
// Berbeda dengan shop/helper.js yang khusus Shop System.

export const getUma = id => {
  if (!id) return null
  return getCharacterById(id) ?? null
}

// Dapatkan uma dari data USER (dari inventory banner)
export const getUmaFromUser = (db, sender, activeUmaId) => {
  if (!activeUmaId) return null
  return getCharacterById(activeUmaId) ?? null
}

// Resolve uma dari allCharacterPool ATAU npcCollection user (untuk NPC activeUma)
// Mengembalikan objek uma yang kompatibel dengan race, race5, dll.
export const resolveActiveUma = (user) => {
  if (!user?.activeUma) return null

  // Cari di allCharacterPool dulu (banner + limited chars)
  const bannerUma = getCharacterById(user.activeUma)
  if (bannerUma) return bannerUma

  // Cari di npcCollection (NPC activeUma key: "id_index")
  if (user.npcCollection?.length) {
    // NPC key format: "hana_0" — strip suffix index
    const baseId = user.activeUma.replace(/_\d+$/, '')
    const npcEntry = user.npcCollection.find(n => n.id === baseId)
    if (npcEntry) {
      // Bungkus jadi format kompatibel dengan allCharacterPool
      return {
        id: user.activeUma,
        name: npcEntry.name || 'NPC',
        rarity: 'npc',
        stats: npcEntry.stats ?? { speed: 70, stamina: 70, power: 70, accel: 70 },
        skill: npcEntry.skill ?? {},
        quotes: npcEntry.quotes ?? ['💪 Latihan membuat kita lebih kuat!'],
        favorit: npcEntry.favorit ?? 'Wortel Biasa',
        makanan: npcEntry.makanan ?? 500,
        image: null,
        quoteWin: npcEntry.quoteWin ?? '🤝 Terimakasih sudah berlatih bersama!'
      }
    }
  }

  return null
}

export const getUser = (db, m) => db.users[m.sender] ?? null

export const getActiveUma = (db, m) => {
  const user = getUser(db, m)
  if (!user?.activeUma) return null
  return getUma(user.activeUma)
}

export const getStats = (db, m) => {
  const user = getUser(db, m)
  if (!user?.activeUma) return null
  return user.umaStats?.[user.activeUma] ?? null
}

export const getQuote = uma => {
  if (!uma?.quotes?.length) return '🏇'
  return uma.quotes[Math.floor(Math.random() * uma.quotes.length)]
}

// FIX: uma.skill adalah objek, bukan array — kembalikan langsung
export const getSkill = uma => {
  return uma?.skill ?? null
}

export const levelUp = stats => {
  if (!stats) return false
  let naik = false
  while (stats.exp >= 100) {
    stats.level++
    stats.exp -= 100
    naik = true
  }
  return naik
}

export const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

// ===============================================
// ⏳ GLOBAL COOLDOWN SYSTEM
// ===============================================

const globalCooldown = {}
const globalWarn = {}

export const globalSpam = (key, detik) => {
  const now = Date.now()
  const sisa = (detik * 1000) - (now - (globalCooldown[key] ?? 0))
  if (sisa > 0) {
    if (!globalWarn[key]) {
      globalWarn[key] = true
      return { ok: false, warn: true, sisa }
    }
    return { ok: false, warn: false, sisa }
  }
  globalCooldown[key] = now
  globalWarn[key] = false
  return { ok: true, sisa: 0 }
}

// ===============================================
// ⏳ USER COOLDOWN SYSTEM
// ===============================================

const userCooldown = {}
const userWarn = {}

export const cekSpam = (sender, key, detik) => {
  const id = `${sender}:${key}`
  const now = Date.now()
  const sisa = (detik * 1000) - (now - (userCooldown[id] ?? 0))
  if (sisa > 0) {
    if (!userWarn[id]) {
      userWarn[id] = true
      return { ok: false, warn: true, sisa }
    }
    return { ok: false, warn: false, sisa }
  }
  delete userWarn[id]
  return { ok: true, warn: false, sisa: 0 }
}

export const setSpam = (sender, key) => {
  const id = `${sender}:${key}`
  userCooldown[id] = Date.now()
  delete userWarn[id]
}

// Reset cooldown manual (untuk owner)
export const resetUserSpam = (sender, key) => {
  const id = `${sender}:${key}`
  delete userCooldown[id]
  delete userWarn[id]
}

export const resetGlobalSpam = (key) => {
  delete globalCooldown[key]
  delete globalWarn[key]
}

// ===============================================
// 🏇 UMA STATS HELPER
// ===============================================

// Inisialisasi stats Uma baru dari data karakter
export const initUmaStats = (uma) => ({
  speed: uma?.stats?.speed ?? 70,
  stamina: uma?.stats?.stamina ?? 70,
  power: uma?.stats?.power ?? 70,
  accel: uma?.stats?.accel ?? 70,
  level: 1,
  exp: 0,
  win: 0,
  lose: 0
})

// Hitung total power score
export const calcPower = (stats) => {
  if (!stats) return 0
  return (stats.speed ?? 0) + (stats.stamina ?? 0) + (stats.power ?? 0) + (stats.accel ?? 0)
}

// Format stats untuk tampilan singkat
export const formatStatsShort = (stats) => {
  if (!stats) return '─ Tidak ada data ─'
  return `⚡ ${stats.speed} | ❤️ ${stats.stamina} | 💪 ${stats.power} | 💨 ${stats.accel}`
}

console.log('⏳ UMAHELPER LOADED')
