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

/** v4.12：照片/自拍变体——由「照片 id + 出现序号」确定性派生。
 *  FNV-1a 纯函数、不消耗主 RNG 流（人生线 moments 块有「不消耗 RNG」约定），
 *  同 key 必同图、跨渲染站点稳定；不同出现大概率不同图。返回 1..6（1=基准图）。 */
export function pickVariant(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 6) + 1;
}
