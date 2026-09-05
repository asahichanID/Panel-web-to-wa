import { addUmaExp } from './xpuma/xpuma.js'
import { ownerStats } from './umaowner.js'
import { resolveActiveUma } from './umahelper.js'
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

export const training = async (naze,m,db,isCreator) => {

	try {

		let user = db.users[m.sender]

		if (!user.activeUma)
			return m.reply('🏇 Kamu belum memiliki Uma.\n\nBeli dulu di .umashop')

		let now = Date.now()

		if (!user.lastTraining)
			user.lastTraining = 0

		let cooldown = 900000

		let sisa = cooldown - (now - user.lastTraining)

		if (sisa > 0) {

			let menit = Math.floor(sisa / 60000)

			let detik = Math.floor((sisa % 60000) / 1000)

			return m.reply(
`💪 Uma masih latihan.

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

		let jenis = [
			'speed',
			'stamina',
			'power',
			'accel'
		]

		let jumlah =
		Math.random() < 0.15 ? 4 :
		Math.random() < 0.5 ? 3 : 2

		let dipilih = [...jenis]
		.sort(
			() =>
			Math.random() - 0.5
		)
		.slice(0, jumlah)

		let hasilTraining = []

		for (const pilih of dipilih) {

			let tambah

			if (
				Math.random() < 0.15
			)

				tambah =
				Math.floor(
					Math.random() * 10
				) + 18

			else

				tambah =
				Math.floor(
					Math.random() * 7
				) + 1

			if (!isMax) {

				stats[pilih] += tambah

				hasilTraining.push(
`${pilih.toUpperCase()} +${tambah}`
				)

			}

		}

		if (isMax)

			hasilTraining = [
'🌟 MAX - Uma hanya jogging santai.'
			]

		user.umaStats[id] = stats

		const hasil = addUmaExp(stats)

		let exp = hasil.exp
		let naik = hasil.naik
		let kebutuhan = hasil.kebutuhan

		user.lastTraining = now

		// Quote — fallback jika NPC tidak punya quotes
		const quotesArr = uma.quotes?.length ? uma.quotes : ['💪 Latihan membuat kita lebih kuat!']
		let quote = quotesArr[Math.floor(Math.random() * quotesArr.length)]

		// Gambar — pakai umaimage resolver, fallback ke teks
		const imageUrl = getCharacterImage(uma)

		console.log(
			'💪 TRAINING :',
			uma.name
		)

		const teks =
`💪 𝐔𝐌𝐀 𝐓𝐑𝐀𝐈𝐍𝐈𝐍𝐆

🏇 ${uma.name}

📈 HASIL TRAINING
${hasilTraining.map(v => `• ${v}`).join('\n')}

⭐ EXP +${exp}
🏆 Level : ${stats.level}
📊 EXP : ${stats.exp}/${kebutuhan}

${naik ? '🎉 LEVEL UP!' : ''}

💬 ${quote}`

		if (imageUrl) {
			return naze.sendMessage(
				m.chat,
				{
					image: { url: imageUrl },
					caption: teks
				},
				{ quoted: m }
			)
		} else {
			return naze.sendMessage(
				m.chat,
				{ text: teks },
				{ quoted: m }
			)
		}

	}

	catch (err) {

		console.log(
			'❌ TRAINING'
		)

		console.log(err)

		return m.reply(
			'❌ Training Error'
		)

	}

}