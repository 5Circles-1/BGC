// The armor test. This browser profile has held every build's storage since day
// one, and the user's real crash came from stored state no invented fixture
// predicted. So: poison every field of bos:config and bos:data in every shape a
// past build (or a stray paste) could have left, land directly on Config the way
// the user did, then click through EVERY screen. Nothing may crash, and the
// recovery card must never be needed for stored-state damage — it exists for the
// unknown, and the last case proves it works.
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'index.html')
const NAVS = [
  'The Business', 'Morning Brief', 'Departments', 'Meetings', 'Launch Readiness', 'Command Center',
  'Quant Engine', 'Revenue & P&L', 'Sales Command', 'Lead Engine', 'Marketing & Creative', 'HR & Hiring',
  'Sales Academy', 'Compliance Vault', 'Finance & Cash', 'Ops & Delivery', 'Daily Ritual', 'Agent Console',
  'Weekly Review', 'Discovery', 'Config',
]

// [label, bos:config poison, bos:data poison, screens to walk ('all' | list)]
const CASES = [
  ['config is a bare string', 'hello', undefined, 'all'],
  ['config is an array', [1, 2, 3], undefined, ['Config', 'The Business']],
  ['config is a number', 42, undefined, ['Config', 'The Business']],
  ['products is an object', { products: { p1: { name: 'x' } } }, undefined, ['Config', 'Quant Engine']],
  ['products has null/number entries', { products: [null, 42, { id: 'x', name: 'Kept' }] }, undefined, ['Config', 'Quant Engine']],
  ['products is empty', { products: [] }, undefined, ['Config', 'The Business', 'Quant Engine']],
  ['product fields are wrong types', { products: [{ id: 7, name: 9, short: null, priceInclGst: '5900', unitsPlanMonthly: {}, desk: 'C', regClass: 'bogus', termMonths: [], shipsDay1: 'yes' }] }, undefined, ['Config', 'Quant Engine']],
  ['channels is an object', { channels: { meta: {} } }, undefined, ['Config', 'Lead Engine', 'Marketing & Creative']],
  ['channels entries are null', { channels: [null, null] }, undefined, ['Config', 'Lead Engine']],
  ['spendRampMonthly is a number', { spendRampMonthly: 5 }, undefined, ['Config', 'The Business']],
  ['runRatePlanWeekly is a string', { target: { runRatePlanWeekly: '800000' } }, undefined, ['Config', 'Command Center']],
  ['runRatePlanWeekly holds junk strings', { target: { runRatePlanWeekly: ['a', 'b'] } }, undefined, ['Config', 'Command Center']],
  ['ramp is an array', { ramp: [45, 70, 100] }, undefined, ['Config', 'The Business', 'HR & Hiring']],
  ['ramp.curveByWeek is an object', { ramp: { curveByWeek: {} } }, undefined, ['Config', 'HR & Hiring']],
  ['desks.A is null', { desks: { A: null } }, undefined, ['Config', 'Sales Command']],
  ['comp is a string', { comp: 'x' }, undefined, ['Config', 'Finance & Cash']],
  ['feeCap is an array', { feeCap: [] }, undefined, ['Config', 'Compliance Vault']],
  ['entity fields are numbers', { entity: { brand: 42, sebiReg: null } }, undefined, ['Config', 'The Business']],
  ['funnel rates are strings', { funnel: { closeRate: '0.04', cplBlended: null } }, undefined, ['Config', 'Quant Engine']],
  ['anchor/bump are objects', { anchorProductId: {}, bumpProductId: [] }, undefined, ['Config', 'Quant Engine']],
  ['prep is a bare string', { prep: '2026-08-25' }, undefined, ['Config', 'The Business', 'Launch Readiness']],
  ['opex/headcount hold junk', { opex: [null, 'x'], headcountPlan: [7] }, undefined, ['Config', 'Finance & Cash', 'HR & Hiring']],
  ['data is a bare string', undefined, 'oops', 'all'],
  ['data is an array', undefined, [], ['Config', 'The Business']],
  ['feed is an empty object', undefined, { feed: {} }, ['Config']],
  ['feed fields are wrong types', undefined, { feed: { ads: {}, campaigns: [], accounts: [], pulledAt: 1, source: null } }, ['Config']],
  ['feed arrays hold nulls', undefined, { feed: { ads: [null], campaigns: [null, 3], accounts: [null], pulledAt: 'x', source: 'y', daily: [null, { spend: 1 }] } }, ['Config', 'Lead Engine', 'Morning Brief']],
  ['reps hold nulls', undefined, { reps: [null, 7] }, ['Config', 'The Business', 'Sales Command', 'Finance & Cash']],
  ['daily record holds non-objects', undefined, { daily: { '2026-08-27': null, '2026-08-28': 5 } }, ['Config', 'The Business', 'Daily Ritual', 'Revenue & P&L']],
  ['collections hold junk entries', undefined, { initiatives: [null], meetings: [4], creatives: [null], tickets: ['x'], candidates: [null] }, ['Departments', 'Meetings', 'Marketing & Creative', 'Ops & Delivery', 'HR & Hiring']],
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let failures = 0

for (const [label, cfgPoison, dataPoison, walk] of CASES) {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', e => errs.push(e.message.slice(0, 140)))
  await page.addInitScript(([c, d]) => {
    if (c !== undefined) localStorage.setItem('bos:config', JSON.stringify(c))
    if (d !== undefined) localStorage.setItem('bos:data', JSON.stringify(d))
    localStorage.setItem('bos:view', JSON.stringify('config'))   // land exactly where the user crashed
  }, [cfgPoison, dataPoison])
  await page.goto(`file://${dist}`)

  let verdict = 'ok  '
  try {
    await page.waitForSelector('.panel', { timeout: 15000 })
    const screens = walk === 'all' ? NAVS : walk
    for (const s of screens) {
      await page.locator('nav.rail button.navitem', { hasText: s }).first().click()
      await page.waitForTimeout(120)
      if (await page.locator('.panel').count() === 0) { verdict = 'FAIL'; errs.push(`${s}: no panels`) }
      if (await page.getByText('hit an error').count() > 0) { verdict = 'FAIL'; errs.push(`${s}: recovery card shown — normalize should have healed this`) }
    }
    if (errs.length) verdict = 'FAIL'
  } catch (e) { verdict = 'FAIL'; errs.push(e.message.slice(0, 140)) }
  if (verdict === 'FAIL') failures++
  console.log(`  ${verdict} ${label}${errs.length ? ` — ${errs[0]}` : ''}`)
  await ctx.close()
}

// The boundary itself: force a crash on one screen, expect the card, recover, reopen healed.
{
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } })
  const page = await ctx.newPage()
  await page.addInitScript(() => {
    localStorage.setItem('bos:__crashscreen', JSON.stringify('m6'))
    localStorage.setItem('bos:view', JSON.stringify('m20'))
  })
  await page.goto(`file://${dist}`)
  await page.waitForSelector('.panel', { timeout: 15000 })
  await page.locator('nav.rail button.navitem', { hasText: 'Marketing & Creative' }).first().click()
  const card = await page.getByText('hit an error').count()
  const named = await page.getByText('Deliberate crash-test').count()
  console.log(`  ${card && named ? 'ok  ' : 'FAIL'} forced crash shows the recovery card, names the error`)
  if (!card || !named) failures++
  await page.getByRole('button', { name: 'Open The Business' }).click()
  await page.waitForTimeout(250)
  const home = await page.getByText('hit an error').count() === 0 && await page.locator('.panel').count() > 0
  console.log(`  ${home ? 'ok  ' : 'FAIL'} “Open The Business” recovers without a reload`)
  if (!home) failures++
  const view = await page.evaluate(() => localStorage.getItem('bos:view'))
  console.log(`  ${view === '"m20"' ? 'ok  ' : 'FAIL'} saved view healed to home (reopening cannot land on the crash)`)
  if (view !== '"m20"') failures++
  await ctx.close()
}

await browser.close()
console.log(failures === 0 ? `\nPASS — ${CASES.length} poisoned-storage cases + boundary drill all green\n` : `\nFAILED ${failures} case(s)\n`)
process.exit(failures === 0 ? 0 : 1)
