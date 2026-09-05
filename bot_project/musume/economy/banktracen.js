import { addBankActivity } from '../bankaktivitas.js'

export const banktracen = async (
	naze,
	m,
	db,
	isCreator,
	owner
) => {

	try {

	    let bank = db.bank

		let user =

		db.users[m.sender]

		if (!user)

			return m.reply(
				'❌ User tidak ditemukan'
			)

		if (!user.lastBank)

			user.lastBank = 0

		let now = Date.now()

		let cooldown = 86400000

		let sisa =

		cooldown -

		(now - user.lastBank)

		if (sisa > 0) {

			let jam =

			Math.floor(
				sisa / 3600000
			)

			let menit =

			Math.floor(
				(sisa % 3600000)

				/ 60000
			)

			return m.reply(

`🏦 𝐓𝐑𝐀𝐂𝐄𝐍 𝐁𝐀𝐍𝐊

💸 Kamu sudah mengambil dana hari ini.

⏳ ${jam}j ${menit}m`

			)

		}

		if (

			db.bank.kas <= 0

		)

			return m.reply(

`🏦 𝐓𝐑𝐀𝐂𝐄𝐍 𝐁𝐀𝐍𝐊

💸 Kas negara sedang kosong 😹`

			)

		let tarik =

		Math.min(

			50000,

			db.bank.kas

		)

		let pajak =

		Math.floor(
			tarik * 0.2
		)

		let diterima =

		tarik - pajak

		db.bank.kas -= tarik

		db.bank.totalPajak += pajak

		user.money += diterima

		user.lastBank = now

		let ownerId =

		owner[0]

		.replace(
			/[^0-9]/g,
			''
		)

		+ '@s.whatsapp.net'

		if (

			db.users[ownerId]

		)

			db.users[
				ownerId
			].money += pajak

		console.log(
			'\n🏦 [BANK TRACEN]'
		)

		console.log(
			'👤',
			m.sender
		)

		console.log(
			'💰 Tarik :',
			tarik
		)

		console.log(
			'🧾 Pajak :',
			pajak
		)

		console.log(
			'💵 Diterima :',
			diterima
		)

		console.log(
			'📦 Kas :',
			db.bank.kas
		)

		console.log(
			'👑 Owner :',
			ownerId
		)

		return m.reply(

`🏦 𝐓𝐑𝐀𝐂𝐄𝐍 𝐁𝐀𝐍𝐊

💰 Dana diambil :
${tarik.toLocaleString('id-ID')} Carats
🧾 Pajak :
${pajak.toLocaleString('id-ID')} Carats
💵 Diterima :
${diterima.toLocaleString('id-ID')} Carats
📦 Sisa kas :
${db.bank.kas.toLocaleString('id-ID')} Carats
👑 Dana akademi terus berjalan 🏇`

		)

	}

	catch (err) {

		console.log(
			'\n❌ [BANK TRACEN]'
		)

		console.log(err)

		return m.reply(
			'❌ Banktracen Error'
		)

	}

}

console.log(
	'🏦 BANKTRACEN LOADED'
)

export const cekbank = async (
	m,
	db
) => {

	try {

		let bank = db.bank

		if (!bank.aktivitas)
			bank.aktivitas = []

		let aktivitas =

        bank.aktivitas.length ?
        
        bank.aktivitas
        
        .slice(0,3)
        
        .map(

	(v,i) => {

		let jamAktivitas = new Date(
			v.waktu
		).toLocaleTimeString(
			'id-ID',
			{
				timeZone: 'Asia/Jakarta',
				hour: '2-digit',
				minute: '2-digit'
			}
		)

		return `${i+1}. ${v.text}
🕒 ${jamAktivitas} WIB`

	}

)
        
        .join('\n\n')
        
        :
        
        'Belum ada aktivitas.'

		let jam = new Date()

		let waktu = jam.toLocaleTimeString(
    	'id-ID',
    	{
    		timeZone: 'Asia/Jakarta',
    		hour: '2-digit',
    		minute: '2-digit'
    	}
    )

		return m.reply(

`🏦 𝐏𝐔𝐒𝐀𝐓 𝐄𝐊𝐎𝐍𝐎𝐌𝐈 𝐓𝐑𝐀𝐂𝐄𝐍

🕒 ${waktu}

💰 Kas Akademi
${bank.kas.toLocaleString('id-ID')} Carats

📥 Dana Masuk
${bank.danaMasuk.toLocaleString('id-ID')} Carats

📤 Dana Keluar
${bank.danaKeluar.toLocaleString('id-ID')} Carats

🧾 Total Pajak
${bank.totalPajak.toLocaleString('id-ID')} Carats

🏇 Total Balapan
${bank.totalRace} Race

🥕 Total Feed
${bank.totalFeed}

🛒 Total Pembelian
${bank.totalPembelian}

📢 Aktivitas Terbaru

${aktivitas}

🏫 Ekonomi Tracen Academy terus berjalan 🏇`

		)

	}

	catch (err) {

		console.log(
			'\n❌ [CEKBANK]'
		)

		console.log(err)

		return m.reply(
			'❌ Cekbank Error'
		)

	}

}

console.log(
	'🏦 CEKBANK LOADED'
)