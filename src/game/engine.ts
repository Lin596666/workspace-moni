import type { BizTypeId, GameState, StartOptions } from './types'
import { BIZ_TYPES, EVENTS, PRICE_FACTOR, bizType } from './content'
import { addAttr, addBizReputation, addCash, addFame, addHealth, addMood, addNetwork, log } from './effects'
import { clamp, mulberry32 } from './rng'

export const START_AGE = 18
export const END_AGE = 60

export function age(s: GameState) {
  return START_AGE + Math.floor(s.ageMonths / 12)
}

export function yearLabel(s: GameState) {
  return `${age(s)}岁`
}

export function createGame(opts: StartOptions): GameState {
  const seed = opts.seed ?? Math.floor(Date.now() % 1000000)
  const rnd = mulberry32(seed)
  const r = () => rnd()

  const base = {
    city: { cash: 8000, int: 46, emo: 44, phy: 48, cha: 46 },
    county: { cash: 5000, int: 44, emo: 42, phy: 50, cha: 44 },
    rural: { cash: 3000, int: 42, emo: 38, phy: 54, cha: 42 },
  }[opts.origin]

  const jitter = (n: number) => clamp(Math.round(n + (r() - 0.5) * 12))

  const s: GameState = {
    seed,
    char: { name: opts.name, gender: opts.gender, origin: opts.origin },
    ageMonths: 0,
    cash: base.cash,
    attrs: {
      int: jitter(base.int),
      phy: jitter(base.phy),
      cha: jitter(base.cha),
      emo: jitter(base.emo),
    },
    health: 82 + Math.round(r() * 10),
    mood: 68 + Math.round(r() * 12),
    edu: 0,
    studyMonthsLeft: null,
    hasCollege: false,
    biz: null,
    spouse: null,
    children: 0,
    network: 12 + Math.round(r() * 8),
    fame: 0,
    phase: 'work',
    log: [],
    logSeq: 1,
    pendingEvent: null,
    status: 'alive',
    rngCursor: 0,
    actionsLeft: 1,
    flags: {},
  }

  const originText = { city: '省会城市', county: '县城', rural: '农村' }[opts.origin]
  log(s, `${s.char.name}，${age(s)}岁，出生在${originText}。高考结束了，人生的账本翻开第一页。`, 'info')
  return s
}

export interface ActionDef {
  id: string
  label: string
  emoji: string
  desc: string
  visible: (s: GameState) => boolean
  run: (s: GameState) => void
}

export function wageOf(s: GameState) {
  const base = 3000 + s.attrs.int * 18 + s.network * 12 + s.edu * 900
  return Math.round(base * (s.hasCollege ? 1.3 : 1))
}

export const ACTIONS: ActionDef[] = [
  {
    id: 'study',
    label: '学习进修',
    emoji: '📚',
    desc: '看书考证，智力 +3，烧钱烧心情',
    visible: (s) => s.cash >= 300,
    run: (s) => {
      addAttr(s, 'int', 2 + Math.round(s.attrs.emo / 60))
      addMood(s, -4)
      addCash(s, -300)
      log(s, '你泡在图书馆里啃了一整个月的书。', 'info')
    },
  },
  {
    id: 'work',
    label: '上班搬砖',
    emoji: '💼',
    desc: '挣钱，掉血掉心情',
    visible: (s) => s.studyMonthsLeft === null,
    run: (s) => {
      const w = wageOf(s)
      addCash(s, w)
      addHealth(s, -2)
      addMood(s, -4)
      log(s, `这个月工资 ${w.toLocaleString('zh-CN')} 到手。`, 'money')
    },
  },
  {
    id: 'intern',
    label: '在校兼职',
    emoji: '🧑‍🎓',
    desc: '上课之余打零工，收入少但锻炼人',
    visible: (s) => s.studyMonthsLeft !== null,
    run: (s) => {
      const w = Math.round(wageOf(s) * 0.35)
      addCash(s, w)
      addHealth(s, -2)
      addMood(s, -2)
      addAttr(s, 'emo', 1)
      log(s, `课余做了点兼职，挣了 ${w.toLocaleString('zh-CN')}。`, 'money')
    },
  },
  {
    id: 'gym',
    label: '健身锻炼',
    emoji: '🏃',
    desc: '体质 +3，健康 +3',
    visible: () => true,
    run: (s) => {
      addAttr(s, 'phy', 3)
      addHealth(s, 4)
      addMood(s, 2)
      addCash(s, -100)
      log(s, '每天晚饭后跑五公里，身体轻快了不少。', 'good')
    },
  },
  {
    id: 'social',
    label: '社交应酬',
    emoji: '🍻',
    desc: '人脉 +4，花钱买关系',
    visible: (s) => s.cash >= 400,
    run: (s) => {
      addNetwork(s, 4)
      addMood(s, 2)
      addCash(s, -400)
      addAttr(s, 'emo', 2)
      log(s, '饭局上敬了几轮酒，加了一堆微信。', 'info')
    },
  },
  {
    id: 'rest',
    label: '休息放松',
    emoji: '😴',
    desc: '心情 +10，健康 +5',
    visible: () => true,
    run: (s) => {
      addMood(s, 10)
      addHealth(s, 8)
      log(s, '这一个月你什么都没干，追完了两部剧。', 'info')
    },
  },
]

export function doAction(s: GameState, actionId: string) {
  if (s.status !== 'alive' || s.pendingEvent) return
  const act = ACTIONS.find((a) => a.id === actionId)
  if (!act || !act.visible(s) || s.actionsLeft <= 0) return
  act.run(s)
  s.actionsLeft -= 1
  advanceMonth(s)
}

export function openBiz(s: GameState, id: BizTypeId) {
  const t = bizType(id)
  if (s.biz || s.cash < t.cost) return
  addCash(s, -t.cost)
  s.biz = {
    type: id,
    level: 1,
    staff: 0,
    priceLevel: 1,
    reputation: 50,
    monthsOpen: 0,
    actedThisMonth: false,
  }
  s.phase = 'business'
  log(s, `你盘下一间铺子，${t.name}正式开张。`, 'good')
}

export type BizOp = 'promote' | 'train' | 'upgrade' | 'hire' | 'fire' | 'priceUp' | 'priceDown'

export function bizAction(s: GameState, op: BizOp) {
  const b = s.biz
  if (!b) return
  const t = bizType(b.type)
  switch (op) {
    case 'promote':
      if (s.cash < 5000) return
      addCash(s, -5000)
      addBizReputation(s, 8)
      log(s, '你搞了一轮促销，门口排起了长队。', 'good')
      break
    case 'train':
      if (s.cash < 8000) return
      addCash(s, -8000)
      addBizReputation(s, 5)
      log(s, '给员工做了培训，服务态度好了不少。', 'good')
      break
    case 'upgrade': {
      const cost = Math.round(t.cost * 0.45 * b.level)
      if (s.cash < cost || b.level >= 5) return
      addCash(s, -cost)
      b.level += 1
      addBizReputation(s, 4)
      log(s, `店面装修升级，现在是 ${b.level} 级店。`, 'good')
      break
    }
    case 'hire':
      if (s.cash < t.salary) return
      b.staff += 1
      log(s, `招了一名员工，月薪 ${t.salary.toLocaleString('zh-CN')}。`, 'info')
      break
    case 'fire':
      if (b.staff <= 0) return
      b.staff -= 1
      addBizReputation(s, -3)
      log(s, '辞退了一名员工，人手有点紧。', 'bad')
      break
    case 'priceUp':
      if (b.priceLevel >= 2) return
      b.priceLevel += 1
      addBizReputation(s, -4)
      log(s, '你把价格调高了一档。', 'info')
      break
    case 'priceDown':
      if (b.priceLevel <= 0) return
      b.priceLevel -= 1
      addBizReputation(s, 3)
      log(s, '你把价格调低了一档，薄利多销。', 'info')
      break
  }
}

export function settleBiz(s: GameState) {
  const b = s.biz
  if (!b) return
  const t = bizType(b.type)
  const [roll] = nextRoll(s)
  const priceF = PRICE_FACTOR[b.priceLevel]
  const repF = 0.72 + b.reputation / 190
  const levelF = 1 + (b.level - 1) * 0.22
  const staffF = 1 + b.staff * 0.09
  const wave = 0.86 + roll * 0.3
  const revenue = Math.round(t.baseRevenue * priceF * repF * levelF * staffF * wave)
  const material = Math.round(revenue * t.materialRate)
  const salary = b.staff * t.salary
  const profit = revenue - material - salary - t.rent
  s.cash += profit
  b.monthsOpen += 1

  let repDelta = 0
  if (b.staff === 0) repDelta -= 2
  if (b.priceLevel === 2) repDelta -= 1
  if (profit > 0) repDelta += 2
  if (profit < 0) repDelta -= 3
  b.reputation = clamp(b.reputation + repDelta)

  log(
    s,
    `${t.name}月结：营业额 ${revenue.toLocaleString('zh-CN')}，成本 ${(material + salary + t.rent).toLocaleString('zh-CN')}，${profit >= 0 ? '净赚' : '亏了'} ${Math.abs(profit).toLocaleString('zh-CN')}。`,
    profit >= 0 ? 'money' : 'bad',
  )

  if (s.cash < -50000 && b.reputation < 30) {
    log(s, `${t.name}撑不住了，资金链断裂，只能关门。`, 'bad')
    s.biz = null
    s.phase = 'work'
  }
}

function nextRoll(s: GameState): [number, number] {
  const rnd = mulberry32(s.seed + s.ageMonths * 7919 + s.logSeq * 31)
  return [rnd(), 0]
}

export function livingCost(s: GameState) {
  let cost = 1800 + s.children * 1500
  if (s.flags.mortgage) cost += s.flags.mortgage as number
  return cost
}

export function advanceMonth(s: GameState) {
  if (s.status !== 'alive') return

  // 生病检查
  if (s.health <= 0) {
    if (!s.flags.hospitalized) {
      s.flags.hospitalized = 1
      s.health = 28
      addCash(s, -20000)
      addMood(s, -10)
      log(s, '你倒下了，被送进医院抢救。命捡回来了，但住院费掏空了一半积蓄。', 'bad')
    } else {
      s.status = 'ended'
      s.flags.deathReason = 1
      log(s, `${s.char.name}倒下了，这一生戛然而止。`, 'bad')
      return
    }
  }

  if (s.studyMonthsLeft !== null) {
    s.studyMonthsLeft -= 1
    addCash(s, -1500)
    addAttr(s, 'int', 2)
    addMood(s, -1)
    if (s.studyMonthsLeft <= 0) {
      s.studyMonthsLeft = null
      s.hasCollege = true
      s.edu = Math.max(s.edu, 2)
      log(s, '你大学毕业了，学士帽抛向天空的那一刻，所有人都笑了。', 'good')
    }
  }

  // 生活开支
  const cost = livingCost(s)
  addCash(s, -cost)

  // 身体自我修复：不折腾就会缓过来
  if (s.health < 70) addHealth(s, 1)

  // 学生没钱了，父母兜底（这就是中国式家庭）
  if (s.studyMonthsLeft !== null && s.cash < 0) {
    addCash(s, 2000)
    log(s, '卡里没钱了，妈打来两千块，说「别委屈自己」。', 'money')
  }

  settleBiz(s)
  if (s.biz) s.biz.actedThisMonth = false

  if (s.cash < 0) {
    addMood(s, -5)
    addHealth(s, -1)
    if (s.log.length === 0 || s.log[s.log.length - 1].text.indexOf('欠款') === -1) {
      log(s, '账户余额变成了负数，你开始算信用卡还款日。', 'bad')
    }
  }

  s.ageMonths += 1
  s.actionsLeft = 1

  // 自然衰减
  if (age(s) > 50) addHealth(s, -2)
  else if (age(s) > 45) addHealth(s, -1)
  if (s.mood < 20) addHealth(s, -1)

  // 随机事件
  if (s.status === 'alive' && s.ageMonths % 1 === 0) {
    const [r] = nextRoll(s)
    if (r < 0.42) {
      const pool = EVENTS.filter((e) => e.when(s))
      if (pool.length) {
        const total = pool.reduce((a, e) => a + e.weight, 0)
        const [r2] = nextRoll(s)
        let acc = r2 * total
        for (const e of pool) {
          acc -= e.weight
          if (acc <= 0) {
            s.pendingEvent = { eventId: e.id }
            break
          }
        }
      }
    }
  }

  if (age(s) >= END_AGE) {
    s.status = 'ended'
    log(s, '六十岁了。你坐在阳台上，把这一辈子从头到尾想了一遍。', 'info')
  }
}

export function resolveEvent(s: GameState, choiceIndex: number) {
  if (!s.pendingEvent) return
  const ev = EVENTS.find((e) => e.id === s.pendingEvent!.eventId)
  s.pendingEvent = null
  if (!ev) return
  const choice = ev.choices[choiceIndex]
  if (!choice) return
  log(s, `【${ev.title}】${choice.result}`, 'event')
  choice.apply(s)
}

export function netWorth(s: GameState) {
  const bizValue = s.biz ? Math.round(bizType(s.biz.type).cost * (0.6 + s.biz.level * 0.25)) : 0
  const houseValue = s.flags.boughtHouse ? 600000 : 0
  return s.cash + bizValue + houseValue
}

export function endingSummary(s: GameState) {
  const nw = netWorth(s)
  const grades: { min: number; title: string; text: string }[] = [
    { min: 1500000, title: '衣锦还乡', text: '你在老家盖了楼，村口那块碑上刻着你的名字。' },
    { min: 500000, title: '小有成就', text: '不算大富，但街坊邻居提起你，口气都是服的。' },
    { min: 150000, title: '安稳一生', text: '一套房、一辆车、一个家，日子不惊不喜。' },
    { min: 0, title: '平平淡淡', text: '没攒下什么钱，但也没欠谁什么。' },
    { min: -99999999, title: '一地鸡毛', text: '账还没还完，人已经老了。' },
  ]
  const g = grades.find((x) => nw >= x.min)!
  return { title: g.title, text: g.text, netWorth: nw }
}

export { BIZ_TYPES }
