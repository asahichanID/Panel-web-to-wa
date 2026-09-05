import { checkGuardCooldown } from '../absoluteGuard.js'

import {
  legendDB,
  epicDB,
  rareDB,
  limitedDB
} from './karakterHelper.js'

export const umachar = async (naze, m) => {
  // 🛡️ Absolute Guard — cooldown 3s
  const cd = await checkGuardCooldown(m.sender, 'umachar', 'profile', m)
  if (!cd.ok) return


  const buildTier = (icon, title, list) => {
    if (!list.length) return ''

    return [
      `${icon} ${title} [${list.length}]`,
      '',
      ...list.map(c => `• ${c.name}\n  🆔 ${c.id}`),
      '',
      '────────────────'
    ].join('\n')
  }

  const total =
    legendDB.length +
    epicDB.length +
    rareDB.length +
    limitedDB.length

  const text = [
    '🏇 𝐔𝐌𝐀 𝐌𝐔𝐒𝐔𝐌𝐄 𝐃𝐀𝐓𝐀𝐁𝐀𝐒𝐄',
    '',
    buildTier('🟡', 'LEGEND', legendDB),
    buildTier('🟣', 'EPIC', epicDB),
    buildTier('🔵', 'RARE', rareDB),
    buildTier('🌸', 'LIMITED', limitedDB),
    `📊 Total Uma : ${total}`,
    '',
    '💡 Gunakan ID di bawah untuk memilih Uma.',
    'Contoh:',
    '.selectuma oguri_banner',
    '.selectuma oguri_ashen_miracle'
  ].join('\n')

  return m.reply(text)

}