import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CATALOG,
  GRID_H,
  GRID_W,
  NEEDS,
  TH,
  TW,
  clockText,
  createSim,
  objDef,
  place,
  sendTo,
  tickSim,
  workShift,
} from './sim'
import type { Sim } from './sim'

interface Props {
  onExit: () => void
}

const HALF_W = TW / 2
const HALF_H = TH / 2

/** 等距投影：瓦片左上顶点 */
function iso(tx: number, ty: number) {
  return { x: (tx - ty) * HALF_W, y: (tx + ty) * HALF_H }
}

function needColor(v: number) {
  if (v > 60) return 'var(--green)'
  if (v > 30) return 'var(--gold)'
  return 'var(--red)'
}

export default function SimScreen({ onExit }: Props) {
  const simRef = useRef<Sim>(createSim())
  const [, setFrame] = useState(0)
  const [build, setBuild] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      const dt = Math.min(0.2, (now - last) / 1000)
      last = now
      tickSim(simRef.current, dt)
      acc += dt
      if (acc > 0.05) {
        acc = 0
        setFrame((f) => f + 1)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const sim = simRef.current
  const bump = () => setFrame((f) => f + 1)

  const tiles = useMemo(() => {
    const list: { x: number; y: number }[] = []
    for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) list.push({ x, y })
    return list
  }, [])

  const entities = useMemo(() => {
    const arr: { key: string; tx: number; ty: number; kind: 'obj' | 'agent'; uid?: string; emoji: string }[] =
      sim.objs.map((o) => ({
        key: o.uid,
        tx: o.x,
        ty: o.y,
        kind: 'obj' as const,
        uid: o.uid,
        emoji: objDef(o.defId).emoji,
      }))
    arr.push({
      key: 'agent',
      tx: sim.agent.x,
      ty: sim.agent.y,
      kind: 'agent' as const,
      emoji: '🧑',
    })
    return arr.sort((a, b) => a.tx + a.ty - (b.tx + b.ty))
  }, [sim, sim.agent.x, sim.agent.y, sim.objs.length, sim.objs.map((o) => o.uid).join()])

  const usingDef = sim.agent.usingUid
    ? objDef(sim.objs.find((o) => o.uid === sim.agent.usingUid)!.defId)
    : null

  const setSpeed = (v: number) => {
    sim.speed = v
    bump()
  }

  const onTileClick = (tx: number, ty: number) => {
    if (build && picked) {
      place(sim, picked, tx, ty)
      bump()
      return
    }
  }

  return (
    <div className="app sim">
      <div className="row between" style={{ marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>我的小屋</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: 1 }}>
            第 {sim.day} 天 · {clockText(sim)}
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="money-pill">￥{sim.money}</span>
          <button className="btn btn-ghost btn-sm" onClick={onExit}>
            返回
          </button>
        </div>
      </div>

      <div className="speed-bar">
        {[
          { v: 0, label: '⏸' },
          { v: 1, label: '1×' },
          { v: 2, label: '2×' },
          { v: 4, label: '4×' },
        ].map((b) => (
          <button
            key={b.v}
            className={`speed ${sim.speed === b.v ? 'active' : ''}`}
            onClick={() => setSpeed(b.v)}
          >
            {b.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          className={`speed ${build ? 'active' : ''}`}
          onClick={() => {
            setBuild(!build)
            setPicked(null)
            bump()
          }}
        >
          🛒 建造
        </button>
        <button
          className={`speed ${sim.auto ? 'active' : ''}`}
          title="自由意志：需求见底时自己去找东西用"
          onClick={() => {
            sim.auto = !sim.auto
            bump()
          }}
        >
          🧠
        </button>
      </div>

      <div className="room-wrap">
        <svg
          className="room"
          viewBox="-40 -30 640 430"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="floorPat" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="none" />
            </pattern>
          </defs>
          <g transform="translate(288, 40)">
            {tiles.map((t) => {
              const { x, y } = iso(t.x, t.y)
              const isWalk = (t.x + t.y) % 2 === 0
              return (
                <polygon
                  key={`f${t.x}-${t.y}`}
                  points={`${x},${y} ${x + HALF_W},${y + HALF_H} ${x},${y + TH} ${x - HALF_W},${y + HALF_H}`}
                  fill={isWalk ? '#efe4cf' : '#e7dbc4'}
                  stroke="#d8c9ac"
                  strokeWidth="1"
                  style={{ cursor: build && picked ? 'copy' : 'default' }}
                  onClick={() => onTileClick(t.x, t.y)}
                />
              )
            })}

            {entities.map((e) => {
              const { x, y } = iso(e.tx, e.ty)
              const cx = x
              const cy = y + HALF_H
              if (e.kind === 'agent') {
                return (
                  <g key={e.key}>
                    <ellipse cx={cx} cy={cy + 4} rx={13} ry={6} fill="rgba(44,38,32,.16)" />
                    <circle cx={cx} cy={cy - 20} r={16} fill="#b8452f" opacity="0.92" />
                    <text
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      fontSize="20"
                      style={{ userSelect: 'none' }}
                    >
                      {e.emoji}
                    </text>
                    {sim.agent.path.length > 0 && (
                      <circle cx={cx} cy={cy - 20} r={20} fill="none" stroke="#b8452f" strokeDasharray="3 3" />
                    )}
                  </g>
                )
              }
              const obj = sim.objs.find((o) => o.uid === e.uid)!
              const isUsing = sim.agent.usingUid === e.uid
              return (
                <g
                  key={e.key}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (build) return
                    sendTo(sim, obj.uid)
                    bump()
                  }}
                >
                  <ellipse cx={cx} cy={cy + 4} rx={18} ry={8} fill="rgba(44,38,32,.12)" />
                  {isUsing && (
                    <rect
                      x={cx - 20}
                      y={cy - 46}
                      width={40}
                      height={40}
                      rx={10}
                      fill="#fff8ea"
                      stroke="var(--gold)"
                    />
                  )}
                  <text
                    x={cx}
                    y={cy - 6}
                    textAnchor="middle"
                    fontSize="26"
                    style={{ userSelect: 'none' }}
                  >
                    {e.emoji}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {usingDef && (
        <div className="using-tip">
          正在{usingDef.name} · 恢复{NEEDS.find((n) => n.id === usingDef.need)!.label}
        </div>
      )}

      <div className="card needs">
        {NEEDS.map((n) => (
          <div key={n.id} className="need-row">
            <span className="need-em">{n.emoji}</span>
            <span className="need-label">{n.label}</span>
            <div className="need-track">
              <div
                className="need-fill"
                style={{ width: `${sim.needs[n.id]}%`, background: needColor(sim.needs[n.id]) }}
              />
            </div>
            <span className="need-val">{Math.round(sim.needs[n.id])}</span>
          </div>
        ))}
      </div>

      {build && (
        <div className="card">
          <p className="card-title">建造 · 选一件，再点地面 {picked ? '（已选）' : ''}</p>
          <div className="shop">
            {CATALOG.map((c) => (
              <button
                key={c.id}
                className={`shop-item ${picked === c.id ? 'active' : ''}`}
                disabled={sim.money < c.price}
                onClick={() => {
                  setPicked(c.id)
                  bump()
                }}
              >
                <span className="em">{c.emoji}</span>
                <span className="t">{c.name}</span>
                <span className="p">￥{c.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dock">
        <button className="btn btn-ghost" onClick={() => setSpeed(sim.speed === 0 ? 1 : 0)}>
          {sim.speed === 0 ? '继续' : '暂停'}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            workShift(sim)
            bump()
          }}
        >
          去上班（8小时）
        </button>
      </div>

      <div className="card">
        <p className="card-title">生活流水</p>
        <div className="log">
          {[...sim.log].reverse().map((l) => (
            <div key={l.id} className="log-item">
              <span className="log-time">{l.id}</span>
              <span className={`log-${l.kind}`}>{l.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tip">点击家具让角色过去使用 · 需求见底会难受</div>
    </div>
  )
}
