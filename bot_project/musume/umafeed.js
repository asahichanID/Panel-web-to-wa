import { globalSpam, resolveActiveUma } from './umahelper.js'
import { addUmaExp } from './xpuma/xpuma.js'
import { addBankActivity } from './bankaktivitas.js'
import { ownerStats } from './umaowner.js'
import { getCharacterImage } from './umaimage.js'

// Pastikan stats punya semua field yang dibutuhkan
const ensureUmaStats = (stats) => {
	if (!stats) return { speed: 70, stamina: 70, power: 70, accel: 70, level: 1, exp: 0, win: 0, lose: 0 }
	if (stats.exp == null) stats.exp = 0
	if (!stats.level) stats.level = 1
	if (!stats.win) stats.win = 0
	if (!stats.lose) stats.lose = 0
	return stats
}

// Harga makan default untuk NPC / karakter tanpa field makanan
const DEFAULT_MAKANAN = 500
const DEFAULT_FAVORIT = 'Wortel Biasa'

export const feed = async (naze,m,db,isCreator) => {

	try {

		let user = db.users[m.sender]

		let nama =
		user.name ||
		m.pushName ||
		m.sender.split('@')[0]

		let spam = globalSpam(
			'feed',
			15
		)

		if (!spam.ok) {

			if (spam.warn) {

				let detik = Math.ceil(
					spam.sisa / 1000
				)

				return m.reply(

`🥕 𝐔𝐌𝐀 𝐅𝐄𝐄𝐃

⏳ Tunggu ${detik}s`

				)

			}

			return

		}

		if (!user.activeUma)

			return m.reply(
'🏇 Kamu belum memiliki Uma.\n\nBeli dulu di .umashop'
			)

		if (!user.lastFeed)

			user.lastFeed = 0

		let now = Date.now()

		let cooldown = 300000

		let sisa = cooldown - (
			now - user.lastFeed
		)

		if (sisa > 0) {

			let menit = Math.floor(
				sisa / 60000
			)

			let detik = Math.floor(
				(sisa % 60000) / 1000
			)

			return m.reply(

`🥕 Uma masih kenyang.

⏳ ${menit}m ${detik}s`

			)

		}

		let id = user.activeUma

		// Resolve Uma — banner atau NPC
		let uma = resolveActiveUma(user)

		if (!uma)
			return m.reply('❌ Uma tidak ditemukan.\n\nCoba .selectuma ulang.')

		// Pastikan umaStats ada dan lengkap
		if (!user.umaStats) user.umaStats = {}
		if (!user.umaStats[id]) user.umaStats[id] = {}
		let stats = ensureUmaStats(user.umaStats[id])

		let owner = ownerStats(
			uma,
			stats,
			isCreator
		)

		let isMax = !!owner.text

		stats = owner.stats

		// Harga makan — fallback untuk NPC
		const hargaMakan = uma.makanan ?? DEFAULT_MAKANAN
		const namaFavorit = uma.favorit ?? DEFAULT_FAVORIT

		if (user.money < hargaMakan)

			return m.reply(

`💸 Carats tidak cukup.

🥕 ${namaFavorit}

💰 Harga :
${hargaMakan.toLocaleString('id-ID')}`

			)

		user.money -= hargaMakan

		if (!db.bank.kas) db.bank.kas = 0
		db.bank.kas += hargaMakan

		if (!db.bank.danaMasuk) db.bank.danaMasuk = 0
		db.bank.danaMasuk += hargaMakan

		if (db.bank.totalFeed == null) db.bank.totalFeed = 0
		db.bank.totalFeed++

		if (db.bank.totalPembelian == null) db.bank.totalPembelian = 0
		db.bank.totalPembelian++

		addBankActivity(

			db,

			`🥕 ${nama} telah membeli ${namaFavorit} untuk ${uma.name}`

		)

		let jenis = [

			'speed',

			'stamina',

			'power',

			'accel'

		]

		let pilih = jenis[

			Math.floor(

				Math.random() *

				jenis.length

			)

		]

		let tambah =

		Math.floor(

			Math.random() * 4

		) + 1

		if (!isMax)

			stats[pilih] += tambah

		user.umaStats[id] = stats

		const hasil = addUmaExp(stats)

		let exp = hasil.exp

		let naik = hasil.naik

		let kebutuhan = hasil.kebutuhan

		user.lastFeed = now

		// Quote — fallback jika NPC tidak punya quotes
		const quotesArr = uma.quotes?.length ? uma.quotes : ['🥕 Makanan yang enak!']
		let quote = quotesArr[Math.floor(Math.random() * quotesArr.length)]

		// Gambar — pakai umaimage resolver, fallback ke teks
		const imageUrl = getCharacterImage(uma)

		console.log(
			'🥕 FEED :',
			uma.name
		)

		console.log(
			'⭐ EXP +',
			exp
		)

		const caption =
`🥕 𝐔𝐌𝐀 𝐅𝐄𝐄𝐃

🏇 ${uma.name}
🥕 ${namaFavorit}

💰 -${hargaMakan.toLocaleString('id-ID')} Carats

📈 ${isMax ? '🌟 MAX' : `${pilih.toUpperCase()}\n+${tambah}`}

⭐ EXP +${exp}
🏆 Level : ${stats.level}
📊 EXP : ${stats.exp}/${kebutuhan}

${naik ? '🎉 LEVEL UP!' : ''}

💬 ${isMax ? 'Uma hanya menikmati makanannya 😹' : quote}`

		if (imageUrl) {
			return naze.sendMessage(
				m.chat,
				{ image: { url: imageUrl }, caption },
				{ quoted: m }
			)
		} else {
			return naze.sendMessage(
				m.chat,
				{ text: caption },
				{ quoted: m }
			)
		}

	}

	catch (err) {

		console.log(
			'❌ FEED'
		)

		console.log(err)

		return m.reply(
			'❌ Feed Error'
		)

	}

}