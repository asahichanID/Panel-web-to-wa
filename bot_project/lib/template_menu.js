import '../settings.js';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import moment from 'moment-timezone';
import { getUmaQuote } from '../musume/helperquotes.js';

const oguriMenuThumb = fs.readFileSync('./src/media/ogurimenu.jpeg');
const oguriCapAudio = fs.readFileSync('./src/media/oguricap.mp3');
const __filename = fileURLToPath(import.meta.url);

function getTopMenu(db, prefix, setv) {
  let total = Object.entries(db.hit || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.min(7, Object.keys(db.hit || {}).length))
    .filter(([command]) => command !== 'totalcmd' && command !== 'todaycmd')
    .slice(0, 5);

  let text = `╭──❍「 *TOP MENU* 」❍\n`;

  if (total.length >= 5) {
    total.forEach(([command, hit]) => {
      text += `│${setv} ${prefix}${command}: ${hit} hits\n`;
    });
    text += '╰──────❍';
  } else {
    text += `│${setv} ${prefix}ai
│${setv} ${prefix}brat
│${setv} ${prefix}tiktok
│${setv} ${prefix}cekmati
│${setv} ${prefix}susunkata
╰──────❍`;
  }

  return text;
}

function getMenuRows(prefix) {
  return [
    {
      header: '📚',
      title: 'All Menu',
      description: 'Semua fitur bot',
      id: `${prefix}allmenu`
    },
    {
      header: '🤖',
      title: 'Bot Menu',
      description: 'Informasi & utilitas bot',
      id: `${prefix}botmenu`
    },
    {
      header: '👥',
      title: 'Group Menu',
      description: 'Administrasi grup',
      id: `${prefix}groupmenu`
    },
    {
      header: '🔎',
      title: 'Search Menu',
      description: 'Pencarian internet',
      id: `${prefix}searchmenu`
    },
    {
      header: '⬇️',
      title: 'Download Menu',
      description: 'YT, TikTok, IG, dll',
      id: `${prefix}downloadmenu`
    },
    {
      header: '💬',
      title: 'Quotes Menu',
      description: 'Kumpulan quotes',
      id: `${prefix}quotesmenu`
    },
    {
      header: '🛠️',
      title: 'Tools Menu',
      description: 'Alat & utilitas',
      id: `${prefix}toolsmenu`
    },
    {
      header: '🧠',
      title: 'AI Menu',
      description: 'Gemini, Claude, Grok',
      id: `${prefix}aimenu`
    },
    {
      header: '🕵️',
      title: 'Stalker Menu',
      description: 'Fitur pengecekan',
      id: `${prefix}stalkermenu`
    },
    {
      header: '🎁',
      title: 'Random Menu',
      description: 'Fitur acak',
      id: `${prefix}randommenu`
    },
    {
      header: '🌸',
      title: 'Anime Menu',
      description: 'Fitur anime',
      id: `${prefix}animemenu`
    },
    {
      header: '🎮',
      title: 'Game Menu',
      description: 'Game & hiburan',
      id: `${prefix}gamemenu`
    },
    {
      header: '😂',
      title: 'Fun Menu',
      description: 'Fitur seru',
      id: `${prefix}funmenu`
    },
    {
      header: '🏆',
      title: 'Tracen Menu',
      description: 'Fitur Uma Musume',
      id: `${prefix}tracenmenu`
    },
    {
      header: '👑',
      title: 'Owner Menu',
      description: 'Khusus owner',
      id: `${prefix}ownermenu`
    }
  ];
}

function getNativeMenuButton(prefix) {
  return {
    buttonId: 'tracen_menu',
    buttonText: {
      displayText: '🌸 Pilih Menu'
    },
    nativeFlowInfo: {
      name: 'single_select',
      paramsJson: JSON.stringify({
        title: '🌸 Tracen Navigation',
        sections: [
          {
            title: '📋 Daftar Menu',
            rows: getMenuRows(prefix)
          }
        ]
      })
    },
    type: 2
  };
}

async function setTemplateMenu(
  naze,
  type,
  m,
  prefix,
  setv,
  db,
  options = {}
) {
  const uma = getUmaQuote();
  const text = getTopMenu(db, prefix, setv);

  const senderNumber = m.sender.split('@')[0];
  const ownerNumber = String(owner?.[0] || '').replace(/[^0-9]/g, '');

  const menunya = `
╭──「 *TRAINER STATUS* 」
├ 👤 *Nama* : ${m.pushName || 'Tanpa Nama'}
├ 🆔 *Id* : @${senderNumber}
├ ⭐ *Status* : ${options.isVip ? 'VIP' : options.isPremium ? 'PREMIUM' : 'FREE'}
├ 🎫 *Limit* : ${options.isVip ? 'VIP' : db.users?.[m.sender]?.limit ?? 0}
├ 💎 *Carats* : ${db.users?.[m.sender]?.money?.toLocaleString('id-ID') || '0'}
╰─┬────────❍
╭─┴─「 *OGURI SYSTEM* 」
├ 🏇 *Nama Bot* : ${db?.set?.[options.botNumber]?.botname || 'Oguri Cap'}
├ 📱 *Powered* : @0
├ 🎓 *Trainer* : @${ownerNumber}
├ 🌙 *Mode* : ${naze.public ? 'Public' : 'Self'}
├ ⌨️ *Prefix* : ${db?.set?.[options.botNumber]?.multiprefix
  ? '「 MULTI-PREFIX 」'
  : '*' + prefix + '*'}
╰─┬────────❍
╭─┴─📒「 *UMA TALK* 」📒
💬 ${uma.name}
"${uma.quote}"
╰──────────❍
`;

  // ==========================================
  // .menu
  // MENU BIASA
  // ==========================================
  if (type === 'menu') {
    await naze.sendMessage(
      m.chat,
      {
        image: oguriMenuThumb,
        caption:
          `🌸 Halo @${senderNumber}\n\n` +
          menunya +
          '\n' +
          text,
        mentions: [
          m.sender,
          '0@s.whatsapp.net',
          `${ownerNumber}@s.whatsapp.net`
        ]
      },
      { quoted: m }
    );
    
    await new Promise(resolve => setTimeout(resolve, 1200));

    await naze.sendMessage(
      m.chat,
      {
        audio: oguriCapAudio,
        mimetype: 'audio/mpeg'
      },
      { quoted: m }
    );


    return;
  }

  // ==========================================
  // .menubutton
  // MENU DENGAN BUTTON
  // ==========================================
  if (type === 'menubutton') {
    // Kirim thumbnail sebagai image biasa
    await naze.sendMessage(
      m.chat,
      {
        image: oguriMenuThumb,
        caption:
          `🌸 Halo @${senderNumber}\n\n` +
          menunya +
          '\n' +
          text,
        mentions: [
          m.sender,
          '0@s.whatsapp.net',
          `${ownerNumber}@s.whatsapp.net`
        ]
      },
      { quoted: m }
    );

    // Kirim tombol secara terpisah
    await naze.sendButtonMsg(
      m.chat,
      {
        text: '💡 Pilih kategori menu di bawah:',
        footer: options.ucapanWaktu || 'Tracen Navigation',
        mentions: [m.sender],
        buttons: [
          {
            buttonId: `${prefix}allmenu`,
            buttonText: {
              displayText: '📚 All Menu'
            },
            type: 1
          },
          {
            buttonId: `${prefix}sc`,
            buttonText: {
              displayText: '💻 SC'
            },
            type: 1
          },
          getNativeMenuButton(prefix)
        ]
      },
      { quoted: m }
    );

    await new Promise(resolve => setTimeout(resolve, 1200));

    await naze.sendMessage(
      m.chat,
      {
        audio: oguriCapAudio,
        mimetype: 'audio/mpeg'
      },
      { quoted: m }
    );

    return;
  }

  // ==========================================
  // BACKWARD COMPATIBILITY
  // ==========================================
  if (
    type === 1 ||
    type === 'buttonMessage' ||
    type === 2 ||
    type === 'listMessage'
  ) {
    await naze.sendButtonMsg(
      m.chat,
      {
        text:
          `🌸 Halo @${senderNumber}\n\n` +
          text +
          '\n\n💡 Pilih kategori menu:',
        footer: options.ucapanWaktu || 'Tracen Navigation',
        mentions: [m.sender],
        buttons: [
          {
            buttonId: `${prefix}allmenu`,
            buttonText: {
              displayText: '📚 All Menu'
            },
            type: 1
          },
          {
            buttonId: `${prefix}sc`,
            buttonText: {
              displayText: '💻 SC'
            },
            type: 1
          },
          getNativeMenuButton(prefix)
        ]
      },
      { quoted: m }
    );

    return;
  }

  // ==========================================
  // FALLBACK
  // ==========================================
  m.reply(
    `${options.ucapanWaktu || ''} @${senderNumber}\n` +
    `Silahkan gunakan ${prefix}menu atau ${prefix}menubutton`
  );
}

export default setTemplateMenu;

fs.watchFile(__filename, async () => {
  fs.unwatchFile(__filename);
  console.log(chalk.yellowBright(`[UPDATE] ${__filename}`));
  await import(`${import.meta.url}?update=${Date.now()}`);
});