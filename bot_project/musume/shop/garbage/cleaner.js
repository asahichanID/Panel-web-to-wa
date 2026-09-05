// ===============================================
// 🗑 TRACEN GARBAGE CLEANER
// ===============================================
//
// File ini merupakan pusat pembersihan
// seluruh data sementara sistem Tracen.
//
// Cleaner bertugas membuang data yang sudah
// tidak digunakan agar:
//
// • RAM tetap ringan
// • Session tidak menumpuk
// • Cache tidak penuh
// • Database tetap bersih
//
// Cleaner TIDAK menghapus data permanen seperti:
// • Inventory karakter
// • Statistik banner
// • Pity count
// • Exchange history
// • Bank data
//
// ===============================================
// CARA KERJA
// ===============================================
//
// 1. Banner.js menyelesaikan pull/animasi
// 2. Data sementara (animasi, session) dianggap selesai
// 3. Cleaner.js membersihkan data sementara tersebut
// 4. Cleaner tidak dijalankan secara langsung dari command
// 5. Cleaner dijalankan secara otomatis via:
//    • startAutoClean() — interval berkala
//    • cleanAfterBanner() — setelah pull selesai
//    • cleanUserSession() — setelah session user selesai
//
// ===============================================

// ===============================================
// 📦 TEMPORARY DATA STORES
// ===============================================
//
// Data sementara yang dikelola cleaner:

// Store animasi banner aktif (message key yang sedang di-edit)
export const bannerAnimStore = {}

// Store session pull yang sedang berjalan (mencegah double pull)
export const activePullSession = {}

// Store event countdown cache
export const eventCountdownCache = {}

// Store rate cache (agar tidak dihitung ulang tiap pull)
export const rateCache = {}

// Store temporary pull lock (1 pull at a time per user)
export const pullLock = {}

// ===============================================
// 🔒 PULL LOCK SYSTEM
// ===============================================
//
// Mencegah user melakukan double pull bersamaan.
// Lock diset saat pull dimulai, dibersihkan setelah selesai.

export const setPullLock = (sender) => {
  pullLock[sender] = Date.now()
}

export const isPullLocked = (sender) => {
  const lock = pullLock[sender]
  if (!lock) return false
  // Auto-expire lock setelah 30 detik (safeguard jika error)
  if (Date.now() - lock > 30000) {
    delete pullLock[sender]
    return false
  }
  return true
}

export const releasePullLock = (sender) => {
  delete pullLock[sender]
}

// ===============================================
// 🎬 ANIMATION STORE
// ===============================================
//
// Menyimpan reference pesan animasi banner.
// Dipakai untuk edit pesan animasi.
// Dibersihkan setelah animasi selesai.

export const registerBannerAnim = (sender, msgKey) => {
  bannerAnimStore[sender] = {
    key: msgKey,
    time: Date.now()
  }
}

export const getBannerAnim = (sender) =>
  bannerAnimStore[sender] ?? null

export const cleanBannerAnim = (sender) => {
  delete bannerAnimStore[sender]
}

// ===============================================
// 📡 SESSION STORE
// ===============================================
//
// Session aktif pull per user.
// Mencegah multi-pull bersamaan.

export const startSession = (sender, type) => {
  activePullSession[sender] = { type, time: Date.now() }
}

export const hasActiveSession = (sender) => {
  const s = activePullSession[sender]
  if (!s) return false
  // Expire setelah 60 detik
  if (Date.now() - s.time > 60000) {
    delete activePullSession[sender]
    return false
  }
  return true
}

export const endSession = (sender) => {
  delete activePullSession[sender]
}

// ===============================================
// 🗂 RATE CACHE
// ===============================================
//
// Cache kalkulasi rate banner agar tidak
// dihitung ulang setiap pull.
// Expire setiap 5 menit.

export const cacheRate = (key, data, ttlMs = 300000) => {
  rateCache[key] = {
    data,
    expires: Date.now() + ttlMs
  }
}

export const getCachedRate = (key) => {
  const c = rateCache[key]
  if (!c) return null
  if (Date.now() > c.expires) {
    delete rateCache[key]
    return null
  }
  return c.data
}

// ===============================================
// ⏰ AUTO CLEAN ROUTINE
// ===============================================
//
// Dijalankan secara berkala untuk membersihkan
// seluruh data sementara yang sudah expire.

const CLEAN_INTERVAL = 10 * 60 * 1000  // 10 menit

let cleanTimer = null

export const startAutoClean = () => {
  if (cleanTimer) return  // Jangan jalankan dua kali

  cleanTimer = setInterval(() => {
    runClean()
  }, CLEAN_INTERVAL)

  console.log('🗑 GARBAGE CLEANER: Auto clean aktif (interval 10 menit)')
}

export const stopAutoClean = () => {
  if (cleanTimer) {
    clearInterval(cleanTimer)
    cleanTimer = null
    console.log('🗑 GARBAGE CLEANER: Auto clean dihentikan')
  }
}

// ===============================================
// 🧹 CLEAN ROUTINES
// ===============================================

// Bersihkan animasi yang expired (lebih dari 5 menit)
const cleanExpiredAnims = () => {
  const now = Date.now()
  let count = 0
  for (const sender in bannerAnimStore) {
    if (now - bannerAnimStore[sender].time > 300000) {
      delete bannerAnimStore[sender]
      count++
    }
  }
  return count
}

// Bersihkan session yang expired (lebih dari 60 detik)
const cleanExpiredSessions = () => {
  const now = Date.now()
  let count = 0
  for (const sender in activePullSession) {
    if (now - activePullSession[sender].time > 60000) {
      delete activePullSession[sender]
      count++
    }
  }
  return count
}

// Bersihkan pull lock yang expired (lebih dari 30 detik)
const cleanExpiredLocks = () => {
  const now = Date.now()
  let count = 0
  for (const sender in pullLock) {
    if (now - pullLock[sender] > 30000) {
      delete pullLock[sender]
      count++
    }
  }
  return count
}

// Bersihkan rate cache yang expired
const cleanExpiredRateCache = () => {
  const now = Date.now()
  let count = 0
  for (const key in rateCache) {
    if (now > rateCache[key].expires) {
      delete rateCache[key]
      count++
    }
  }
  return count
}

// Bersihkan event countdown cache (expire 1 menit)
const cleanEventCountdownCache = () => {
  const now = Date.now()
  let count = 0
  for (const key in eventCountdownCache) {
    if (now > eventCountdownCache[key].expires) {
      delete eventCountdownCache[key]
      count++
    }
  }
  return count
}

// ===============================================
// 🚀 MAIN CLEAN RUNNER
// ===============================================

export const runClean = () => {
  const anim = cleanExpiredAnims()
  const sessions = cleanExpiredSessions()
  const locks = cleanExpiredLocks()
  const rates = cleanExpiredRateCache()
  const events = cleanEventCountdownCache()

  const total = anim + sessions + locks + rates + events

  if (total > 0) {
    console.log(`🗑 GARBAGE CLEANER: ${total} item dibersihkan`)
    console.log(`   Animasi: ${anim} | Session: ${sessions} | Lock: ${locks} | Rate: ${rates} | Event: ${events}`)
  }

  return { anim, sessions, locks, rates, events, total }
}

// Bersihkan data user tertentu setelah pull selesai
export const cleanAfterPull = (sender) => {
  cleanBannerAnim(sender)
  endSession(sender)
  releasePullLock(sender)
}

// Bersihkan seluruh data sementara (hard reset)
export const hardReset = () => {
  for (const k in bannerAnimStore) delete bannerAnimStore[k]
  for (const k in activePullSession) delete activePullSession[k]
  for (const k in eventCountdownCache) delete eventCountdownCache[k]
  for (const k in rateCache) delete rateCache[k]
  for (const k in pullLock) delete pullLock[k]
  console.log('🗑 GARBAGE CLEANER: Hard reset selesai')
}

// ===============================================
// 📊 CLEAN STATUS
// ===============================================

export const getCleanStatus = () => ({
  bannerAnimCount: Object.keys(bannerAnimStore).length,
  activeSessionCount: Object.keys(activePullSession).length,
  pullLockCount: Object.keys(pullLock).length,
  rateCacheCount: Object.keys(rateCache).length,
  eventCacheCount: Object.keys(eventCountdownCache).length,
  autoCleanActive: cleanTimer !== null,
  nextCleanIn: cleanTimer ? `${Math.floor(CLEAN_INTERVAL / 60000)} menit` : 'Tidak aktif'
})

export const buildCleanStatusText = () => {
  const s = getCleanStatus()
  return [
    '🗑 𝗚𝗔𝗥𝗕𝗔𝗚𝗘 𝗖𝗟𝗘𝗔𝗡𝗘𝗥',
    '',
    `🎬 Anim aktif    : ${s.bannerAnimCount}`,
    `📡 Session aktif : ${s.activeSessionCount}`,
    `🔒 Pull lock     : ${s.pullLockCount}`,
    `📊 Rate cache    : ${s.rateCacheCount}`,
    `📅 Event cache   : ${s.eventCacheCount}`,
    '',
    `⏰ Auto clean    : ${s.autoCleanActive ? '🟢 Aktif' : '🔴 Mati'}`,
    `⏱ Interval      : ${s.nextCleanIn}`
  ].join('\n')
}

// ===============================================
// 🚀 INIT
// ===============================================
//
// Auto start cleaner saat file di-import

startAutoClean()

console.log('🗑 GARBAGE CLEANER LOADED')
