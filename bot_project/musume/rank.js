export let ownerCheat = false

export const setOwnerCheat = mode => {

	ownerCheat = mode

}

export const getUmaRank = (
	stats,
	isOwner = false
) => {

	if (

		isOwner &&

		ownerCheat

	)

		return {

			rank:
			'🌌 Undefeated Uma',

			point: '∞'

		}

	let point =

		(stats.level * 15)

		+ stats.speed

		+ stats.stamina

		+ stats.power

		+ stats.accel

		+ (stats.win * 30)

		- (stats.lose * 10)

	if (point < 0)

		point = 0

	let rank =

		'🌱 Rookie'

	if (point >= 200)

		rank =
		'🥉 Bronze'

	if (point >= 400)

		rank =
		'🥈 Silver'

	if (point >= 700)

		rank =
		'🥇 Gold'

	if (point >= 1100)

		rank =
		'💎 Diamond'

	if (point >= 1500)

		rank =
		'🏆 Tracen Elite'

	if (point >= 2000)

		rank =
		'👑 Legend Racer'

	return {

		rank,

		point

	}

}

console.log(
	'🏆 RANK LOADED'
)