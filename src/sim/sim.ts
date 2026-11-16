/**
 * 房间模式（实时生活模拟）——类似《模拟人生》的核心循环：
 * 需求自行衰减 → 角色走到家具前 → 使用家具 → 需求回升 → 时间流动。
 * 纯逻辑，不依赖 React。
 */

export const TW = 64
export const TH = 32

export const GRID_W = 10
export const GRID_H = 8

export type NeedId = 'hunger' | 'energy' | 'hygiene' | 'fun' | 'social' | 'comfort'

export const NEEDS: { id: NeedId; label: string; emoji: string; decay: number }[] = [
  { id: 'hunger', label: '饱腹', emoji: '🍚', decay: 7 },
  { id: 'energy', label: '精力', emoji: '🔋', decay: 6 },
  { id: 'hygiene', label: '清洁', emoji: '🛁', decay: 4 },
  { id: 'fun', label: '娱乐', emoji: '🎮', decay: 6 },
  { id: 'social', label: '社交', emoji: '💬', decay: 3.5 },
  { id: 'comfort', label: '舒适', emoji: '🛋️', decay: 2.5 },
]

export interface ObjDef {
  id: string
  name: string
  emoji: string
  price: number
  /** 使用时补哪一项需求 */
  need: NeedId
  /** 每游戏小时恢复量 */
  rate: number
  /** 交互耗时（游戏分钟），到时间自动结束 */
  duration: number
}

export const CATALOG: ObjDef[] = [
  { id: 'bed', name: '床', emoji: '🛏️', price: 800, need: 'energy', rate: 55, duration: 480 },
  { id: 'fridge', name: '冰箱', emoji: '🧊', price: 600, need: 'hunger', rate: 120, duration: 45 },
  { id: 'shower', name: '淋浴', emoji: '🚿', price: 400, need: 'hygiene', rate: 110, duration: 40 },
  { id: 'toilet', name: '马桶', emoji: '🚽', price: 300, need: 'comfort', rate: 90, duration: 20 },
  { id: 'sofa', name: '沙发', emoji: '🛋️', price: 500, need: 'comfort', rate: 40, duration: 90 },
  { id: 'tv', name: '电视', emoji: '📺', price: 900, need: 'fun', rate: 60, duration: 120 },
  { id: 'pc', name: '电脑', emoji: '💻', price: 1200, need: 'fun', rate: 70, duration: 120 },
  { id: 'desk', name: '书桌', emoji: '🗄️', price: 700, need: 'social', rate: 45, duration: 90 },
  { id: 'phone', name: '手机', emoji: '📱', price: 200, need: 'social', rate: 95, duration: 45 },
]

export function objDef(id: string): ObjDef {
  return CATALOG.find((c) => c.id === id)!
}

export interface Placed {
  uid: string
  defId: string
  x: number
  y: number
}

export interface Agent {
  x: number
  y: number
  path: { x: number; y: number }[]
  targetUid: string | null
  usingUid: string | null
  useLeft: number
}

export interface Sim {
  day: number
  minutes: number
  money: number
  needs: Record<NeedId, number>
  objs: Placed[]
  agent: Agent
  speed: number
  /** 自由意志：需求见底时角色自己去找东西用 */
  auto: boolean
  autoTimer: number
  log: { id: number; text: string; kind: 'info' | 'good' | 'bad' }[]
  seq: number
  uidSeq: number
}

const clamp01 = (n: number) => Math.max(0, Math.min(100, n))

export function createSim(): Sim {
  const objs: Placed[] = [
    { uid: 'u1', defId: 'bed', x: 1, y: 1 },
    { uid: 'u2', defId: 'fridge', x: 6, y: 1 },
    { uid: 'u3', defId: 'shower', x: 8, y: 2 },
    { uid: 'u4', defId: 'toilet', x: 8, y: 4 },
    { uid: 'u5', defId: 'pc', x: 3, y: 5 },
    { uid: 'u6', defId: 'tv', x: 6, y: 6 },
    { uid: 'u7', defId: 'phone', x: 5, y: 3 },
  ]
  return {
    day: 1,
    minutes: 8 * 60,
    money: 3000,
    needs: { hunger: 62, energy: 70, hygiene: 66, fun: 58, social: 55, comfort: 60 },
    objs,
    agent: { x: 5, y: 7, path: [], targetUid: null, usingUid: null, useLeft: 0 },
    speed: 1,
    auto: true,
    autoTimer: 5,
    log: [{ id: 1, text: '早上八点，新的一天开始了。', kind: 'info' }],
    seq: 2,
    uidSeq: 8,
  }
}

export function simLog(s: Sim, text: string, kind: 'info' | 'good' | 'bad' = 'info') {
  s.log.push({ id: s.seq++, text, kind })
  if (s.log.length > 60) s.log.splice(0, s.log.length - 60)
}

export function clockText(s: Sim) {
  const h = Math.floor(s.minutes / 60) % 24
  const m = Math.floor(s.minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function isBlocked(s: Sim, x: number, y: number, ignoreUid?: string) {
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return true
  return s.objs.some((o) => o.x === x && o.y === y && o.uid !== ignoreUid)
}

export function approachTile(s: Sim, obj: Placed): { x: number; y: number } | null {
  const cands = [
    { x: obj.x, y: obj.y + 1 },
    { x: obj.x + 1, y: obj.y },
    { x: obj.x - 1, y: obj.y },
    { x: obj.x, y: obj.y - 1 },
  ]
  return cands.find((c) => !isBlocked(s, c.x, c.y)) ?? null
}

export function findPath(s: Sim, from: { x: number; y: number }, to: { x: number; y: number }) {
  const key = (x: number, y: number) => `${x},${y}`
  const start = { x: Math.round(from.x), y: Math.round(from.y) }
  if (start.x === to.x && start.y === to.y) return []
  const prev = new Map<string, string | null>()
  const q: { x: number; y: number }[] = [start]
  prev.set(key(start.x, start.y), null)
  while (q.length) {
    const cur = q.shift()!
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = cur.x + dx
      const ny = cur.y + dy
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue
      const k = key(nx, ny)
      if (prev.has(k)) continue
      if (isBlocked(s, nx, ny) && !(nx === to.x && ny === to.y)) continue
      prev.set(k, key(cur.x, cur.y))
      if (nx === to.x && ny === to.y) {
        const path: { x: number; y: number }[] = []
        let ck: string | null = k
        while (ck) {
          const [px, py] = ck.split(',').map(Number)
          path.unshift({ x: px, y: py })
          ck = prev.get(ck) ?? null
        }
        path.shift()
        return path
      }
      q.push({ x: nx, y: ny })
    }
  }
  return []
}

export function sendTo(s: Sim, uid: string) {
  const obj = s.objs.find((o) => o.uid === uid)
  if (!obj) return
  s.agent.usingUid = null
  s.agent.useLeft = 0
  const spot = approachTile(s, obj)
  if (!spot) {
    simLog(s, '过不去，那里被挡住了。', 'bad')
    return
  }
  const ax = Math.round(s.agent.x)
  const ay = Math.round(s.agent.y)
  if (ax === spot.x && ay === spot.y) {
    s.agent.targetUid = null
    s.agent.path = []
    startUsing(s, uid)
    return
  }
  const path = findPath(s, { x: s.agent.x, y: s.agent.y }, spot)
  if (path.length === 0) {
    simLog(s, '过不去，那里被挡住了。', 'bad')
    s.agent.targetUid = null
    return
  }
  s.agent.targetUid = uid
  s.agent.path = path
}

const MOVE_TILES_PER_SEC = 2.2

/** 推进模拟。dtReal 为真实秒数。1x 时 1 真实秒 = 1 游戏分钟。 */
export function tickSim(s: Sim, dtReal: number) {
  if (s.speed <= 0) return
  const dtGame = dtReal * s.speed

  if (s.agent.path.length > 0) {
    const step = MOVE_TILES_PER_SEC * (dtReal * s.speed)
    const next = s.agent.path[0]
    const dx = next.x - s.agent.x
    const dy = next.y - s.agent.y
    const dist = Math.hypot(dx, dy)
    if (dist <= step) {
      s.agent.x = next.x
      s.agent.y = next.y
      s.agent.path.shift()
      if (s.agent.path.length === 0 && s.agent.targetUid) {
        startUsing(s, s.agent.targetUid)
      }
    } else {
      s.agent.x += (dx / dist) * step
      s.agent.y += (dy / dist) * step
    }
  } else if (s.agent.usingUid) {
    const obj = s.objs.find((o) => o.uid === s.agent.usingUid)
    if (obj) {
      const def = objDef(obj.defId)
      s.needs[def.need] = clamp01(s.needs[def.need] + (def.rate / 60) * dtGame)
      s.agent.useLeft -= dtGame
      if (s.agent.useLeft <= 0 || s.needs[def.need] >= 100) {
        s.agent.usingUid = null
      }
    } else {
      s.agent.usingUid = null
    }
  }

  for (const n of NEEDS) {
    if (s.agent.usingUid) {
      const obj = s.objs.find((o) => o.uid === s.agent.usingUid)
      if (obj && objDef(obj.defId).need === n.id) continue
    }
    s.needs[n.id] = clamp01(s.needs[n.id] - (n.decay / 60) * dtGame)
  }

  s.minutes += dtGame
  while (s.minutes >= 1440) {
    s.minutes -= 1440
    s.day += 1
    simLog(s, `第 ${s.day} 天。`, 'info')
  }

  if (s.needs.hunger < 10 && Math.random() < 0.004) simLog(s, '你饿得有点头晕。', 'bad')
  if (s.needs.energy < 10 && Math.random() < 0.004) simLog(s, '眼皮开始打架了。', 'bad')

  if (s.auto) {
    s.autoTimer -= dtGame
    if (s.autoTimer <= 0) {
      s.autoTimer = 5
      autoThink(s)
    }
  }
}

/** 自由意志：最难受的那项需求见底时，自己去找家具。 */
function autoThink(s: Sim) {
  if (s.agent.usingUid || s.agent.path.length > 0) return
  const worst = NEEDS.reduce((a, b) => (s.needs[a.id] <= s.needs[b.id] ? a : b))
  if (s.needs[worst.id] > 28) return
  const obj = s.objs
    .filter((o) => objDef(o.defId).need === worst.id)
    .sort((a, b) => objDef(b.defId).rate - objDef(a.defId).rate)[0]
  if (obj) sendTo(s, obj.uid)
}

function startUsing(s: Sim, uid: string) {
  const obj = s.objs.find((o) => o.uid === uid)
  if (!obj) return
  const def = objDef(obj.defId)
  s.agent.usingUid = uid
  s.agent.targetUid = null
  s.agent.useLeft = def.duration
  simLog(s, `开始使用${def.name}。`, 'info')
}

export function place(s: Sim, defId: string, x: number, y: number) {
  const def = objDef(defId)
  if (isBlocked(s, x, y)) {
    simLog(s, '这个位置已经有东西了。', 'bad')
    return false
  }
  if (Math.round(s.agent.x) === x && Math.round(s.agent.y) === y) {
    simLog(s, '你正站在那儿。', 'bad')
    return false
  }
  if (s.money < def.price) {
    simLog(s, '钱不够。', 'bad')
    return false
  }
  s.money -= def.price
  s.objs.push({ uid: `u${s.uidSeq++}`, defId, x, y })
  simLog(s, `买了一件${def.name}，花了 ${def.price}。`, 'good')
  return true
}

export function workShift(s: Sim) {
  if (s.minutes > 1320) {
    simLog(s, '太晚了，今天不上班了。', 'bad')
    return
  }
  const pay = 420
  s.money += pay
  s.minutes = Math.min(1440, s.minutes + 480)
  s.needs.hunger = clamp01(s.needs.hunger - 22)
  s.needs.energy = clamp01(s.needs.energy - 26)
  s.needs.fun = clamp01(s.needs.fun - 18)
  s.needs.social = clamp01(s.needs.social + 12)
  simLog(s, `上完一天班，领到 ${pay} 元工资，人快散架了。`, 'good')
}
