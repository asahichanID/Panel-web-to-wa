// ================================
// 🖼️ LEGACY SHIM
// ================================
//
// File ini adalah shim kompatibilitas.
// Semua resolver sekarang ada di musume/umaimage.js.
// Jangan menambahkan logika baru di sini.
//

import { getBannerImage } from '../../musume/umaimage.js'
export { getBannerImage, getLimitedImage, getCharacterImage } from '../../musume/umaimage.js'

// Alias legacy: getUmaImage(nama) → getBannerImage(nama)
export const getUmaImage = (nama) => getBannerImage(nama)

console.log('🖼️ UMA IMAGE SHIM LOADED')
