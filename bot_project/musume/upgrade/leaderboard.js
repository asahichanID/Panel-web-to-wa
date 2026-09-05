import { getUmaQuote } from '../helperquotes.js'

export const leaderboard = async (naze,m,db,owner) => {

	try {

		const uma = getUmaQuote()

		let users = Object.entries(db.users)

		.map(([id,user]) => {

			let umaLevel = '(Belum dimiliki)'

			if (
				user.activeUma &&
				user.umaStats?.[user.activeUma]
			) {

				umaLevel =
				user.umaStats[
					user.activeUma
				].level

			}

			return {

				id,

				money: user.money || 0,

				limit: user.limit || 0,

				umaLevel

			}

		})

		.sort((a,b) => b.money - a.money)

		.slice(0,10)

		let teks =
`╭─❖「 🏇 𝐓𝐑𝐀𝐂𝐄𝐍 𝐑𝐀𝐍𝐊𝐈𝐍𝐆 🏇 」
│
│ 🏆 Top Trainers
│ of Tracen Academy
│
`

		for (let i = 0; i < users.length; i++) {

			let medal =
			i == 0 ? '🥇' :
			i == 1 ? '🥈' :
			i == 2 ? '🥉' :
			'🏅'

			teks +=
`${medal} @${users[i].id.split('@')[0]}
🏇 Uma LVL : ${users[i].umaLevel}
💎 Carats : ${users[i].money.toLocaleString('id-ID')}
🎫 Energy Ticket : ${users[i].limit.toLocaleString('id-ID')}

`

		}

		teks +=
`╰─────────────❖

💬 ${uma.name}

"${uma.quote}"`

		return m.reply(

			teks,

			{

				mentions:

				users.map(
					v => v.id
				)

			}

		)

	}

	catch (err) {

		console.log(
			'❌ LEADERBOARD'
		)

		console.log(err)

		return m.reply(
			'❌ Leaderboard Error'
		)

	}

}