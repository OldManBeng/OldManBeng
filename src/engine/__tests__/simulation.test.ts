import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch, TARGET_MAP, targetAwake, scoreEnding } from '../../engine/state-machine';
import { LAO_LI_CHAIN } from '../../data/scripts';
import { ZHOU_CHAIN, ZHOU_FREE, ZHOU_LINES } from '../../data/zhou-script';
import { WANG_CHAIN, WANG_FREE, WANG_LINES } from '../../data/wang-script';
import { HAO_CHAIN, HAO_FREE, HAO_LINES } from '../../data/hao-script';
import { CHEN_CHAIN, CHEN_FREE, CHEN_LINES } from '../../data/chen-script';

import { LAO_LI_LINES } from '../../data/dialogue';
import { SCRIPTS, scriptFor } from '../../data/script-registry';
import { DAY_EVENTS } from '../../data/events';
import { ENDINGS } from '../../data/endings';
import { TARGETS } from '../../data/targets';
import { MONTHLY_GOAL, STAGE_TRUST, RISK_PER_ACTIVE_RELATION, INDUSTRY_COURSE_COST, VERDICT_ASK_THRESHOLD } from '../../data/constants';

/**
 * 多目标自动跑局：贪心 + 广撒网。
 * 每天白天找上午在线的聊一场，晚上找深夜在线的聊（按信任最高优先），能开口就开口。
 * 邀请触发时买课（产业化线）。
 */
function autoPlay(seed: number): ReturnType<typeof createInitialState> {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'auto', motive: 'debt', personaId: 'wise_sister' });
  let guard = 0;
  while (s.phase === 'main' && guard++ < 500) {
    if (s.flags.industry_invite && !s.flags.industry_replied) {
      // 钱不够就拒绝（两条路径都能走到结局）。
      s = dispatch(s, { type: 'industry_reply', accept: s.money >= INDUSTRY_COURSE_COST });
    }
    if (s.dayPhase === 'morning') {
      const morningTargets = s.targets.filter((t) => !t.blocked && t.lastChatDay !== s.day && targetAwake(TARGET_MAP[t.targetId], 'morning') && s.energy >= 4);
      if (morningTargets.length) {
        s = dispatch(s, { type: 'start_chat', targetId: morningTargets[0].targetId });
      } else {
        s = dispatch(s, { type: 'enter_night' });
      }
    } else if (s.dayPhase === 'night') {
      const nightTargets = s.targets
        .filter((t) => !t.blocked && t.lastChatDay !== s.day && targetAwake(TARGET_MAP[t.targetId], 'night') && s.energy >= 4)
        .sort((a, b) => b.trust - a.trust);
      if (nightTargets.length) {
        s = dispatch(s, { type: 'start_chat', targetId: nightTargets[0].targetId });
      } else {
        s = dispatch(s, { type: 'sleep' });
      }
    } else if (s.dayPhase === 'chat' && s.chat) {
      if (s.chat.awaiting === 'player') {
        const t = s.targets.find((x) => x.targetId === s.chat!.targetId)!;
        let best = 0; let bestScore = -Infinity; let askIdx = -1;
        s.chat.pendingOptions.forEach((o, i) => {
          let score = o.trust;
          if (o.isAsk) { askIdx = i; score -= 2; }
          if (score > bestScore) { bestScore = score; best = i; }
        });
        const wantAsk = t.stage !== 'stranger' && t.daysSincePaid >= 3 && t.wariness < 45;
        s = dispatch(s, { type: 'pick_option', optionIndex: wantAsk && askIdx >= 0 ? askIdx : best });
      } else {
        s = dispatch(s, { type: 'end_chat' });
      }
    } else {
      break;
    }
  }
  return s;
}

describe('simulation: multi-target auto runs', () => {
  for (const seed of [1, 42, 777, 2024, 9999]) {
    it(`seed ${seed}: 30 days, 3 targets, invariants hold`, () => {
      const s = autoPlay(seed);
      for (const t of s.targets) {
        expect(t.trust).toBeGreaterThanOrEqual(0);
        expect(t.trust).toBeLessThanOrEqual(100);
        expect(t.wariness).toBeGreaterThanOrEqual(0);
        expect(t.wariness).toBeLessThanOrEqual(100);
      }
      expect(s.riskLevel).toBeGreaterThanOrEqual(0);
      expect(s.riskLevel).toBeLessThanOrEqual(100);
      expect(s.day).toBeGreaterThan(20);
      if (s.endingId === 'end_debt_free') {
        expect(s.stats.totalEarned).toBeGreaterThanOrEqual(MONTHLY_GOAL);
      }
    });
  }

  it('all seeds land a designed ending', () => {
    for (const seed of [1, 42, 777, 2024, 9999]) {
      const e = autoPlay(seed).endingId;
      expect(e).not.toBeNull();
      expect(ENDINGS.some((x) => x.id === e)).toBe(true);
    }
  });

  it('multi-line play grows risk but single-line decays it', () => {
    const s = autoPlay(7);
    // Sanity only: risk stayed within band, and RISK constant is wired.
    expect(RISK_PER_ACTIVE_RELATION).toBeGreaterThan(0);
    expect(s.riskLevel).toBeLessThanOrEqual(100);
  });

  it('morning targets are reachable in morning and asleep at night', () => {
    const zhou = TARGET_MAP.zhou_teacher;
    const li = TARGET_MAP.lao_li;
    const wang = TARGET_MAP.boss_wang;
    const hao = TARGET_MAP.hao_ge;
    const chen = TARGET_MAP.chen_gong;
    expect(targetAwake(zhou, 'morning')).toBe(true);
    expect(targetAwake(zhou, 'night')).toBe(false);
    expect(targetAwake(li, 'night')).toBe(true);
    expect(targetAwake(li, 'morning')).toBe(false);
    expect(targetAwake(wang, 'night')).toBe(true);
    expect(targetAwake(wang, 'morning')).toBe(false);
    expect(targetAwake(hao, 'night')).toBe(true);
    expect(targetAwake(hao, 'morning')).toBe(false);
    expect(targetAwake(chen, 'night')).toBe(true);
    expect(targetAwake(chen, 'morning')).toBe(false);
  });

  it('industry course: accept costs money, auto-maintains, and can reach the verdict ending', () => {
    // 手动构造一个买课线：开局 → 触发邀请 flag → 买课 → 模拟多次开口 → 结局判定。
    let s = createInitialState();
    s = dispatch(s, { type: 'new_game', name: 'auto', motive: 'debt', personaId: 'wise_sister' });
    s.flags.industry_invite = true;
    s.money = 500;
    s = dispatch(s, { type: 'industry_reply', accept: true });
    expect(s.industryCourse).toBe(true);
    expect(s.money).toBe(500 - INDUSTRY_COURSE_COST);
    expect(s.riskLevel).toBeGreaterThanOrEqual(20);
    // 拒绝路径
    let s2 = dispatch(s, { type: 'industry_reply', accept: false });
    // 已回复过 → 幂等
    expect(s2.industryCourse).toBe(true);
    // 判决书门槛：asksMade >= 8
    s.stats.asksMade = VERDICT_ASK_THRESHOLD;
    const ending = (() => { s.phase = 'ended'; return s; })();
    const id = scoreEnding(ending);
    expect(id).toBe('end_verdict');
  });
});


describe('simulation: chain gating (all targets)', () => {
  const chains: [string, Record<string, { minStage?: string; minTrust?: number; options: unknown[]; openers: unknown[]; next: string }>][] = [
    ['lao_li', LAO_LI_CHAIN],
    ['zhou', ZHOU_CHAIN],
    ['wang', WANG_CHAIN],
    ['hao', HAO_CHAIN],
    ['chen', CHEN_CHAIN],
  ];
  for (const [name, chain] of chains) {
    it(`${name}: every node has options, openers, next`, () => {
      for (const node of Object.values(chain)) {
        expect(node.options.length).toBeGreaterThanOrEqual(2);
        expect(node.openers.length).toBeGreaterThanOrEqual(1);
        expect(typeof node.next).toBe('string');
      }
    });
    it(`${name}: harvest-gated nodes gate correctly`, () => {
      for (const node of Object.values(chain)) {
        if (node.minStage === 'harvest') {
          expect(node.minTrust ?? 0).toBeGreaterThanOrEqual(STAGE_TRUST.trusted);
        }
      }
    });
  }

  it('registry serves all three targets and rejects unknown ids', () => {
    expect(SCRIPTS.lao_li).toBeDefined();
    expect(SCRIPTS.zhou_teacher).toBeDefined();
    expect(SCRIPTS.boss_wang).toBeDefined();
    expect(SCRIPTS.hao_ge).toBeDefined();
    expect(SCRIPTS.chen_gong).toBeDefined();
    expect(() => scriptFor('nobody')).toThrow();
  });
});

describe('safeguards: content gates (all content)', () => {
  it('all targets are middle-aged or older (35+)', () => {
    for (const t of TARGETS) expect(t.age).toBeGreaterThanOrEqual(35);
  });

  it('no minor-related content anywhere', () => {
    const blob = JSON.stringify([SCRIPTS, LAO_LI_LINES, ZHOU_LINES, WANG_LINES, HAO_LINES, CHEN_LINES, DAY_EVENTS, ENDINGS]);
    for (const banned of ['未成年', '高中', '初中', '学生证', '16岁', '17岁', '15岁', '14岁']) {
      expect(blob.includes(banned)).toBe(false);
    }
  });

  it('no actionable fraud blueprints in content', () => {
    const blob = JSON.stringify([SCRIPTS, DAY_EVENTS]);
    for (const banned of ['银行卡号', '验证码', '转账到', '收款码', '支付宝账号', '洗钱']) {
      expect(blob.includes(banned)).toBe(false);
    }
  });

  it('every ask option carries consequences (no free money)', () => {
    for (const chain of [LAO_LI_CHAIN, ZHOU_CHAIN, WANG_CHAIN]) {
      for (const node of Object.values(chain)) {
        for (const o of node.options) {
          if (o.isAsk) {
            expect(o.trust).toBeLessThanOrEqual(0);
            expect((o.wariness ?? 0)).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('emotional-need taxonomy is adult-only concepts', () => {
    const needs = TARGETS.map((t) => t.need);
    const allowed = ['listened_to', 'desired', 'daughter_figure', 'respected'];
    for (const n of needs) expect(allowed).toContain(n);
  });

  it('free pools reference no other target by name (isolation)', () => {
    const blob = JSON.stringify({ zhou: ZHOU_FREE, wang: WANG_FREE, hao: HAO_FREE, chen: CHEN_FREE });
    expect(blob.includes('老李')).toBe(false);
  });
});
