/**
 * apiGlobal/services/downloader/tiktok.js
 * -----------------------------------------------------------------------
 * Layanan TikTok. Menggantikan pemanggilan `/download/tiktok` yang
 * sebelumnya tersebar di musume/upgrade/tracendd.js (command `.tt`/`.ttmp3`).
 *
 * Prioritas: NeoXR (`/tiktok`) → Naze (`/download/tiktok`).
 *
 * NeoXR dan Naze mengembalikan bentuk yang BERBEDA JAUH satu sama lain:
 *   - Naze  : { result: { desc, author.nickname, create_time,
 *                          download: { video: { nowm_hd, nowm, wm }, audio, music, music_info } } }
 *   - NeoXR : { data: { caption, author.nickname, published,
 *                        video, videoWM, audio, music: { title, author, duration } } }
 * (lihat NEOXR_ENDPOINTS.md bagian TikTok untuk contoh lengkap.)
 *
 * Command (musume/upgrade/tracendd.js) sudah ditulis mengikuti bentuk
 * Naze. Supaya command TIDAK PERLU diubah, response NeoXR dipetakan ke
 * bentuk yang sama persis di bawah ini sebelum dikembalikan.
 */

import { runProviders } from '../../core/requestEngine.js';
import { nazeRequest } from '../../providers/naze.provider.js';
import { neoxrRequest } from '../../providers/neoxr.provider.js';
import { getTimeout, DEFAULT_RETRY } from '../../config/index.js';
import { envelope } from '../../core/normalizer.js';
import { ValidationError } from '../../core/errors.js';

const SERVICE_GROUP = 'tiktok';

/** Petakan bentuk response NeoXR ke bentuk yang sama seperti Naze. */
function normalizeNeoxr(data) {
  if (!data) return null

  const photos = Array.isArray(data.photo)
    ? data.photo.filter(Boolean)
    : data.photo
      ? [data.photo]
      : []

  return {
  id: data.id ?? null,
  desc: data.caption ?? data.desc ?? null,
  create_time: data.published ?? data.create_time ?? null,
  createTime: data.published ?? data.createTime ?? null,

  author: {
    id: data.author?.id ?? null,
    nickname: data.author?.nickname ?? data.author?.uniqueId ?? data.author?.unique_id ?? null,
    uniqueId: data.author?.uniqueId ?? data.author?.unique_id ?? null,
    avatarThumb: data.author?.avatarThumb ?? null,
    avatarMedium: data.author?.avatarMedium ?? null,
    avatarLarger: data.author?.avatarLarger ?? null,
    signature: data.author?.signature ?? null,
    verified: data.author?.verified ?? false,
    secUid: data.author?.secUid ?? null
  },

  stats: {
    diggCount: data.statistic?.likes ?? 0,
    shareCount: data.statistic?.shares ?? 0,
    commentCount: data.statistic?.comments ?? 0,
    playCount: data.statistic?.views ?? 0,
    collectCount: data.statistic?.saved ?? 0
  },

  statsV2: {
    diggCount: String(data.statistic?.likes ?? 0),
    shareCount: String(data.statistic?.shares ?? 0),
    commentCount: String(data.statistic?.comments ?? 0),
    playCount: String(data.statistic?.views ?? 0),
    collectCount: String(data.statistic?.saved ?? 0),
    repostCount: '0'
  },

  authorStats: {
    followerCount: data.author?.followers ?? 0,
    followingCount: data.author?.following ?? 0,
    heart: data.author?.likes ?? 0,
    heartCount: data.author?.likes ?? 0,
    videoCount: data.author?.videos ?? 0,
    diggCount: data.author?.digg ?? 0,
    friendCount: data.author?.friendCount ?? 0
  },

  authorStatsV2: {
    followerCount: String(data.author?.followers ?? 0),
    followingCount: String(data.author?.following ?? 0),
    heart: String(data.author?.likes ?? 0),
    heartCount: String(data.author?.likes ?? 0),
    videoCount: String(data.author?.videos ?? 0),
    diggCount: String(data.author?.digg ?? 0),
    friendCount: String(data.author?.friendCount ?? 0)
  },

  video: {
    id: data.video?.id ?? null,
    width: data.video?.width ?? null,
    height: data.video?.height ?? null,
    duration: data.video?.duration ?? null,
    bitrate: data.video?.bitrate ?? null,
    format: data.video?.format ?? null,
    codecType: data.video?.codecType ?? null,
    definition: data.video?.definition ?? null,
    ratio: data.video?.ratio ?? null,
    size: data.video?.size ?? null,
    cover: data.video?.cover ?? null,
    originCover: data.video?.originCover ?? null,
    dynamicCover: data.video?.dynamicCover ?? null
  },

  music: {
    id: data.music?.id ?? null,
    title: data.music?.title ?? null,
    authorName: data.music?.author ?? null,
    playUrl: data.music?.playUrl ?? data.audio ?? null,
    duration: data.music?.duration ?? null,
    coverLarge: data.music?.cover ?? null,
    coverMedium: data.music?.cover ?? null,
    coverThumb: data.music?.cover ?? null,
    original: data.music?.original ?? false
  },

  musicInfo: {
    id: data.music?.id ?? null,
    title: data.music?.title ?? null,
    author: data.music?.author ?? null,
    duration: data.music?.duration ?? null,
    cover: data.music?.cover ?? null,
    original: data.music?.original ?? false
  },

  challenges: Array.isArray(data.challenges) ? data.challenges : [],
  textExtra: Array.isArray(data.textExtra) ? data.textExtra : [],
  contents: Array.isArray(data.contents) ? data.contents : [],

  photo: photos,
  photos,
  images: photos,
  image: photos[0] ?? null,

  download: {
    video: {
      nowm_hd: data.videoHD ?? data.video ?? null,
      nowm: data.video ?? data.videoHD ?? null,
      wm: data.videoWM ?? null
    },
    audio: data.audio ?? null,
    music: data.audio ?? null,
    cover: data.video?.cover ?? null,
    dynamicCover: data.video?.dynamicCover ?? null,
    originCover: data.video?.originCover ?? null
  }
}

}

/**
 * @param {string} url - URL video/foto TikTok.
 * @returns {Promise<{result: object, provider: string, raw: any}>}
 *   `result` selalu berbentuk sama seperti response Naze, termasuk:
 *   desc, author.nickname, create_time, download.video.{nowm_hd,nowm,wm}, download.audio, dst.
 */
export async function apiTiktokDownload(
  url,
  {
    withMetadata = true
  } = {}
) {
  if (!url) {
    throw new ValidationError('apiTiktokDownload: parameter "url" wajib diisi.')
  }

  const timeout = getTimeout(SERVICE_GROUP)

  const isValid = raw => {
    const d = raw?.data
    return Boolean(
      d?.video ||
      d?.videoHD ||
      d?.audio ||
      (Array.isArray(d?.photo) && d.photo.length) ||
      d?.photo
    )
  }

  const providers = [
  nazeRequest('/download/tiktok', { url }, { timeout }),

  {
    name: 'neoxr',
    timeout,
    retry: DEFAULT_RETRY,

    async run() {
      const aioProvider = neoxrRequest('/aio', { url }, { timeout })
      const infoProvider = neoxrRequest('/tiktok', { url }, { timeout })

      const aio = await aioProvider.run()

        let info = null
        
        if (withMetadata) {
          await new Promise(r => setTimeout(r, 300))
          info = await infoProvider.run().catch(() => null)
        }

      const result = normalizeNeoxr(aio?.data)
      const meta = info?.data

      if (meta && result) {
        result.desc =
          meta.caption ??
          meta.desc ??
          result.desc
        result.id =
          meta.id ??
          result.id
        result.author = {
          ...result.author,
          
          id:
            meta.author?.id ??
            result.author?.id,
            
          secUid:
            meta.author?.secUid ??
            result.author?.secUid,
        
          nickname:
            meta.author?.nickname ??
            result.author?.nickname,
        
          uniqueId:
            meta.author?.uniqueId ??
            result.author?.uniqueId,
        
          avatarThumb:
            meta.author?.avatarThumb ??
            result.author?.avatarThumb,
        
          avatarMedium:
            meta.author?.avatarMedium ??
            result.author?.avatarMedium,
        
          avatarLarger:
            meta.author?.avatarLarger ??
            result.author?.avatarLarger,
        
          signature:
            meta.author?.signature ??
            result.author?.signature,
        
          verified:
            meta.author?.verified ??
            result.author?.verified
        }
        
        result.video = {
          ...result.video,
        
          id: meta.video?.id ?? result.video?.id,
          width: meta.video?.width ?? result.video?.width,
          height: meta.video?.height ?? result.video?.height,
          duration: meta.video?.duration ?? result.video?.duration,
          ratio: meta.video?.ratio ?? result.video?.ratio,
          definition: meta.video?.definition ?? result.video?.definition,
          codecType: meta.video?.codecType ?? result.video?.codecType,
          format: meta.video?.format ?? result.video?.format,
          bitrate: meta.video?.bitrate ?? result.video?.bitrate,
          size: meta.video?.size ?? result.video?.size,
          cover: meta.video?.cover ?? result.video?.cover,
          dynamicCover: meta.video?.dynamicCover ?? result.video?.dynamicCover,
          originCover: meta.video?.originCover ?? result.video?.originCover
        }
        
        result.download = {
          ...result.download,
        
          cover:
            result.video?.cover ??
            result.download?.cover,
        
          dynamicCover:
            result.video?.dynamicCover ??
            result.download?.dynamicCover,
        
          originCover:
            result.video?.originCover ??
            result.download?.originCover
        }

        result.create_time =
          meta.published ??
          result.create_time
          
        result.createTime =
          meta.published ??
          result.createTime
        
        result.stats = {
          diggCount: meta.statistic?.likes ?? 0,
          shareCount: meta.statistic?.shares ?? 0,
          commentCount: meta.statistic?.comments ?? 0,
          playCount: meta.statistic?.views ?? 0,
          collectCount: meta.statistic?.saved ?? 0
        }
        
        result.statsV2 = {
          diggCount: String(meta.statistic?.likes ?? 0),
          shareCount: String(meta.statistic?.shares ?? 0),
          commentCount: String(meta.statistic?.comments ?? 0),
          playCount: String(meta.statistic?.views ?? 0),
          collectCount: String(meta.statistic?.saved ?? 0),
          repostCount: '0'
        }
        
        result.authorStats = {
          followerCount: meta.author?.followers ?? 0,
          followingCount: meta.author?.following ?? 0,
          heart: meta.author?.likes ?? 0,
          heartCount: meta.author?.likes ?? 0,
          videoCount: meta.author?.videos ?? 0,
          diggCount: meta.author?.digg ?? 0,
          friendCount: meta.author?.friendCount ?? 0
        }
        
        result.authorStatsV2 = {
          followerCount: String(meta.author?.followers ?? 0),
          followingCount: String(meta.author?.following ?? 0),
          heart: String(meta.author?.likes ?? 0),
          heartCount: String(meta.author?.likes ?? 0),
          videoCount: String(meta.author?.videos ?? 0),
          diggCount: String(meta.author?.digg ?? 0),
          friendCount: String(meta.author?.friendCount ?? 0)
        }
        
        result.music = {
          id: meta.music?.id ?? null,
          title: meta.music?.title ?? null,
          authorName: meta.music?.author ?? null,
          playUrl: meta.music?.playUrl ?? result.music?.playUrl ?? result.download?.audio ?? null,
          duration: meta.music?.duration ?? null,
          coverLarge: meta.music?.cover ?? null,
          coverMedium: meta.music?.cover ?? null,
          coverThumb: meta.music?.cover ?? null,
          original: meta.music?.original ?? false
        }
        result.musicInfo = {
          id: meta.music?.id ?? null,
          title: meta.music?.title ?? null,
          author: meta.music?.author ?? null,
          duration: meta.music?.duration ?? null,
          cover: meta.music?.cover ?? null,
          original: meta.music?.original ?? false
        }
      }

      if (!isValid({ data: result })) {
        throw new Error('NeoXR mengembalikan data kosong')
      }

      return {
        data: result
      }
    }
  }

  ]

  const { raw, providerName } = await runProviders(
    'tiktok.download',
    providers,
    {
      defaultTimeout: timeout,
      defaultRetry: DEFAULT_RETRY
    }
  )

  const result =
    providerName === 'neoxr'
      ? raw?.data
      : (raw?.result ?? raw?.data ?? null)

  return envelope(result, providerName, raw)
}