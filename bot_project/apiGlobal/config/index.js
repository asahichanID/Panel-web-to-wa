/**
 * apiGlobal/config/index.js
 * -----------------------------------------------------------------------
 * Gerbang tunggal untuk seluruh konfigurasi apiGlobal. File layanan
 * (services/**) hanya boleh mengimpor dari sini, bukan langsung dari
 * providers.config.js / timeout.config.js, supaya kelak jika detail
 * config berubah struktur, file layanan tidak ikut berubah.
 */

export { getBaseUrl, getApiKey, isConfigured } from './providers.config.js';
export { getTimeout, DEFAULT_TIMEOUT_MS, DEFAULT_RETRY } from './timeout.config.js';
