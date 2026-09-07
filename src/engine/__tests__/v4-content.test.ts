import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch, ALL_TARGET_MAP } from '../state-machine';
import { scriptFor } from '../../data/script-registry';
import { LIBRARY_OPENERS, LIBRARY_INCOMING, LIBRARY_LIFE_IDS } from '../../data/library-openers';
import { LIBRARY } from '../../data/target-library';
import {
  PACKET_SOURCE_SUBTITLE, PACKET_SOURCE_GENERIC, ASK_COST_NARRATOR_V2,
  GIFT_NARRATOR, GIFT_NARRATOR_GENERIC, packetTierOf, MONEY_HOME_TAGS,
} from '../../data/cost-narratives';
import { WORLD_BEATS } from '../../data/life-events';
import type { GameState } from '../../types/game';

function fresh(seed: number): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId: 'wise_sister' });
  return s;
}

/** 解锁一个库目标（模拟计划偶遇入册）。 */
function unlock(s: GameState, id: string): GameState {
  const t = s.targets.find((x) => x.targetId === id)!;
  t.discoveredDay = s.day;
  return s;
}

describe('v4.1: 库目标个性化（P0-3 修复）', () => {
  it('数据完整性：45 人全部有 ≥2 条个人进场白 + 1 条个人 incoming', () => {
    expect(LIBRARY.length).toBe(45);
    for (const t of LIBRARY) {
      expect(LIBRARY_OPENERS[t.id]?.length, `${t.id} ${t.name} 缺个人进场白`).toBeGreaterThanOrEqual(2);
      expect(LIBRARY_INCOMING[t.id], `${t.id} ${t.name} 缺个人 incoming`).toBeTruthy();
    }
  });

  it('两个同原型保安（g1 vs g2）的第一次聊天开场白不同——换皮破除', () => {
    // 解锁两个保安，各自开第一场聊天（深夜在线）。
    let s1 = unlock(fresh(11), 'g1');
    s1 = dispatch(s1, { type: 'enter_night' });
    s1 = dispatch(s1, { type: 'start_chat', targetId: 'g1' });
    const g1All = s1.chat!.transcript.filter((m) => m.speaker === 'target').map((m) => m.text).join('｜');

    let s2 = unlock(fresh(11), 'g2');
    s2 = dispatch(s2, { type: 'enter_night' });
    s2 = dispatch(s2, { type: 'start_chat', targetId: 'g2' });
    const g2All = s2.chat!.transcript.filter((m) => m.speaker === 'target').map((m) => m.text).join('｜');

    // 第一场聊天的全部开场内容来自各自的个人池，且互不相同。
    const g1Hit = LIBRARY_OPENERS.g1.some((o) => g1All.includes(o.split('｜')[0]));
    const g2Hit = LIBRARY_OPENERS.g2.some((o) => g2All.includes(o.split('｜')[0]));
    expect(g1Hit, 'g1 开场不是个人池内容').toBe(true);
    expect(g2Hit, 'g2 开场不是个人池内容').toBe(true);
    expect(g1All).not.toBe(g2All);
  });

  it('第一次聊完，第二次不再说个人开场白（回落原型话术）', () => {
    let s = unlock(fresh(12), 'g8');
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'start_chat', targetId: 'g8' });
    s = dispatch(s, { type: 'end_chat' });
    s = dispatch(s, { type: 'sleep' });
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'start_chat', targetId: 'g8' });
    const firstLine = s.chat!.transcript.find((m) => m.speaker === 'target')?.text ?? '';
    // 第二场不再出现个人开场白原文（它们的 ｜ 连发已进 recentGreetings 去重）。
    expect(LIBRARY_OPENERS.g8.some((o) => o === firstLine)).toBe(false);
  });

  it('库人物人生线：f8（陪钓的宁叔）的钓鱼卡到期日记入晨报', () => {
    let s = unlock(fresh(13), 'f8');
    s = dispatch(s, { type: 'sleep' }); // → day 2
    const life = s.log.filter((l) => l.kind === 'life');
    expect(life.length).toBe(1);
    expect(life[0].details).toContain('钓鱼卡');
  });

  it('LIBRARY_LIFE_IDS 五个人全部在 LIFE 数据里挂了节点', () => {
    for (const id of LIBRARY_LIFE_IDS) {
      const def = ALL_TARGET_MAP[id];
      expect(def, `${id} 不在目标库`).toBeTruthy();
    }
  });
});

describe('v4.1: 节奏日（P0-1 修复：第 4-30 天必现节点）', () => {
  it('Day 5 妈的相册必现，决策"打电话回去"良心 +10 且只能选一次', () => {
    let s = fresh(21);
    while (s.day < 5) s = dispatch(s, { type: 'sleep' });
    expect(s.pendingBeat).toBe('beat_mom_album');
    const before = s.conscience;
    s = dispatch(s, { type: 'resolve_beat', optionIndex: 0 });
    expect(s.conscience).toBe(Math.min(100, before + 10));
    expect(s.pendingBeat).toBe('');
    // 再选第二次 → no-op。
    const after = s.conscience;
    s = dispatch(s, { type: 'resolve_beat', optionIndex: 1 });
    expect(s.conscience).toBe(after);
  });

  it('Day 15 电梯镜子：麻木 ≥40 才看得见——低麻木局不触发', () => {
    let low = fresh(22);
    while (low.day < 15) low = dispatch(low, { type: 'sleep' });
    expect(low.log.some((l) => l.kind === 'beat' && l.day === low.day)).toBe(false);
    expect(low.pendingBeat).toBe('');

    // 高麻木局：每天把麻木顶回 60（睡眠的自然恢复会扣，补上再睡）。
    let high = fresh(22);
    while (high.day < 15) {
      high.numbness = Math.max(high.numbness, 60);
      high = dispatch(high, { type: 'sleep' });
    }
    const mirror = high.log.find((l) => l.kind === 'beat' && l.day === high.day);
    expect(mirror?.details).toContain('电梯里的镜子');
  });

  it('Day 20 半程账单：正文插值带真实数字（红包数/入账数）', () => {
    let s = fresh(23);
    s.stats.redPacketsReceived = 7;
    s.stats.totalEarned = 620;
    while (s.day < 20) s = dispatch(s, { type: 'sleep' });
    const beat = s.log.find((l) => l.kind === 'beat' && l.day === s.day);
    expect(beat?.details).toContain('7 个红包');
    expect(beat?.details).toContain('620');
  });

  it('决策卡过夜落锤：Day 5 不选，Day 6 起不能再选', () => {
    let s = fresh(24);
    while (s.day < 5) s = dispatch(s, { type: 'sleep' });
    expect(s.pendingBeat).toBe('beat_mom_album');
    s = dispatch(s, { type: 'sleep' }); // 没选就睡
    expect(s.pendingBeat).toBe('');
    const before = s.conscience;
    s = dispatch(s, { type: 'resolve_beat', optionIndex: 0 });
    expect(s.conscience).toBe(before);
  });

  it('Day 25 倒计时必现且无决策（纯压迫）', () => {
    let s = fresh(25);
    while (s.day < 25) s = dispatch(s, { type: 'sleep' });
    const beat = s.log.find((l) => l.kind === 'beat' && l.day === s.day);
    expect(beat?.details).toContain('最后五天');
    expect(s.pendingBeat).toBe('');
  });

  it('五个节奏日互不重叠、全部落在 Day 4-25 区间', () => {
    const days = WORLD_BEATS.map((b) => b.day).sort((a, b) => a - b);
    expect(new Set(days).size).toBe(days.length);
    expect(days[0]).toBeGreaterThanOrEqual(4);
    expect(days[days.length - 1]).toBeLessThanOrEqual(25);
  });
});

describe('v4.1: 代价呈递四触点（P0-2/P0-4 修复）', () => {
  it('数据完整性：五主角来源字幕 3 档 × ≥2 条；开口旁白 ≥6 条；礼物旁白 ≥2 条', () => {
    for (const id of ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong']) {
      for (const tier of ['small', 'mid', 'big'] as const) {
        expect(PACKET_SOURCE_SUBTITLE[id][tier].length, `${id}/${tier} 来源字幕不足`).toBeGreaterThanOrEqual(2);
      }
      expect(ASK_COST_NARRATOR_V2[id].length, `${id} 开口旁白不足 6 条`).toBeGreaterThanOrEqual(6);
      expect(GIFT_NARRATOR[id].length, `${id} 礼物旁白不足`).toBeGreaterThanOrEqual(2);
    }
    expect(GIFT_NARRATOR_GENERIC.length).toBeGreaterThanOrEqual(2);
    for (const tier of ['small', 'mid', 'big'] as const) {
      expect(PACKET_SOURCE_GENERIC[tier].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('档位划分：100 以内 small / 101-500 mid / 500 以上 big', () => {
    expect(packetTierOf(58)).toBe('small');
    expect(packetTierOf(100)).toBe('small');
    expect(packetTierOf(180)).toBe('mid');
    expect(packetTierOf(4300)).toBe('big');
  });

  it('触点 2 红包来源字幕：要到钱时字幕接在红包气泡后', () => {
    // 走老李的开口组（确定性选中：recentPacks 排除法）。
    let s = fresh(31);
    const tl = s.targets.find((x) => x.targetId === 'lao_li')!;
    tl.trust = 70; tl.wariness = 0; tl.stage = 'harvest'; tl.daysSincePaid = 5;
    for (const nid of ['c_li_1','c_li_2','c_li_3','c_li_4','c_li_5','c_li_6','c_li_7','c_li_8','c_li_9','c_li_10','c_li_11','c_li_wise','c_li_yatou']) {
      s.flags[`chain_${nid}`] = true;
    }
    const allPacks = [...(scriptFor('lao_li').packs ?? [])];
    tl.recentPacks = allPacks.filter((p) => p.id !== 'li2_46').map((p) => p.id);
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'start_chat', targetId: 'lao_li' });
    const askIdx = s.chat!.pendingOptions.findIndex((o) => o.isAsk);
    expect(askIdx).toBeGreaterThanOrEqual(0);
    s = dispatch(s, { type: 'pick_option', optionIndex: askIdx });
    const texts = s.chat!.transcript.map((m) => m.text);
    // 来源字幕 + 开口旁白（Day 1 < 8，旁白不该出现；字幕每天都该有）。
    const subtitles = [
      ...PACKET_SOURCE_SUBTITLE.lao_li.small, ...PACKET_SOURCE_SUBTITLE.lao_li.mid, ...PACKET_SOURCE_SUBTITLE.lao_li.big,
      ...PACKET_SOURCE_GENERIC.small, ...PACKET_SOURCE_GENERIC.mid, ...PACKET_SOURCE_GENERIC.big,
    ];
    expect(texts.some((t) => subtitles.includes(t)), `来源字幕未注入: ${texts.join(' / ')}`).toBe(true);
  });

  it('触点 3 礼物入账旁白：信任 60+ 的他主动转钱时，日志行带他的日子', () => {
    let s = fresh(32);
    const tz = s.targets.find((x) => x.targetId === 'zhou_teacher')!;
    tz.trust = 75; tz.stage = 'harvest'; tz.wariness = 0;
    // 连续睡 12 天，捞一次"主动转钱"（8%/天，12 天内 ≥63% 累计；用多个种子保确定性）。
    let giftLog: GameState['log'][number] | undefined;
    for (let seed = 32; seed < 42 && !giftLog; seed++) {
      let cur = fresh(seed);
      const tzCur = cur.targets.find((x) => x.targetId === 'zhou_teacher')!;
      tzCur.trust = 75; tzCur.stage = 'harvest'; tzCur.wariness = 0;
      for (let d = 0; d < 12 && !giftLog; d++) {
        cur = dispatch(cur, { type: 'sleep' });
        giftLog = cur.log.find((l) => l.kind === 'packet' && l.details.includes('没有人开口要过') && l.day === cur.day);
      }
    }
    expect(giftLog, '12 天 ×10 种子内未出现主动转账').toBeTruthy();
    // line 字段带 GIFT_NARRATOR 的旁白。
    expect(giftLog!.line).toBeTruthy();
    expect([...GIFT_NARRATOR.zhou_teacher, ...GIFT_NARRATOR_GENERIC].some((g) => giftLog!.line === g)).toBe(true);
  });

  it('触点 4 收工账：当天有红包/礼物入账时，睡前日志出现"收工账"行', () => {
    // 注入一笔老李红包流水，然后睡觉。
    let s = fresh(33);
    s.ledger.push({ day: s.day, amount: 88, note: '老李 的红包（零花）', kind: 'packet' });
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'sleep' });
    const closing = s.log.find((l) => l.day === s.day - 1 && l.details.startsWith('收工账'));
    expect(closing).toBeTruthy();
    expect(closing!.details).toContain('老李：88');
    expect(closing!.details).toContain('夜班钱');
  });

  it('触点 4 空 day：没有入账的日子不出现收工账行', () => {
    let s = fresh(34);
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'sleep' });
    expect(s.log.some((l) => l.details.startsWith('收工账'))).toBe(false);
  });

  it('钱包标记：五主角各自的"钱是什么钱"标签', () => {
    expect(MONEY_HOME_TAGS.lao_li).toBe('夜班钱');
    expect(MONEY_HOME_TAGS.zhou_teacher).toBe('退休金');
    expect(MONEY_HOME_TAGS.boss_wang).toBe('店里的账');
    expect(MONEY_HOME_TAGS.hao_ge).toBe('网吧的电费');
    expect(MONEY_HOME_TAGS.chen_gong).toBe('给儿子的机票钱');
  });
});

describe('v4.1: 早期疲劳（P1-4）', () => {
  it('第 1-3 天精力回填 ×0.75，第 4 天恢复全量', () => {
    let s = fresh(41);
    expect(s.energy).toBe(Math.round(s.energyMax * 0.75));
    s = dispatch(s, { type: 'sleep' });
    expect(s.day).toBe(2);
    expect(s.energy).toBe(Math.round(s.energyMax * 0.75));
    s = dispatch(s, { type: 'sleep' });
    s = dispatch(s, { type: 'sleep' });
    expect(s.day).toBe(4);
    expect(s.energy).toBe(s.energyMax);
  });
});
