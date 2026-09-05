import { getCharacterById } from '../shop/karakter.js'

const championQuote = {
  oguri_banner:
'🥕 Aku hanya berlari mengikuti perutku.',
  rudolf_banner:
'👑 Seorang kaisar akan selalu berada di depan.',
  gold_ship_banner:
'🚢 Jangan tanya strategiku. Aku juga tidak tahu.',
  rice_shower_banner:
'🌙 Aku akan berusaha membawa keberuntungan.',
  maruzensky_banner:
'🏎️ Kecepatan adalah kebebasan.',
  mejiro_mcqueen_banner:
'☕ Elegansi adalah bagian dari kemenangan.',
  tokai_teio_banner:
'✨ Aku akan bangkit berkali-kali!',
  special_week_banner:
'🌸 Aku akan memberikan yang terbaik!',
  air_groove_banner:
'📚 Strategi adalah segalanya.',
  mihono_bourbon_banner:
'🤖 Misi diterima. Menuju kemenangan.',
  // Legacy IDs (kompatibel ke belakang)
  oguri: '🥕 Aku hanya berlari mengikuti perutku.',
  rudolf: '👑 Seorang kaisar akan selalu berada di depan.',
  goldship: '🚢 Jangan tanya strategiku. Aku juga tidak tahu.',
  rice: '🌙 Aku akan berusaha membawa keberuntungan.',
  maruzensky: '🏎️ Kecepatan adalah kebebasan.',
  mcqueen: '☕ Elegansi adalah bagian dari kemenangan.',
  teio: '✨ Aku akan bangkit berkali-kali!',
  specialweek: '🌸 Aku akan memberikan yang terbaik!',
  airgroove: '📚 Strategi adalah segalanya.',
  bourbon: '🤖 Misi diterima. Menuju kemenangan.'
}

export const umalb = async (
  naze,
  m,
  db
) => {

  try {

    let data = []

    for (let id in db.users) {

      let user = db.users[id]

      // Lewati jika tidak punya activeUma atau stats aktif
      if (!user.activeUma) continue

      let stats = user.umaStats?.[user.activeUma]

      if (!stats) continue

      data.push({
        id,
        name: user.name || id.split('@')[0],
        win: stats.win || 0,
        activeUma: user.activeUma
      })

    }

    if (!data.length)
      return m.reply('🏇 Belum ada data leaderboard.')

    data.sort((a, b) => b.win - a.win)

    data = data.slice(0, 10)

    const top = data[0]

    const quote =
      championQuote[top.activeUma] ||
      '🏇 Menuju kemenangan.'

    let teks = '🏆 𝐔𝐌𝐀 𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃\n\n'

    data.forEach((v, i) => {

      const medal =
        i === 0 ? '🥇' :
        i === 1 ? '🥈' :
        i === 2 ? '🥉' :
        '🏅'

      // Gunakan sistem karakter baru
      const uma = getCharacterById(v.activeUma)

      teks +=
`${medal} ${v.name}

🏇 ${uma?.name || v.activeUma || '-'}

🏅 ${v.win} Win

────────────

`

    })

    // Nama uma juara
    const topUma = getCharacterById(top.activeUma)

    teks +=
`👑 𝐂𝐇𝐀𝐌𝐏𝐈𝐎𝐍

🏇 ${topUma?.name || top.activeUma || '-'}

💬 "${quote}"`

    return naze.sendMessage(
      m.chat,
      { text: teks },
      { quoted: m }
    )

  }

  catch (err) {

    console.log('❌ UMALB')
    console.log(err)
    return m.reply('❌ Leaderboard Error')

  }

}

console.log('🏆 UMALB LOADED')
