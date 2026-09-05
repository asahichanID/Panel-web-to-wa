const MAX_STATS = 1200

export const ownerStats = (
	uma,
	stats,
	isCreator
) => {

	if (

		!uma ||

		!stats

	)

		return {

			stats,

			text: ''

		}

	let text = ''

	if (

		isCreator &&

		uma.ownerStats

	) {

		text =

'🌟 𝐒𝐓𝐀𝐓𝐒 𝐋𝐕𝐋 𝐌𝐀𝐗+ 🌟'

		stats = {

			...stats,

			speed: MAX_STATS,

			stamina: MAX_STATS,

			power: MAX_STATS,

			accel: MAX_STATS

		}

	}

	return {

		stats: {

			...stats,

			speed: Math.min(
				stats.speed,
				MAX_STATS
			),

			stamina: Math.min(
				stats.stamina,
				MAX_STATS
			),

			power: Math.min(
				stats.power,
				MAX_STATS
			),

			accel: Math.min(
				stats.accel,
				MAX_STATS
			)

		},

		text

	}

}

console.log(
	'👑 OWNER UMA LOADED'
)