import { getCharacterByName, getCharacterById } from '../shop/karakter.js'
import { getBannerImage, getLimitedImage, getCharacterImage } from '../umaimage.js'

export const umainfo = async (naze, m, text) => {
  try {
    if (!text) {
      return m.reply(
`📖 𝐔𝐌𝐀 𝐈𝐍𝐅𝐎

Contoh:
.umainfo oguri`
      )
    }

    const cari = text.toLowerCase().trim()
    // Coba cari by id dulu, lalu by name
    let uma = getCharacterById(cari) ?? getCharacterByName(cari)

    if (!uma) {
      return m.reply('❌ Uma tidak ditemukan.')
    }

    const skill = uma.skill || {}
    const boost = []

    if (skill.boost?.all) boost.push(`🌟 All +${skill.boost.all}`)
    if (skill.boost?.speed) boost.push(`⚡ Speed +${skill.boost.speed}`)
    if (skill.boost?.stamina) boost.push(`❤️ Stamina +${skill.boost.stamina}`)
    if (skill.boost?.power) boost.push(`💪 Power +${skill.boost.power}`)
    if (skill.boost?.accel) boost.push(`💨 Accel +${skill.boost.accel}`)
    if (skill.boost?.random) boost.push('🎲 Random')
    if (skill.boost?.goldRandom) boost.push('🚢 Chaos Mode')

    // Gunakan getCharacterImage sebagai resolver universal (banner + limited)
    const resolvedUrl = getCharacterImage(uma)
    const thumb = resolvedUrl ? { url: resolvedUrl } : null

    const quote = uma.quoteWin || uma.quotes?.[0] || '🏇 Siap berlari!'

    // Harga tampilan berdasarkan rarity
    const hargaLabel = uma.exchangeCost > 0
      ? `🎖️ Exchange: ${uma.exchangeCost} Medal`
      : uma.recruitPrice > 0
        ? `💰 Rekrut: ${uma.recruitPrice.toLocaleString('id-ID')} Carats`
        : `✨ Khusus Banner`

    const rarityLabel = {
      legend: '🟡 Legend',
      epic: '🟣 Epic',
      rare: '🔵 Rare',
      limited: '🌸 Limited',
      npc: '🤝 NPC'
    }[uma.rarity] || uma.rarity

    const infoTeks =
`📖 𝐔𝐌𝐀 𝐈𝐍𝐅𝐎

🏇 ${uma.name}
${rarityLabel}

${hargaLabel}

🥕 Makanan Favorit
${uma.favorit || '-'}

📊 Stats Awal

⚡ Speed  : ${uma.stats?.speed ?? '-'}
❤️ Stamina: ${uma.stats?.stamina ?? '-'}
💪 Power  : ${uma.stats?.power ?? '-'}
💨 Accel  : ${uma.stats?.accel ?? '-'}

🌟 Skill Aktif
${skill.name || '-'}

📝 Deskripsi
${skill.desc || '-'}

📈 Boost Skill
${boost.length ? boost.join('\n') : '-'}

💬 Quote
"${quote}"`

    if (thumb) {
      return naze.sendMessage(m.chat, {
        image: thumb,
        caption: infoTeks
      }, { quoted: m })
    } else {
      return m.reply(infoTeks)
    }

  } catch (err) {
    console.log('❌ UMAINFO')
    console.error(err)
    return m.reply('❌ Terjadi kesalahan saat mengambil info Uma.')
  }
}

console.log('📖 UMAINFO LOADED')
