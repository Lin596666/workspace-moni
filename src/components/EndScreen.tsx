import type { GameState } from '../game/types'
import { fmtMoney } from '../game/effects'
import { age } from '../game/engine'

interface Props {
  game: GameState
  summary: { title: string; text: string; netWorth: number }
  onRestart: () => void
}

export default function EndScreen({ game, summary, onRestart }: Props) {
  const eduLabel = ['高中', '大专', '本科', '硕士'][game.edu] ?? '高中'
  const alive = !game.flags.deathReason

  return (
    <div className="app">
      <div className="card ending">
        <div style={{ fontSize: 13, letterSpacing: 4, color: 'var(--ink-3)' }}>
          {alive ? '寿终' : '卒年'} {age(game)} 岁
        </div>
        <div className="grade">{summary.title}</div>
        <div className="desc">{summary.text}</div>

        <div className="nums">
          <div className="hud-item">
            <div className="k">净资产</div>
            <div className="v">{fmtMoney(summary.netWorth)}</div>
          </div>
          <div className="hud-item">
            <div className="k">学历</div>
            <div className="v">{eduLabel}</div>
          </div>
          <div className="hud-item">
            <div className="k">子女</div>
            <div className="v">{game.children}</div>
          </div>
        </div>

        <div className="attrs" style={{ textAlign: 'left' }}>
          <div>智力 {game.attrs.int}</div>
          <div>体质 {game.attrs.phy}</div>
          <div>颜值 {game.attrs.cha}</div>
          <div>情商 {game.attrs.emo}</div>
          <div>人脉 {game.network}</div>
          <div>名气 {game.fame}</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">最后几笔流水</p>
        <div className="log">
          {game.log
            .slice(-8)
            .reverse()
            .map((l) => (
              <div key={l.id} className="log-item">
                <span className="log-time">
                  {18 + Math.floor(l.month / 12)}岁{l.month % 12}月
                </span>
                <span className={`log-${l.kind}`}>{l.text}</span>
              </div>
            ))}
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%' }} onClick={onRestart}>
        再来一生
      </button>
      <div className="tip">下辈子，换个出身试试</div>
    </div>
  )
}
