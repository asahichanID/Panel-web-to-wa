export function getKebutuhanExp(level){

	return 200 +

	((level - 1) * 150)

}

export function processUmaLevel(stats) {

	let naik = false

	let kebutuhan =

	200 +

	((stats.level - 1) * 150)

	let levelNaik = 0

	while (

		stats.exp >= kebutuhan

	) {

		stats.exp -= kebutuhan

		stats.level++

		levelNaik++

		naik = true

		kebutuhan =

		200 +

		((stats.level - 1) * 150)

	}

	return {

		naik,

		levelNaik,

		kebutuhan

	}

}
console.log(
'🏇 XPUMA/XPHELPER LOADED'
)