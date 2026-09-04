import { describe, it, expect } from 'vitest';
import { askChance, replyMultiplier, resolveAsk } from '../../engine/chat';
import { TARGETS } from '../../data/targets';
import { createInitialState } from '../../engine/state-machine';
import type { TargetState } from '../../types/target';

const laoLi = TARGETS[0];

function tstate(over: Partial<TargetState> = {}): TargetState {
  return {
    targetId: 'lao_li',
    trust: 50,
    wariness: 10,
    stage: 'trusted',
    daysSilent: 0,
    pendingChain: '',
    totalReceived: 0,
    timesPaid: 0,
    daysSincePaid: 99,
    lastChatDay: 0,
    discoveredDay: 1,
    pingedToday: false,
    recentPacks: [],
    recentGreetingIdx: -1,
    recentPhotoIdx: -1,
    blocked: false,
    ended: null,
    ...over,
  };
}

describe('balance: ask chance curve', () => {
  it('early asks are a coin flip at best', () => {
    expect(askChance(laoLi, tstate({ trust: 20, wariness: 10, stage: 'warming' }))).toBeLessThanOrEqual(0.4);
  });

  it('well-farmed asks reach 50-70%', () => {
    const p = askChance(laoLi, tstate({ trust: 85, wariness: 20, stage: 'harvest' }));
    expect(p).toBeGreaterThanOrEqual(0.5);
    expect(p).toBeLessThanOrEqual(0.75);
  });

  it('high wariness kills the ask outright', () => {
    expect(askChance(laoLi, tstate({ trust: 90, wariness: 70 }))).toBe(0);
  });

  it('lonely targets are easier', () => {
    const base = askChance(laoLi, tstate({ trust: 50, wariness: 20 }));
    expect(base).toBeGreaterThan(0.3);
  });
});

describe('balance: persona matching', () => {
  it('wise sister matches listened_to ×2 with caring style ×2', () => {
    const m = replyMultiplier(laoLi, tstate(), 'caring', 'wise_sister');
    expect(m).toBe(4); // need 2 × style 2
  });

  it('femme fatale flops on a listened_to target', () => {
    // need 0.6 × bad-persona 0.3 × non-preferred style 1 = 0.18
    const m = replyMultiplier(laoLi, tstate(), 'flirty', 'femme_fatale');
    expect(m).toBeCloseTo(0.18, 5);
    // While the right persona on the right style quadruples:
    const good = replyMultiplier(laoLi, tstate(), 'caring', 'wise_sister');
    expect(good / m).toBeGreaterThan(10);
  });
});

describe('balance: packet tiers scale with stage', () => {
  it('harvest packets average >100', () => {
    const s = createInitialState();
    let total = 0;
    let n = 0;
    for (let i = 0; i < 200; i++) {
      const r = resolveAsk(s, laoLi, tstate({ trust: 85, wariness: 10, stage: 'harvest' }));
      if (r.success) { total += r.amount; n++; }
    }
    expect(total / n).toBeGreaterThan(100);
  });

  it('warming packets average under 40', () => {
    const s = createInitialState();
    let total = 0;
    let n = 0;
    for (let i = 0; i < 200; i++) {
      const r = resolveAsk(s, laoLi, tstate({ trust: 30, wariness: 10, stage: 'warming' }));
      if (r.success) { total += r.amount; n++; }
    }
    expect(total / n).toBeLessThan(40);
  });
});
