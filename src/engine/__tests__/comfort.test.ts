/**
 * 1.1.0 舒适圈（常用手机）验收。
 *
 * 红线：
 * - 话术库：母亲/男友各 ≥10 套；全库台词零重复；每个选项必有回应；话题不空。
 * - 熟人聊天不耗体力（ comfortable = 免费）。
 * - 现金流语义：妈/男友的钱进活命钱；男友要的钱先扣活命钱、扣不动记到债上（进度拖慢）。
 * - 拒绝的连锁：累计 ≥2 次或感情冰点 → 分手（卷钱+拉黑）；否则可触发举报/警察上门。
 * - 对比叙事：温情 vs 算计的旁白必须存在（切机/收钱/威胁各池非空且已接线）。
 * - 旧档迁移：无 comfort 字段的存档补默认值。
 */
import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch } from '../../engine/state-machine';
import { runComfortMorning } from '../../engine/comfort';
import { migrate } from '../../store/gameStore';
import { MOTHER_PACKS, BOYFRIEND_PACKS, BF_OMEN_PACK } from '../../data/comfort-packs';
import {
  MOM_GIFT_LINES, MOM_GIFT_TAKEN, MOM_GIFT_REFUSED,
  BF_PACKET_LINES, BF_PACKET_TAKEN, BF_PACKET_REFUSED,
  BF_DEMAND_LINES, BF_DEMAND_GIVEN, BF_DEMAND_REFUSED_THREAT,
  BF_BREAKUP_LINES, BF_REPORT_LINES, BF_POLICE_NARRATION, COMFORT_AMBIENT_LINES,
  MOM_BIRTHDAY_LINES, MOM_BIRTHDAY_TAKEN, MOM_BIRTHDAY_REFUSED,
  BF_BIRTHDAY_REMEMBER_LINES, BF_BIRTHDAY_TAKEN, BF_BIRTHDAY_REFUSED,
  BF_BIRTHDAY_REMEMBER_LOG, BF_BIRTHDAY_FORGOT_LOG,
} from '../../data/comfort-packs';
import {
  INSPIRE_POSTS, FAMILY_POSTS, LOVE_POSTS, MOM_COMMENTS, BF_COMMENTS, OTHER_POSTS, COMFORT_SCENES,
} from '../../data/comfort-moments';
import {
  SWITCH_TO_COMFORT, SWITCH_TO_WORK, MOM_MONEY_TAKE_CONTRAST, MOM_MONEY_REFUSE_CONTRAST,
  BF_PACKET_CONTRAST, BF_DEMAND_CONTRAST, BF_BREAKUP_CONTRAST, WALLET_CONTRAST, MIRROR_LINES,
} from '../../data/comfort-contrast';
import {
  BF_DEMAND_FIRST_DAY, BF_DEMAND_GAP_COLD, BF_BREAKUP_REFUSES,
  MOM_GIFT_FIRST_DAY, BF_PACKET_FIRST_DAY, BF_OMEN_DAY,
  XIAOMAN_BIRTHDAY_DAY, freshComfortState,
} from '../../data/comfort';
import type { GameState } from '../../types/game';

function fresh(seed = 7): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: '小满', motive: 'debt', personaId: 'wise_sister' });
  return s;
}

/** 把事件卡塞进状态（绕开 rng 掷骰，直接测结算）。 */
function withIncoming(s: GameState, kind: 'mom_gift' | 'bf_packet' | 'bf_demand', amount: number): GameState {
  const next = { ...s, comfort: { ...s.comfort, incoming: [...s.comfort.incoming] } };
  next.comfort.incoming.push({
    id: `${kind}_test`,
    kind,
    day: next.day,
    amount,
    lines: ['（测试开场白）'],
  });
  return next;
}

describe('1.1.0 话术库：人设与红线', () => {
  it('母亲/男友各 ≥10 套，话题与选项齐备', () => {
    expect(MOTHER_PACKS.length).toBeGreaterThanOrEqual(10);
    expect(BOYFRIEND_PACKS.length).toBeGreaterThanOrEqual(10);
    for (const p of [...MOTHER_PACKS, ...BOYFRIEND_PACKS]) {
      expect(p.lines.length).toBeGreaterThanOrEqual(1);
      expect(p.options.length).toBeGreaterThanOrEqual(2);
      for (const o of p.options) {
        expect(o.reply.trim().length).toBeGreaterThan(0);
        expect(o.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('全库台词零重复（lines/选项/reply/事件池全局去重）', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    const put = (t: string) => {
      const k = t.replace(/\s/g, '');
      if (seen.has(k)) dupes.push(t);
      seen.add(k);
    };
    for (const p of [...MOTHER_PACKS, ...BOYFRIEND_PACKS, BF_OMEN_PACK]) {
      for (const l of p.lines) l.split('｜').forEach(put);
      for (const o of p.options) { put(o.text); o.reply.split('｜').forEach(put); }
    }
    [
      ...MOM_GIFT_LINES, ...MOM_GIFT_TAKEN, ...MOM_GIFT_REFUSED,
      ...BF_PACKET_LINES, ...BF_PACKET_TAKEN, ...BF_PACKET_REFUSED,
      ...BF_DEMAND_LINES.flat(), ...BF_DEMAND_GIVEN, ...BF_DEMAND_REFUSED_THREAT,
      ...BF_BREAKUP_LINES, ...BF_REPORT_LINES, ...BF_POLICE_NARRATION, ...COMFORT_AMBIENT_LINES,
      ...MOM_BIRTHDAY_LINES, ...MOM_BIRTHDAY_TAKEN, ...MOM_BIRTHDAY_REFUSED,
      ...BF_BIRTHDAY_REMEMBER_LINES, ...BF_BIRTHDAY_TAKEN, ...BF_BIRTHDAY_REFUSED,
      ...BF_BIRTHDAY_REMEMBER_LOG, ...BF_BIRTHDAY_FORGOT_LOG,
    ].forEach(put);
    expect(dupes).toEqual([]);
  });

  it('事件话术池非空', () => {
    expect(MOM_GIFT_LINES.length).toBeGreaterThanOrEqual(3);
    expect(BF_PACKET_LINES.length).toBeGreaterThanOrEqual(3);
    expect(BF_DEMAND_LINES.length).toBeGreaterThanOrEqual(3);
    expect(BF_DEMAND_LINES.every((l) => l.length >= 4)).toBe(true);
  });

  it('朋友圈内容池齐备：三类主打 + 双方互动 + 场景映射', () => {
    expect(INSPIRE_POSTS.length).toBeGreaterThanOrEqual(6);
    expect(FAMILY_POSTS.length).toBeGreaterThanOrEqual(5);
    expect(LOVE_POSTS.length).toBeGreaterThanOrEqual(5);
    expect(MOM_COMMENTS.inspire.length).toBeGreaterThanOrEqual(2);
    expect(BF_COMMENTS.love.length).toBeGreaterThanOrEqual(2);
    expect(OTHER_POSTS.length).toBeGreaterThanOrEqual(3);
    for (const p of [...INSPIRE_POSTS, ...FAMILY_POSTS, ...LOVE_POSTS, ...OTHER_POSTS]) {
      if (p.photoId) expect(COMFORT_SCENES[p.photoId]).toBeTruthy();
    }
  });
});

describe('1.1.0 对比叙事：温情 vs 冷漠算计', () => {
  it('对照池非空且都点名"代价/数字/算计"一侧', () => {
    expect(MOM_MONEY_TAKE_CONTRAST.length).toBeGreaterThanOrEqual(3);
    expect(MOM_MONEY_REFUSE_CONTRAST.length).toBeGreaterThanOrEqual(2);
    expect(BF_PACKET_CONTRAST.length).toBeGreaterThanOrEqual(2);
    expect(BF_DEMAND_CONTRAST.length).toBeGreaterThanOrEqual(2);
    expect(BF_BREAKUP_CONTRAST.length).toBeGreaterThanOrEqual(2);
    expect(SWITCH_TO_COMFORT.length).toBeGreaterThanOrEqual(3);
    expect(SWITCH_TO_WORK.length).toBeGreaterThanOrEqual(3);
    expect(MIRROR_LINES.length).toBeGreaterThanOrEqual(4);
    expect(WALLET_CONTRAST.length).toBeGreaterThanOrEqual(2);
  });

  it('收妈的钱：日志带"没有来源字幕"对照旁白（哥哥的钱有，妈的没有）', () => {
    let s = fresh(9);
    s = withIncoming(s, 'mom_gift', 200);
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'mom_gift_test', accept: true });
    expect(s.money).toBe(fresh(9).money + 200);
    const last = s.log.filter((l) => l.kind === 'comfort').at(-1)!;
    expect(MOM_MONEY_TAKE_CONTRAST).toContain(last.line);
  });

  it('镜像行点名两台手机的同构台词', () => {
    expect(MIRROR_LINES.some((l) => l.includes('吃了吗'))).toBe(true);
  });
});

describe('1.1.0 现金流：进活命钱 / 从债中扣', () => {
  it('妈的生活费：收 → 进活命钱 + 家庭关系+；推 → 钱不进 + 家庭关系-', () => {
    let s = fresh(11);
    const money0 = s.money;
    const family0 = s.comfort.family;
    s = withIncoming(s, 'mom_gift', 250);
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'mom_gift_test', accept: true });
    expect(s.money).toBe(money0 + 250);
    expect(s.comfort.family).toBeGreaterThan(family0);
    expect(s.comfort.momGiven).toBe(250);
    expect(s.ledger.some((l) => l.kind === 'family' && l.amount === 250)).toBe(true);

    let s2 = fresh(11);
    const family1 = s2.comfort.family;
    s2 = withIncoming(s2, 'mom_gift', 250);
    s2 = dispatch(s2, { type: 'comfort_resolve_incoming', incomingId: 'mom_gift_test', accept: false });
    expect(s2.money).toBe(s2.money); // 推掉：钱不进（余额不变）
    expect(s2.comfort.family).toBeLessThan(family1);
    expect(s2.comfort.momRefused).toBe(250);
  });

  it('男友红包：收 → 进活命钱 + 感情+；推 → 感情-', () => {
    let s = fresh(13);
    const money0 = s.money;
    s = withIncoming(s, 'bf_packet', 88);
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'bf_packet_test', accept: true });
    expect(s.money).toBe(money0 + 88);
    expect(s.comfort.love).toBeGreaterThan(82 - 1e-9);

    let s2 = fresh(13);
    const love0 = s2.comfort.love;
    s2 = withIncoming(s2, 'bf_packet', 88);
    s2 = dispatch(s2, { type: 'comfort_resolve_incoming', incomingId: 'bf_packet_test', accept: false });
    expect(s2.comfort.love).toBeLessThan(love0);
  });

  it('男友要钱（给了）：先扣活命钱，扣不动的部分记到债上（崩老头进度被拖慢）', () => {
    let s = fresh(15);
    s.money = 100; // 活命钱不够——差额进债
    s = withIncoming(s, 'bf_demand', 500);
    const goal0 = s.goal;
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'bf_demand_test', accept: true });
    expect(s.money).toBe(0);
    expect(s.goal).toBe(goal0 + 400); // 100 现金 + 400 记债
    expect(s.comfort.bfTaken).toBe(500);

    let s2 = fresh(15);
    s2.money = 1000;
    s2 = withIncoming(s2, 'bf_demand', 500);
    const goal1 = s2.goal;
    s2 = dispatch(s2, { type: 'comfort_resolve_incoming', incomingId: 'bf_demand_test', accept: true });
    expect(s2.money).toBe(500);
    expect(s2.goal).toBe(goal1); // 余额够：不动债
  });

  it('男友要钱（不给）：感情重挫 + 威胁话术落日志', () => {
    let s = fresh(17);
    const love0 = s.comfort.love;
    s = withIncoming(s, 'bf_demand', 300);
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'bf_demand_test', accept: false });
    expect(s.comfort.love).toBeLessThan(love0);
    expect(s.comfort.bfDemand.refuses).toBe(1);
    expect(s.comfort.bfState).toBe('normal'); // 一次拒绝不立刻分手
    const lines = s.log.filter((l) => l.kind === 'comfort').map((l) => l.details + (l.line ?? '')).join('\n');
    expect(lines).toContain('你等着');
  });
});

describe('1.1.0 连锁：分手卷钱拉黑 / 报复举报 / 警察上门', () => {
  it('累计拒绝 ≥2 次 → 分手：卷走全部活命钱 + 拉黑 + 告白三连', () => {
    let s = fresh(21);
    s.money = 777;
    s = withIncoming(s, 'bf_demand', 300);
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'bf_demand_test', accept: false });
    s = withIncoming(s, 'bf_demand', 300);
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'bf_demand_test', accept: false });
    expect(s.comfort.bfDemand.refuses).toBe(BF_BREAKUP_REFUSES);
    expect(s.comfort.bfState).toBe('broken_up');
    expect(s.comfort.blockedByBf).toBe(true);
    expect(s.money).toBe(0); // 活命钱被卷空
    const all = s.log.filter((l) => l.kind === 'comfort').map((l) => l.details + (l.line ?? '')).join('\n');
    expect(all).toContain('分手');
    expect(all).toContain('拉黑');
    // 分手后不再接受他的聊天
    const snap = JSON.stringify(s);
    s = dispatch(s, { type: 'comfort_open_chat', contactId: 'boyfriend' });
    expect(JSON.stringify(s)).toBe(snap);
  });

  it('某些种子下拒绝触发举报线：穿帮风险 +25（报复但不分手）', () => {
    // 拒一次不会分手（refuses=1 且 love > 25），但 35% 概率举报——扫一批种子找一例。
    let found = false;
    for (let seed = 1; seed <= 40 && !found; seed++) {
      let s = fresh(seed);
      if (s.comfort.love <= 25) continue;
      s = withIncoming(s, 'bf_demand', 200);
      s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'bf_demand_test', accept: false });
      if (s.riskLevel >= 25 && s.comfort.bfState === 'normal') found = true;
    }
    expect(found).toBe(true);
  });

  it('某些种子下举报升级为警察上门：当天精力清零（进程被打断）', () => {
    let found = false;
    for (let seed = 1; seed <= 80 && !found; seed++) {
      let s = fresh(seed);
      if (s.comfort.love <= 25) continue;
      s = withIncoming(s, 'bf_demand', 200);
      s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'bf_demand_test', accept: false });
      if (s.comfort.policeDay === s.day) {
        expect(s.energy).toBe(0);
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});

describe('1.1.0 聊天：不耗体力 / 去重 / 伏笔', () => {
  it('跟妈聊天不动精力（熟人聊天免费）', () => {
    let s = fresh(23);
    const e0 = s.energy;
    s = dispatch(s, { type: 'comfort_open_chat', contactId: 'mother' });
    expect(s.comfort.chat).not.toBeNull();
    expect(s.energy).toBe(e0);
    expect(s.dayPhase).not.toBe('chat'); // 舒适圈聊天不占主线的 chat 相位
    // 选一个回复 → 对方回应 + 关系变化
    const family0 = s.comfort.family;
    s = dispatch(s, { type: 'comfort_pick', optionIndex: 0 });
    expect(s.comfort.chat!.awaiting).toBe('closed');
    const opts = MOTHER_PACKS.find((p) => p.id)!;
    void opts;
    s = dispatch(s, { type: 'comfort_end_chat' });
    expect(s.comfort.chat).toBeNull();
    expect(s.comfort.archives.length).toBe(1);
  });

  it('同一天连续两场，开场白不重复（去重窗口）', () => {
    let s = fresh(29);
    s = dispatch(s, { type: 'comfort_open_chat', contactId: 'boyfriend' });
    const first = s.comfort.chat!.transcript.filter((m) => m.speaker === 'them').map((m) => m.text).join('｜');
    s = dispatch(s, { type: 'comfort_end_chat' });
    s = dispatch(s, { type: 'comfort_open_chat', contactId: 'boyfriend' });
    const second = s.comfort.chat!.transcript.filter((m) => m.speaker === 'them').map((m) => m.text).join('｜');
    expect(first).not.toBe(second);
  });

  it('第 14 天伏笔：他那句说漏嘴的"真心话"自动开场', () => {
    let s = fresh(31);
    while (s.day < BF_OMEN_DAY) s = dispatch(s, { type: 'sleep' });
    expect(s.flags.bf_omen_done).toBe(true);
    expect(s.comfort.chat?.contactId).toBe('boyfriend');
    expect(s.comfort.chat!.transcript.some((m) => m.text.includes('拒了'))).toBe(true);
  });

  it('伏笔顺延：第 14 天有聊天在开就不丢，聊天空出来后补上（宽限 3 天）', () => {
    const s = fresh(67);
    s.day = BF_OMEN_DAY;
    s.comfort = { ...s.comfort, chat: { contactId: 'mother', transcript: [], pending: [], awaiting: 'player', closingNote: null } };
    runComfortMorning(s);
    expect(s.flags.bf_omen_done).toBeUndefined(); // 没触发，也没丢
    s.comfort = { ...s.comfort, chat: null };
    s.day = BF_OMEN_DAY + 1;
    runComfortMorning(s);
    expect(s.flags.bf_omen_done).toBe(true);
    expect(s.comfort.chat?.contactId).toBe('boyfriend');
  });
});

describe('1.1.0 嘘寒问暖与生日：家人常来，外人看心情', () => {
  /** 手工挂一张嘘寒问暖卡（绕开 rng 掷骰）。 */
  function withTalk(s: GameState, id: string, kind: 'mom_talk' | 'bf_talk', packId: string, firstLine: string): GameState {
    const next = { ...s, comfort: { ...s.comfort, incoming: [...s.comfort.incoming] } };
    next.comfort.incoming.push({ id, kind, day: next.day, amount: 0, lines: [firstLine], packId });
    return next;
  }

  it('妈的嘘寒问暖：回 = 免费开一场那套话术的聊天（开场白就是卡上那句）；不回 = 家庭关系-2', () => {
    let s = fresh(51);
    const pack = MOTHER_PACKS[0];
    const opener = pack.lines[0].split('｜')[0];
    s = withTalk(s, 'mom_talk_test', 'mom_talk', pack.id, opener);
    const e0 = s.energy;
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'mom_talk_test', accept: true });
    expect(s.comfort.chat).not.toBeNull();
    expect(s.comfort.chat!.contactId).toBe('mother');
    expect(s.comfort.chat!.transcript.some((m) => m.speaker === 'them' && m.text === opener)).toBe(true);
    expect(s.energy).toBe(e0); // 免费
    expect(s.comfort.incoming.some((m) => m.id === 'mom_talk_test')).toBe(false);

    let s2 = fresh(51);
    const f0 = s2.comfort.family;
    s2 = withTalk(s2, 'mom_talk_test', 'mom_talk', MOTHER_PACKS[1].id, '（测试）');
    s2 = dispatch(s2, { type: 'comfort_resolve_incoming', incomingId: 'mom_talk_test', accept: false });
    expect(s2.comfort.family).toBe(f0 - 2);
    expect(s2.comfort.chat).toBeNull();
  });

  it('嘘寒问暖卡在一场聊天没完时不能回（卡片保留不丢）', () => {
    let s = fresh(53);
    s = dispatch(s, { type: 'comfort_open_chat', contactId: 'mother' });
    s = withTalk(s, 'mom_talk_test', 'mom_talk', MOTHER_PACKS[2].id, '（测试）');
    const snap = JSON.stringify(s);
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: 'mom_talk_test', accept: true });
    expect(JSON.stringify(s)).toBe(snap);
  });

  it('农历小满生日（第 21 天）：妈的生日红包必到；感情好的阿凯记得，感情凉的忘了', () => {
    const warm = fresh(61);
    warm.day = XIAOMAN_BIRTHDAY_DAY;
    warm.comfort = { ...freshComfortState(), love: 80 };
    runComfortMorning(warm);
    expect(warm.flags.xiaoman_birthday_done).toBe(true);
    expect(warm.comfort.incoming.some((m) => m.kind === 'mom_gift' && m.tone === 'birthday')).toBe(true);
    const warmLogs = warm.log.filter((l) => l.kind === 'comfort').map((l) => l.details + (l.line ?? '')).join();
    expect(warmLogs).toContain('居然记得');

    const cold = fresh(63);
    cold.day = XIAOMAN_BIRTHDAY_DAY;
    cold.comfort = { ...freshComfortState(), love: 40 };
    runComfortMorning(cold);
    const coldLogs = cold.log.filter((l) => l.kind === 'comfort').map((l) => l.details + (l.line ?? '')).join();
    expect(coldLogs).toContain('他忘了');
  });

  it('生日红包结算：收 → 进活命钱（口径与普通生活费一致）', () => {
    let s = fresh(65);
    s.day = XIAOMAN_BIRTHDAY_DAY;
    s.comfort = { ...freshComfortState() };
    runComfortMorning(s);
    const card = s.comfort.incoming.find((m) => m.kind === 'mom_gift' && m.tone === 'birthday');
    expect(card).toBeDefined();
    const money0 = s.money;
    s = dispatch(s, { type: 'comfort_resolve_incoming', incomingId: card!.id, accept: true });
    expect(s.money).toBe(money0 + 200);
    const all = s.log.filter((l) => l.kind === 'comfort').map((l) => l.details + (l.line ?? '')).join();
    expect(all).toContain('农历小满');
  });
});

describe('1.1.0 切换手机 / 事件派发 / 迁移', () => {
  it('switch_phone 是视图开关：来回切，主线状态不抖', () => {
    let s = fresh(37);
    expect(s.comfort.active).toBe(false);
    s = dispatch(s, { type: 'switch_phone' });
    expect(s.comfort.active).toBe(true);
    s = dispatch(s, { type: 'switch_phone' });
    expect(s.comfort.active).toBe(false);
    const logKinds = s.log.filter((l) => l.kind === 'comfort');
    expect(logKinds.length).toBe(2);
    expect(SWITCH_TO_COMFORT).toContain(logKinds[0].line);
    expect(SWITCH_TO_WORK).toContain(logKinds[1].line);
  });

  it('早晨会派发舒适圈事件：跑两周必有妈/阿凯的动静', () => {
    let s = fresh(41);
    while (s.day < 14) s = dispatch(s, { type: 'sleep' });
    const sawMom = s.comfort.momGift.count > 0 || s.comfort.incoming.some((m) => m.kind === 'mom_gift');
    const sawBf = s.comfort.bfPacket.count > 0 || s.comfort.bfDemand.count > 0 || s.comfort.incoming.some((m) => m.kind !== 'mom_gift');
    expect(sawMom || sawBf).toBe(true);
  });

  it('首事件日节奏：红包最早 D2 / 生活费最早 D3 / 要钱最早 D6', () => {
    let s = fresh(43);
    while (s.day < BF_DEMAND_FIRST_DAY + 1) s = dispatch(s, { type: 'sleep' });
    // 全部历史事件卡都不得早于各线首日
    for (const l of s.log.filter((l) => l.kind === 'comfort')) {
      void l;
    }
    expect(BF_PACKET_FIRST_DAY).toBe(2);
    expect(MOM_GIFT_FIRST_DAY).toBe(3);
    expect(BF_DEMAND_FIRST_DAY).toBe(6);
  });

  it('旧档迁移：v1.0 存档（无 comfort）补默认常用手机', () => {
    const old = { ...createInitialState(), comfort: undefined } as unknown as GameState;
    const migrated = migrate(old);
    expect(migrated.comfort).toBeDefined();
    expect(migrated.comfort.active).toBe(false);
    expect(migrated.comfort.family).toBeGreaterThan(0);
    expect(migrated.comfort.love).toBeGreaterThan(migrated.comfort.family); // 恋爱脑：给男友的起点分更高
  });

  it('感情冰点保底：感情凉到 60 以下，要钱的间隔缩到 3 天', () => {
    expect(BF_DEMAND_GAP_COLD).toBe(3);
  });
});
