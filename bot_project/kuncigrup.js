import {
  syncGroups,
  getUnlockedGroups,
  lockGroup,
  botLock
} from "./kunci.js"

const FOOTER = "🛡️ Oguri Cap Security System"
const cache = { lastSync: 0, ttl: 30000 }

async function ensureSync(conn) {
  const now = Date.now()
  if (!botLock.cache?.synced || now - cache.lastSync > cache.ttl) {
    try {
      await syncGroups(conn)
      botLock.cache = { ...(botLock.cache || {}), synced: true }
      cache.lastSync = now
      console.log("🔐 [KUNCI] ✅ Sinkronisasi BERHASIL")
    } catch (e) {
      console.error("🔐 [KUNCI] ❌ Gagal sinkron →", e.message)
    }
  }
}

export async function tampilkanKunciGrup(conn, m) {
  try {
    await ensureSync(conn)
    const daftar = getUnlockedGroups() || []

    const rows = daftar.length
      ? daftar.map(g => ({
          header: "🔒",
          title: `Kunci: ${(g.name || "Grup").slice(0, 18)}`,
          description: g.id,
          id: `lock_${g.id}`
        }))
      : [{
          header: "ℹ️",
          title: "✅ Semua grup sudah dikunci",
          description: "-",
          id: "none"
        }]

    // ✅ PERSIS FORMAT CONTOH KAMU PAKAI sendListMsg
    return conn.sendListMsg(m.chat, {
      text: [
        "🔒 **KUNCI GRUP**",
        "",
        `📊 Ditemukan: ${daftar.length} grup aktif`,
        "",
        "Pilih grup yang ingin dikunci dari daftar dibawah ini."
      ].join('\n'),
      footer: FOOTER,
      buttons: [{
        name: "single_select",
        buttonParamsJson: {
          title: "📋 PILIH GRUP",
          sections: [{
            title: "Daftar Grup Aktif",
            highlight_label: "AKTIF",
            rows: rows
          }]
        }
      }]
    }, { quoted: m })

    console.log("🔐 [KUNCI] ✅ Pesan TERKIRIM KE HP")

  } catch (e) {
    console.error("🔐 [KUNCI] 💥", e.stack || e)
    m.reply("❌ Gagal memuat daftar grup.")
  }
}

export async function prosesTombolKunci(conn, m) {
  try {
    const res = m?.message?.interactiveResponseMessage?.nativeFlowResponseMessage
    if (!res?.paramsJson) return false

    const { id } = JSON.parse(res.paramsJson)
    if (!id || id === "none") return true

    await ensureSync(conn)

    if (id.startsWith("lock_")) {
      const jid = id.slice(5)
      lockGroup(jid)
      const g = botLock.groups?.[jid]
      await m.reply(
`🔒 **SUKSES DIKUNCI**
━━━━━━━━━━━━━━━━
📛 Nama : ${g?.name || "Tidak diketahui"}
🆔 ID   : ${jid}
✅ Bot sekarang diam di grup ini sampai dibuka kembali.`)
      console.log(`🔒 DIKUNCI → ${g?.name || jid}`)
      return true
    }

    return false
  } catch (e) {
    console.error("🔐 [PROSES] 💥", e.stack || e)
    return false
  }
}

console.log("✅ [MODUL] Pengunci Grup Siap")
