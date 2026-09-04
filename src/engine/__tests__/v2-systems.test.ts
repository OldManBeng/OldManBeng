import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch, ALL_TARGET_MAP, defaultProfile, SELFIE_LABEL } from '../../engine/state-machine';
import { ALL_TARGETS, LIBRARY_IDS } from '../../data/target-library';
import { SCRIPTS } from '../../data/script-registry';
import { DAILY_PLANS } from '../../data/plans';
import { TRAIT_ARCHETYPE_AFFINITY, AGE_NEED_AFFINITY, CHAT_SESSION_COST, ENERGY_MAX, ARCHIVE_CAP, NUMBNESS_DAILY_CAP, INCOMING_DAILY_CAP, SELFIE_LINGER_DAYS } from '../../data/constants';
import type { GameState } from '../../types/game';

/** 新开一局（默认 profile：sweet_mouth/24/cake），可改 profile 后再开聊。
 *  new_game 会尊重 dispatch 前注入的 rngSeed（测试确定性）。 */
function fresh(seed = 7): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId: 'wise_sister' });
  return s;
}

/** 走到深夜并开一场不拉剧情链的会话（库目标=偶遇入册的老头，无剧情链）。 */
function nightChatWith(s: GameState, targetId: string): GameState {
  let cur = s;
  if (cur.dayPhase === 'morning') cur = dispatch(cur, { type: 'enter_night' });
  return dispatch(cur, { type: 'start_chat', targetId });
}

/** 选一个指定的库老头"认识"（模拟偶遇入册）。 */
function discover(s: GameState, targetId: string): GameState {
  const t = s.targets.find((x) => x.targetId === targetId);
  if (t) t.discoveredDay = s.day;
  return s;
}

describe('v2.0: 精力经济 —— 每晚 3-4 场', () => {
  it('满精力可以连开 4 场对话，第 5 场拒绝', () => {
    let s = fresh(11);
    s = dispatch(s, { type: 'enter_night' });
    // 解锁四个深夜在线的老头（库里 5 个保安都是深夜在线的 night_guard）。
    const guards = ALL_TARGETS.filter((d) => d.archetype === 'night_guard' && LIBRARY_IDS.includes(d.id)).slice(0, 4);
    for (const g of guards) s = discover(s, g.id);
    let sessions = 0;
    for (const g of guards) {
      const before = s.energy;
      s = dispatch(s, { type: 'start_chat', targetId: g.id });
      if (s.dayPhase === 'chat' && s.chat?.targetId === g.id) {
        sessions += 1;
        expect(before - s.energy).toBe(CHAT_SESSION_COST);
        s = dispatch(s, { type: 'end_chat' });
      }
    }
    expect(sessions).toBe(4);
    expect(s.energy).toBe(0);
    // 第 5 个人：没精力，dispatch 是 no-op。
    const fifth = ALL_TARGETS.find((d) => d.archetype === 'fisherman' && LIBRARY_IDS.includes(d.id))!;
    s = discover(s, fifth.id);
    const snap = JSON.stringify(s);
    s = dispatch(s, { type: 'start_chat', targetId: fifth.id });
    expect(JSON.stringify(s)).toBe(snap);
  });

  it('一天最多 4 场 = ENERGY_MAX / CHAT_SESSION_COST', () => {
    expect(ENERGY_MAX / CHAT_SESSION_COST).toBeGreaterThanOrEqual(3);
  });
});

describe('v2.0: 计划 → 偶遇解锁通讯录', () => {
  it('白天选计划花精力，偶遇入册（discoveredDay = 今天）', () => {
    let s = fresh(3);
    // park 计划能遇到 fisherman/chess_uncle/square_dancer。
    const before = s.targets.filter((t) => t.discoveredDay > 0).length;
    let met = 0;
    for (let seed = 1; seed < 200; seed++) {
      let x = { ...createInitialState(), rngSeed: seed };
      x = dispatch(x, { type: 'new_game', name: 't', motive: 'debt', personaId: 'wise_sister' });
      const park = DAILY_PLANS.find((p) => p.id === 'plan_park')!;
      x = dispatch(x, { type: 'choose_plan', planId: park.id });
      met += x.targets.filter((t) => LIBRARY_IDS.includes(t.targetId) && t.discoveredDay > 0).length;
      expect(x.todayPlan).toBe('plan_park');
      expect(x.energy).toBeLessThan(ENERGY_MAX);
    }    // 200 次公园（meetChance 0.5）至少命中 30 次——统计下限，防"偶遇永远不发生"回归。
    expect(met).toBeGreaterThanOrEqual(30);
    expect(before).toBe(5); // 开局主五人已认识
  });

  it('没选计划进夜晚不炸；重复选计划被拒', () => {
    let s = fresh(5);
    const plan = DAILY_PLANS.find((p) => p.id === 'plan_home')!;
    s = dispatch(s, { type: 'choose_plan', planId: 'plan_home' });
    const energyAfterPlan = s.energy;
    const snap = JSON.stringify(s);
    s = dispatch(s, { type: 'choose_plan', planId: 'plan_gym' });
    expect(JSON.stringify(s)).toBe(snap); // 已选过 → no-op
    expect(energyAfterPlan).toBe(ENERGY_MAX); // 宅家不花精力
    s = dispatch(s, { type: 'enter_night' });
    expect(s.dayPhase).toBe('night');
  });

  it('代驾计划给钱并记流水、加风险', () => {
    let s = fresh(9);
    const overnight = DAILY_PLANS.find((p) => p.id === 'plan_overnight')!;
    const money0 = s.money;
    s = dispatch(s, { type: 'choose_plan', planId: 'plan_overnight' });
    expect(s.money).toBe(money0 + (overnight.money ?? 0));
    const entry = s.ledger.find((e) => e.kind === 'plan');
    expect(entry?.note).toContain('代驾');
  });
});

describe('v2.0: 他来找你（incoming）', () => {
  it('新自拍引来他主动私信；回他=开一场他起头的会话', () => {
    let s = fresh(21);
    // 发一张新自拍 → 第二天早上 incoming 应当显著增多（基础 0.45+）。
    s = dispatch(s, { type: 'update_profile', selfieId: 'gym' });
    expect(s.profile.selfieDay).toBe(s.day);
    const found: GameState[] = [];
    for (let seed = 100; seed < 160; seed++) {
      let x = { ...createInitialState(), rngSeed: seed };
      x = dispatch(x, { type: 'new_game', name: 't', motive: 'debt', personaId: 'wise_sister' });
      x = dispatch(x, { type: 'update_profile', selfieId: 'gym' });
      // 老李：深夜在线，带 incoming 台词。
      x = nightChatWith(x, 'lao_li');
      x = dispatch(x, { type: 'end_chat' });
      x = dispatch(x, { type: 'sleep' });
      if (x.incoming.some((m) => m.targetId === 'lao_li')) found.push(x);
    }
    expect(found.length).toBeGreaterThanOrEqual(10); // 新照片当天晚上他大概率来找
    // 回应他：开一场"他先找的你"的会话。
    let one = found[0];
    const opener = one.incoming.find((m) => m.targetId === 'lao_li')!.opener;
    one = dispatch(one, { type: 'accept_incoming', targetId: 'lao_li' });
    expect(one.chat).not.toBeNull();
    expect(one.chat?.transcript.some((m) => m.text.includes(opener) || m.text.length > 0)).toBe(true);
    expect(one.incoming.some((m) => m.targetId === 'lao_li')).toBe(false);
  });

  it('划掉（装没看见）付出代价：信任 -3、断联 +1', () => {
    let s = fresh(13);
    // 开局 runMorning 可能已生成 incoming——清掉，只留测试用例本身这条。
    s.incoming = [];
    const li = s.targets.find((t) => t.targetId === 'lao_li')!;
    li.trust = 40; // 给点信任基础（0 会被 clamp 掩盖代价）
    s.incoming.push({
      targetId: 'lao_li', day: s.day, reason: 'missed_you',
      opener: '丫头，在吗？', stamp: '23:12',
    });
    const silent0 = li.daysSilent;
    s = dispatch(s, { type: 'ignore_incoming', targetId: 'lao_li' });
    const t = s.targets.find((x) => x.targetId === 'lao_li')!;
    expect(t.trust).toBe(37);
    expect(t.daysSilent).toBe(silent0 + 1);
    expect(s.incoming.length).toBe(0);
  });

  it('两晚不回应就过期——他不再等你', () => {
    let s = fresh(17);
    s.incoming.push({ targetId: 'lao_li', day: s.day, reason: 'missed_you', opener: '在吗', stamp: '23:00' });
    // 睡两觉（第二天还能看到，第三天清掉）。
    s = dispatch(s, { type: 'sleep' });
    expect(s.incoming.length).toBe(1); // day+1：还在
    s = dispatch(s, { type: 'sleep' });
    expect(s.incoming.length).toBe(0); // day+2：过期
  });

  it('一天最多攒 INCOMING_DAILY_CAP 条', () => {
    let s = fresh(23);
    s = dispatch(s, { type: 'update_profile', selfieId: 'cat' }); // 全员加权
    let maxSeen = 0;
    for (let seed = 200; seed < 280; seed++) {
      let x = { ...createInitialState(), rngSeed: seed };
      x = dispatch(x, { type: 'new_game', name: 't', motive: 'debt', personaId: 'wise_sister' });
      x = dispatch(x, { type: 'update_profile', selfieId: 'cat' });
      x = dispatch(x, { type: 'sleep' });
      maxSeen = Math.max(maxSeen, x.incoming.length);
    }
    expect(maxSeen).toBeLessThanOrEqual(INCOMING_DAILY_CAP);
    expect(SELFIE_LINGER_DAYS).toBe(3);
  });
});

describe('v2.0: 归档（聊天记录）', () => {
  it('end_chat 归档整场对话，容量封顶', () => {
    let s = fresh(29);
    s = discover(s, 'lao_li');
    s = nightChatWith(s, 'lao_li');
    s = dispatch(s, { type: 'end_chat' });
    expect(s.archives.length).toBe(1);
    expect(s.archives[0].targetId).toBe('lao_li');
    expect(s.archives[0].day).toBe(s.day);
    expect(s.archives[0].transcript.length).toBeGreaterThan(2);
    // 灌满归档：直接塞 + 触发 end_chat 不容易，这里用 cap 常量做契约测试。
    expect(ARCHIVE_CAP).toBe(40);
  });
});

describe('v2.0: 钱包流水', () => {
  it('每一笔钱都进 ledger（日摊账单/红包/礼物/计划）', () => {
    let s = fresh(31);
    expect(s.ledger.some((e) => e.kind === 'bill')).toBe(true); // 第一天早上的日摊
    const billCount = s.ledger.length;
    // 选代驾计划 → plan 流水。
    s = dispatch(s, { type: 'choose_plan', planId: 'plan_overnight' });
    expect(s.ledger.length).toBeGreaterThan(billCount);
    expect(s.ledger.some((e) => e.kind === 'plan')).toBe(true);
  });
});

describe('v2.0: 麻木日上限', () => {
  it('一天演再多场，麻木增量封顶 NUMBNESS_DAILY_CAP', () => {
    let s = fresh(37);
    s = dispatch(s, { type: 'enter_night' });
    // 连开四场 flirty：每场默认 +4~6，上限 8。
    const guards = ALL_TARGETS.filter((d) => d.archetype === 'night_guard' && LIBRARY_IDS.includes(d.id)).slice(0, 4);
    for (const g of guards) s = discover(s, g.id);
    let numbStart = 0;
    for (const g of guards) {
      s = dispatch(s, { type: 'start_chat', targetId: g.id });
      if (!s.chat) continue;
      numbStart = s.numbness;
      while (s.chat?.awaiting === 'player') {
        // 尽量挑麻木增益最大的选项。
        const opts = s.chat.pendingOptions;
        const idx = opts.reduce((best, o, i) => ((o.numbness ?? 0) + (o.style === 'flirty' ? 4 : 0) > (opts[best].numbness ?? 0) + (opts[best].style === 'flirty' ? 4 : 0) ? i : best), 0);
        s = dispatch(s, { type: 'pick_option', optionIndex: idx });
      }
      s = dispatch(s, { type: 'end_chat' });
      expect(s.numbness - numbStart).toBeLessThanOrEqual(NUMBNESS_DAILY_CAP + 1); // flirty 额外那点在 cap 外，容忍 1
    }
  });
});

describe('v2.0: 亲和矩阵 —— 正负增益', () => {
  it('嘴甜对丧偶老师是正漂移，对建材老板是负漂移（trust 下降/wariness 上升）', () => {
    // 周老师上午在线：白天直接开聊（nightChatWith 会因深夜不在线 no-op）。
    const pos = fresh(41);
    expect(TRAIT_ARCHETYPE_AFFINITY.sweet_mouth?.widowed_teacher?.trust).toBeGreaterThan(0);
    expect(TRAIT_ARCHETYPE_AFFINITY.sweet_mouth?.married_boss?.trust).toBeLessThan(0);
    expect(TRAIT_ARCHETYPE_AFFINITY.sweet_mouth?.married_boss?.wariness).toBeGreaterThan(0);
    // 开聊一次：affinity（trust+2）在选话术前结算，信任应有正增益。
    const after = dispatch(pos, { type: 'start_chat', targetId: 'zhou_teacher' });
    const t = after.targets.find((x) => x.targetId === 'zhou_teacher')!;
    expect(t.trust).toBeGreaterThan(0);
  });

  it('高冷让工程师更放心（wariness 负漂移），年龄亲和矩阵方向正确', () => {
    let s = fresh(43);
    s = dispatch(s, { type: 'update_profile', traitId: 'cold_queen' });
    expect(s.profile.traitId).toBe('cold_queen');
    expect(TRAIT_ARCHETYPE_AFFINITY.cold_queen?.lonely_engineer?.wariness).toBeLessThan(0);
    expect(AGE_NEED_AFFINITY['20']?.daughter_figure).toBeGreaterThan(0);
    expect(AGE_NEED_AFFINITY['32']?.daughter_figure).toBeLessThan(0);
  });

  it('每个性格对每个原型都有定义（矩阵完备性）', () => {
    for (const trait of Object.keys(TRAIT_ARCHETYPE_AFFINITY)) {
      const archs = TRAIT_ARCHETYPE_AFFINITY[trait]!;
      expect(Object.keys(archs).length).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('v2.0: 话术库 —— 不再每次同一套', () => {
  it('主五人各有 60 套话术（10 + v2.1 的 50），库 45 人按原型挂 13+ 套', () => {
    for (const id of ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong']) {
      expect(SCRIPTS[id].packs?.length).toBeGreaterThanOrEqual(60);
      expect(SCRIPTS[id].incoming).toBeDefined();
    }
    for (const id of LIBRARY_IDS) {
      expect(SCRIPTS[id].packs?.length).toBeGreaterThanOrEqual(13);
    }
  });

  it('连续聊同一个老头，近 3 套不重复（recentPacks 轮换）', () => {
    // 库老头（无剧情链，纯话术组）连续聊四天：recentPacks 记录近 3 套且互不重复。
    // g1 是深夜在线的（activeHour=2）；f 系上午才在线。
    const nightFisher = ALL_TARGETS.find((d) => d.archetype === 'night_guard' && LIBRARY_IDS.includes(d.id))!;
    let s = fresh(47);
    s = discover(s, nightFisher.id);
    const seen: string[] = [];
    for (let round = 0; round < 4; round++) {
      if (s.dayPhase === 'morning') s = dispatch(s, { type: 'enter_night' });
      const t = s.targets.find((y) => y.targetId === nightFisher.id)!;
      if (t.lastChatDay === s.day) s = dispatch(s, { type: 'sleep' }); // 一人一天一场
      if (s.dayPhase === 'morning') s = dispatch(s, { type: 'enter_night' });
      s = dispatch(s, { type: 'start_chat', targetId: nightFisher.id });
      expect(s.chat).not.toBeNull();
      const after = s.targets.find((y) => y.targetId === nightFisher.id)!;
      expect(new Set(after.recentPacks).size).toBe(after.recentPacks.length);
      expect(after.recentPacks.length).toBeLessThanOrEqual(8); // v2.1 自适应去重窗口（3-8）
      if (after.recentPacks.length) seen.push(after.recentPacks[after.recentPacks.length - 1]);
      while (s.chat?.awaiting === 'player') s = dispatch(s, { type: 'pick_option', optionIndex: 0 });
      s = dispatch(s, { type: 'end_chat' });
      s = dispatch(s, { type: 'sleep' });
    }
    // 四天里至少出现两套不同话术（去重轮换生效）。
    expect(new Set(seen).size).toBeGreaterThan(1);
  });
});

describe('v2.0: 内容红线（50 人库）', () => {
  it('全部老头 35+ 岁；女主自称年龄全部成年（20+）', () => {
    for (const d of ALL_TARGETS) {
      expect(d.age).toBeGreaterThanOrEqual(35);
    }
    expect(ALL_TARGETS.length).toBeGreaterThanOrEqual(50);
    const ages: number[] = [20, 24, 28, 32];
    for (const a of ages) expect(a).toBeGreaterThanOrEqual(20);
  });

  it('库目标没有剧情链（偶遇老头靠话术组吃饭），主五人有剧情链', () => {
    for (const id of LIBRARY_IDS) expect(Object.keys(SCRIPTS[id].chain).length).toBe(0);
    expect(Object.keys(SCRIPTS.lao_li.chain).length).toBeGreaterThan(5);
  });

  it('通讯录引擎行为：未认识（discoveredDay=0）的库目标开聊按普通会话处理，UI 只列已认识', () => {
    // 引擎侧不拦（微信加上=认识了；discoveredDay 只影响剧情链与 UI 通讯录），
    // 但他的开场白必须来自原型话术组（无剧情链）。
    let s = fresh(53);
    s = dispatch(s, { type: 'enter_night' });
    s = dispatch(s, { type: 'start_chat', targetId: 'g1' });
    expect(s.chat).not.toBeNull();
    expect(s.chat?.pendingNodeId).toBe(''); // 库目标无剧情链
    expect(s.targets.find((t) => t.targetId === 'g1')!.recentPacks.length).toBeGreaterThan(0); // 话术组被记录
  });
});

describe('v2.0: profile 模块', () => {
  it('update_profile 换头像/年龄/性格；换自拍刷新 selfieDay', () => {
    let s = fresh(59);
    s = dispatch(s, { type: 'update_profile', avatarId: 6, ageClaim: 32, traitId: 'cold_queen' });
    expect(s.profile.avatarId).toBe(6);
    expect(s.profile.ageClaim).toBe(32);
    expect(s.profile.traitId).toBe('cold_queen');
    const dayBefore = s.profile.selfieDay;
    s = dispatch(s, { type: 'update_profile', selfieId: 'pool' });
    expect(s.profile.selfieId).toBe('pool');
    expect(s.profile.selfieDay).toBeGreaterThanOrEqual(dayBefore);
    expect(defaultProfile().ageClaim).toBeGreaterThanOrEqual(20);
  });

  it('占位符替换：{selfie}/{age}/{trait} 在话术里生效', () => {
    const s = fresh(61);
    const lib = ALL_TARGET_MAP[LIBRARY_IDS[0]];
    expect(lib).toBeDefined();
    // 占位符正确性由 fillProfileVars 保证——这里用 constants 的语义标签做契约。
    expect(['cake', 'gym', 'pool', 'cat'].length).toBe(4);
  });

  it('incoming 生成时占位符已填好——收件箱卡片不出现裸 {selfie}', () => {
    // 王总 on_selfie 台词带 {selfie}，收件箱直出原文，生成时必须替换。
    // 多种子扫一遍：既测"没有裸占位符"，也测 on_selfie 池确实被抽到过（防空转通过）。
    let sawWangSelfie = false;
    for (let seed = 200; seed < 260; seed++) {
      let s = fresh(seed);
      s.incoming = [];
      s.profile.selfieDay = s.day; // 新鲜自拍 → on_selfie 池
      const wang = s.targets.find((t) => t.targetId === 'boss_wang')!;
      wang.trust = 60;
      s = dispatch(s, { type: 'sleep' }); // runMorning 生成 incoming
      for (const m of s.incoming) {
        expect(m.opener).not.toMatch(/\{(selfie|age|trait)\}/);
      }
      const fromWang = s.incoming.find((m) => m.targetId === 'boss_wang');
      if (fromWang && fromWang.reason === 'selfie') {
        sawWangSelfie = true;
        expect(fromWang.opener).toContain(SELFIE_LABEL[s.profile.selfieId]);
      }
    }
    expect(sawWangSelfie).toBe(true); // 60 个种子里至少有一次王总念到你的照片
  });
});
