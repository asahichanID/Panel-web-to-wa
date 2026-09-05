/**
 * apiGlobal/services/misc/urbandictionary.js
 * -----------------------------------------------------------------------
 * Layanan Urban Dictionary (.urban). Menggantikan
 * `fetchJson('https://api.urbandictionary.com/v0/define?term=' + text)`
 * yang sebelumnya ada langsung di naze.js.
 */

import { runProviders } from '../../core/requestEngine.js';
import { urbanDefine } from '../../providers/urbandictionary.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, validated } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'misc';

/**
 * @param {string} term
 * @returns {Promise<{result: Array<{definition:string, permalink:string}>, provider: string, raw: any}>}
 */
export async function apiUrbanDefine(term) {
	if (!term) throw new ValidationError('apiUrbanDefine: parameter "term" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => Array.isArray(raw?.list) && raw.list.length > 0;

	const providers = [validated(urbanDefine(term, timeout), isValid)];
	const { raw, providerName } = await runProviders('misc.urbandictionary', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	return envelope(raw?.list ?? [], providerName, raw);
}

export default { apiUrbanDefine };
