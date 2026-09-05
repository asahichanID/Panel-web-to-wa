// ================================
// 🏇 CHARACTER POOL
// ================================
//
// File ini mengelompokkan Character ke dalam pool.
// Tidak menyimpan data detail Character.
// Semua data ada di karakterHelper.js.

import {
  legendDB, epicDB, rareDB, limitedDB, monsterDB, allCharacters,
  getCharacterById, getCharacterByName, getCharactersByRarity,
  isValidCharacter, getBannerCharacters, getLimitedCharacters,
  getExchangeCharacters, searchCharacters,
  getRandomNpc, getNpcById, getAllNpcs, buildNpcEntry,
  generateNpcStats, generateNpcSkill, validateNpc
} from './karakterHelper.js'

// ================================
// 🔵 RARE POOL
// ================================
export const rarePool = rareDB.filter(c => c.canBanner)

// ================================
// 🟣 EPIC POOL
// ================================
export const epicPool = epicDB.filter(c => c.canBanner)

// ================================
// 🟡 LEGEND POOL
// ================================
export const legendPool = legendDB.filter(c => c.canBanner)

// ================================
// 🌸 LIMITED POOL
// ================================
export const limitedPool = limitedDB.filter(c => c.canLimited)

// ================================
// 🎊 BANNER POOL (Permanent)
// ================================
// Menggabungkan rare + epic + legend.
// Tidak termasuk limited.
export const bannerPool = {
  rare: rarePool,
  epic: epicPool,
  legend: legendPool
}

// ================================
// 🌸 LIMITED BANNER LIST
// ================================
// Daftar event limited yang terdaftar di sistem.
// Pool setiap event mengambil dari limitedPool.
const SUMMER_POOL = [
  'maruzensky_summer',
  'special_week_summer',
  'gold_ship_summer',
  'mejiro_mcqueen_summer'
]
const FESTIVAL_POOL = [
  'tokai_teio_festival',
  'tamamo_cross_festival',
  'symboli_rudolf_festival'
]
export const limitedBannerList = [
  {
    id: 'cinderella_gray',
    name: '♠️ Cinderella Gray',
    active: false,
    rateUpCharacters: ['oguri_ashen_miracle'],
    pool: limitedPool.filter(c => ['oguri_ashen_miracle'].includes(c.id))
  },
  {
    id: 'summer_festival',
    name: '🌊 Summer Festival',
    active: false,
    rateUpCharacters: SUMMER_POOL,
    pool: limitedPool.filter(c => SUMMER_POOL.includes(c.id))
  },
  {
    id: 'festival',
    name: '🎆 Festival',
    active: false,
    rateUpCharacters: FESTIVAL_POOL,
    pool: limitedPool.filter(c => FESTIVAL_POOL.includes(c.id))
  }
]

// ================================
// 📚 ALL CHARACTER POOL
// ================================
// Untuk search, validation, admin, owner.
// Tidak untuk Roll Banner.
export const allCharacterPool = allCharacters

// ================================
// 🤝 NPC POOL RE-EXPORT
// ================================
// NPC tidak masuk bannerPool maupun limitedPool.
// NPC hanya digunakan oleh sistem Recruitment (.buyuma).
export {
  getRandomNpc,
  getNpcById,
  getAllNpcs,
  buildNpcEntry,
  generateNpcStats,
  generateNpcSkill,
  validateNpc
}

// ================================
// 🔍 RE-EXPORT UTILITIES
// ================================
export {
  getCharacterById,
  getCharacterByName,
  getCharactersByRarity,
  isValidCharacter,
  getBannerCharacters,
  getLimitedCharacters,
  getExchangeCharacters,
  searchCharacters,
  monsterDB
}

console.log(`
🏇 [CHARACTER POOL]
🔵 Rare   : ${rarePool.length}
🟣 Epic   : ${epicPool.length}
🟡 Legend : ${legendPool.length}
🌸 Limited: ${limitedPool.length}
`)
