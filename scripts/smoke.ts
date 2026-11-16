/**
 * 冒烟测试：无浏览器跑通「创建角色 → 逐月行动 → 结算 → 事件 → 结局」全流程。
 * 运行： npx esbuild scripts/smoke.ts --bundle --platform=node --format=esm --outfile=.tmp/smoke.mjs && node .tmp/smoke.mjs
 */
import { ACTIONS, createGame, doAction, resolveEvent, endingSummary, netWorth, bizAction, openBiz } from '../src/game/engine'
import { BIZ_TYPES, bizType } from '../src/game/content'

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('❌ FAIL:', msg)
    process.exitCode = 1
    throw new Error(msg)
  }
}

function runOne(seed: number, college: boolean) {
  const g = createGame({ name: '测试', gender: '男', origin: 'county', seed })
  if (college) g.studyMonthsLeft = 48
  let guard = 0
  let opened = false

  while (g.status === 'alive' && guard++ < 2000) {
    if (g.pendingEvent) {
      const ev = g.pendingEvent
      resolveEvent(g, 0)
      assert(!!ev, 'pending event resolved')
      continue
    }
    if (!opened && g.cash > 70000 && g.ageMonths > 40) {
      openBiz(g, 'milktea')
      opened = true
      continue
    }
    if (g.biz && Math.random() < 0.2) {
      bizAction(g, 'promote')
      continue
    }
    const pool = ACTIONS.filter((a) => a.visible(g))
    const act = pool[Math.floor(Math.random() * pool.length)]
    doAction(g, act.id)

    assert(Number.isFinite(g.cash), `cash finite @${g.ageMonths}`)
    assert(Number.isFinite(g.attrs.int), 'int finite')
    assert(g.health >= 0 && g.health <= 100, `health in range @${g.ageMonths}: ${g.health}`)
    assert(g.mood >= 0 && g.mood <= 100, `mood in range @${g.ageMonths}: ${g.mood}`)
  }

  assert(g.status === 'ended', 'game reached an ending')
  assert(g.ageMonths <= 504 + 2, `age within lifetime: ${g.ageMonths}`)
  const sum = endingSummary(g)
  assert(Number.isFinite(netWorth(g)), 'networth finite')
  return { months: g.ageMonths, cash: g.cash, grade: sum.title, logs: g.log.length, biz: !!g.biz }
}

let ok = 0
for (let i = 1; i <= 12; i++) {
  const r = runOne(i * 137, i % 2 === 0)
  ok++
  console.log(
    `#${i} 活了 ${Math.floor(r.months / 12) + 18} 岁 · 现金 ${r.cash.toLocaleString()} · 结局「${r.grade}」· 日志 ${r.logs} 条${r.biz ? ' · 有店' : ''}`,
  )
}

console.log(`\n=== 冒烟测试通过：${ok} 局全部走完 ===`)
console.log(`生意类型 ${BIZ_TYPES.length} 种：${BIZ_TYPES.map((b) => `${b.name}(${b.cost})`).join('、')}`)
