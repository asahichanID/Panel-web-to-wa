import { getCharacterById } from '../shop/karakter.js'
import { getCharacterImage } from '../umaimage.js'
import { getUmaRank } from '../rank.js'

// ===============================================
// 👤 COMMAND : .PROFILE
// ===============================================
//
// Menggunakan Character System V2 (getCharacterById).
// Menampilkan nama lengkap karakter aktif termasuk Limited.
// Contoh: Oguri Cap [Ashen Miracle]
// Prioritas thumbnail → image fallback untuk karakter aktif.

const getCharImageUrl = (char) => {
  if (!char) return null
  return getCharacterImage(char) ?? null
}

export const profile = async (
  naze,
  m,
  db,
  premium,
  checkStatus
) => {

  try {

    let target

    if (m.mentionedJid?.[0]) {
      target = m.mentionedJid[0]
    } else if (m.quoted) {
      target = m.quoted.sender
    } else {
      target = m.sender
    }

    const infoUser = db.users[target]

    if (!infoUser)
      return m.reply('❌ Trainer tidak ditemukan.')

    const isOwner = global.owner
      .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
      .includes(target)

    const isPremium = checkStatus
      ? checkStatus(target, premium)
      : false

    let role = '🌱 Trainer'
    if (isOwner) role = '👑 Head Trainer'
    else if (isPremium) role = '⭐ Premium Trainer'
    else if (infoUser.vip) role = '💎 VIP Trainer'

    // ── Uma Aktif via Character System V2 ──
    let umaAktif = 'Belum dimiliki'
    let umaLevel = '-'
    let umaRank = '🌱 Rookie'
    let umaPoint = 0
    let umaQuote = '"Belum memiliki partner Uma Musume 🏇"'
    let umaKoleksi = (infoUser.npcCollection?.length ?? 0)
    let bannerKoleksi = (infoUser.inventory?.length ?? 0)
    let thumbnailUrl = null

    if (infoUser.activeUma) {
      // Cari di Character System V2 (Banner)
      const char = getCharacterById(infoUser.activeUma)

      if (char) {
        // Nama lengkap termasuk Limited tag
        // Contoh: "Oguri Cap [Ashen Miracle]"
        umaAktif = char.name
        thumbnailUrl = getCharImageUrl(char)
        umaQuote = `"${char.quotes?.[Math.floor(Math.random() * char.quotes.length)] ?? '🏇 Siap berlari!'}"`
      } else {
        // Cari di NPC Collection
        const npcEntry = infoUser.npcCollection?.find(n =>
          infoUser.activeUma === n.id || infoUser.activeUma.startsWith(n.id + '_')
        )
        if (npcEntry) {
          umaAktif = npcEntry.name
          umaQuote = '"🤝 NPC siap berlari bersama Trainer!"'
        }
      }

      const stats = infoUser.umaStats?.[infoUser.activeUma]
      if (stats) {
        umaLevel = stats.level ?? 1
        const rank = getUmaRank(stats, isOwner)
        umaRank = rank.rank
        umaPoint = rank.point
      }
    }

    // Profile picture
    let pp
    try {
      pp = await naze.profilePictureUrl(target, 'image')
    } catch {
      pp = 'https://raw.githubusercontent.com/asahichanID/Umaimage/main/uma/Thumbnail/profile_default.jpg'
     
    }

  const teks = `╭─❖ *T R A N E R   P R O F I L*

✦ *INFORMATION*

  ◈ Trainer   : @${target.split('@')[0]}
  ◈ Role      : ${role}
  ◈ Uma       : ${umaAktif}
  ◈ Level     : ${umaLevel}

✦ *PROGRESSION*

  ◈ Rank      : ${umaRank}
  ◈ Point     : ${umaPoint.toLocaleString('id-ID')} 
  ◈ NPC       : ${umaKoleksi} Uma
  ◈ Banner    : ${bannerKoleksi} Karakter

✦ *RESOURCE*

  💎 Carats   : ${(infoUser.money ?? 0).toLocaleString('id-ID')}
  🏅 Medal    : ${(infoUser.medal ?? 0).toLocaleString('id-ID')}
  🎫 Ticket   : ${(infoUser.limit ?? 0).toLocaleString('id-ID')}

╰─────────────❖

${umaQuote}`

    // Gunakan thumbnail karakter aktif jika tersedia
    // Fallback ke profile picture, lalu teks biasa
    const imageSource = thumbnailUrl || pp

    if (imageSource) {
      return naze.sendMessage(
        m.chat,
        {
          image: { url: imageSource },
          caption: teks,
          mentions: [target]
        },
        { quoted: m }
      )
    }

    return naze.sendMessage(
      m.chat,
      {
        text: teks,
        mentions: [target],
        contextInfo: {
          externalAdReply: {
            title: '🏇 Trainer Profile',
            body: `${umaAktif} · ${umaRank}`,
            thumbnail: null,
            mediaType: 1,
            renderLargerThumbnail: false,
            showAdAttribution: false
          }
        }
      },
      { quoted: m }
    )

  } catch (err) {
    console.log('❌ PROFILE ERROR:', err)
    return m.reply('❌ Profile Error')
  }

}

console.log('👤 PROFILE v2 LOADED')
