import { globalSpam, resolveActiveUma } from './umahelper.js'
import { addBankActivity } from './bankaktivitas.js'

// Konfigurasi hadiah race5 (dulunya diimport dari umamusume.js)
const raceReward = {
  min: 10000,
  max: 100000
}
import { ownerStats } from './umaowner.js'
import { getRandomNpc, generateNpcStats, generateNpcSkill, allCharacterPool } from './shop/karakter.js'
import { getCharacterImage } from './umaimage.js'
import { getCharacterById, getNpcById } from './shop/karakterHelper.js'
/// ⚙️ KONFIGURASI
const VERSI = '1.2'
const MAX_PLAYER = 5
const MIN_PLAYER = 1
const LOBBY_WAKTU = 60000   // 1 menit tunggu pemain
const COOLDOWN = 120000     // 2 menit istirahat pasca balapan

// 📦 PENYIMPANAN RUANG
let raceRooms = {}

// ================================
// 🤖 AI HELPER
// ================================

// Nama trainer cadangan jika npc.json kosong
const NAMA_CADANGAN = [
  'Trainer Nana', 'Trainer Sora', 'Trainer Haru',
  'Trainer Mio', 'Trainer Ren', 'Trainer Kei',
  'Trainer Yuki', 'Trainer Aoi'
]

const getNamaAI = () => {
  try {
    const npc = getRandomNpc()
    if (npc?.name) return `Trainer ${npc.name}`
  } catch { /* lewati */ }
  return NAMA_CADANGAN[Math.floor(Math.random() * NAMA_CADANGAN.length)]
}

const buatPemainAI = () => {
  // Pilih uma acak dari pool
  const uma = allCharacterPool[Math.floor(Math.random() * allCharacterPool.length)]
  if (!uma) return null

  // Buat stats dasar NPC menggunakan generateNpcStats
  const npcStat = generateNpcStats('balanced')
  const npcSkill = generateNpcSkill()

  // Hitung stats gabungan: stats uma base + npc stats sebagai modifier
  const statBase = uma.stats || { speed: 70, stamina: 70, power: 70, accel: 70 }
  const statAI = {
    speed:   Math.min(1200, statBase.speed + npcStat.speed),
    stamina: Math.min(1200, statBase.stamina + npcStat.stamina),
    power:   Math.min(1200, statBase.power + npcStat.power),
    accel:   Math.min(1200, statBase.accel + npcStat.accel),
    level: npcStat.level,
    win: 0,
    lose: 0
  }

  // Gunakan ownerStats agar stat di-cap dengan benar
  const { stats: statFinal } = ownerStats(uma, statAI)

  return {
    jid: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    nama: getNamaAI(),
    uma: { ...uma, skill: npcSkill },
    stats: statFinal,
    isAI: true
  }
}

// 🚀 BUAT RUANG BARU
export const race5 = async (naze, m, db, args) => {
  try {
    const idGrup = m.chat
    const pembuat = m.sender
    const userDb = db.users[pembuat]
    const p = '.'

    // Deteksi mode AI
    const modeAI = (args?.[0] ?? '').toLowerCase() === 'ai'
    
    if (!userDb.race5Cd) userDb.race5Cd = 0
    const sisaCd = userDb.race5Cd - Date.now()
    if (sisaCd > 0) {
      const menit = Math.floor(sisaCd / 60000)
      const detik = Math.floor((sisaCd % 60000) / 1000)
    
      return m.reply(`⏳ Istirahat dulu ${menit}m ${detik}s sebelum balapan lagi`)
    }

    // Cek spam
    const spam = globalSpam('race5', 25)
    if (!spam.ok) {
      if (spam.warn) {
        const t = Math.ceil(spam.sisa / 1000)
        return m.reply(`🏇 BALAPAN 5 PEMAIN v${VERSI}\n\n⏳ Tunggu ${t} detik dulu`)
      }
      return
    }

    // Cek sudah ada ruang
    if (raceRooms[idGrup])
      return m.reply(`⚠️ Ruang balapan sudah ada!\nGunakan *${p}inforoom5* untuk lihat detail`)

    // Cek sudah pilih Uma
    if (!userDb.activeUma)
      return m.reply(`❌ Kamu belum punya Uma balapan\nGunakan *${p}selectuma* dulu`)

    const dataUma =
        getCharacterById(userDb.activeUma) ||
        getNpcById(userDb.activeUma)
    if (!dataUma)
      return m.reply(`❌ Uma tidak ditemukan. Coba *${p}selectuma* ulang`)

    const statUma = ownerStats(dataUma, userDb.umaStats?.[userDb.activeUma] ?? dataUma.stats).stats

    // Buat ruang
    raceRooms[idGrup] = {
      host: pembuat,
      mulai: false,
      modeAI,
      timer: null,
      pemain: [{
        jid: pembuat,
        nama: userDb.name || m.pushName || pembuat.split('@')[0],
        uma: dataUma,
        stats: statUma
      }]
    }

    const infoMode = modeAI
      ? '\n🤖 Mode AI aktif — slot kosong diisi AI otomatis'
      : ''

await naze.sendMessage(m.chat, {
  text: `🏇 RUANG BALAPAN DIBUKA v${VERSI}

👑 Pembuat: @${pembuat.split('@')[0]}
👥 Pemain: 1/${MAX_PLAYER}${infoMode}

📝 Perintah:
• ${p}join5 — ikut balapan
• ${p}inforoom5 — lihat daftar
• ${p}start5 — mulai paksa (host)
• ${p}start5 ai — buka dengan AI
• ${p}batalroom5 — bubarkan ruang

⏳ Menunggu pemain selama 1 menit...`,
  mentions: [pembuat]
}, {
  quoted: m
})

    // Mulai otomatis waktu habis
    raceRooms[idGrup].timer = setTimeout(() => {
      if (modeAI) isiAI(idGrup)
      mulaiBalapan(naze, m, db, idGrup)
    }, LOBBY_WAKTU)

  } catch (err) {
    console.log('❌ RACE5', err)
    m.reply('❌ Gagal membuat ruang balapan')
  }
}

// ✅ MASUK KE RUANG
export const join5 = async (naze, m, db) => {
  try {
    const idGrup = m.chat
    const pengirim = m.sender
    const userDb = db.users[pengirim]
    const ruang = raceRooms[idGrup]
    const p = '.'
    
    if (!userDb.race5Cd) userDb.race5Cd = 0
    const sisaCd = userDb.race5Cd - Date.now()
    if (sisaCd > 0) {
      const menit = Math.floor(sisaCd / 60000)
      const detik = Math.floor((sisaCd % 60000) / 1000)
    
      return m.reply(`⏳ Istirahat dulu ${menit}m ${detik}s sebelum balapan lagi`)
    }

    if (!ruang)
      return m.reply(`❌ Belum ada ruang balapan\nBuat dulu pakai *${p}race5*`)
    if (ruang.mulai)
      return m.reply('❌ Balapan sudah dimulai, tidak bisa masuk lagi')
    if (ruang.pemain.some(i => i.jid === pengirim))
      return m.reply('✅ Kamu sudah ada di dalam ruang')

    // Hitung slot yang tersisa (kecualikan AI yang sudah ada)
    const slotManusia = ruang.pemain.filter(i => !i.isAI).length
    const totalPemain = ruang.pemain.length
    if (totalPemain >= MAX_PLAYER)
      return m.reply('❌ Ruang sudah penuh! Maksimal 5 orang')

    if (!userDb.activeUma)
      return m.reply(`❌ Belum pilih Uma balapan\nGunakan *${p}selectuma* dulu`)

    const dataUma = getCharacterById(userDb.activeUma)
    if (!dataUma)
      return m.reply(`❌ Uma tidak ditemukan. Coba *${p}selectuma* ulang`)

    const statUma = ownerStats(
      dataUma,
      userDb.umaStats?.[userDb.activeUma] ?? dataUma.stats
    ).stats

    ruang.pemain.push({
      jid: pengirim,
      nama: userDb.name || m.pushName || pengirim.split('@')[0],
      uma: dataUma,
      stats: statUma
    })

    m.reply(`✅ Berhasil masuk!\n👥 Jumlah pemain: ${ruang.pemain.length}/${MAX_PLAYER}`)

    // Langsung matikan timer lobby sebelum trigger mulaiBalapan agar tidak double run
    if (ruang.pemain.length >= MAX_PLAYER) {
      clearTimeout(ruang.timer)
      await mulaiBalapan(naze, m, db, idGrup)
    }

  } catch (err) {
    console.log('❌ JOIN5', err)
    m.reply('❌ Gagal masuk ke ruang')
  }
}

// ℹ️ LIHAT INFO RUANG
export const inforoom5 = async (naze, m) => {
  try {
    const idGrup = m.chat
    const ruang = raceRooms[idGrup]

    if (!ruang)
      return m.reply('❌ Saat ini tidak ada ruang balapan aktif')

    const daftar = ruang.pemain.map((i, n) =>
      `${n+1}. ${i.nama}${i.isAI ? ' 🤖' : ''} — ${i.uma.name}`
    ).join('\n')

    await naze.sendMessage(
  m.chat,
  {
    text: `🏇 INFO RUANG BALAPAN v${VERSI}

👑 Pembuat: @${ruang.host.split('@')[0]}
👥 Pemain: ${ruang.pemain.length}/${MAX_PLAYER}
🤖 Mode AI: ${ruang.modeAI ? 'Aktif' : 'Mati'}
📊 Status: ${ruang.mulai ? 'Sedang berlangsung' : 'Menunggu pemain'}

📋 Daftar peserta:
${daftar || 'Belum ada peserta lain'}`,
    mentions: [ruang.host]
  },
  { quoted: m }
)

  } catch (err) {
    console.log('❌ INFOROOM5', err)
    m.reply('❌ Gagal mengambil data ruang')
  }
}

// ❌ BATALKAN / BUBARKAN RUANG
export const batalroom5 = async (naze, m) => {
  try {
    const idGrup = m.chat
    const pengirim = m.sender
    const ruang = raceRooms[idGrup]

    if (!ruang)
      return m.reply('❌ Tidak ada ruang balapan yang bisa dibatalkan')
    if (ruang.host !== pengirim)
      return m.reply('❌ Hanya pembuat ruang yang boleh membatalkan')

    clearTimeout(ruang.timer)
    delete raceRooms[idGrup]

    m.reply('🛑 Ruang balapan telah dibubarkan')

  } catch (err) {
    console.log('❌ BATALROOM5', err)
    m.reply('❌ Gagal membatalkan ruang')
  }
}

// ▶️ COMMAND START5 (host bisa paksa mulai)
export const start5 = async (naze, m, db, args) => {
  try {
    const ruang = raceRooms[m.chat]

    if (!ruang)
      return m.reply('❌ Tidak ada ruang balapan')

    if (ruang.mulai)
      return m.reply('❌ Balapan sudah dimulai')

    if (ruang.host !== m.sender)
      return m.reply('❌ Hanya host yang bisa memulai balapan')

    // Deteksi mode AI dari argumen start5
    const modeAIArg = (args?.[0] ?? '').toLowerCase() === 'ai'
    if (modeAIArg) ruang.modeAI = true

    // Isi AI dulu jika mode AI aktif
    if (ruang.modeAI) isiAI(m.chat)

    const jumlahManusia = ruang.pemain.filter(i => !i.isAI).length

    if (jumlahManusia < MIN_PLAYER)
      return m.reply(`❌ Minimal ${MIN_PLAYER} pemain manusia untuk memulai balapan`)

    clearTimeout(ruang.timer)
    await mulaiBalapan(naze, m, db, m.chat)

  } catch (err) {
    console.log('❌ START5', err)
    m.reply('❌ Gagal memulai balapan')
  }
}

// ================================
// 🤖 ISI SLOT AI
// ================================

const isiAI = (idGrup) => {
  const ruang = raceRooms[idGrup]
  if (!ruang || ruang.mulai) return

  while (ruang.pemain.length < MAX_PLAYER) {
    const ai = buatPemainAI()
    if (!ai) break
    ruang.pemain.push(ai)
  }
}

// 🏁 FUNGSI INTI: MULAI BALAPAN
async function mulaiBalapan(naze, m, db, idGrup) {
  try {
    const ruang = raceRooms[idGrup]
    if (!ruang || ruang.mulai) return

    // Validasi jumlah pemain manusia
    const jumlahManusia = ruang.pemain.filter(i => !i.isAI).length
    if (jumlahManusia < MIN_PLAYER) {
      delete raceRooms[idGrup]
      return await naze.sendMessage(idGrup, {
        text: '❌ Belum cukup pemain manusia, ruang dibubarkan'
      })
    }

    ruang.mulai = true
    clearTimeout(ruang.timer)

    const bank = db.bank
    if (!bank.kas) bank.kas = 0
    if (!bank.danaKeluar) bank.danaKeluar = 0
    if (bank.totalRace == null) bank.totalRace = 0

    // Hitung bonus keterampilan
    const hitungSkill = uma => {
      const sk = uma.skill || {}
      let bonus = 0
      if (sk.boost?.all) bonus += sk.boost.all
      if (sk.boost?.speed) bonus += sk.boost.speed
      if (sk.boost?.stamina) bonus += sk.boost.stamina
      if (sk.boost?.power) bonus += sk.boost.power
      if (sk.boost?.accel) bonus += sk.boost.accel
      if (sk.boost?.random) bonus = Math.floor(Math.random() * 301) - 100
      if (sk.boost?.goldRandom) bonus = Math.random() < 0.4 ? Math.floor(Math.random() * 1151) + 50 : Math.floor(Math.random() * 101) - 50
      return bonus
    }

    // Siapkan data semua peserta
    let daftarPeserta = ruang.pemain.map(p => {
      const bns = hitungSkill(p.uma)
      return {
        ...p,
        bonus: bns,
        total: p.stats.speed + p.stats.stamina + p.stats.power + p.stats.accel + bns,
        poin: 0
      }
    })

    // Pesan pembuka
    const teksMulai = daftarPeserta.map((i, n) =>
      `${n+1}. ${i.nama}${i.isAI ? ' 🤖' : ''} • ${i.uma.name}`
    ).join('\n')

    const pesanUtama = await naze.sendMessage(m.chat, {
      text: `🏇 BALAPAN DIMULAI!\n\n${teksMulai}\n\n🚩 Bersiaplah...`
    })

    const komentar = ['🚩 Gerbang terbuka!', '💨 Semua melesat kencang!', '🔥 Posisi mulai berubah!', '😱 Persaingan makin ketat!', '🏁 Garis finis di depan mata!']

    // Jalankan putaran balapan
    for (let p = 0; p < komentar.length; p++) {
      await new Promise(t => setTimeout(t, 3000))

      daftarPeserta.forEach(i => {
        i.poin = Math.min(5, i.poin + Math.floor(Math.random() * 2))
      })
      if (p === komentar.length - 1) {
        daftarPeserta.forEach(i => i.poin = 5)
      }
      const tampilan = daftarPeserta.map(i =>
        `${i.nama}${i.isAI ? ' 🤖' : ''}\n${'🟩'.repeat(i.poin)}${'⬜'.repeat(5 - i.poin)}`
      ).join('\n\n')
       
      await naze.sendMessage(m.chat, {
        edit: pesanUtama.key,
        text: `🏇 BALAPAN BERLANGSUNG\n\n${tampilan}\n\n🎙️ ${komentar[p]}`
      })
    }

    // Urutkan hasil akhir (Berdasarkan total stat+bonus, pemutus dasi menggunakan poin)
    daftarPeserta.sort((a, b) => b.total - a.total || b.poin - a.poin)
    const juara = daftarPeserta[0]

    // Bagikan hadiah (hanya ke pemain manusia yang menang)
    const reward = raceReward
    let hadiah = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min
    hadiah = Math.min(hadiah, bank.kas)
    bank.kas -= hadiah
    bank.danaKeluar += hadiah
    bank.totalRace++

    // Hadiah hanya untuk juara manusia
    if (!juara.isAI) {
      const dataJuaraDb = db.users[juara.jid]
      if (dataJuaraDb) dataJuaraDb.money += hadiah
    }

    // Cooldown hanya untuk pemain manusia
    daftarPeserta.forEach(i => {
      if (!i.isAI && db.users[i.jid]) {
        db.users[i.jid].race5Cd = Date.now() + COOLDOWN
      }
    })

    // Simpan data menang/kalah (hanya untuk pemain manusia)
    if (!juara.isAI && db.users[juara.jid]?.umaStats?.[juara.uma.id]) {
      db.users[juara.jid].umaStats[juara.uma.id].win++
    }
    daftarPeserta.slice(1).forEach(i => {
      if (!i.isAI && db.users[i.jid]?.umaStats?.[i.uma.id]) {
        db.users[i.jid].umaStats[i.uma.id].lose++
      }
    })

    if (typeof addBankActivity === 'function') {
      const labelJuara = juara.isAI ? `${juara.nama} (AI)` : juara.nama
      addBankActivity(db, `🏆 ${labelJuara} juara balapan 5 pemain +${hadiah.toLocaleString()} Carats`)
    }

    // Gambar pemenang via umaimage
    let gambar = null
    try {
      const imageUrl = getCharacterImage(juara.uma)
      if (imageUrl) gambar = { url: imageUrl }
    } catch {
      console.log('⚠️ [RACE5] Gagal load gambar pemenang')
    }

    // Teks hasil akhir
    const labelHadiah = juara.isAI
      ? `(AI menang — hadiah tidak diberikan)`
      : `💰 Hadiah: ${hadiah.toLocaleString('id-ID')} Carats`

    const hasilTeks = `🏆 HASIL BALAPAN v${VERSI}

🥇 Pemenang: ${juara.nama}${juara.isAI ? ' 🤖' : ''}
🏇 Uma: ${juara.uma.name}
${labelHadiah}

📊 Klasemen Akhir:
${daftarPeserta.map((i, n) =>
  `${n+1}. ${i.nama}${i.isAI ? ' 🤖' : ''} — Final Skor: ${i.total}`
).join('\n')}

💬 "${juara.uma.quoteWin || 'Balapan selesai, sampai jumpa di lintasan berikutnya!'}"`

    if (gambar) {
      await naze.sendMessage(m.chat, { image: gambar, caption: hasilTeks }, { quoted: m })
    } else {
      await naze.sendMessage(m.chat, { text: hasilTeks }, { quoted: m })
    }

    // Bersihkan ruang
    delete raceRooms[idGrup]

  } catch (err) {
    console.log('❌ PROSES BALAPAN', err)

    await naze.sendMessage(idGrup, {
      text: '❌ Terjadi kesalahan saat balapan berlangsung'
    })

    delete raceRooms[idGrup]
  }
}
