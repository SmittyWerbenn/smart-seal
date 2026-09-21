// Deterministic seeded RNG so mock data (and thus demo state) is reproducible
// across reloads until the user explicitly resets prototype data.
export function mulberry32(seed: number) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeRng(seed = 42) {
  const rand = mulberry32(seed)
  return {
    float: (min = 0, max = 1) => min + rand() * (max - min),
    int: (min: number, max: number) => Math.floor(min + rand() * (max - min + 1)),
    pick: <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)],
    bool: (probability = 0.5) => rand() < probability,
    id: () => rand().toString(36).slice(2, 10),
  }
}
