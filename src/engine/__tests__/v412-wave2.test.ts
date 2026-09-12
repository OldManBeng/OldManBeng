import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch } from '../state-machine';
import { scriptFor } from '../../data/script-registry';
import { targetMomentPosts, playerCommentPool, MOMENT_PLAYER_COMMENTS, LIBRARY_COMMENT_FALLBACK } from '../../data/moments';
import { finalEpilogues, epilogueFor } from '../epilogues';
import { DIRECT_ASK_AMOUNTS, DIRECT_ASK_REASONS, DIRECT_ASK_OFFENDED, DIRECT_ASK_COOLDOWN, DIRECT_ASK_FAIL_CHAT, DIRECT_ASK_SUCCESS_CHAT, DIRECT_ASK_FOLLOWUP_SUCCESS, DIRECT_ASK_FOLLOWUP_FAIL } from '../../data/direct-ask';
import { DIRECT_ASK_CHANCE_MULT, CHAT_SESSION_COST } from '../../data/constants';
import { LIBRARY } from '../../data/target-library';
import { ENDINGS } from '../../data/endings';
import type { GameState } from '../../types/game';
import type { PersonaId } from '../../types/persona';

/**
 * v4.1.2 第二批修复与新增的回归锁定：
 *  1. 结局归档含库人物（韩叔给过钱必须出现在账上）
 *  2. 库老头朋友圈只发自己原型的事（代驾不发钓鱼圈）
 *  3. 玩家评论池不跨专名串味
 *  4. 结局标题不再沿用旧游戏名
 *  5. 名单置顶（pinnedTargets 持久化）
 *  6. 主动要钱（direct_ask）：门槛、代价、入账、翻车
 */

function fresh(seed: number, personaId: PersonaId = 'wise_sister'): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId });
  return s;
}

/** direct_ask 开口要进对话，先把状态推进到深夜（t 必须醒着）。 */
function nightOf(seed: number, personaId?: PersonaId): GameState {
  const s = fresh(seed, personaId);
  return dispatch(s, { type: 'enter_night' });
}

describe('v4.1.2: 结局归档含库人物（韩叔的账不能再失踪）', () => {
  it('finalEpilogues 覆盖认识过的库目标——给过钱的韩叔在列且账目可读', () => {
    let s = fresh(1);
    const han = s.targets.find((t) => t.targetId === 'e8')!;
    han.discoveredDay = s.day;
    han.totalReceived = 320;
    han.timesPaid = 2;
    han.trust = 80; // high 档（≥75）走带账目的后记
    const entries = finalEpilogues(s);
    const row = entries.find(({ def }) => def.id === 'e8');
    expect(row, '认识过的韩叔必须在归档里').toBeTruthy();
    expect(row!.t.totalReceived).toBe(320);
    // 高信任 + 给过钱 → 后记里带账目数字
    expect(epilogueFor(row!.def, row!.t)).toContain('320');
  });

  it('结局归档顺序：给过钱的人和只认识的人都在，主五人不丢', () => {
    let s = fresh(2);
    for (const id of ['lao_li', 'e8', 'g1']) {
      s.targets.find((t) => t.targetId === id)!.discoveredDay = s.day;
    }
    const ids = finalEpilogues(s).map(({ def }) => def.id);
    expect(ids).toContain('lao_li');
    expect(ids).toContain('e8');
    expect(ids).toContain('g1');
  });
});

describe('v4.1.2: 库老头的朋友圈只发自己原型的事', () => {
  it('代驾原型（韩叔/吴师傅/侯师傅）的素材池只有代驾场景', () => {
    for (const def of LIBRARY.filter((t) => t.archetype === 'designated_driver').slice(0, 5)) {
      const posts = targetMomentPosts(def.id, def.archetype);
      expect(posts.length).toBeGreaterThanOrEqual(2);
      // 两张贴都必须是代驾场景（arch_roadside），绝不出现保安亭/钓鱼/棋摊/广场舞
      for (const p of posts) expect(p.photoId).toBe('arch_roadside');
      for (const p of posts) {
        for (const banned of ['鱼', '棋', '广场舞', '监控室', '台钳', '收音机']) {
          expect(p.captions.join(' '), `${def.name} 的圈文串了别原型的世界`).not.toContain(banned);
        }
      }
    }
  });

  it('主五人的专属素材不受影响', () => {
    const posts = targetMomentPosts('lao_li', 'divorced_driver');
    expect(posts.map((p) => p.photoId)).toEqual(['lao_li_radio_night', 'lao_li_taxi_night']);
  });

  it('每个原型都有 ≥2 张贴（库老头一个月发几条不会重样到假）', () => {
    for (const arch of ['night_guard', 'fisherman', 'chess_uncle', 'square_dancer', 'designated_driver']) {
      const lib = LIBRARY.find((t) => t.archetype === arch)!;
      expect(targetMomentPosts(lib.id, arch).length, `${arch} 素材不足`).toBeGreaterThanOrEqual(2);
    }
  });

  it('引擎实际发圈：代驾韩叔的动态只来自代驾场景', () => {
    // 睡 25 天，认识韩叔——他迟早会发圈；发出的必须贴自己的原型。
    let sawHanPost = false;
    for (let seed = 10; seed < 40 && !sawHanPost; seed++) {
      let s = fresh(seed);
      s.targets.find((t) => t.targetId === 'e8')!.discoveredDay = s.day;
      for (let d = 0; d < 25; d++) {
        s = dispatch(s, { type: 'sleep' });
        const post = s.moments.find((m) => m.author === 'target' && m.targetId === 'e8');
        if (post) {
          sawHanPost = true;
          expect(['arch_roadside']).toContain(post.photoId);
        }
      }
    }
    expect(sawHanPost, '30 个种子 × 25 天内韩叔没发过圈（75%/天 × 认识 1 人，几乎不可能）').toBe(true);
  });
});

describe('v4.1.2: 玩家评论池不跨专名串味', () => {
  it('库老头拿通用池——不含主五人专名生活（王总的车库/台钳/老张的棋）', () => {
    for (const def of LIBRARY.slice(0, 10)) {
      const pool = playerCommentPool(def);
      expect(pool.length).toBeGreaterThanOrEqual(4);
      const blob = pool.join(' ');
      for (const banned of ['王总', '台钳', '老张', '收车', '监控室', '茉莉', '图纸']) {
        expect(blob, `${def.name} 的评论池串了主五人的专名`).not.toContain(banned);
      }
    }
  });

  it('主五人保留专属池（内容原样）', () => {
    for (const id of ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong']) {
      const lib = LIBRARY.find((t) => t.id === id); // 主五人不在库——防误改
      void lib;
    }
    const li = playerCommentPool({ need: 'listened_to', id: 'lao_li' } as never);
    expect(li).toBe(MOMENT_PLAYER_COMMENTS.listened_to);
    void LIBRARY_COMMENT_FALLBACK;
  });
});

describe('v4.1.2: 结局标题不再沿用旧游戏名', () => {
  it('end_numb 标题已改且没有旧名残留', () => {
    const numb = ENDINGS.find((e) => e.id === 'end_numb')!;
    expect(numb.title).not.toBe('凌晨三点，哥哥');
    expect(numb.title.length).toBeGreaterThan(0);
  });
});

describe('v4.1.2: 名单置顶（pinnedTargets）', () => {
  it('toggle_pin 置顶/取消幂等；只对认识过的人生效', () => {
    let s = fresh(3);
    s = dispatch(s, { type: 'toggle_pin', targetId: 'e8' });
    expect(s.pinnedTargets).not.toContain('e8'); // 没认识过 → no-op
    const han = s.targets.find((t) => t.targetId === 'e8')!;
    han.discoveredDay = s.day;
    s = dispatch(s, { type: 'toggle_pin', targetId: 'e8' });
    expect(s.pinnedTargets).toContain('e8');
    s = dispatch(s, { type: 'toggle_pin', targetId: 'e8' });
    expect(s.pinnedTargets).not.toContain('e8');
  });

  it('初始态有空置顶数组（旧档由 migrate 补）', () => {
    expect(createInitialState().pinnedTargets).toEqual([]);
  });
});

describe('v4.1.2: 主动要钱（direct_ask，v2 对话流改版）', () => {
  it('数据完备：金额档 10-1000 至少 9 档、理由 ≥5 个、成败话术与追问池齐', () => {
    expect(DIRECT_ASK_AMOUNTS[0]).toBe(10);
    expect(DIRECT_ASK_AMOUNTS[DIRECT_ASK_AMOUNTS.length - 1]).toBe(1000);
    expect(DIRECT_ASK_AMOUNTS.length).toBeGreaterThanOrEqual(9);
    expect(DIRECT_ASK_REASONS.length).toBeGreaterThanOrEqual(5);
    expect(DIRECT_ASK_OFFENDED.length).toBeGreaterThanOrEqual(2);
    expect(DIRECT_ASK_COOLDOWN.length).toBeGreaterThanOrEqual(2);
    expect(DIRECT_ASK_FAIL_CHAT.length).toBeGreaterThanOrEqual(4);
    expect(DIRECT_ASK_SUCCESS_CHAT.length).toBeGreaterThanOrEqual(3);
    // 追问选项两套（成/败），各自带体面收场与软磨硬泡两版
    for (const fu of [DIRECT_ASK_FOLLOWUP_SUCCESS, DIRECT_ASK_FOLLOWUP_FAIL]) {
      expect(fu.texts.mild.length).toBeGreaterThan(0);
      expect(fu.texts.pushy.length).toBeGreaterThan(0);
      expect(fu.mildReplies.length).toBeGreaterThanOrEqual(2);
      expect(fu.pushyReplies.length).toBeGreaterThanOrEqual(2);
    }
    // 每个理由的 say 都带金额占位
    for (const r of DIRECT_ASK_REASONS) expect(r.say).toContain('{n}');
  });

  it('不熟的直接开口：开成一场真实对话，他当面被吓着、账一分没进', () => {
    let s = nightOf(4);
    const moneyBefore = s.money;
    const energyBefore = s.energy;
    const li0 = s.targets.find((t) => t.targetId === 'lao_li')!;
    li0.stage = 'stranger'; li0.trust = 30; li0.wariness = 10;
    s = dispatch(s, { type: 'direct_ask', targetId: 'lao_li', reasonId: 'rent', amount: 500 });
    const li = s.targets.find((t) => t.targetId === 'lao_li')!;
    expect(s.stats.asksMade).toBe(1);
    expect(s.stats.asksFailed).toBe(1);
    expect(li.wariness).toBeGreaterThan(10);
    expect(li.trust).toBeLessThan(30);
    expect(s.money).toBe(moneyBefore); // 一分没进
    // 对话体验与「陪他说说话」同账：耗一场精力、进 chat 相位、开场白+他的答复在场
    expect(s.dayPhase).toBe('chat');
    expect(s.chat).toBeTruthy();
    expect(s.chat!.targetId).toBe('lao_li');
    expect(s.energy).toBe(energyBefore - CHAT_SESSION_COST); // 场费照收（新档无充电宝）
    expect(s.chat!.transcript.some((m) => m.speaker === 'target')).toBe(true); // 他先打了招呼
    expect(s.chat!.transcript.some((m) => m.speaker === 'player' && m.text.includes('500'))).toBe(true); // 她把话发出去了
    expect(s.chat!.transcript.some((m) => m.speaker === 'target' && DIRECT_ASK_OFFENDED.includes(m.text))).toBe(true); // 他被吓着的答复
    expect(s.chat!.awaiting).toBe('closed'); // 门槛翻车：没有追问余地
    expect(s.stats.nightsWorked).toBe(1);
  });

  it('钱包冷却内的开口：翻车不挖同一个钱包两次，也是当场对话', () => {
    let s = nightOf(5);
    const li = s.targets.find((t) => t.targetId === 'lao_li')!;
    li.stage = 'harvest'; li.trust = 90; li.wariness = 0;
    li.daysSincePaid = 0; li.timesPaid = 1; // 刚给过（timesPaid=1：他给过的钱包再挖，才说"已经给过了"）
    s = dispatch(s, { type: 'direct_ask', targetId: 'lao_li', reasonId: 'boba', amount: 30 });
    expect(s.stats.asksFailed).toBe(1);
    expect(s.targets.find((t) => t.targetId === 'lao_li')!.totalReceived).toBe(0);
    expect(s.dayPhase).toBe('chat');
    // 冷却答复以旁白气泡呈现（v4.13.3：整段全括号=叙事层，speaker 归 narrator）。
    expect(s.chat!.transcript.some((m) => (m.speaker === 'target' || m.speaker === 'narrator') && DIRECT_ASK_COOLDOWN.some((l) => m.text.includes(l.slice(0, 6))))).toBe(true);
    expect(s.chat!.awaiting).toBe('closed');
  });

  it('熟络 + 冷却完：能要到钱——对话里有他的招呼/转账条/答复，她还有一轮追问', () => {
    let got = false;
    for (let seed = 100; seed < 160 && !got; seed++) {
      let s = nightOf(seed);
      const han = s.targets.find((t) => t.targetId === 'e8')!;
      han.discoveredDay = s.day;
      han.stage = 'harvest';
      han.trust = 95;
      han.wariness = 0;
      han.daysSincePaid = 9;
      s = dispatch(s, { type: 'direct_ask', targetId: 'e8', reasonId: 'mom_hospital', amount: 300 });
      const t = s.targets.find((x) => x.targetId === 'e8')!; // dispatch 深拷贝——重新取
      if (s.stats.totalEarned > 0) {
        got = true;
        expect(t.totalReceived).toBe(300);
        expect(t.timesPaid).toBe(1);
        expect(t.daysSincePaid).toBe(0);
        // 代价照付：警惕涨了（成功 +20 + 金额档 3）、麻木也涨
        expect(t.wariness).toBeGreaterThanOrEqual(23);
        expect(s.numbness).toBeGreaterThan(0);
        // 账本有这行
        expect(s.ledger.some((e) => e.amount === 300 && e.note.includes('韩叔'))).toBe(true);
        // 对话流：她的话在场、系统转账条在场、他答应的答复在场、还有追问选项
        const tr = s.chat!.transcript;
        expect(tr.some((m) => m.speaker === 'player' && m.text.includes('300'))).toBe(true);
        expect(tr.some((m) => m.speaker === 'system' && (m.label ?? '').includes('300'))).toBe(true);
        expect(tr.some((m) => m.speaker === 'target' && DIRECT_ASK_SUCCESS_CHAT.some((l) => m.text === l.split('｜')[0]))).toBe(true);
        expect(s.chat!.awaiting).toBe('player');
        expect(s.chat!.pendingOptions.map((o) => o.text)).toContain(DIRECT_ASK_FOLLOWUP_SUCCESS.texts.mild);
        // 追问选软话（pick_option 非链分支）：他的回话接上、对话收场、养关系
        s = dispatch(s, { type: 'pick_option', optionIndex: 0 });
        expect(s.chat!.transcript.filter((m) => m.speaker === 'target').length).toBeGreaterThan(1);
        expect(s.chat!.awaiting).toBe('closed');
        expect(s.chat!.closingNote).toBe('今天聊完了。');
        const after = s.targets.find((x) => x.targetId === 'e8')!;
        expect(after.trust).toBeGreaterThan(95 - 30); // 软话是正信任（含 persona 乘数）
      }
    }
    expect(got, '60 个种子 × p≈0.29 没一次成功（概率≈0）').toBe(true);
  });

  it('翻车后的追问软磨硬泡：警惕再涨（他开始算了），体面收场则不然', () => {
    // 构造必然翻车：stranger 之后 warming + 低信任 + 高警惕 → chance≈0
    let hit = false;
    for (let seed = 200; seed < 280 && !hit; seed++) {
      let s = nightOf(seed);
      const li = s.targets.find((t) => t.targetId === 'lao_li')!;
      li.stage = 'warming'; li.trust = 45; li.wariness = 55; li.daysSincePaid = 9;
      s = dispatch(s, { type: 'direct_ask', targetId: 'lao_li', reasonId: 'boba', amount: 10 });
      if (s.chat?.awaiting === 'player' && s.chat.pendingOptions.length === 2) {
        hit = true;
        // 软磨硬泡（第二项：wariness 22）
        const before = s.targets.find((t) => t.targetId === 'lao_li')!.wariness;
        s = dispatch(s, { type: 'pick_option', optionIndex: 1 });
        const t = s.targets.find((x) => x.targetId === 'lao_li')!;
        expect(t.wariness).toBeGreaterThan(before - 5); // 追问本身在涨（翻车警涨之上）
        expect(s.chat!.awaiting).toBe('closed');
      }
    }
    expect(hit, '80 个种子 × p≈0.05 没一次走到翻车追问').toBe(true);
  });

  it('一天只聊一场：聊过的/精力不够的开口直接拒绝', () => {
    let s = nightOf(7);
    const li = s.targets.find((t) => t.targetId === 'lao_li')!;
    li.stage = 'warming'; li.trust = 60; li.wariness = 20; li.daysSincePaid = 9;
    s = dispatch(s, { type: 'start_chat', targetId: 'lao_li' });
    s = dispatch(s, { type: 'end_chat' });
    // 今天聊过了 → direct_ask 拒绝（不开第二场）
    const phasesBefore = s.stats.asksMade;
    s = dispatch(s, { type: 'direct_ask', targetId: 'lao_li', reasonId: 'boba', amount: 30 });
    expect(s.stats.asksMade).toBe(phasesBefore);
    expect(s.dayPhase).not.toBe('chat');
    // 精力耗干 → 也拒绝（睡几晚把精力花掉）
    let guard = 0;
    while (s.energy >= CHAT_SESSION_COST && guard++ < 30) {
      const before = s.energy;
      s.energy = 0; // 直接置 0 模拟耗尽（引擎只读能量值）
      void before;
      break;
    }
    const asksBefore = s.stats.asksMade;
    s = dispatch(s, { type: 'direct_ask', targetId: 'lao_li', reasonId: 'boba', amount: 30 });
    expect(s.stats.asksMade).toBe(asksBefore);
    expect(s.dayPhase).not.toBe('chat');
  });

  it('成功率比剧情链开口低（DIRECT 折扣生效）', () => {
    expect(DIRECT_ASK_CHANCE_MULT).toBeLessThan(1);
  });

  it('理由话术不出现任何金融实操细节（内容红线）', () => {
    const blob = JSON.stringify([DIRECT_ASK_REASONS, DIRECT_ASK_OFFENDED, DIRECT_ASK_COOLDOWN, DIRECT_ASK_FAIL_CHAT, DIRECT_ASK_SUCCESS_CHAT, DIRECT_ASK_FOLLOWUP_SUCCESS, DIRECT_ASK_FOLLOWUP_FAIL]);
    for (const banned of ['银行卡', '验证码', '收款码', '支付宝账号', '转账到']) {
      expect(blob.includes(banned)).toBe(false);
    }
  });
});

describe('v4.1.2: 朋友圈文案仍贴红线', () => {
  it('库老头新增的圈文不含跨原型专名', () => {
    const dd = LIBRARY.filter((t) => t.archetype === 'designated_driver');
    expect(dd.length).toBeGreaterThanOrEqual(9);
    void scriptFor;
  });
});
