// Reproduces the reported bug: editing a product name hung, glitched, and the
// typed name vanished. Types a full name one character at a time with realistic
// keystroke timing, then checks the field kept every character and the rest of
// the tool agrees with what was typed.
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.html')
const NAME = 'Traders Discovery Programme'
const fail = []
const ok = m => console.log(`  ok   ${m}`)
const bad = m => { fail.push(m); console.log(`  FAIL ${m}`) }

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } })
page.on('pageerror', e => bad(`page error: ${e.message}`))

// A config saved before shipsDay1 existed — exactly what the user's browser holds.
await page.addInitScript(() => {
  const legacy = {
    products: [
      { id: 'p1', name: 'Foundation Course', short: 'Foundation Course', priceInclGst: 5900, unitsPlanMonthly: 220, desk: 'A', regClass: 'education', countsTowardCap: false, termMonths: 0 },
      { id: 'p1b', name: 'Playbook Pack', short: 'Playbook Pack', priceInclGst: 1499, unitsPlanMonthly: 90, desk: 'A', regClass: 'education', countsTowardCap: false, termMonths: 0 },
      { id: 'p3', name: 'Research Subscription', short: 'Research Subscription', priceInclGst: 47200, unitsPlanMonthly: 12, desk: 'B', regClass: 'research', countsTowardCap: true, termMonths: 12 },
    ],
    anchorProductId: 'p9-deleted-long-ago',
  }
  localStorage.setItem('bos:config', JSON.stringify(legacy))
  localStorage.setItem('bos:view', JSON.stringify('config'))
})

await page.goto(`file://${dist}`)
await page.waitForSelector('.panel', { timeout: 20000 })
console.log('\nLegacy config repair')

// 1. shipsDay1 absent must not read as deferred.
const shipsCell = await page.locator('tr.sum td', { hasText: /^\d+ of \d+$/ }).first().innerText()
shipsCell === '3 of 3' ? ok(`ships/deferred count reads "${shipsCell}"`) : bad(`ships count reads "${shipsCell}", expected "3 of 3"`)

// 2. A dangling anchor must re-point at a real Desk A product, not vanish.
const anchorRows = await page.locator('tr', { hasText: '★ the product the funnel is solved against' }).count()
anchorRows === 1 ? ok('dangling anchor re-pointed to a live product') : bad(`${anchorRows} rows carry the anchor marker, expected 1`)

console.log('\nTyping a product name, one character at a time')
const field = page.locator('table.t tbody tr').first().locator('input.in').first()
await field.click()
await field.fill('')
const t0 = Date.now()
for (const ch of NAME) { await field.type(ch, { delay: 35 }) }
const elapsed = Date.now() - t0
const budget = NAME.length * 35 + 1500

const mid = await field.inputValue()
mid === NAME ? ok(`field holds all ${NAME.length} characters while focused`) : bad(`field holds "${mid}" — characters were dropped`)
elapsed < budget ? ok(`typing kept up (${elapsed}ms for ${NAME.length} chars, budget ${budget}ms)`) : bad(`typing lagged: ${elapsed}ms for ${NAME.length} chars, budget ${budget}ms`)

await field.blur()
await page.waitForTimeout(700)
const after = await field.inputValue()
after === NAME ? ok('name survives blur and the model recompute') : bad(`after blur the field reads "${after}"`)

console.log('\nThe typed name propagates')
await page.locator('button', { hasText: 'Quant Engine' }).first().click()
await page.waitForTimeout(400)
const body = await page.locator('body').innerText()
body.includes(NAME) ? ok('the Quant Engine ladder uses the typed name') : bad('the typed name does not appear outside Config')
const codes = /\bP1b?\b|\bP2[abc]\b|\bP4[ab]\b/.test(body)
codes ? bad('P-codes are still showing in the ladder') : ok('no P-codes left in the ladder')

console.log('\nEditing a price still recomputes')
await page.locator('button', { hasText: 'Config' }).first().click()
await page.waitForSelector('table.t')
const price = page.locator('table.t tbody tr').first().locator('input[type=number]').first()
await price.fill('7900')
await price.blur()
await page.waitForTimeout(700)
const rev = await page.locator('table.t tbody tr').first().locator('td.num strong').first().innerText()
// 7900 × 220 = ₹17,38,000, rendered compact as ₹17.4L
rev.includes('17.4L') ? ok(`revenue row recomputed to ${rev}`) : bad(`revenue row reads ${rev}, expected ₹17.4L`)

await browser.close()
console.log(fail.length === 0 ? `\nPASS — ${'all checks green'}\n` : `\nFAILED ${fail.length} check(s)\n`)
process.exit(fail.length === 0 ? 0 : 1)
