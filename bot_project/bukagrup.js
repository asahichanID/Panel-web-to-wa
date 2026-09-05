import {
  syncGroups,
  getLockedGroups,
  unlockGroup,
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
      console.log("🔓 [BUKA] ✅ Sinkronisasi BERHASIL")
    } catch (e) {
      console.error("🔓 [BUKA] ❌ Gagal sinkron →", e.message)
    }
  }
}

export async function tampilkanBukaGrup(conn, m) {
  try {
    await ensureSync(conn)
    const daftar = getLockedGroups() || []

    const rows = daftar.length
      ? daftar.map(g => ({
          header: "🔓",
          title: `Buka: ${(g.name || "Grup").slice(0, 18)}`,
          description: g.id,
          id: `unlock_${g.id}`
        }))
      : [{
          header: "ℹ️",
          title: "🔓 Tidak ada grup yang terkunci",
          description: "-",
          id: "none"
        }]

    // ✅ PERSIS FORMAT CONTOH KAMU PAKAI sendListMsg
    return conn.sendListMsg(m.chat, {
      text: [
        "🔓 **BUKA KUNCI GRUP**",
        "",
        `📊 Ditemukan: ${daftar.length} grup terkunci`,
        "",
        "Pilih grup yang ingin dibuka kuncinya dari daftar dibawah ini."
      ].join('\n'),
      footer: FOOTER,
      buttons: [{
        name: "single_select",
        buttonParamsJson: {
          title: "📋 PILIH GRUP",
          sections: [{
            title: "Daftar Grup Terkunci",
            highlight_label: "TERKUNCI",
            rows: rows
          }]
        }
      }]
    }, { quoted: m })

    console.log("🔓 [BUKA] ✅ Pesan TERKIRIM KE HP")

  } catch (e) {
    console.error("🔓 [BUKA] 💥", e.stack || e)
    m.reply("❌ Gagal memuat daftar grup.")
  }
}

export async function prosesTombolBuka(conn, m) {
  try {
    const res = m?.message?.interactiveResponseMessage?.nativeFlowResponseMessage
    if (!res?.paramsJson) return false

    const { id } = JSON.parse(res.paramsJson)
    if (!id || id === "none") return true

    await ensureSync(conn)

    if (id.startsWith("unlock_")) {
      const jid = id.slice(7)
      unlockGroup(jid)
      const g = botLock.groups?.[jid]
      await m.reply(
`🔓 **SUKSES DIBUKA**
━━━━━━━━━━━━━━━━
📛 Nama : ${g?.name || "Tidak diketahui"}
🆔 ID   : ${jid}
✅ Bot sudah aktif kembali merespon digrup ini.`)
      console.log(`🔓 DIBUKA → ${g?.name || jid}`)
      return true
    }

    return false
  } catch (e) {
    console.error("🔓 [PROSES] 💥", e.stack || e)
    return false
  }
}

console.log("✅ [MODUL] Pembuka Kunci Grup Siap")
