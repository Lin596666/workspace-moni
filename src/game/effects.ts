import type { GameState, Attrs, LogEntry } from './types'
import { clamp } from './rng'

export function log(s: GameState, text: string, kind: LogEntry['kind'] = 'info') {
  s.log.push({ id: s.logSeq++, month: s.ageMonths, text, kind })
  if (s.log.length > 400) s.log.splice(0, s.log.length - 400)
}

export function addCash(s: GameState, n: number) {
  s.cash = Math.round(s.cash + n)
}

export function addAttr(s: GameState, k: keyof Attrs, n: number) {
  s.attrs[k] = clamp(Math.round(s.attrs[k] + n))
}

export function addHealth(s: GameState, n: number) {
  s.health = clamp(s.health + n)
}

export function addMood(s: GameState, n: number) {
  s.mood = clamp(s.mood + n)
}

export function addNetwork(s: GameState, n: number) {
  s.network = clamp(s.network + n)
}

export function addFame(s: GameState, n: number) {
  s.fame = clamp(s.fame + n)
}

export function addBizReputation(s: GameState, n: number) {
  if (!s.biz) return
  s.biz.reputation = clamp(s.biz.reputation + n)
}

export function fmtMoney(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(2)}亿`
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(1)}万`
  return `${sign}${abs.toLocaleString('zh-CN')}`
}

export function fmtAge(s: GameState) {
  const years = 18 + Math.floor(s.ageMonths / 12)
  const months = s.ageMonths % 12
  return `${years}岁${months > 0 ? `${months}个月` : ''}`
}
