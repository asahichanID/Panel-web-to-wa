/**
 * apiGlobal/services/downloader/youtube.js
 * -----------------------------------------------------------------------
 * Layanan YouTube. Menggantikan:
 *   - musume/upgrade/play.js       (fetch langsung ke Neoxr, key hardcoded)
 *   - musume/upgrade/tracendd.js   (fetchApi('/download/youtube', ...))
 *
 * Command TIDAK PERLU tahu ada 2 provider (Neoxr / Naze), tidak perlu
 * tahu API Key, tidak perlu tahu format response masing-masing provider.
 * Command cukup memanggil salah satu dari 2 fungsi di bawah sesuai
 * kebutuhannya, lalu membaca `result.download` / `result.filename` / dst.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { pickField, envelope, validated } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'youtube';

/**
 * Menyamakan field dari berbagai bentuk response.
 * - Naze  : semuanya rata di bawah `result.*` (title, download, author, views, ago, size).
 * - NeoXR : metadata (title, channel, views, publish) ada di level ATAS response,
 *           sedangkan info file (filename, size, extension, url) ada di dalam `data.*`.
 *           Pemanggil WAJIB menggabungkan kedua level ini sebelum masuk ke sini
 *           (lihat `mergeNeoxr()` di bawah), supaya pickField bisa menemukan
 *           kedua kelompok field sekaligus.
 */
function normalize(raw) {
	if (!raw) return null;
	const rawViews = pickField(raw, ['views']);
	return {
		title: pickField(raw, ['title']),
		download: pickField(raw, ['download', 'url']),
		filename: pickField(raw, ['filename', 'title']),
		author: pickField(raw, ['author', 'channel']),
		views: rawViews ? Number(String(rawViews).replace(/[^\d]/g, '')) || 0 : 0,
		ago: pickField(raw, ['ago', 'publish']),
		size: pickField(raw, ['size']),
		direct: Boolean(raw.direct)
	};
}

/**
 * NeoXR menaruh metadata (title/channel/views/publish/thumbnail/duration) di
 * level atas response, terpisah dari `data.*` (filename/size/extension/url).
 * Gabungkan keduanya supaya `normalize()` bisa membaca semua field sekaligus.
 */
function mergeNeoxr(raw) {
	if (!raw?.data) return raw;
	return { ...raw, ...raw.data };
}

function pickAio2Audio(raw) {
	const medias = raw?.result?.medias || [];
	return (
		medias.find(v => v.formatId === 140) || // m4a 130kbps
		medias.find(v => v.formatId === 251) || // opus 156kbps
		medias.find(v => v.formatId === 250) ||
		medias.find(v => v.formatId === 249) ||
		null
	);
}

function pickAio2Video(raw, format = '720') {
	const medias = raw?.result?.medias || [];

	const map = {
		'1080': 137,
		'720': 136,
		'480': 787,
		'360': 18,
		'240': 133,
		'144': 160
	};

	return (
		medias.find(v => v.formatId === map[format]) ||
		medias.find(v => v.type === 'video' && v.ext === 'mp4') ||
		null
	);
}

export async function apiYoutubeSearch(query) {
  if (!query) {
    throw new ValidationError(
      'apiYoutubeSearch: parameter "query" wajib diisi.'
    )
  }

  const timeout = getTimeout(SERVICE_GROUP)

  const providers = [
  
    nazeRequest(
      '/search/youtube',
      { query },
      { timeout }
    ),
    
    neoxrRequest(
      '/yts',
      { q: query },
      { timeout }
    )
    
  ]

  const { raw, providerName } = await runProviders(
    'youtube.search',
    providers,
    {
      defaultTimeout: timeout,
      defaultRetry: DEFAULT_RETRY
    }
  )

  let result = []

  if (providerName === 'neoxr') {
    result = raw?.data ?? []

    if (!Array.isArray(result)) {
      result =
        result?.items ??
        result?.videos ??
        result?.results ??
        []
    }
  } else {
    const items =
      raw?.result?.items ??
      raw?.data?.items ??
      []

    result = items.map(v => ({
      title: v.snippet?.title,
      url: `https://youtu.be/${v.id?.videoId}`,
      videoId: v.id?.videoId,
      thumbnail:
        v.snippet?.thumbnails?.high?.url ??
        v.snippet?.thumbnails?.medium?.url ??
        v.snippet?.thumbnails?.default?.url,
      timestamp: '--:--',
      ago: v.snippet?.publishedAt,
      views: 0,
      author: {
        name: v.snippet?.channelTitle
      }
    }))
  }

  return envelope(result, providerName, raw)
}
/**
 * Unduh AUDIO YouTube berdasarkan URL video (dipakai oleh layanan `play`
 * setelah judul lagu ditemukan lewat pencarian). Prioritas: Neoxr → Naze.
 *
 * @param {string} url - URL video YouTube (bukan kata kunci pencarian).
 * @returns {Promise<{result: object, provider: string, raw: any}>}
 */
export async function apiYoutubeAudio(url) {
	if (!url) throw new ValidationError('apiYoutubeAudio: parameter "url" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const isValid = (raw) => Boolean(mergeNeoxr(raw)?.url || raw?.result?.download);

	const providers = [
	
        validated(nazeRequest('/download/aio2', { url }, { timeout }), raw => Boolean(pickAio2Audio(raw)?.url)),	
		validated(neoxrRequest('/youtube', { url, type: 'audio', quality: '128kbps' }, { timeout }), isValid),
		nazeRequest('/download/youtube', { url, format: 'mp3' }, { timeout })
	];

	const { raw, providerName } = await runProviders('youtube.audio', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	let data;
    if (raw?.result?.medias) {
    	const media = pickAio2Audio(raw);
    
    	data = {
    		title: raw.result.title,
    		author: raw.result.author,
    		thumbnail: raw.result.thumbnail,
    		filename: `${raw.result.title}.${media.ext}`,
    		size: '',
    		url: media.url,
    		download: media.url,
    		direct: true
    	};
    } else {
    	data = raw?.data ? mergeNeoxr(raw) : (raw?.result || raw);
    	
    	data.direct = false
    }
    
    return envelope(normalize(data), providerName, raw);
}

/**
 * Unduh YouTube berdasarkan URL + format eksplisit (dipakai oleh
 * `.ytmp3` — format 'mp3' — dan `.ytmp4` — format kualitas video seperti
 * '360', '720', '1080', '2k', '4k', '8k').
 *
 * @param {string} url
 * @param {string} [format='mp3']
 */
export async function apiYoutubeDownload(url, format = 'mp3') {
	if (!url) throw new ValidationError('apiYoutubeDownload: parameter "url" wajib diisi.');

	const timeout = getTimeout(SERVICE_GROUP);
	const isAudio = format === 'mp3';
	// NeoXR mengharapkan kualitas video seperti "720p" (contoh dari
	// NEOXR_ENDPOINTS.md), sedangkan format internal project ini berupa
	// angka polos ('360','720',dst) atau '2k'/'4k'/'8k'. Angka polos perlu
	// akhiran 'p'; '2k'/'4k'/'8k' dibiarkan apa adanya.
	const neoxrQuality = isAudio ? '128kbps' : (/^\d+$/.test(format) ? `${format}p` : format);
	const isValid = (raw) => Boolean(mergeNeoxr(raw)?.url);

	const providers = [
        validated(nazeRequest('/download/aio2', { url }, { timeout }), raw => Boolean(pickAio2Video(raw, format)?.url)),
		validated(neoxrRequest('/youtube', { url, type: isAudio ? 'audio' : 'video', quality: neoxrQuality }, { timeout }), isValid),
		nazeRequest('/download/youtube', { url, format }, { timeout })
	];

	const { raw, providerName } = await runProviders('youtube.download', providers, {
		defaultTimeout: timeout,
		defaultRetry: DEFAULT_RETRY
	});

	let data;
    if (raw?.result?.medias) {
    	const media = isAudio
    		? pickAio2Audio(raw)
    		: pickAio2Video(raw, format);
    
    	data = {
    		title: raw.result.title,
    		author: raw.result.author,
    		thumbnail: raw.result.thumbnail,
    		filename: `${raw.result.title}.${media.ext}`,
    		size: '',
    		url: media.url,
    		download: media.url,
    		direct: true
    	};
    } else {
    	data = raw?.data ? mergeNeoxr(raw) : (raw?.result || raw);
    	
    	data.direct = false
    }
    
    return envelope(normalize(data), providerName, raw);
}

export default { apiYoutubeAudio, apiYoutubeDownload, apiYoutubeSearch };
