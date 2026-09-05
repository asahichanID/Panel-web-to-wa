/**
 * apiGlobal/services/misc/github.js
 * -----------------------------------------------------------------------
 * Layanan GitHub publik (.ghstalk). Menggantikan
 * `fetchJson('https://api.github.com/users/' + text)` yang sebelumnya
 * ada langsung di naze.js.
 */

import { runProviders } from '../../core/requestEngine.js';
import { githubUser } from '../../providers/github.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'misc';

/**
 * @param {string} username
 * @returns {Promise<{result: object, provider: string, raw: any}>}
 *   `result` mengikuti bentuk asli GitHub REST API (login, name, bio,
 *   avatar_url, followers, following, public_repos, html_url, dst).
 */
export async function apiGithubUser(username) {
	if (!username) throw new ValidationError('apiGithubUser: parameter "username" wajib diisi.');
	const timeout = getTimeout(SERVICE_GROUP);
	const providers = [githubUser(username, timeout)];
	const { raw, providerName } = await runProviders('misc.github.user', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});
	return envelope(raw, providerName, raw);
}

export default { apiGithubUser };
