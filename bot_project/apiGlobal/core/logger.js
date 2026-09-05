/**
 * apiGlobal/core/logger.js
 * -----------------------------------------------------------------------
 * Logger sederhana & terpusat khusus untuk apiGlobal.
 *
 * Kenapa perlu logger sendiri (bukan console.log tersebar)?
 * Supaya setiap log yang berhubungan dengan komunikasi API eksternal
 * gampang dikenali, dan bisa dimatikan/dinyalakan lewat 1 env var
 * (APIGLOBAL_DEBUG) tanpa mengubah kode di banyak file.
 *
 * Logger ini TIDAK PERNAH throw. Logging tidak boleh menjadi sumber bug baru.
 */

const DEBUG = String(process.env.APIGLOBAL_DEBUG || '').toLowerCase() === 'true';

const tag = (level) => `[apiGlobal:${level}]`;

export const logger = {
	debug(...args) {
		if (!DEBUG) return;
		try { console.log(tag('debug'), ...args); } catch { /* noop */ }
	},
	info(...args) {
		try { console.log(tag('info'), ...args); } catch { /* noop */ }
	},
	warn(...args) {
		try { console.warn(tag('warn'), ...args); } catch { /* noop */ }
	},
	error(...args) {
		try { console.error(tag('error'), ...args); } catch { /* noop */ }
	},
	/** Log ringkas 1 baris untuk setiap percobaan provider (sukses/gagal). */
	attempt(serviceName, providerName, ok, extra = '') {
		const icon = ok ? '✅' : '⚠️';
		this[ok ? 'debug' : 'warn'](`${icon} ${serviceName} → ${providerName}${extra ? ' :: ' + extra : ''}`);
	}
};

export default logger;
