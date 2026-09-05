/*
========================================
🏇 TRACEN UMA BANNER ENGINE v2.0
========================================

Engine utama sistem Gacha Tracen.
Semua banner (Normal, Limited, Event) menggunakan engine ini.
Jangan membuat engine banner baru.

TERHUBUNG DENGAN:
  helper.js       → Utility umum
  karakter.js     → Pool karakter
  karakterHelper.js → Database karakter
  limited.js      → Data Limited Banner
  exchange.js     → Reward duplicate/medal
  uma.js          → Command controller
  garbage/cleaner.js → Pembersihan data sementara
========================================
*/

import {
  bannerPool, allCharacterPool, getCharacterById
} from './karakter.js'

import {
  randomNumber, pickRandom,
  rollRarity, rollCharacter, calcLegendRate, BASE_RATES,
  hasEnoughCarats, spendCarats, addCarats, addMedal,
  formatCarats, formatMedal,
  addCharacterToInventory, hasCharacter,
  ensurePity, incrementPity, resetPity, getPityCount,
  ensureBannerStat, recordPullStat,
  ensureBannerHistory, recordPullHistory, formatHistory, formatStat,
  giveDuplicateReward, buildPullCaption, buildMultiCaption,
  rarityRevealText, rarityLabel, getRarityIcon,
  delay, checkCooldown, formatCooldown,
  addTicket, spendTicket, getTicketCount,
  ownerGiveCharacter, validateUser
} from './helper.js'

import {
  getActiveEvent, getLimitedPool, getRateUpCharacters,
  buildEventInfo, buildRateUpInfo,
  LIMITED_CONFIG, ensureLimitedStat, ensureLimitedHistory,
  checkFirstPullBonus, getLimitedPityCount, ensureLimitedPity,
  incrementLimitedPity, resetLimitedPity, getAllEvents,
  ownerActivateEvent, ownerDeactivateEvent
} from './limited.js'

import { addBankActivity } from '../bankaktivitas.js'
import { getCharacterImage } from '../umaimage.js'

// ── Absolute Monster Router Hook ───────────────────────────────────────
import {
  isMonsterActive,
  checkMonsterCooldown,
  isMonsterQueued,
  handleMonsterPull,
  handleMonsterMulti,
  buildMonsterInfo,
  getMonsterBanner,
  activateMonsterEvent,
  deactivateMonsterEvent
} from './limitedEvent/absoluteMonster.js'

// ================================
// 🎊 PERMANENT BANNER CONFIGURATION
// ================================

const PERMANENT_CONFIG = {
  name: 'Permanent Banner',
  singlePrice: 550,
  multiPrice: 1220,
  softPity: 60,
  hardPity: 90,
  limitedRate: 0,
  legendRate: BASE_RATES.legend,
  epicRate: BASE_RATES.epic,
  rareRate: BASE_RATES.rare,
  rateUpBonus: 0.5,
  enableAnimation: true,
  enableOwnerTest: true
}

// Cooldown key generator
const cdKey = (sender, action) => `banner:${action}:${sender}`

// ================================
// 🏇 BANNER INFORMATION
// ================================

export const buildPermanentInfo = (user) => {
  const cfg = PERMANENT_CONFIG
  const pity = getPityCount(user, 'permanent')
  const stat = ensureBannerStat(user, 'permanent')
  const ticket = getTicketCount(user, 'banner')
  const medal = user.medal ?? 0

  return [
    `🎊 𝗣𝗘𝗥𝗠𝗔𝗡𝗘𝗡𝗧 𝗕𝗔𝗡𝗡𝗘𝗥`,
    '',
    `📝 Banner selalu tersedia. Tidak ada batas waktu.`,
    '',
    `🏇 Pool Karakter:`,
    `🟡 Legend : ${bannerPool.legend.map(c => c.name).join(', ')}`,
    `🟣 Epic   : ${bannerPool.epic.map(c => c.name).join(', ')}`,
    `🔵 Rare   : ${bannerPool.rare.map(c => c.name).join(', ')}`,
    '',
    `📊 Rate:`,
    `🟡 Legend : ${(cfg.legendRate * 100).toFixed(0)}%`,
    `🟣 Epic   : ${(cfg.epicRate * 100).toFixed(0)}%`,
    `🔵 Rare   : ${(cfg.rareRate * 100).toFixed(0)}%`,
    '',
    `🎯 Soft Pity : ${cfg.softPity} pull`,
    `🎯 Hard Pity : ${cfg.hardPity} pull`,
    `🎯 Pity saat ini: ${pity} pull`,
    '',
    `💰 Single : ${formatCarats(cfg.singlePrice)} Carats`,
    `💰 Multi ×10 : ${formatCarats(cfg.multiPrice)} Carats`,
    `💰 Multi ×30 : ${formatCarats(cfg.multiPrice * 3)} Carats`,
    `💰 Multi ×50 : ${formatCarats(cfg.multiPrice * 5)} Carats`,
    `🎫 Ticket : ${ticket}`,
    `🏅 Medal  : ${formatMedal(medal)}`,
    '',
    `📊 Statistik:`,
    `   Total Pull : ${stat.totalPull}`,
    `   Legend     : ${stat.totalLegend}`,
    `   Epic       : ${stat.totalEpic}`
  ].join('\n')
}

export const buildLimitedInfo = (user) => {
  // ── Absolute Monster override untuk .lbanner ──────────────────────────
  if (isMonsterActive()) return buildMonsterInfo(user)

  const event = getActiveEvent()
  if (!event) return buildEventInfo(null)
  const pity = getLimitedPityCount(user)
  const stat = ensureLimitedStat(user)
  const ticket = getTicketCount(user, 'limited')
  return [
    buildRateUpInfo(event),
    '',
    `🎯 Pity saat ini: ${pity} pull`,
    `🎫 Ticket Limited: ${ticket}`,
    '',
    `📊 Statistik Limited:`,
    `   Total Pull : ${stat.totalPull}`,
    `   Legend     : ${stat.totalLegend}`,
    `   Duplikat   : ${stat.totalDuplicate}`
  ].join('\n')
}

// ================================
// ⭐ INTERNAL ROLL ENGINE
// ================================

const getPool = (bannerType, user = null) => {
  if (bannerType === 'limited') {
    const event = getActiveEvent()
    if (!event) return null

    // Fitur 4-5: Filter limited pool — hilangkan karakter yang sudah dimiliki user
    const rawPool = getLimitedPool(event)
    const filteredPool = user
      ? rawPool.filter(c => !hasCharacter(user, c.id))
      : rawPool

    return {
      limited: filteredPool,
      legend: bannerPool.legend,
      epic: bannerPool.epic,
      rare: bannerPool.rare
    }
  }
  return bannerPool
}

const getConfig = (bannerType) =>
  bannerType === 'limited' ? LIMITED_CONFIG : PERMANENT_CONFIG

const doSingleRoll = (pool, rateUpChars, pityCount, config) => {

  // Banner Limited punya peluang Limited sendiri
  if (pool.limited?.length) {

    const limitedRate = config.limitedRate ?? 0.01

    if (Math.random() < limitedRate) {

      const character = rollCharacter(
        pool.limited,
        rateUpChars,
        config.rateUpBonus
      )

      return {
        character,
        rarity: 'limited'
      }
    }

  }

  const rarity = rollRarity(
    pityCount,
    config.softPity,
    config.hardPity,
    config.legendRate
  )

  const rarityPool =
    pool[rarity] ?? pool.rare ?? []

  const character = rollCharacter(
    rarityPool,
    rateUpChars,
    config.rateUpBonus
  )

  return {
    character,
    rarity
  }

}
const applyRollResult = (user, character, rarity, bannerType, bannerName, db, senderName) => {
  // Tambah ke inventory
  const { isDuplicate } = addCharacterToInventory(user, character, bannerName)

  // Duplicate reward
  // Fitur 7: Limited tidak mendapat reward duplikat (bukan karakter farm)
  let reward = null
  if (isDuplicate && rarity !== 'limited') {
    reward = giveDuplicateReward(user, character)
    if (db?.bank) {
      addBankActivity(
        db,
        `✨ ${senderName} mendapat duplikat ${character.name} (+${reward.medal} Medal, +${reward.carats} Carats)`
      )
    }
  }

  // Update pity
  if (rarity === 'legend' || rarity === 'limited') {
    if (bannerType === 'limited') resetLimitedPity(user)
    else resetPity(user, bannerType)
  } else {
    if (bannerType === 'limited') incrementLimitedPity(user)
    else incrementPity(user, bannerType)
  }

  // Rekam history
  recordPullHistory(user, character, rarity, isDuplicate, bannerType)

  // Rekam statistik
  const cost = 0  // Biaya dihitung di luar, per pull tidak perlu dipecah
  recordPullStat(user, rarity, isDuplicate, reward?.medal ?? 0, cost, bannerType)

  return { isDuplicate, reward }
}

// ================================
// 🎴 SINGLE PULL
// ================================

export const handleSinglePull = async (naze, m, db, user, bannerType = 'permanent', useTicket = false) => {
  // ── ABSOLUTE MONSTER ROUTER HOOK ──────────────────────────────────────
  // Saat Event Monster aktif dan bannerType === 'limited',
  // seluruh proses dipindahkan ke absoluteMonster.js
  if (bannerType === 'limited' && isMonsterActive()) {
    return handleMonsterPull(naze, m, db, user)
  }

  try {
    const cfg = getConfig(bannerType)
    const ticketType = bannerType === 'limited' ? 'limited' : 'banner'
    const senderName = user.name || m.sender.split('@')[0]

    // Validasi ketersediaan pool
    if (bannerType === 'limited' && !getActiveEvent()) {
      return m.reply('❌ Tidak ada banner Limited aktif saat ini.')
    }

    // ── Fitur 6: Limited Complete Check ──────────────────────
    // Lakukan SEBELUM bayar/ticket/pity agar tidak ada yang terpotong
    if (bannerType === 'limited') {
      const _evSingle = getActiveEvent()
      if (_evSingle) {
        const _rawSingle = getLimitedPool(_evSingle)
        const _ownedSingle = _rawSingle.filter(c => hasCharacter(user, c.id))
        if (_ownedSingle.length >= _rawSingle.length && _rawSingle.length > 0) {
          return m.reply(
            '🎉 Semua karakter Limited pada Event ini sudah kamu miliki.\n\n' +
            'Karakter Limited tidak dapat diperoleh dua kali.\n\n' +
            'Silakan tunggu Event Limited berikutnya.'
          )
        }
      }
    }

    // Validasi bayar
    if (useTicket) {
      if (getTicketCount(user, ticketType) < 1) {
        return m.reply(`❌ Ticket tidak cukup!\n\n🎫 Ticket ${ticketType}: ${getTicketCount(user, ticketType)}`)
      }
      spendTicket(user, ticketType)
    } else {
      if (!hasEnoughCarats(user, cfg.singlePrice)) {
        return m.reply(
          `❌ Carats tidak cukup!\n\n💰 Dibutuhkan : ${formatCarats(cfg.singlePrice)}\n💰 Carats kamu : ${formatCarats(user.money)}`
        )
      }
      spendCarats(user, cfg.singlePrice)
      if (db?.bank) {
        db.bank.kas = (db.bank.kas ?? 0) + cfg.singlePrice
        db.bank.danaMasuk = (db.bank.danaMasuk ?? 0) + cfg.singlePrice
        db.bank.totalPembelian = (db.bank.totalPembelian ?? 0) + 1
      }
    }

    // Pool + pity
    const pool = getPool(bannerType, user)  // Fitur 5: pool dinamis (user-aware)
    const event = bannerType === 'limited' ? getActiveEvent() : null
    const rateUpChars = event ? getRateUpCharacters(event) : []
    const pityCount = bannerType === 'limited'
      ? getLimitedPityCount(user)
      : getPityCount(user, bannerType)

    // Roll
    const { character, rarity } = doSingleRoll(pool, rateUpChars, pityCount, cfg)
    if (!character) {
      // Kembalikan carats/ticket jika roll gagal
      if (!useTicket) addCarats(user, cfg.singlePrice)
      else addTicket(user, ticketType)
      return m.reply('❌ Gagal mendapatkan karakter. Carats/Ticket dikembalikan.')
    }

    // Proses
    const { isDuplicate, reward } = applyRollResult(
      user, character, rarity, bannerType,
      cfg.name || bannerType, db, senderName
    )
    const newPity = bannerType === 'limited'
      ? getLimitedPityCount(user)
      : getPityCount(user, bannerType)

    // Animasi
    if (cfg.enableAnimation) {
      const msg = await naze.sendMessage(m.chat, {
        text: `🎊 𝗧𝗥𝗔𝗖𝗘𝗡 𝗕𝗔𝗡𝗡𝗘𝗥\n\n⏳ Memanggil Uma Musume...`
      }, { quoted: m })

      await delay(1800)
      try {
        await naze.sendMessage(m.chat, {
          edit: msg.key,
          text: `🎊 𝗧𝗥𝗔𝗖𝗘𝗡 𝗕𝗔𝗡𝗡𝗘𝗥\n\n✨ ${rarityRevealText(rarity)}...`
        })
      } catch { /* lewati */ }
      await delay(1200)
    }

    // Caption + gambar
    const caption = buildPullCaption(character, rarity, isDuplicate, reward, newPity)
    const imageUrl = getCharacterImage(character)

    if (imageUrl) {
      await naze.sendMessage(m.chat, { image: { url: imageUrl }, caption }, { quoted: m })
    } else {
      await m.reply(caption)
    }

    // Bonus first pull limited
    if (bannerType === 'limited' && event?.firstPullBonus) {
      if (checkFirstPullBonus(user, event.id)) {
        addCarats(user, 1000)
        await m.reply(`🎁 First Pull Bonus!\n\n💰 +500 Carats`)
      }
    }

    // Bank activity
    if (db?.bank && !isDuplicate) {
      addBankActivity(db, `🎊 ${senderName} mendapatkan ${character.name} dari ${bannerType} banner`)
    }

    console.log(`✅ PULL [${bannerType}] ${m.sender} → ${character.name} (${rarity})`)

  } catch (err) {
    console.log('❌ SINGLE PULL ERROR:', err)
    return m.reply('❌ Pull Error. Silakan coba lagi.')
  }
}

// ================================
// 🎊 MULTI PULL ×10
// ================================

export const handleMultiPull = async (naze, m, db, user, bannerType = 'permanent', useTicket = false, count = 10) => {
  // ── ABSOLUTE MONSTER ROUTER HOOK ──────────────────────────────────────
  if (bannerType === 'limited' && isMonsterActive()) {
    return handleMonsterMulti(naze, m, db, user, count)
  }

  try {
    const cfg = getConfig(bannerType)
    const ticketType = bannerType === 'limited' ? 'limited' : 'banner'
    const value = Number(count)
    const MULTI =
      Number.isInteger(value) &&
      value >= 10 &&
      value <= 500 &&
      value % 10 === 0
        ? value
        : 10
    const multiPrice = Math.floor(cfg.multiPrice * (MULTI / 10))
    const senderName = user.name || m.sender.split('@')[0]

    if (bannerType === 'limited' && !getActiveEvent()) {
      return m.reply('❌ Tidak ada banner Limited aktif saat ini.')
    }

    // ── Fitur 6: Limited Complete Check ──────────────────────
    // Lakukan SEBELUM bayar/ticket/pity agar tidak ada yang terpotong
    if (bannerType === 'limited') {
      const _evMulti = getActiveEvent()
      if (_evMulti) {
        const _rawMulti = getLimitedPool(_evMulti)
        const _ownedMulti = _rawMulti.filter(c => hasCharacter(user, c.id))
        if (_ownedMulti.length >= _rawMulti.length && _rawMulti.length > 0) {
          return m.reply(
            '🎉 Semua karakter Limited pada Event ini sudah kamu miliki.\n\n' +
            'Karakter Limited tidak dapat diperoleh dua kali.\n\n' +
            'Silakan tunggu Event Limited berikutnya.'
          )
        }
      }
    }

    // Validasi bayar
    if (useTicket) {
      if (getTicketCount(user, ticketType) < MULTI) {
        return m.reply(
          `❌ Ticket tidak cukup!\n\n🎫 Dibutuhkan: ${MULTI}\n🎫 Ticket kamu: ${getTicketCount(user, ticketType)}`
        )
      }
      spendTicket(user, ticketType, MULTI)
    } else {
      if (!hasEnoughCarats(user, multiPrice)) {
        return m.reply(
          `❌ Carats tidak cukup!\n\n💰 Dibutuhkan : ${formatCarats(multiPrice)}\n💰 Carats kamu : ${formatCarats(user.money)}`
        )
      }
      spendCarats(user, multiPrice)
      if (db?.bank) {
        db.bank.kas = (db.bank.kas ?? 0) + multiPrice
        db.bank.danaMasuk = (db.bank.danaMasuk ?? 0) + multiPrice
        db.bank.totalPembelian = (db.bank.totalPembelian ?? 0) + 1
      }
    }

    const pool = getPool(bannerType, user)  // Fitur 5: pool dinamis (user-aware)
    const event = bannerType === 'limited' ? getActiveEvent() : null
    const rateUpChars = event ? getRateUpCharacters(event) : []

    const results = []
    let totalMedal = 0
    let totalCarats = 0
    let hasHighRarity = false

    for (let i = 0; i < MULTI; i++) {
      const pityCount = bannerType === 'limited'
        ? getLimitedPityCount(user)
        : getPityCount(user, bannerType)

      let { character, rarity } = doSingleRoll(pool, rateUpChars, pityCount, cfg)

      // Garansi minimal 1 epic di pull ke-10 jika belum ada
      if (i === MULTI - 1 && !hasHighRarity) {
        rarity = 'epic'
        const epicChar = rollCharacter(bannerPool.epic, [], 0)
        if (epicChar) character = epicChar
      }

      if (!character) continue

      const { isDuplicate, reward } = applyRollResult(
        user, character, rarity, bannerType, cfg.name || bannerType, db, senderName
      )

      if (isDuplicate && reward) {
        totalMedal += reward.medal ?? 0
        totalCarats += reward.carats ?? 0
      }

      if (rarity === 'epic' || rarity === 'legend' || rarity === 'limited') {
        hasHighRarity = true
      }

      results.push({ character, rarity, isDuplicate, reward })
    }

    // Animasi singkat
    if (cfg.enableAnimation) {
      const msg = await naze.sendMessage(m.chat, {
        text: `🎊 𝗧𝗥𝗔𝗖𝗘𝗡 𝗕𝗔𝗡𝗡𝗘𝗥 ×${MULTI}\n\n⏳ Memanggil ${MULTI} Uma Musume...`
      }, { quoted: m })

      await delay(2200)
      try {
        await naze.sendMessage(m.chat, {
          edit: msg.key,
          text: `🎊 𝗧𝗥𝗔𝗖𝗘𝗡 𝗕𝗔𝗡𝗡𝗘𝗥 ×${MULTI}\n\n✨ Membuka ${results.length} hasil...`
        })
      } catch { /* lewati */ }
      await delay(1200)
    }

    if (!results.length) {
      if (!useTicket) addCarats(user, multiPrice)
      return m.reply('❌ Gagal memproses pull. Carats dikembalikan.')
    }

    // Ambil gambar dari hasil terbaik
    const rarityOrder = { limited: 4, legend: 3, epic: 2, rare: 1 }
    const best = [...results].sort(
      (a, b) => (rarityOrder[b.rarity] ?? 0) - (rarityOrder[a.rarity] ?? 0)
    )[0]

    const caption = buildMultiCaption(results, totalMedal, totalCarats)
    const imageUrl = getCharacterImage(best.character)

    if (imageUrl) {
      await naze.sendMessage(m.chat, { image: { url: imageUrl }, caption }, { quoted: m })
    } else {
      await m.reply(caption)
    }

    if (db?.bank) {
      addBankActivity(db, `🎊 ${senderName} melakukan multi pull ×${MULTI} di ${bannerType} banner`)
    }

    console.log(`✅ MULTI PULL [${bannerType}] ${m.sender} — ${results.length} hasil`)

  } catch (err) {
    console.log('❌ MULTI PULL ERROR:', err)
    return m.reply('❌ Multi Pull Error. Silakan coba lagi.')
  }
}

// ================================
// 📜 HISTORY
// ================================

export const showBannerHistory = (m, user, bannerType = 'permanent') => {
  const history = formatHistory(user, bannerType, 15)
  const label = bannerType === 'limited' ? `🌸${getActiveLimitedIcon()} LIMITED` : '🎊 PERMANENT'
  return m.reply(`📜 ${label} 𝗛𝗜𝗦𝗧𝗢𝗥𝗬\n\n${history}`)
}

// ================================
// 📊 STATISTIC
// ================================

export const showBannerStat = (m, user, bannerType = 'permanent') => {
  const stat = ensureBannerStat(user, bannerType)
  const pity = bannerType === 'limited'
    ? getLimitedPityCount(user) 
    : getPityCount(user, bannerType)
  const label = bannerType === 'limited' ? `🌸${getActiveLimitedIcon()} LIMITED` : '🎊 PERMANENT'
  return m.reply(
    `📊 ${label} 𝗦𝗧𝗔𝗧𝗜𝗦𝗧𝗜𝗖\n\n${formatStat(stat)}\n\n🎯 Pity saat ini: ${pity} pull`
  )
}

// ================================
// 📦 INVENTORY / KOLEKSI BANNER
// ================================

export const showBannerInventory = (m, user) => {
  if (!user.inventory?.length) {
    return m.reply('📦 Koleksi kosong.\n\nLakukan pull dulu!\n\n💡 Gunakan .pull atau .multipull')
  }

  const order = { limited: 4, legend: 3, epic: 2, rare: 1 }
  const sorted = [...user.inventory].sort(
    (a, b) => (order[b.rarity] ?? 0) - (order[a.rarity] ?? 0)
  )

  const lines = sorted.map((c, i) => {
    const copies = c.copies > 1 ? ` (×${c.copies})` : ''
    return `${i + 1}. ${getRarityIcon(getCharacterById(c.id))} ${c.name}${copies}`
  })

  const medal = user.medal ?? 0

  return m.reply([
    `📦 𝗖𝗢𝗟𝗟𝗘𝗖𝗧𝗜𝗢𝗡`,
    '',
    ...lines,
    '',
    `Total: ${sorted.length} karakter`,
    `🏅 Medal: ${formatMedal(medal)}`
  ].join('\n'))
}

// ================================
// 👑 OWNER MODE
// ================================

export const ownerTestPull = async (naze, m, user, rawArgs) => {
  try {
    const mode = rawArgs?.[0]?.toLowerCase()
    let character = null
    let rarity = 'legend'

    if (['rare', 'epic', 'legend', 'limited'].includes(mode)) {
      rarity = mode
      const p = mode === 'limited'
        ? (getActiveEvent() ? getLimitedPool(getActiveEvent()) : bannerPool.legend)
        : bannerPool[mode]
      character = pickRandom(p ?? bannerPool.legend)
    } else if (mode) {
      character = allCharacterPool.find(c =>
        c.id === mode || c.name.toLowerCase().includes(mode)
      )
      rarity = character?.rarity ?? 'legend'
    }

    if (!character) {
      character = pickRandom(bannerPool.legend)
      rarity = 'legend'
    }

    const { isDuplicate, reward } = applyRollResult(
      user, character, rarity, 'permanent', 'Owner Test', null, 'Owner'
    )

    const caption = `👑 OWNER TEST\n\n${buildPullCaption(character, rarity, isDuplicate, reward, 0)}`
    const imageUrl = getCharacterImage(character)

    if (imageUrl) {
      await naze.sendMessage(m.chat, { image: { url: imageUrl }, caption }, { quoted: m })
    } else {
      await m.reply(caption)
    }

  } catch (err) {
    console.log('❌ OWNER TEST PULL:', err)
    return m.reply('❌ Owner Test Error')
  }
}

// Owner give karakter
export const ownerGiveChar = async (m, user, args) => {
  const charId = args?.join(' ')?.toLowerCase()?.trim()
  if (!charId) return m.reply('Contoh:\n.givechar oguri_banner')
  const result = ownerGiveCharacter(user, charId)
  return m.reply(result.success
    ? `✅ ${result.character.name} diberikan!\n${result.isDuplicate ? '✨ Duplikat — Medal & Carats ditambahkan.' : ''}`
    : result.message
  )
}

// Owner kelola event limited
export const ownerEventCmd = (m, args) => {
  const sub = args?.[0]?.toLowerCase()
  const eventId = args?.[1]

  if (sub === 'list') {
    const events = getAllEvents()
    const lines = events.map(e =>
      `• ${e.id}: ${e.name} [${e.active ? '🟢 Aktif' : '🔴 Mati'}]`
    ).join('\n')
    // Tambahkan status Monster
    const monsterBanner = getMonsterBanner()
    const monsterLine = `• absolute_monster_gray: ☠️ Absolute Monster Gray [${monsterBanner ? '🟢 Aktif' : '🔴 Mati'}]`
    return m.reply(`🌸 EVENT LIST\n\n${lines}\n${monsterLine}`)
  }

  // ── Absolute Monster event on/off ─────────────────────────────────────
  if (sub === 'on' && eventId === 'absolute_monster_gray') {
    activateMonsterEvent()
    return m.reply('🟢 Absolute Monster Event diaktifkan! ☠️')
  }

  if (sub === 'off' && eventId === 'absolute_monster_gray') {
    deactivateMonsterEvent()
    return m.reply('🔴 Absolute Monster Event dinonaktifkan.')
  }

  if (sub === 'on' && eventId) {
    const r = ownerActivateEvent(eventId)
    return m.reply(r.success ? `🟢 Event '${eventId}' diaktifkan!` : r.message)
  }

  if (sub === 'off' && eventId) {
    const r = ownerDeactivateEvent(eventId)
    return m.reply(r.success ? `🔴 Event '${eventId}' dinonaktifkan.` : '❌ Event tidak ditemukan.')
  }

  return m.reply([
    '🌸 OWNER EVENT',
    '',
    '.event list — daftar event',
    '.event on <id> — aktifkan event',
    '.event off <id> — nonaktifkan event',
    '',
    '☠️ Monster Event:',
    '.event on absolute_monster_gray',
    '.event off absolute_monster_gray'
  ].join('\n'))
}

// ================================
// 🚀 EXPORT
// ================================

console.log(`
🎊 [BANNER ENGINE v2.0]
✅ Permanent Banner
✅ Limited Banner
✅ Single Pull + Multi Pull
✅ Pity System (Soft + Hard)
✅ Duplicate Reward
✅ Animation
✅ History & Statistic
✅ Owner Mode
`)

// ================================
// 🗑 GARBAGE CLEANER NOTE
// ================================
//
// Banner tidak menghapus data sementara secara langsung.
// Seluruh data sementara yang sudah selesai digunakan
// dikirim ke: garbage/cleaner.js
//
// Cleaner menentukan:
// • apakah data masih diperlukan
// • kapan data dibuang
// • bagaimana proses pembersihan
//
// Jangan delete langsung dari engine Banner.
