import type { GameState } from '../game/types'
import type { BizOp } from '../game/engine'
import { bizType, PRICE_LABEL } from '../game/content'
import { fmtMoney } from '../game/effects'

const OPS: { id: BizOp; label: string; sub: string }[] = [
  { id: 'promote', label: '搞促销', sub: '-5k 口碑+8' },
  { id: 'train', label: '员工培训', sub: '-8k 口碑+5' },
  { id: 'upgrade', label: '装修升级', sub: '按等级付费' },
  { id: 'hire', label: '招人', sub: '月薪' },
  { id: 'fire', label: '裁人', sub: '口碑-3' },
  { id: 'priceUp', label: '涨价', sub: '口碑-4' },
  { id: 'priceDown', label: '降价', sub: '口碑+3' },
]

export default function BizPanel({ game, onOp }: { game: GameState; onOp: (op: BizOp) => void }) {
  const biz = game.biz!
  const t = bizType(biz.type)

  return (
    <div className="card">
      <div className="biz-head">
        <span className="biz-emoji">{t.emoji}</span>
        <div>
          <div className="biz-name">
            {t.name} · Lv.{biz.level}
          </div>
          <div className="biz-meta">
            开店 {biz.monthsOpen} 个月 · 定价{PRICE_LABEL[biz.priceLevel]}
          </div>
        </div>
      </div>

      <div className="biz-grid">
        <div className="biz-stat">
          <div className="k">口碑</div>
          <div className="v">{biz.reputation}</div>
        </div>
        <div className="biz-stat">
          <div className="k">员工</div>
          <div className="v">{biz.staff}</div>
        </div>
        <div className="biz-stat">
          <div className="k">基础月租</div>
          <div className="v">{fmtMoney(t.rent)}</div>
        </div>
        <div className="biz-stat">
          <div className="k">升级价</div>
          <div className="v">{fmtMoney(Math.round(t.cost * 0.45 * biz.level))}</div>
        </div>
      </div>

      <div className="biz-ops">
        {OPS.map((o) => (
          <button key={o.id} className="btn btn-sm" onClick={() => onOp(o.id)}>
            {o.label}
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{o.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
