// ============================================================
// 🔮 KHODAM DATABASE V2 (audit upgrade)
// ============================================================
// Sistem lama cuma manggil API /primbon/cekkhodam TANPA pernah
// mengirim parameter nama sama sekali (bug), jadi hasilnya tidak
// pernah benar-benar terkait sama nama user, dan kalau API error
// fallback-nya cuma 4 pilihan generik.
//
// Sistem baru: database lokal besar dengan rarity/tier, emoji,
// dan deskripsi unik/lucu — tidak bergantung pada API luar sama
// sekali sehingga tidak pernah gagal.
// ============================================================

export const KHODAM_TIERS = [
	{ tier: 'Common',    emoji: '⚪', weight: 40 },
	{ tier: 'Uncommon',  emoji: '🟢', weight: 25 },
	{ tier: 'Rare',      emoji: '🔵', weight: 15 },
	{ tier: 'Epic',      emoji: '🟣', weight: 10 },
	{ tier: 'Legendary', emoji: '🟡', weight: 6 },
	{ tier: 'Mythical',  emoji: '🔴', weight: 3 },
	{ tier: 'Secret',    emoji: '⚫', weight: 1 },
]

export const KHODAM_DB = {
	Common: [
		{ nama: 'Kucing Garong Tetangga', emoji: '🐈', deskripsi: 'Suka nongkrong di atas motor orang tengah malam, tidak jelas maunya apa.' },
		{ nama: 'Cicak Terjatuh', emoji: '🦎', deskripsi: 'Selalu kaget sendiri lalu jatuh dari plafon di saat yang tidak tepat.' },
		{ nama: 'Bapak-Bapak Komplek', emoji: '🚬', deskripsi: 'Suka begadang ronda tapi ujung-ujungnya main kartu remi.' },
		{ nama: 'Ayam Jago Subuh', emoji: '🐓', deskripsi: 'Berkokok jam 2 pagi tanpa alasan yang jelas, bikin tetangga bangun.' },
		{ nama: 'Mie Instan Basi', emoji: '🍜', deskripsi: 'Selalu ada saat lapar tengah malam, walau kadaluarsa dua hari lalu.' },
		{ nama: 'Sinyal Wifi Tetangga', emoji: '📶', deskripsi: 'Kelihatan penuh, tapi begitu dipakai malah putus-putus.' },
		{ nama: 'Sandal Jepit Ilang Sebelah', emoji: '🩴', deskripsi: 'Selalu bikin pemiliknya pincang secara spiritual.' },
		{ nama: 'Emak-Emak War Diskon', emoji: '🛒', deskripsi: 'Gesit, sigap, dan tidak kenal ampun kalau soal harga miring.' },
		{ nama: 'Kabel Charger Kusut', emoji: '🔌', deskripsi: 'Selalu berhasil kusut sendiri walau baru dirapikan lima menit lalu.' },
		{ nama: 'Ojek Online Nyasar', emoji: '🛵', deskripsi: 'Titik dropoff selalu meleset 200 meter dari lokasi sebenarnya.' },
		{ nama: 'Deadline Skripsi', emoji: '📄', deskripsi: 'Selalu mengintai dari kejauhan, tenang di awal, mencekik di akhir.' },
		{ nama: 'Nyamuk Kamar', emoji: '🦟', deskripsi: 'Menghilang begitu lampu dinyalakan, muncul lagi begitu lampu dimatikan.' },
	],
	Uncommon: [
		{ nama: 'Kucing Anggora Sombong', emoji: '🐱', deskripsi: 'Elegan, jaim, tapi diam-diam suka ngemis makanan di bawah meja.' },
		{ nama: 'Barista Kopi Senja', emoji: '☕', deskripsi: 'Tenang, kalem, tapi racikan katanya bisa bikin insomnia tujuh hari.' },
		{ nama: 'Kurir Paket Kilat', emoji: '📦', deskripsi: 'Gesit luar biasa, tapi suka salah taruh paket di depan pintu tetangga.' },
		{ nama: 'DJ Warung Kopi', emoji: '🎧', deskripsi: 'Playlist-nya cuma satu lagu tapi diputar terus sepanjang malam.' },
		{ nama: 'Admin Grup WhatsApp', emoji: '📱', deskripsi: 'Diam seribu bahasa, tapi begitu ada drama langsung online detik itu juga.' },
		{ nama: 'Petualang Warteg', emoji: '🍛', deskripsi: 'Berani coba kombinasi lauk paling ekstrem yang tak pernah terpikirkan orang lain.' },
		{ nama: 'Kesatria Antrian Bank', emoji: '🏦', deskripsi: 'Sabar tanpa batas, siap menunggu dari pagi sampai nomor antrian dipanggil.' },
	],
	Rare: [
		{ nama: 'Naga Tidur di Gunung Es', emoji: '🐉', deskripsi: 'Tenang di permukaan, tapi menyimpan amarah sedalam samudra kalau dibangunkan.' },
		{ nama: 'Serigala Bulan Purnama', emoji: '🐺', deskripsi: 'Insting tajam, setia pada kawanan, tapi paling produktif justru di tengah malam.' },
		{ nama: 'Elang Pemburu Senja', emoji: '🦅', deskripsi: 'Pandangannya jauh ke depan, jarang gegabah dalam mengambil keputusan.' },
		{ nama: 'Harimau Loreng Berkabut', emoji: '🐅', deskripsi: 'Diam-diam menghanyutkan, sekali bergerak langsung menentukan.' },
		{ nama: 'Kuda Laut Berbisik', emoji: '🐴', deskripsi: 'Lembut dan setia, tapi punya arus pemikiran yang sulit ditebak orang lain.' },
	],
	Epic: [
		{ nama: 'Fenix Abu Senja', emoji: '🔥', deskripsi: 'Sering jatuh, tapi selalu berhasil bangkit lebih kuat dari sebelumnya.' },
		{ nama: 'Singa Bermahkota Kabut', emoji: '🦁', deskripsi: 'Karisma alami, jadi pusat perhatian tanpa perlu berusaha keras.' },
		{ nama: 'Panglima Badai Selatan', emoji: '🌪️', deskripsi: 'Tenang di luar, tapi menyimpan strategi matang di setiap langkah.' },
		{ nama: 'Kilat Penunggang Petir', emoji: '⚡', deskripsi: 'Reaksinya cepat, keputusannya tegas, jarang menyesali pilihan.' },
	],
	Legendary: [
		{ nama: 'Garuda Pengawas Nusantara', emoji: '🦚', deskripsi: 'Pelindung sejati, dipercaya banyak orang, punya rasa tanggung jawab besar.' },
		{ nama: 'Macan Putih Leluhur', emoji: '🐆', deskripsi: 'Diwariskan turun-temurun, membawa keberuntungan bagi yang menghormatinya.' },
		{ nama: 'Naga Emas Penjaga Pusaka', emoji: '🐲', deskripsi: 'Bijaksana dan berwibawa, hanya menunjukkan kekuatannya saat benar-benar perlu.' },
	],
	Mythical: [
		{ nama: 'Phoenix Cahaya Fajar', emoji: '🌅', deskripsi: 'Kehadirannya membawa harapan baru bagi siapa saja yang hampir menyerah.' },
		{ nama: 'Kilin Penjaga Keseimbangan', emoji: '🦄', deskripsi: 'Langka, tenang, dan hanya menampakkan diri pada hati yang tulus.' },
	],
	Secret: [
		{ nama: '??? Sang Penunggu Awal Waktu', emoji: '✨', deskripsi: 'Konon hanya satu dari sejuta orang yang pernah didampinginya. Selamat, kamu salah satunya.' },
	],
}

function seededRandom(seedStr) {
	// Hash sederhana dari string -> angka, supaya nama yang sama
	// cenderung mendapat rentang hasil yang mirip (bukan acak murni
	// setiap saat), tapi tetap dicampur timestamp biar tidak monoton.
	let hash = 0
	for (let i = 0; i < seedStr.length; i++) {
		hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0
	}
	const mix = (hash ^ Date.now()) >>> 0
	return (mix % 100000) / 100000
}

function pickTier(seedStr) {
	const totalWeight = KHODAM_TIERS.reduce((a, b) => a + b.weight, 0)
	let roll = seededRandom(seedStr) * totalWeight
	for (const t of KHODAM_TIERS) {
		if (roll < t.weight) return t
		roll -= t.weight
	}
	return KHODAM_TIERS[0]
}

/**
 * Ambil khodam untuk sebuah nama. Selalu berhasil (tidak bergantung API luar).
 * @param {string} nama
 * @returns {{tier:string, tierEmoji:string, nama:string, emoji:string, deskripsi:string}}
 */
export function getKhodam(nama) {
	const seedStr = String(nama || 'anonim').toLowerCase().trim()
	const tierInfo = pickTier(seedStr)
	const list = KHODAM_DB[tierInfo.tier] || KHODAM_DB.Common
	const idx = Math.floor(seededRandom(seedStr + tierInfo.tier) * list.length)
	const entry = list[Math.min(idx, list.length - 1)]
	return {
		tier: tierInfo.tier,
		tierEmoji: tierInfo.emoji,
		nama: entry.nama,
		emoji: entry.emoji,
		deskripsi: entry.deskripsi,
	}
}

export function buildKhodamText(target, khodam) {
	return [
		`🔮 𝗖𝗘𝗞 𝗞𝗛𝗢𝗗𝗔𝗠`,
		`━━━━━━━━━━━━━━━━━━━━`,
		`👤 Nama    : ${target}`,
		`${khodam.tierEmoji} Rarity   : *${khodam.tier}*`,
		`${khodam.emoji} Khodam   : *${khodam.nama}*`,
		``,
		`💬 ${khodam.deskripsi}`,
		`━━━━━━━━━━━━━━━━━━━━`,
		`✨ _Hasil hanya hiburan semata_`,
	].join('\n')
}
