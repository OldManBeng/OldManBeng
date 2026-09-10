/**
 * v4.12 照片/自拍变体验收。
 *
 * 玩家诉求：同一张照片（photoId/selfieId）不再永远是一张固定图，发送时
 * 随机一点。实现：纯函数哈希 pickVariant(出现key) 在消息/动态生成时算好
 * 存进对象（不消耗主 RNG 流，保种子确定性），渲染按 _v{v} 直查 PNG。
 *
 * 红线：
 * 1. 所有带图消息/动态必有合法 variant ∈[1,6]（1=基准图，2..6=_v2.._v6）。
 * 2. 可复现：同 seed 整局回放，照片变体序列逐条相同。
 * 3. 随机性真实存在：同一 photoId 的多次出现（不同位置/不同 seed）变体
 *    呈多值分布，不是永远同一张。
 * 4. 自拍（post_moment）变体同样生效、同样可复现。
 */
import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch, ALL_TARGET_MAP, targetAwake } from '../state-machine';
import type { GameState } from '../../types/game';
import { CHAT_SESSION_COST } from '../../data/constants';
import { SELFIE_IDS } from '../../types/game';

function fresh(seed: number): GameState {
  const s = { ...createInitialState(), rngSeed: seed };
  return dispatch(s, { type: 'new_game', name: '小满', motive: 'debt', personaId: 'wise_sister' });
}

function validVariant(v: number | undefined): asserts v is number {
  expect(v, '带图消息/动态必须携带 variant').toBeDefined();
  expect(Number.isInteger(v)).toBe(true);
  expect(v).toBeGreaterThanOrEqual(1);
  expect(v).toBeLessThanOrEqual(6);
}

/** 贪心自动跑局（同 simulation）：多聊多触发 maybePushPhoto。 */
function autoPlay(seed: number): GameState {
  let s = fresh(seed);
  let guard = 0;
  while (s.phase === 'main' && guard++ < 500) {
    if (s.dayPhase === 'morning') {
      const mt = s.targets.filter((t) => !t.blocked && t.discoveredDay > 0 && t.lastChatDay !== s.day && targetAwake(ALL_TARGET_MAP[t.targetId], 'morning') && s.energy >= CHAT_SESSION_COST);
      if (mt.length) s = dispatch(s, { type: 'start_chat', targetId: mt[0].targetId });
      else s = dispatch(s, { type: 'enter_night' });
    } else if (s.dayPhase === 'night') {
      const nt = s.targets
        .filter((t) => !t.blocked && t.discoveredDay > 0 && t.lastChatDay !== s.day && targetAwake(ALL_TARGET_MAP[t.targetId], 'night') && s.energy >= CHAT_SESSION_COST)
        .sort((a, b) => b.trust - a.trust);
      if (nt.length) s = dispatch(s, { type: 'start_chat', targetId: nt[0].targetId });
      else s = dispatch(s, { type: 'sleep' });
    } else if (s.dayPhase === 'chat' && s.chat) {
      if (s.chat.awaiting === 'player') {
        s = dispatch(s, { type: 'pick_option', optionIndex: 0 });
      } else {
        s = dispatch(s, { type: 'end_chat' });
      }
    } else break;
  }
  return s;
}

/** 取整局所有「带图」事件：聊天消息（photoId）与朋友圈动态（selfieId/photoId）。 */
function collectShots(s: GameState): { chan: 'msg' | 'moment'; id: string; variant: number }[] {
  const out: { chan: 'msg' | 'moment'; id: string; variant: number }[] = [];
  for (const a of s.archives) {
    for (const m of a.transcript) {
      if (m.photoId) out.push({ chan: 'msg', id: m.photoId, variant: m.variant ?? -1 });
    }
  }
  for (const m of s.moments) {
    const id = m.selfieId ?? m.photoId;
    if (id) out.push({ chan: 'moment', id, variant: m.variant ?? -1 });
  }
  return out;
}

const SEEDS = [11, 22, 33, 44, 55, 66, 77, 88];

describe('v4.12: 照片/自拍变体', () => {
  it('红线1：所有带图消息/动态的 variant ∈[1,6]（旧存档缺省另有兜底）', { timeout: 25000 }, () => {
    let totalShots = 0;
    let minShots = Infinity;
    for (const seed of SEEDS) {
      const s = autoPlay(seed);
      const shots = collectShots(s);
      totalShots += shots.length;
      minShots = Math.min(minShots, shots.length);
      for (const p of shots) validVariant(p.variant);
      expect(shots.some((p) => p.chan === 'msg')).toBe(true);
      expect(shots.some((p) => p.chan === 'moment')).toBe(true);
    }
    // 跨 8 seed 体量充足，最少的一局也发过若干张
    expect(totalShots).toBeGreaterThan(80);
    expect(minShots).toBeGreaterThan(4);
  });

  it('红线2：同 seed 整局回放，变体序列逐条可复现', { timeout: 25000 }, () => {
    for (const seed of SEEDS.slice(0, 3)) {
      const a = collectShots(autoPlay(seed)).map((p) => `${p.chan}:${p.id}:v${p.variant}`);
      const b = collectShots(autoPlay(seed)).map((p) => `${p.chan}:${p.id}:v${p.variant}`);
      expect(a).toEqual(b);
    }
  });

  it('红线3：同一 photoId 多次出现呈多值变体（不永远同图）', { timeout: 25000 }, () => {
    const variantsByPid = new Map<string, Set<number>>();
    for (const seed of SEEDS) {
      for (const p of collectShots(autoPlay(seed))) {
        if (p.chan !== 'msg') continue;
        if (!variantsByPid.has(p.id)) variantsByPid.set(p.id, new Set());
        variantsByPid.get(p.id)!.add(p.variant);
      }
    }
    let qualified = 0;
    let varied = 0;
    for (const vs of variantsByPid.values()) {
      if (vs.size < 3) continue; // 出现太少不判
      qualified++;
      if (vs.size >= 3) varied++;
    }
    // 高频照片（boss_wang/lao_li 等）跨 8 seed 必见 ≥3 种变体。
    expect(qualified).toBeGreaterThanOrEqual(3);
    expect(varied).toBeGreaterThanOrEqual(1);
  });

  it('红线4：自拍 post_moment 变体生效且可复现', () => {
    const run = (seed: number) => {
      let s = fresh(seed);
      const posted: number[] = [];
      for (let d = 1; d <= 10; d++) {
        if (d > 1) s = dispatch(s, { type: 'sleep' });
        s = dispatch(s, { type: 'post_moment', selfieId: SELFIE_IDS[(d + seed) % SELFIE_IDS.length] });
        const post = s.moments.find((m) => m.author === 'player' && m.momentDay === d);
        validVariant(post!.variant);
        posted.push(post!.variant!);
      }
      return posted;
    };
    for (const seed of SEEDS.slice(0, 4)) {
      const a = run(seed);
      const b = run(seed);
      expect(a).toEqual(b); // 可复现
      expect(new Set(a).size).toBeGreaterThanOrEqual(2); // 10 天里不止一种变体
    }
  });
});