import { processUmaLevel } from './xphelper.js'

const isOwner = sender =>
	global.owner
	.map(v =>
		v.replace(/[^0-9]/g,'') +
		'@s.whatsapp.net'
	)
	.includes(sender)

function getData(m,text,db){

	let target =
	m.mentionedJid?.[0] ||
	m.sender

	let jumlah =
	parseInt(
		text
		.replace(/@\d+/g,'')
		.trim()
	)

	let user =
	db.users[target]

	if (
		!user?.activeUma
	)

	return null

	let stats =
	user.umaStats[
		user.activeUma
	]

	return {

		target,

		jumlah,

		user,

		stats

	}

}

export async function addxpuma(
	naze,
	m,
	text,
	db
){

	if (
		!isOwner(
			m.sender
		)
	)

	return m.reply(
		'❌ Khusus owner.'
	)

	let data =
	getData(
		m,
		text,
		db
	)

	if (!data)

	return m.reply(
		'❌ Uma tidak ditemukan.'
	)

	if (!data.jumlah)

	return m.reply(
`Contoh:

.addxpuma 5000

.addxpuma @tag 5000`
	)

	data.stats.exp +=
	data.jumlah

	let hasil =
	processUmaLevel(
		data.stats
	)

	return m.reply(
`🏇 ${data.user.activeUma}

⭐ EXP +${data.jumlah}

🏆 Level : ${data.stats.level}

📊 EXP : ${data.stats.exp}/${hasil.kebutuhan}

${hasil.naik ? '🎉 LEVEL UP!' : ''}`
	)

}

export async function setxpuma(
	naze,
	m,
	text,
	db
){

	if (
		!isOwner(
			m.sender
		)
	)

	return m.reply(
		'❌ Khusus owner.'
	)

	let data =
	getData(
		m,
		text,
		db
	)

	if (!data)

	return m.reply(
		'❌ Uma tidak ditemukan.'
	)

	if (
		data.jumlah ===
		undefined
	)

	return m.reply(
`Contoh:

.setxpuma 5000

.setxpuma @tag 5000`
	)

	data.stats.exp =
	data.jumlah

	let hasil =
	processUmaLevel(
		data.stats
	)

	return m.reply(
`🏇 ${data.user.activeUma}

📌 EXP diatur menjadi ${data.jumlah}

🏆 Level : ${data.stats.level}

📊 EXP : ${data.stats.exp}/${hasil.kebutuhan}`
	)

}

export async function delxpuma(
	naze,
	m,
	text,
	db
){

	if (
		!isOwner(
			m.sender
		)
	)

	return m.reply(
		'❌ Khusus owner.'
	)

	let data =
	getData(
		m,
		text,
		db
	)

	if (!data)

	return m.reply(
		'❌ Uma tidak ditemukan.'
	)

	if (!data.jumlah)

	return m.reply(
`Contoh:

.delxpuma 5000

.delxpuma @tag 5000`
	)

	data.stats.exp =

	Math.max(

		0,

		data.stats.exp -

		data.jumlah

	)

	let hasil =
	processUmaLevel(
		data.stats
	)

	return m.reply(
`🏇 ${data.user.activeUma}

🗑️ EXP -${data.jumlah}

📊 EXP : ${data.stats.exp}/${hasil.kebutuhan}`
	)

}

console.log(
'🏇 XPUMA/ADDXPOWNER LOADED'
)