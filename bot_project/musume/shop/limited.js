// ================================
// 🌸 LIMITED BANNER MANAGER
// ================================
//
// Mengelola konfigurasi dan logika banner Limited.
// Roll dilakukan oleh banner.js menggunakan data dari file ini.
// Limited.js tidak melakukan pull sendiri.

import {
  limitedPool, limitedBannerList
} from './karakter.js'

import { getLimitedImage 
} from '../umaimage.js'

import {
  isEventActive, formatCountdown, formatCarats,
  ensurePity, getPityCount, resetPity, incrementPity,
  addTicket, spendTicket, getTicketCount,
  addCarats
} from './helper.js'

// ================================
// 🌸 LIMITED CONFIGURATION
// ================================

export const LIMITED_CONFIG = {
  singlePrice: 1000,
  multiPrice: 10000,
  ticketType: 'limited',
  softPity: 85,
  hardPity: 200,
  limitedRate: 0.001,
  legendRate: 0.06,
  rateUpBonus: 0.25,
  enableAnimation: true,
  enableOwnerTest: true
}

// ================================
// 📅 LIMITED EVENT LIST
// ================================
const SUMMER_KARAKTER = [
  'maruzensky_summer',
  'gold_ship_summer',
  'mejiro_mcqueen_summer',
  'special_week_summer'
]

const FESTIVAL_KARAKTER = [
  'tokai_teio_festival',
  'symboli_rudolf_festival',
  'tamamo_cross_festival'
]

export const limitedEvents = [
  {
    id: 'cinderella_gray',
    name: '♠️ Cinderella Gray',
    description: 'Oguri Cap [Ashen Miracle] hadir sebagai karakter Limited eksklusif.\nRate Up 25% untuk karakter utama selama event berlangsung.',
    image: 'oguri_limited',
    icon: '⚫',
    color: '⚪',
    active: false,
    startTime: null,
    endTime: null,
    rateUpCharacters: ['oguri_ashen_miracle'],
    pool: limitedPool.filter(c =>
      ['oguri_ashen_miracle'].includes(c.id)
    ),
    firstPullBonus: true
  },

  {
    id: 'summer_festival',
    name: '🌊 Summer Festival',
    description: 'Karakter Summer hadir sebagai Limited eksklusif.\nRate Up 25% untuk seluruh karakter Summer selama event berlangsung.',
    image: 'summer_banner',
    icon: '🌊',
    color: '💙',
    active: false,
    startTime: null,
    endTime: null,
    rateUpCharacters: SUMMER_KARAKTER,
    pool: limitedPool.filter(c =>
      SUMMER_KARAKTER.includes(c.id)
    ),
    firstPullBonus: true
  },

  {
    id: 'festival',
    name: '🎆 Festival Night',
    description: 'Karakter Festival hadir sebagai Limited eksklusif.\nRate Up 25% untuk seluruh karakter Festival selama event berlangsung.',
    image: 'festival_banner',
    icon: '🎆',
    color: '🧡',
    active: false,
    startTime: null,
    endTime: null,
    rateUpCharacters: FESTIVAL_KARAKTER,
    pool: limitedPool.filter(c =>
      FESTIVAL_KARAKTER.includes(c.id)
    ),
    firstPullBonus: true
  }

  // Tambahkan event baru di sini
]

// ================================
// 🏇 EVENT HELPERS
// ================================

export const getActiveEvent = () =>
  limitedEvents.find(e => isEventActive(e)) ?? null

export const getActiveLimitedIcon = () => {
  const event = getActiveEvent()
  return event?.icon ?? '✨'
}

export const getLimitedPool = (event) =>
  event?.pool ?? []

export const getRateUpCharacters = (event) =>
  event?.rateUpCharacters ?? []

// ================================
// ⭐ RATE UP INFO
// ================================

export const buildRateUpInfo = (event) => {
  if (!event) return buildEventInfo(null)
  const chars = event.rateUpCharacters
    .map(id => event.pool.find(c => c.id === id)?.name ?? id)
    .join(', ')
  return [
    `🌸 𝗟𝗜𝗠𝗜𝗧𝗘𝗗 𝗕𝗔𝗡𝗡𝗘𝗥`,
    '',
    `📅 ${event.name}`,
    `📝 ${event.description}`,
    '',
    `⭐ Rate Up Character:`,
    chars,
    '',
    `📊 Rate:`,
    `🌸 Rate Up  : ${(LIMITED_CONFIG.legendRate * 100).toFixed(0)}%`,
    `🟣 Epic     : 35%`,
    `🔵 Rare     : 59%`,
    '',
    `🎯 Soft Pity : ${LIMITED_CONFIG.softPity} pull`,
    `🎯 Hard Pity : ${LIMITED_CONFIG.hardPity} pull`,
    '',
    event.endTime
      ? `⏳ Berakhir dalam: ${formatCountdown(event.endTime)}`
      : '⏳ Tanpa batas waktu',
    '',
    `💰 Single : ${formatCarats(LIMITED_CONFIG.singlePrice)} Carats`,
    `💰 Multi ×10 : ${formatCarats(LIMITED_CONFIG.multiPrice)} Carats`,
    `💰 Multi ×30 : ${formatCarats(LIMITED_CONFIG.multiPrice * 3)} Carats`,
    `💰 Multi ×50 : ${formatCarats(LIMITED_CONFIG.multiPrice * 5)} Carats`
  ].join('\n')
}

export const buildEventInfo = (event) => {
  if (!event) {
    return [
      `🌸 𝗟𝗜𝗠𝗜𝗧𝗘𝗗 𝗕𝗔𝗡𝗡𝗘𝗥`,
      '',
      '❌ Tidak ada event Limited aktif saat ini.',
      '',
      'Pantau terus untuk event berikutnya! 🌸'
    ].join('\n')
  }
  return buildRateUpInfo(event)
}

// ================================
// 🏅 LIMITED PITY
// ================================

export const getLimitedPityCount = (user) =>
  getPityCount(user, 'limited')

export const ensureLimitedPity = (user) =>
  ensurePity(user, 'limited')

export const incrementLimitedPity = (user) =>
  incrementPity(user, 'limited')

export const resetLimitedPity = (user) =>
  resetPity(user, 'limited')

// ================================
// 🎁 LIMITED BONUS
// ================================

export const checkFirstPullBonus = (user, eventId) => {
  if (!user.limitedBonus) user.limitedBonus = {}
  if (user.limitedBonus[eventId]) return false
  user.limitedBonus[eventId] = true
  return true
}

// ================================
// 📊 LIMITED STAT
// ================================

export const ensureLimitedStat = (user) => {
  if (!user.bannerStats) user.bannerStats = {}
  if (!user.bannerStats.limited) {
    user.bannerStats.limited = {
      totalPull: 0,
      totalRare: 0,
      totalEpic: 0,
      totalLegend: 0,
      totalDuplicate: 0,
      totalMedal: 0,
      totalCaratsSpent: 0
    }
  }
  return user.bannerStats.limited
}

// ================================
// 📜 LIMITED HISTORY
// ================================

export const ensureLimitedHistory = (user) => {
  if (!user.bannerHistory) user.bannerHistory = {}
  if (!user.bannerHistory.limited) user.bannerHistory.limited = []
  return user.bannerHistory.limited
}

// ================================
// 👑 OWNER MODE
// ================================

export const ownerActivateEvent = (eventId, durationMs = null) => {
  const event = limitedEvents.find(e => e.id === eventId)
  if (!event) return { success: false, message: `❌ Event '${eventId}' tidak ditemukan.` }
  limitedEvents.forEach(e => { e.active = false })
  event.active = true
  if (durationMs) {
    event.startTime = Date.now()
    event.endTime = Date.now() + durationMs
  } else {
    event.startTime = null
    event.endTime = null
  }
  return { success: true, event }
}

export const ownerDeactivateEvent = (eventId) => {
  const event = limitedEvents.find(e => e.id === eventId)
  if (!event) return { success: false }
  event.active = false
  return { success: true }
}

// Daftar semua event (untuk owner lihat list)
export const getAllEvents = () =>
  limitedEvents.map(e => ({
    id: e.id,
    name: e.name,
    active: isEventActive(e),
    rateUp: e.rateUpCharacters.join(', ')
  }))

// ================================
// 🚀 EXPORT
// ================================

export { limitedPool }

console.log('🌸 LIMITED LOADED')
