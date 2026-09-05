import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch, ALL_TARGET_MAP } from '../../engine/state-machine';
import { LAO_LI_LINES } from '../../data/dialogue';
import { ZHOU_LINES } from '../../data/zhou-script';
import { PERSONA_EPILOGUE } from '../../data/personas';
import type { PersonaId } from '../../types/persona';
import type { GameState } from '../../types/game';

/** 新开一局（可指定人设）。 */
function fresh(seed: number, personaId: PersonaId): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId });
  return s;
}

/** 准备一个"主线吃完了"的老李：全部剧情节点已消费，剩人设专属节点。 */
function chainDone(s: GameState, upto = 11): GameState {
  const t = s.targets.find((x) => x.targetId === 'lao_li')!;
  for (let i = 1; i <= upto; i++) s.flags[`chain_c_li_${i}`] = true;
  return s;
}

function nightChat(s: GameState, targetId: string): GameState {
  let cur = s;
  if (cur.dayPhase === 'morning') cur = dispatch(cur, { type: 'enter_night' });
  return dispatch(cur, { type: 'start_chat', targetId });
}

describe('v3.0: 人设专属剧情节点（onlyPersona 门控）', () => {
  it('知心姐姐走到老李的人设专属节点；御姐走不到（落回闲聊组）', () => {
    // 知心姐姐：主线吃完后触发 c_li_wise
    let s = chainDone(fresh(21, 'wise_sister'));
    const tl = s.targets.find((x) => x.targetId === 'lao_li')!;
    tl.trust = 60;
    tl.wariness = 10;
    s = nightChat(s, 'lao_li');
    const wiseTexts = s.chat!.transcript.map((m) => m.text).join('|');
    expect(wiseTexts).toContain('收音机都没说过');

    // 御姐：同状态下，专属节点被跳过——不会出现知心线内容
    let s2 = chainDone(fresh(21, 'femme_fatale'));
    const tl2 = s2.targets.find((x) => x.targetId === 'lao_li')!;
    tl2.trust = 60;
    tl2.wariness = 10;
    s2 = nightChat(s2, 'lao_li');
    const ffTexts = s2.chat!.transcript.map((m) => m.text).join('|');
    expect(ffTexts).not.toContain('收音机都没说过');
  });

  it('文青专属：周老师的对诗线只对文青开放', () => {
    let s = fresh(33, 'artistic_soul');
    const tz = s.targets.find((x) => x.targetId === 'zhou_teacher')!;
    for (let i = 1; i <= 8; i++) s.flags[`chain_c_zhou_${i}`] = true;
    tz.trust = 60;
    tz.wariness = 10;
    s = dispatch(s, { type: 'enter_night' });
    // 周老师上午在线——深夜开不了。回早上再开聊。
    s = dispatch(s, { type: 'sleep' });
    s = dispatch(s, { type: 'start_chat', targetId: 'zhou_teacher' });
    expect(s.chat).not.toBeNull();
    const texts = s.chat!.transcript.map((m) => m.text).join('|');
    expect(texts).toContain('此水几时休');
  });
});

describe('v3.0: personaText——同一句话，人设嘴里不同说法', () => {
  it('老李的关键开口：知心姐姐版/学妹版/默认版各不相同', () => {
    const runPick = (personaId: PersonaId, seed: number) => {
      let s = fresh(seed, personaId);
      s = chainDone(s, 7); // 只吃掉 1-7，让 c_li_8 可触发
      const tl = s.targets.find((x) => x.targetId === 'lao_li')!;
      tl.trust = 80;
      tl.stage = 'harvest'; // minStage 门控：harvest 节点要求阶段到位
      tl.wariness = 10;
      tl.daysSincePaid = 9;
      s = nightChat(s, 'lao_li');
      expect(s.chat).not.toBeNull();
      s = dispatch(s, { type: 'pick_option', optionIndex: 0 }); // c_li_8 的开口选项
      const mine = s.chat!.transcript.find((m) => m.speaker === 'player')!;
      return mine.text;
    };
    const wise = runPick('wise_sister', 41);
    const sweet = runPick('sweet_daughter', 41);
    const arts = runPick('artistic_soul', 41);
    expect(wise).toContain('姐跟你直说');
    expect(sweet).toContain('一点点嘛');
    expect(arts).toBe('（要红包——「叔叔，我这个月房租差一点……」）'); // 未命中人设回落原文
    expect(wise).not.toBe(sweet);
  });
});

describe('v3.0: 语境连续性（recall）', () => {
  it('昨晚聊过带话题的闲聊，今晚他会"接昨天的话"（{topic} 被真实话题替换）', () => {
    const expected = (LAO_LI_LINES.recall ?? []).map((s) => s.replace(/\{topic\}/g, '加油站的猫'));
    let fired = false;
    for (let seed = 1; seed <= 40 && !fired; seed++) {
      let s = chainDone(fresh(seed, 'wise_sister'));
      const tl = s.targets.find((x) => x.targetId === 'lao_li')!;
      tl.trust = 30;
      tl.wariness = 10;
      tl.lastTopic = '加油站的猫';
      s = nightChat(s, 'lao_li');
      if (!s.chat) continue;
      fired = s.chat.transcript.some((m) => expected.includes(m.text));
    }
    expect(fired).toBe(true); // 40% 概率/晚 × 40 个种子，不出现概率 ≈ 0
  });
});

describe('v3.0: greeting_close——信任深了，开场白换池', () => {
  it('周老师信任 ≥50 后，开场白来自 greeting_close 池', () => {
    let s = fresh(51, 'sweet_daughter');
    const tz = s.targets.find((x) => x.targetId === 'zhou_teacher')!;
    tz.trust = 60;
    tz.wariness = 10;
    s = dispatch(s, { type: 'start_chat', targetId: 'zhou_teacher' });
    const greeting = s.chat!.transcript[1].text;
    expect(ZHOU_LINES.greeting_close).toContain(greeting);
  });
});

describe('v3.0: 人设场次被动', () => {
  it('学妹对"想当爹"的周老师每场 +1 信任；御姐每场 +1 警惕', () => {
    const run = (personaId: PersonaId, seed: number) => {
      let s = fresh(seed, personaId);
      const tz = s.targets.find((x) => x.targetId === 'zhou_teacher')!;
      const before = { trust: tz.trust, wariness: tz.wariness };
      s = dispatch(s, { type: 'start_chat', targetId: 'zhou_teacher' });
      const after = s.targets.find((x) => x.targetId === 'zhou_teacher')!;
      return { dTrust: after.trust - before.trust, dWar: after.wariness - before.wariness };
    };
    const sweet = run('sweet_daughter', 61);
    const ff = run('femme_fatale', 61);
    // 基础亲和：嘴甜×教师 +2 信任；24 岁×想当爹 +1 信任；人设被动 ±1
    expect(sweet.dTrust).toBe(4);   // 2 + 1 + 1(人设被动)
    expect(ff.dTrust).toBe(3);      // 2 + 1 + 0
    expect(ff.dWar).toBe(1);        // 人设冲突被动
    expect(sweet.dWar).toBe(0);
  });
});

describe('v3.0: 开场白跨场去重', () => {
  it('连聊多晚，老李的开场白不连着重样', () => {
    let s = fresh(71, 'wise_sister');
    s = chainDone(s);
    const tl = s.targets.find((x) => x.targetId === 'lao_li')!;
    tl.trust = 30;
    tl.wariness = 10;
    const greetings: string[] = [];
    for (let d = 0; d < 5; d++) {
      s = nightChat(s, 'lao_li');
      if (!s.chat) break;
      greetings.push(s.chat.transcript[1].text);
      s = dispatch(s, { type: 'end_chat' });
      s = dispatch(s, { type: 'sleep' });
    }
    expect(greetings.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < greetings.length; i++) {
      expect(greetings[i]).not.toBe(greetings[i - 1]);
    }
  });
});

describe('v3.0: 人设尾声（结局屏内容）', () => {
  it('四种人设各有一段尾声，互不相同', () => {
    const ids: PersonaId[] = ['femme_fatale', 'sweet_daughter', 'wise_sister', 'artistic_soul'];
    const all = ids.map((id) => PERSONA_EPILOGUE[id].join('|'));
    expect(all.every((t) => t.length > 20)).toBe(true);
    expect(new Set(all).size).toBe(4);
    void ALL_TARGET_MAP;
  });
});

describe('v3.1: 「新的一天」简报生命周期', () => {
  it('开局弹出第 1 天简报，确认后清零', () => {
    let s = fresh(81, 'wise_sister');
    expect(s.briefingDay).toBe(1);
    s = dispatch(s, { type: 'dismiss_briefing' });
    expect(s.briefingDay).toBe(0);
  });

  it('睡觉跨天后重新弹出，当天 log 里有账单/偈语条目可组装', () => {
    let s = fresh(82, 'wise_sister');
    s = dispatch(s, { type: 'dismiss_briefing' });
    s = dispatch(s, { type: 'sleep' });
    expect(s.briefingDay).toBe(2);
    const entries = s.log.filter((l) => l.day === 2);
    expect(entries.some((l) => l.kind === 'bill')).toBe(true);
    expect(entries.some((l) => l.kind === 'gatha')).toBe(true);
  });

  it('最后一天睡下直接进结局，不再弹简报', () => {
    let s = fresh(83, 'wise_sister');
    s = dispatch(s, { type: 'dismiss_briefing' });
    s.day = s.daysLimit;
    s = dispatch(s, { type: 'sleep' });
    expect(s.phase).toBe('ended');
    expect(s.briefingDay).toBe(0);
  });
});

describe('v3.1: 朋友圈互动——他给你点赞/评论', () => {
  const postAt = (s: GameState) => [...s.moments].reverse().find((m) => m.author === 'player')!;
  const interactors = (p: ReturnType<typeof postAt>) => [
    ...p.likes,
    ...p.comments.filter((c) => c.by === 'target').map((c) => c.targetId ?? ''),
  ];

  it('刚发的圈当场就可能收到点赞或评论（即时反应）', () => {
    let sawReaction = false;
    for (let seed = 400; seed < 440 && !sawReaction; seed++) {
      let s = fresh(seed, 'wise_sister');
      s = dispatch(s, { type: 'dismiss_briefing' });
      s = dispatch(s, { type: 'post_moment', selfieId: 'cat' });
      const post = postAt(s);
      if (interactors(post).length > 0) {
        sawReaction = true;
        const ids = interactors(post);
        expect(new Set(ids).size).toBe(ids.length); // 每人每条圈只互动一次
      }
    }
    expect(sawReaction).toBe(true); // 5 个已认识对象 × 0.3，40 个种子必中
  });

  it('没聊过天的人也会来互动（加了微信就看得见你的圈）', () => {
    let sawReaction = false;
    for (let seed = 500; seed < 560 && !sawReaction; seed++) {
      let s = fresh(seed, 'wise_sister');
      s = dispatch(s, { type: 'dismiss_briefing' });
      // 只发圈，不开任何一场聊天——早晨浪潮仍应有人来
      s = dispatch(s, { type: 'post_moment', selfieId: 'gym' });
      s = dispatch(s, { type: 'sleep' });
      if (interactors(postAt(s)).length > 0) sawReaction = true;
    }
    expect(sawReaction).toBe(true);
  });

  it('同一条圈发酵三天：不同的人陆续来互动', () => {
    let sawGrowth = false;
    for (let seed = 600; seed < 640 && !sawGrowth; seed++) {
      let s = fresh(seed, 'wise_sister');
      s = dispatch(s, { type: 'dismiss_briefing' });
      s = dispatch(s, { type: 'post_moment', selfieId: 'boba' });
      const count = (x: GameState) => {
        const p = postAt(x);
        return p.likes.length + p.comments.filter((c) => c.by === 'target').length;
      };
      const c0 = count(s);
      s = dispatch(s, { type: 'sleep' });
      const c1 = count(s);
      s = dispatch(s, { type: 'sleep' });
      const c2 = count(s);
      if (c2 > c0 && c2 > c1) sawGrowth = true; // 第三天还有人陆续来
    }
    expect(sawGrowth).toBe(true);
  });
});
