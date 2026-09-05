/**
 * apiGlobal/services/misc/coffee.js
 * -----------------------------------------------------------------------
 * Layanan gambar kopi acak (.coffe/.kopi). Menggantikan pola
 * try/catch 2-provider (alexflipnote → sampleapis) yang sebelumnya
 * hardcoded langsung di naze.js.
 */

import { runProviders } from '../../core/requestEngine.js';
import { alexflipnoteCoffee, sampleapisCoffee } from '../../providers/coffee.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';

const SERVICE_GROUP = 'misc';

function pickRandom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

/**
 * @returns {Promise<{result: string, provider: string, raw: any}>} `result` = URL gambar kopi.
 */
export async function apiRandomCoffee() {
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [alexflipnoteCoffee(timeout), sampleapisCoffee(timeout)];

	const { raw, providerName } = await runProviders('misc.coffee', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	// alexflipnote: raw ADALAH url (string). sampleapis: raw adalah array {image}.
	const url = typeof raw === 'string' ? raw : pickRandom(raw)?.image;
	return envelope(url, providerName, raw);
}

export default { apiRandomCoffee };
