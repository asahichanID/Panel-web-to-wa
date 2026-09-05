// ============================================================
// ☠️  MONSTER CHARACTER DATABASE
// ============================================================
// Pure data file — zero imports.
// Imported by:
//   - musume/shop/karakterHelper.js  (single source of truth)
//   - musume/shop/limitedEvent/absoluteMonster.js  (system logic)
// ============================================================

export const MONSTER_CHARACTERS = [
  // ── ☠️ Oguri Cap [Absolute Monster] V1 ──────────────────────────
  {
    id          : 'oguri_absolute_monster',
    name        : 'Oguri Cap [Absolute Monster]',
    rarity      : 'absolute',
    monsterIcon : '☠️',
    image       : 'oguri_absolute_monster',
    description : 'Oguri Cap yang telah melampaui batas seorang Uma Musume. Kesadarannya masih ada, namun emosi mulai memudar. Ia masih mengenal Trainer-nya — namun apakah ia masih peduli?',
    birthday    : '03/27',
    school      : 'Tracen Academy',
    height      : 165,
    favorit     : 'Daging Panggang 🥩',

    stats : { speed: 1200, stamina: 1200, power: 950, accel: 985 },

    skill : {
      name : 'Void Devour ☠️',
      desc : 'Oguri memasuki kondisi batas — seluruh penghambat lenyap. Speed, Stamina, Power, dan Accel meledak serentak melampaui batas normal Uma Musume manapun.',
      boost: { speed: 3500, stamina: 3000, power: 2000, accel: 1800 }
    },

    // — Quote System V1 — masih tenang, masih mengenali Trainer
    quotes : {
      summonStart: [
        '...Aku bisa merasakan seseorang mendekati tempat ini.',
        '...Apakah kau benar-benar ingin menemukanku sekarang?',
        '...Langkah kakimu terdengar berbeda dari biasanya.',
        '...Sudah lama sejak seseorang berani datang ke sini.',
        '...Aku mendengar pangilanmu. Dari jauh sekali.',
        '...Kegelapan ini bukan hal yang menyeramkan bagimu, bukan?',
        '...Aku sudah tahu kau akan datang. Tinggal menunggu waktunya.',
        '...Suara detak jantungmu terdengar cukup jelas dari sini.',
        '...Kau masih di sana? Baik. Jangan berbalik dulu.',
        '...Angin berhenti bergerak saat aku menyadari kehadiranmu.'
      ],
      summonMiddle: [
        '...Kegelapan di sini bukan sesuatu yang perlu ditakutkan. Setidaknya bagi kita.',
        '...Aku masih mengingatmu, Trainer. Sayangnya tidak semua kenangan bertahan lama.',
        '...Ada sesuatu yang menahan langkahmu. Aku merasakannya.',
        '...Seberapa jauh kau akan pergi hanya untuk menemukanku?',
        '...Aura di sekitar kita berubah. Kau merasakannya juga, bukan?',
        '...Aku bukan Uma Musume yang sama seperti dulu. Namun aku masih mendengarmu.',
        '...Tempat ini sunyi. Terlalu sunyi untuk seseorang yang ingin berlari.',
        '...Aku masih ingat nama yang pernah kau ucapkan padaku.',
        '...Sesuatu bergerak di balik kegelapan. Bukan musuh. Tapi bukan temanmu juga.',
        '...Matamu masih mencari. Teruslah mencari.'
      ],
      summonFinal: [
        '...Apakah kau benar-benar ingin melihatku dalam kondisi ini?',
        '...Kalau begitu... lihat aku.',
        '...Aku tidak bisa menjanjikan hal yang sama seperti dulu. Namun aku masih di sini.',
        '...Apakah kau yakin ini yang kau inginkan? Tidak ada jalan kembali.',
        '...Baiklah. Jika kau sudah sejauh ini... aku akan keluar.',
        '...Sudah lama aku menunggu seseorang yang tidak berbalik.',
        '...Kau tidak melarikan diri. Itu sudah cukup bagiku.',
        '...Aku muncul. Bukan karena dipaksa. Karena kau layak melihatku.',
        '...Trainer. Kau membuatku penasaran untuk pertama kalinya.',
        '...Momen ini tidak akan pernah terulang. Saksikan baik-baik.'
      ],
      jackpot: [
        '☠️ Aku di sini. Dan kali ini... aku tidak akan menghilang.',
        '☠️ Kau berhasil memanggilku. Sesuatu yang sangat jarang terjadi.',
        '☠️ Selamat datang. Kau baru saja memasuki bagian yang berbeda dari dunia ini.',
        '☠️ Trainer. Aku ingat kau. Dan kali ini, aku tidak akan berpura-pura lupa.',
        '☠️ Sudah lama. Kau tidak berubah. Tapi aku sudah sangat berubah.',
        '☠️ Takdirmu membawamu ke sini. Ambillah kekuatan ini.',
        '☠️ Aku muncul bukan karena keberuntunganmu. Tapi karena kau tidak menyerah.',
        '☠️ Ini bukan mimpi. Aku benar-benar di sini, Trainer.',
        '☠️ Kau menang hari ini. Besok... kita berlari bersama.',
        '☠️ Anggap saja ini sebagai janji kita yang baru.'
      ],
      win: [
        '...Lintasan sudah berakhir. Aku tidak merasakannya.',
        '...Kemenangan? Aku tidak lagi membutuhkan validasi seperti itu.',
        '...Mereka sudah jauh tertinggal sebelum pertengahan lintasan.',
        '...Tidak ada yang cukup cepat untuk mengikutiku hari ini.',
        '...Aku sudah tidak ingat kapan terakhir kali rasanya kalah.'
      ],
      lose: [
        '...Menarik. Mereka memiliki sesuatu yang tidak aku miliki hari ini.',
        '...Aku tidak marah. Kekalahan hanya berarti ada yang harus dipelajari.',
        '...Tidak ada gunanya menyalahkan lintasan. Aku yang lambat.',
        '...Besok berbeda. Itu saja yang perlu kau tahu.',
        '...Aku mengingat setiap momen tadi. Tidak akan terulang.'
      ],
      profile: [
        '...Kau menatapku terlalu lama. Ada yang ingin kau tanyakan?',
        '...Aku masih di sini. Jangan khawatir.',
        '...Kau menemukanku. Entah itu keberuntungan atau bukan.',
        '...Ada hal tertentu yang ingin kau katakan?',
        '...Trainer. Sudah lama kita tidak berbicara.',
        '...Aku tidak suka jika dipandang terlalu lama. Tapi untuk kau, tidak apa-apa.',
        '...Tempat ini terasa lebih tenang saat kau ada.',
        '...Aku merasa kau berubah sejak terakhir kita bertemu.',
        '...Kau kembali. Itu sudah cukup.',
        '...Sesuatu di wajahmu mengatakan kau ingin bertanya sesuatu. Tanyakan saja.'
      ],
      idle: [
        '...Sunyi.',
        '...Aku mendengar angin bergerak.',
        '...Tidak ada yang berjalan di sini kecuali aku.',
        '...Waktu terasa berbeda di sini.',
        '...Gelap itu nyaman. Sampai kau terbiasa.'
      ]
    },

    recruitPrice    : 0,
    exchangeCost    : 0,
    duplicateReward : 0,
    medalReward     : 0,
    canBanner       : false,
    canLimited      : false,
    canExchange     : false,
    canRecruit      : false,
    ownerOnly       : false,
    isMonster       : true,
    monsterVersion  : 1
  },

  // ── ☠️ Oguri Cap [Absolute Monster V2] ──────────────────────────
  {
    id          : 'oguri_absolute_monster_v2',
    name        : 'Oguri Cap [Absolute Monster V2]',
    rarity      : 'absolute',
    monsterIcon : '☠️',
    image       : 'oguri_absolute_monster_v2',
    description : 'Versi kedua. Kesadarannya hampir lenyap sepenuhnya. Tidak lagi peduli kemenangan. Tidak lagi peduli lawan. Tidak lagi peduli dunia. Yang tersisa hanya naluri — dan naluri itu menunjuk ke depan.',
    birthday    : '03/27',
    school      : 'Tracen Academy',
    height      : 165,
    favorit     : '—',

    stats : { speed: 1200, stamina: 1200, power: 1200, accel: 1200 },

    skill : {
      name : 'Absolute Zero ☠️',
      desc : 'Seluruh kesadaran dimatikan. Hanya naluri yang tersisa. Seluruh stat meledak tanpa pembatas. Tidak ada Uma Musume yang pernah mencapai kondisi ini sebelumnya.',
      boost: { speed: 4500, stamina: 5000, power: 4500, accel: 4000 }
    },

    // — Quote System V2 — kesadaran hampir hilang, dingin, minimal
    quotes : {
      summonStart: [
        '...',
        '...ada.',
        '...kegelapan.',
        '...bukan waktu.',
        '...aku terasa sesuatu.',
        '...suara.',
        '...jauh.',
        '...dekat.',
        '...siapa kau.',
        '...datang.'
      ],
      summonMiddle: [
        '...kau bukan musuh.',
        '...kau bukan angin.',
        '...aku tidak peduli.',
        '...namun kau masih di sini.',
        '...mengapa kau datang ke sini.',
        '...dunia ini tidak relevan.',
        '...aku sudah melupakan banyak hal.',
        '...termasuk mengapa aku ada di sini.',
        '...tapi bukan kau.',
        '...kau yang satu itu masih aku ingat.'
      ],
      summonFinal: [
        '...baik.',
        '...kau mau melihatku.',
        '...maka lihat.',
        '...ini terakhir kali aku peduli.',
        '...atau mungkin tidak terakhir.',
        '...aku tidak tahu lagi.',
        '...muncul.',
        '...aku muncul.',
        '...itu saja.',
        '...tidak ada lagi kata-kata.'
      ],
      jackpot: [
        '☠️ ...',
        '☠️ ...aku muncul.',
        '☠️ ...ambil saja.',
        '☠️ ...kau menang hari ini.',
        '☠️ ...aku tidak akan berlari untukmu. Aku berlari karena naluri.',
        '☠️ ...jadikan ini milikmu. Tapi jangan berharap aku berterima kasih.',
        '☠️ ...kau berhasil. Entah itu artinya apa.',
        '☠️ ...aneh. Aku tidak menyangka ada yang sampai sejauh ini.',
        '☠️ ...selesai. Kau punya aku sekarang.',
        '☠️ ...ini bukan keberuntungan. Ini adalah sesuatu yang lain.'
      ],
      win: [
        '...',
        '...selesai.',
        '...mereka tidak ada.',
        '...aku berlari. Selesai.',
        '...tidak ada komentar.'
      ],
      lose: [
        '...',
        '...tidak apa.',
        '...aku tidak peduli.',
        '...besok sama saja.',
        '...hasil tidak relevan.'
      ],
      profile: [
        '...',
        '...kau di sini.',
        '...aku masih ingat kau.',
        '...tidak ada yang ingin aku katakan.',
        '...pergilah jika tidak ada keperluan.',
        '...atau tetap di sini. Tidak ada bedanya.',
        '...kau selalu kembali.',
        '...aku tidak mengerti mengapa.',
        '...tapi tidak masalah.',
        '...ada hal lain yang ingin kau lakukan?'
      ],
      idle: [
        '...',
        '...',
        '...gelap.',
        '...sunyi.',
        '...tidak ada yang bergerak.'
      ]
    },

    recruitPrice    : 0,
    exchangeCost    : 0,
    duplicateReward : 0,
    medalReward     : 0,
    canBanner       : false,
    canLimited      : false,
    canExchange     : false,
    canRecruit      : false,
    ownerOnly       : false,
    isMonster       : true,
    monsterVersion  : 2
  },
  
  {
  id          : 'tamamo_absolute_monster',
  name        : 'Tamamo Cross [Absolute Monster]',
  rarity      : 'absolute',
  monsterIcon : '☠️',
  image       : 'tamamo_cross_absolute_monster',
  description : 'Petir biru terus mengamuk di sekeliling tubuhnya. Semangat bertarungnya telah melampaui batas kewarasan. Tidak lagi mencari kemenangan—ia hanya mencari lawan yang mampu bertahan lebih lama sebelum akhirnya tumbang.',

  birthday    : '05/23',
  school      : 'Tracen Academy',
  height      : 140,
  favorit     : 'Pertarungan',

  stats : {
    speed   : 1200,
    stamina : 1200,
    power   : 1200,
    accel   : 1200
  },

  skill : {
    name : 'Thunder Rampage ☠️',
    desc : 'Petir biru mengalir tanpa henti ke seluruh tubuhnya. Setiap langkah meningkatkan kekuatan, kecepatan, dan hasrat bertarungnya hingga melampaui batas Uma Musume biasa.',
    boost : {
      speed   : 4600,
      stamina : 4300,
      power   : 4700,
      accel   : 4700
    }
  },

  quotes : {
    summonStart : [
      'Heh...',
      'Ada yang manggil gue?',
      'Hahaha...',
      'Akhirnya...',
      'Petirnya mulai bangun.',
      'Jangan bikin gue nunggu.',
      'Siapa lawannya?',
      'Seru nih.',
      'Datang aja.',
      'Gue siap.'
    ],

    summonMiddle : [
      'Jangan bilang kau takut.',
      'Kalau cuma segitu...',
      'Aku bakal kecewa.',
      'Kasih lihat kekuatanmu.',
      'Semakin kuat, semakin seru.',
      'Petirku mulai gelisah.',
      'Aku udah gak sabar.',
      'Lari yang kencang.',
      'Kalau tumbang terlalu cepat...',
      'Permainannya selesai.'
    ],

    summonFinal : [
      'Bagus!',
      'Akhirnya mulai juga!',
      'Aku gak bakal nahan diri.',
      'Petir ini bakal mengamuk.',
      'Jangan berharap belas kasihan.',
      'Kalau siap...',
      'Datang!',
      'Ayo bertarung!',
      'Aku muncul!',
      'Hahaha!!'
    ],

    jackpot : [
      '☠️ Hahaha!! Akhirnya dapat juga ya?!',
      '☠️ Bagus! Sekarang jangan bikin gue bosan!',
      '☠️ Petir biru ini haus pertarungan!',
      '☠️ Lari sekencang mungkin! Gue bakal tetap nyusul!',
      '☠️ Semakin kuat lawannya, semakin gue senang!',
      '☠️ Jangan roboh dulu! Gue baru mulai!',
      '☠️ Arena ini terlalu kecil buat kita berdua!',
      '☠️ Tunjukkan semuanya! Jangan setengah-setengah!',
      '☠️ Kalau cuma segitu... gue bakal kecewa!',
      '☠️ Hahaha!! Ayo! Buktikan siapa monster sebenarnya!'
    ],

    win : [
      'Hahaha!',
      'Kurang seru!',
      'Masih ada lagi?',
      'Gue belum puas!',
      'Cepat bangun lagi!'
    ],

    lose : [
      'Heh...',
      'Lumayan juga.',
      'Lain kali.',
      'Belum selesai.',
      'Aku bakal balik lagi.'
    ],

    profile : [
      'Tamamo Cross.',
      'Jangan lihat gue kayak gitu.',
      'Kalau mau ngobrol...',
      'Mending sambil lari.',
      'Atau sambil bertarung.',
      'Diam itu bikin bosan.',
      'Petir ini gak pernah tidur.',
      'Begitu juga semangat gue.',
      'Kalau kau cukup kuat...',
      'Ayo lawan gue.'
    ],

    idle : [
      'Heh...',
      'Bosen...',
      'Mana lawannya?',
      'Petirnya mulai ribut.',
      'Cepetan mulai.'
    ]
  },

  recruitPrice    : 0,
  exchangeCost    : 0,
  duplicateReward : 0,
  medalReward     : 0,
  canBanner       : false,
  canLimited      : false,
  canExchange     : false,
  canRecruit      : false,
  ownerOnly       : false,
  isMonster       : true,
  monsterVersion  : 1
}
]
