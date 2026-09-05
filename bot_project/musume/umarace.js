import { globalSpam, resolveActiveUma } from './umahelper.js'
import { addBankActivity } from './bankaktivitas.js'
import { ownerStats } from './umaowner.js'
import { getCharacterImage } from './umaimage.js'

// Konfigurasi hadiah
const raceReward = {
  min: 100000,
  max: 10000000
}

export const race = async (naze, m, db, isCreator) => {
  try {
    // Cek spam
    const spam = globalSpam('race', 25)
    if (!spam.ok) {
      if (spam.warn) {
        const detik = Math.ceil(spam.sisa / 1000)
        return m.reply(`🏇 𝐓𝐑𝐀𝐂𝐄𝐍 𝐑𝐀𝐂𝐄\n\n⏳ Tunggu ${detik}s`)
      }
      return
    }

    // Cek ada lawan yang ditandai
    if (!m.mentionedJid?.length) {
      return m.reply(
`🏇 𝐓𝐑𝐀𝐂𝐄𝐍 𝐑𝐀𝐂𝐄

Tag seseorang untuk diajak balapan 😹

Contoh:
.race @orang`
      )
    }

    const target = m.mentionedJid[0]
    const user = db.users?.[m.sender]
    const targetUser = db.users?.[target]

    // Validasi data pengguna
    if (!user) return m.reply('❌ Kamu belum terdaftar di database.')
    if (!targetUser) return m.reply('❌ Target belum terdaftar di database.')

    // Isi nama jika kosong
    if (!targetUser.name) targetUser.name = target.split('@')[0]

    // Cek sudah pilih Uma
    if (!user.activeUma) return m.reply('🏇 Kamu belum memilih Uma.\n\nGunakan .selectuma')
    if (!targetUser.activeUma) return m.reply('🏇 Target belum memiliki Uma.')

    // Cek cooldown
    if (!user.raceCooldown) user.raceCooldown = 0
    const sisaRace = user.raceCooldown - Date.now()
    if (sisaRace > 0) {
      const menit = Math.floor(sisaRace / 60000)
      const detik = Math.floor((sisaRace % 60000) / 1000)
      return m.reply(`🏇 𝐓𝐑𝐀𝐂𝐄𝐍 𝐑𝐀𝐂𝐄\n\n⏳ Istirahat dulu\n${menit}m ${detik}s`)
    }

    // Cari data Uma (banner atau NPC)
    const userUma = resolveActiveUma(user)
    const targetUma = resolveActiveUma(targetUser)
    if (!userUma) return m.reply('❌ Data Uma kamu tidak ditemukan.\n\nCoba .selectuma ulang.')
    if (!targetUma) return m.reply('❌ Data Uma target tidak ditemukan.')

    // ✅ Sistem pemilik pakai isCreator
    const isOwner = !!isCreator
    const targetIsOwner =
	target ===
	global.owner?.[0] +
	'@s.whatsapp.net'

    return startUmaRace({
      naze, m, db, user, targetUser, userUma, targetUma, isOwner, targetIsOwner
    })

  } catch (err) {
    console.log('\n❌ [RACE SETUP]', err)
    return m.reply(`❌ Gagal memulai balapan\n${err.message || 'Kesalahan tidak diketahui'}`)
  }
}

export const startUmaRace = async ({
  naze, m, db, user, targetUser, userUma, targetUma, isOwner, targetIsOwner
}) => {
  try {
    // Pastikan data bank ada
    if (!db.bank)
	return m.reply(
		'❌ Data bank tidak ditemukan.'
	)

    const bank = db.bank

    // Pastikan data statistik ada
    if (!user.umaStats) user.umaStats = {}
    if (!user.umaStats[user.activeUma]) user.umaStats[user.activeUma] = { win: 0, lose: 0 }
    if (!targetUser.umaStats) targetUser.umaStats = {}
    if (!targetUser.umaStats[targetUser.activeUma]) targetUser.umaStats[targetUser.activeUma] = { win: 0, lose: 0 }

    // Ambil statistik
    const myResult = ownerStats(userUma, user.umaStats[user.activeUma], isOwner)
    const enemyResult = ownerStats(targetUma, targetUser.umaStats[targetUser.activeUma], targetIsOwner)
    const my = myResult?.stats || myResult || {}
    const enemy = enemyResult?.stats || enemyResult || {}

    // Hitung keterampilan
    const applySkill = uma => {
      const skill = uma?.skill
      if (!skill || !skill.boost) return { bonus: 0, text: '' }

      let bonus = 0
      if (skill.boost.all) bonus += skill.boost.all
      if (skill.boost.speed) bonus += skill.boost.speed
      if (skill.boost.stamina) bonus += skill.boost.stamina
      if (skill.boost.power) bonus += skill.boost.power
      if (skill.boost.accel) bonus += skill.boost.accel

      if (skill.boost.random) bonus += Math.floor(Math.random() * 301) - 100
      if (skill.boost.goldRandom) {
        const hoki = Math.random() < 0.4
        bonus += hoki ? Math.floor(Math.random() * 1151) + 50 : Math.floor(Math.random() * 101) - 50
      }

      return {
        bonus,
        text: skill.name ? `✨ ${skill.name}\n${skill.desc || ''}` : ''
      }
    }

    const mySkill = applySkill(userUma)
    const enemySkill = applySkill(targetUma)

    // Hitung total nilai
    const myTotal = (my.speed || 0) + (my.stamina || 0) + (my.power || 0) + (my.accel || 0) + mySkill.bonus
    const enemyTotal = (enemy.speed || 0) + (enemy.stamina || 0) + (enemy.power || 0) + (enemy.accel || 0) + enemySkill.bonus

    // Pesan awal
    const msg =
await naze.sendMessage(
	m.chat,
	{
		text:
`🏇 𝐓𝐑𝐀𝐂𝐄𝐍 𝐑𝐀𝐂𝐄

🏁 ${userUma.name}
🆚
🏁 ${targetUma.name}

🎙️ Balapan dimulai...`
	},
	{
		quoted: m
	}
)
    const komentar = [
      '🚩 Gerbang dibuka!',
      '💨 Keduanya melesat!',
      '🔥 Persaingan memanas!',
      '😱 Penonton bersorak!',
      '⚡ Sprint terakhir!'
    ]

    let myPoint = 0
    let enemyPoint = 0

    // Jalankan putaran balapan
    for (let i = 0; i < komentar.length; i++) {
      await new Promise(r => setTimeout(r, 3500))

      myPoint = Math.min(5, myPoint + Math.floor(Math.random() * 2))
      enemyPoint = Math.min(5, enemyPoint + Math.floor(Math.random() * 2))

      let skillText = ''
      if (i === 2) {
        if (mySkill.text) skillText += `\n\n${mySkill.text}`
        if (enemySkill.text) skillText += `\n\n${enemySkill.text}`
      }

      if (i === komentar.length - 1) {
        myPoint = 5
        enemyPoint = 5
      }

      // ✅ Aman: gagal edit pesan tidak hentikan proses
      try {
        await naze.sendMessage(m.chat, {
          edit: msg.key,
          text: `🏇 𝐓𝐑𝐀𝐂𝐄𝐍 𝐑𝐀𝐂𝐄\n\n🏁 ${userUma.name}\n${'🟩'.repeat(myPoint)}${'⬜'.repeat(5 - myPoint)}\n\n🏁 ${targetUma.name}\n${'🟩'.repeat(enemyPoint)}${'⬜'.repeat(5 - enemyPoint)}\n\n🎙️ ${komentar[i]}${skillText}`
        })
      } catch { /* lewati jika gagal */ }
    }

    /// Tentukan pemenang
let winner, loser
let winnerDataStats, loserDataStats

if (myTotal >= enemyTotal) {
	winner = user
	loser = targetUser
	winnerDataStats = user.umaStats[user.activeUma]
	loserDataStats = targetUser.umaStats[targetUser.activeUma]
} else {
	winner = targetUser
	loser = user
	winnerDataStats = targetUser.umaStats[targetUser.activeUma]
	loserDataStats = user.umaStats[user.activeUma]
}

// Update statistik
winnerDataStats.win = (winnerDataStats.win || 0) + 1
loserDataStats.lose = (loserDataStats.lose || 0) + 1

// Hitung hadiah
let hadiah = Math.floor(Math.random() * (raceReward.max - raceReward.min + 1)) + raceReward.min

if (bank.kas > 0) {
	hadiah = Math.min(hadiah, bank.kas)
	bank.kas -= hadiah
}

bank.danaKeluar = (bank.danaKeluar || 0) + hadiah
bank.totalRace = (bank.totalRace || 0) + 1

winner.money = (winner.money || 0) + hadiah

const namaPemenang = winner === user
	? (user.name || m.pushName || m.sender.split('@')[0])
	: (targetUser.name || 'Pemain')

try {
	addBankActivity(
		db,
		`🏆 ${namaPemenang} memenangkan balapan dan menerima ${hadiah.toLocaleString('id-ID')} Carats`
	)
} catch {}

// Data Uma
const winnerUma = winner === user ? userUma : targetUma
const loserUma = loser === user ? userUma : targetUma

    // Gambar aman
    const thumb = {
      url: getCharacterImage(winnerUma) ?? ''
    }

    await new Promise(r => setTimeout(r, 2500))

    // ✅ Kirim hasil akhir, aman jika gambar gagal
    try {
      await naze.sendMessage(m.chat, {
        ...(thumb.url && { image: thumb }),
        caption: `🏆 𝐑𝐀𝐂𝐄 𝐅𝐈𝐍𝐈𝐒𝐇\n\n🥇 Pemenang: ${winnerUma.name}\n\n💰 Hadiah: ${hadiah.toLocaleString('id-ID')} Carats\n\n📊 Statistik ${winnerUma.name}:\n🏅 Menang: ${winnerDataStats.win}\n🥀 Kalah: ${winnerDataStats.lose}\n\n📊 Statistik ${loserUma.name}:\n🏅 Menang: ${loserDataStats.win}\n🥀 Kalah: ${loserDataStats.lose}\n\n💬 ${winnerUma.quoteWin || 'Balapan selesai!'}`
      }, { quoted: m })
    } catch {
      // Kirim versi teks saja jika gambar gagal
      await m.reply(`🏆 𝐑𝐀𝐂𝐄 𝐅𝐈𝐍𝐈𝐒𝐇\n\n🥇 Pemenang: ${winnerUma.name}\n💰 Hadiah: ${hadiah.toLocaleString('id-ID')} Carats`)
    }

    // Terapkan cooldown
    user.raceCooldown = Date.now() + 120000

    console.log('✅ Race selesai')

  } catch (err) {
    console.log('\n❌ [UMA RACE ERROR]', err)
    return m.reply(`❌ Uma Race Error\n${err.message || 'Kesalahan tidak diketahui'}`)
  }
}

console.log('🏇 UMARACE LOADED')
