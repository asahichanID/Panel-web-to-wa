/**
 * apiGlobal/services/ai/ai.js
 * -----------------------------------------------------------------------
 * Layanan AI. Menggabungkan seluruh titik panggil AI yang sebelumnya
 * tersebar di:
 *   - naze.js case 'cai'/'roomai'/dst        -> Naze /ai/chat4
 *   - naze.js case 'ai'/'google'/'gemini'    -> Naze /ai/gemini-flash-lite
 *   - naze.js case 'archipelago'/'grok'/dst  -> Neosantara /chat/completions
 *   - naze.js case 'deepseek'/'r1'           -> Neosantara /chat/completions (+thinking)
 *   - musume/Oguriai/api.js (chatOguri)      -> Naze /ai/chat -> /ai/message -> /ai/llama
 *
 * Command tidak perlu tahu Bearer token / apikey / endpoint mana yang
 * dipakai untuk model tertentu — cukup panggil fungsi yang sesuai
 * kebutuhan lalu berikan `model` bila relevan.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { neosantaraChatCompletion } from '../../providers/neosantara.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope, validated } from '../../core/normalizer.js';
import { isConfigured } from '../../config/index.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'ai';

/**
 * Chat AI ber-histori dengan system prompt custom (dipakai oleh `.cai`/`.roomai`).
 *
 * @param {Array<{role:string, content:string}>} messages
 * @param {string} [prompt]
 * @returns {Promise<{result: {message: string}, provider: string, raw: any}>}
 */
export async function apiAiChat4(messages, prompt) {
	if (!Array.isArray(messages) || !messages.length) {
		throw new ValidationError('apiAiChat4: parameter "messages" wajib berupa array yang tidak kosong.');
	}

	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => Boolean(raw?.data?.message);
	const providers = [
		validated(neoxrRequest('/gemini-chat', { messages, prompt }, { method: 'POST', timeout }), isValid),
		nazeRequest('/ai/chat4', { messages, prompt }, { method: 'POST', timeout })
	];

	const { raw, providerName } = await runProviders('ai.chat4', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	const result =
		raw?.result ??
		(raw?.data?.message ? { message: raw.data.message } : null);

	return envelope(result, providerName, raw);
}

/**
 * AI cepat satu-kali-tanya tanpa histori (dipakai oleh `.ai`/`.gemini`/`.bard`).
 *
 * @param {string} query
 * @returns {Promise<{result: {text: string}, provider: string, raw: any}>}
 */
export async function apiAiQuick(query) {
	if (!query) throw new ValidationError('apiAiQuick: parameter "query" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const extractText = (raw) =>
		raw?.data?.message ?? raw?.data?.answer ?? raw?.data?.result ?? raw?.data?.text ?? raw?.result ?? null;
	const isValid = (raw) => Boolean(extractText(raw));

	const providers = [
		validated(neoxrRequest('/gpt4', { query }, { timeout }), isValid),
		nazeRequest('/ai/gemini-flash-lite', { query }, { timeout })
	];

	const { raw, providerName } = await runProviders('ai.quick', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	const text = extractText(raw);
	return envelope(text ? { text } : (raw?.result ?? null), providerName, raw);
}

/**
 * AI model "premium" lewat Neosantara (dipakai oleh `.grok`/`.glm`/`.claude`/
 * `.archipelago`/`.deepseek`/`.r1`). Mengembalikan pesan asisten (dan
 * `reasoning_content` bila model mendukung mode "thinking").
 *
 * @param {Object} opts
 * @param {string} opts.model
 * @param {Array<{role:string, content:string}>} opts.messages
 * @param {{type:string, budget_tokens?: number}} [opts.thinking]
 * @returns {Promise<{result: {content: string, reasoning_content?: string}, provider: string, raw: any}>}
 */
export async function apiAiPremiumChat({ model, messages, thinking }) {
	if (!model) throw new ValidationError('apiAiPremiumChat: parameter "model" wajib diisi.');
	if (!Array.isArray(messages) || !messages.length) {
		throw new ValidationError('apiAiPremiumChat: parameter "messages" wajib berupa array yang tidak kosong.');
	}

	const timeout = getTimeout(SERVICE_GROUP);
	const extractMessage = (raw) =>
		raw?.choices?.[0]?.message ??
		(raw?.data?.message ? { role: 'assistant', content: raw.data.message } : null);
	const isValid = (raw) => Boolean(extractMessage(raw));

	const providers = [
		validated(neoxrRequest('/claude', { model, messages, thinking }, { method: 'POST', timeout }), isValid),
		validated(neoxrRequest('/gpt-completion', { model, messages, thinking }, { method: 'POST', timeout }), isValid)
	];

	// Neosantara butuh API Key sendiri (dedicated AI provider, terpisah dari
	// NeoXR). Hanya disertakan sebagai fallback bila sudah dikonfigurasi,
	// supaya bot owner yang belum mengisi key Neosantara TETAP bisa memakai
	// NeoXR tanpa terhalang gate ini (bug lama: gate ini dulu memblokir
	// NeoXR juga, bukan hanya Neosantara).
	if (isConfigured('neosantara')) {
		providers.push(neosantaraChatCompletion({ model, messages, thinking }, timeout));
	}

	const { raw, providerName } = await runProviders('ai.premium', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	const message = extractMessage(raw);
	return envelope(message, providerName, raw);
}

/**
 * Chat AI untuk karakter "Oguri" — 3 endpoint Naze dicoba berurutan
 * sampai salah satu memberi jawaban yang layak (persis perilaku asli
 * chatOguri() di musume/Oguriai/api.js).
 *
 * @param {Array<{role:string, content:string}>} messages
 * @returns {Promise<{result: string, provider: string, raw: any}>}
 */
export async function apiOguriChat(messages) {
	if (!Array.isArray(messages) || !messages.length) {
		throw new ValidationError('apiOguriChat: parameter "messages" wajib berupa array yang tidak kosong.');
	}

	const timeout = getTimeout(SERVICE_GROUP);
	const lastUser = messages.findLast?.((m) => m.role === 'user')?.content
		?? [...messages].reverse().find((m) => m.role === 'user')?.content
		?? '';

	const isChatValid = (raw) => Boolean(raw?.success && raw?.result?.message);
	const isStringResultValid = (raw) => typeof raw?.result === 'string' && raw.result.trim().length > 0;

	const providers = [
		{
			...validated(nazeRequest('/ai/chat', { query: lastUser }, { timeout }), isChatValid),
			name: 'naze:chat'
		},
		{
			...validated(
				nazeRequest('/ai/message', { messages: JSON.stringify(messages) }, { timeout }),
				isStringResultValid
			),
			name: 'naze:message'
		},
		{
			...validated(
				nazeRequest('/ai/llama', { query: lastUser, messages: JSON.stringify(messages) }, { timeout }),
				isStringResultValid
			),
			name: 'naze:llama'
		}
	];

	const { raw, providerName } = await runProviders('ai.oguri', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	const text = (raw?.result?.message ?? raw?.result ?? '').toString().trim();
	return envelope(text, providerName, raw);
}

export default { apiAiChat4, apiAiQuick, apiAiPremiumChat, apiOguriChat };
