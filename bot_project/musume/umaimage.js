// ================================
// 🖼️ TRACEN ASSET MANAGER V2
// ================================
//
// Seluruh thumbnail Musume dipusatkan di file ini.
//
// Digunakan oleh:
// - Banner
// - Limited Banner
// - Profile
// - MyUma
// - Feed
// - Training
// - Race
// - NPC (future)
//
// Jangan menyimpan URL GitHub langsung
// di file lain.
//
// Semua asset dipanggil melalui helper ini.
//

import { thumbnail } from './thumbnail.js'

// ================================
// 🌐 BASE URL
// ================================

export const BASE_URL =
'https://raw.githubusercontent.com/asahichanID/Umaimage/main/uma'

// ================================
// ♻ CACHE
// ================================

const cache = new Map()

// ================================
// 📦 INTERNAL
// ================================

const buildUrl = (folder, image) => {
if (typeof image !== 'string' || !image.trim())
  return null
  if (/^https?:\/\//i.test(image))
    return image

  return folder
    ? `${BASE_URL}/${folder}/${image}.png`
    : `${BASE_URL}/${image}.png`
}

// ================================
// 🛡 SAFE RESOLVER
// ================================

const safeResolve = (category, id, resolver) => {
  try {
    const result = resolver()

    if (!result) {
      console.log(`
⚠️ [UMA IMAGE]

Kategori : ${category}
ID       : ${id}

Thumbnail tidak ditemukan.
Mode Text Only digunakan.
`)
      return null
    }

    return result

  } catch (err) {

    console.log(`
❌ [UMA IMAGE ERROR]

Kategori : ${category}
ID       : ${id}

${err.message}
`)

    return null
  }
}

const fromCache = (key, resolver) => {

  if (cache.has(key))
    return cache.get(key)

  const value = resolver()

  // Jangan cache null
  if (value)
    cache.set(key, value)

  return value
}

// ================================
// 🏇 DEFAULT
// ================================

export const getUmaImage = image =>
  fromCache(
    `uma:${image}`,
    () => safeResolve(
      'Default',
      image,
      () => buildUrl('', image)
    )
  )

// ================================
// 🎊 BANNER
// ================================

export const getBannerImage = id =>
  fromCache(
    `banner:${id}`,
    () => safeResolve(
      'Banner',
      id,
      () => {
        const img = thumbnail.banner?.[id] ?? id

        return buildUrl('', img)
      }
    )
  )

// ================================
// 🌸 LIMITED
// ================================

export const getLimitedImage = id =>
  fromCache(
    `limited:${id}`,
    () => safeResolve(
      'Limited',
      id,
      () => {
        const img = thumbnail.limited?.[id]

        if (!img) return null

        return buildUrl('Umalimited', img)
      }
    )
  )

// ================================
// ☠️ MONSTER
// ================================

export const getMonsterImage = id =>
  fromCache(
    `monster:${id}`,
    () => safeResolve(
      'Monster',
      id,
      () => {
        const img = thumbnail.monster?.[id]
        if (!img) return null
        return buildUrl('AbsoluteMonster', img)
      }
    )
  )
  
// ================================
// 🥕 FEED
// ================================

export const getFeedImage = id =>
  fromCache(
    `feed:${id}`,
    () => safeResolve(
      'Feed',
      id,
      () => {
        const img = thumbnail.feed?.[id]

        if (!img)
          return getBannerImage(id)

        return buildUrl('Feed', img)
      }
    )
  )

// ================================
// 💪 TRAINING
// ================================

export const getTrainingImage = id =>
  fromCache(
    `training:${id}`,
    () => safeResolve(
      'Training',
      id,
      () => {
        const img = thumbnail.training?.[id]

        if (!img)
          return getBannerImage(id)

        return buildUrl('Training', img)
      }
    )
  )

// ================================
// 🏁 RACE
// ================================

export const getRaceImage = id =>
  fromCache(
    `race:${id}`,
    () => safeResolve(
      'Race',
      id,
      () => {
        const img = thumbnail.race?.[id]

        if (!img)
          return getBannerImage(id)

        return buildUrl('Race', img)
      }
    )
  )

// ================================
// 🎯 CHARACTER AUTO RESOLVER
// ================================

export const getCharacterImage = character => {
  if (!character)
    return null

  switch (character.rarity) {
    case 'limited':
      return getLimitedImage(character.image)

    case 'absolute':
      // ☠️ Absolute Monster — folder AbsoluteMonster di repo
      return getMonsterImage(character.image)

    case 'legend':
    case 'epic':
    case 'rare':
    default:
      return getBannerImage(character.image)
  }
}
// ================================
// ✅ VALIDATION
// ================================

export const hasBannerImage = id =>
  id in (thumbnail.banner ?? {})

export const hasCharacterImage = character =>
    !!getCharacterImage(character)

export const hasLimitedImage = id =>
  id in (thumbnail.limited ?? {})

export const hasFeedImage = id =>
  id in (thumbnail.feed ?? {})

export const hasTrainingImage = id =>
  id in (thumbnail.training ?? {})

export const hasRaceImage = id =>
  id in (thumbnail.race ?? {})

// ================================
// ♻ MEMORY RELEASE
// ================================
//
// Tidak menghapus RAM secara langsung.
//
// Hanya menghapus seluruh cache
// thumbnail sehingga Garbage Collector
// dapat membebaskan memori apabila
// tidak ada referensi lain.
//

export const clearImageCache = () => {
    cache.clear()

    console.log(`
♻️ [UMA IMAGE]

Image Cache Cleared
`)
}

export const imageCacheSize = () => cache.size

// ================================
// 🎮 UI THUMBNAIL HELPERS
// ================================
//
// Untuk thumbnail non-karakter (play, ytmp4, dll).
// Menggunakan BASE_URL/Thumbnail/<nama>.png
//

export const getUiThumbnail = (name) =>
  fromCache(
    `ui:${name}`,
    () => safeResolve(
      'UI',
      name,
      () => buildUrl('Thumbnail', name)
    )
  )

export const getPlayThumb = () => getUiThumbnail('play_thumb')
export const getYtmp4Thumb = () => getUiThumbnail('ytmp4_thumb')
export const getOguriThumb = () => getUiThumbnail('oguri_thumb')

console.log(`
🖼️ [UMA IMAGE V2]
✅ Asset Manager Loaded
📦 Cache : ${cache.size}
`)