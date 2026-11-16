import type { GameState } from './types'

const KEY = 'renjian-yanhuo.save.v1'

export function saveGame(s: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, at: Date.now(), state: s }))
    return true
  } catch {
    return false
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.v !== 1 || !parsed.state) return null
    return parsed.state as GameState
  } catch {
    return null
  }
}

export function hasSave() {
  return !!localStorage.getItem(KEY)
}

export function clearSave() {
  localStorage.removeItem(KEY)
}
