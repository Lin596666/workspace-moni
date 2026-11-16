import type { GameEvent } from '../game/types'

export default function EventModal({
  event,
  onChoose,
}: {
  event: GameEvent
  onChoose: (index: number) => void
}) {
  return (
    <div className="mask">
      <div className="modal">
        <div className="ev-emoji">{event.emoji}</div>
        <h3>{event.title}</h3>
        <p>{event.text}</p>
        <div className="choices">
          {event.choices.map((c, i) => (
            <button key={i} className="btn" onClick={() => onChoose(i)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
