import { processUmaLevel }

from './xphelper.js'

export function addUmaExp(stats) {

	let exp =

	Math.floor(
		Math.random() * 30
	) + 15

	stats.exp += exp

	const hasil =

	processUmaLevel(
		stats
	)

	console.log(

`🏇 UMA EXP | LV ${stats.level} | +${exp} EXP`

	)

	return {

		exp,

		...hasil

	}

}

console.log(
'🏇 XPUMA/XPUMA LOADED'
)