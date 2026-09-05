/**
 * apiGlobal/core/errors.js
 * -----------------------------------------------------------------------
 * Kumpulan class Error khusus milik apiGlobal.
 *
 * Tujuan: memberi command/layanan pemanggil pesan error yang JELAS dan
 * KONSISTEN, tanpa command perlu tahu detail provider mana yang gagal,
 * berapa kali retry dicoba, dsb. Sesuai Part 3 API_ARCHITECTURE.md:
 * "Apabila seluruh provider gagal maka barulah sistem mengembalikan Error.
 *  Namun Error yang diberikan harus jelas."
 */

export class ApiGlobalError extends Error {
	constructor(message, meta = {}) {
		super(message);
		this.name = 'ApiGlobalError';
		this.meta = meta;
	}
}

/** Satu provider gagal (dipakai secara internal untuk mencatat percobaan). */
export class ProviderError extends ApiGlobalError {
	constructor(providerName, cause) {
		const causeMessage = cause?.message || String(cause);
		super(`[${providerName}] ${causeMessage}`, { providerName, cause });
		this.name = 'ProviderError';
		this.providerName = providerName;
		this.cause = cause;
	}
}

/** Provider tidak merespons dalam batas waktu yang ditentukan. */
export class TimeoutError extends ProviderError {
	constructor(providerName, timeoutMs) {
		super(providerName, new Error(`Timeout setelah ${timeoutMs}ms`));
		this.name = 'TimeoutError';
		this.timeoutMs = timeoutMs;
	}
}

/**
 * Seluruh provider pada suatu layanan gagal dihubungi/merespons.
 * Ini adalah SATU-SATUNYA jenis error yang boleh "bocor" sampai ke command,
 * supaya command tidak perlu tahu provider mana saja yang sudah dicoba.
 */
export class AllProvidersFailedError extends ApiGlobalError {
	constructor(serviceName, attempts = []) {
		const list = attempts
			.map((a) => `${a.providerName}${a.attempt ? ` (percobaan ke-${a.attempt + 1})` : ''}: ${a.message}`)
			.join(' | ');
		super(
			`Semua provider untuk layanan "${serviceName}" gagal merespons.${list ? ` Detail: ${list}` : ''}`,
			{ serviceName, attempts }
		);
		this.name = 'AllProvidersFailedError';
		this.serviceName = serviceName;
		this.attempts = attempts;
	}
}

/** Input yang diberikan command ke layanan apiGlobal tidak valid. */
export class ValidationError extends ApiGlobalError {
	constructor(message) {
		super(message);
		this.name = 'ValidationError';
	}
}

/**
 * Layanan sudah punya "pondasi" (file, function, export) tapi provider
 * asli belum diimplementasikan. Ini BUKAN kegagalan sistem — sesuai
 * Part 4 API_ARCHITECTURE.md "Placeholder Bukan Error": import tetap
 * berjalan, dependency tetap utuh, hanya fitur ini yang belum aktif.
 */
export class NotImplementedError extends ApiGlobalError {
	constructor(serviceName) {
		super(`Layanan "${serviceName}" belum memiliki provider aktif. Fitur ini masih berupa pondasi (placeholder) dan akan diaktifkan pada pengembangan berikutnya.`);
		this.name = 'NotImplementedError';
		this.serviceName = serviceName;
	}
}
