import axios from 'axios'
import { Buffer } from 'buffer'
import { pickRandom } from '../helperquotes.js'
import { getBuffer } from '../../lib/function.js'
import { cekSpam, setSpam } from '../umahelper.js'
import { getPlayThumb } from '../umaimage.js'
import { playQuote } from '../umaquotes.js'
import { convertToMp3 } from '../convertManager.js'
import { apiYoutubeAudio, apiYoutubeSearch } from '../../apiGlobal/index.js'


export const play = async (naze, m, text, prefix, command, db) => {

  if (!text)
    return m.reply(
`Contoh:
${prefix + command} bloodline`
    )

  try {
    db.game ??= {}
    db.game.play ??= {}

    const spam = cekSpam(m.sender, 'play', 30)

    if (!spam.ok) {
      if (spam.warn) {
        const detik = Math.ceil(spam.sisa / 1000)
        return m.reply(
    `🎶 𝐓𝐑𝐀𝐂𝐄𝐍 𝐀𝐔𝐃𝐈𝐎
    
    ⏳ Special Week masih mencari lagu..
    🌱 Tunggu ${detik} detik lagi ya~.`
        )
      }
      return
    }

    const musicQuote = [
          {
            name: 'Oguri Cap',
            quote: '🥕 Lagu enak ditemani makanan enak. Kombinasi sempurna!'
          },
          {
            name: 'Special Week',
            quote: '🌸 Semoga lagu ini membuat harimu lebih ceria!'
          },
          {
            name: 'Gold Ship',
            quote: '😹 Kalau lagunya aneh, berarti seleraku lagi aktif!'
          },
          {
            name: 'Mejiro McQueen',
            quote: '☕ Musik yang tenang adalah teman terbaik untuk bersantai.'
          },
          {
            name: 'Air Groove',
            quote: '🎼 Dengarkan baik-baik. Irama yang bagus bisa membangkitkan semangat.'
          },
          {
            name: 'Tokai Teio',
            quote: '✨ Yuk senyum! Lagu ini pasti bikin harimu makin seru!'
          },
          {
            name: 'Silence Suzuka',
            quote: '🍃 Musik yang mengalun bebas terasa seperti berlari di lintasan.'
          },
          {
            name: 'Rice Shower',
            quote: '🌷 Semoga lagu ini bisa membuatmu sedikit lebih bahagia...'
          },
          {
            name: 'Symboli Rudolf',
            quote: '👑 Musik yang hebat selalu meninggalkan kesan yang mendalam.'
          },
          {
            name: 'Daiwa Scarlet',
            quote: '❤️ Lagu pilihan nomor satu tentu untuk pendengar nomor satu!'
          },
          {
            name: 'Vodka',
            quote: '🔥 Naikkan volumenya! Lagu keren harus dinikmati dengan penuh semangat!'
          },
          {
            name: 'Daiwa Scarlet',
            quote: '💖 Jangan sampai kalah sama irama lagu ini ya!'
          }
        ]
    const quote = pickRandom(playQuote)
    
    const music = pickRandom(musicQuote)
    const githubThumb = getPlayThumb() ?? ''
    let hasil = null

    // ====================
    // PILIH DARI DAFTAR
    // ====================
    if (/^[1-9]$|^10$/.test(text) && db.game.play[m.sender]) {
      const list = db.game.play[m.sender]
      hasil = list[Number(text) - 1]
      if (!hasil)
        return m.reply('❌ Pilihan tidak ada')
    }

    // ====================
    // CARI LAGU
    // ====================
    if (!hasil && !text.startsWith('https://') && !text.startsWith('http://')) {
      const { result } = await apiYoutubeSearch(text)

        const videos = (result || []).slice(0, 20).map(v => ({
          title: v.title ?? '-',
          url: v.url,
          videoId: v.videoId,
          thumbnail: v.thumbnail ?? v.image,
          timestamp: v.timestamp ?? '00:00',
          ago: v.ago ?? '-',
          views: v.views ?? 0,
          author: {
            name: v.author?.name ?? '-'
          }
        }))
            
    if (!videos.length) {
      return m.reply('❌ Lagu tidak ditemukan')
    }     
    
      db.game.play[m.sender] = videos
      
      
    // Jalankan download di background
 ;(async () => {
	try {
		const laguPertama = videos[0]
		if (!laguPertama?.videoId) return

		const { result } = await apiYoutubeAudio(laguPertama.url)

		const audio = await convertToMp3(
			result.download,
			result.filename || `${result.title}.mp3`
		)

		await naze.sendMessage(
			m.chat,
			{
				audio: audio.buffer,
				mimetype: 'audio/mpeg',
				fileName: audio.filename,
				ptt: false
			},
			{ quoted: m }
		)

		console.log("✅ Background: Audio pertama berhasil dikirim")
	} catch (error) {
		console.error("❌ Background: Gagal kirim audio pertama", error)
	}
})()

      return naze.sendListMsg(m.chat, {
  title: '',

text:
`╭─❖「 𝐓𝐑𝐀𝐂𝐄𝐍 𝐌𝐔𝐒𝐈𝐂 」
│
├ 🔎 Search
│ ❍ ${text}
│
├ 🎵 Playlist
│ ❍ ${videos.length} lagu berhasil ditemukan
│
├ 🎧 AUTO PLAY
│ ❍ Audio pertama sedang dikirim...
│ ❍ Tidak perlu menunggu tombol 😹
╰─────────────❖

💬 "${quote}"`,

  footer: 'Tracen Music Stage',
  image: { url: githubThumb },
  buttons: [{
    name: 'single_select',
    buttonParamsJson: {
      title: '🎵 Daftar Lagu Tracen',
      sections: [{
        title: '🔍 Hasil Pencarian',
        rows: videos.map((v, i) => ({
          header: '🎶',
          title: `${i + 1}. ${v.title}`,
          description: `${v.author?.name || '-'} • ${v.timestamp || '00:00'}`,
          id: `.play ${i + 1}`
        }))
      }]
    }
  }]
}, { quoted: m })

    }
    
    // ====================
    // URL LANGSUNG
    // ====================
    if (!hasil && (text.startsWith('https://') || text.startsWith('http://'))) {
      const { result } = await apiYoutubeSearch(text)
        hasil = result?.[0]
    }

    if (!hasil)
      return m.reply('❌ Lagu tidak ditemukan')

    await m.react('⏳')

    // ====================
    // DOWNLOAD
    // ====================
const { result } = await apiYoutubeAudio(hasil.url)

if (!result?.download)
    return m.reply('❌ Audio tidak ditemukan')

const size = result.size || 'Tidak diketahui'
    // ====================
    // THUMBNAIL FIX
    // ====================
    let gambar
    const thumbnail = hasil.thumbnail ?? hasil.image
    
    try {
      const thumb = await axios.get(thumbnail, {
          responseType: 'arraybuffer',
          headers: {
            'user-agent': 'Mozilla/5.0'
          }
        })
      gambar = Buffer.from(thumb.data)
    } catch {
      gambar = githubThumb ? await getBuffer(githubThumb) : null
    }
    const caption =
`╭─❖「 🎧 𝐓𝐑𝐀𝐂𝐄𝐍 𝐌𝐔𝐒𝐈𝐂 𝐒𝐓𝐀𝐆𝐄 🌸 」
│
├ 🎶 Track
│ ❍ ${hasil.title}
│
├ 👒 Producer
│ ❍ ${hasil.author?.name || '-'}
│
├ 👀 Spectators
│ ❍ ${Number(hasil.views || 0).toLocaleString('id-ID')}
│
├ 📜 Released
│ ❍ ${hasil.ago || '-'}
│
├ 📂 Music Size
│ ❍ ${size}
│
├ 🔗 Youtube
│ ❍ ${hasil.url}
╰─────────────❖

💬 ${music.name}
${music.quote}`

      await naze.sendMessage(m.chat, {
          image: gambar,
          caption
     }, { quoted: m })

    // ⏳ Kasih jeda
/*
    await new Promise(
    r =>
    setTimeout(
    r,
    1500
    )
    )
    */
    const audio = await convertToMp3(
			result.download,
			result.filename || `${hasil.title}.mp3`
		)

    await naze.sendMessage(
			m.chat,
			{
				audio: audio.buffer,
				mimetype: 'audio/mpeg',
				fileName: audio.filename,
				ptt: false
			},
			{ quoted: m }
		)

    await m.react('🎧')
    setSpam(m.sender, 'play')
    
    delete db.game.play[m.sender]

  } catch (e) {
    console.log('❌ PLAY')
    console.log(e)
    await m.react('❌')
    delete db.game.play?.[m.sender]
    return m.reply('❌ Gagal mengirim audio')
  }
}

console.log('🎶 PLAY V2.2 FINAL LOADED')
