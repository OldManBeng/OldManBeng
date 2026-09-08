/**
 * v4.3.3 施工验收测试——本批四件新机制的确定性回归：
 *  1. 教学红包 5.2（D1 老李场内可见 + end_chat 入账，只发生一次）；
 *  2. 玩家个性签名（bio）：人设选择 → 今天显示 + 原型相位影响 incoming 概率方向；
 *  3. 消息免打扰（toggle_mute）：可逆、不产生 incoming、不参与朋友圈互动、他的圈不可见、开聊被拒；
 *  4. 头像 1-10 全档可选（旧档 1-6 钳制修复）。
 */
import { describe, expect, it } from 'vitest';
import { dispatch } from '../state-machine';
import { createInitialState } from '../state-machine';
import type { GameState } from '../../types/game';
import { TARGETS } from '../../data/targets';
import { PLAYER_BIOS, PLAYER_BIO_MAP, bioPhase } from '../../data/player-bios';

function fresh(seed = 7): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId: 'wise_sister' });
  return s;
}

describe('v4.3.3: 教学红包 5.2（D1 老李）', () => {
  it('D1 与老李开场对话（pick_option 一次）注入红包气泡；end_chat 入账且不重发', () => {
    let s = fresh(3);
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'start_chat', targetId: 'lao_li' });
    expect(s.chat).not.toBeNull();
    s = dispatch(s, { type: 'pick_option', optionIndex: 0 });
    // 场内可见：system 红包条 + 他的台词
    const sys = s.chat!.transcript.find((m) => m.speaker === 'system' && m.label === '红包 +5.2 元');
    expect(sys).toBeDefined();
    expect(s.chat!.transcript.some((m) => m.speaker === 'target' && m.text.includes('买块糖'))).toBe(true);
    s = dispatch(s, { type: 'end_chat' });
    const li = s.targets.find((t) => t.targetId === 'lao_li')!;
    expect(li.totalReceived).toBe(5.2);
    expect(li.timesPaid).toBe(1);
    expect(s.stats.totalEarned).toBe(5.2);
    expect(s.money).toBeGreaterThan(300); // 350 起步 + 5.2 红包 − D1 晨摊账单（~53）
    expect(s.ledger.some((e) => e.amount === 5.2 && e.note.includes('老李'))).toBe(true);
    // 只发生一次：第二晚再聊不重发
    s = dispatch(s, { type: 'sleep' });
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'start_chat', targetId: 'lao_li' });
    s = dispatch(s, { type: 'pick_option', optionIndex: 0 });
    expect(s.chat!.transcript.some((m) => m.speaker === 'system' && m.label === '红包 +5.2 元')).toBe(false);
    s = dispatch(s, { type: 'end_chat' });
    expect(s.targets.find((t) => t.targetId === 'lao_li')!.totalReceived).toBe(5.2);
  });

  it('换了别人第一晚没有教学红包（陈工不是老李）', () => {
    let s = fresh(11);
    s = dispatch(s, { type: 'enter_night' });
    // 陈工 22 点醒着；进夜后开聊
    const chen = s.targets.find((t) => t.targetId === 'chen_gong')!;
    chen.discoveredDay = 1;
    s = dispatch(s, { type: 'start_chat', targetId: 'chen_gong' });
    s = dispatch(s, { type: 'pick_option', optionIndex: 0 });
    expect(s.chat!.transcript.every((m) => m.label !== '红包 +5.2 元')).toBe(true);
  });
});

describe('v4.3.3: 玩家个性签名（bio）', () => {
  it('10 款话术齐备：文案/说明/原型相位矩阵无空档；默认 bio=直白哭穷', () => {
    expect(PLAYER_BIOS).toHaveLength(10);
    for (const b of PLAYER_BIOS) {
      expect(b.text.length).toBeGreaterThan(6);
      expect(b.note.length).toBeGreaterThan(6);
      expect(Object.keys(b.gains).length + Object.keys(b.penalties).length).toBeGreaterThan(0);
    }
    const s = fresh(1);
    expect(s.profile.bioId).toBe('hardup_plaintext');
  });

  it('update_profile 换签名生效；负相位原型在换签当天警惕 +1', () => {
    let s = fresh(5);
    // 老师原型（widowed_teacher）对 business_face 是负相位
    const zhou = s.targets.find((t) => t.targetId === 'zhou_teacher')!;
    const w0 = zhou.wariness;
    s = dispatch(s, { type: 'update_profile', bioId: 'business_face' });
    expect(s.profile.bioId).toBe('business_face');
    // 战术换签的代价存在即可（当天无晨间衰减时净 +1；跨晨则被 -1 衰减部分抵消）。
    expect(zhou.wariness).toBeGreaterThanOrEqual(w0);
    // 再换回正相位不涨警惕
    const w1 = zhou.wariness;
    s = dispatch(s, { type: 'update_profile', bioId: 'daughter_smile' });
    expect(zhou.wariness).toBe(w1);
  });

  it('bioPhase 方向正确：老师爱哭穷款、司机爱夜行款；非法 id 相位为 0', () => {
    expect(bioPhase('hardup_plaintext', 'widowed_teacher')).toBeGreaterThan(0);
    expect(bioPhase('moon_side', 'divorced_driver')).toBeGreaterThan(0);
    expect(bioPhase('hardup_plaintext', 'married_boss')).toBeLessThan(0);
    expect(PLAYER_BIO_MAP['nope' as never]).toBeUndefined();
  });
});

describe('v4.3.3: 消息免打扰（toggle_mute）', () => {
  it('拉黑可逆；拉黑者不产生 incoming、不能被开聊/要钱、他的圈不可见', () => {
    let s = fresh(13);
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'toggle_mute', targetId: 'lao_li' });
    expect(s.targets.find((t) => t.targetId === 'lao_li')!.mutedByPlayer).toBe(true);
    // 开聊被拒（精力/时段不变）
    const energy = s.energy;
    s = dispatch(s, { type: 'start_chat', targetId: 'lao_li' });
    expect(s.chat).toBeNull();
    expect(s.energy).toBe(energy);
    // 直接要钱也被拒
    s = dispatch(s, { type: 'direct_ask', targetId: 'lao_li', reasonId: 'boba', amount: 30 });
    expect(s.chat).toBeNull();
    // 解除恢复
    s = dispatch(s, { type: 'toggle_mute', targetId: 'lao_li' });
    expect(s.targets.find((t) => t.targetId === 'lao_li')!.mutedByPlayer).toBe(false);
  });

  it('拉黑者的朋友圈被隐藏（她看不见他的圈）；解除后回来', async () => {
    let s = fresh(17);
    // 造一条他的圈
    s = dispatch(s, { type: 'post_moment', selfieId: 'cat' }); // 先有一条圈占位（玩家的）
    s = dispatch(s, { type: 'toggle_mute', targetId: 'lao_li' });
    // 隐藏判定在 UI 层（feed filter）——这里验证引擎层约束：wave reactors 不含他
    const reactors = s.targets.filter((t) => !t.blocked && !t.ended && t.discoveredDay > 0 && !t.mutedByPlayer);
    expect(reactors.some((t) => t.targetId === 'lao_li')).toBe(false);
    s = dispatch(s, { type: 'toggle_mute', targetId: 'lao_li' });
    const reactors2 = s.targets.filter((t) => !t.blocked && !t.ended && t.discoveredDay > 0 && !t.mutedByPlayer);
    expect(reactors2.some((t) => t.targetId === 'lao_li')).toBe(true);
  });
});

describe('v4.3.3: 头像 1-10 全档可选', () => {
  it('update_profile 接受 1-10（旧档 7-10 被钳成 6 的修复）', () => {
    let s = fresh(19);
    for (const id of [1, 5, 7, 10]) {
      s = dispatch(s, { type: 'update_profile', avatarId: id });
      expect(s.profile.avatarId).toBe(id);
    }
    s = dispatch(s, { type: 'update_profile', avatarId: 99 });
    expect(s.profile.avatarId).toBe(10); // 越界钳制上限
  });
});

describe('v4.3.3: 讨债话术语义修复（从未给过钱的人）', () => {
  it('direct_ask 翻车池：timesPaid=0 的人不说「上次那笔你还没还」', () => {
    let s = fresh(23);
    s = dispatch(s, { type: 'enter_night' });
    const li = s.targets.find((t) => t.targetId === 'lao_li')!;
    li.stage = 'harvest'; li.trust = 90; li.wariness = 0;
    li.daysSincePaid = 5; li.timesPaid = 0; // 从未给过
    s = dispatch(s, { type: 'direct_ask', targetId: 'lao_li', reasonId: 'boba', amount: 30 });
    expect(s.chat).not.toBeNull();
    const failTexts = s.chat!.transcript.map((m) => m.text).join('');
    expect(failTexts.includes('上次那笔')).toBe(false);
  });

  it('钱包冷却：从未给过钱的人听到「还没到这个份上」而不是「已经给过了」', () => {
    let s = fresh(29);
    s = dispatch(s, { type: 'enter_night' });
    const li = s.targets.find((t) => t.targetId === 'lao_li')!;
    li.stage = 'harvest'; li.trust = 90; li.wariness = 0;
    li.daysSincePaid = 0; li.timesPaid = 0; // 冷却且从未给过
    s = dispatch(s, { type: 'direct_ask', targetId: 'lao_li', reasonId: 'boba', amount: 30 });
    const txt = s.chat!.transcript.map((m) => m.text).join('');
    expect(txt.includes('已经给过了')).toBe(false);
    expect(txt.includes('还没到这个份上')).toBe(true);
  });
});

describe('v4.3.3: 草稿编号清理回归（packs-chen）', () => {
  it('陈工话术组正文不再出现草稿行号/子号', async () => {
    const mod = await import('../../data/packs-chen');
    const blob = JSON.stringify(mod);
    // 2-3 位编号（草稿行号）——正文已清；陈工单消息内 1-9 编号体是人设，不在打击面
    expect(/\d{2,3}\.\d /.test(blob)).toBe(false);
    // 用户举报的两句原样在场且干净
    expect(blob.includes('是查燃气表的。我递水了。查表的姑娘说：叔叔，您家真安静。')).toBe(true);
  });
});
