// ================================
// 🏅 EXCHANGE SHOP ENGINE
// ================================
//
// Mengelola Exchange Shop: tukar Medal → Character / Item.
// Banner.js mengirimkan Medal melalui giveDuplicateReward.
// Exchange tidak melakukan pull, hanya menukar item.

import { getCharacterById, allCharacters } from './karakterHelper.js'
import {
  hasEnoughMedal, spendMedal, addMedal,
  addCarats, addTicket, formatMedal, formatCarats,
  addCharacterToInventory, hasCharacter, validateAmount
} from './helper.js'
import { addBankActivity } from '../bankaktivitas.js'

// ================================
// 🏅 EXCHANGE CONFIGURATION
// ================================

export const EXCHANGE_CONFIG = {
  enable: true,
  dailyReset: false,
  monthlyReset: true,
  ownerMode: true,
  image: null,  // gambar diambil via umaimage.js saat digunakan
  description: 'Tukar Medal dari duplikat menjadi Character atau Item eksklusif!'
}

// ================================
// 🏪 EXCHANGE ITEM CATALOG
// ================================

export const exchangeCatalog = [
  // ── Characters ──
  {
    id: 'exc_oguri',
    label: 'Oguri Cap',
    type: 'character',
    characterId: 'oguri_banner',
    cost: 350,
    desc: 'Legenda Tracen yang paling lapar.',
    available: true,
    monthlyLimit: 1
  },
  {
    id: 'exc_rudolf',
    label: 'Symboli Rudolf',
    type: 'character',
    characterId: 'rudolf_banner',
    cost: 350,
    desc: 'Kaisar Tracen Academy.',
    available: true,
    monthlyLimit: 1
  },
  {
    id: 'exc_maruzensky',
    label: 'Maruzensky',
    type: 'character',
    characterId: 'maruzensky_banner',
    cost: 300,
    desc: 'Ratu kecepatan.',
    available: true,
    monthlyLimit: 1
  },
  {
    id: 'exc_teio',
    label: 'Tokai Teio',
    type: 'character',
    characterId: 'teio_banner',
    cost: 150,
    desc: 'Bintang yang selalu bangkit.',
    available: true,
    monthlyLimit: 2
  },
  {
    id: 'exc_mcqueen',
    label: 'Mejiro McQueen',
    type: 'character',
    characterId: 'mcqueen_banner',
    cost: 150,
    desc: 'Keanggunan di atas lintasan.',
    available: true,
    monthlyLimit: 2
  },
  {
    id: 'exc_bourbon',
    label: 'Mihono Bourbon',
    type: 'character',
    characterId: 'bourbon_banner',
    cost: 150,
    desc: 'Uma Musume kalkulasi sempurna.',
    available: true,
    monthlyLimit: 2
  },
  {
    id: 'exc_airgroove',
    label: 'Air Groove',
    type: 'character',
    characterId: 'airgroove_banner',
    cost: 150,
    desc: 'Ratu yang tenang dan berwibawa.',
    available: true,
    monthlyLimit: 2
  },
  {
    id: 'exc_specialweek',
    label: 'Special Week',
    type: 'character',
    characterId: 'specialweek_banner',
    cost: 80,
    desc: 'Uma Musume paling bersemangat.',
    available: true,
    monthlyLimit: 3
  },
  {
    id: 'exc_rice',
    label: 'Rice Shower',
    type: 'character',
    characterId: 'rice_banner',
    cost: 80,
    desc: 'Uma pemalu penuh determinasi.',
    available: true,
    monthlyLimit: 3
  },
  {
    id: 'exc_goldship',
    label: 'Gold Ship',
    type: 'character',
    characterId: 'goldship_banner',
    cost: 80,
    desc: 'Uma kacau tapi mengejutkan kuat.',
    available: true,
    monthlyLimit: 3
  },
  // ── Tickets ──
  {
    id: 'exc_ticket_banner',
    label: 'Banner Ticket ×1',
    type: 'ticket',
    ticketType: 'banner',
    ticketAmount: 1,
    cost: 50,
    desc: 'Ticket pull di banner permanent.',
    available: true,
    monthlyLimit: 10
  },
  {
    id: 'exc_ticket_limited',
    label: 'Limited Ticket ×1',
    type: 'ticket',
    ticketType: 'limited',
    ticketAmount: 1,
    cost: 80,
    desc: 'Ticket pull di banner limited.',
    available: true,
    monthlyLimit: 5
  },
  // ── Carats ──
  {
    id: 'exc_carats_sm',
    label: 'Carats 1.000',
    type: 'carats',
    caratAmount: 1000,
    cost: 30,
    desc: '1.000 Carats langsung ke dompet.',
    available: true,
    monthlyLimit: 20
  },
  {
    id: 'exc_carats_md',
    label: 'Carats 10.000',
    type: 'carats',
    caratAmount: 10000,
    cost: 120,
    desc: '10.000 Carats untuk terus berpetualang.',
    available: true,
    monthlyLimit: 10
  },
  {
    id: 'exc_carats_lg',
    label: 'Carats 50.000',
    type: 'carats',
    caratAmount: 50000,
    cost: 450,
    desc: '50.000 Carats paket hemat.',
    available: true,
    monthlyLimit: 5
  }
]

// ================================
// 📦 EXCHANGE DATA INIT
// ================================

const getCurrentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}`
}

export const ensureExchangeData = (user) => {
  if (user.medal == null) user.medal = 0
  if (!user.exchangeHistory) user.exchangeHistory = []
  if (!user.exchangeLimit) user.exchangeLimit = {}
  if (!user.exchangeResetMonth) user.exchangeResetMonth = getCurrentMonth()
}

const checkMonthlyReset = (user) => {
  const thisMonth = getCurrentMonth()
  if (user.exchangeResetMonth !== thisMonth) {
    user.exchangeResetMonth = thisMonth
    user.exchangeLimit = {}
  }
}

const getExchangeCount = (user, itemId) => {
  checkMonthlyReset(user)
  return user.exchangeLimit?.[itemId] ?? 0
}

const incrementExchangeCount = (user, itemId) => {
  if (!user.exchangeLimit) user.exchangeLimit = {}
  user.exchangeLimit[itemId] = (user.exchangeLimit[itemId] ?? 0) + 1
}

// ================================
// 🏪 EXCHANGE SHOP DISPLAY
// ================================

export const buildExchangeMenu = (user) => {
  ensureExchangeData(user)
  checkMonthlyReset(user)

  const charItems = exchangeCatalog.filter(i => i.type === 'character' && i.available)
  const itemItems = exchangeCatalog.filter(i => i.type !== 'character' && i.available)

  const fmt = (item) => {
    const used = getExchangeCount(user, item.id)
    const lim = item.monthlyLimit ?? 99
    const limStr = used >= lim ? ' ❌ Habis' : ` (${used}/${lim}/bulan)`
    return `• ${item.label} — 🏅 ${item.cost}${limStr}`
  }

  return [
    `🏅 𝗘𝗫𝗖𝗛𝗔𝗡𝗚𝗘 𝗦𝗛𝗢𝗣`,
    '',
    `🏅 Medal kamu: ${formatMedal(user.medal)}`,
    '',
    '🏇 Character',
    ...charItems.map(fmt),
    '',
    '🎁 Item & Reward',
    ...itemItems.map(fmt),
    '',
    '💡 Cara pakai: .exchange <nama>',
    'Contoh: .exchange oguri',
    'Atau: .exchange ticket'
  ].join('\n')
}

// ================================
// 🔄 EXCHANGE PROCESS
// ================================

export const processExchange = (user, query, db, senderName) => {
  ensureExchangeData(user)
  if (!query) {
    return { success: false, message: buildExchangeMenu(user) }
  }

  const lower = query.toLowerCase().trim()

  // Cari item di katalog
  const item = exchangeCatalog.find(i =>
    i.available && (
      i.id === lower ||
      i.label.toLowerCase().includes(lower) ||
      (i.type === 'character' && lower.includes(i.label.toLowerCase().split(' ')[0].toLowerCase()))
    )
  )

  if (!item) {
    return {
      success: false,
      message: `❌ Item tidak ditemukan: *${query}*\n\nGunakan .exchange untuk melihat daftar.`
    }
  }

  if (!item.available) {
    return { success: false, message: `❌ Item '${item.label}' sedang tidak tersedia.` }
  }

  // Cek limit bulanan
  checkMonthlyReset(user)
  const used = getExchangeCount(user, item.id)
  const lim = item.monthlyLimit ?? 99
  if (used >= lim) {
    return {
      success: false,
      message: `❌ Limit exchange *${item.label}* sudah habis bulan ini.\n\n🔁 Limit: ${lim}×/bulan`
    }
  }

  // Cek medal
  if (!hasEnoughMedal(user, item.cost)) {
    return {
      success: false,
      message: [
        `❌ Medal tidak cukup!`,
        '',
        `🏅 Dibutuhkan : ${formatMedal(item.cost)}`,
        `🏅 Medal kamu : ${formatMedal(user.medal)}`
      ].join('\n')
    }
  }

  // Kurangi medal
  spendMedal(user, item.cost)

  let msg = ''
  let resultData = {}

  if (item.type === 'character') {
    const character = getCharacterById(item.characterId)
    if (!character) {
      // Kembalikan medal jika data rusak
      addMedal(user, item.cost)
      return { success: false, message: '❌ Data karakter tidak ditemukan. Medal dikembalikan.' }
    }

    const { isDuplicate } = addCharacterToInventory(user, character, 'exchange')

    if (isDuplicate) {
      const refund = Math.floor(item.cost * 0.5)
      addMedal(user, refund)
      msg = [
        `✨ 𝗗𝗨𝗣𝗟𝗜𝗞𝗔𝗧!`,
        '',
        `🏇 ${character.name} sudah ada di koleksimu.`,
        `🏅 Medal dikembalikan: ${refund}`,
        `🏅 Sisa Medal: ${formatMedal(user.medal)}`
      ].join('\n')
    } else {
      msg = [
        `✅ 𝗘𝗫𝗖𝗛𝗔𝗡𝗚𝗘 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟`,
        '',
        `🏇 ${character.name} bergabung ke koleksimu!`,
        `🏅 Medal digunakan: ${formatMedal(item.cost)}`,
        `🏅 Sisa Medal: ${formatMedal(user.medal)}`
      ].join('\n')
    }

    resultData = { type: 'character', character, isDuplicate }

  } else if (item.type === 'ticket') {
    addTicket(user, item.ticketType, item.ticketAmount)
    msg = [
      `✅ 𝗘𝗫𝗖𝗛𝗔𝗡𝗚𝗘 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟`,
      '',
      `🎫 ${item.label} ditambahkan!`,
      `🏅 Medal digunakan: ${formatMedal(item.cost)}`,
      `🏅 Sisa Medal: ${formatMedal(user.medal)}`
    ].join('\n')
    resultData = { type: 'ticket', ticketType: item.ticketType, amount: item.ticketAmount }

  } else if (item.type === 'carats') {
    addCarats(user, item.caratAmount)
    msg = [
      `✅ 𝗘𝗫𝗖𝗛𝗔𝗡𝗚𝗘 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟`,
      '',
      `💰 ${formatCarats(item.caratAmount)} Carats ditambahkan!`,
      `🏅 Medal digunakan: ${formatMedal(item.cost)}`,
      `🏅 Sisa Medal: ${formatMedal(user.medal)}`
    ].join('\n')
    resultData = { type: 'carats', amount: item.caratAmount }
  }

  // Rekam
  incrementExchangeCount(user, item.id)
  recordExchangeHistory(user, item, resultData)

  if (db?.bank && senderName) {
    addBankActivity(db, `🏅 ${senderName} menukar ${item.cost} Medal untuk ${item.label}`)
  }

  return { success: true, message: msg, data: resultData }
}

// ================================
// 📜 EXCHANGE HISTORY
// ================================

const recordExchangeHistory = (user, item, resultData) => {
  ensureExchangeData(user)
  user.exchangeHistory.unshift({
    item: item.label,
    type: item.type,
    cost: item.cost,
    result: resultData,
    time: Date.now()
  })
  if (user.exchangeHistory.length > 30) user.exchangeHistory.splice(30)
}

export const buildExchangeHistory = (user, limit = 10) => {
  ensureExchangeData(user)
  const hist = user.exchangeHistory
  if (!hist.length) return '─ Belum ada riwayat exchange ─'
  return hist
    .slice(0, limit)
    .map((h, i) => {
      const t = new Date(h.time).toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit'
      })
      return `${i + 1}. ${h.item} — 🏅 ${h.cost} Medal\n   🕒 ${t}`
    })
    .join('\n\n')
}

// ================================
// 📊 EXCHANGE STATISTIC
// ================================

export const buildExchangeStat = (user) => {
  ensureExchangeData(user)
  const hist = user.exchangeHistory
  const total = hist.length
  const chars = hist.filter(h => h.type === 'character').length
  const items = hist.filter(h => h.type !== 'character').length
  const spent = hist.reduce((a, h) => a + (h.cost ?? 0), 0)
  return [
    `📊 𝗘𝗫𝗖𝗛𝗔𝗡𝗚𝗘 𝗦𝗧𝗔𝗧𝗜𝗦𝗧𝗜𝗖`,
    '',
    `🔄 Total Exchange : ${total}`,
    `🏇 Character      : ${chars}`,
    `🎁 Item           : ${items}`,
    `🏅 Medal dipakai  : ${formatMedal(spent)}`,
    `🏅 Medal tersisa  : ${formatMedal(user.medal)}`
  ].join('\n')
}

// ================================
// 👑 OWNER MODE
// ================================

export const ownerGiveMedal = (user, amount) => {
  ensureExchangeData(user)
  addMedal(user, amount)
  return { success: true, medal: user.medal }
}

export const ownerResetExchange = (user) => {
  user.exchangeLimit = {}
  user.exchangeResetMonth = getCurrentMonth()
  return { success: true }
}

console.log('🏅 EXCHANGE LOADED')
