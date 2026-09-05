// ================================
// 🏇 CHARACTER REGISTRY V2
// ================================
//
// SINGLE SOURCE OF TRUTH untuk seluruh karakter di project.
// Semua sistem (myuma, race, training, feed, banner, monster, dll)
// WAJIB mengambil data karakter hanya dari file ini.
//
// Menambah karakter baru:
//   1. Buat file data karakter di folder yang sesuai
//   2. Import dan spread ke DB yang sesuai (legendDB, epicDB, dst)
//   3. Selesai — seluruh project otomatis mengenali karakter baru.
//
// ================================
// STRUKTUR CHARACTER
// ================================
//
// id            : string unik
// name          : nama tampilan
// rarity        : 'rare' | 'epic' | 'legend' | 'limited' | 'absolute' | 'npc'
// image         : nama file gambar (tanpa ekstensi)
// description   : deskripsi singkat
// birthday      : 'MM/DD'
// school        : nama sekolah
// height        : tinggi cm
// favorit       : makanan favorit
// quotes        : array kutipan harian
// quoteWin      : kutipan kemenangan
// quotePull     : kutipan saat dipanggil dari banner
// stats         : { speed, stamina, power, accel }
// skill         : { name, desc, boost }
// recruitPrice  : harga rekrut (NPC) — 0 jika tidak bisa
// exchangeCost  : biaya tukar medal — 0 jika tidak tersedia
// duplicateReward : Carats saat duplikat
// medalReward   : Medal saat duplikat
// canBanner     : bisa muncul di permanent banner
// canLimited    : bisa muncul di limited banner
// canExchange   : bisa dibeli di exchange shop
// canRecruit    : bisa direkrut via .buyuma
// ownerOnly     : hanya via owner command
// isMonster     : khusus Absolute Monster (opsional)

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import { getCharacterImage } from '../umaimage.js'

// ── Rarity databases ──────────────────────────────────────────
import { limitedDB } from './limitedEvent/event.js'
import { legendDB }  from './rarity/legend/LegendPusat.js'
import { epicDB }    from './rarity/epic/EpicPusat.js'
import { rareDB }    from './rarity/rare/RarePusat.js'

// ── Absolute Monster (pure data, zero imports) ─────────────────
import { MONSTER_CHARACTERS as monsterDB } from './limitedEvent/monster/monsterDB.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// ================================
// 🤝 NPC SYSTEM
// ================================
// NPC hanya digunakan oleh sistem Recruitment (.buyuma).
// Data NPC dibaca dari npc.json — tidak ada hardcode di sini.

let _npcList = null

const loadNpcList = () => {
  if (_npcList) return _npcList
  try {
    const require = createRequire(import.meta.url)
    _npcList = require(join(__dirname, 'npc.json'))
  } catch {
    _npcList = []
  }
  return _npcList
}

const NPC_TRAIT_RANGE = {
  speed:    { speed: [60, 85], stamina: [40, 65], power: [45, 70], accel: [50, 75] },
  stamina:  { speed: [45, 70], stamina: [60, 85], power: [50, 75], accel: [40, 65] },
  power:    { speed: [45, 70], stamina: [50, 70], power: [60, 85], accel: [45, 68] },
  accel:    { speed: [50, 75], stamina: [40, 65], power: [45, 70], accel: [60, 85] },
  balanced: { speed: [50, 75], stamina: [50, 75], power: [50, 75], accel: [50, 75] }
}

const NPC_SKILL_POOL = [
  { name: 'Quick Start 💨', desc: 'Melesat cepat di awal lintasan.', boost: { speed: 15 } },
  { name: 'Iron Will 💪',   desc: 'Bertahan dengan stamina penuh.', boost: { stamina: 20 } },
  { name: 'Force Push 🔥',  desc: 'Mendorong dengan seluruh kekuatan.', boost: { power: 18 } },
  { name: 'Dash Burst ⚡',  desc: 'Akselerasi mendadak yang mengejutkan.', boost: { accel: 16 } },
  { name: 'Steady Pace 🎯', desc: 'Menjaga kecepatan stabil sepanjang lintasan.', boost: { speed: 10, stamina: 10 } },
  { name: 'Rookie Spirit 🌱', desc: 'Semangat pemula yang menggebu-gebu.', boost: { accel: 12, power: 8 } },
  { name: 'Endurance Run 🏃', desc: 'Bertahan hingga akhir dengan nafas panjang.', boost: { stamina: 15, speed: 8 } },
  { name: 'Wild Charge 🐎', desc: 'Menyerang penuh semangat tanpa strategi.', boost: { power: 20 } },
  { name: 'Flow State 🌊',  desc: 'Memasuki ritme sempurna saat berlari.', boost: { speed: 12, accel: 12 } },
  { name: 'Grit & Go 😤',  desc: 'Gigih dan pantang menyerah.', boost: { stamina: 12, power: 12 } }
]

const _randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export const generateNpcStats = (trait = 'balanced') => {
  const range = NPC_TRAIT_RANGE[trait] ?? NPC_TRAIT_RANGE.balanced
  return {
    speed:   _randInt(...range.speed),
    stamina: _randInt(...range.stamina),
    power:   _randInt(...range.power),
    accel:   _randInt(...range.accel),
    level: 1,
    win: 0,
    lose: 0
  }
}

export const generateNpcSkill = () =>
  NPC_SKILL_POOL[Math.floor(Math.random() * NPC_SKILL_POOL.length)]

export const validateNpc = (npc) =>
  !!(npc && typeof npc.id === 'string' && typeof npc.name === 'string' && typeof npc.trait === 'string')

export const getRandomNpc = () => {
  const list = loadNpcList().filter(validateNpc)
  return list.length ? list[Math.floor(Math.random() * list.length)] : null
}

export const getNpcById  = (id) => loadNpcList().find(n => n.id === id) ?? null
export const getAllNpcs  = ()   => loadNpcList().filter(validateNpc)

export const buildNpcEntry = (npc) => {
  if (!validateNpc(npc)) return null
  return {
    id: npc.id,
    name: npc.name,
    trait: npc.trait,
    rarity: 'npc',
    stats: generateNpcStats(npc.trait),
    skill: generateNpcSkill(),
    recruitedAt: Date.now()
  }
}

// ================================
// 📦 CHARACTER DATABASE — SINGLE SOURCE OF TRUTH
// ================================
// Tambah tier baru: import di atas → spread di sini → selesai.

export const allCharacters = [
  ...legendDB,
  ...epicDB,
  ...rareDB,
  ...limitedDB,
  ...monsterDB     // ☠️ Absolute Monster — wajib ada agar getCharacterById bisa resolve
]

// ================================
// ⚡ O(1) REGISTRY MAPS
// ================================
// Dibangun sekali saat modul dimuat.
// Menghilangkan find() / some() berulang pada Array besar.

/** Map<id, character> — lookup O(1) by id */
const _idMap = new Map(allCharacters.map(c => [c.id, c]))

/** Map<rarity, character[]> — lookup O(1) by rarity */
const _rarityMap = new Map()
for (const c of allCharacters) {
  if (!_rarityMap.has(c.rarity)) _rarityMap.set(c.rarity, [])
  _rarityMap.get(c.rarity).push(c)
}

// ================================
// 🖼 THUMBNAIL HELPER
// ================================
// Pasang thumbnail ke character object.
// Lazy — hanya dipanggil saat diperlukan oleh caller.

const _thumbCache = new Map()

const attachThumbnail = (character) => {
  if (!character) return null
  if (_thumbCache.has(character.id)) {
    return { ...character, thumbnail: _thumbCache.get(character.id) }
  }
  const thumb = getCharacterImage(character)
  if (thumb) _thumbCache.set(character.id, thumb)
  return { ...character, thumbnail: thumb ?? null }
}

// ================================
// 🔍 PUBLIC LOOKUP API
// ================================

/**
 * Cari karakter berdasarkan ID.
 * O(1) — menggunakan Map registry.
 */
export const getCharacterById = (id) => {
  if (!id) return null
  const c = _idMap.get(id)
  return c ? attachThumbnail(c) : null
}

/**
 * Cari karakter berdasarkan nama (partial match, case-insensitive).
 * Pertama coba exact id match → lalu name includes.
 */
export const getCharacterByName = (name) => {
  if (!name) return null
  const lower = name.toLowerCase().trim()
  // Exact id match dulu
  const byId = _idMap.get(lower)
  if (byId) return attachThumbnail(byId)
  // Partial match
  for (const c of allCharacters) {
    if (c.name.toLowerCase().includes(lower) || c.id.toLowerCase().includes(lower)) {
      return attachThumbnail(c)
    }
  }
  return null
}

/**
 * Filter karakter berdasarkan rarity.
 * O(1) — menggunakan Map registry.
 */
export const getCharactersByRarity = (rarity) =>
  _rarityMap.get(rarity) ?? []

/**
 * Validasi ID karakter.
 * O(1) — Map.has()
 */
export const isValidCharacter = (id) => _idMap.has(id)

export const getBannerCharacters  = () =>
  (allCharacters.filter(c => c.canBanner)).map(attachThumbnail)

export const getLimitedCharacters = () =>
  (allCharacters.filter(c => c.canLimited)).map(attachThumbnail)

export const getExchangeCharacters = () =>
  (allCharacters.filter(c => c.canExchange && c.exchangeCost > 0)).map(attachThumbnail)

export const searchCharacters = (query) => {
  if (!query) return []
  const lower = query.toLowerCase().trim()
  return allCharacters
    .filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.id.toLowerCase().includes(lower) ||
      (c.description && c.description.toLowerCase().includes(lower))
    )
    .map(attachThumbnail)
}

// Re-export raw DBs untuk backward compatibility
export { legendDB, epicDB, rareDB, limitedDB, monsterDB }

console.log(`
🏇 [CHARACTER REGISTRY V2]
✅ Legend   : ${legendDB.length}
✅ Epic     : ${epicDB.length}
✅ Rare     : ${rareDB.length}
✅ Limited  : ${limitedDB.length}
☠️  Monster  : ${monsterDB.length}
✅ Total    : ${allCharacters.length}
⚡ Registry : O(1) Map aktif
🤝 NPC      : (dari npc.json, runtime)
`)
