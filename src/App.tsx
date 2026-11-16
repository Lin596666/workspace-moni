import { useEffect, useState } from 'react'
import type { GameState } from './game/types'
import {
  ACTIONS,
  age,
  bizAction,
  createGame,
  doAction,
  endingSummary,
  netWorth,
  openBiz,
  resolveEvent,
} from './game/engine'
import type { BizOp } from './game/engine'
import { BIZ_TYPES, EVENTS, bizType } from './game/content'
import { fmtAge, fmtMoney, log } from './game/effects'
import { clearSave, loadGame, saveGame } from './game/save'
import StartScreen from './components/StartScreen'
import Hud from './components/Hud'
import BizPanel from './components/BizPanel'
import EventModal from './components/EventModal'
import EndScreen from './components/EndScreen'

export default function App() {
  const [game, setGame] = useState<GameState | null>(() => loadGame())

  useEffect(() => {
    if (game) saveGame(game)
  }, [game])

  const mutate = (fn: (s: GameState) => void) => {
    setGame((prev) => {
      if (!prev) return prev
      const next: GameState = structuredClone(prev)
      fn(next)
      return next
    })
  }

  if (!game) {
    return (
      <StartScreen
        onStart={(opts, college) => {
          const g = createGame(opts)
          if (college) {
            g.studyMonthsLeft = 48
            log(g, '你填了志愿，背起行李去了省城的大学。学费、生活费，一笔一笔都要钱。', 'info')
          } else {
            log(g, '你没再读书，直接进了社会。别人还在教室里，你已经上了工位。', 'info')
          }
          setGame(g)
        }}
      />
    )
  }

  if (game.status === 'ended') {
    const sum = endingSummary(game)
    return (
      <EndScreen
        game={game}
        summary={sum}
        onRestart={() => {
          clearSave()
          setGame(null)
        }}
      />
    )
  }

  const ev = game.pendingEvent ? EVENTS.find((e) => e.id === game.pendingEvent!.eventId) : null
  const t = game.biz ? bizType(game.biz.type) : null
  const canAct = game.actionsLeft > 0 && !game.pendingEvent
  const savedNet = netWorth(game)

  return (
    <div className="app">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>人间烟火</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 2 }}>
            {game.char.name} · {game.char.gender} · {fmtAge(game)}
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (confirm('确定放弃这一局，重新开始？')) {
              clearSave()
              setGame(null)
            }
          }}
        >
          重开
        </button>
      </div>

      <Hud game={game} />

      <div className="card">
        <p className="card-title">本月行动 · 剩余 {game.actionsLeft} 次</p>
        <div className="actions">
          {ACTIONS.filter((a) => a.visible(game)).map((a) => (
            <button
              key={a.id}
              className="action"
              disabled={!canAct}
              onClick={() => mutate((s) => doAction(s, a.id))}
            >
              <span className="em">{a.emoji}</span>
              <span>
                <span className="t">{a.label}</span>
                <span className="d">{a.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {!game.biz && (
        <div className="card">
          <p className="card-title">盘个生意（一次性投入）</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {BIZ_TYPES.map((b) => (
              <button
                key={b.id}
                className="action"
                disabled={game.cash < b.cost}
                onClick={() => mutate((s) => openBiz(s, b.id))}
                style={{ opacity: game.cash < b.cost ? 0.45 : 1 }}
              >
                <span className="em">{b.emoji}</span>
                <span>
                  <span className="t">
                    {b.name} · {fmtMoney(b.cost)}
                  </span>
                  <span className="d">{b.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {game.biz && t && (
        <BizPanel
          game={game}
          onOp={(op: BizOp) => mutate((s) => bizAction(s, op))}
        />
      )}

      <div className="card">
        <p className="card-title">人生流水</p>
        <div className="log">
          {[...game.log].reverse().map((l) => (
            <div key={l.id} className="log-item">
              <span className="log-time">{18 + Math.floor(l.month / 12)}岁{l.month % 12}月</span>
              <span className={`log-${l.kind}`}>{l.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tip">
        净资产 {fmtMoney(savedNet)} · 每月开销 {fmtMoney(
          game.children * 1500 + 1800 + ((game.flags.mortgage as number) || 0),
        )}
      </div>

      {ev && (
        <EventModal
          event={ev}
          onChoose={(i) => mutate((s) => resolveEvent(s, i))}
        />
      )}
    </div>
  )
}
