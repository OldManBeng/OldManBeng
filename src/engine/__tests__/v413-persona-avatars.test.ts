/**
 * v4.13 人设内头像验收。
 *
 * 玩家诉求：每人设 10 款头像（同脸不同穿搭），选人设后从该人设的 10 款里挑；
 * 当前人设默认脸 = #1。实现：PNG 按 public/avatars/{personaId}/avatar-{1..10}.png
 * 组织；avatarId 语义收窄为「当前人设内的序号」；set_persona 切换时重置为 1；
 * 旧存档 migrate 重置为 1（旧全局空间跨人设无意义）。
 *
 * 红线：
 * 1. set_persona 切换后 profile.avatarId === 1（新人设默认脸）。
 * 2. update_profile 仍能改 avatarId 且 clamp 1-10（人设内空间语义）。
 * 3. 旧存档（avatarId=7 等全局空间值）migrate 后 avatarId === 1。
 * 4. PERSONA_AVATARS 每人设恰 10 条、序号 1..10 不重不漏、#1 label = 人设默认脸名。
 */
import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch, PERSONA_MAP } from '../state-machine';
import { PERSONAS } from '../../data/personas';
import { PERSONA_AVATARS } from '../../components/character-art';
import { migrate } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { PERSONA_IDS } from '../../types/persona';

function fresh(seed: number): GameState {
  const s = { ...createInitialState(), rngSeed: seed };
  return dispatch(s, { type: 'new_game', name: '小满', motive: 'debt', personaId: 'wise_sister' });
}

describe('v4.13: 人设内头像', () => {
  it('红线1：set_persona 切换后头像重置为该人设默认脸 #1', () => {
    let s = fresh(11);
    // 先挑一个非 1 的头像
    s = dispatch(s, { type: 'update_profile', avatarId: 5 });
    expect(s.profile.avatarId).toBe(5);
    // 切人设 → 重置
    s = dispatch(s, { type: 'set_persona', personaId: 'femme_fatale' });
    expect(s.personaId).toBe('femme_fatale');
    expect(s.profile.avatarId).toBe(1);
    // 同人设重复 set 是 no-op，不碰头像
    s = dispatch(s, { type: 'update_profile', avatarId: 3 });
    s = dispatch(s, { type: 'set_persona', personaId: 'femme_fatale' });
    expect(s.profile.avatarId).toBe(3);
  });

  it('红线2：update_profile 仍可改头像并 clamp 1-10（人设内空间）', () => {
    let s = fresh(22);
    s = dispatch(s, { type: 'update_profile', avatarId: 7 });
    expect(s.profile.avatarId).toBe(7);
    s = dispatch(s, { type: 'update_profile', avatarId: 99 });
    expect(s.profile.avatarId).toBe(10);
    s = dispatch(s, { type: 'update_profile', avatarId: 0 });
    expect(s.profile.avatarId).toBe(1);
  });

  it('红线3：旧存档 migrate 后 avatarId 重置为 1（全局空间 → 人设内空间）', () => {
    const old = { ...createInitialState(), personaId: 'artistic_soul', profile: { ...createInitialState().profile, avatarId: 7 } };
    const m = migrate(old as GameState);
    expect(m.profile.avatarId).toBe(1);
    expect(m.personaId).toBe('artistic_soul');
    // profile 其他字段保留
    expect(m.profile.ageClaim).toBe(old.profile.ageClaim);
    expect(m.profile.traitId).toBe(old.profile.traitId);
  });

  it('红线4：PERSONA_AVATARS 每人设恰 10 款、序号 1..10、#1 是默认脸名', () => {
    const DEFAULT_LABEL: Record<string, string> = {
      femme_fatale: '御姐款', sweet_daughter: '学妹款', wise_sister: '姐姐款', artistic_soul: '文青款',
    };
    for (const pid of PERSONA_IDS) {
      const list = PERSONA_AVATARS[pid];
      expect(list).toHaveLength(10);
      expect(list.map((a) => a.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(list[0].label).toBe(DEFAULT_LABEL[pid]);
      // 每条 label 非空
      for (const a of list) expect(a.label.trim().length).toBeGreaterThan(0);
      // 人设确实存在（防 typo）
      expect(PERSONA_MAP[pid]).toBeDefined();
      expect(PERSONAS.find((p) => p.id === pid)).toBeDefined();
    }
  });
});
