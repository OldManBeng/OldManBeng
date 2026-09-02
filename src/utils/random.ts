/** Seeded RNG (mulberry32), GL2 pattern. All rolls consume the shared seed stream. */
export function makeRng(seed: number) {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(arr: T[]): T => arr[Math.floor(next() * arr.length)],
    chance: (p: number): boolean => next() < p,
  };
}

export function nextSeed(state: { rngSeed: number }): number {
  const v = (state.rngSeed * 1664525 + 1013904223) >>> 0;
  state.rngSeed = v;
  return v;
}
