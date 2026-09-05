// ============================================================
// 🛡️ ABSOLUTE GUARD V2
// ============================================================
//
// Layer perlindungan tambahan untuk command-command tertentu.
// Dipasang di atas sistem globalSpam() yang sudah ada.
//
// TIDAK mengganti dan TIDAK memodifikasi:
//   - globalSpam()
//   - cekSpam()
//   - setSpam()
//   - resetUserSpam()
//   - database
//   - inventory
//   - pity
//   - medal
//   - reward
//   - banner
//   - NPC
//   - Race
//   - Feed
//   - Training
//
// FITUR:
//   1.  User Cooldown (per-user, per-command)
//   2.  Warn Once (satu kali warning, diam setelahnya)
//   3.  Silent Spam (return tanpa reply/reaction setelah warn)
//   4.  Busy Lock (lock per-kategori)
//   5.  Global Queue (antrian per-kategori)
//   6.  Queue Berdasarkan Kategori (banner / profile / collection)
//   7.  Auto Unlock via try/finally
//   8.  Timeout Unlock (safeguard crash)
//   9.  Cleanup otomatis (memory tidak membesar)
//   10. Promise Safe (async/await, tanpa race condition)
//   11. Double Process Protection
//
// KATEGORI YANG DIDUKUNG:
//   banner     → pull, multi, lpull, lmulti  (60 detik)
//   profile    → myuma, selectuma, umachar    (3 detik)
//   collection → collection, koleksi          (3 detik)
//
// ============================================================

'use strict'

// ============================================================
// ⚙️ KONFIGURASI COOLDOWN
// ============================================================

export const GUARD_CONFIG = {
  banner: {
    cooldown: 80000,   // 80 detik
    lockTimeout: 90000 // 90 detik safeguard timeout lock
  },
  profile: {
    cooldown: 3000,    // 3 detik
    lockTimeout: 15000 // 15 detik safeguard timeout lock
  },
  collection: {
    cooldown: 3000,    // 3 detik
    lockTimeout: 15000 // 15 detik safeguard timeout lock
  }
}

// TTL cleanup data yang sudah kadaluwarsa (ms)
const CD_TTL    = 5 * 60 * 1000   // 5 menit
const CLEAN_INT = 2 * 60 * 1000   // cleanup setiap 2 menit

// ============================================================
// 📦 STORE (in-memory, hanya data sementara)
// ============================================================

// cooldownStore[`sender:cmd`] = timestamp mulai cooldown
const cooldownStore = new Map()

// warnStore[`sender:cmd`] = true jika sudah pernah warn
const warnStore = new Map()

// busyLock[`category:sender`] = timestamp lock dimulai
const busyLock = new Map()

// queueMap[`category`] = Array of { resolve, reject, timestamp }
const queueMap = new Map()

// ============================================================
// 🧰 INTERNAL UTILITIES
// ============================================================

const cdKey   = (sender, cmd)      => `${sender}:${cmd}`
const lockKey = (category, sender) => `${category}:${sender}`

const nowMs = () => Date.now()

// Format sisa detik untuk pesan
const formatSisa = (ms) => {
  const s = Math.ceil(ms / 1000)
  if (s >= 60) {
    const m = Math.floor(s / 60)
    const r = s % 60
    return r > 0 ? `${m} menit ${r} detik` : `${m} menit`
  }
  return `${s} detik`
}

// Inisialisasi queue untuk kategori jika belum ada
const ensureQueue = (category) => {
  if (!queueMap.has(category)) queueMap.set(category, [])
}

// ============================================================
// ⏳ 1. USER COOLDOWN
//     Cek apakah user sedang dalam masa cooldown command ini.
//     Mengembalikan { ok, sisa, alreadyWarned }
// ============================================================

const checkUserCooldown = (sender, cmd, category) => {
  const key   = cdKey(sender, cmd)
  const cfg   = GUARD_CONFIG[category]
  if (!cfg) return { ok: true, sisa: 0, alreadyWarned: false }

  const last  = cooldownStore.get(key) ?? 0
  const sisa  = cfg.cooldown - (nowMs() - last)

  if (sisa > 0) {
    const warned = warnStore.get(key) ?? false
    return { ok: false, sisa, alreadyWarned: warned }
  }

  // Cooldown selesai — reset warn
  warnStore.delete(key)
  return { ok: true, sisa: 0, alreadyWarned: false }
}

// Tandai cooldown dimulai
const startUserCooldown = (sender, cmd) => {
  const key = cdKey(sender, cmd)
  cooldownStore.set(key, nowMs())
  warnStore.delete(key)
}

// Tandai bahwa warn sudah dikirim (warn-once)
const markWarned = (sender, cmd) => {
  warnStore.set(cdKey(sender, cmd), true)
}

// ============================================================
// 🔒 4. BUSY LOCK (per-kategori per-user)
//     Mencegah user memproses dua command dari kategori sama
//     secara bersamaan.
// ============================================================

const acquireLock = (category, sender) => {
  const key = lockKey(category, sender)
  const cfg = GUARD_CONFIG[category]

  const existing = busyLock.get(key)
  if (existing) {
    // Cek timeout safeguard: jika lock sudah terlalu lama → paksa release
    if (cfg && nowMs() - existing > cfg.lockTimeout) {
      busyLock.delete(key)
      // tidak return false: lanjutkan acquire
    } else {
      return false // masih locked
    }
  }

  busyLock.set(key, nowMs())
  return true
}

const releaseLock = (category, sender) => {
  busyLock.delete(lockKey(category, sender))
}

const isLocked = (category, sender) => {
  const key = lockKey(category, sender)
  const cfg = GUARD_CONFIG[category]
  const ts  = busyLock.get(key)
  if (!ts) return false
  // Auto-expire safeguard
  if (cfg && nowMs() - ts > cfg.lockTimeout) {
    busyLock.delete(key)
    return false
  }
  return true
}

// ============================================================
// 5-6. GLOBAL QUEUE (per-kategori)
//      Antrian per-kategori. Jika ada proses aktif pada kategori
//      yang sama, request berikutnya menunggu giliran.
//
//      Implementasi: satu "slot" aktif per kategori.
//      Slot ditandai dengan entry pertama di queue.
// ============================================================

// activeSlot[category] = true jika sedang ada proses
const activeSlot = new Map()

// Masukkan ke queue kategori, tunggu giliran
// Mengembalikan Promise yang resolve saat giliran tiba
const enqueue = (category) => {
  ensureQueue(category)

  return new Promise((resolve, reject) => {
    const queue = queueMap.get(category)
    queue.push({ resolve, reject, ts: nowMs() })
    tryNext(category)
  })
}

// Coba jalankan antrian berikutnya
const tryNext = (category) => {
  if (activeSlot.get(category)) return

  const queue = queueMap.get(category)
  if (!queue?.length) return

  const next = queue.shift()
  if (!next) return

  activeSlot.set(category, true)
  next.resolve()
}

// Lepaskan slot dan coba jalankan antrian berikutnya
const dequeue = (category) => {
  activeSlot.set(category, false)
  tryNext(category)
}

// ============================================================
// 🧵 GENERIC PER-USER COMMAND QUEUE (audit — dipakai SELURUH command)
// ============================================================
//
// Dipakai sebagai satu-satunya "pintu masuk" untuk SEMUA command
// (.play, .tiktok, .ai, .menu, .download, dll), bukan cuma
// banner/profile/collection. Menggunakan primitive queue yang
// SAMA (enqueue/dequeue di atas) — tidak membuat sistem queue baru.
//
// Sifat:
//   - Kunci per (chat + sender): command dari user & chat yang sama
//     TIDAK PERNAH berjalan bersamaan (anti race condition / spam).
//   - User/chat lain SAMA SEKALI TIDAK terpengaruh -> tidak ada
//     bottleneck global, bot tetap responsif untuk banyak user.
//   - Auto release via try/finally di sisi caller.
//   - Safeguard timeout: kalau caller lupa release (mis. crash di
//     luar try/finally), slot otomatis dilepas supaya antrian
//     TIDAK PERNAH menggantung selamanya.
//
// Cara pakai (dipasang satu kali di titik masuk pesan, contoh di
// src/message.js sebelum memanggil command handler):
//
//   const slot = await acquireCommandSlot(m.sender, m.chat)
//   try {
//     await jalankanCommand()
//   } finally {
//     slot.release()
//   }

// FIX (audit stress-test): 30 detik terlalu pendek untuk command berat
// (.play / .tiktok / .ai / download video besar bisa >30 detik wajar).
// Kalau safeguard menembak duluan, slot dilepas PADAHAL command asli masih
// jalan -> command KEDUA dari user yang sama bisa mulai berbarengan dengan
// yang pertama (race condition balik lagi, persis yang mau dicegah Target 2).
// Dinaikkan jadi 5 menit: cukup besar untuk command wajar apa pun, tapi
// tetap ada agar antrian tidak menggantung SELAMANYA kalau caller lupa
// release() (mis. crash di luar try/finally).
const CMD_QUEUE_SAFEGUARD_MS = 5 * 60 * 1000 // auto-release safeguard (anti deadlock/menggantung)

export const acquireCommandSlot = async (sender, chat) => {
  const key = `cmdq:${chat}:${sender}`
  await enqueue(key)

  let released = false
  const release = () => {
    if (released) return // anti double-release
    released = true
    clearTimeout(safeguard)
    dequeue(key)
  }

  // Safeguard: cegah antrian menggantung selamanya kalau caller lupa release
  const safeguard = setTimeout(release, CMD_QUEUE_SAFEGUARD_MS)

  return { release }
}

// ============================================================
// 🛡️ ABSOLUTE GUARD — FUNGSI UTAMA
// ============================================================
//
// Cara pakai di dalam command:
//
//   const guard = await absoluteGuard(m.sender, 'pull', 'banner', m)
//   if (!guard.ok) return
//   try {
//     // ... logic command ...
//   } finally {
//     guard.release()
//   }
//
// Parameter:
//   sender   : string  — m.sender (ID pengguna)
//   cmd      : string  — nama command (pull / multi / myuma / dll)
//   category : string  — 'banner' | 'profile' | 'collection'
//   m        : object  — object pesan (dipakai untuk m.reply)
//
// Return:
//   { ok: false }                — jika ditolak (user tidak perlu tahu alasan lebih lanjut)
//   { ok: true, release: fn }   — jika diizinkan; WAJIB panggil release() di finally

export const absoluteGuard = async (sender, cmd, category, m) => {
  // ── 1. User Cooldown ──────────────────────────────────────
  const cd = checkUserCooldown(sender, cmd, category)

  if (!cd.ok) {
    // ── 2 & 3. Warn Once / Silent Spam ───────────────────────
    if (!cd.alreadyWarned) {
      markWarned(sender, cmd)
      await m.reply(`⏳ Mohon tunggu ${formatSisa(cd.sisa)}.`)
    }
    // Silent: tidak ada reply, tidak ada log ekstra
    return { ok: false }
  }

  // ── 4. Busy Lock ─────────────────────────────────────────
  if (isLocked(category, sender)) {
    // Sudah ada proses aktif untuk user + kategori ini
    // Tidak perlu reply karena user sudah tahu (dari lock sebelumnya)
    return { ok: false }
  }

  // ── 5 & 6. Masuk Queue Kategori ──────────────────────────
  await enqueue(category)

  // ── Acquire Lock ─────────────────────────────────────────
  if (!acquireLock(category, sender)) {
    // Gagal acquire lock setelah keluar queue (race condition safeguard)
    dequeue(category)
    return { ok: false }
  }

  // ── Tandai Cooldown Dimulai ───────────────────────────────
  // (dilakukan setelah semua validasi pass, sebelum eksekusi)
  startUserCooldown(sender, cmd)

  // ── Release function (dipanggil di finally oleh caller) ──
  const release = () => {
    // 7. Auto Unlock via try/finally di sisi caller
    releaseLock(category, sender)
    dequeue(category)
  }

  return { ok: true, release }
}

// ============================================================
// 🔧 HELPER UNTUK COMMAND — Optional sugar
// ============================================================
//
// Untuk command yang HANYA butuh cooldown tanpa queue/lock
// (profil sederhana, collection sederhana):
//
//   const cd = checkGuardCooldown(m.sender, 'myuma', 'profile', m)
//   if (!cd.ok) return

export const checkGuardCooldown = async (sender, cmd, category, m) => {
  const cd = checkUserCooldown(sender, cmd, category)
  if (!cd.ok) {
    if (!cd.alreadyWarned) {
      markWarned(sender, cmd)
      await m.reply(`⏳ Mohon tunggu ${formatSisa(cd.sisa)}.`)
    }
    return { ok: false }
  }
  startUserCooldown(sender, cmd)
  return { ok: true }
}

// ============================================================
// 🧹 9 & 8. CLEANUP OTOMATIS + TIMEOUT UNLOCK
// ============================================================

const runCleanup = () => {
  const now    = nowMs()
  let cleaned  = 0

  // Bersihkan cooldown yang sudah jauh kadaluwarsa
  for (const [key, ts] of cooldownStore.entries()) {
    const category = key.split(':').pop() in GUARD_CONFIG
      ? key.split(':').pop()
      : null

    // Hitung TTL berdasarkan kategori jika bisa diekstrak,
    // atau gunakan CD_TTL default
    let ttl = CD_TTL
    for (const [cat, cfg] of Object.entries(GUARD_CONFIG)) {
      if (key.includes(`:${cat}`)) { ttl = cfg.cooldown + CD_TTL; break }
    }

    if (now - ts > ttl) {
      cooldownStore.delete(key)
      warnStore.delete(key)
      cleaned++
    }
  }

  // Bersihkan warn yang orphan (tidak ada pasangan cooldown)
  for (const key of warnStore.keys()) {
    if (!cooldownStore.has(key)) {
      warnStore.delete(key)
      cleaned++
    }
  }

  // Bersihkan busyLock yang timeout (safeguard crash bot)
  for (const [key, ts] of busyLock.entries()) {
    const category = key.split(':')[0]
    const cfg = GUARD_CONFIG[category]
    const timeout = cfg ? cfg.lockTimeout : 90000
    if (now - ts > timeout) {
      busyLock.delete(key)
      cleaned++
    }
  }

  // Bersihkan queue entry yang sudah terlalu lama menunggu (> 2 menit)
  for (const [cat, queue] of queueMap.entries()) {
    const before = queue.length
    const fresh  = queue.filter(entry => now - entry.ts < 120000)
    // Reject entry yang timeout
    queue.slice(fresh.length).forEach(entry => {
      try { entry.reject(new Error('Queue timeout')) } catch {}
    })
    queueMap.set(cat, fresh)
    cleaned += before - fresh.length
  }

  if (cleaned > 0) {
    console.log(`🛡️ [ABSOLUTE GUARD] Cleanup: ${cleaned} item dibersihkan`)
  }
}

// Jalankan cleanup berkala
let _cleanTimer = null

const startCleanup = () => {
  if (_cleanTimer) return
  _cleanTimer = setInterval(runCleanup, CLEAN_INT)
  console.log('🛡️ [ABSOLUTE GUARD] Auto cleanup aktif (interval 2 menit)')
}

// Start otomatis saat modul di-import
startCleanup()

// ============================================================
// 🔎 STATUS (untuk debugging owner)
// ============================================================

export const getGuardStatus = () => ({
  cooldownCount : cooldownStore.size,
  warnCount     : warnStore.size,
  lockCount     : busyLock.size,
  queueSizes    : Object.fromEntries(
    [...queueMap.entries()].map(([k, v]) => [k, v.length])
  ),
  activeSlots   : Object.fromEntries(
    [...activeSlot.entries()]
  )
})

export const buildGuardStatusText = () => {
  const s = getGuardStatus()
  return [
    '🛡️ 𝗔𝗕𝗦𝗢𝗟𝗨𝗧𝗘 𝗚𝗨𝗔𝗥𝗗 𝗩𝟮',
    '',
    `⏳ Cooldown aktif : ${s.cooldownCount}`,
    `⚠️  Warn aktif     : ${s.warnCount}`,
    `🔒 Lock aktif      : ${s.lockCount}`,
    `📋 Queue banner    : ${s.queueSizes.banner ?? 0}`,
    `📋 Queue profile   : ${s.queueSizes.profile ?? 0}`,
    `📋 Queue collection: ${s.queueSizes.collection ?? 0}`,
    `▶️  Slot banner     : ${s.activeSlots.banner ? '🔴 Sibuk' : '🟢 Bebas'}`,
    `▶️  Slot profile    : ${s.activeSlots.profile ? '🔴 Sibuk' : '🟢 Bebas'}`,
    `▶️  Slot collection : ${s.activeSlots.collection ? '🔴 Sibuk' : '🟢 Bebas'}`
  ].join('\n')
}

// ============================================================
// 🚀 EXPORTS
// ============================================================
//
// absoluteGuard      — guard utama (dengan queue + lock)
// checkGuardCooldown — cooldown saja (tanpa queue)
// getGuardStatus     — status guard (debugging)
// buildGuardStatusText — teks status guard
// GUARD_CONFIG       — konfigurasi cooldown

console.log('🛡️ [ABSOLUTE GUARD V2] LOADED')
