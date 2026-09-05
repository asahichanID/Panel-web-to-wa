/**
 * ⚠️ DEPRECATED — TIDAK DIPAKAI LAGI DI PROJECT INI.
 *
 * Setelah migrasi ke apiGlobal (lihat apiGlobal/API_ARCHITECTURE.md),
 * seluruh pemanggilan API eksternal sudah dipindahkan ke apiGlobal/index.js.
 * File ini SENGAJA TIDAK DIHAPUS (bukan dipakai lagi oleh naze.js maupun
 * musume/**) demi kompatibilitas ke belakang, kalau-kalau ada skrip lain
 * di luar audit yang masih mengimpornya. Jangan tambahkan pemakaian baru
 * dari file ini — gunakan apiGlobal/index.js.
 */
export const fetchjson = async (
	url,
	options = {}
) => {

	try {

		const res =

		await fetch(

			url,

			options

		)

		return await res.json()

	}

	catch (err) {

		console.log(
			'❌ FETCHJSON'
		)

		console.log(err)

		throw err

	}

}

export const fetchApi = async (
	path,
	params = {}
) => {

	try {

		const query =

		new URLSearchParams({

			...params,

			apikey:

			global.APIKeys[
				global.APIs.naze
			]

		})

		const url =

`${global.APIs.naze}${path}?${query}`

		const res =

		await fetch(
			url
		)

		return await res.json()

	}

	catch (err) {

		console.log(
			'❌ FETCHAPI'
		)

		console.log(err)

		throw err

	}

}

console.log(
	'🌐 FETCH LOADED (deprecated, lihat apiGlobal/)'
)