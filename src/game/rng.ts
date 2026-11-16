/** 确定性随机数：同一个 seed + 游标 → 同一个结果，存档可复现。 */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function nextRandom(seed: number, cursor: number): [number, number] {
  const rnd = mulberry32(seed + cursor * 2654435761)
  return [rnd(), cursor + 1]
}

export function rand(seed: number, cursor: number) {
  return nextRandom(seed, cursor)[0]
}

export function randInt(seed: number, cursor: number, min: number, max: number) {
  const [v, c] = nextRandom(seed, cursor)
  return [Math.floor(min + v * (max - min + 1)), c] as [number, number]
}

export function pick<T>(list: T[], r: number): T {
  return list[Math.floor(r * list.length) % list.length]
}

export function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}
