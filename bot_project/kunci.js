// ======================================================
// GROUP LOCK MANAGER V2 (Upgraded)
// ======================================================

export const botLock = {
  aktif: false,
  groups: {},
  cache: {
    synced: false,
    lastSync: 0
  }
}

export const cekKunci = () => botLock.aktif

export const setKunci = (status = false) => {
  botLock.aktif = Boolean(status)
  return botLock.aktif
}

const ensureGroup = (id) => {
  if (!botLock.groups[id]) {
    botLock.groups[id] = {
      id,
      name: "Unknown Group",
      locked: false,
      updatedAt: Date.now()
    }
  }
  return botLock.groups[id]
}

export const registerGroup = (id, name = "Unknown Group") => {
  const group = ensureGroup(id)
  group.name = name || group.name
  group.updatedAt = Date.now()
  return group
}

export const removeGroup = (id) => {
  delete botLock.groups[id]
}

export const isLocked = (chat) => {
  return !!botLock.groups[chat]?.locked
}

export const lockGroup = (chat) => {
  const group = ensureGroup(chat)
  group.locked = true
  group.updatedAt = Date.now()
  return true
}

export const unlockGroup = (chat) => {
  const group = ensureGroup(chat)
  group.locked = false
  group.updatedAt = Date.now()
  return true
}

export const getAllGroups = () => Object.values(botLock.groups)

export const getLockedGroups = () => getAllGroups().filter(v => v.locked)

export const getUnlockedGroups = () => getAllGroups().filter(v => !v.locked)

export const syncGroups = async (conn) => {
  try {
    const groups = await conn.groupFetchAllParticipating()
    const active = new Set()

    for (const id in groups) {
      active.add(id)
      registerGroup(id, groups[id]?.subject || "Unknown Group")
    }

    for (const id of Object.keys(botLock.groups)) {
      if (!active.has(id)) removeGroup(id)
    }

    botLock.cache.synced = true
    botLock.cache.lastSync = Date.now()
    return getAllGroups()
  } catch (e) {
    console.error("[GroupLock Sync Error]", e)
    return []
  }
}