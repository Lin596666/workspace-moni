/** 游戏全部类型定义。逻辑层是纯函数，不依赖 React。 */

export type Gender = '男' | '女'
export type Origin = 'city' | 'county' | 'rural'
export type Phase = 'study' | 'work' | 'business' | 'retired'

export interface Attrs {
  /** 智力 */
  int: number
  /** 体质 */
  phy: number
  /** 颜值 */
  cha: number
  /** 情商 */
  emo: number
}

export type BizTypeId = 'milktea' | 'convenience' | 'taobao' | 'restaurant' | 'factory'

export interface BizType {
  id: BizTypeId
  name: string
  emoji: string
  /** 开店成本 */
  cost: number
  /** 基础月营业额 */
  baseRevenue: number
  /** 月租 */
  rent: number
  /** 每名员工月薪 */
  salary: number
  /** 原料占营业额比例 */
  materialRate: number
  desc: string
}

export interface Biz {
  type: BizTypeId
  level: number
  staff: number
  /** 0 平价 1 正常 2 高端 */
  priceLevel: number
  /** 口碑 0-100 */
  reputation: number
  monthsOpen: number
  /** 本月是否已做过一次经营动作 */
  actedThisMonth: boolean
}

export interface Spouse {
  name: string
  cha: number
  emo: number
  job: string
  income: number
  /** 好感 0-100 */
  love: number
}

export interface LogEntry {
  id: number
  month: number
  text: string
  kind: 'info' | 'good' | 'bad' | 'money' | 'event'
}

export interface Choice {
  label: string
  /** 结果描述（结算后显示） */
  result: string
  /** 应用效果：修改 state（就地修改） */
  apply: (s: GameState) => void
  /** 是否显示（不满足则不显示） */
  visible?: (s: GameState) => boolean
}

export interface GameEvent {
  id: string
  title: string
  text: string
  emoji: string
  /** 出现条件 */
  when: (s: GameState) => boolean
  /** 权重 */
  weight: number
  choices: Choice[]
}

export interface GameState {
  seed: number
  char: { name: string; gender: Gender; origin: Origin }
  /** 从 18 岁开始计 */
  ageMonths: number
  cash: number
  attrs: Attrs
  health: number
  mood: number
  /** 学历 0 高中 1 大专 2 本科 3 硕士 */
  edu: number
  /** 待读大学剩余月数，null 表示没在读 */
  studyMonthsLeft: number | null
  /** 是否已上大学 */
  hasCollege: boolean
  biz: Biz | null
  spouse: Spouse | null
  children: number
  /** 人脉 */
  network: number
  /** 名气 */
  fame: number
  phase: Phase
  log: LogEntry[]
  logSeq: number
  pendingEvent: { eventId: string } | null
  status: 'alive' | 'ended'
  /** 已使用过的随机种子游标 */
  rngCursor: number
  /** 本月行动已用次数 */
  actionsLeft: number
  flags: Record<string, number>
}

export interface StartOptions {
  name: string
  gender: Gender
  origin: Origin
  seed?: number
}
