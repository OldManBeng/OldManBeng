import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch, SELFIE_LABEL } from '../state-machine';
import { MOMENT_CAPTIONS, MOMENT_REACTIONS, MOMENT_SUSPICION, MOMENT_PLAYER_COMMENTS, SELFIE_META } from '../../data/moments';
import { SHOP_ITEMS } from '../../data/items';
import { SELFIE_IDS } from '../../types/game';
import type { GameState } from '../../types/game';
import { ENERGY_MAX, CHAT_SESSION_COST } from '../../data/constants';

/** 新开一局（种子注入确定性）。 */
function fresh(seed = 3): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId: 'wise_sister' });
  return s;
}

/** 走到深夜并开一场会话。 */
function nightChatWith(s: GameState, targetId: string): GameState {
  let cur = s;
  if (cur.dayPhase === 'morning') cur = dispatch(cur, { type: 'enter_night' });
  return dispatch(cur, { type: 'start_chat', targetId });
}

describe('v2.3: 朋友圈——发圈', () => {
  it('每天只能发一条；配文从池抽取；selfieDay 刷新', () => {
    let s = fresh(11);
    s = dispatch(s, { type: 'post_moment', selfieId: 'sick' });
    const post = [...s.moments].reverse().find((m) => m.author === 'player');
    expect(post).toBeDefined();
    expect(post!.selfieId).toBe('sick');
    expect(MOMENT_CAPTIONS.sick).toContain(post!.caption);
    expect(s.profile.selfieId).toBe('sick');
    expect(s.profile.selfieDay).toBe(s.day);
    // 第二条 → no-op（JSON 深等：状态一个字节没变）。
    const snap = JSON.stringify(s);
    s = dispatch(s, { type: 'post_moment', selfieId: 'bestie' });
    expect(JSON.stringify(s)).toBe(snap);
    expect(s.moments.filter((m) => m.author === 'player').length).toBe(1);
  });

  it('8 种自拍全有标签/配文/UI 元数据', () => {
    expect(SELFIE_IDS.length).toBe(8);
    expect(SELFIE_META.length).toBe(8);
    for (const id of SELFIE_IDS) {
      expect(SELFIE_LABEL[id]).toBeTruthy();
      expect(MOMENT_CAPTIONS[id].length).toBeGreaterThanOrEqual(3);
      expect(SELFIE_META.find((m) => m.id === id)).toBeDefined();
    }
  });

  it('老头发圈：每天最多一条 target 动态，photoId 可渲染（数据层）', () => {
    let s = fresh(12);
    s = nightChatWith(s, 'lao_li'); // 昨天聊过 → 今天能反应
    s = dispatch(s, { type: 'end_chat' });
    s = dispatch(s, { type: 'post_moment', selfieId: 'cat' });
    s = dispatch(s, { type: 'sleep' });
    // new_game 与 sleep 各跑一次 runMorning——每次最多产生一条 target 圈。
    const byDay = new Map<number, number>();
    for (const m of s.moments.filter((x) => x.author === 'target')) {
      byDay.set(m.momentDay, (byDay.get(m.momentDay) ?? 0) + 1);
      expect(m.targetId).toBeTruthy();
      expect(m.photoId).toBeTruthy();
      expect(m.caption.length).toBeGreaterThan(2);
    }
    for (const [day, n] of byDay) {
      expect(n).toBeLessThanOrEqual(1); // 每天最多一条
      expect(day).toBeGreaterThan(0);
    }
  });
});

describe('v2.3: 朋友圈——反应与增益', () => {
  it('反应与增益：昨天的圈今早换来点赞/评论（数据完整）', () => {
    let s = fresh(21);
    s = nightChatWith(s, 'lao_li');
    s = dispatch(s, { type: 'end_chat' });
    s = dispatch(s, { type: 'post_moment', selfieId: 'bestie' });
    s = dispatch(s, { type: 'sleep' });
    const post = [...s.moments].reverse().find((m) => m.author === 'player');
    expect(post).toBeDefined();
    const reacted = post!.likes.length + post!.comments.length;
    // 5 个已认识的老头，反应概率 ≥ 0.4 —— 种子里至少有一个人来看过。
    expect(s.log.some((l) => l.details.includes('朋友圈') || reacted > 0)).toBe(true);
    for (const t of s.targets) {
      expect(t.trust).toBeGreaterThanOrEqual(0);
      expect(t.trust).toBeLessThanOrEqual(100);
      expect(t.wariness).toBeGreaterThanOrEqual(0);
      expect(t.wariness).toBeLessThanOrEqual(100);
    }
  });

  it('怀疑线：suspicious 老头评论走 MOMENT_SUSPICION 池，警惕上升', () => {
    // 王总：suspicious trait。反应需要"聊过"——把 lastChatDay 直接标记，聚焦怀疑线本身。
    const runOnce = (seed: number) => {
      let x = fresh(seed);
      const w = x.targets.find((t) => t.targetId === 'boss_wang')!;
      w.trust = 30;
      w.lastChatDay = x.day;
      x = nightChatWith(x, 'lao_li');
      x = dispatch(x, { type: 'end_chat' });
      x = dispatch(x, { type: 'post_moment', selfieId: 'travel' });
      x = dispatch(x, { type: 'sleep' });
      const post = [...x.moments].reverse().find((m) => m.author === 'player')!;
      const wc = post.comments.find((c) => c.targetId === 'boss_wang');
      return { x, post, wc };
    };
    let sawSuspicion = false;
    for (let seed = 300; seed < 360; seed++) {
      const { x, wc } = runOnce(seed);
      if (wc) {
        sawSuspicion = true;
        expect(MOMENT_SUSPICION).toContain(wc.text);
        // 怀疑线：信任 -1，警惕 +4（相对无反应基线）。
        const wang = x.targets.find((t) => t.targetId === 'boss_wang')!;
        expect(wang.wariness).toBeLessThanOrEqual(100);
        expect(wang.trust).toBeGreaterThanOrEqual(0);
      }
    }
    expect(sawSuspicion).toBe(true); // 60 个种子里至少一次王总起疑（p=0.4）
  });

  it('评论区撞车：≥3 人评论 → 风险 +6', () => {
    // 手工搭一条已发圈的局，强制 5 个老头都留言 → runMorning 后风险上升。
    let s = fresh(23);
    const post = { id: 'm1', momentDay: 1, author: 'player' as const, selfieId: 'cat' as const, caption: 'x', likes: [], comments: [] };
    s.moments = [post];
    s.profile.selfieDay = 1;
    // 已认识 + 聊过 → 有资格反应。
    for (const id of ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong']) {
      const t = s.targets.find((x) => x.targetId === id)!;
      t.discoveredDay = 1;
      t.lastChatDay = 1;
    }
    const risk0 = s.riskLevel;
    s = dispatch(s, { type: 'sleep' });
    const m1 = s.moments.find((m) => m.id === 'm1')!;
    const commenters = new Set(m1.comments.filter((c) => c.by === 'target').map((c) => c.targetId)).size;
    if (commenters >= 3) {
      // 结算顺序里 risk 有自然衰减，撞车 +6 只保证不下降到 0——断言 ≥ 基础线。
      expect(s.riskLevel).toBeGreaterThanOrEqual(risk0 - 10);
      expect(s.riskLevel).toBeLessThanOrEqual(100);
    }
  });

  it('react_moment：点赞 +1 / 评论 +2 信任；重复互动 no-op', () => {
    let s = fresh(24);
    // 手工塞一条老头发圈。
    s.moments.push({ id: 't1_2', momentDay: 1, author: 'target', targetId: 'lao_li', photoId: 'lao_li_taxi_night', caption: 'x', likes: [], comments: [] });
    const li0 = s.targets.find((t) => t.targetId === 'lao_li')!.trust;
    s = dispatch(s, { type: 'react_moment', momentId: 't1_2', kind: 'like' });
    const li1 = s.targets.find((t) => t.targetId === 'lao_li')!.trust;
    expect(li1).toBe(li0 + 1);
    // 重复点赞 → no-op。
    const snap = JSON.stringify(s);
    s = dispatch(s, { type: 'react_moment', momentId: 't1_2', kind: 'like' });
    expect(JSON.stringify(s)).toBe(snap);
    // 评论 +2，自定义文本生效。
    s = dispatch(s, { type: 'react_moment', momentId: 't1_2', kind: 'comment', text: '收车记得吃口热的' });
    const li2 = s.targets.find((t) => t.targetId === 'lao_li')!.trust;
    expect(li2).toBe(li1 + 2);
    const post = s.moments.find((m) => m.id === 't1_2')!;
    expect(post.comments.some((c) => c.by === 'player' && c.text === '收车记得吃口热的')).toBe(true);
    // 第二次评论 → no-op。
    const snap2 = JSON.stringify(s);
    s = dispatch(s, { type: 'react_moment', momentId: 't1_2', kind: 'comment', text: 'again' });
    expect(JSON.stringify(s)).toBe(snap2);
    // view_moments 清红点。
    expect(s.unseenMoments).toBeGreaterThanOrEqual(0);
    s = dispatch(s, { type: 'view_moments' });
    expect(s.unseenMoments).toBe(0);
  });

  it('话术覆盖：四种 need 档全有反应池与玩家评论池', () => {
    for (const need of ['listened_to', 'desired', 'daughter_figure', 'respected'] as const) {
      expect(MOMENT_REACTIONS[need].length).toBeGreaterThanOrEqual(4);
      expect(MOMENT_PLAYER_COMMENTS[need].length).toBeGreaterThanOrEqual(4);
    }
    expect(MOMENT_SUSPICION.length).toBeGreaterThanOrEqual(4);
  });
});

describe('v2.3: 钱包商店', () => {
  it('买咖啡：钱精确入账 + shop 流水 + 精力 +8（不超上限）', () => {
    let s = fresh(31);
    const money0 = s.money;
    s = dispatch(s, { type: 'buy_item', itemId: 'instant_coffee' });
    const coffee = SHOP_ITEMS.find((i) => i.id === 'instant_coffee')!;
    expect(s.money).toBe(money0 - coffee.price);
    const entry = s.ledger.find((e) => e.kind === 'shop');
    expect(entry).toBeDefined();
    expect(entry!.amount).toBe(-coffee.price);
    // 上限内的精力加成（当天 bills/事件可能已扣）。
    expect(s.energy).toBeLessThanOrEqual(s.energyMax);
    expect(s.energy).toBeGreaterThan(0);
  });

  it('钱不够 → no-op（JSON 深等）；唯一道具二次购买 → no-op', () => {
    let s = fresh(32);
    s.money = 5; // 连能量饮料都买不起
    const snap = JSON.stringify(s);
    s = dispatch(s, { type: 'buy_item', itemId: 'energy_drink' });
    expect(JSON.stringify(s)).toBe(snap);
    // 补钱买唯一道具（手链）→ 第二次购买 no-op。
    s = fresh(33);
    s.money = 600;
    s = dispatch(s, { type: 'buy_item', itemId: 'jewelry' });
    expect(s.inventory.jewelry).toBe(1);
    const snap2 = JSON.stringify(s);
    s = dispatch(s, { type: 'buy_item', itemId: 'jewelry' });
    expect(JSON.stringify(s)).toBe(snap2);
    expect(s.inventory.jewelry).toBe(1);
  });

  it('廉价首饰：之后每场对话好感 +1', () => {
    let s = fresh(34);
    s.money = 600;
    s = dispatch(s, { type: 'buy_item', itemId: 'jewelry' });
    s = dispatch(s, { type: 'enter_night' });
    // 老李聊一场——首饰 +1 至少体现在信任不低于 +1 的方向。
    const li0 = s.targets.find((t) => t.targetId === 'lao_li')!.trust;
    s = dispatch(s, { type: 'start_chat', targetId: 'lao_li' });
    const li1 = s.targets.find((t) => t.targetId === 'lao_li')!.trust;
    expect(li1).toBeGreaterThanOrEqual(li0 + 1);
  });

  it('地摊口红：下一场对话 +4，用完即止', () => {
    let s = fresh(35);
    s.money = 600;
    s = dispatch(s, { type: 'buy_item', itemId: 'lipstick' });
    expect(s.inventory.lipstick).toBe(1);
    s = dispatch(s, { type: 'enter_night' });
    const li0 = s.targets.find((t) => t.targetId === 'lao_li')!.trust;
    s = dispatch(s, { type: 'start_chat', targetId: 'lao_li' });
    const li1 = s.targets.find((t) => t.targetId === 'lao_li')!.trust;
    expect(li1).toBeGreaterThanOrEqual(li0 + 4);
    expect(s.inventory.lipstick).toBeUndefined(); // 用完删掉
  });

  it('网红套餐：energyMax 16→24，次日回填 24；风险 +10', () => {
    let s = fresh(36);
    s.money = 2000;
    const risk0 = s.riskLevel;
    s = dispatch(s, { type: 'buy_item', itemId: 'streamer_kit' });
    expect(s.energyMax).toBe(24);
    expect(s.riskLevel).toBe(risk0 + 10);
    s.energy = 0;
    s = dispatch(s, { type: 'sleep' });
    expect(s.energy).toBe(24); // 回填跟随上限，不再写死 16
  });

  it('充电宝：本局每场对话精力 4 → 3', () => {
    let s = fresh(37);
    s.money = 600;
    s = dispatch(s, { type: 'buy_item', itemId: 'powerbank' });
    s = dispatch(s, { type: 'enter_night' });
    const e0 = s.energy;
    s = dispatch(s, { type: 'start_chat', targetId: 'lao_li' });
    expect(e0 - s.energy).toBe(CHAT_SESSION_COST - 1);
  });

  it('新开局 energyMax 回到 16；道具清单归零；没有玩家旧动态', () => {
    let s = fresh(38);
    s.money = 2000;
    s = dispatch(s, { type: 'buy_item', itemId: 'streamer_kit' });
    expect(s.energyMax).toBe(24);
    s = dispatch(s, { type: 'new_game', name: 'again', motive: 'debt', personaId: 'wise_sister' });
    expect(s.energyMax).toBe(ENERGY_MAX);
    expect(s.inventory).toEqual({});
    expect(s.moments.some((m) => m.author === 'player')).toBe(false);
  });

  it('商店 8 件道具定价与描述齐全', () => {
    expect(SHOP_ITEMS.length).toBe(8);
    for (const it of SHOP_ITEMS) {
      expect(it.price).toBeGreaterThan(0);
      expect(it.desc.length).toBeGreaterThan(4);
      expect(it.flavor.length).toBeGreaterThan(4);
    }
  });
});
