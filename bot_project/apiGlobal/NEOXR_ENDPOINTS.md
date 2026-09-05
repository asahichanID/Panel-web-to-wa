# NeoXR Endpoint Registry

> Single Source of Truth for every NeoXR endpoint used by API Global V3.

This document contains every NeoXR endpoint currently used by the project.

Claude MUST read this document before modifying:

- neoxr.provider.js
- Provider Mapping
- Services
- Response Normalization
- API Migration

Claude MUST NOT:

- Guess endpoint names.
- Guess parameters.
- Guess response structures.
- Guess HTTP methods.
- Guess download fields.
- Guess upload fields.

If an endpoint is documented here, this document becomes the highest reference.

API UTAMA https://api.neoxr.eu/api
---

# Endpoint Categories

AI
## AI

> AI-related endpoints.

## apiAiChat4

Primary
- /gemini-chat
jika bisa upgrade juga agar ai Gemini ini menyerupai oguri cap, dan ada tombol on off, nah pas di aktifkan bisa chat sesuka hati asal pesan ai nya di reply agar dijawab, dan ga spam karena walaupun ga di reply itu tidak boleh di jawab (untuk fallback sementara bisa di hilangkan, atau pakai // sementara)

Fallback
- /ai/chat4

---

## apiAiQuick

Primary
- /gpt4

Fallback
- /ai/gemini-flash-lite

---

## apiAiPremiumChat
- /claude
- /gpt-completion
contoh message, bisa di modif agar user cuma ngomong tanpa susah-susah seperti ini
[{"content":"hai","role":"user"},{"content":"Hi, can I assist you today?","role":"assistant"},{"content":"apa itu kucing","role":"user"}]
response gpt-completion
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "history": [
      {
        "content": "hai",
        "role": "user"
      },
      {
        "content": "Hi, can I assist you today?",
        "role": "assistant"
      },
      {
        "content": "apa itu kucing",
        "role": "user"
      },
      {
        "role": "assistant",
        "content": "Kucing (Felis catus) adalah sebuah spesies mamalia kecil yang termasuk dalam keluarga Felidae. Kucing adalah hewan domestik yang populer di seluruh dunia dan telah menjadi teman terdekat manusia selama ribuan tahun.\n\nKucing memiliki beberapa karakteristik unik, seperti:\n\n * Tubuh kecil dan ramping\n * Kaki dan leher panjang\n * Bulu lembut dan berwarna-warni\n * Matanya besar dan tajam\n * Telinga besar dan agak panjang\n * Suara yang unik, seperti meow atau riuk\n\nKucing adalah hewan yang pintar dan dapat beradaptasi dengan lingkungan sekitar. Mereka dapat hidup sendiri atau bersama dengan manusia dan memiliki peran penting dalam menjaga kebersihan rumah.\n\nApakah Anda memiliki kucing sebagai teman?"
      }
    ],
    "message": "Kucing (Felis catus) adalah sebuah spesies mamalia kecil yang termasuk dalam keluarga Felidae. Kucing adalah hewan domestik yang populer di seluruh dunia dan telah menjadi teman terdekat manusia selama ribuan tahun.\n\nKucing memiliki beberapa karakteristik unik, seperti:\n\n * Tubuh kecil dan ramping\n * Kaki dan leher panjang\n * Bulu lembut dan berwarna-warni\n * Matanya besar dan tajam\n * Telinga besar dan agak panjang\n * Suara yang unik, seperti meow atau riuk\n\nKucing adalah hewan yang pintar dan dapat beradaptasi dengan lingkungan sekitar. Mereka dapat hidup sendiri atau bersama dengan manusia dan memiliki peran penting dalam menjaga kebersihan rumah.\n\nApakah Anda memiliki kucing sebagai teman?"
  }
}

Fallback
- /chat/completions

---

## apiOguriChat

ini sebenarnya file gagal, jadi abaikan saja
Primary
- (NeoXR belum ditentukan)

Fallback
- /ai/chat
- /ai/message
- /ai/llama
---


## Downloader

> Download-related endpoints.

YOUTUBE AUDIO/MP3
/youtube
memakai type dan quality (untuk audio, type audio, quality 128kb)
response audio:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "id": "fKRtnMYMW08",
  "title": "KOMANG - RAIM LAODE LYRIC OFFICIAL",
  "thumbnail": "https://i.ytimg.com/vi/fKRtnMYMW08/hqdefault.jpg",
  "duration": "239 (3:59)",
  "fduration": "3:59",
  "channel": "Raim Laode",
  "views": "219.774.380",
  "publish": "2023-2-21 (3 years ago)",
  "data": {
    "filename": "KOMANG - RAIM LAODE LYRIC OFFICIAL.mp3",
    "quality": "128kbps",
    "size": "4 MB",
    "extension": "mp3",
    "url": "https://cdn.wapify.workers.dev/dl?token=NGUxYzQ3Njc2NThmZWM0MDlkODdkYmVlOTU4M2Y3OTY6ODZjNDFlNzkzNjliM2VhOTRiMDQyNTQ3YzUxNDA4OWQ0YzVhNDBhMzQ4ZjhlNDU4ODY2YjU0NDcxNWZmZjE0YzRhYWYwMDE3ZjJmMDJkNzhjNWZmYjhmNDY2ODIwNTAyZmM3NWZjMzZhMmExODYwYzk4N2ZjMGVjM2VkYzFmMjI4ZGRkMGI4NTRjNzhhYTBmZDQ5NTAyYzRkM2Q3ZmI4ZjE3ZTBjOTVjNWFiYmMyN2EyMjQ0ZDRlNDAyYTAxNThjOGY1YmIzOTA5NmM2ZjJiMDMxNmM4MTlmYmNiZTczZTc5ZWVhMDFmOTVkMmY3NDMwNzc1ODczMDdkZmY0OTU1NTljOTIzMzg5MzhkMDlkMDVhZTk3MWU2YzdjYmRlZmRiMjQwNmNhNjRmYTlmNTNjM2QxYjk4NjJjZjg0NTEwZTM1MWU1ZjFlYjQ0ZTYxZWNiYTYxOGQyNmIwZjZiMWEwZmUzYzNhZTA5MGI1MzY3NDQ1YTMzYjc5NjUxYTFhYmM5NWQ4NWYxYzg2NzZiOTY5ZWIzYjlhYTE4YzcwNTIyMWE3ZGM4YmJiOTZhNjNmYTdjMjg2MDlkOTFlNmUxZTE1NTExNTgyZjRjOWRhOTMyZmQ1ODc1MzczZTY4MDQ4ZTA5OGEyNjU3NzZlYWNkY2YzYzE1N2ZlOWY3MWE0MmI2NmZkMWYwNWE4ZjYyODhhYThmMjQ2MTY1ZWM0NzJlNmE2N2NkNjkxODc2ODNlN2I2MDcxNzhlNGVmYjQzZTk1ZDFkMzZlZjJiMzY3YTEzZThlZTYyMmJlMjNiMzQyMDQ1MjAyYjkxNTVkMjFkZWViZWU4YjNjM2FkNGQ1ZTBjNjJlNQ=="
  }
}

------

YOUTUBE VIDEO/MP4
/youtube (sama seperti mp3, bedanya memakai type video, quality format atau contoh 720p)
response YouTube video:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "id": "WZMYd0DSF6I",
  "title": "kata kata juggler memang kece",
  "thumbnail": "https://i.ytimg.com/vi/WZMYd0DSF6I/hqdefault.jpg",
  "duration": "13 (0:13)",
  "fduration": "0:13",
  "channel": "irfan",
  "views": "251",
  "publish": "2023-6-15 (3 years ago)",
  "data": {
    "filename": "kata kata juggler memang kece.mp4",
    "quality": "360p",
    "size": "653.2 KB",
    "extension": "mp4",
    "url": "https://secure-signed.pages.dev/5YjyR4j5/QmWP42ic"
  }
}

api play (ngambil ke youtube.js)

------

TIKTOK
/tiktok 
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "id": "7480894024082050309",
    "caption": "lagi cos test mai 😗  #maishiranui #cosplay",
    "author": {
      "id": "6820340003454649346",
      "shortId": "",
      "uniqueId": "nikenandalusia",
      "nickname": "Niken ♡",
      "avatarLarger": "https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/5cb6b168f54e1cfb1290549f2852786e~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=7589326e&x-expires=1783558800&x-signature=S3S8gBHMy5esbr5TigAfbsa98xQ%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my3",
      "avatarMedium": "https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/5cb6b168f54e1cfb1290549f2852786e~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=40906a42&x-expires=1783558800&x-signature=cr4kN6TqLofD2suvvsFXhMU9%2B48%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my3",
      "avatarThumb": "https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/5cb6b168f54e1cfb1290549f2852786e~tplv-tiktokx-cropcenter:100:100.jpeg?dr=14579&refresh_token=7b4b1093&x-expires=1783558800&x-signature=MdVhWJLS%2FSt14%2FCmdZTBgAEQNE4%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my3",
      "signature": "20 | REAL ACC CUMA INI & @niken kedua ❗️\n📩  endorsement : 087873015290 (admin)\ninstagram : @nikenandalusi ⤵️",
      "createTime": 1587984420,
      "verified": false,
      "secUid": "MS4wLjABAAAATd2eBcGzoJplVlz5CeqsDZLhip7-pohXsKXuDl9jjYhCNeeIDjt6u0yMFl0GwE6A",
      "ftc": false,
      "relation": 0,
      "openFavorite": false,
      "commentSetting": 0,
      "duetSetting": 1,
      "stitchSetting": 1,
      "privateAccount": false,
      "secret": false,
      "isADVirtual": false,
      "roomId": "",
      "uniqueIdModifyTime": 0,
      "ttSeller": false,
      "downloadSetting": 3,
      "recommendReason": "",
      "nowInvitationCardUrl": "",
      "nickNameModifyTime": 0,
      "isEmbedBanned": false,
      "canExpPlaylist": false,
      "suggestAccountBind": false,
      "UserStoryStatus": 0,
      "shortDramaCreator": {}
    },
    "statistic": {
      "likes": 28500,
      "comments": 143,
      "shares": 3809,
      "views": 606400,
      "saved": "11584"
    },
    "music": {
      "id": "7480894019749382967",
      "cover": "https://p16-common-sign.tiktokcdn.com/tos-alisg-avt-0068/5cb6b168f54e1cfb1290549f2852786e~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=7589326e&x-expires=1783558800&x-signature=S3S8gBHMy5esbr5TigAfbsa98xQ%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my3",
      "title": "original sound - Niken ♡",
      "author": "Niken ♡",
      "duration": 21,
      "original": true,
      "copyright": true
    },
    "published": "1741781376",
    "photo": false,
    "audio": "https://snaptikpro.net/",
    "video": "https://dl.snapcdn.app/get?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJodHRwczovL3YxNm0udGlrdG9rY2RuLXVzLmNvbS83MzQwZjA5YzljMzkwMmRmMmYwZTg5NDI2NTMwNmZlNi82YTRjYTQ0OC92aWRlby90b3MvYWxpc2cvdG9zLWFsaXNnLXZlLTAwNjhjODAwLXNnL29JRUZWNVFRSjRBRlVFWGVHalJ0MTBmZ1NsRDZCQkVJUmdZbjhpLz9hPTEyMzMmYnRpPU9VQnpPVGc3UUdvNk9qWkFMM0FqTFRBellDTXhORE5nJiZidD04MjImZnQ9bkYuVGgwc3ExN1R2alNEWFlTeFIzS0xuTTZ-T0w0SFJwc256WHRHJm1pbWVfdHlwZT12aWRlb19tcDQmcmM9T2pkb1pUbzFObVZsUERnN1pqczhhVUJwTTNCa04zUTVjbmh4ZVRNek56Y3pNMEF0TG1FdUxsNHRYelV4THk4MUxUUXZZU05wWlMxek1tUmpaalZnTFMxa01UWnpjdyUzRCUzRCZ2dnBsPTEmbD0yMDI2MDcwNzAxMDEwNzE2RTUxMDY4ODA1RjI0Mzg3RDU3JmJ0YWc9ZTAwMGI4MDAwIiwiZmlsZW5hbWUiOiJTbmFwVGlrLmJpel83NDgwODk0MDI0MDgyMDUwMzA5Lm1wNCIsIm5iZiI6MTc4MzM4NjA2OCwiZXhwIjoxNzgzMzg5NjY4LCJpYXQiOjE3ODMzODYwNjh9.WJwUd7gLpvdXP4PSlMTKG0M91hDlzbKVnUx_5Nq64Zg",
    "videoWM": "https://dl.snapcdn.app/get?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJodHRwczovL3YxNi50b2tjZG4uY29tL2M1OTg5MWVjNzBjZGY1Y2RiZDlhNTA5NDU1NDhjNGIxLzY3ZDBjZTgwLzc0ODA4OTQwMjQwODIwNTAzMDlfb3JpZ2luYWwubXA0P2RsPTEiLCJmaWxlbmFtZSI6IlNuYXBUaWsuYml6Xzc0ODA4OTQwMjQwODIwNTAzMDlfaGQubXA0IiwibmJmIjoxNzgzMzg2MDY4LCJleHAiOjE3ODMzODk2NjgsImlhdCI6MTc4MzM4NjA2OH0.i_CrU-k5zhHFuKrKBAnLX93A7qBEyaTY-5ahlBOKQFE"
  }
}

-----

SPOTIFY SEARCH
/spotify-search
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": [
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b273d8c5dd9361e88a42aa9124bc",
      "title": "Raim Laode - Komang",
      "duration": "3:43",
      "popularity": "69%",
      "preview": null,
      "url": "https://open.spotify.com/track/3zltzCUqDOxeYQvx3OQiIX"
    },
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b273da95a38ba4a13aea22b5b0d5",
      "title": "Raim Laode - Komang",
      "duration": "3:43",
      "popularity": "82%",
      "preview": null,
      "url": "https://open.spotify.com/track/3blvSatB9XD5i705K4j2yP"
    },
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b2738394136fd270ccaee0a52bf2",
      "title": "Raim Laode - iqro'",
      "duration": "3:54",
      "popularity": "76%",
      "preview": null,
      "url": "https://open.spotify.com/track/2YRHj7X19faZv4WZZ3JnZq"
    },
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b2736606ce5a055e7245c6ccb0ed",
      "title": "Raim Laode - Lesung Pipi",
      "duration": "3:45",
      "popularity": "73%",
      "preview": null,
      "url": "https://open.spotify.com/track/04mOx59pM3upWDkpp9PYkb"
    },
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b2734c31c840dd48083590b0157a",
      "title": "Raim Laode - Bersenja Gurau",
      "duration": "3:14",
      "popularity": "79%",
      "preview": null,
      "url": "https://open.spotify.com/track/713QSDLoNYvs6PKBNOMi8b"
    },
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b273f3e3f888fbfcc916ecce50a9",
      "title": "Nadhif Basalamah - kota ini tak sama tanpamu",
      "duration": "4:40",
      "popularity": "88%",
      "preview": null,
      "url": "https://open.spotify.com/track/13CwOTXUgBugeBByE9oIWb"
    },
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b273da95a38ba4a13aea22b5b0d5",
      "title": "Raim Laode - Bersenja Gurau",
      "duration": "3:14",
      "popularity": "85%",
      "preview": null,
      "url": "https://open.spotify.com/track/4DrJqdZgPBHoMNVG5iOLlG"
    },
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b273c3426f7b87c7ec7940bdcaad",
      "title": "DJ Mamang - I Don't Know Why Jedag Jedug",
      "duration": "4:28",
      "popularity": "64%",
      "preview": null,
      "url": "https://open.spotify.com/track/7oGaBhN8mnNtqtHANxVKjU"
    },
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b273014f64c5b5856f62d8e1965a",
      "title": "Intan Nevita - Komang",
      "duration": "4:02",
      "popularity": "34%",
      "preview": null,
      "url": "https://open.spotify.com/track/0JoHVdq1WWRtHpjY41eVth"
    },
    {
      "thumbnail": "https://i.scdn.co/image/ab67616d0000b273cb550d9f69fc3497b3e03cf2",
      "title": "sophxay - Karena Kamu Cantik",
      "duration": "3:36",
      "popularity": "47%",
      "preview": null,
      "url": "https://open.spotify.com/track/4hffFFZIB3fUp4igpdgWxv"
    }
  ]
}

-----

SPOTIFY DOWNLOAD AUDIO NYA (yang di atas khusus nyari lagu, sementara api ini untuk download lagu nya itu sendiri memakai url dari response search nya)
/spotify
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "thumbnail": "https://i.scdn.co/image/ab67616d0000b273916264f005e3e27b19fc9b61",
    "title": "CHOP MAGIA - Super Slowed - CASAP, CHIEF DORO",
    "artist": "CASAP, CHIEF DORO",
    "duration": "01:34",
    "preview": "https://p.scdn.co/mp3-preview/8eecffb7d3f9fcabae965fac21c0483e02511ba4",
    "url": "https://rapid.dlapi.app/download/tracks/5053815?api=12&expires=1783429564&format=mp3&name=Q0hPUCBNQUdJQSAtIFN1cGVyIFNsb3dlZC5tcDM%3D&signature=3a2cec2a9e7ebff92d3d5bdb154c8b4ab32bc75b7e301a4ecbf5bf2da01c024b"
  }
}

------

INSTAGRAM MP4
/ig
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": [
    {
      "type": "mp4",
      "url": "https://dl.snapcdn.app/download?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJodHRwczovL3Njb250ZW50LmNkbmluc3RhZ3JhbS5jb20vbzEvdi90MTYvZjIvbTg0L0FRTXFyQmtEUXBWNXBRWFVmOVJBWmV4OU1kSmlBSWRMNkJkQURhVzVueGN2bllWcHE1dTZQZnk4MUtuWE1YUnUwS1BGd2FhNzBOT1Q3Q0I4NGxOZnliWWx5VThTNHNZcTJlVTV1WEkubXA0P19uY19jYXQ9MTAxJl9uY19zaWQ9NWU5ODUxJl9uY19odD1zY29udGVudC14eGMxLTEuY2RuaW5zdGFncmFtLmNvbSZfbmNfb2hjPXRyN3ZCR1FPQkM4UTdrTnZ3SFlHVXg0JmVmZz1leUoyWlc1amIyUmxYM1JoWnlJNkluaHdkbDl3Y205bmNtVnpjMmwyWlM1SlRsTlVRVWRTUVUwdVJrVkZSQzVETXk0M01qQXVaR0Z6YUY5aVlYTmxiR2x1WlY4eFgzWXhJaXdpZUhCMlgyRnpjMlYwWDJsa0lqbzROVGd6T0RNeU5UVTVNalkxTVRRc0ltRnpjMlYwWDJGblpWOWtZWGx6SWpveE9UYzVMQ0oyYVY5MWMyVmpZWE5sWDJsa0lqb3hNREUwTml3aVpIVnlZWFJwYjI1ZmN5STZNemdzSW5WeWJHZGxibDl6YjNWeVkyVWlPaUozZDNjaWZRJTNEJTNEJmNjYj0xNy0xJnZzPWJmMTgwNDNkNDRjMmRmZmImX25jX3ZzPUhCa3NGUUlZVEdsblgySmhZMnRtYVd4c1gzUnBiV1ZzYVc1bFgzWnZaQzh4TURRM1JVSkRRVGs1T0RRM1JUazVOakJFTkVReFF6QTJSVU5FTWpCQ09WOTJhV1JsYjE5a1lYTm9hVzVwZEM1dGNEUVZBQUxJQVJJQUZRSVlPbkJoYzNOMGFISnZkV2RvWDJWMlpYSnpkRzl5WlM5SFR6UnlibmhqVUhsTmVsSlFSVWxEUVVKMFUza3RPWEpyYmxwb1luQnJkMEZCUVVZVkFnTElBUklBS0FBWUFCc0NpQWQxYzJWZmIybHNBVEVTY0hKdlozSmxjM05wZG1WZmNtVmphWEJsQVRFVkFBQW01TnZuMEwyc2hnTVZBaWdDUXpNc0YwQkRkMnlMUTVXQkdCSmtZWE5vWDJKaGMyVnNhVzVsWHpGZmRqRVJBSFhxQjJYRW5nRUEmX25jX2dpZD1RSFBPV19sUlNYU1YxWW9EMHdSUEJ3Jl9uY19zcz03YTIyZSZfbmNfenQ9Mjgmb2g9MDBfQVFBb0FHOTU0RVIzV3lpS2ZERC1QVnVRbkFVaWFoblp5NFVaTEZ2b1lxN1ZudyZvZT02QTRFMzZDRiIsImZpbGVuYW1lIjoiU2F2ZVZpZC5OZXRfQVFNcXJCa0RRcFY1cFFYVWY5UkFaZXg5TWRKaUFJZEw2QmRBRGFXNW54Y3ZuWVZwcTV1NlBmeTgxS25YTVhSdTBLUEZ3YWE3ME5PVDdDQjg0bE5meWJZbHlVOFM0c1lxMmVVNXVYSS5tcDQiLCJuYmYiOjE3ODMzODY0NzQsImV4cCI6MTc4MzM5MDA3NCwiaWF0IjoxNzgzMzg2NDc0fQ.oQEgphDkdOxSQh4uKg749MXOrfJGt6S2LK0VOf1pDWo"
    }
  ]
}

-------

FACEBOOK MP4
/fb
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": [
    {
      "quality": "SD",
      "url": "https://dl.snapcdn.app/download?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJodHRwczovL3ZpZGVvLmZoYW41LTguZm5hLmZiY2RuLm5ldC9vMS92L3QyL2YyL200MTIvQVFOOUswTUdnOEZNY0ZReS1iNmxCcTVPOGV5Qlp5UFM3clRFcEZ6RER2RFc2cTBIZ1pjdUViNVZpOEdkNXRKcDNjQlZQQllYSXFYVGRXX2JKVEc0aThlNS5tcDQ_X25jX2NhdD0xMDgmX25jX29jPUFkcWFXQkI2VEJaVzRQbTdhU2ZjVG0xYmZONHNmRkQ1ZGxPaVZlcWQ3WnRiRTh5RkIxSXhBZVZSNC04V1QyUVRiQ1UmX25jX3NpZD04YmY4ZmUmX25jX2h0PXZpZGVvLmZoYW41LTguZm5hLmZiY2RuLm5ldCZfbmNfb2hjPVhhZmctZ2JyYk80UTdrTnZ3RmdPX1lUJmVmZz1leUoyWlc1amIyUmxYM1JoWnlJNkluaHdkbDl3Y205bmNtVnpjMmwyWlM1R1FVTkZRazlQU3k0dVF6TXVNell3TG5OMlpWOXpaQ0lzSW5od2RsOWhjM05sZEY5cFpDSTZNVEEwTURnNU5EWXdORFk0TVRrNE15d2lZWE56WlhSZllXZGxYMlJoZVhNaU9qTTVPU3dpZG1sZmRYTmxZMkZ6WlY5cFpDSTZNVEF4TWpBc0ltUjFjbUYwYVc5dVgzTWlPalF5TENKMWNteG5aVzVmYzI5MWNtTmxJam9pZDNkM0luMCUzRCZjY2I9MTctMSZfbmNfZ2lkPXhSWVFzNHd3T2NZaVRuazc0c09yRlEmZWRtPUFHbzJMLUlFQUFBQSZfbmNfbWFwPXVybGdlbl9idWNrZXRsZXNzJl9uY196dD0yOCZvaD0wMF9BUUI2cEkya3VZZkJnM1Z5TktMZ1lpWHYwU2JaZ21qTHNlZW1nU3dWbDJLT0NnJm9lPTZBNTIyMzU5JmJpdHJhdGU9NDE0NDA1JnRhZz1zdmVfc2QmZGw9MSIsImZpbGVuYW1lIjoiRkJEb3dubG9hZGVyLnRvX0FRTjlLME1HZzhGTWNGUXktYjZsQnE1TzhleUJaeVBTN3JURXBGekREdkRXNnEwSGdaY3VFYjVWaThHZDV0SnAzY0JWUEJZWElxWFRkV19iSlRHNGk4ZTVfMzYwcF8oU0QpLm1wNCIsIm5iZiI6MTc4MzM4NjU2MCwiZXhwIjoxNzgzMzkwMTYwLCJpYXQiOjE3ODMzODY1NjB9.niVHniXzd2Ghqx0RAXmNQwPq4r5tKHjB9VWBgO22aGU",
      "response": 200
    },
    {
      "quality": "HD",
      "url": "https://dl.snapcdn.app/download?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJodHRwczovL3ZpZGVvLmZoYW41LTEuZm5hLmZiY2RuLm5ldC9vMS92L3QyL2YyL20yNjYvQVFNTVJaaTk4LUVnZzRjaWVNS0kyb3BfT0xUQkdCX2dOVVYwaEl4LTFmTXV5bk1qV0NxU0xnei1rMjBDaDVqOW5XbkVCbHpTUlhETWJhbEpXWXhTNldJNXp0SUJjNHVKd1NRLm1wND9zdHJleHQ9MSZfbmNfY2F0PTEwNCZfbmNfb2M9QWRwSW5fRmtBRTN0LXJTWmoweGdzUU1oWjV2R19ONGQ4ekJ4ellXdVB0bDB3cEhyZ1pCYkJ5NmJOVWNibWxIREpMOCZfbmNfc2lkPThiZjhmZSZfbmNfaHQ9dmlkZW8uZmhhbjUtMS5mbmEuZmJjZG4ubmV0Jl9uY19vaGM9WUlwcEFHQnFxTkFRN2tOdndIeF80TjQmZWZnPWV5SjJaVzVqYjJSbFgzUmhaeUk2SW5od2RsOXdjbTluY21WemMybDJaUzVHUVVORlFrOVBTeTR1UXpNdU1UQTRNQzVqYjIxd2NtVnpjMlZrWDNOdmRYSmpaU0lzSW5od2RsOWhjM05sZEY5cFpDSTZNVEEwTURnNU5EWXdORFk0TVRrNE15d2lZWE56WlhSZllXZGxYMlJoZVhNaU9qTTVPU3dpZG1sZmRYTmxZMkZ6WlY5cFpDSTZNVEF4TWpBc0ltUjFjbUYwYVc5dVgzTWlPalF5TENKMWNteG5aVzVmYzI5MWNtTmxJam9pZDNkM0luMCUzRCZjY2I9MTctMSZfbmNfZ2lkPXhSWVFzNHd3T2NZaVRuazc0c09yRlEmZWRtPUFHbzJMLUlFQUFBQSZfbmNfbWFwPXVybGdlbl9idWNrZXRsZXNzJl9uY196dD0yOCZvaD0wMF9BUUNRV25yRXh2dlJ4ZDZsN2toci02RDdvUEdKQ18yZ2x1TGgzZE1FcklueTlRJm9lPTZBNEUzRDY2JmJpdHJhdGU9MzEyNDk2NiZ0YWc9Y29tcHJlc3NlZF9zb3VyY2UmZGw9MSIsImZpbGVuYW1lIjoiRkJEb3dubG9hZGVyLnRvX0FRTU1SWmk5OC1FZ2c0Y2llTUtJMm9wX09MVEJHQl9nTlVWMGhJeC0xZk11eW5NaldDcVNMZ3otazIwQ2g1ajluV25FQmx6U1JYRE1iYWxKV1l4UzZXSTV6dElCYzR1SndTUV83MjBwXyhIRCkubXA0IiwibmJmIjoxNzgzMzg2NTYwLCJleHAiOjE3ODMzOTAxNjAsImlhdCI6MTc4MzM4NjU2MH0.gxiWp33j6d0RMeQj9CGCfSjzSiH3qL59YqbIw7UF7Ek",
      "response": 200
    }
  ]
}

------

MEDIAFIRE
/mediafire
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "title": "GBWA_MiNi_v2.0_SamMods.apk",
    "size": "34.7MB",
    "bytes": 36385587,
    "mime": "application/vnd.android.package-archive",
    "extension": ".apk",
    "url": "https://cdn.wapify.workers.dev/dl?token=YTgzMzQ2MTI3NjJhZWY0NDYyMzExNGVkZDk4MDI2YjQ6MjNkYTQ0MGZjYTU3ZDZmMGRkYWM0MDE1ZDU3N2Q0MGU1ZTVmMWI1YWRlNDA5ODNkNWQ0YjI5N2U5NzU1NGRjZWQ2YjY0ZjJhYzFiZmI5NzkxNGZhYWZhODI4MmRkMzA3YzMxMzU4NDk1MjFjMmU0MzNhZWQ2YzFkODZmOGM2ZTdjNzQ4ZDdhNmQyNTAyODIxNmQwZmQ0OWRjNmI3MTBmMzE3ZjEyODZiMjdhNGVkOTM1M2E4NGFiZDUxYWVhMmFjNmQ2OTIzODVkMjZlZWQwOGFjYTExNmMzM2U5ZDJlNDA3ZmZiNWQ0MmFmYzI1OTUzZDA4ZjQ4NThlY2NkYjQ3OGVmYjRiYzRmZTBmYTJlZmU0Mzk4N2E2YjE4MjlmYzRiM2FmMTIxYWY2YzhkZGVmM2EwOWJjODQ0NDUwMDI5YmQ5NjAxNDRiNWNlNzc5OGE1NGI2OGZiYjFhZWY0Yzc2YTZhYzQyZjllNmUwYmMxNWNkMzc5MDE0ZDM2M2M1NTBjNGE4YWJiZjBhZjcwYTUwNDIwMDg3YzA0MTJlM2I1MGMyMDQxMDI4NGMyZTg3ZjM0MmZmNGEyMWYwM2NlZDdlMmE1YzkxZjAyODRjNDA5NzM2ZDA5MzIwMDMxY2RkODI3M2MwZjU0OWE2MzU5NjRjNjhiYWJjMmU3NDIzYzA4NGVlMjVhYzg3MmM2NmUzNjkxZTgwNTA5NjJlMWU1NzM3ZjNmYmY4ODU1MzMwYzU3ZjdjNjkyODVhZTk0NzcwNTlmOGRkNGZlMDc0ODQ4NTUwMjA1NmEwZmQ2YjI2Y2IxYWYzYzEyNzcxNGYxZWYyNTg2MTBiMDBhMjQxM2FiMWVlOWZmMTA4NzQ4YzdmMDg1ZGFlODlmZjU1M2E3NTU5MWJiZDQyYWZjNjg2NjVkMGM5MTAyN2E4ZjYxY2VjMzE1ZmY4NmNhYjZkMGMxZDQ2ODk3NjRhZTcxMmE3ZDlkZjNmMmJiZWQxNTAwZjM5YWVjZTIxNzQwZWRlMGFiNjUxZjZkZjVlYWVhNDI2YmNhMzA3OTliOTc4ZWY5ZDcxYWVmYzU4ZmE0OWU5NTQ2YTc3ZDVjMDUxMzBkZjQ5NjgxZTQ2MWI4ZDA4MjdkNDFkOGY0YWEzNjQ1YWUyYjM2Njg0MmQ5ZDg4Y2VmNGNiMTQwNjU4MjEyNDI0Y2U3NzQ0Mzc4ZGIyOWZmZGY1Nzk5YWIwOGNhMTI3NDJmMTBiYjhhMjMzMTU1NmVkZWE0MWI5NDE4ZGRmNTFjNTE5YmFiMTRkODI4MGRmYzAzY2ZiN2I4ZmRjZDI5N2EzMWFmY2IyMjI2Y2Y0MWRhMjM1NGJhODJlMGYwNjY1ODMwODE5YWEzMDQxZmYxOTUwYmFmZTdmNzM1NDRlMjM2OTlhZWJiMGEzMTFmYzU0NzRhMjBlZTRkMGVjYTk0YTMzNTliN2E5MDEyMDAwZjhjMGU2YWFhNWYyMWVkNjE4YzYxZDA3ODkwMjBhZTMxZmU2YmNiN2RkMTljMGU1YmEyZjMxY2NiNjdjMWZkODM0YTVkZGZkMWU2ZDY4N2VjOTEyZDU0NWM1MmUzNDAzYTc1OTVlYTI0ZmJhYjBmYWVjNjkxOTljYTc3ZjcyYjFiYTMwNzRjM2U0Y2Q2NGRjMWJmYTFkZjM1MTkxODk1YWUyMjUxMzc1NWZiMjA2NjA5YzFhYWU3NTkzYTQxZTBhM2Q3OTRhNDUxMTljN2UwMWJlNDlkMGI1ZjRlMTY4MTk3ZDNmNjJiNWIxZGUyMTZjYWM3NWQyZWU4MGNkMGU2YjM2MGY2ODI5ZDA2Nzc5OThkZDE5NjA3ZjljMDQxZGY0Mzk1ZjJjN2NhZWEyMGZkZWY4ZDlkNjkzMWE0NWFlZWVmNTcyYWQ0NWE5MGViYTc5MTJhYWM0YmVkYzY3ZjVjNDk4MTM3ZDFmY2I4MTZjMDM1MjZmNjZkZjExZDhmZTc5NmY4OWY0ZWVkNzRiMWE4MzRmMTU5N2NkZTIwYmM2ZmU0Y2MzOWZkMzVkZjZiNDdmMDIzZjMyODUwMTVmMzMyN2Y2ZmY1MGVjYzdjMTg2ZWQwODBmN2E2NGUyNGY1MWM4NWNhZjhmOGZhNzg1YjQ5OTNlZTU5Y2VmMTljZjZmZTFkMDk5NDFkNzU2ZDMyNTRiNTM3N2YxZjQwYjQ0YmMwOTE3NTcxODI5MzRiNTg0NDM3YjBkZjc3NWNmNTlhNTc3MmNiNGQzYjA5NDE4MmNjMTY4YjU4NWNmYmVmYmU2YjBiNWYyY2E1MTM5ZWExN2RhNDViZTMxNWU3MGI1ZGQ0MDc1Njc2ZmY2MzA4MjgwMWRlY2I3OWFkOGZhZjQzZTc1YmI3ODIzYzM5NzE0ODdmNDE5NjQyNzBmOGNiNWQyMjc5MzAyY2U5ZDkxMzc3NDgzNzdkNWJiMWVjOGI0M2U5ZjljOGJmZDYyOTVjM2RmZTgzZmZkM2EzOGM4NTMxNmZiYjY1OTI0MjA5ZTFjMDBhMmU0OWUxMzljMDM1ZjFlOGMxMjc4OGVmZTQwMzAxYzA0NmI1MTQ3YTE1ZDk2NmFkNDBiOTI5MDNlYTM4Y2M2ZjJhYzE2NjUwOGUxMDAxNjVjN2Y1OGJmYTA1NTgxMDUwZmI2YTg4ODg4ZDRlMzRjN2VjMTViMDQyNjcyMTg5MDMwMmJhZDhkYTFjNGJjMDkwODg2NzM4OTg4MmZjMGJiYmU5Yzk0YTZiNmFhMDJkNTE4MDQ4ZDJjMzc5ZmQ0MDBkOTRjYjBkYmI3MTUwYzRhMzM0YTgxMjJmYjkyOWY4MjFmMDU4MzhiYTgzZmUwYmRkZDE3MDRlMDI3MzM4MTk4MzAyNDE5YTE1NDdiZDlmMGUwOWQ1OWY1YzVmNTBiMWRhMjUzMzA3MmUyMmM2NTk4YjVhMmE4Y2VhMjAwNmNiNGJlM2EyZTdlYmI3MzJjMzU4MjFiMjUzM2IzYTY0NjVkZGFkZWZkYWM2NGQ5MjYwYjBhMjkwYWFjNzJiNDE1YWFmZjZmMzFhNjNlNmMyNjUxMjk3YzM5M2Q1MDQwMjIxNTg4OWU3MjZkNTQxNTFhOGMxOTFhZTgwN2UxMzNmOGE3YmIxZmVlYTY0ZTk1YzJmMzY5NWE1NjAwNGI3MTQ1NGIzYTQyMzc0NjEyYjAzYjlkNzhlZWVlMzMzZjNkNGU1Y2FmNDc2YzhlZmZkNGExMmI2NWU5Yzc2ZDI1YzYzOWEwYzA0YmQ2MTYzNzE5MmUwY2UzMmQ0ODY5ZDg2Y2E0NWI0OGQ2YzcwYjMzY2ViZmRmZWU3ZGIzMDEwOTM0MzJhZGI1NTBiMjRjN2FmNTdkOTgy"
  }
}
---

## Creator
nama doang creator, tapi dipakai untuk public, bukan khusus
> Image & Sticker generation endpoints.

IQC (iphone)
/iqc
memakai text, time, dan chat_time 
_
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "id": "BQACAgUAAxkDAAJT-WpMVyZ8RUvhdPvOMTyTypizeGQcAAKlHAACBw1pVvunp3vOxeT2PAQ",
    "filename": "2CnECX3oNynk.png",
    "original_name": "1783387941731.png",
    "bytes": 618655,
    "size": "604.16 KB",
    "mime": "image/png",
    "extension": "png",
    "url": "https://zlyvo.pages.dev/file/BQACAgUAAxkDAAJT-WpMVyZ8RUvhdPvOMTyTypizeGQcAAKlHAACBw1pVvunp3vOxeT2PAQ"
  }
}

-----

BRAT
/brat
text
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "id": "BQACAgUAAxkDAAJT_GpMV5HHNa3ueR7Ic61KZqhHUI9lAAKoHAACBw1pVnhNnyDqp2QwPAQ",
    "filename": "HTtQya0btAGg.png",
    "original_name": "bK9IIQaWxy.png",
    "bytes": 100013,
    "size": "97.67 KB",
    "mime": "image/png",
    "extension": "png",
    "url": "https://zlyvo.pages.dev/file/BQACAgUAAxkDAAJT_GpMV5HHNa3ueR7Ic61KZqhHUI9lAAKoHAACBw1pVnhNnyDqp2QwPAQ"
  }
}

-----

BARVID/BRAT VIDEO
/bratvid
text
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "id": "CgACAgUAAxkDAAJT_WpMV9WIlBXeMAdgOeXYJ1eyTzmXAAKpHAACBw1pVi3tvzVUrONmPAQ",
    "filename": "snvSGPUChFR0.mp4",
    "original_name": "lgZ7gN0Rkr.mp4",
    "bytes": 21294,
    "size": "20.79 KB",
    "mime": "video/mp4",
    "extension": "mp4",
    "url": "https://zlyvo.pages.dev/file/CgACAgUAAxkDAAJT_WpMV9WIlBXeMAdgOeXYJ1eyTzmXAAKpHAACBw1pVi3tvzVUrONmPAQ"
  }
}

-----

NULIS
/nulis
text
ini sudah support gambar langsung, jadi sudah disediakan oleh api itu sendiri tanpa perlu membuat folder tempat gambar buku, tinggal dikirim hasil dari api nya
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "id": "BQACAgUAAxkDAAJUBGpMWCRdK7cP9NX9Yp5mVTVALdHpAAKwHAACBw1pVnW8tlptDec_PAQ",
    "filename": "LiEsEPdPjdEl.png",
    "original_name": "j2ZN4IITmw.png",
    "bytes": 1107303,
    "size": "1.06 MB",
    "mime": "image/png",
    "extension": "png",
    "url": "https://zlyvo.pages.dev/file/BQACAgUAAxkDAAJUBGpMWCRdK7cP9NX9Yp5mVTVALdHpAAKwHAACBw1pVnW8tlptDec_PAQ"
  }
}

untuk maker.js cukup begini aja, sisanya yang belum itu tidak terpakai 
---

---

## Anime

> Anime-related endpoints.


Anime (query)
/anime
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": [
    {
      "title": "Jujutsu Kaisen Season 2",
      "score": "N/A",
      "type": "TVCompleted",
      "url": "https://www.animebatch.id/jujutsu-kaisen-season-2-sub-indo/"
    },
    {
      "title": "Jujutsu Kaisen 0 Movie",
      "score": "8.51",
      "type": "MovieCompleted",
      "url": "https://www.animebatch.id/jujutsu-kaisen-0-movie/"
    },
    {
      "title": "Jujutsu Kaisen (TV)",
      "score": "",
      "type": "TVCompleted",
      "url": "https://www.animebatch.id/jujutsu-kaisen-subtitle-indonesia/"
    }
  ]
}

-----

Waifu (random, jadi hanya command waifu tanpa query)
/waifu
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "url": "https://i.pinimg.com/originals/1b/88/73/1b8873eb9da1174d70eb26ea005bad65.png"
  }
}


---

## Search

> Search endpoints.

Pinterest (search
/pinterest-v2
memakai query tentunya, show untuk menampilkan jumlah foto, 10 aja untuk show, dan type tentunya image
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": [
    {
      "title": "-",
      "description": "-",
      "author": {
        "node_id": "VXNlcjo4NDQ2MzEwODg2MjA4NTM=",
        "image_large_url": "https://i.pinimg.com/140x140_RS/dd/f7/d1/ddf7d1401ca4b1d611c96dce4def6553.jpg",
        "image_medium_url": "https://i.pinimg.com/75x75_RS/dd/f7/d1/ddf7d1401ca4b1d611c96dce4def6553.jpg",
        "id": "844631088620853",
        "verified_identity": {},
        "full_name": "Ohayoua",
        "follower_count": 4294,
        "is_verified_merchant": false,
        "image_small_url": "https://i.pinimg.com/30x30_RS/dd/f7/d1/ddf7d1401ca4b1d611c96dce4def6553.jpg",
        "is_ads_only_profile": false,
        "username": "rorenbuch"
      },
      "is_video": false,
      "content": [
        {
          "width": 1195,
          "height": 1593,
          "url": "https://i.pinimg.com/originals/76/38/e5/7638e5c18003359d9bca389f91accc08.jpg"
        }
      ],
      "source": "https://pinterest.com/pin/844493676834234"
    },
    {
      "title": "-",
      "description": "-",
      "author": {
        "node_id": "VXNlcjoyMjU4ODU3MzAzOTUxODQ3Nw==",
        "image_large_url": "https://i.pinimg.com/140x140_RS/75/fa/31/75fa31b585d2cdaa132e63afbaa88548.jpg",
        "image_medium_url": "https://i.pinimg.com/75x75_RS/75/fa/31/75fa31b585d2cdaa132e63afbaa88548.jpg",
        "id": "22588573039518477",
        "verified_identity": {},
        "full_name": "Amaia Geronimo",
        "follower_count": 2,
        "is_verified_merchant": false,
        "image_small_url": "https://i.pinimg.com/30x30_RS/75/fa/31/75fa31b585d2cdaa132e63afbaa88548.jpg",
        "is_ads_only_profile": false,
        "username": "Maia01311"
      },
      "is_video": false,
      "content": [
        {
          "width": 2048,
          "height": 2048,
          "url": "https://i.pinimg.com/originals/17/56/f5/1756f5f463948571e94d022212f03b6e.png"
        }
      ],
      "source": "https://pinterest.com/pin/22588435628549736"
    },
    {
      "title": "୨୧ Kɪᴛᴛᴇɴ 🌷✨",
      "description": "-",
      "author": {
        "node_id": "VXNlcjoyMDEyNTY2Njk5MzMwMjM1Mw==",
        "image_large_url": "https://i.pinimg.com/140x140_RS/c7/96/79/c796795c89a55e781ca229505bcfc985.jpg",
        "image_medium_url": "https://i.pinimg.com/75x75_RS/c7/96/79/c796795c89a55e781ca229505bcfc985.jpg",
        "id": "20125666993302353",
        "verified_identity": {},
        "full_name": "Francisthomas Josh",
        "follower_count": 0,
        "is_verified_merchant": false,
        "image_small_url": "https://i.pinimg.com/30x30_RS/c7/96/79/c796795c89a55e781ca229505bcfc985.jpg",
        "is_ads_only_profile": false,
        "username": "francisthomasj"
      },
      "is_video": false,
      "content": [
        {
          "width": 1196,
          "height": 1315,
          "url": "https://i.pinimg.com/originals/33/82/72/33827232590a7f9386f24a03c81b2b5f.png"
        }
      ],
      "source": "https://pinterest.com/pin/20125529581584581"
    },
    {
      "title": "Holaaa soy nueva en Pinterest  me llamo Brianna Melo 💞 espero receiver mucho apoyo ❤💞💞",
      "description": "nueva",
      "author": {
        "node_id": "VXNlcjoxNTYyMjA2NzM2NTkyNzQzOA==",
        "image_large_url": "https://s.pinimg.com/images/user/default_140.png",
        "image_medium_url": "https://s.pinimg.com/images/user/default_75.png",
        "id": "15622067365927438",
        "verified_identity": {},
        "full_name": "Melanie Hird",
        "follower_count": 0,
        "is_verified_merchant": false,
        "image_small_url": "https://s.pinimg.com/images/user/default_30.png",
        "is_ads_only_profile": false,
        "username": "melaniehird"
      },
      "is_video": false,
      "content": [
        {
          "width": 736,
          "height": 1083,
          "url": "https://i.pinimg.com/originals/d7/e2/c2/d7e2c2576131eda7ca73a8599f48d29a.jpg"
        }
      ],
      "source": "https://pinterest.com/pin/15621929952652092"
    },
    {
      "title": "-",
      "description": ".  . . #catmeme #cat #yellingatcatz #silly #sillycat #catsofinstagram #blackcat #catlife #foodcat #catlover #catsonly #funny #catfunnyday",
      "author": {
        "node_id": "VXNlcjozMzE0Mzg4NDY2NjE2NzA5Ng==",
        "image_large_url": "https://i.pinimg.com/140x140_RS/b6/37/64/b63764bbff1e067d1ba438268bc30b43.jpg",
        "image_medium_url": "https://i.pinimg.com/75x75_RS/b6/37/64/b63764bbff1e067d1ba438268bc30b43.jpg",
        "id": "33143884666167096",
        "verified_identity": {},
        "full_name": "jazmincrossmayer",
        "follower_count": 108,
        "is_verified_merchant": false,
        "image_small_url": "https://i.pinimg.com/30x30_RS/b6/37/64/b63764bbff1e067d1ba438268bc30b43.jpg",
        "is_ads_only_profile": false,
        "username": "jazmincrossmaye"
      },
      "is_video": false,
      "content": [
        {
          "width": 1440,
          "height": 1440,
          "url": "https://i.pinimg.com/originals/92/41/92/924192b2cdbec6802e7fe4229e2e1bd9.jpg"
        }
      ],
      "source": "https://pinterest.com/pin/33143747256265191"
    },
    {
      "title": "Main Character Energy Cat 🤳✨ | High Resolution Available",
      "description": "You can view full resolution by clicking the title or visit site. Thank you! 😼🔥",
      "author": {
        "node_id": "VXNlcjo5OTM2MDg3MjkzNzI5MjkyNQ==",
        "image_large_url": "https://i.pinimg.com/140x140_RS/d6/b0/46/d6b04652cb22f0b2883e85c68f9db0b5.jpg",
        "image_medium_url": "https://i.pinimg.com/75x75_RS/d6/b0/46/d6b04652cb22f0b2883e85c68f9db0b5.jpg",
        "id": "99360872937292925",
        "verified_identity": {},
        "full_name": "Jennifer McLaren",
        "follower_count": 841,
        "is_verified_merchant": false,
        "image_small_url": "https://i.pinimg.com/30x30_RS/d6/b0/46/d6b04652cb22f0b2883e85c68f9db0b5.jpg",
        "is_ads_only_profile": false,
        "username": "crittersitter"
      },
      "is_video": false,
      "content": [
        {
          "width": 496,
          "height": 878,
          "url": "https://i.pinimg.com/originals/2d/eb/44/2deb445a0c972e15fd95a196ca08a04b.jpg"
        }
      ],
      "source": "https://pinterest.com/pin/99360735526874253"
    },
    {
      "title": "skin details sims 4 cc",
      "description": "-",
      "author": {
        "node_id": "VXNlcjo4MDIyMDU3NDUyMTAxNDkxNA==",
        "image_large_url": "https://s.pinimg.com/images/user/default_140.png",
        "image_medium_url": "https://s.pinimg.com/images/user/default_75.png",
        "id": "80220574521014914",
        "verified_identity": {},
        "full_name": "Beckz",
        "follower_count": 64,
        "is_verified_merchant": false,
        "image_small_url": "https://s.pinimg.com/images/user/default_30.png",
        "is_ads_only_profile": false,
        "username": "rebeccakingsbur"
      },
      "is_video": false,
      "content": [
        {
          "width": 736,
          "height": 735,
          "url": "https://i.pinimg.com/originals/50/96/4d/50964dd2dde0828247aaf26f697f93aa.jpg"
        }
      ],
      "source": "https://pinterest.com/pin/80220437107700815"
    },
    {
      "title": "KITTYYYYYYYYYYYYYYYYYYYYY",
      "description": "-",
      "author": {
        "node_id": "VXNlcjoyODE0OTU1OTI1NTk2NDM3",
        "image_large_url": "https://i.pinimg.com/140x140_RS/c4/6f/a2/c46fa25904deb262fbd07aeec904e978.jpg",
        "image_medium_url": "https://i.pinimg.com/75x75_RS/c4/6f/a2/c46fa25904deb262fbd07aeec904e978.jpg",
        "id": "2814955925596437",
        "verified_identity": {},
        "full_name": "Deli",
        "follower_count": 25,
        "is_verified_merchant": false,
        "image_small_url": "https://i.pinimg.com/30x30_RS/c4/6f/a2/c46fa25904deb262fbd07aeec904e978.jpg",
        "is_ads_only_profile": false,
        "username": "Delizaaaaaaaaa"
      },
      "is_video": false,
      "content": [
        {
          "width": 500,
          "height": 500,
          "url": "https://i.pinimg.com/originals/69/d4/f5/69d4f553a801270cc080e78402855353.jpg"
        }
      ],
      "source": "https://pinterest.com/pin/2814818512881821"
    },
    {
      "title": "-",
      "description": "-",
      "author": {
        "node_id": "VXNlcjoxMTE4ODgzNjQ4MjczNTMxMA==",
        "image_large_url": "https://i.pinimg.com/140x140_RS/0e/51/80/0e5180c0c5f5ec73ca2f206f31f9febb.jpg",
        "image_medium_url": "https://i.pinimg.com/75x75_RS/0e/51/80/0e5180c0c5f5ec73ca2f206f31f9febb.jpg",
        "id": "11188836482735310",
        "verified_identity": {},
        "full_name": "Andry W Agustinus",
        "follower_count": 33,
        "is_verified_merchant": false,
        "image_small_url": "https://i.pinimg.com/30x30_RS/0e/51/80/0e5180c0c5f5ec73ca2f206f31f9febb.jpg",
        "is_ads_only_profile": false,
        "username": "andrywagustinus"
      },
      "is_video": false,
      "content": [
        {
          "width": 498,
          "height": 645,
          "url": "https://i.pinimg.com/originals/ad/ea/dc/adeadce1f3d1a343562b0309d4a50831.jpg"
        }
      ],
      "source": "https://pinterest.com/pin/11188699075625909"
    },
    {
      "title": "baba",
      "description": "dsadsadasdsa",
      "author": {
        "node_id": "VXNlcjozMDk2NDMwOTAyMjY0Njgz",
        "image_large_url": "https://s.pinimg.com/images/user/default_140.png",
        "image_medium_url": "https://s.pinimg.com/images/user/default_75.png",
        "id": "3096430902264683",
        "verified_identity": {},
        "full_name": "Julius Rutere",
        "follower_count": 0,
        "is_verified_merchant": false,
        "image_small_url": "https://s.pinimg.com/images/user/default_30.png",
        "is_ads_only_profile": false,
        "username": "jrutere"
      },
      "is_video": false,
      "content": [
        {
          "width": 474,
          "height": 466,
          "url": "https://i.pinimg.com/originals/dd/75/9b/dd759b033209e991272b486fad93dfb7.jpg"
        }
      ],
      "source": "https://pinterest.com/pin/3096293491783509"
    },
    {
      "title": "cute kitten wallpaper",
      "description": "-",
      "author": {
        "node_id": "VXNlcjozNjY2MjMyMTg3NDk5MzY0Ng==",
        "image_large_url": "https://i.pinimg.com/140x140_RS/20/80/db/2080db4de845d957321a99aff5b1ea9d.jpg",
        "image_medium_url": "https://i.pinimg.com/75x75_RS/20/80/db/2080db4de845d957321a99aff5b1ea9d.jpg",
        "id": "36662321874993646",
        "verified_identity": {},
        "full_name": "Susan McDaniel #Style",
        "follower_count": 15372,
        "is_verified_merchant": false,
        "image_small_url": "https://i.pinimg.com/30x30_RS/20/80/db/2080db4de845d957321a99aff5b1ea9d.jpg",
        "is_ads_only_profile": false,
        "username": "stylist1"
      },
      "is_video": false,
      "content": [
        {
          "width": 1079,
          "height": 1620,
          "url": "https://i.pinimg.com/originals/de/69/85/de6985789bf9e09d5d2af0833412e5ee.jpg"
        }
      ],
      "source": "https://pinterest.com/pin/36662184462774385"
    }
  ]
}
dan sudah support source asli, jadi tinggal upgrade api ke pinterest.js aja, di pemanggilan pinterest itu sudah di upgrade support source asli sudah lama

search.js itu biarkan aja, atau jika ada penyesuaian karena mungkin di upgrade lagi bisa di ubah
---

## Tools

> Utility endpoints.

REMINI
/remini
untuk hd kan gambar, sudah support memakai url, jadi bisa memakai gambar juga url
response:
{
  "creator": "@neoxr.js – Wildan Izzudin",
  "status": true,
  "data": {
    "id": "BQACAgUAAxkDAAJT82pMVeVhe-jGkLzz10GD__svFIjdAAKcHAACBw1pVueUL5dkuM16PAQ",
    "filename": "4VsLuj5UsMYs.jpg",
    "original_name": "YKPbhrpYQK.jpg",
    "bytes": 286320,
    "size": "279.61 KB",
    "mime": "image/jpeg",
    "extension": "jpg",
    "url": "https://zlyvo.pages.dev/file/BQACAgUAAxkDAAJT82pMVeVhe-jGkLzz10GD__svFIjdAAKcHAACBw1pVueUL5dkuM16PAQ"
  }
}

----

EMOJIMIX 
/emoji

untuk tools cukup begini, karena yang lainnya tidak terpakai
dan perlu di ingat, fallback yang ada jangan dihapus, cukup fix api neoxr karena sudah banyak yang error akibat pemanggilan api nya salah
---
