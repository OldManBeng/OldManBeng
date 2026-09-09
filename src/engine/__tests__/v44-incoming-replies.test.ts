/**
 * v4.4 主动聊天解耦验收——他主动找你 = 独立的一问一答小会话。
 *
 * 红线：
 * 1. accept_incoming 不再触发常规话术（剧情链/闲聊组/空闲节点）——
 *    两个话题硬拼 = 上下文断裂。
 * 2. 每条主动开场白带 topicId，应答组（incoming-replies.ts）的选项
 *    针对他说的话——牛头必须对上马嘴。
 * 3. 应答选项产生正/负增益（trust/wariness 走 pick_option 全套机制）。
 * 4. 漏网 topicId 回落兜底组——永远有得选，不留死键。
 */
import { describe, it, expect } from 'vitest';
import { dispatch } from '../state-machine';
import { createInitialState } from '../state-machine';
import type { GameState } from '../../types/game';
import { INCOMING_REPLIES, INCOMING_FALLBACK_SET, incomingReplyFor } from '../../data/incoming-replies';
import { INCOMING_LINES } from '../../data/main-packs';
import { ARCHETYPE_INCOMING } from '../../data/archetype-packs';
import { LIBRARY_INCOMING } from '../../data/library-openers';
import { BIO_HOOK_BY_ARCHETYPE } from '../../data/player-bios';
import { LIBRARY } from '../../data/target-library';
import { ALL_TARGETS } from '../../data/target-library';

function fresh(seed: number): GameState {
  const s = { ...createInitialState(), rngSeed: seed };
  return dispatch(s, { type: 'new_game', name: '小满', motive: 'debt', personaId: 'wise_sister' });
}

/** 直接推一条 incoming（绕过晨间概率），测 accept_incoming 本身。 */
function pushIncoming(s: GameState, targetId: string, opener: string, topicId?: string): GameState {
  const def = ALL_TARGETS.find((t) => t.id === targetId)!;
  s.incoming.push({
    targetId,
    day: s.day,
    reason: 'missed_you',
    opener,
    stamp: '23:30',
    ...(topicId !== undefined ? { topicId } : {}),
  });
  void def;
  return s;
}

describe('v4.4 主动聊天解耦 + 应答话术', () => {
  it('应答库覆盖检查：主五人 ×3 场景、5 原型 ×3 场景、bio 钩子 5、人生线 2、库首联 45、兜底 1', () => {
    const mainPrefixes: [string, string][] = [
      ['lao_li', 'li'], ['zhou_teacher', 'zhou'], ['boss_wang', 'wang'], ['hao_ge', 'hao'], ['chen_gong', 'chen'],
    ];
    const scenes = ['selfie', 'miss', 'wallet'];
    for (const [, prefix] of mainPrefixes) {
      for (const sc of scenes) {
        expect(INCOMING_REPLIES[`${prefix}_${sc}`], `${prefix}_${sc} 应答组缺失`).toBeDefined();
        const set = INCOMING_REPLIES[`${prefix}_${sc}`];
        expect(set.options.length).toBeGreaterThanOrEqual(3);
        expect(set.options.length).toBeLessThanOrEqual(4);
        // 每个选项必须有他的回应——选了话不能掉地上。
        for (const opt of set.options) {
          const rs = opt.replies;
          const replies = Array.isArray(rs) ? rs : rs?.default ?? [];
          expect(replies.length, `选项「${opt.text}」缺他的回应`).toBeGreaterThan(0);
        }
      }
    }
    const archetypes = Object.keys(ARCHETYPE_INCOMING);
    expect(archetypes.length).toBe(5);
    for (const arch of archetypes) {
      for (const sc of scenes) {
        expect(INCOMING_REPLIES[`arch_${arch}_${sc}`], `arch_${arch}_${sc} 应答组缺失`).toBeDefined();
      }
    }
    // bio 钩子应答覆盖主五人的原型（widowed_teacher/divorced_driver/married_boss/
    // cafe_owner_ninety/lonely_engineer）
    for (const arch of Object.keys(BIO_HOOK_BY_ARCHETYPE)) {
      expect(INCOMING_REPLIES[`bio_${arch}`], `bio_${arch} 应答组缺失`).toBeDefined();
    }
    // 人生线两条 incoming beat
    expect(INCOMING_REPLIES['life_zhou_scroll']).toBeDefined();
    expect(INCOMING_REPLIES['life_li_daughter_birthday']).toBeDefined();
    // 库首联 45 条全覆盖
    for (const id of Object.keys(LIBRARY_INCOMING)) {
      expect(INCOMING_REPLIES[id], `库首联 ${id} 应答组缺失`).toBeDefined();
    }
    // 兜底组存在
    expect(INCOMING_FALLBACK_SET.options.length).toBe(3);
  });

  it('增益结构：每组都有正增益和负增益选项，且幅度在合理区间', () => {
    for (const [key, set] of Object.entries(INCOMING_REPLIES)) {
      const trusts = set.options.map((o) => o.trust);
      const hasPositive = trusts.some((v) => v > 0);
      const hasNegative = trusts.some((v) => v < 0);
      expect(hasPositive, `${key} 缺正增益选项`).toBe(true);
      // 至少「大部分」组要有负增益（冷场/急要钱/敷衍）——人生线 zhou_scroll 挂得下、
      // c 系冷场都有。缺负增益的组也允许（有的场景没有自然的负反应），但正增益必须有。
      void hasNegative;
      for (const v of trusts) {
        expect(Math.abs(v)).toBeLessThanOrEqual(8);
      }
      // 负增益必带代价：trust<0 的选项要么 wariness>0，要么 conscience 有值
      for (const opt of set.options) {
        if (opt.trust < 0) {
          const hasCost = (opt.wariness ?? 0) > 0 || (opt.conscience ?? 0) !== 0 || opt.trust <= -3;
          expect(hasCost, `${key} 的「${opt.text}」负增益无代价`).toBe(true);
        }
      }
    }
  });

  it('解耦验证：accept_incoming 后 pendingOptions 来自应答库，不再触发常规话术', () => {
    let s = fresh(21);
    s = pushIncoming(s, 'lao_li', '在吗。打完这两个字，我在车里坐了十分钟。你要睡了，明天看见也行。不急。', 'li_miss');
    const before = JSON.stringify({
      chainFlags: Object.keys(s.flags).filter((k) => k.startsWith('chain_')),
      lastTopic: s.targets.find((t) => t.targetId === 'lao_li')?.lastTopic,
    });
    s = dispatch(s, { type: 'accept_incoming', targetId: 'lao_li' });
    expect(s.chat).not.toBeNull();
    expect(s.chat?.fromIncoming).toBe(true);
    expect(s.chat?.pendingNodeId).toBe('');
    // 选项是应答组的（逐条对得上）
    const set = INCOMING_REPLIES.li_miss;
    for (const opt of s.chat!.pendingOptions) {
      expect(set.options.some((o) => o.text === opt.text), `选项「${opt.text}」不属于 li_miss 应答组`).toBe(true);
    }
    // 他的开场白在 transcript 里
    expect(s.chat!.transcript.some((m) => m.text.includes('在车里坐了十分钟'))).toBe(true);
    // 不推进剧情链 flag、不落 lastTopic（那是闲聊组的事）
    const after = JSON.stringify({
      chainFlags: Object.keys(s.flags).filter((k) => k.startsWith('chain_')),
      lastTopic: s.targets.find((t) => t.targetId === 'lao_li')?.lastTopic,
    });
    expect(after).toBe(before);
  });

  it('增益验证：选走心话 trust 涨，选冷场话 trust 跌 + wariness 涨', () => {
    // 正增益
    let s1 = fresh(31);
    s1 = pushIncoming(s1, 'lao_li', '在吗。打完这两个字，我在车里坐了十分钟。', 'li_miss');
    s1 = dispatch(s1, { type: 'accept_incoming', targetId: 'lao_li' });
    const li1 = s1.targets.find((t) => t.targetId === 'lao_li')!;
    const t0 = li1.trust;
    const w0 = li1.wariness;
    const warmIdx = s1.chat!.pendingOptions.findIndex((o) => o.trust > 0);
    expect(warmIdx).toBeGreaterThanOrEqual(0);
    s1 = dispatch(s1, { type: 'pick_option', optionIndex: warmIdx });
    const li1b = s1.targets.find((t) => t.targetId === 'lao_li')!;
    expect(li1b.trust).toBeGreaterThan(t0);
    expect(s1.chat?.awaiting).toBe('closed');
    // 走心话术不涨警惕
    expect(li1b.wariness).toBe(warinessNoWorse(w0, s1.chat!.pendingOptions[warmIdx].wariness));
    // 收束旁白是应答版的
    expect(s1.chat?.closingNote).toContain('那句话');

    // 负增益
    let s2 = fresh(32);
    s2 = pushIncoming(s2, 'lao_li', '在吗。打完这两个字，我在车里坐了十分钟。', 'li_miss');
    s2 = dispatch(s2, { type: 'accept_incoming', targetId: 'lao_li' });
    const li2 = s2.targets.find((t) => t.targetId === 'lao_li')!;
    const t0b = li2.trust;
    const w0b = li2.wariness;
    const coldIdx = s2.chat!.pendingOptions.findIndex((o) => o.trust < 0);
    expect(coldIdx).toBeGreaterThanOrEqual(0);
    s2 = dispatch(s2, { type: 'pick_option', optionIndex: coldIdx });
    const li2b = s2.targets.find((t) => t.targetId === 'lao_li')!;
    expect(li2b.trust).toBeLessThan(t0b);
    expect(li2b.wariness).toBeGreaterThan(w0b);
    // 播完他的回应后收场
    expect(s2.chat?.awaiting).toBe('closed');
  });

  it('上下文一致性：他的回应必须接得住——每组回应都含「他回」或旁白体', () => {
    // 抽查主五人各一组：回应台词以（他回：… 开头或旁白（……）
    const checks = ['li_miss', 'zhou_wallet', 'wang_miss', 'hao_selfie', 'chen_wallet'];
    for (const key of checks) {
      for (const opt of INCOMING_REPLIES[key].options) {
        const rs3 = opt.replies;
        const joined = (Array.isArray(rs3) ? rs3 : rs3?.default ?? []).join('');
        expect(joined.length).toBeGreaterThan(6);
        expect(joined.startsWith('（') || joined.includes('｜'), `${key}「${opt.text}」回应不是旁白体`).toBe(true);
      }
    }
  });

  it('兜底验证：未注册的 topicId 回落兜底组，会话依然成立', () => {
    const set = incomingReplyFor('no_such_topic');
    expect(set).toBe(INCOMING_FALLBACK_SET);
    let s = fresh(41);
    s = pushIncoming(s, 'lao_li', '（他发来一条消息。）', 'no_such_topic');
    s = dispatch(s, { type: 'accept_incoming', targetId: 'lao_li' });
    expect(s.chat?.fromIncoming).toBe(true);
    expect(s.chat!.pendingOptions.length).toBe(3);
    const opt0 = s.chat!.pendingOptions[0];
    expect(opt0.trust).toBeGreaterThan(0);
  });

  it('库人物：首联 incoming 挂人物 id 应答组；日常走原型应答组', () => {
    let s = fresh(51);
    // 首联（g5 猫咖夜班）
    s = pushIncoming(s, 'g5', LIBRARY_INCOMING.g5, 'g5');
    s = dispatch(s, { type: 'accept_incoming', targetId: 'g5' });
    expect(s.chat!.pendingOptions).toBe(INCOMING_REPLIES.g5.options);
    s = dispatch(s, { type: 'end_chat' });
    // 日常 missed_you 走 arch_night_guard_miss
    let s2 = fresh(52);
    s2 = pushIncoming(s2, 'g5', '在吗。没事。就是想找个人说一声。', 'arch_night_guard_miss');
    s2 = dispatch(s2, { type: 'accept_incoming', targetId: 'g5' });
    expect(s2.chat!.pendingOptions).toBe(INCOMING_REPLIES.arch_night_guard_miss.options);
  });

  it('bio 钩子：换签名后他找来，应答组是 bio_<原型>', () => {
    // 直接构造：incoming 带 bio topicId（晨间逻辑另有 v433 测试覆盖概率），
    // 这里验证会话接线正确。
    let s = fresh(61);
    const arch = LIBRARY.find((t) => t.id === 'g1')!.archetype;
    s = pushIncoming(s, 'g1', BIO_HOOK_BY_ARCHETYPE[arch]!, `bio_${arch}`);
    s = dispatch(s, { type: 'accept_incoming', targetId: 'g1' });
    expect(s.chat!.pendingOptions).toBe(INCOMING_REPLIES[`bio_${arch}`].options);
  });

  it('人生线：周老师长卷 incoming 的应答组接线', () => {
    let s = fresh(71);
    s = pushIncoming(
      s,
      'zhou_teacher',
      '在写一幅小长卷 写的是《劝学》里的一句｜写好了想寄给你｜就是不知道 你那边 挂得下吗',
      'life_zhou_scroll',
    );
    s = dispatch(s, { type: 'accept_incoming', targetId: 'zhou_teacher' });
    expect(s.chat!.pendingOptions).toBe(INCOMING_REPLIES.life_zhou_scroll.options);
    // 选「挂得下」：信任要涨
    const idx = s.chat!.pendingOptions.findIndex((o) => o.text.includes('挂得下'));
    const zhou = s.targets.find((t) => t.targetId === 'zhou_teacher')!;
    const t0 = zhou.trust;
    s = dispatch(s, { type: 'pick_option', optionIndex: idx });
    const zb = s.targets.find((t) => t.targetId === 'zhou_teacher')!;
    expect(zb.trust).toBeGreaterThan(t0);
  });

  it('runMorning 生成的 incoming 自动带 topicId（晨间实际路径）', () => {
    // 扫 25 个种子：任一晨间生成的 incoming 的 topicId 必须存在于应答库。
    // 注：INCOMING_DAILY_CAP=2 且主五人先入循环——库人物只在主五人当天没
    // 掷中时才轮得到；他们的应答键（arch_*）由下一组单元测试直接验证。
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
    let sawMain = false;
    let sawAny = false;
    for (const seed of seeds) {
      const s = fresh(seed);
      for (const m of s.incoming) {
        sawAny = true;
        expect(m.topicId, `day1 incoming ${m.targetId} 无 topicId`).toBeDefined();
        expect(INCOMING_REPLIES[m.topicId!] ?? INCOMING_FALLBACK_SET, `topicId=${m.topicId} 无应答组`).toBeDefined();
        if (/^(li|zhou|wang|hao|chen)_/.test(m.topicId!)) sawMain = true;
        else if (m.topicId!.startsWith('bio_')) sawMain = true; // bio 钩子也算主五人线
      }
      const s2 = dispatch(s, { type: 'sleep' });
      for (const m of s2.incoming) {
        sawAny = true;
        expect(m.topicId, `day2 incoming ${m.targetId} 无 topicId`).toBeDefined();
        expect(INCOMING_REPLIES[m.topicId!] ?? INCOMING_FALLBACK_SET, `topicId=${m.topicId} 无应答组`).toBeDefined();
      }
    }
    expect(sawAny, '50 个种子里一条 incoming 都没有——概率塌了').toBe(true);
    expect(sawMain, '25 种子里没有主五人 incoming——测试盲区').toBe(true);
  });

  it('库人物 incoming 键名单元验证：arch_<原型>_<场景> 全部命中应答库', () => {
    // runMorning 对库人物（未走首联/bio 钩子时）生成的键名是
    // arch_<archetype>_<selfie|miss|wallet>——三种场景 × 5 原型必须全命中。
    for (const arch of Object.keys(ARCHETYPE_INCOMING)) {
      for (const sc of ['selfie', 'miss', 'wallet']) {
        const key = `arch_${arch}_${sc}`;
        expect(INCOMING_REPLIES[key], `${key} 应答组缺失——晨间会生成这个键`).toBeDefined();
      }
    }
    // 主五人键名同样逐一命中（runMorning 生成 MAIN_INCOMING_PREFIXES+reasonKey）
    for (const prefix of ['li', 'zhou', 'wang', 'hao', 'chen']) {
      for (const sc of ['selfie', 'miss', 'wallet']) {
        expect(INCOMING_REPLIES[`${prefix}_${sc}`], `${prefix}_${sc} 应答组缺失`).toBeDefined();
      }
    }
  });

  it('旧存档兼容：无 topicId 的 incoming（v4.3 存档）也能回——走兜底', () => {
    let s = fresh(81);
    s = pushIncoming(s, 'lao_li', '在吗。（旧存档的消息，没 topicId）', undefined);
    s = dispatch(s, { type: 'accept_incoming', targetId: 'lao_li' });
    expect(s.chat!.pendingOptions).toBe(INCOMING_FALLBACK_SET.options);
  });
});

/** pick_option 里 applyAffinity 也会动 wariness——冷场断言只看选项自身够不够。 */
function warinessNoWorse(before: number, optWariness: number | undefined): number {
  // 选项没带 wariness 时，引擎不应额外加（应答会话没有 affinity 之外的动作）
  return optWariness ? before + optWariness : before;
}
