import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch } from '../state-machine';
import { scriptFor } from '../../data/script-registry';
import { LIFE_EVENTS, LIFE_DAYS, WORLD_BEATS, ASK_COST_NARRATOR_GENERIC } from '../../data/life-events';
import { ASK_COST_NARRATOR_V2 } from '../../data/cost-narratives';
import type { GameState } from '../../types/game';

/** 跳到指定天：从新局起连睡 N 晚（走完整 runMorning，不抄近路）。 */
function toDay(seed: number, day: number): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId: 'wise_sister' });
  while (s.day < day) s = dispatch(s, { type: 'sleep' });
  return s;
}

describe('v4.0: 老头人生线——日历驱动的中期内容', () => {
  it('数据完整性：28 个节点、五个主角都有线、天不冲突超上限、日历覆盖 D3-29 无 >3 天空窗', () => {
    expect(LIFE_EVENTS.length).toBeGreaterThanOrEqual(24);
    const ids = new Set(LIFE_EVENTS.map((e) => e.targetId));
    for (const id of ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong']) {
      expect(ids.has(id), `${id} 缺人生线`).toBe(true);
    }
    // 每天的节点数不超过简报上限。
    const byDay = new Map<number, number>();
    for (const e of LIFE_EVENTS) byDay.set(e.day, (byDay.get(e.day) ?? 0) + 1);
    for (const [d, n] of byDay) expect(n, `第 ${d} 天节点超上限`).toBeLessThanOrEqual(2);
    // 日历覆盖：从第 3 天到第 29 天，相邻两天的间隔不超过 3（空窗期即流失点）。
    for (let i = 1; i < LIFE_DAYS.length; i++) {
      expect(LIFE_DAYS[i] - LIFE_DAYS[i - 1], `${LIFE_DAYS[i - 1]}→${LIFE_DAYS[i]} 空窗超 3 天`).toBeLessThanOrEqual(3);
    }
    expect(LIFE_DAYS[0]).toBeLessThanOrEqual(3);
    expect(LIFE_DAYS[LIFE_DAYS.length - 1]).toBeGreaterThanOrEqual(28);
  });

  it('Day 3 周老师的忌日到了：晨报有 life 行，他的朋友圈开了第二茬茉莉', () => {
    const s = toDay(101, 3);
    const lifeLogs = s.log.filter((l) => l.kind === 'life');
    expect(lifeLogs.length).toBe(1);
    expect(lifeLogs[0].details).toContain('茉莉');
    const zhouMoment = s.moments.find((m) => m.author === 'target' && m.targetId === 'zhou_teacher');
    expect(zhouMoment?.caption).toContain('今日不习字');
  });

  it('Day 5 老李体检报告：正常版 vs 拿够 200 元后的 costText 版（同一件事的另一面）', () => {
    const normal = toDay(201, 5);
    const liNormal = normal.log.find((l) => l.kind === 'life' && l.day === 5);
    expect(liNormal?.details).toContain('还能跑十年');

    // 拿走 200 元以上的老李——同一份报告，另一面。totalReceived 要在
    // Day 5 的早晨结算之前就位（life 行是 runMorning 里生成的）。
    let harvested = { ...createInitialState(), rngSeed: 202 };
    harvested = dispatch(harvested, { type: 'new_game', name: 'test', motive: 'debt', personaId: 'wise_sister' });
    harvested.targets.find((x) => x.targetId === 'lao_li')!.totalReceived = 300;
    while (harvested.day < 5) harvested = dispatch(harvested, { type: 'sleep' });
    const liCost = harvested.log.find((l) => l.kind === 'life' && l.day === 5);
    expect(liCost?.details).toContain('这个月手头有点紧');
  });

  it('他把你删了：日子照过——blockedLine 版落日志，不发圈、不来找', () => {
    let s = { ...createInitialState(), rngSeed: 301 };
    s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId: 'wise_sister' });
    const tz = s.targets.find((x) => x.targetId === 'zhou_teacher')!;
    tz.blocked = true;
    while (s.day < 3) s = dispatch(s, { type: 'sleep' });
    const lifeLogs = s.log.filter((l) => l.kind === 'life');
    expect(lifeLogs.length).toBe(1);
    expect(lifeLogs[0].details).toContain('他把你删了');
    // 拉黑的人不发圈、不进 incoming。
    expect(s.moments.some((m) => m.targetId === 'zhou_teacher' && m.momentDay === 3)).toBe(false);
    expect(s.incoming.some((m) => m.targetId === 'zhou_teacher')).toBe(false);
  });

  it('Day 11 老李闺女生日：信任够时会来找你（reason: his_life），内容是问礼物', () => {
    let s = toDay(401, 11);
    const inc = s.incoming.find((m) => m.targetId === 'lao_li');
    // 新局没聊过、信任 0——按门控他不该来找你（陌生人不会问礼物建议）。
    expect(inc?.reason === 'his_life').toBeFalsy();
    // 有了交情（信任 30），他真的开口问了。
    let s2 = { ...createInitialState(), rngSeed: 401 };
    s2 = dispatch(s2, { type: 'new_game', name: 'test', motive: 'debt', personaId: 'wise_sister' });
    const tl = s2.targets.find((x) => x.targetId === 'lao_li')!;
    tl.trust = 30;
    while (s2.day < 11) s2 = dispatch(s2, { type: 'sleep' });
    const inc2 = s2.incoming.find((m) => m.targetId === 'lao_li');
    expect(inc2?.reason).toBe('his_life');
    expect(inc2?.opener).toContain('闺女');
  });

  /** 开一场必然落到开口组的聊天：链全消费（含人设节点）+ 养到 harvest +
   *  recentPacks 塞满其他全部组 id（去重窗口会把它们全部排除，
   *  60 套里只剩 li2_46 可选——确定性命中，不靠种子）。 */
  function askSession(seed: number, day: number): GameState {
    let s = toDay(seed, day);
    const tl = s.targets.find((x) => x.targetId === 'lao_li')!;
    tl.trust = 70;
    tl.wariness = 0;
    tl.stage = 'harvest';
    tl.daysSincePaid = 5;
    for (const nid of ['c_li_1','c_li_2','c_li_3','c_li_4','c_li_5','c_li_6','c_li_7','c_li_8','c_li_9','c_li_10','c_li_11','c_li_wise','c_li_yatou']) {
      s.flags[`chain_${nid}`] = true;
    }
    // main-packs 10 套 + packs-li 50 套，全标"近期用过"——只留开口组可选。
    const allPacks = [...(scriptFor(tl.targetId).packs ?? [])];
    tl.recentPacks = allPacks.filter((p) => p.id !== 'li2_46').map((p) => p.id);
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'start_chat', targetId: 'lao_li' });
    const askIdx = s.chat?.pendingOptions.findIndex((o) => o.isAsk) ?? -1;
    expect(askIdx, '开口组未被选中').toBeGreaterThanOrEqual(0);
    return dispatch(s, { type: 'pick_option', optionIndex: askIdx });
  }

  it('代价呈现层：第 8 天起，要到钱的气泡后面跟一帧她看见的代价', () => {
    const s = askSession(501, 10);
    const texts = s.chat!.transcript.map((m) => m.text);
    // 红包成功 → 落一条 ASK_COST_NARRATOR（老李的池子，第 10 天 = 下标 2）。
    const pool = ASK_COST_NARRATOR_V2.lao_li;
    const hit = texts.some((t) => pool.includes(t));
    expect(hit, `代价旁白未注入，气泡: ${texts.join(' / ')}`).toBe(true);
  });

  it('第 8 天之前要到钱：没有代价旁白（代价感是后来才浮上来的）', () => {
    const s = askSession(521, 6);
    const allNarr = [...ASK_COST_NARRATOR_V2.lao_li, ...ASK_COST_NARRATOR_GENERIC];
    const texts = s.chat!.transcript.map((m) => m.text);
    expect(texts.some((t) => allNarr.includes(t))).toBe(false);
  });

  it('没人找你也不影响他的月历：30 天睡穿，主线 41 个节点全部落地，每天最多 2 条 life 行', () => {
    const s = toDay(601, 30);
    const lifeLogs = s.log.filter((l) => l.kind === 'life');
    // 30 天里：周老师 9 + 老李 10 + 王总 8 + 阿豪 7 + 陈工 7 = 41（库人物未偶遇不触发）。
    expect(lifeLogs.length).toBe(41);
    // 任一天的 life 行数不超过简报上限。
    const byDay = new Map<number, number>();
    for (const l of lifeLogs) byDay.set(l.day, (byDay.get(l.day) ?? 0) + 1);
    for (const [d, n] of byDay) expect(n, `第 ${d} 天 life 行超上限`).toBeLessThanOrEqual(2);
  });
});
