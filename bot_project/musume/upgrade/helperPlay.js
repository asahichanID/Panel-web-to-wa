import axios from 'axios'
import { Buffer } from 'buffer'
import { getBuffer } from '../../lib/function.js'
import { getPlayThumb } from '../umaimage.js'

export async function getBestThumbnail(
  hasil,
  result,
  githubThumb
) {
  const urls = []

  if (hasil?.videoId) {
    urls.push(
      `https://i.ytimg.com/vi/${hasil.videoId}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${hasil.videoId}/sddefault.jpg`,
      `https://i.ytimg.com/vi/${hasil.videoId}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${hasil.videoId}/mqdefault.jpg`,
      `https://i.ytimg.com/vi/${hasil.videoId}/default.jpg`
    )
  }

  if (result?.thumbnail)
    urls.push(result.thumbnail)

  if (hasil?.thumbnail)
    urls.push(hasil.thumbnail)

  urls.push(githubThumb)

  const candidates = [...new Set(urls.filter(Boolean))]

  for (const url of candidates) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 8000,
        maxRedirects: 5,
        validateStatus: s => s >= 200 && s < 300,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      })

      const type = res.headers['content-type'] || ''

      if (!type.startsWith('image/'))
        continue

      const buffer = Buffer.from(res.data)

      if (buffer.length < 2048)
        continue

      return buffer
    } catch {}
  }

  if (githubThumb) {
    try {
      return await getBuffer(githubThumb)
    } catch {}
  }

  return null
}