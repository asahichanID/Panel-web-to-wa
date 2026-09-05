import { umaQuotes } from './umaquotes.js'

const dialogCycle = true
const dialogChance = !dialogCycle

const DIALOG_CHANCE = 0.9
const DIALOG_COOLDOWN = 30000

let currentUma = -1
let lastQuote = {}

let nextDialog = null
let dialogCooldown = 0

export const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)]

export const getUmaQuote = () => {
  currentUma++
  if (currentUma >= umaQuotes.length) currentUma = 0

  const uma = umaQuotes[currentUma]
  const dialogLocked = Date.now() < dialogCooldown

  // Balasan pasangan
  if (nextDialog && uma.name === nextDialog.partner) {
    const dialog = nextDialog
    nextDialog = null
    return { name: uma.name, quote: dialog.reply }
  }

  // Dialog bergilir
  if (!dialogLocked && dialogCycle && uma.dialogs?.length) {
    const dialog = pickRandom(uma.dialogs)
    dialogCooldown = Date.now() + DIALOG_COOLDOWN
    nextDialog = { partner: dialog.partner, reply: dialog.reply }
    return { name: uma.name, quote: dialog.main }
  }

  // Dialog peluang acak
  if (!dialogLocked && !dialogCycle && dialogChance && uma.dialogs?.length && Math.random() < DIALOG_CHANCE) {
    const dialog = pickRandom(uma.dialogs)
    dialogCooldown = Date.now() + DIALOG_COOLDOWN
    nextDialog = { partner: dialog.partner, reply: dialog.reply }
    return { name: uma.name, quote: dialog.main }
  }

  // Kutipan biasa
  let availableQuotes = uma.quotes || []
  if (lastQuote[uma.name] && availableQuotes.length > 1) {
    availableQuotes = availableQuotes.filter(q => q !== lastQuote[uma.name])
  }

  const quote = availableQuotes.length ? pickRandom(availableQuotes) : '...'
  lastQuote[uma.name] = quote

  return { name: uma.name, quote }
}

console.log('📒 UMA QUOTES LOADED')
