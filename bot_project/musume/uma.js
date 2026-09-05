import { addBankActivity } from './bankaktivitas.js'
import { getCharacterImage } from './umaimage.js'
import { getUmaRank } from './rank.js'
import { absoluteGuard, checkGuardCooldown } from './absoluteGuard.js'
import { initUmaStats } from './umahelper.js'

// Shop system v2 imports
import {
  handleSinglePull, handleMultiPull,
  buildPermanentInfo, buildLimitedInfo,
  showBannerHistory, showBannerStat, showBannerInventory,
  ownerTestPull, ownerGiveChar, ownerEventCmd
} from './shop/banner.js'

import {
  buildExchangeMenu, processExchange,
  buildExchangeHistory, buildExchangeStat,
  ensureExchangeData, ownerGiveMedal, ownerResetExchange
} from './shop/exchange.js'

import {
  isPullLocked, setPullLock, releasePullLock, cleanAfterPull
} from './shop/garbage/cleaner.js'

import {
  formatMedal, formatCarats, getTicketCount,
  addCharacterToInventory, hasCharacter, getRarityIcon
} from './shop/helper.js'

import {
  getCharacterById, allCharacterPool, getRandomNpc, buildNpcEntry
} from './shop/karakter.js'

// ===============================================
// 🔧 HELPER: Nama karakter aktif (termasuk Limited)
// ===============================================
//
// Menampilkan nama lengkap karakter aktif.
// Jika karakter Limited, tampilkan nama lengkap dengan tag.
// Contoh: Oguri Cap [Ashen Miracle]

const getActiveCharName = (user) => {
  if (!user.activeUma) return null
  const char = getCharacterById(user.activeUma)
  if (!char) return user.activeUma
  return char.name
}

// ===============================================
// 🔧 HELPER: Ambil image URL karakter
// ===============================================
//
// Prioritas: thumbnail → image (fallback)

const getCharImageUrl = (char) => {
  if (!char) return null
  return getCharacterImage(char) ?? null
}

// ===============================================
// 🔧 HELPER: Pastikan npcCollection ada
// ===============================================

const ensureNpcCollection = (user) => {
  if (!user.npcCollection) user.npcCollection = []
}

// ===============================================
// 🏪 COMMAND : .UMASHOP
// ===============================================

let globalUmaShop = 0
let globalUmaShopWarn = false

export const umashop = async (naze, m, db, isCreator) => {
  try {
    const now = Date.now()
    const cooldown = 900000  // 15 menit
    const sisa = cooldown - (now - globalUmaShop)

    if (sisa > 0 && !isCreator) {
      if (!globalUmaShopWarn) {
        globalUmaShopWarn = true
        const menit = Math.floor(sisa / 60000)
        const detik = Math.floor((sisa % 60000) / 1000)
        return m.reply(`🏇 𝐔𝐌𝐀 𝐒𝐇𝐎𝐏\n\n⏳ Cooldown\n\n${menit}m ${detik}s\n\nJangan di-spam ya.`)
      }
      return
    }

    globalUmaShop = now
    globalUmaShopWarn = false

    const user = db.users[m.sender]
    ensureExchangeData(user)
    ensureNpcCollection(user)

    const ticket = getTicketCount(user, 'banner')
    const ticketLimited = getTicketCount(user, 'limited')
    const medal = user.medal ?? 0
    const carats = user.money ?? 0

    const teks = [
      `🏇 𝐔𝐌𝐀 𝐒𝐇𝐎𝐏`,
      '',
      `💰 Carats : ${formatCarats(carats)}`,
      `🏅 Medal  : ${formatMedal(medal)}`,
      `🎫 Ticket : ${ticket}  |  🌸 Limited: ${ticketLimited}`,
      '',
      `📋 Menu:`,
      `• .pull — Permanent Banner (500 Carats)`,
      `• .multipull — Multi Pull ×10/30/50`,
      `• .multipull 30 — Multi ×30`,
      `• .multipull 50 — Multi ×50`,
      `• .lpull — Limited Banner (750 Carats)`,
      `• .lmulti — Limited Multi ×10/30/50`,
      `• .banner — Info Permanent Banner`,
      `• .bannerl — Info Limited Banner`,
      `• .exchange — Exchange Shop (Medal)`,
      `• .koleksi — Koleksi Banner`,
      `• .myuma — Uma Aktif`,
      `• .buyuma — Rekrut NPC (acak)`,
      `• .selectuma nama — Ganti Uma Aktif`,
      '',
      `🎊 Gunakan .banner atau .bannerl untuk info lengkap!`
    ].join('\n')

    try {
      const gambar = await import('axios').then(a => a.default.get(
        'https://github.com/asahichanID/Umaimage/raw/refs/heads/main/uma/umashop.png',
        { responseType: 'arraybuffer' }
      ))
      await naze.sendMessage(m.chat, {
        image: Buffer.from(gambar.data),
        caption: teks
      }, { quoted: m })
    } catch {
      await m.reply(teks)
    }

    console.log('✅ UMASHOP')

  } catch (err) {
    console.log('❌ UMASHOP Error:', err.message)
    return m.reply('❌ Uma Shop Error')
  }
}

// ===============================================
// 🎊 COMMAND : .PULL (Permanent Banner — Single)
// ===============================================

export const pull = async (naze, m, db) => {
  // 🛡️ Absolute Guard — cooldown 60s, queue banner
  const guard = await absoluteGuard(m.sender, 'pull', 'banner', m)
  if (!guard.ok) return

  try {
    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    if (isPullLocked(m.sender)) {
      return m.reply('⏳ Pull sedang diproses. Harap tunggu...')
    }

    setPullLock(m.sender)
    try {
      await handleSinglePull(naze, m, db, user, 'permanent', false)
    } finally {
      releasePullLock(m.sender)
    }
  } catch (err) {
    console.log('❌ PULL ERROR:', err)
    releasePullLock(m.sender)
    return m.reply('❌ Pull Error. Coba lagi.')
  } finally {
    guard.release()
  }
}

// 🎊 COMMAND : .MULTIPULL (Permanent — ×10 / Custom)
// ===============================================
export const multipull = async (naze, m, db, jumlahPull = null) => {
  // 🛡️ Absolute Guard — cooldown 60s, queue banner
  const guard = await absoluteGuard(m.sender, 'multi', 'banner', m)
  if (!guard.ok) return

  try {
    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    if (isPullLocked(m.sender)) {
      return m.reply('⏳ Pull sedang diproses. Harap tunggu...')
    }

    setPullLock(m.sender)
    try {
      await handleMultiPull(naze, m, db, user, 'permanent', false, jumlahPull)
    } finally {
      releasePullLock(m.sender)
    }
  } catch (err) {
    console.log('❌ MULTIPULL ERROR:', err)
    releasePullLock(m.sender)
    return m.reply('❌ Multi Pull Error. Coba lagi.')
  } finally {
    guard.release()
  }
}

// ===============================================
// 🌸 COMMAND : .LPULL (Limited Banner — Single)
// ===============================================

export const lpull = async (naze, m, db) => {
  // 🛡️ Absolute Guard — cooldown 60s, queue banner
  const guard = await absoluteGuard(m.sender, 'lpull', 'banner', m)
  if (!guard.ok) return

  try {
    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    if (isPullLocked(m.sender)) {
      return m.reply('⏳ Pull sedang diproses. Harap tunggu...')
    }

    setPullLock(m.sender)
    try {
      await handleSinglePull(naze, m, db, user, 'limited', false)
    } finally {
      releasePullLock(m.sender)
    }
  } catch (err) {
    console.log('❌ LPULL ERROR:', err)
    releasePullLock(m.sender)
    return m.reply('❌ Limited Pull Error. Coba lagi.')
  } finally {
    guard.release()
  }
}

// ===============================================
// 🌸 COMMAND : .LMULTI (Limited Banner — ×10)
// ===============================================
export const lmulti = async (naze, m, db, jumlahPull = null) => {
  // 🛡️ Absolute Guard — cooldown 60s, queue banner
  const guard = await absoluteGuard(m.sender, 'lmulti', 'banner', m)
  if (!guard.ok) return

  try {
    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    if (isPullLocked(m.sender)) {
      return m.reply('⏳ Pull sedang diproses. Harap tunggu...')
    }

    setPullLock(m.sender)
    try {
      await handleMultiPull(naze, m, db, user, 'limited', false, jumlahPull)
    } finally {
      releasePullLock(m.sender)
    }
  } catch (err) {
    console.log('❌ LMULTI ERROR:', err)
    releasePullLock(m.sender)
    return m.reply('❌ Limited Multi Error. Coba lagi.')
  } finally {
    guard.release()
  }
}

// ===============================================
// 🎫 COMMAND : .TPULL (Ticket Pull — Single)
// ===============================================

export const tpull = async (naze, m, db, args) => {
  try {
    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    const type = args?.[0]?.toLowerCase() === 'limited' ? 'limited' : 'permanent'

    if (isPullLocked(m.sender)) {
      return m.reply('⏳ Pull sedang diproses. Harap tunggu...')
    }

    setPullLock(m.sender)
    try {
      await handleSinglePull(naze, m, db, user, type, true)
    } finally {
      releasePullLock(m.sender)
    }
  } catch (err) {
    console.log('❌ TPULL ERROR:', err)
    releasePullLock(m.sender)
    return m.reply('❌ Ticket Pull Error.')
  }
}

// ===============================================
// 📖 COMMAND : .BANNER (Info Permanent)
// ===============================================

export const banner = async (naze, m, db, args) => {
  try {
    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    const sub = args?.[0]?.toLowerCase()

    if (sub === 'history' || sub === 'riwayat') {
      return showBannerHistory(m, user, 'permanent')
    }

    if (sub === 'stat' || sub === 'statistik') {
      return showBannerStat(m, user, 'permanent')
    }

    return m.reply(buildPermanentInfo(user))

  } catch (err) {
    console.log('❌ BANNER INFO ERROR:', err)
    return m.reply('❌ Banner Info Error.')
  }
}

// ===============================================
// 🌸 COMMAND : .BANNERL (Info Limited)
// ===============================================

export const bannerl = async (naze, m, db, args) => {
  try {
    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    const sub = args?.[0]?.toLowerCase()

    if (sub === 'history' || sub === 'riwayat') {
      return showBannerHistory(m, user, 'limited')
    }

    if (sub === 'stat' || sub === 'statistik') {
      return showBannerStat(m, user, 'limited')
    }

    return m.reply(buildLimitedInfo(user))

  } catch (err) {
    console.log('❌ BANNERL INFO ERROR:', err)
    return m.reply('❌ Limited Banner Info Error.')
  }
}

// ===============================================
// 📦 COMMAND : .KOLEKSI (Banner Inventory)
// ===============================================

export const koleksi = async (naze, m, db) => {
  // 🛡️ Absolute Guard — cooldown 3s
  const cdKol = await checkGuardCooldown(m.sender, 'koleksi', 'collection', m)
  if (!cdKol.ok) return

    try {
    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')
    return showBannerInventory(m, user)
  } catch (err) {
    console.log('❌ KOLEKSI ERROR:', err)
    return m.reply('❌ Koleksi Error.')
  }
}

// ===============================================
// 🏅 COMMAND : .EXCHANGE
// ===============================================

export const exchange = async (naze, m, db, args) => {
  try {
    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    ensureExchangeData(user)

    const sub = args?.[0]?.toLowerCase()

    if (!sub || sub === 'menu' || sub === 'shop') {
      return m.reply(buildExchangeMenu(user))
    }

    if (sub === 'history' || sub === 'riwayat') {
      return m.reply(buildExchangeHistory(user))
    }

    if (sub === 'stat' || sub === 'statistik') {
      return m.reply(buildExchangeStat(user))
    }

    const query = args.join(' ').trim()
    const senderName = user.name || m.sender.split('@')[0]
    const result = processExchange(user, query, db, senderName)

    return m.reply(result.message)

  } catch (err) {
    console.log('❌ EXCHANGE ERROR:', err)
    return m.reply('❌ Exchange Error.')
  }
}

// ===============================================
// 🤝 COMMAND : .BUYUMA (NPC Recruitment — Acak)
// ===============================================
//
// .buyuma tidak lagi membeli karakter Banner.
// .buyuma hanya merekrut NPC secara acak dari npc.json.
// Hasilnya disimpan ke user.npcCollection (terpisah dari inventory).

let globalBuyUma = 0
let globalBuyUmaWarn = false

const RECRUIT_PRICE = 1000  // Carats per rekrut NPC

export const buyuma = async (naze, m, args, db) => {
  try {
    const now = Date.now()
    const cooldown = 35000
    const sisa = cooldown - (now - globalBuyUma)

    if (sisa > 0) {
      if (!globalBuyUmaWarn) {
        globalBuyUmaWarn = true
        const menit = Math.floor(sisa / 60000)
        const detik = Math.floor((sisa % 60000) / 1000)
        return m.reply(`🤝 𝐍𝐏𝐂 𝐑𝐄𝐂𝐑𝐔𝐈𝐓𝐌𝐄𝐍𝐓\n\n⏳ Cooldown\n\n${menit}m ${detik}s\n\n😹 Jangan dispam ya.`)
      }
      return
    }

    globalBuyUma = now
    globalBuyUmaWarn = false

    const user = db.users[m.sender]
    if (!user) return m.reply('❌ Data tidak ditemukan.')

    ensureNpcCollection(user)

    // Validasi Carats
    if ((user.money ?? 0) < RECRUIT_PRICE) {
      return m.reply(
        `❌ Carats tidak cukup!\n\n🤝 NPC Recruitment\n\n💰 Biaya Rekrut:\n${RECRUIT_PRICE.toLocaleString('id-ID')} Carats\n\n💰 Carats kamu:\n${(user.money ?? 0).toLocaleString('id-ID')}\n\n💡 Lakukan pull banner untuk mendapatkan lebih banyak Carats dari duplikat.`
      )
    }

    // Ambil NPC acak dari npc.json
    const npcBase = getRandomNpc()
    if (!npcBase) {
      return m.reply('❌ Database NPC tidak tersedia. Hubungi Owner.')
    }

    // Build NPC entry lengkap (stat + skill runtime)
    const npcEntry = buildNpcEntry(npcBase)

    // Potong Carats
    user.money -= RECRUIT_PRICE

    if (!db.bank) db.bank = {}
    db.bank.kas = (db.bank.kas ?? 0) + RECRUIT_PRICE
    db.bank.danaMasuk = (db.bank.danaMasuk ?? 0) + RECRUIT_PRICE
    db.bank.totalPembelian = (db.bank.totalPembelian ?? 0) + 1

    const nama = user.name || m.pushName || m.sender.split('@')[0]
    addBankActivity(db, `🤝 ${nama} merekrut NPC ${npcEntry.name} seharga ${RECRUIT_PRICE.toLocaleString('id-ID')} Carats`)

    // Simpan ke npcCollection (TERPISAH dari inventory banner)
    user.npcCollection.push(npcEntry)

    // Jika belum ada Uma aktif, set ke NPC ini
    if (!user.activeUma) {
      user.activeUma = npcEntry.id + '_' + Date.now()
      // Simpan stats NPC ke umaStats agar kompatibel dengan sistem rank
      if (!user.umaStats) user.umaStats = {}
      user.umaStats[user.activeUma] = { ...npcEntry.stats }
    }

    const totalNpc = user.npcCollection.length

    console.log(`✅ RECRUIT NPC: ${npcEntry.name} (${npcEntry.trait}) untuk ${m.sender}`)

    const caption =
`🤝 𝐍𝐏𝐂 𝐑𝐄𝐂𝐑𝐔𝐈𝐓𝐌𝐄𝐍𝐓

✨ ${npcEntry.name} bergabung!

🏷️ Trait   : ${npcEntry.trait}

📊 Status Awal
⚡ Speed   : ${npcEntry.stats.speed}
❤️ Stamina : ${npcEntry.stats.stamina}
💪 Power   : ${npcEntry.stats.power}
💨 Accel   : ${npcEntry.stats.accel}

🎯 Skill   : ${npcEntry.skill.name}
📝 ${npcEntry.skill.desc}

💰 -${RECRUIT_PRICE.toLocaleString('id-ID')} Carats

📦 Koleksi NPC : ${totalNpc}

💡 Gunakan .myuma untuk melihat status Uma.`

    return m.reply(caption)

  } catch (err) {
    console.log('❌ BUYUMA', err)
    return m.reply('❌ Buyuma Error')
  }
}

// ===============================================
// 🏇 COMMAND : .MYUMA
// ===============================================
//
// Menggunakan Character System V2 (getCharacterById).
// Menampilkan nama lengkap karakter aktif (termasuk Limited).
// Contoh: Oguri Cap [Ashen Miracle]
// Prioritas thumbnail → image fallback.

export const myuma = async (naze, m, db, isCreator) => {
  // 🛡️ Absolute Guard — cooldown 3s (skip untuk creator/owner)
  if (!isCreator) {
    const cd = await checkGuardCooldown(m.sender, 'myuma', 'profile', m)
    if (!cd.ok) return
  }

  try {
    const user = db.users[m.sender]

    ensureNpcCollection(user)

    // Cek apakah punya karakter (Banner atau NPC)
    const hasInventory = user.inventory?.length > 0
    const hasNpc = user.npcCollection?.length > 0

    if (!hasInventory && !hasNpc) {
      return m.reply(`🏇 Kamu belum memiliki Uma.\n\nLakukan .pull di banner atau .buyuma untuk rekrut NPC.`)
    }

    if (!user.activeUma) {
      return m.reply(`🏇 Belum ada Uma aktif.\n\nGunakan .selectuma nama`)
    }

    // Coba cari di Character System V2 (Banner)
    const char = getCharacterById(user.activeUma)

    let namaAktif, statsAktif, imageUrl, quote, skillInfo

    if (char) {
      // Karakter Banner — tampilkan nama lengkap (termasuk Limited tag)
      namaAktif = char.name  // Sudah termasuk "[Ashen Miracle]" untuk limited
      statsAktif = user.umaStats?.[user.activeUma] ?? {}
      imageUrl = getCharImageUrl(char)
      quote = char.quotes?.[Math.floor(Math.random() * char.quotes.length)] ?? '🏇 Siap berlari!'
      skillInfo = char.skill ? `🎯 Skill  : ${char.skill.name}` : null
    } else {
      // Cari di NPC Collection
      const npcEntry = user.npcCollection?.find(n =>
        user.activeUma === n.id || user.activeUma.startsWith(n.id + '_')
      )

      if (!npcEntry) {
        return m.reply(`🏇 Uma aktif tidak ditemukan.\n\nGunakan .selectuma untuk pilih ulang.`)
      }

      namaAktif = npcEntry.name
      statsAktif = npcEntry.stats ?? {}
      imageUrl = null  // NPC tidak punya gambar
      quote = '🏇 NPC siap berlari!'
      skillInfo = npcEntry.skill ? `🎯 Skill  : ${npcEntry.skill.name}` : null
    }

    // Rank dari stats
    const rank = getUmaRank(statsAktif, isCreator)

    // Koleksi NPC list
    const koleksiNPC = user.npcCollection
      .map(n => `🤝 ${n.name} (${n.trait})`)
      .join('\n')

    // Koleksi Banner (inventory) — hitung karakter unik
    const bannerKoleksi = user.inventory?.length ?? 0

    const medal = user.medal ?? 0
    const ticket = getTicketCount(user, 'banner')
    const ticketLimited = getTicketCount(user, 'limited')

    const lines = [
'╭═════〔 🏇 𝐓𝐑𝐀𝐂𝐄𝐍 • 𝐌𝐘 𝐔𝐌𝐀 〕═════╮',
'',
'          ✦ 𝐀𝐂𝐓𝐈𝐕𝐄 𝐔𝐌𝐀 ✦',
'',
`             🏇 ${namaAktif}`,
]

if (skillInfo) {
  lines.push(`        ⚔️ ${skillInfo}`)
}

lines.push(
'',
'╰────────────────────────────────╯',
'',
'╭─〔 📊 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 〕',
`│ 🏆 Rank        : ${rank.rank}`,
`│ 🧮 Point       : ${rank.point.toLocaleString('id-ID')}`,
`│ ⭐ Level       : ${statsAktif.level ?? 1}`,
'╰────────────────────────────────╯',
'',
'╭─〔 ⚡ 𝐀𝐁𝐈𝐋𝐈𝐓𝐘 〕',
`│ ⚡ Speed       : ${statsAktif.speed ?? 0}`,
`│ ❤️ Stamina    : ${statsAktif.stamina ?? 0}`,
`│ 💪 Power       : ${statsAktif.power ?? 0}`,
`│ 💨 Accel       : ${statsAktif.accel ?? 0}`,
'╰────────────────────────────────╯',
'',
'╭─〔 🏁 𝐑𝐄𝐂𝐎𝐑𝐃 〕',
`│ 🥇 Victory     : ${statsAktif.win ?? 0}`,
`│ 🥀 Defeat      : ${statsAktif.lose ?? 0}`,
'╰────────────────────────────────╯',
'',
'╭─〔 🎒 𝐑𝐄𝐒𝐎𝐔𝐑𝐂𝐄 〕',
`│ 🏅 Medal       : ${medal.toLocaleString('id-ID')}`,
`│ 🎫 Ticket      : ${ticket}`,
`│ 🌟 Limited     : ${ticketLimited}`,
'╰────────────────────────────────╯',
'',
'╭─〔 📚 𝐂𝐎𝐋𝐋𝐄𝐂𝐓𝐈𝐎𝐍 〕',
`│ 🎊 Banner      : ${bannerKoleksi}`,
`│ 📦 NPC         : ${user.npcCollection.length}`,
'│'
)

if (koleksiNPC) {
  koleksiNPC.split('\n').forEach(v => {
    lines.push(`│ • ${v}`)
  })
} else {
  lines.push('│ • Tidak ada koleksi')
}

lines.push(
'╰────────────────────────────────╯',
'',
'╭─〔 💬 𝐂𝐇𝐀𝐑𝐀𝐂𝐓𝐄𝐑 〕',
`│ ❝ ${quote} ❞`,
'╰────────────────────────────────╯'
)

const caption = lines.join('\n')

    console.log('\n🏇 [MY UMA]')
    console.log('👤', m.sender)
    console.log('🏇', namaAktif)

    if (imageUrl) {
      return await naze.sendMessage(
        m.chat,
        { image: { url: imageUrl }, caption },
        { quoted: m }
      )
    } else {
      return m.reply(caption)
    }

  } catch (err) {
    console.log('❌ MYUMA', err)
    return m.reply('❌ Myuma Error')
  }
}

// ===============================================
// 🏇 COMMAND : .SELECTUMA
// ===============================================
//
// Bisa memilih karakter Banner (Character V2) atau NPC.
// Karakter Banner dicari via getCharacterById.
// Karakter NPC dicari di user.npcCollection.

export const selectuma = async (naze, m, args, db) => {
  // 🛡️ Absolute Guard — cooldown 3s
  const cdSel = await checkGuardCooldown(m.sender, 'selectuma', 'profile', m)
  if (!cdSel.ok) return

    try {
    if (!args[0]) return m.reply(`Contoh:\n\n.selectuma oguri\n.selectuma hana`)

    const keyword = args.join(' ').toLowerCase().trim()
    const user = db.users[m.sender]
    ensureNpcCollection(user)

    // Cari di Banner inventory (Character V2)
    if (user.inventory?.length) {
      const found = user.inventory.find(c =>
        c.id.toLowerCase().includes(keyword) ||
        c.name.toLowerCase().includes(keyword)
      )

      if (found) {
        const char = getCharacterById(found.id)
        user.activeUma = found.id

        // Pastikan umaStats ada
        if (!user.umaStats) user.umaStats = {}
        if (!user.umaStats[found.id] && char) {
          user.umaStats[found.id] = {
            level: 1,
            exp: 0,
            speed: char.stats?.speed ?? 50,
            stamina: char.stats?.stamina ?? 50,
            power: char.stats?.power ?? 50,
            accel: char.stats?.accel ?? 50,
            win: 0,
            lose: 0
          }
        }

        const namaLengkap = char ? char.name : found.name

        console.log('✅ SELECT UMA (Banner):', namaLengkap)
        return m.reply(`🏇 Uma aktif diganti!\n\n✨ ${namaLengkap}\n\n💡 Gunakan .myuma`)
      }
    }

    // Cari di NPC Collection
    if (user.npcCollection?.length) {
      const npcFound = user.npcCollection.find(n =>
        n.id.toLowerCase().includes(keyword) ||
        n.name.toLowerCase().includes(keyword)
      )

      if (npcFound) {
        // NPC activeUma key: id_index (agar unique)
        user.activeUma = npcFound.id
        user.activeNpcIndex = user.npcCollection.indexOf(npcFound)

        if (!user.umaStats) user.umaStats = {}
        if (!user.umaStats[npcFound.id]) {
          user.umaStats[npcFound.id] = {
            exp: 0,
            ...npcFound.stats
          }
        }

        console.log('✅ SELECT UMA (NPC):', npcFound.name)
        return m.reply(`🤝 Uma aktif diganti!\n\n✨ ${npcFound.name}\n\n💡 Gunakan .myuma`)
      }
    }

    return m.reply(`❌ Karakter tidak ditemukan!\n\nCek koleksi kamu dengan .myuma atau .koleksi`)

  } catch (err) {
    console.log('❌ SELECTUMA', err)
    return m.reply('❌ Selectuma Error')
  }
}

// ===============================================
// 👑 OWNER COMMANDS
// ===============================================

// .testpull [rare|epic|legend|limited|id]
export const testpull = async (naze, m, db, args) => {
  const user = db.users[m.sender]
  if (!user) return m.reply('❌ Data tidak ditemukan.')
  await ownerTestPull(naze, m, user, args)
}

// .givechar <charId>
export const givechar = async (naze, m, db, args) => {
  const user = db.users[m.sender]
  if (!user) return m.reply('❌ Data tidak ditemukan.')
  await ownerGiveChar(m, user, args)
}

// .givemedal <@target atau kosong=self> <amount>
export const givemedal = async (naze, m, db, args) => {
  try {
    const target = m.mentionedJid?.[0] ?? m.sender
    const targetUser = db.users[target]
    if (!targetUser) return m.reply('❌ User tidak ditemukan.')

    const amount = parseInt(args[m.mentionedJid?.length ? 1 : 0])
    if (isNaN(amount) || amount < 1) return m.reply('❌ Jumlah medal tidak valid.')

    ownerGiveMedal(targetUser, amount)
    return m.reply(`✅ +${amount.toLocaleString('id-ID')} Medal diberikan ke @${target.split('@')[0]}`, { mentions: [target] })

  } catch (err) {
    console.log('❌ GIVEMEDAL:', err)
    return m.reply('❌ Give Medal Error.')
  }
}

// .event [list|on|off] [eventId]
export const event = async (naze, m, db, args) => {
  return ownerEventCmd(m, args)
}

// ===============================================
// 👑 COMMAND : .allchar — Owner Character Manager
// ===============================================
//
// v1.6.1 — Interactive Character Manager khusus Owner.
//
// Target resolution: mention > reply > diri sendiri (owner).
// Seluruh aksi tombol diproses ulang lewat command ".allchar"
// (id tombol = ".allchar <sub> [charId] <targetJid>"), sehingga
// tetap melewati guard isCreator yang sudah ada di naze.js dan
// TIDAK memerlukan case baru di naze.js.
//
// Menggunakan kembali helper yang sudah ada:
//   - allCharacterPool / getCharacterById  (./shop/karakter.js)
//   - addCharacterToInventory, hasCharacter, findInInventory,
//     getRarityIcon                        (./shop/helper.js)
//   - initUmaStats                         (./umahelper.js)
//
// Sub-command (args[0]):
//   (kosong)                      → tampilkan menu utama
//   give_all <targetJid>          → berikan semua karakter
//   del_all  <targetJid>          → hapus semua karakter
//   manage   <targetJid>          → tampilkan daftar karakter milik target
//   char_menu <charId> <targetJid> → menu satu karakter
//   give_char <charId> <targetJid> → berikan satu karakter
//   del_char  <charId> <targetJid> → hapus satu karakter

// ─── Helper: resolve target user (mention > reply > self) ────

const _allcharResolveTarget = (m, db) => {
  const mentionJid = m.mentionedJid?.[0]
  if (mentionJid && db.users[mentionJid]) return mentionJid

  if (m.quoted?.sender && db.users[m.quoted.sender]) return m.quoted.sender

  return m.sender
}

// ─── Helper: pastikan struktur data karakter user lengkap ────

const _allcharEnsureUser = (user) => {
  if (!user.inventory) user.inventory = []
  if (!user.umaStats)  user.umaStats  = {}
}

// ─── Helper: hapus satu karakter + sinkronkan seluruh data ───
// Membersihkan inventory, umaStats, dan karakter aktif (activeUma)
// sehingga .myuma, .selectuma, race, feed, training tidak lagi
// menunjuk ke karakter yang sudah dihapus (anti "karakter yatim").

const _allcharRemoveChar = (user, charId) => {
  _allcharEnsureUser(user)
  user.inventory = user.inventory.filter(c => c.id !== charId)
  if (user.umaStats[charId]) delete user.umaStats[charId]
  if (user.activeUma === charId) user.activeUma = null
}

// ─── Helper: hapus SEMUA karakter milik user ──────────────────
// Hanya membersihkan data Character System. Economy (money, medal,
// carats, ticket) dan data User lainnya tidak disentuh sama sekali.

const _allcharRemoveAll = (user) => {
  _allcharEnsureUser(user)
  user.inventory = []
  user.umaStats  = {}
  user.activeUma = null
}

// ─── Validasi: pastikan tidak ada karakter "yatim" ───────────
// (karakter di inventory yang ID-nya sudah tidak ada di Registry).
// Dipanggil sebelum render list supaya menu selalu konsisten
// dengan Character Registry yang sedang berlaku.

const _allcharSanitizeInventory = (user) => {
  _allcharEnsureUser(user)
  const validIds = new Set(allCharacterPool.map(c => c.id))
  const orphan = user.inventory.filter(c => !validIds.has(c.id))
  if (orphan.length) {
    user.inventory = user.inventory.filter(c => validIds.has(c.id))
    for (const o of orphan) {
      if (user.umaStats[o.id]) delete user.umaStats[o.id]
      if (user.activeUma === o.id) user.activeUma = null
    }
  }
}

// ─── Tampilkan menu utama ──────────────────────────────────────

const _allcharShowMain = async (naze, m, db, targetJid) => {
  const targetUser = db.users[targetJid]
  if (!targetUser) return m.reply('❌ Data user tidak ditemukan.')

  _allcharSanitizeInventory(targetUser)

  const targetName = targetUser.name || targetJid.split('@')[0]
  const totalOwned = targetUser.inventory.length
  const totalAll   = allCharacterPool.length

  return naze.sendListMsg(m.chat, {
    text: [
      '👑 𝐂𝐇𝐀𝐑𝐀𝐂𝐓𝐄𝐑 𝐌𝐀𝐍𝐀𝐆𝐄𝐑',
      '',
      `👤 Target  : ${targetName}`,
      `📦 Koleksi : ${totalOwned} / ${totalAll} karakter`,
      '',
      'Pilih aksi yang ingin dilakukan:'
    ].join('\n'),
    footer: 'Owner Character Manager v1.6.1',
    buttons: [{
      name: 'single_select',
      buttonParamsJson: {
        title: '👑 Buka Menu',
        sections: [{
          title: '📋 Pilih Aksi',
          rows: [
            {
              header: '🎁',
              title: '🎁 Berikan Semua Karakter',
              description: `Berikan ${totalAll} karakter ke ${targetName}`,
              id: `.allchar give_all ${targetJid}`
            },
            {
              header: '🗑️',
              title: '🗑️ Hapus Semua Karakter',
              description: `Hapus seluruh karakter milik ${targetName}`,
              id: `.allchar del_all ${targetJid}`
            },
            {
              header: '👤',
              title: '👤 Kelola Karakter',
              description: `Kelola karakter yang dimiliki ${targetName}`,
              id: `.allchar manage ${targetJid}`
            }
          ]
        }]
      }
    }]
  }, { quoted: m })
}

// ─── 🎁 Berikan semua karakter ──────────────────────────────────

const _allcharGiveAll = async (m, db, targetJid) => {
  const targetUser = db.users[targetJid]
  if (!targetUser) return m.reply('❌ Data user tidak ditemukan.')
  _allcharEnsureUser(targetUser)

  const targetName = targetUser.name || targetJid.split('@')[0]
  let newCount = 0

  for (const char of allCharacterPool) {
    if (hasCharacter(targetUser, char.id)) continue
    addCharacterToInventory(targetUser, char, 'owner_give')
    if (!targetUser.umaStats[char.id]) {
      targetUser.umaStats[char.id] = initUmaStats(char)
    }
    newCount++
  }

  return m.reply([
    '✅ Seluruh karakter berhasil diberikan!',
    '',
    `👤 Target : ${targetName}`,
    `📊 Baru   : ${newCount} karakter`,
    `📦 Total  : ${targetUser.inventory.length} karakter`
  ].join('\n'))
}

// ─── 🗑️ Hapus semua karakter ────────────────────────────────────

const _allcharDelAll = async (m, db, targetJid) => {
  const targetUser = db.users[targetJid]
  if (!targetUser) return m.reply('❌ Data user tidak ditemukan.')
  _allcharEnsureUser(targetUser)

  const targetName = targetUser.name || targetJid.split('@')[0]
  const prevCount  = targetUser.inventory.length

  if (!prevCount) {
    return m.reply(`ℹ️ ${targetName} memang belum memiliki karakter apa pun.`)
  }

  _allcharRemoveAll(targetUser)

  return m.reply([
    '🗑️ Seluruh karakter berhasil dihapus!',
    '',
    `👤 Target  : ${targetName}`,
    `📊 Dihapus : ${prevCount} karakter`,
    `📦 Sisa    : 0 karakter`,
    '',
    '✅ Inventory, umaStats, dan karakter aktif sudah dibersihkan.',
    '💰 Money, Medal, dan Ticket tidak terpengaruh.'
  ].join('\n'))
}

// ─── 👤 Kelola Karakter — list dari Inventory TARGET (bukan Registry) ─

const _allcharShowManage = async (naze, m, db, targetJid) => {
  const targetUser = db.users[targetJid]
  if (!targetUser) return m.reply('❌ Data user tidak ditemukan.')

  _allcharSanitizeInventory(targetUser)

  const targetName = targetUser.name || targetJid.split('@')[0]
  const inventory  = targetUser.inventory

  if (!inventory.length) {
    return m.reply([
      '👤 Karakter Kosong',
      '',
      `${targetName} belum memiliki karakter.`,
      '',
      'Gunakan "🎁 Berikan Semua Karakter" terlebih dahulu.'
    ].join('\n'))
  }

  // WhatsApp membatasi jumlah row per section — pecah jika perlu
  const MAX = 30
  const sections = []
  for (let i = 0; i < inventory.length; i += MAX) {
    const slice = inventory.slice(i, i + MAX)
    sections.push({
      title: `👤 Karakter ${i + 1}–${Math.min(i + MAX, inventory.length)}`,
      rows: slice.map(item => {
        const char = getCharacterById(item.id)
        const icon = getRarityIcon(char || item)
        const displayName = char?.name ?? item.name
        return {
          header: icon,
          title: `${icon} ${displayName}`,
          description: `ID: ${item.id} • ${item.rarity}`,
          id: `.allchar char_menu ${item.id} ${targetJid}`
        }
      })
    })
  }

  return naze.sendListMsg(m.chat, {
    text: [
      '👤 𝐊𝐄𝐋𝐎𝐋𝐀 𝐊𝐀𝐑𝐀𝐊𝐓𝐄𝐑',
      '',
      `👤 Target  : ${targetName}`,
      `📦 Koleksi : ${inventory.length} karakter`,
      '',
      'Pilih karakter yang ingin dikelola:'
    ].join('\n'),
    footer: 'Owner Character Manager v1.6.1',
    buttons: [{
      name: 'single_select',
      buttonParamsJson: {
        title: '👤 Daftar Karakter',
        sections
      }
    }]
  }, { quoted: m })
}

// ─── Menu satu karakter (Berikan / Hapus) ─────────────────────

const _allcharShowCharMenu = async (naze, m, db, charId, targetJid) => {
  const char = getCharacterById(charId)
  if (!char) return m.reply(`❌ Karakter tidak ditemukan di Registry: ${charId}`)

  const targetUser = db.users[targetJid]
  if (!targetUser) return m.reply('❌ Data user tidak ditemukan.')
  _allcharEnsureUser(targetUser)

  const targetName = targetUser.name || targetJid.split('@')[0]
  const owned      = hasCharacter(targetUser, charId)
  const icon       = getRarityIcon(char)

  return naze.sendListMsg(m.chat, {
    text: [
      '👤 𝐌𝐄𝐍𝐔 𝐊𝐀𝐑𝐀𝐊𝐓𝐄𝐑',
      '',
      `${icon} ${char.name}`,
      `🆔 ID     : ${char.id}`,
      `🎖️ Rarity : ${char.rarity}`,
      '',
      `👤 Target : ${targetName}`,
      `📋 Status : ${owned ? '✅ Sudah dimiliki' : '❌ Belum dimiliki'}`,
      '',
      'Pilih aksi:'
    ].join('\n'),
    footer: 'Owner Character Manager v1.6.1',
    buttons: [{
      name: 'single_select',
      buttonParamsJson: {
        title: `👤 ${char.name}`,
        sections: [{
          title: '📋 Pilih Aksi',
          rows: [
            {
              header: '📥',
              title: '📥 Berikan Karakter',
              description: owned ? 'Karakter sudah dimiliki' : `Berikan ${char.name} ke ${targetName}`,
              id: `.allchar give_char ${charId} ${targetJid}`
            },
            {
              header: '🗑️',
              title: '🗑️ Hapus Karakter',
              description: owned ? `Hapus ${char.name} dari ${targetName}` : 'Karakter tidak dimiliki',
              id: `.allchar del_char ${charId} ${targetJid}`
            }
          ]
        }]
      }
    }]
  }, { quoted: m })
}

// ─── 📥 Berikan satu karakter ───────────────────────────────────

const _allcharGiveChar = async (m, db, charId, targetJid) => {
  const char = getCharacterById(charId)
  if (!char) return m.reply(`❌ Karakter tidak ditemukan di Registry: ${charId}`)

  const targetUser = db.users[targetJid]
  if (!targetUser) return m.reply('❌ Data user tidak ditemukan.')
  _allcharEnsureUser(targetUser)

  const targetName = targetUser.name || targetJid.split('@')[0]
  const icon       = getRarityIcon(char)

  if (hasCharacter(targetUser, charId)) {
    return m.reply([
      'ℹ️ Karakter Sudah Dimiliki',
      '',
      `${icon} ${char.name}`,
      '',
      `👤 ${targetName} sudah memiliki karakter ini.`
    ].join('\n'))
  }

  addCharacterToInventory(targetUser, char, 'owner_give')
  if (!targetUser.umaStats[char.id]) {
    targetUser.umaStats[char.id] = initUmaStats(char)
  }

  return m.reply([
    '✅ Karakter Berhasil Diberikan!',
    '',
    `${icon} ${char.name}`,
    `🆔 ID     : ${char.id}`,
    `🎖️ Rarity : ${char.rarity}`,
    '',
    `👤 Target : ${targetName}`,
    `📦 Total  : ${targetUser.inventory.length} karakter`
  ].join('\n'))
}

// ─── 🗑️ Hapus satu karakter ──────────────────────────────────────

const _allcharDelChar = async (m, db, charId, targetJid) => {
  const char     = getCharacterById(charId)
  const charName = char?.name ?? charId
  const icon     = char ? getRarityIcon(char) : '⬜'

  const targetUser = db.users[targetJid]
  if (!targetUser) return m.reply('❌ Data user tidak ditemukan.')
  _allcharEnsureUser(targetUser)

  const targetName = targetUser.name || targetJid.split('@')[0]

  if (!hasCharacter(targetUser, charId)) {
    return m.reply([
      'ℹ️ Karakter Tidak Dimiliki',
      '',
      `${icon} ${charName}`,
      '',
      `👤 ${targetName} tidak memiliki karakter ini.`
    ].join('\n'))
  }

  const wasActive = targetUser.activeUma === charId
  _allcharRemoveChar(targetUser, charId)

  return m.reply([
    '🗑️ Karakter Berhasil Dihapus!',
    '',
    `${icon} ${charName}`,
    `🆔 ID    : ${charId}`,
    '',
    `👤 Target : ${targetName}`,
    `📦 Sisa   : ${targetUser.inventory.length} karakter`,
    ...(wasActive ? ['', '⚠️ Karakter aktif otomatis dikosongkan. Gunakan .selectuma untuk memilih ulang.'] : [])
  ].join('\n'))
}

// ─── MAIN EXPORT ────────────────────────────────────────────────
//
// Seluruh sub-action (dari tombol interaktif maupun pemanggilan
// manual) tetap masuk lewat command ".allchar" ini — TIDAK ada
// case baru yang ditambahkan ke naze.js untuk fitur ini.

export const allchar = async (naze, m, db, args) => {
  try {
    const sub = (args?.[0] ?? '').toLowerCase().trim()

    if (!sub) {
      const targetJid = _allcharResolveTarget(m, db)
      return _allcharShowMain(naze, m, db, targetJid)
    }

    if (sub === 'give_all') {
      const targetJid = args[1] ?? _allcharResolveTarget(m, db)
      if (!db.users[targetJid]) return m.reply('❌ Data user tidak ditemukan.')
      return _allcharGiveAll(m, db, targetJid)
    }

    if (sub === 'del_all') {
      const targetJid = args[1] ?? _allcharResolveTarget(m, db)
      if (!db.users[targetJid]) return m.reply('❌ Data user tidak ditemukan.')
      return _allcharDelAll(m, db, targetJid)
    }

    if (sub === 'manage') {
      const targetJid = args[1] ?? _allcharResolveTarget(m, db)
      if (!db.users[targetJid]) return m.reply('❌ Data user tidak ditemukan.')
      return _allcharShowManage(naze, m, db, targetJid)
    }

    if (sub === 'char_menu') {
      const charId    = args[1] ?? ''
      const targetJid = args[2] ?? _allcharResolveTarget(m, db)
      if (!charId) return m.reply('❌ Karakter tidak valid.')
      if (!db.users[targetJid]) return m.reply('❌ Data user tidak ditemukan.')
      return _allcharShowCharMenu(naze, m, db, charId, targetJid)
    }

    if (sub === 'give_char') {
      const charId    = args[1] ?? ''
      const targetJid = args[2] ?? _allcharResolveTarget(m, db)
      if (!charId) return m.reply('❌ Karakter tidak valid.')
      if (!db.users[targetJid]) return m.reply('❌ Data user tidak ditemukan.')
      return _allcharGiveChar(m, db, charId, targetJid)
    }

    if (sub === 'del_char') {
      const charId    = args[1] ?? ''
      const targetJid = args[2] ?? _allcharResolveTarget(m, db)
      if (!charId) return m.reply('❌ Karakter tidak valid.')
      if (!db.users[targetJid]) return m.reply('❌ Data user tidak ditemukan.')
      return _allcharDelChar(m, db, charId, targetJid)
    }

    // Sub-command tidak dikenal → fallback ke menu utama
    const targetJid = _allcharResolveTarget(m, db)
    return _allcharShowMain(naze, m, db, targetJid)

  } catch (err) {
    console.log('❌ ALLCHAR ERROR:', err)
    return m.reply('❌ Character Manager Error.')
  }
}
console.log('🏪 UMA SHOP v2 LOADED')
