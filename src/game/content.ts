import type { BizType, BizTypeId, GameEvent } from './types'
import { addAttr, addBizReputation, addCash, addFame, addHealth, addMood, addNetwork, log } from './effects'

export const BIZ_TYPES: BizType[] = [
  {
    id: 'taobao',
    name: '网店',
    emoji: '📦',
    cost: 20000,
    baseRevenue: 15000,
    rent: 1500,
    salary: 3500,
    materialRate: 0.5,
    desc: '门槛最低，流量靠运营，起量慢但亏得也少',
  },
  {
    id: 'milktea',
    name: '奶茶店',
    emoji: '🧋',
    cost: 60000,
    baseRevenue: 26000,
    rent: 6000,
    salary: 4500,
    materialRate: 0.35,
    desc: '回本快，靠地段和口碑，同行内卷严重',
  },
  {
    id: 'convenience',
    name: '便利店',
    emoji: '🏪',
    cost: 90000,
    baseRevenue: 38000,
    rent: 7000,
    salary: 4000,
    materialRate: 0.62,
    desc: '现金流稳定，毛利薄，靠走量',
  },
  {
    id: 'restaurant',
    name: '小餐馆',
    emoji: '🍜',
    cost: 150000,
    baseRevenue: 70000,
    rent: 12000,
    salary: 5000,
    materialRate: 0.42,
    desc: '利润高，但厨师、卫生、差评样样要命',
  },
  {
    id: 'factory',
    name: '小工厂',
    emoji: '🏭',
    cost: 500000,
    baseRevenue: 260000,
    rent: 20000,
    salary: 6000,
    materialRate: 0.55,
    desc: '重资产，订单决定生死，资金链一断全完',
  },
]

export function bizType(id: BizTypeId): BizType {
  return BIZ_TYPES.find((b) => b.id === id)!
}

export const PRICE_FACTOR = [0.82, 1, 1.22]
export const PRICE_LABEL = ['平价', '正常', '高端']

/** 事件库：全部围绕「中国式人生 + 经营」设计，按条件出现。 */
export const EVENTS: GameEvent[] = [
  {
    id: 'ev_mm_lend',
    title: '亲戚借钱',
    emoji: '🧧',
    text: '二舅打电话来，说表弟要结婚，彩礼还差十万，想找你周转一下，「下个月就还」。你妈在旁边小声说：都是一家人。',
    when: (s) => s.cash > 30000,
    weight: 14,
    choices: [
      {
        label: '借 5 万，顾个面子',
        result: '钱借出去了，年三十的饭桌上你成了人人夸的好孩子。',
        apply: (s) => {
          addCash(s, -50000)
          addNetwork(s, 6)
          addFame(s, 2)
          addMood(s, -6)
        },
      },
      {
        label: '直接拒绝',
        result: '电话那头沉默了三秒，说了句「行吧」。后来逢年过节，二舅再没主动打过电话。',
        apply: (s) => {
          addNetwork(s, -5)
          addMood(s, 3)
        },
      },
      {
        label: '借一万，意思一下',
        result: '既有交代，也不至于伤筋动骨。',
        apply: (s) => {
          addCash(s, -10000)
          addNetwork(s, 2)
        },
      },
    ],
  },
  {
    id: 'ev_job_996',
    title: '公司要加班',
    emoji: '💼',
    text: '老板在群里发：「本周项目冲刺，全员到岗，辛苦了。」评论区清一色的「收到」和「冲」。',
    when: (s) => s.studyMonthsLeft === null && s.biz === null,
    weight: 16,
    choices: [
      {
        label: '跟着冲，表现一下',
        result: '连着熬了三个通宵，项目上线，老板点名表扬了你。身体有点吃不消。',
        apply: (s) => {
          addCash(s, 5000)
          addHealth(s, -6)
          addMood(s, -8)
          addNetwork(s, 2)
        },
      },
      {
        label: '请假，说要陪家人',
        result: '假批了，但季度绩效里你垫了底。',
        apply: (s) => {
          addMood(s, 4)
          addHealth(s, 2)
          s.flags.performance = (s.flags.performance ?? 0) - 1
        },
      },
    ],
  },
  {
    id: 'ev_house',
    title: '售楼处打来电话',
    emoji: '🏠',
    text: '中介说这个楼盘要开盘了，首付三成，房贷三十年，「年轻人早买早上车，房价只会涨」。你心里算了算账。',
    when: (s) => s.cash > 200000 && (s.flags.boughtHouse ?? 0) === 0,
    weight: 12,
    choices: [
      {
        label: '上车，首付 20 万',
        result: '签完合同那天你在小区门口站了很久。三十年房贷，从此每个月都有一笔准时扣款。',
        apply: (s) => {
          addCash(s, -200000)
          s.flags.boughtHouse = 1
          s.flags.mortgage = 4200
          addMood(s, 10)
          addNetwork(s, 4)
        },
      },
      {
        label: '再等等，先把钱留着做生意',
        result: '你转身把钱投进了生意里。后来房价涨了不少，但你的店活下来了。',
        apply: (s) => {
          addMood(s, -3)
          s.flags.cashInHand = 1
        },
      },
    ],
  },
  {
    id: 'ev_blind_date',
    title: '相亲',
    emoji: '💐',
    text: '介绍人说对方在事业单位，稳定，家里有点底子。见面在商场四楼的餐厅，对方问你的第一个问题是：「你以后打算在哪儿定居？」',
    when: (s) => !s.spouse && 18 + Math.floor(s.ageMonths / 12) >= 26,
    weight: 18,
    choices: [
      {
        label: '如实说，先处处看',
        result: '对方笑了笑，说那就先加个微信。',
        apply: (s) => {
          s.flags.blindDates = (s.flags.blindDates ?? 0) + 1
          addMood(s, 2)
        },
      },
      {
        label: '吹一吹，把条件说好点',
        result: '对方眼睛亮了一下。这门亲事有戏，但你心里有点虚。',
        apply: (s) => {
          s.flags.blindDates = (s.flags.blindDates ?? 0) + 2
          addMood(s, -2)
        },
      },
    ],
  },
  {
    id: 'ev_franchise',
    title: '加盟招商会',
    emoji: '📣',
    text: '酒店会议厅里坐满了人，大屏幕滚动播放「月入十万不是梦」。招商经理说前二十名签约免加盟费。',
    when: (s) => s.biz !== null && s.cash > 50000,
    weight: 10,
    choices: [
      {
        label: '签约，交加盟费 4 万',
        result: '牌子挂上了，总部给了你一套标准手册，但客流没见涨多少。',
        apply: (s) => {
          addCash(s, -40000)
          addBizReputation(s, 5)
          s.flags.franchise = 1
        },
      },
      {
        label: '听完就走，回去老老实实做自己的',
        result: '你把宣传册扔进了垃圾桶。',
        apply: (s) => {
          addMood(s, 2)
        },
      },
    ],
  },
  {
    id: 'ev_sick',
    title: '体检报告',
    emoji: '🏥',
    text: '体检科医生指着报告上的一行字说：「这个指标有点高，建议进一步复查。」',
    when: (s) => s.health < 60,
    weight: 15,
    choices: [
      {
        label: '马上住院好好治',
        result: '花了一笔钱，但身体缓过来了。',
        apply: (s) => {
          addCash(s, -15000)
          addHealth(s, 22)
          addMood(s, -5)
        },
      },
      {
        label: '先放着，忙完这阵子再说',
        result: '你安慰自己没事，只是偶尔半夜会醒。',
        apply: (s) => {
          addHealth(s, -10)
          addMood(s, -6)
        },
      },
    ],
  },
  {
    id: 'ev_live',
    title: '直播带货的风口',
    emoji: '📱',
    text: '朋友说你店里东西不错，不如开个直播。第一天就来了两百人，有人问「老板能便宜点吗」。',
    when: (s) => s.biz !== null,
    weight: 12,
    choices: [
      {
        label: '亲自上播，每天两小时',
        result: '嗓子哑了，但订单确实多了。',
        apply: (s) => {
          addHealth(s, -4)
          addBizReputation(s, 8)
          addCash(s, 8000)
          addFame(s, 6)
        },
      },
      {
        label: '花钱找主播代播',
        result: '数据好看了一阵，退货率也上来了。',
        apply: (s) => {
          addCash(s, -6000)
          addBizReputation(s, 2)
        },
      },
    ],
  },
  {
    id: 'ev_parent',
    title: '父母老了',
    emoji: '🧓',
    text: '妈在电话里说，你爸最近腿疼得厉害，去医院查了，医生说要手术。「不着急，你忙你的。」',
    when: (s) => 18 + Math.floor(s.ageMonths / 12) >= 32,
    weight: 10,
    choices: [
      {
        label: '请假回去，全程陪着',
        result: '手术很顺利。你在病房陪了七天，工作落下不少。',
        apply: (s) => {
          addCash(s, -30000)
          addMood(s, 6)
          addHealth(s, -2)
        },
      },
      {
        label: '打钱回去，请护工照顾',
        result: '钱到得很快，但你妈在电话里那句「你什么时候回来」问了两遍。',
        apply: (s) => {
          addCash(s, -40000)
          addMood(s, -8)
        },
      },
    ],
  },
  {
    id: 'ev_stock',
    title: '股市',
    emoji: '📈',
    text: '同事说最近这个板块要起飞，他上个月赚了两万。你看着自己的余额，有点心动。',
    when: (s) => s.cash > 50000,
    weight: 9,
    choices: [
      {
        label: '投 3 万试试',
        result: '你每天盯盘，涨了笑，跌了睡不着。',
        apply: (s) => {
          const win = ((s.seed * 131 + s.ageMonths * 17 + s.logSeq) % 100) / 100 > 0.45
          if (win) {
            addCash(s, 18000)
            log(s, '股票赚了 1.8 万，你觉得自己有点天赋。', 'good')
          } else {
            addCash(s, -30000)
            log(s, '股票亏了 3 万，你把软件删了又装回来。', 'bad')
          }
        },
      },
      {
        label: '不碰，钱还是存着稳',
        result: '你继续老老实实存钱。',
        apply: (s) => {
          addMood(s, 1)
        },
      },
    ],
  },
  {
    id: 'ev_rent',
    title: '房东要涨租',
    emoji: '🔑',
    text: '房东说周边都涨了，下个月起房租加两千，不租就搬。',
    when: (s) => s.biz !== null && s.cash > 0,
    weight: 8,
    choices: [
      {
        label: '认了，续租',
        result: '成本上去了，但至少不用停业。',
        apply: (s) => {
          addCash(s, -8000)
          addBizReputation(s, -2)
        },
      },
      {
        label: '咬牙搬到更偏的地方',
        result: '房租是降了，老客户也走了一半。',
        apply: (s) => {
          addCash(s, -15000)
          addBizReputation(s, -12)
        },
      },
    ],
  },
  {
    id: 'ev_friend_betray',
    title: '合伙人的账',
    emoji: '🤝',
    text: '你发现合伙人这个月报上来的流水对不上，差了三万多。他解释说是「临时周转，下月就补回来」。',
    when: (s) => s.biz !== null && s.biz.monthsOpen > 6,
    weight: 7,
    choices: [
      {
        label: '当众摊牌，散伙清算',
        result: '钱追回了一部分，多年交情没了。',
        apply: (s) => {
          addCash(s, -20000)
          addNetwork(s, -10)
          addMood(s, -10)
          s.flags.partner = 0
        },
      },
      {
        label: '装没看见，先稳住生意',
        result: '生意还在转，但你从此每月都自己核一遍账。',
        apply: (s) => {
          addCash(s, -35000)
          addMood(s, -6)
        },
      },
    ],
  },
]
