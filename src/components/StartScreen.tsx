import { useState } from 'react'
import type { Gender, Origin, StartOptions } from '../game/types'

interface Props {
  onStart: (opts: StartOptions, college: boolean) => void
  onSim?: () => void
}

const ORIGINS: { id: Origin; label: string; emoji: string; desc: string }[] = [
  { id: 'city', label: '省会城市', emoji: '🏙️', desc: '家里有套房，起点体面' },
  { id: 'county', label: '县城', emoji: '🏘️', desc: '父母在体制内或做小生意' },
  { id: 'rural', label: '农村', emoji: '🌾', desc: '底子薄，但身体好、能吃苦' },
]

export default function StartScreen({ onStart, onSim }: Props) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('男')
  const [origin, setOrigin] = useState<Origin>('county')
  const [college, setCollege] = useState(true)

  const start = () => {
    const finalName = name.trim() || (gender === '男' ? '陈默' : '林小满')
    onStart({ name: finalName, gender, origin }, college)
  }

  return (
    <div className="app start">
      <div className="brand">
        <h1>人间烟火</h1>
        <div className="sub">中国式人生 · 经营模拟</div>
        <div className="seal">从十八岁开始</div>
      </div>

      <div className="card">
        <div className="field">
          <div className="field-label">姓名</div>
          <input
            className="text-input"
            placeholder={gender === '男' ? '陈默' : '林小满'}
            value={name}
            maxLength={8}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <div className="field-label">性别</div>
          <div className="seg">
            {(['男', '女'] as Gender[]).map((g) => (
              <div
                key={g}
                className={`opt ${gender === g ? 'active' : ''}`}
                onClick={() => setGender(g)}
              >
                <span className="em">{g === '男' ? '👨' : '👩'}</span>
                {g}
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-label">出身</div>
          <div className="seg">
            {ORIGINS.map((o) => (
              <div
                key={o.id}
                className={`opt ${origin === o.id ? 'active' : ''}`}
                onClick={() => setOrigin(o.id)}
              >
                <span className="em">{o.emoji}</span>
                {o.label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
            {ORIGINS.find((o) => o.id === origin)!.desc}
          </div>
        </div>

        <div className="field">
          <div className="field-label">高考之后</div>
          <div className="seg">
            <div className={`opt ${college ? 'active' : ''}`} onClick={() => setCollege(true)}>
              上大学（四年）
            </div>
            <div className={`opt ${!college ? 'active' : ''}`} onClick={() => setCollege(false)}>
              直接打工
            </div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={start}>
          开始这一生
        </button>

        {onSim && (
          <button
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: 8 }}
            onClick={onSim}
          >
            🏠 先进屋看看（实时生活 Demo）
          </button>
        )}
      </div>

      <div className="tip">每个选择都会留下痕迹，每个时代都会推你一把</div>
    </div>
  )
}
