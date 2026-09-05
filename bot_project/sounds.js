const BASE = 'https://raw.githubusercontent.com/asahichanID/SoundMp3/main/sound/'

const trigger = {
	itaiyo: 'itaiyo_itaiyo',
	'🐔': 'scream',
	'tidak waras': 'tidak_waras',
	'waras': 'tidak_waras',
	'sehat?': 'tidak_waras',
}

global.soundData ??= {}

export const autoSound = async (
	naze,
	m
) => {

	let pesan = String(
		m.body || ''
	)
	.toLowerCase()
	.trim()

	if (!pesan)
		return false

	let kata = Object.keys(
		trigger
	).find(
		v =>
		pesan.includes(v)
	)

	if (!kata)
		return false

	let id = m.sender
	let now = Date.now()

	global.soundData[id] ??= {

		last: 0,

		spam: 0,

		banned: 0,

		count: 0,

		reset: now

	}

	let data = global.soundData[id]

	// Ban 1 jam
	if (
		data.banned > now
	)

		return false

	// Reset limit 1 jam
	if (

		now - data.reset >= 3600000

	) {

		data.count = 0

		data.reset = now

	}

	// Maks 5 kali per jam
	if (

		data.count >= 5

	)

		return false

	// Spam saat cooldown
	if (

		now - data.last < 4000

	) {

		data.spam++

	} else {

		data.spam = 0

	}

	// Ban 1 jam
	if (

		data.spam >= 2

	) {

		data.banned =

		now + 3600000

		return false

	}

	// Cooldown 10 detik
	if (

		now - data.last < 10000

	)

		return false

	data.last = now

	data.count++

	let nama = trigger[
		kata
	]

	await naze.sendMessage(

		m.chat,

		{

			audio: {

				url:

`${BASE}/${nama}.mp3`

			},

			mimetype:

			'audio/mpeg',

			ptt: false

		},

		{

			quoted: m

		}

	)

	return true

}

console.log(
	'🔊 SOUNDS LOADED'
)