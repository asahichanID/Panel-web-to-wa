/**
 * apiGlobal/services/tools/weather.js
 * -----------------------------------------------------------------------
 * Layanan cuaca (.cuaca/.weather). Menggantikan
 * `fetchApi('/tools/cuaca', { city: text })`.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'tools';

/**
 * @param {string} city
 * @returns {Promise<{result: object, provider: string, raw: any}>}
 *   `result` mengikuti bentuk asli provider (mis. OpenWeatherMap-like:
 *   name, weather[], main.{temp,feels_like,pressure,humidity}, wind.speed,
 *   coord.{lat,lon}, sys.country) — dipertahankan apa adanya karena hanya
 *   ada satu provider nyata saat ini.
 */
export async function apiWeather(city) {
	if (!city) throw new ValidationError('apiWeather: parameter "city" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [nazeRequest('/tools/cuaca', { city }, { timeout })];
	const { raw, providerName } = await runProviders('tools.weather', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw?.result ?? null, providerName, raw);
}

export default { apiWeather };
