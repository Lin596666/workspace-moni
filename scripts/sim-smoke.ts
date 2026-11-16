import { createSim, tickSim, sendTo, workShift, NEEDS, isBlocked } from '../src/sim/sim'

const s = createSim()
s.speed = 4

let autoUses = 0
const seenLog = new Set<number>()

// 模拟约 40 分钟真实时间（4x 下 ≈ 2.6 个游戏日）
for (let i = 0; i < 600 * 40; i++) {
  tickSim(s, 0.05)
  for (const l of s.log) seenLog.add(l.id)
  for (const n of NEEDS) {
    const v = s.needs[n.id]
    if (!Number.isFinite(v) || v < 0 || v > 100) throw new Error(`需求越界: ${n.id}=${v}`)
  }
  if (s.agent.x < -0.01 || s.agent.x > 9.01 || s.agent.y < -0.01 || s.agent.y > 7.01) {
    throw new Error(`角色越界: ${s.agent.x},${s.agent.y}`)
  }
  if (s.agent.usingUid) autoUses++
}

console.log('clock', s.day, Math.round(s.minutes), 'money', s.money)
console.log('needs', Object.fromEntries(NEEDS.map((n) => [n.id, Math.round(s.needs[n.id])])))
console.log('使用家具的 tick 数', autoUses, '日志条数', s.log.length, '唯一日志', seenLog.size)

// 手动指派：走到床边并开始使用
const before = { x: s.agent.x, y: s.agent.y }
sendTo(s, 'u1')
s.speed = 8
for (let i = 0; i < 400; i++) tickSim(s, 0.05)
if (Math.abs(s.agent.x - before.x) < 0.01 && Math.abs(s.agent.y - before.y) < 0.01) {
  throw new Error('手动指派后角色没有移动')
}
console.log('手动指派后位置', s.agent.x.toFixed(1), s.agent.y.toFixed(1), '使用中', s.agent.usingUid)

// 上班
const moneyBefore = s.money
workShift(s)
console.log('上班后金钱', moneyBefore, '→', s.money, '时钟', s.day, Math.round(s.minutes))

// 阻挡判定
if (!isBlocked(s, 1, 1)) throw new Error('床所在格应视为占位')
if (isBlocked(s, 5, 0)) throw new Error('空地不应视为占位')

console.log('SMOKE OK')
