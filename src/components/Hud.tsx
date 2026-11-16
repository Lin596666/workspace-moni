import type { GameState } from '../game/types'
import { fmtMoney } from '../game/effects'
import { age, livingCost, wageOf } from '../game/engine'

export default function Hud({ game }: { game: GameState }) {
  const eduLabel = ['高中', '大专', '本科', '硕士'][game.edu] ?? '高中'
  const studying = game.studyMonthsLeft !== null

  return (
    <>
      <div className="hud">
        <div className="hud-item">
          <div className="k">年龄</div>
          <div className="v">{age(game)}</div>
        </div>
        <div className="hud-item">
          <div className="k">现金</div>
          <div className={`v ${game.cash < 0 ? 'v-bad' : ''}`}>{fmtMoney(game.cash)}</div>
        </div>
        <div className="hud-item">
          <div className="k">{studying ? '在校' : '月薪'}</div>
          <div className="v">{studying ? `${game.studyMonthsLeft}月` : fmtMoney(Math.round(wageOf(game) * 0.85))}</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">
          状态 · {eduLabel}
          {studying ? ' · 在读' : ''}
        </p>
        <div className="attrs">
          <Attr label="智力" value={game.attrs.int} />
          <Attr label="体质" value={game.attrs.phy} />
          <Attr label="颜值" value={game.attrs.cha} />
          <Attr label="情商" value={game.attrs.emo} />
          <Attr label="健康" value={game.health} cls="health" />
          <Attr label="心情" value={game.mood} cls="mood" />
          <Attr label="人脉" value={game.network} />
          <Attr label="名气" value={game.fame} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 12 }}>
          固定开销 {fmtMoney(livingCost(game))}/月
          {game.spouse ? ` · 已与 ${game.spouse.name} 结婚` : ''}
          {game.children > 0 ? ` · ${game.children} 个孩子` : ''}
        </div>
      </div>
    </>
  )
}

function Attr({ label, value, cls }: { label: string; value: number; cls?: string }) {
  return (
    <div className="attr">
      <div className="top">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className={`bar ${cls ?? ''}`}>
        <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}
