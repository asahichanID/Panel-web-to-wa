/*
════════════════════════════════════════════════════════════════════════
        ☠️  ABSOLUTE MONSTER SYSTEM  ☠️
        Version 1.0  —  Full Implementation

        Author  : Project Tracen Academy
        Status  : Stable
        File    : musume/shop/limitedEvent/absoluteMonster.js

        Seluruh logic Absolute Monster berada di file ini.
        banner.js hanya bertugas sebagai Router.
════════════════════════════════════════════════════════════════════════
*/

'use strict'

import {
  hasEnoughCarats, spendCarats, addCarats,
  addCharacterToInventory, hasCharacter,
  addMedal, formatCarats,
  ensureBannerStat,
  recordPullHistory
} from '../helper.js'

import { addBankActivity }               from '../../bankaktivitas.js'
import { getCharacterImage, getMonsterImage } from '../../umaimage.js'
import { bannerPool }                    from '../karakter.js'
import { MONSTER_CHARACTERS }            from './monster/monsterDB.js'

// O(1) lookup map untuk monster quotes (internal — tidak expose ke luar)
const _monsterById = new Map(MONSTER_CHARACTERS.map(c => [c.id, c]))

// ════════════════════════════════════════════════════════════════════════
// ⚙️  SECTION 1 — MASTER CONFIG
// Semua angka, delay, rate, cooldown ada di sini.
// Tidak perlu menyentuh logic untuk mengubah angka.
// ════════════════════════════════════════════════════════════════════════

export const monsterConfig = {
  // — Event identity
  eventPrefix : '☠️',
  bannerName  : 'Absolute Monster Banner',
  ticketType  : 'monster',          // Tipe ticket khusus (hook future)

  // — Pricing
  singlePrice : 1500,               // Carats per single pull
  multiPrice  : 15000,              // Carats per 10 pull

  // — Rate (semua dalam desimal 0–1)
  absoluteRate : 0.00001,             // — Absolute Monster character
  legendRate   : 0.055,             // 5.5%
  epicRate     : 0.27,              // 27%
  caratRate    : 0.10,              // 10% — dapat bonus Carats, bukan karakter
  rateUpBonus  : 0.0005,              // Rate-up bonus untuk monster rate-up char

  // — Soft / Hard Pity
  softPity : 80,
  hardPity : 1200,

  // — Carat reward saat slot "carat"
  caratRewardMin : 100,
  caratRewardMax : 500,

  // — Animation delays (ms)
  delay: {
    initial    : 800,
    edit1      : 1200,
    edit2      : 1500,
    edit3      : 1800,
    edit4      : 1200,
    jackpot1   : 2000,
    jackpot2   : 2500,
    jackpotFin : 1500,
    multi      : 2200,
    multiEnd   : 1500
  },

  // — Duplicate reward untuk Monster (tidak ada — monster bukan karakter farm)
  monsterDuplicateReward : false,

  // — Cooldown table berdasarkan jumlah pull
  cooldownTable : [
    { min:   1, max:   9, ms:  20_000 },
    { min:  10, max:  29, ms:  30_000 },
    { min:  30, max:  49, ms:  40_000 },
    { min:  50, max:  99, ms:  45_000 },
    { min: 100, max: 199, ms:  60_000 },
    { min: 200, max: 299, ms:  90_000 },
    { min: 300, max: 399, ms: 120_000 },
    { min: 400, max: 499, ms: 180_000 },
    { min: 500, max: Infinity, ms: 270_000 }
  ]
}

// ════════════════════════════════════════════════════════════════════════
// 🔊  AUDIO HOOKS  (belum dipakai — disediakan untuk update berikutnya)
// ════════════════════════════════════════════════════════════════════════

export const monsterAudio = {
  introAudio   : null,   // path/URL saat banner dibuka
  idleAudio    : null,   // background idle
  jackpotAudio : null,   // saat Absolute Monster muncul
  resultAudio  : null,   // saat result ditampilkan
  endingAudio  : null,   // saat animasi selesai
  futureBgm    : null    // slot untuk BGM masa depan
}

// ════════════════════════════════════════════════════════════════════════
// 🏇  SECTION 2 — CHARACTER DATABASE
// Tambah Monster baru cukup di sini. File lain tidak perlu disentuh.
// ════════════════════════════════════════════════════════════════════════

// MONSTER_CHARACTERS — imported from ./monster/monsterDB.js
// (karakter data dipisah agar dapat diimport oleh karakterHelper.js tanpa circular)

// ════════════════════════════════════════════════════════════════════════
// 🎪  SECTION 3 — EVENT DEFINITION
// ════════════════════════════════════════════════════════════════════════

export const monsterEvent = {
  id          : 'absolute_monster_gray',
  name        : '☠️ Absolute Monster Gray',
  description : 'Oguri Cap telah melampaui batas. Ini bukan Banner Limited biasa. Ini adalah pertemuan dengan sesuatu yang berbeda.',
  icon        : '☠️',
  thumbnail   : 'absolute_monster_banner',
  active      : false,              // diaktifkan via .event on
  startTime   : null,
  endTime     : null,
  pool        : MONSTER_CHARACTERS, // pool penuh 2 karakter
  rateUpCharacters : ['oguri_absolute_monster', 'oguri_absolute_monster_v2', 'tamamo_absolute_monster'],
  config      : monsterConfig
}

// ════════════════════════════════════════════════════════════════════════
// 📦  SECTION 4 — POOL EXPORTS
// ════════════════════════════════════════════════════════════════════════

/** Pool seluruh karakter Monster */
export const monsterPool = MONSTER_CHARACTERS

/** Pool hanya Monster yang bisa di-roll sebagai rarity 'absolute' */
export const monsterAbsolutePool = MONSTER_CHARACTERS.filter(c => c.rarity === 'absolute')

/** Pool Legend dari banner permanen (dipakai di dalam Monster Banner) */
export const monsterLegendPool = bannerPool.legend

/** Pool Epic dari banner permanen */
export const monsterEpicPool = bannerPool.epic

/** Carat rewards — digunakan saat slot "carat" terpilih */
export const monsterCarats = {
  min : monsterConfig.caratRewardMin,
  max : monsterConfig.caratRewardMax
}

/** Chance summary (untuk info banner) */
export const monsterChance = {
  absolute : monsterConfig.absoluteRate,
  legend   : monsterConfig.legendRate,
  epic     : monsterConfig.epicRate,
  carats   : monsterConfig.caratRate,
  rare     : 1 - monsterConfig.absoluteRate - monsterConfig.legendRate - monsterConfig.epicRate - monsterConfig.caratRate
}

// ════════════════════════════════════════════════════════════════════════
// 🎯  SECTION 5 — EVENT GATE (isMonsterActive / getMonsterBanner)
// ════════════════════════════════════════════════════════════════════════

/**
 * Cek apakah Event Absolute Monster sedang aktif.
 * banner.js memanggil ini sebagai hook utama.
 * @returns {boolean}
 */
export const isMonsterActive = () => monsterEvent.active === true

/**
 * Kembalikan object event Monster yang aktif.
 * @returns {object|null}
 */
export const getMonsterBanner = () => isMonsterActive() ? monsterEvent : null

// Owner controls
export const activateMonsterEvent = () => {
  monsterEvent.active    = true
  monsterEvent.startTime = Date.now()
  console.log('☠️ [ABSOLUTE MONSTER] Event AKTIF')
  return { success: true }
}

export const deactivateMonsterEvent = () => {
  monsterEvent.active  = false
  monsterEvent.endTime = Date.now()
  console.log('☠️ [ABSOLUTE MONSTER] Event DINONAKTIFKAN')
  clearMonsterQueue()
  cleanupMonsterCache()
  return { success: true }
}

// ════════════════════════════════════════════════════════════════════════
// 💤  SECTION 6 — COOLDOWN SYSTEM
// Cooldown hanya per-user, disimpan di Map (bukan database).
// Otomatis hilang saat bot restart.
// ════════════════════════════════════════════════════════════════════════

const cooldownStore = new Map()  // sender → { endTime, pulls }

/**
 * Hitung cooldown berdasarkan jumlah pull.
 */
export const getMonsterCooldown = (pullCount) => {
  const table = monsterConfig.cooldownTable
  for (const row of table) {
    if (pullCount >= row.min && pullCount <= row.max) return row.ms
  }
  return 30_000
}

/**
 * Set cooldown untuk user setelah pull selesai.
 */
export const setMonsterCooldown = (sender, pullCount) => {
  const ms      = getMonsterCooldown(pullCount)
  const endTime = Date.now() + ms
  cooldownStore.set(sender, { endTime, pulls: pullCount })

  // Auto-delete setelah selesai
  setTimeout(() => cooldownStore.delete(sender), ms + 1000)
}

/**
 * Cek apakah user masih dalam cooldown.
 * @returns {{ active: boolean, remaining: number }}
 */
export const checkMonsterCooldown = (sender) => {
  const entry = cooldownStore.get(sender)
  if (!entry) return { active: false, remaining: 0 }
  const remaining = entry.endTime - Date.now()
  if (remaining <= 0) {
    cooldownStore.delete(sender)
    return { active: false, remaining: 0 }
  }
  return { active: true, remaining }
}

/** Format sisa cooldown menjadi MM:SS */
const formatCooldownMs = (ms) => {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0')
  const s = (totalSec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ════════════════════════════════════════════════════════════════════════
// 🔒  SECTION 7 — QUEUE / LOCK SYSTEM
// Per-user lock untuk mencegah double summon dan race condition.
// ════════════════════════════════════════════════════════════════════════

const queueLock   = new Map()   // sender → boolean
const warnedQueue = new Map()   // sender → boolean (warn-once)

/** Acquire lock. Returns false jika sudah terkunci. */
const acquireMonsterLock = (sender) => {
  if (queueLock.get(sender)) return false
  queueLock.set(sender, true)
  return true
}

/** Release lock. */
const releaseMonsterLock = (sender) => {
  queueLock.delete(sender)
  warnedQueue.delete(sender)
}

/**
 * Cek apakah user sedang dalam queue.
 * @returns {boolean}
 */
export const isMonsterQueued = (sender) => !!queueLock.get(sender)

/**
 * Tandai bahwa warn sudah dikirim (warn-once pattern).
 */
const markQueueWarned = (sender) => warnedQueue.set(sender, true)
const isQueueWarned   = (sender) => !!warnedQueue.get(sender)

// ════════════════════════════════════════════════════════════════════════
// 📦  SECTION 8 — CACHE
// Semua cache bersifat sementara dan dibersihkan setelah summon selesai.
// ════════════════════════════════════════════════════════════════════════

const animationCache = new Map()  // sender → msgKey
const rollCache      = new Map()  // sender → results[]
const captionCache   = new Map()  // sender → string
const resultCache    = new Map()  // sender → { best, results }
const poolCache      = new Map()  // sender → filteredPool[]

/**
 * Bersihkan semua cache untuk satu user setelah summon selesai.
 */
export const cleanupMonsterCache = (sender = null) => {
  if (sender) {
    animationCache.delete(sender)
    rollCache.delete(sender)
    captionCache.delete(sender)
    resultCache.delete(sender)
    poolCache.delete(sender)
  } else {
    // Global cleanup
    animationCache.clear()
    rollCache.clear()
    captionCache.clear()
    resultCache.clear()
    poolCache.clear()
  }
}

/**
 * Bersihkan queue lock untuk satu user.
 */
export const clearMonsterQueue = (sender = null) => {
  if (sender) {
    releaseMonsterLock(sender)
  } else {
    queueLock.clear()
    warnedQueue.clear()
  }
}

// ════════════════════════════════════════════════════════════════════════
// 🎲  SECTION 9 — ROLL ENGINE
// ════════════════════════════════════════════════════════════════════════

const _rand = () => Math.random()

/**
 * Pilih random item dari array.
 */
const _pick = (arr) => arr[Math.floor(_rand() * arr.length)]

/**
 * Random integer antara min dan max (inklusif).
 */
const _randInt = (min, max) => Math.floor(_rand() * (max - min + 1)) + min

/**
 * Bangun dynamic pool berdasarkan karakter yang belum dimiliki user.
 * @param {object} user
 * @returns {Array} — pool karakter Monster yang belum dimiliki
 */
/**
 * Bangun dynamic pool Monster berdasarkan karakter yang belum dimiliki.
 * @param {object} user
 * @param {Set<string>} [ownedSet] — pre-built Set of owned IDs (O(1) lookup, untuk Multi Pull)
 */
const buildMonsterDynamicPool = (user, ownedSet = null) => {
  if (!user) return monsterAbsolutePool
  if (ownedSet) return monsterAbsolutePool.filter(c => !ownedSet.has(c.id))
  return monsterAbsolutePool.filter(c => !hasCharacter(user, c.id))
}

/**
 * Lakukan satu roll Monster.
 * @param {object} user
 * @param {number} pityCount — pity saat ini (untuk soft/hard pity)
 * @returns {{ type: 'absolute'|'legend'|'epic'|'rare'|'carats', character?: object, carats?: number }}
 */
/**
 * Lakukan satu roll Monster.
 * @param {object} user
 * @param {number} pityCount
 * @param {Array|null} [prebuiltPool] — pre-built dynamic pool (Multi Pull optimization)
 */
const doMonsterRoll = (user, pityCount, prebuiltPool = null) => {
  const cfg = monsterConfig
  const r   = _rand()

  // Gunakan pre-built pool jika tersedia — menghindari filter() tiap roll
  const getAbsPool = () => prebuiltPool ?? buildMonsterDynamicPool(user)

  // ── Hard Pity: 150 pull tanpa absolute → paksa absolute
  if (pityCount >= cfg.hardPity) {
    const pool = getAbsPool()
    if (pool.length > 0) return { type: 'absolute', character: _pick(pool) }
    return { type: 'legend', character: _pick(monsterLegendPool) }
  }

  // ── Soft Pity: mulai dari pull ke-80, rate absolute naik bertahap
  let absoluteRate = cfg.absoluteRate
  if (pityCount >= cfg.softPity) {
    const bonus = (pityCount - cfg.softPity) * 0.000002
    absoluteRate = Math.min(0.0005, cfg.absoluteRate + bonus)
  }

  let cumulative = 0

  // Absolute Monster slot
  cumulative += absoluteRate
  if (r < cumulative) {
    const pool = getAbsPool()
    if (pool.length > 0) return { type: 'absolute', character: _pick(pool) }
    return { type: 'legend', character: _pick(monsterLegendPool) }
  }

  // Legend slot
  cumulative += cfg.legendRate
  if (r < cumulative) {
    return { type: 'legend', character: _pick(monsterLegendPool) }
  }

  // Epic slot
  cumulative += cfg.epicRate
  if (r < cumulative) {
    return { type: 'epic', character: _pick(monsterEpicPool) }
  }

  // Carat slot
  cumulative += cfg.caratRate
  if (r < cumulative) {
    const carats = _randInt(monsterCarats.min, monsterCarats.max)
    return { type: 'carats', carats }
  }

  // Rare (sisanya)
  const rarePick = bannerPool.rare?.length ? _pick(bannerPool.rare) : _pick(monsterEpicPool)
  return { type: 'rare', character: rarePick }
}

// ════════════════════════════════════════════════════════════════════════
// 📊  SECTION 10 — PITY SYSTEM (per-user, sementara di object user)
// Menggunakan bannerStats.monster agar tetap terekam
// ════════════════════════════════════════════════════════════════════════

const ensureMonsterPity = (user) => {
  if (!user.monsterPity) user.monsterPity = 0
}

const getMonsterPity = (user) => {
  ensureMonsterPity(user)
  return user.monsterPity
}

const incrementMonsterPity = (user) => {
  ensureMonsterPity(user)
  user.monsterPity = (user.monsterPity ?? 0) + 1
}

const resetMonsterPity = (user) => {
  user.monsterPity = 0
}

// ════════════════════════════════════════════════════════════════════════
// 💰  SECTION 11 — APPLY ROLL RESULT
// ════════════════════════════════════════════════════════════════════════

/**
 * Terapkan satu hasil roll ke user.
 * @returns {{ isDuplicate, reward, type, character, carats }}
 */
const applyMonsterRoll = (user, rollResult, db, senderName) => {
  const { type, character, carats } = rollResult

  // — Carat slot
  if (type === 'carats') {
    addCarats(user, carats)
    incrementMonsterPity(user)
    // Rekam statistik
    const stat = ensureBannerStat(user, 'monster')
    stat.totalPull   = (stat.totalPull ?? 0) + 1
    stat.totalCarats = (stat.totalCarats ?? 0) + carats
    return { type: 'carats', carats, isDuplicate: false, reward: null }
  }

  // — Character slot
  if (!character) return { type, isDuplicate: false, reward: null }

  const { isDuplicate } = addCharacterToInventory(user, character, monsterConfig.bannerName)

  // Pity update
  if (type === 'absolute') {
    resetMonsterPity(user)
  } else {
    incrementMonsterPity(user)
  }

  // Duplicate reward — Monster tidak memberikan reward duplikat
  let reward = null
  if (isDuplicate && type !== 'absolute' && monsterConfig.monsterDuplicateReward) {
    const medalAmt = character.medalReward ?? 50
    const caratAmt = character.duplicateReward ?? 100
    addMedal(user, medalAmt)
    addCarats(user, caratAmt)
    reward = { medal: medalAmt, carats: caratAmt }
  }

  // Rekam statistik
  const stat = ensureBannerStat(user, 'monster')
  stat.totalPull      = (stat.totalPull ?? 0) + 1
  if (type === 'absolute') stat.totalAbsolute = (stat.totalAbsolute ?? 0) + 1
  if (type === 'legend')   stat.totalLegend   = (stat.totalLegend ?? 0) + 1
  if (type === 'epic')     stat.totalEpic     = (stat.totalEpic ?? 0) + 1
  if (isDuplicate)         stat.totalDuplicate = (stat.totalDuplicate ?? 0) + 1

  // History
  recordPullHistory(user, character, type, isDuplicate, 'monster')

  return { type, character, isDuplicate, reward }
}

// ════════════════════════════════════════════════════════════════════════
// 🎨  SECTION 12 — QUOTE HELPERS
// ════════════════════════════════════════════════════════════════════════

/**
 * Ambil quote random dari array atau gabungan pool kedua karakter.
 */
const pickQuote = (category) => {
  const allQuotes = []
  for (const char of MONSTER_CHARACTERS) {
    const pool = char.quotes?.[category]
    if (Array.isArray(pool)) allQuotes.push(...pool)
  }
  if (!allQuotes.length) return '...'
  return _pick(allQuotes)
}

/**
 * Ambil quote jackpot dari karakter yang baru saja didapat.
 */
const pickJackpotQuote = (characterId) => {
  const char = _monsterById.get(characterId)  // O(1)
  const pool = char?.quotes?.jackpot
  if (!Array.isArray(pool) || !pool.length) return '☠️ ...'
  return _pick(pool)
}

// ════════════════════════════════════════════════════════════════════════
// 🎬  SECTION 13 — ANIMATION ENGINE
// Edit-message flow: satu pesan yang terus diupdate.
// ════════════════════════════════════════════════════════════════════════

/**
 * Ambil random small delay (±200ms dari base) untuk anti-bosan.
 */
const jitter = (baseMs) => baseMs + _randInt(-200, 200)

/**
 * Kirim animasi pembuka + edit bertahap.
 * @returns {{ msgKey, hadJackpot }}
 */
const runMonsterAnimation = async (naze, m, sender, hasJackpot) => {
  const cfg   = monsterConfig
  const delay = (ms) => new Promise(r => setTimeout(r, Math.max(300, ms)))

  // ── Fase 0: Pesan awal ──────────────────────────────────────────────
  const q0  = pickQuote('summonStart')
  const initText = [
    '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'Membuka takdir...',
    'Jangan berbalik.',
    '',
    `${q0}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')

  let msg
  try {
    msg = await naze.sendMessage(m.chat, { text: initText }, { quoted: m })
  } catch { return { msgKey: null } }

  animationCache.set(sender, msg?.key)
  await delay(jitter(cfg.delay.initial))

  // ── Fase 1: Kesadaran terbuka ────────────────────────────────────────
  const q1 = pickQuote('summonMiddle')
  const edit1 = [
    '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
    '',
    `${q1}`,
    '',
    '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')
  try {
    await naze.sendMessage(m.chat, { edit: msg.key, text: edit1 })
  } catch { /* lanjut */ }
  await delay(jitter(cfg.delay.edit1))

  // ── Fase 2: Aura berubah ─────────────────────────────────────────────
  const q2 = pickQuote('summonMiddle')
  const edit2 = [
    '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '█████████████████████████',
    '',
    `${q2}`,
    '',
    '█████████████████████████',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')
  try {
    await naze.sendMessage(m.chat, { edit: msg.key, text: edit2 })
  } catch { /* lanjut */ }
  await delay(jitter(cfg.delay.edit2))

  // ── Fase 3: Suara berbicara ──────────────────────────────────────────
  const q3 = pickQuote('summonFinal')
  const edit3 = [
    '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '░░░░░░░░░░░░░░░░░░░░░░░░░',
    '',
    `${q3}`,
    '',
    '░░░░░░░░░░░░░░░░░░░░░░░░░',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')
  try {
    await naze.sendMessage(m.chat, { edit: msg.key, text: edit3 })
  } catch { /* lanjut */ }
  await delay(jitter(cfg.delay.edit3))

  // ── Fase 4: Puncak ───────────────────────────────────────────────────
  const edit4 = [
    '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    hasJackpot
      ? '⚠️  SESUATU YANG SANGAT LANGKA MENDEKAT...'
      : '...menentukan takdirmu...',
    '',
    hasJackpot
      ? '☠️ ☠️ ☠️ ☠️ ☠️ ☠️ ☠️ ☠️'
      : '━ ━ ━ ━ ━ ━ ━ ━ ━ ━',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')
  try {
    await naze.sendMessage(m.chat, { edit: msg.key, text: edit4 })
  } catch { /* lanjut */ }

  const finalDelay = hasJackpot ? jitter(cfg.delay.jackpot1) : jitter(cfg.delay.edit4)
  await delay(finalDelay)

  // ── Fase Jackpot extra (hanya jika dapat Absolute Monster) ───────────
  if (hasJackpot) {
    const editJ = [
      '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴',
      '',
      '☠️  M U N C U L  ☠️',
      '',
      '🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    ].join('\n')
    try {
      await naze.sendMessage(m.chat, { edit: msg.key, text: editJ })
    } catch { /* lanjut */ }
    await delay(jitter(cfg.delay.jackpot2))
  }

  return { msgKey: msg?.key }
}

/**
 * Animasi singkat untuk Multi Pull.
 */
const runMonsterMultiAnimation = async (naze, m, sender, count, hasJackpot) => {
  const cfg   = monsterConfig
  const delay = (ms) => new Promise(r => setTimeout(r, Math.max(300, ms)))

  const q0 = pickQuote('summonStart')
  const initText = [
    `☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥 ×${count}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `Memanggil ${count} nasib sekaligus...`,
    '',
    `${q0}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')

  let msg
  try {
    msg = await naze.sendMessage(m.chat, { text: initText }, { quoted: m })
  } catch { return }
  animationCache.set(sender, msg?.key)

  await delay(jitter(cfg.delay.multi))

  const q1 = pickQuote('summonFinal')
  const edit1 = [
    `☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥 ×${count}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    hasJackpot ? '⚠️  ABSOLUTE MONSTER TERDETEKSI...' : '...membuka semua hasil...',
    '',
    `${q1}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')
  try {
    await naze.sendMessage(m.chat, { edit: msg.key, text: edit1 })
  } catch { /* lanjut */ }
  await delay(jitter(cfg.delay.multiEnd))
}

// ════════════════════════════════════════════════════════════════════════
// 🖼  SECTION 14 — THUMBNAIL
// ════════════════════════════════════════════════════════════════════════

/**
 * Dapatkan thumbnail untuk Monster Banner.
 * Blueprint: background hitam/merah, aura, glitch, mata merah.
 * (Image URL/path dikembalikan — diakses via umaimage.js convention)
 */
export const monsterThumbnail = {
  default    : 'absolute_monster_banner',
  jackpot    : 'absolute_monster_jackpot',
  v1         : 'oguri_absolute_monster',
  v2         : 'oguri_absolute_monster_v2',
  tamamo   : 'tamamo_absolute_monster'
}

/**
 * Ambil thumbnail terbaik dari results.
 * Jika ada Absolute Monster → gunakan thumbnail jackpot / karakter itu.
 * Jika tidak → gunakan default Monster banner.
 */
export const getMonsterThumbnailChar = (results) => {
  if (!results?.length) return null
  const absolute = results.find(r => r.type === 'absolute' && r.character)
  if (absolute) return absolute.character
  const legend   = results.find(r => r.type === 'legend' && r.character)
  if (legend)    return legend.character
  const epic     = results.find(r => r.type === 'epic' && r.character)
  if (epic)      return epic.character
  return null
}

// ════════════════════════════════════════════════════════════════════════
// 📝  SECTION 15 — CAPTION BUILDERS
// ════════════════════════════════════════════════════════════════════════

/** Icon per rarity di Monster Banner */
const monsterRarityIcon = (type) => {
  switch (type) {
    case 'absolute': return '☠️'
    case 'legend'  : return '🔴'
    case 'epic'    : return '⚫'
    case 'rare'    : return '⬛'
    case 'carats'  : return '💰'
    default        : return '⬛'
  }
}

/**
 * buildMonsterCaption — untuk Multi Pull.
 * Menggunakan stack duplicate seperti buildMultiCaption.
 */
export const buildMonsterCaption = (results, totalCaratBonus) => {
  // Stack duplicate — hanya tampilan, inventory tidak berubah
  const stackMap = new Map()
  const order    = []

  for (const r of results) {
    if (r.type === 'carats') continue   // carat ditampilkan di footer

    const key = r.character?.id ?? `${r.type}_${Math.random()}`
    if (stackMap.has(key)) {
      const entry = stackMap.get(key)
      entry.count++
      if (r.isDuplicate) entry.isDuplicate = true
    } else {
      stackMap.set(key, { r, count: 1, isDuplicate: r.isDuplicate })
      order.push(key)
    }
  }

  const lines = order.map((key, i) => {
    const { r, count, isDuplicate } = stackMap.get(key)
    const icon      = monsterRarityIcon(r.type)
    const name      = r.character?.name ?? '???'
    const dupMark   = isDuplicate ? ' ✨' : ''
    const countSfx  = count > 1 ? ` ×${count}` : ''
    return `${i + 1}. ${icon} ${name}${dupMark}${countSfx}`
  })

  // Carat rolls
  const caratRolls = results.filter(r => r.type === 'carats')
  const totalCaratRoll = caratRolls.reduce((s, r) => s + (r.carats ?? 0), 0)
  if (caratRolls.length > 0) {
    lines.push(`${order.length + 1}. 💰 Carats Bonus ×${caratRolls.length}`)
  }

  const footer = []
  const grandCarat = totalCaratBonus + totalCaratRoll
  if (grandCarat > 0) footer.push(`💰 Carats +${grandCarat.toLocaleString('id-ID')}`)

  return [
    `☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥 ×${results.length}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    ...lines,
    ...(footer.length ? ['', footer.join('  |  ')] : []),
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')
}

/**
 * buildMonsterAnimation — alias (digunakan saat membangun teks animasi dinamis)
 */
export const buildMonsterAnimation = (phase, quoteOverride = null) => {
  const q = quoteOverride ?? pickQuote('summonMiddle')
  return [
    '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `[Fase ${phase}]`,
    '',
    q,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')
}

/** Caption Single Pull */
const buildMonsterSingleCaption = (type, character, isDuplicate, carats, pityCount) => {
  if (type === 'carats') {
    return [
      '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `💰 Carat Slot — +${(carats ?? 0).toLocaleString('id-ID')} Carats`,
      '',
      `🎯 Pity: ${pityCount}`,
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    ].join('\n')
  }

  if (!character) return '☠️ Error — Karakter tidak ditemukan.'

  const icon   = monsterRarityIcon(type)
  const dup    = isDuplicate ? ' ✨ (Duplikat)' : ''
  const quote  = type === 'absolute'
    ? pickJackpotQuote(character.id)
    : (character.quotePull ?? '...')

  return [
    '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `${icon} ${character.name}${dup}`,
    '',
    `"${quote}"`,
    '',
    `🎯 Pity: ${pityCount}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')
}

// ════════════════════════════════════════════════════════════════════════
// 🎴  SECTION 16 — HANDLE SINGLE PULL
// Lifecycle: Validasi → Lock → Roll → Animate → Caption → Cleanup → Unlock
// ════════════════════════════════════════════════════════════════════════

/**
 * handleMonsterPull — Single Pull Absolute Monster.
 * Dipanggil oleh banner.js saat Event aktif + user menjalankan .lpull
 */
export const handleMonsterPull = async (naze, m, db, user) => {
  const sender     = m.sender
  const senderName = user.name || sender.split('@')[0]
  const cfg        = monsterConfig

  // ── 1. Validasi Event ────────────────────────────────────────────────
  if (!isMonsterActive()) {
    return m.reply('❌ Event Absolute Monster tidak aktif.')
  }

  // ── 2. Cooldown Check ────────────────────────────────────────────────
  const cd = checkMonsterCooldown(sender)
  if (cd.active) {
    return m.reply([
      '⏳ Absolute Monster masih tertidur...',
      '',
      `Silakan tunggu:`,
      `${formatCooldownMs(cd.remaining)}`,
      '',
      'lagi sebelum mencoba memanggilnya kembali.'
    ].join('\n'))
  }

  // ── 3. Queue / Anti-Spam ─────────────────────────────────────────────
  if (isMonsterQueued(sender)) {
    if (!isQueueWarned(sender)) {
      markQueueWarned(sender)
      return m.reply('⏳ Summon sedang berjalan. Harap tunggu hingga selesai.')
    }
    return  // Silent — sudah warn sekali
  }

  // ── 4. Acquire Lock ──────────────────────────────────────────────────
  if (!acquireMonsterLock(sender)) return

  try {
    // ── 5. Validasi User ─────────────────────────────────────────────────
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    // ── 6. Cek Pool — apakah semua Monster sudah dimiliki?
    const dynamicPool = buildMonsterDynamicPool(user)
    // Pool bisa kosong tapi pull tetap bisa jalan (dapat legend/epic/carat)
    // Complete-block hanya jika semua slot absolute kosong DAN user sudah punya semua
    const allOwned = monsterAbsolutePool.length > 0 &&
      monsterAbsolutePool.every(c => hasCharacter(user, c.id))
    if (allOwned) {
      return m.reply(
        '🎉 Semua Absolute Monster sudah kamu miliki.\n\n' +
        'Karakter Monster tidak dapat diperoleh dua kali.\n\n' +
        'Silakan tunggu Event Absolute Monster berikutnya.'
      )
    }

    // ── 7. Validasi Carats ────────────────────────────────────────────────
    if (!hasEnoughCarats(user, cfg.singlePrice)) {
      return m.reply(
        `❌ Carats tidak cukup!\n\n💰 Dibutuhkan : ${formatCarats(cfg.singlePrice)}\n💰 Carats kamu : ${formatCarats(user.money)}`
      )
    }
    spendCarats(user, cfg.singlePrice)
    if (db?.bank) {
      db.bank.kas             = (db.bank.kas ?? 0) + cfg.singlePrice
      db.bank.danaMasuk       = (db.bank.danaMasuk ?? 0) + cfg.singlePrice
      db.bank.totalPembelian  = (db.bank.totalPembelian ?? 0) + 1
    }

    // ── 8. Roll ────────────────────────────────────────────────────────────
    const pityCount  = getMonsterPity(user)
    const rollResult = doMonsterRoll(user, pityCount)
    const hasJackpot = rollResult.type === 'absolute'

    // ── 9. Animasi ─────────────────────────────────────────────────────────
    await runMonsterAnimation(naze, m, sender, hasJackpot)

    // ── 10. Apply Result ────────────────────────────────────────────────────
    const applied    = applyMonsterRoll(user, rollResult, db, senderName)
    const newPity    = getMonsterPity(user)
    const caption    = buildMonsterSingleCaption(
      applied.type, applied.character, applied.isDuplicate, applied.carats, newPity
    )
    captionCache.set(sender, caption)

    // ── 11. Kirim Result ────────────────────────────────────────────────────
    const imgChar  = applied.character
const imageUrl = applied.type === 'absolute'
  ? getMonsterImage(imgChar?.image)
  : getCharacterImage(imgChar)
  
    if (imageUrl) {
      await naze.sendMessage(m.chat, { image: { url: imageUrl }, caption }, { quoted: m })
    } else {
      await m.reply(caption)
    }

    // ── 12. Bank Activity ───────────────────────────────────────────────────
    if (db?.bank) {
      const label = applied.type === 'absolute'
        ? `☠️ ${senderName} mendapatkan ${applied.character?.name} dari Absolute Monster!`
        : `☠️ ${senderName} melakukan pull di Absolute Monster Banner`
      addBankActivity(db, label)
    }

    // ── 13. Set Cooldown (setelah pull selesai, bukan saat mulai) ──────────
    setMonsterCooldown(sender, 1)

    console.log(`☠️ MONSTER PULL [single] ${sender} → ${applied.character?.name ?? 'carats'} (${applied.type})`)

  } catch (err) {
    console.log('❌ MONSTER PULL ERROR:', err)
    // Kembalikan carats jika roll belum sempat diproses
    addCarats(user, cfg.singlePrice)
    try { await m.reply('❌ Absolute Monster Pull Error. Carats dikembalikan.') } catch {}
  } finally {
    // ── 14. Cleanup + Unlock ────────────────────────────────────────────────
    cleanupMonsterCache(sender)
    releaseMonsterLock(sender)
  }
}

// ════════════════════════════════════════════════════════════════════════
// 🎊  SECTION 17 — HANDLE MULTI PULL
// ════════════════════════════════════════════════════════════════════════

/**
 * handleMonsterMulti — Multi Pull (×10 hingga ×500).
 * Dipanggil oleh banner.js saat Event aktif + user menjalankan .lmulti
 */
export const handleMonsterMulti = async (naze, m, db, user, count = 10) => {
  const sender     = m.sender
  const senderName = user.name || sender.split('@')[0]
  const cfg        = monsterConfig

  // Validasi count
  const MULTI =
    Number.isInteger(Number(count)) &&
    Number(count) >= 10 &&
    Number(count) <= 500 &&
    Number(count) % 10 === 0
      ? Number(count)
      : 10

  const multiPrice = Math.floor(cfg.multiPrice * (MULTI / 10))

  // ── 1. Validasi Event ────────────────────────────────────────────────
  if (!isMonsterActive()) {
    return m.reply('❌ Event Absolute Monster tidak aktif.')
  }

  // ── 2. Cooldown Check ────────────────────────────────────────────────
  const cd = checkMonsterCooldown(sender)
  if (cd.active) {
    return m.reply([
      '⏳ Absolute Monster masih tertidur...',
      '',
      `Silakan tunggu:`,
      `${formatCooldownMs(cd.remaining)}`,
      '',
      'lagi sebelum mencoba memanggilnya kembali.'
    ].join('\n'))
  }

  // ── 3. Queue / Anti-Spam ─────────────────────────────────────────────
  if (isMonsterQueued(sender)) {
    if (!isQueueWarned(sender)) {
      markQueueWarned(sender)
      return m.reply('⏳ Summon sedang berjalan. Harap tunggu hingga selesai.')
    }
    return
  }

  // ── 4. Acquire Lock ──────────────────────────────────────────────────
  if (!acquireMonsterLock(sender)) return

  try {
    // ── 5. Validasi User ─────────────────────────────────────────────────
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    // ── 6. Complete Check ─────────────────────────────────────────────────
    const allOwned = monsterAbsolutePool.length > 0 &&
      monsterAbsolutePool.every(c => hasCharacter(user, c.id))
    if (allOwned) {
      return m.reply(
        '🎉 Semua Absolute Monster sudah kamu miliki.\n\n' +
        'Karakter Monster tidak dapat diperoleh dua kali.\n\n' +
        'Silakan tunggu Event Absolute Monster berikutnya.'
      )
    }

    // ── 7. Validasi Carats ────────────────────────────────────────────────
    if (!hasEnoughCarats(user, multiPrice)) {
      return m.reply(
        `❌ Carats tidak cukup!\n\n💰 Dibutuhkan : ${formatCarats(multiPrice)}\n💰 Carats kamu : ${formatCarats(user.money)}`
      )
    }
    spendCarats(user, multiPrice)
    if (db?.bank) {
      db.bank.kas             = (db.bank.kas ?? 0) + multiPrice
      db.bank.danaMasuk       = (db.bank.danaMasuk ?? 0) + multiPrice
      db.bank.totalPembelian  = (db.bank.totalPembelian ?? 0) + 1
    }

    // ── 8. Roll semua ──────────────────────────────────────────────────────
    // OPTIMASI: bangun ownedSet sekali (O(1) per-char check) dan pre-build pool
    // Tanpa ini: 500 pull × filter(inventory) = ribuan operasi O(n)
    const ownedSet    = new Set((user.inventory ?? []).map(c => c.id))
    let   activePool  = buildMonsterDynamicPool(user, ownedSet)

    const results        = []
    let totalCaratBonus  = 0
    let hasJackpot       = false

    for (let i = 0; i < MULTI; i++) {
      const pityNow = getMonsterPity(user)
      // Gunakan pre-built pool — O(1) per roll bukan O(n)
      const roll    = doMonsterRoll(user, pityNow, activePool)

      // Setelah dapat absolute, hapus dari pool supaya tidak duplikat
      if (roll.type === 'absolute' && roll.character) {
        ownedSet.add(roll.character.id)
        activePool = buildMonsterDynamicPool(user, ownedSet)
      }

      // Garansi minimal 1 Epic setiap 10 pull (slot terakhir di batch)
      let finalRoll = roll
      if ((i + 1) % 10 === 0 && !hasJackpot) {
        const typePriority = ['absolute', 'legend', 'epic']
        if (!typePriority.includes(roll.type)) {
          const epicChar = _pick(monsterEpicPool)
          finalRoll = { type: 'epic', character: epicChar }
        }
      }

      const applied = applyMonsterRoll(user, finalRoll, db, senderName)

      if (applied.type === 'absolute') hasJackpot = true
      if (applied.type === 'carats')  totalCaratBonus += applied.carats ?? 0

      results.push(applied)
    }

    rollCache.set(sender, results)

    // ── 9. Animasi ─────────────────────────────────────────────────────────
    await runMonsterMultiAnimation(naze, m, sender, MULTI, hasJackpot)

    if (!results.length) {
      addCarats(user, multiPrice)
      return m.reply('❌ Gagal memproses pull. Carats dikembalikan.')
    }

    // ── 10. Caption ────────────────────────────────────────────────────────
    const caption = buildMonsterCaption(results, totalCaratBonus)
    captionCache.set(sender, caption)

    // ── 11. Thumbnail terbaik ──────────────────────────────────────────────
    const thumbChar = getMonsterThumbnailChar(results)
const imageUrl  = !thumbChar ? null
  : thumbChar.rarity === 'absolute'
    ? getMonsterImage(thumbChar.image)
    : getCharacterImage(thumbChar)

    if (imageUrl) {
      await naze.sendMessage(m.chat, { image: { url: imageUrl }, caption }, { quoted: m })
    } else {
      await m.reply(caption)
    }

    // ── 12. Bank Activity ──────────────────────────────────────────────────
    if (db?.bank) {
      addBankActivity(db, `☠️ ${senderName} melakukan Monster Multi ×${MULTI}${hasJackpot ? ' — JACKPOT!' : ''}`)
    }

    // ── 13. Set Cooldown (setelah pull selesai) ────────────────────────────
    setMonsterCooldown(sender, MULTI)

    console.log(`☠️ MONSTER MULTI [×${MULTI}] ${sender} — ${results.length} hasil, jackpot=${hasJackpot}`)

  } catch (err) {
    console.log('❌ MONSTER MULTI ERROR:', err)
    addCarats(user, multiPrice)
    try { await m.reply('❌ Absolute Monster Multi Error. Carats dikembalikan.') } catch {}
  } finally {
    // ── 14. Cleanup + Unlock ────────────────────────────────────────────────
    cleanupMonsterCache(sender)
    releaseMonsterLock(sender)
  }
}

// ════════════════════════════════════════════════════════════════════════
// 🔎  SECTION 18 — INFO BANNER
// ════════════════════════════════════════════════════════════════════════

export const buildMonsterInfo = (user) => {
  const cfg     = monsterConfig
  const pity    = user ? getMonsterPity(user) : 0
  const stat    = user ? ensureBannerStat(user, 'monster') : {}
  const chars   = monsterAbsolutePool.map(c => `☠️ ${c.name}`).join('\n')

  return [
    '☠️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗠𝗢𝗡𝗦𝗧𝗘𝗥',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '⚠️ Ini bukan Banner Limited biasa.',
    'Ini adalah mode permainan berbeda.',
    '',
    `📋 Karakter Monster:`,
    chars,
    '',
    `📊 Rate:`,
    `☠️ Absolute : ${(cfg.absoluteRate * 100).toFixed(1)}%`,
    `🔴 Legend   : ${(cfg.legendRate * 100).toFixed(1)}%`,
    `⚫ Epic     : ${(cfg.epicRate * 100).toFixed(1)}%`,
    `💰 Carats   : ${(cfg.caratRate * 100).toFixed(1)}%`,
    '',
    `🎯 Soft Pity : ${cfg.softPity} pull`,
    `🎯 Hard Pity : ${cfg.hardPity} pull`,
    `🎯 Pity saat ini: ${pity}`,
    '',
    `💰 Single : ${formatCarats(cfg.singlePrice)} Carats`,
    `💰 Multi ×10 : ${formatCarats(cfg.multiPrice)} Carats`,
    '',
    `📊 Total Pull: ${stat.totalPull ?? 0}`,
    `☠️ Total Absolute: ${stat.totalAbsolute ?? 0}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n')
}

// ════════════════════════════════════════════════════════════════════════
// ✅  SECTION 19 — VALIDATION SYSTEM
// ════════════════════════════════════════════════════════════════════════

/**
 * validateMonsterSystem — cek integritas seluruh sistem.
 * Dipanggil saat startup atau oleh owner.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export const validateMonsterSystem = () => {
  const errors = []

  // Cek character pool
  if (!monsterPool?.length) {
    errors.push('monsterPool kosong')
  }

  for (const char of monsterPool) {
    if (!char.id)         errors.push(`Karakter tanpa id: ${JSON.stringify(char)}`)
    if (!char.name)       errors.push(`Karakter tanpa name: ${char.id}`)
    if (!char.rarity)     errors.push(`Karakter tanpa rarity: ${char.id}`)
    if (!char.stats)      errors.push(`Karakter tanpa stats: ${char.id}`)
    if (!char.skill)      errors.push(`Karakter tanpa skill: ${char.id}`)
    if (!char.quotes)     errors.push(`Karakter tanpa quotes: ${char.id}`)

    // Cek quote pools
    const cats = ['summonStart', 'summonMiddle', 'summonFinal', 'jackpot', 'win', 'lose', 'profile', 'idle']
    for (const cat of cats) {
      const pool = char.quotes?.[cat]
      if (!Array.isArray(pool) || pool.length < 5) {
        errors.push(`Quote pool '${cat}' kurang untuk karakter ${char.id} (ada ${pool?.length ?? 0}, min 5)`)
      }
    }
  }

  // Cek config
  const cfg = monsterConfig
  if (cfg.absoluteRate <= 0 || cfg.absoluteRate >= 1) errors.push('absoluteRate tidak valid')
  if (cfg.legendRate   <= 0 || cfg.legendRate   >= 1) errors.push('legendRate tidak valid')
  if (cfg.singlePrice  <= 0)                          errors.push('singlePrice tidak valid')
  if (cfg.multiPrice   <= 0)                          errors.push('multiPrice tidak valid')

  // Cek event
  if (!monsterEvent.id)   errors.push('monsterEvent.id tidak ada')
  if (!monsterEvent.name) errors.push('monsterEvent.name tidak ada')

  // Cek pool tidak kosong
  if (!monsterAbsolutePool.length) errors.push('monsterAbsolutePool kosong')
  if (!monsterLegendPool?.length)  errors.push('monsterLegendPool kosong')
  if (!monsterEpicPool?.length)    errors.push('monsterEpicPool kosong')

  return { ok: errors.length === 0, errors }
}

// ════════════════════════════════════════════════════════════════════════
// 🧹  SECTION 20 — PERIODIC CLEANUP
// ════════════════════════════════════════════════════════════════════════

const CLEANUP_INTERVAL = 10 * 60 * 1000  // 10 menit

const periodicCleanup = () => {
  const now = Date.now()
  let cleaned = 0

  // Cooldown yang sudah kadaluwarsa
  for (const [sender, entry] of cooldownStore.entries()) {
    if (entry.endTime < now) {
      cooldownStore.delete(sender)
      cleaned++
    }
  }

  // Lock yang tertinggal lebih dari 5 menit (safeguard crash)
  for (const [sender] of queueLock.entries()) {
    // Tidak ada timestamp di lock — skip, lock normal dilepas via finally
    // Ini hanya backup jika finally gagal ekstrem
  }

  if (cleaned > 0) console.log(`☠️ [MONSTER CLEANUP] ${cleaned} expired cooldown dibersihkan`)
}

let _cleanTimer = null
const startPeriodicCleanup = () => {
  if (_cleanTimer) return
  _cleanTimer = setInterval(periodicCleanup, CLEANUP_INTERVAL)
}
startPeriodicCleanup()

// ════════════════════════════════════════════════════════════════════════
// 🚀  SECTION 21 — EXPORT SUMMARY
// ════════════════════════════════════════════════════════════════════════
//
// Semua export tersedia:
//
// monsterConfig              — master config
// monsterEvent               — object event
// monsterPool                — semua karakter Monster
// monsterAbsolutePool        — pool rarity absolute
// monsterLegendPool          — pool legend (dari bannerPool)
// monsterEpicPool            — pool epic (dari bannerPool)
// monsterCarats              — config carat reward
// monsterChance              — ringkasan peluang
// monsterThumbnail           — nama-nama thumbnail
// monsterAudio               — hook audio (belum aktif)
//
// isMonsterActive()          — cek event aktif
// getMonsterBanner()         — dapatkan event object
// activateMonsterEvent()     — owner: aktifkan event
// deactivateMonsterEvent()   — owner: nonaktifkan event
//
// getMonsterCooldown(n)      — hitung cooldown berdasarkan jumlah pull
// setMonsterCooldown(s, n)   — set cooldown untuk user
// checkMonsterCooldown(s)    — cek cooldown user
//
// isMonsterQueued(s)         — cek apakah user sedang dalam queue
//
// buildMonsterCaption(r, c)  — caption multi pull
// buildMonsterAnimation(p,q) — teks animasi (fase)
// buildMonsterInfo(user)     — info banner untuk .lbanner
// getMonsterThumbnailChar(r) — ambil karakter terbaik untuk thumbnail
//
// handleMonsterPull(...)     — single pull handler (dipanggil banner.js)
// handleMonsterMulti(...)    — multi pull handler (dipanggil banner.js)
//
// cleanupMonsterCache(s)     — bersihkan cache
// clearMonsterQueue(s)       — bersihkan queue
// validateMonsterSystem()    — validasi sistem
//
// ════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════
// 🚀 SECTION 22 — SYSTEM INFORMATION
// ════════════════════════════════════════════════════════════════════════
//
// Informasi internal sistem Absolute Monster.
// Digunakan untuk monitoring, debug, dan Owner Command.
// Tidak mempengaruhi sistem gacha.
//
// ════════════════════════════════════════════════════════════════════════

export const monsterVersion = {
  name: 'Absolute Monster System',
  version: '1.0.0',
  build: 1,
  status: 'Stable',
  author: 'Project Tracen',
  lastUpdate: '2026',
  blueprint: 'Completed'
}

export function getMonsterStats() {
  return {
    system: monsterVersion.name,
    version: monsterVersion.version,
    build: monsterVersion.build,
    status: monsterVersion.status,
    eventActive: isMonsterActive(),

    totalAbsolute: monsterAbsolutePool.length,
    totalLegend: monsterLegendPool.length,
    totalEpic: monsterEpicPool.length,

    queueUser: monsterQueue.size,
    cooldownUser: monsterCooldownCache.size,
    cacheObject: monsterCache.size,
    
    audioHook: Object.keys(monsterAudio).length,
    thumbnailHook: Object.keys(monsterThumbnail).length
  }
}

// Jalankan validasi saat modul dimuat
const _v = validateMonsterSystem()
if (_v.ok) {
  console.log('☠️ [ABSOLUTE MONSTER SYSTEM v1.0] LOADED — validasi OK')
} else {
  console.warn('☠️ [ABSOLUTE MONSTER SYSTEM] LOAD WARNING:', _v.errors.join(', '))
}
