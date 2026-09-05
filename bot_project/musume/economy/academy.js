import fs from 'fs'
import { pickRandom } from '../helperquotes.js'

export const audit = async (
  naze,
  m,
  db,
  args,
  participants,
  isCreator
) => {

  try {

    if (!isCreator)
      return m.reply(
        '❌ Khusus Head Trainer'
      )

    const target =
      m.mentionedJid?.[0]

    const mode =
      args[0]?.toLowerCase()

    // ====================
    // AUDIT SEMUA 10%
    // ====================

    if (mode == 'semua') {

      if (!m.isGroup)
        return m.reply(
          '❌ Hanya bisa digunakan di grup.'
        )

      let total = 0
      let warga = 0

      for (const user of participants) {

        const id = user.id

        if (
          id == m.sender ||
          !db.users[id]
        ) continue

        warga++

        const uang =
          db.users[id].money || 0

        const pajak =
          Math.floor(uang * 0.1)

        db.users[id].money -= pajak

        total += pajak

      }

      db.users[m.sender].money += total

      return m.reply(

`🏇 𝐓𝐑𝐀𝐂𝐄𝐍 𝐂𝐎𝐋𝐋𝐄𝐂𝐓𝐈𝐎𝐍 🏇

👥 Trainer terdampak : ${warga}

💰 ${total.toLocaleString('id-ID')} Carats berhasil dikumpulkan untuk operasional akademi 🥕`

      )

    }

    // ====================
    // AUDIT GLOBAL
    // ====================

    if (mode == 'global') {

      let total = 0
      let warga = 0

      for (const id in db.users) {

        if (id == m.sender)
          continue

        warga++

        const uang =
          db.users[id].money || 0

        db.users[id].money = 0

        total += uang

      }

      db.users[m.sender].money += total

      return m.reply(

`🚨 𝐓𝐑𝐀𝐂𝐄𝐍 𝐄𝐌𝐄𝐑𝐆𝐄𝐍𝐂𝐘 𝐀𝐔𝐃𝐈𝐓 🚨

👥 Trainer terdampak : ${warga}

💰 ${total.toLocaleString('id-ID')} Carats berhasil diamankan untuk dana akademi 🏇`

      )

    }

    // ====================
    // TARGET USER
    // ====================

    if (!target)
      return m.reply(

`🏇 Format:

.audit @tag 5000
.audit @tag all
.audit semua
.audit global`

      )

    if (!db.users[target])
      return m.reply(
        '❌ Trainer tidak ditemukan.'
      )

    let nominal = args[1]

    if (!nominal)
      return m.reply(
        '❌ Masukkan jumlah Carats.'
      )

    // ====================
    // ALL
    // ====================

    if (nominal == 'all') {

      const uang =
        db.users[target].money || 0

      db.users[target].money = 0

      db.users[m.sender].money += uang

      return m.reply(

`🏇 Audit selesai!

💰 ${uang.toLocaleString('id-ID')} Carats berhasil diamankan.`

      )

    }

    // ====================
    // NOMINAL
    // ====================

    nominal = parseInt(nominal)

    if (isNaN(nominal))
      return m.reply(
        '❌ Jumlah tidak valid.'
      )

    if (
      db.users[target].money < nominal
    ) {

      nominal =
        db.users[target].money

    }

    db.users[target].money -= nominal

    db.users[m.sender].money += nominal

    return m.reply(

`🏇 Audit selesai!

💰 ${nominal.toLocaleString('id-ID')} Carats berhasil diamankan.`

    )

  }

  catch (err) {

    console.log(
      '❌ AUDIT'
    )

    console.log(err)

    return m.reply(
      '❌ Audit Error'
    )

  }

}

export const bansos = async (
	naze,
	m,
	db,
	args,
	isCreator,
	botNumber
) => {

	try {

		if (!isCreator)

			return m.reply(
				'❌ Khusus Head Trainer'
			)

		const bansosQuote = [
		{ name: 'Oguri Cap', quote: '🥕 Kalau semua orang kenyang, latihan jadi lebih semangat!' },
		{ name: 'Symboli Rudolf', quote: '👴 Memberi bantuan itu investasi sosial, bukan cuma angka 😹' },
		{ name: 'Air Groove', quote: '😮‍💨 Setidaknya kali ini Rudolf tidak membuat lelucon...' },
		{ name: 'Gold Ship', quote: '😹 Wah, bagi-bagi Carats? Jangan lupa sisakan buat kekacauan besok!' },
		{ name: 'Tokai Teio', quote: '✨ Semoga bantuan ini membuat semua orang tersenyum!' },
		{ name: 'Mihono Bourbon', quote: '🤖 Distribusi bantuan selesai. Tingkat kebahagiaan meningkat.' }
	]

	    const hashire = pickRandom(bansosQuote)

		const thumb =
		fs.readFileSync(
			'./src/media/oguri-bansos.jpg'
		)
		let nominal =
		parseInt(args[1])
		if (isNaN(nominal))
			return m.reply(
				'Masukkan nominal yang valid!'
			)

		if (nominal < 1)

			return m.reply(
				'Minimal 1 Carats'
			)

		if (

			db.users[m.sender]
			.money < nominal

		)

			return m.reply(
				'💸 Carats tidak cukup!'
			)

		if (args[0] == 'global') {

			let berhasil = 0

			let totalKeluar = 0

			let totalWarga = 0

			for (let id in db.users) {

				if (

					id == m.sender ||

					!db.users[id]

				)

					continue

				totalWarga++

				if (

					db.users[m.sender]
					.money < nominal

				)

					break

				db.users[m.sender]
				.money -= nominal

				db.users[id]
				.money += nominal

				totalKeluar += nominal

				berhasil++

			}

			let gagal =

			totalWarga - berhasil

			return naze.sendMessage(

				m.chat,

				{

					text:

`🎁 𝐓𝐑𝐀𝐂𝐄𝐍 𝐒𝐎𝐂𝐈𝐀𝐋 𝐀𝐈𝐃

💰 Bantuan per Trainer : ${nominal.toLocaleString('id-ID')} Carats
🌍 Total Trainer : ${totalWarga}

👥 Trainer menerima : ${berhasil}
🥀 Belum menerima : ${gagal}

💸 Total tersalurkan : ${totalKeluar.toLocaleString('id-ID')} Carats
🏦 Sisa kas : ${db.users[m.sender].money.toLocaleString('id-ID')} Carats

💬 ${hashire.name}
"${hashire.quote}"`,

					contextInfo: {

						externalAdReply: {

							title:

							'🎁 Tracen Social Aid',

							thumbnail:

							thumb,

							mediaType: 1,

							renderLargerThumbnail: true,

							showAdAttribution: false,

							sourceUrl:

							'https://tracen-academy.jp'

						}

					}

				},

				{

					quoted: m

				}

			)

		}

		if (!m.isGroup)

			return m.reply(
				'❌ Khusus grup!'
			)

		let berhasil = 0

		let totalKeluar = 0

		let totalWarga = 0

		for (

			let member of

			m.metadata.participants

		) {

			let id =

			member.id

			if (

				!id ||

				id == m.sender ||

				id == botNumber ||

				!db.users[id]

			)

				continue

			totalWarga++

			if (

				db.users[m.sender]
				.money < nominal

			)

				break

			db.users[m.sender]
			.money -= nominal

			db.users[id]
			.money += nominal

			totalKeluar += nominal

			berhasil++

		}

		let gagal =

		totalWarga - berhasil

		return naze.sendMessage(

			m.chat,

			{

				text:

`🎁 𝐓𝐑𝐀𝐂𝐄𝐍 𝐒𝐎𝐂𝐈𝐀𝐋 𝐀𝐈𝐃

💰 Bantuan per Trainer : ${nominal.toLocaleString('id-ID')} Carats

👥 Trainer menerima : ${berhasil}
🥀 Belum menerima : ${gagal}

💸 Total tersalurkan : ${totalKeluar.toLocaleString('id-ID')} Carats
🏦 Sisa kas : ${db.users[m.sender].money.toLocaleString('id-ID')} Carats

💬 ${hashire.name}
"${hashire.quote}"`,

				contextInfo: {
					externalAdReply: {
						title:
						'🎁 Tracen Social Aid',
						body:
						'Distribusi bantuan selesai 🏇',
						thumbnail:thumb,
						mediaType: 1,
						renderLargerThumbnail: true,
						showAdAttribution: false,
						sourceUrl:
						'https://tracen-academy.jp'

					}

				}

			},

			{

				quoted: m

			}

		)

	}

	catch (err) {

		console.log(
			'❌ BANSOS'
		)

		console.log(err)

		return m.reply(
			'❌ Bansos Error'
		)

	}

}