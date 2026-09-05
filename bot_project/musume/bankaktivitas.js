export const addBankActivity = (
	db,
	text
) => {

	try {

		if (!db.bank)
			db.bank = {}

		if (!db.bank.aktivitas)
			db.bank.aktivitas = []

		db.bank.aktivitas.unshift({

			text,

			waktu: Date.now()

		})

	}

	catch (err) {

		console.log(
			'\n❌ [BANK ACTIVITY]'
		)

		console.log(err)

	}

}

console.log(
	'📢 BANK ACTIVITY LOADED'
)