import fs from 'fs'
import { getUmaQuote, pickRandom } from '../helperquotes.js'

const afkThumb = fs.readFileSync('./src/media/oguriafk.jpeg')
export const afk = async (
	naze,
	m,
	db,
	text
) => {

	try {

		let user = db.users[m.sender]
		user.afkTime = +new Date
		const uma = getUmaQuote()
		const umaName = [
			'Oguri Cap',
			'Tokai Teio',
			'Mihono Bourbon',
			'Rice Shower',
			'Special Week',
			'Silence Suzuka',
			'Mejiro McQueen',
			'TM Opera O',
			'Kitasan Black',
			'Satono Diamond',
			'Gold Ship'
		]

		let alasan =
		text ||
		pickRandom([

			'Sedang makan wortel premium 🥕',
			'Latihan sprint di Tracen Academy 🏃‍♀️',
			'Kabur dari debt collector Carats 💸',
			'Mencari rumput legendaris 🌱',
			`Bertapa di kandang ${pickRandom(umaName)} 🐴`,
			'Menghindari balapan dadakan 🏇',
			'Pergi membeli Energy Ticket 🎫',
			'Sedang rebahan setelah training 😹',
			'Memoles sepatu balap ✨',
			'Sedang istirahat 😹'

		])

		user.afkReason = alasan

        let thumb = afkThumb 
		return naze.sendMessage(
	m.chat,
	{
		text:
`╭─❖「 🌙 𝐓𝐑𝐀𝐈𝐍𝐄𝐑 𝐁𝐑𝐄𝐀𝐊 🌙 」
│
├ 🐎 Trainer
│ ❍ @${m.sender.split('@')[0]}
│
├ 📝 Activity
│ ❍ ${user.afkReason}
│
├ ⏳ Status
│ ❍ Baru saja AFK
│
╰─────────────❖

💬 ${uma.name}

"${uma.quote}"`,

		mentions: [
			m.sender

		],

		contextInfo: {
			externalAdReply: {
				title:
				'🌙 Turu',
				thumbnail: thumb,
				mediaType: 1,
				renderLargerThumbnail: false,
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
			'❌ AFK'
		)

		console.log(err)

		return m.reply(
			'❌ AFK Error'
		)

	}

}