import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch, TARGET_MAP, ALL_TARGET_MAP } from '../state-machine';
import { epilogueFor, finalEpilogues } from '../epilogues';
import { ALL_TARGETS } from '../../data/target-library';
import type { GameState } from '../../types/game';
import type { TargetState } from '../../types/target';

function freshRun(seed: number): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId: 'wise_sister' });
  return s;
}

/** 该 targetId 的出厂状态 + 覆盖（构造任意终局形态）。 */
function shapeOf(id: string, over: Partial<TargetState>): TargetState {
  const base = createInitialState().targets.find((t) => t.targetId === id)!;
  return { ...base, ...over };
}

describe('v4.1.1: 结局屏后记（库人物 P0 崩溃回归）', () => {
  it('崩溃根因钉板：TARGET_MAP 只含主五人，库人物只有 ALL_TARGET_MAP 能解析', () => {
    expect(Object.keys(TARGET_MAP).sort()).toEqual(['boss_wang', 'chen_gong', 'hao_ge', 'lao_li', 'zhou_teacher']);
    expect(TARGET_MAP['g1']).toBeUndefined();
    expect(ALL_TARGET_MAP['g1']).toBeTruthy();
    expect(ALL_TARGET_MAP['f8']).toBeTruthy();
  });

  it('修复验收：认识过库人物的一局，「他们后来」的每一个人都可解析、后记非空', () => {
    const s = freshRun(71);
    // 模拟计划偶遇入册三个库人物（保安/钓友/棋友）。
    for (const id of ['g1', 'f8', 'c4']) {
      s.targets.find((t) => t.targetId === id)!.discoveredDay = s.day;
    }
    const entries = finalEpilogues(s);
    expect(entries.length).toBe(8); // 主五人（开局即认识）+ 3 个库人物
    for (const e of entries) {
      expect(e.def, `${e.t.targetId} 解析失败——结局屏会白屏`).toBeTruthy();
      const line = epilogueFor(e.def, e.t);
      expect(line.length, `${e.t.targetId} 后记为空`).toBeGreaterThan(4);
    }
  });

  it('没认识过的人不出现在「他们后来」——陌生人的后来与你无关', () => {
    const s = freshRun(72);
    const entries = finalEpilogues(s);
    expect(entries.length).toBe(5); // 只有主五人
    expect(entries.every((e) => e.t.discoveredDay > 0)).toBe(true);
  });

  it('全 50 人 × 六种终局形态（走了/拉黑/掏空/白嫖/浅交/陌生）后记全部不抛不空', () => {
    for (const def of ALL_TARGETS) {
      const shapes: Partial<TargetState>[] = [
        { ended: 'walked_away', blocked: true, trust: 0, totalReceived: 300 },
        { blocked: true, trust: 10, totalReceived: 0 },
        { trust: 80, totalReceived: 1200, timesPaid: 5, stage: 'harvest' },
        { trust: 80, totalReceived: 0 },
        { trust: 45, totalReceived: 60, timesPaid: 2, stage: 'trusted' },
        { trust: 8, totalReceived: 0 },
      ];
      for (const over of shapes) {
        const line = epilogueFor(def, shapeOf(def.id, over));
        expect(typeof line).toBe('string');
        expect(line.length, `${def.id} ${JSON.stringify(over)}`).toBeGreaterThan(4);
      }
    }
  });

  it('主五人专属声口原样保留（抽纯函数不动文案）', () => {
    const li = epilogueFor(ALL_TARGET_MAP['lao_li'], shapeOf('lao_li', { trust: 80, totalReceived: 500 }));
    expect(li).toContain('夜班电台');
    const chen = epilogueFor(ALL_TARGET_MAP['chen_gong'], shapeOf('chen_gong', { ended: 'walked_away' }));
    expect(chen).toContain('7. 终');
  });

  it('库人物兜底行与结局归档状态同声：高信任没给过钱的保安走「他在等的不是这个」', () => {
    const line = epilogueFor(ALL_TARGET_MAP['g1'], shapeOf('g1', { trust: 80, totalReceived: 0 }));
    expect(line).toContain('老铁');
    expect(line).toContain('一分钱没给过');
  });
});
