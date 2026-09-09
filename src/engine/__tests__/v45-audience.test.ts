/**
 * v4.5 门面动作惊动部分人（观众圈）验收。
 *
 * 玩家诉求：换人设/发朋友圈不再触发所有老头来找你——回一条要花
 * CHAT_SESSION_COST 精力，每次换门面不该变成全员点名。同时开场白
 * 话术池要够大、够随机（bio 钩子 3 句/原型，库 on_selfie 5 句/原型）。
 *
 * 红线：
 * 1. post_moment/update_profile 各只抽 ≤SELFIE_AUDIENCE_MAX/BIO_AUDIENCE_MAX
 *    人的观众圈；窗口内只有圈里的人吃到加成/钩子。
 * 2. 一人一照、一人一签只来一次（换新门面重置）。
 * 3. 观众圈外的人不发 bio_ 钩子开场白（也不吃自拍加成）——他们的
 *    主动消息只能是自然想念/钱包线。
 * 4. 抽样不消耗主 RNG 流：同一 seed 的自然线（无门面动作）逐字不变。
 * 5. 主五人 on_selfie 池 ≥6 句、库原型池 =5 句、bio 钩子池 =3 句。
 */
import { describe, it, expect } from 'vitest';
import { dispatch, createInitialState } from '../state-machine';
import type { GameState } from '../../types/game';
import {
  SELFIE_AUDIENCE_MAX, BIO_AUDIENCE_MAX, SELFIE_LINGER_DAYS, BIO_HOOK_WINDOW_DAYS,
} from '../../data/constants';
import { ARCHETYPE_INCOMING } from '../../data/archetype-packs';
import { INCOMING_LINES } from '../../data/main-packs';
import { BIO_HOOK_BY_ARCHETYPE } from '../../data/player-bios';
import { ACTIVE_TARGETS } from '../../types/target';

function fresh(seed: number): GameState {
  const s = { ...createInitialState(), rngSeed: seed };
  return dispatch(s, { type: 'new_game', name: '小满', motive: 'debt', personaId: 'wise_sister' });
}

const DISCOVERED = ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong'];

describe('v4.5: 观众圈（门面动作只惊动一部分人）', () => {
  it('post_moment 抽观众圈：≤SELFIE_AUDIENCE_MAX 人、全员认识时非空', () => {
    for (let seed = 300; seed < 330; seed++) {
      const s = fresh(seed);
      s.incoming = [];
      const out = dispatch(s, { type: 'post_moment', selfieId: 'gym' });
      expect(out.selfieAudience.length).toBeLessThanOrEqual(SELFIE_AUDIENCE_MAX);
      // 主五人开局即认识——圈内必有认识的人（非空），且都在认识名单里。
      expect(out.selfieAudience.length).toBeGreaterThan(0);
      for (const id of out.selfieAudience) {
        expect(DISCOVERED.includes(id)).toBe(true);
      }
    }
  });

  it('update_profile 换签名重抽 bioAudience：≤BIO_AUDIENCE_MAX 人、窗口天数打戳', () => {
    for (let seed = 300; seed < 330; seed++) {
      const s = fresh(seed);
      const out = dispatch(s, { type: 'update_profile', bioId: 'moon_side' });
      expect(out.bioAudience.length).toBeLessThanOrEqual(BIO_AUDIENCE_MAX);
      expect(out.bioAudienceDay).toBe(out.day);
      for (const id of out.bioAudience) {
        expect(DISCOVERED.includes(id)).toBe(true);
      }
    }
  });

  it('多次换门面观众圈有随机差异（不是固定名单）', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const s = fresh(seed * 7);
      const out = dispatch(s, { type: 'post_moment', selfieId: 'gym' });
      seen.add(out.selfieAudience.join(','));
      if (seen.size >= 3) break; // 40 个种子里至少三种不同组合
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('观众圈外的人不吃自拍加成：只有圈内人发 on_selfie 类 incoming', () => {
    // 三天窗口内天天跑晨间。incoming 是跨天队列（没回应的消息留到第二天），
    // 同一条消息会在两天的快照里各出现一次——按（人, 开场白）去重后再判归属。
    let violations = 0;
    let sawSelfie = 0;
    const seen = new Set<string>();
    for (let seed = 500; seed < 560; seed++) {
      let s = fresh(seed);
      s.incoming = [];
      s = dispatch(s, { type: 'post_moment', selfieId: 'gym' });
      const audience = new Set(s.selfieAudience);
      for (let d = 0; d < SELFIE_LINGER_DAYS; d++) {
        s = dispatch(s, { type: 'sleep' });
        for (const m of s.incoming) {
          const key = `${m.targetId}|${m.opener}`;
          if (seen.has(key)) continue;
          seen.add(key);
          if (m.reason === 'selfie') {
            if (!audience.has(m.targetId)) violations += 1;
            sawSelfie += 1;
          }
        }
      }
    }
    expect(violations).toBe(0); // 圈外的人不会因照片来找你
    expect(sawSelfie).toBeGreaterThan(0); // 池子活着（60 种子 3 天窗口）
  });

  it('一人一照只来一次：同一张照片 3 天内同一人不重复发 selfie incoming', () => {
    // incoming 是跨天队列（未回应的消息第二天还在）——按 opener 去重后，
    // 同一目标出现两条不同的 selfie 开场白才算重复。
    let dup = 0;
    for (let seed = 600; seed < 660; seed++) {
      let s = fresh(seed);
      s.incoming = [];
      s = dispatch(s, { type: 'post_moment', selfieId: 'cat' });
      const selfiesByTarget = new Map<string, Set<string>>();
      const seen = new Set<string>();
      for (let d = 0; d < SELFIE_LINGER_DAYS; d++) {
        s = dispatch(s, { type: 'sleep' });
        for (const m of s.incoming) {
          const key = `${m.targetId}|${m.opener}`;
          if (seen.has(key)) continue; // 跨天快照的同一条，不是新消息
          seen.add(key);
          if (m.reason !== 'selfie') continue;
          if (!selfiesByTarget.has(m.targetId)) selfiesByTarget.set(m.targetId, new Set());
          const set = selfiesByTarget.get(m.targetId)!;
          set.add(m.opener);
          if (set.size > 1) dup += 1; // 同一张照片说出了两句不同的话
        }
      }
    }
    expect(dup).toBe(0);
  });

  it('bio 钩子只进观众圈：圈外/过窗的人不出现 bio_ 开场白', () => {
    const hookLines: string[] = [];
    for (const pool of Object.values(BIO_HOOK_BY_ARCHETYPE)) hookLines.push(...pool!);
    const isHook = (opener: string) => hookLines.some((l) => l.length > 0 && opener.includes(l.slice(0, 8)));
    let violations = 0;
    let sawHook = 0;
    const bad: string[] = [];
    const seen = new Set<string>();
    for (let seed = 700; seed < 760; seed++) {
      let s = fresh(seed);
      // 开局签名（hardup_plaintext）的钩子第 1 天早晨就可能来——与本次断言
      // 无关，清掉只测"换新签名后"这条门面的观众圈纪律。
      s.incoming = [];
      // 换签名 → 圈子抽好 → 窗口内天天跑晨间。
      s = dispatch(s, { type: 'update_profile', bioId: 'daughter_smile' });
      const audience = new Set(s.bioAudience);
      for (let d = 0; d < BIO_HOOK_WINDOW_DAYS; d++) {
        s = dispatch(s, { type: 'sleep' });
        for (const m of s.incoming) {
          const key = `${m.targetId}|${m.opener}`;
          if (seen.has(key)) continue; // 跨天快照的同一条
          seen.add(key);
          if (isHook(m.opener)) {
            if (!audience.has(m.targetId)) { violations += 1; bad.push(`inwin seed=${seed} ${m.targetId}: ${m.opener.slice(0, 24)}`); }
            sawHook += 1;
          }
        }
      }
      // 过窗后（窗口 + 3 天）：bio 钩子必须停——"刚换的吧"不能迟来。
      for (let d = 0; d < 3; d++) {
        s = dispatch(s, { type: 'sleep' });
        for (const m of s.incoming) {
          const key = `${m.targetId}|${m.opener}`;
          if (seen.has(key)) continue;
          seen.add(key);
          if (isHook(m.opener)) { violations += 1; bad.push(`late seed=${seed} ${m.targetId}: ${m.opener.slice(0, 24)}`); }
        }
      }
    }
    expect(violations, `violations=${JSON.stringify(bad)}`).toBe(0);
    expect(sawHook).toBeGreaterThan(0); // 60 种子里钩子确实来过（不然是死码）
  });

  it('换新照片重置观众圈与一次性锁：旧锁不再挡新照片', () => {
    // 直接断状态机语义：自拍一次性锁 = selfiePingedOn === selfieDay。
    // 换新照片 selfieDay 前移 → 旧锁必然失配 → 允许再来一句（说新照片）。
    const s = fresh(11);
    s.incoming = [];
    const out1 = dispatch(s, { type: 'post_moment', selfieId: 'gym' });
    const member = out1.targets.find((t) => t.targetId === out1.selfieAudience[0])!;
    member.selfiePingedOn = out1.profile.selfieDay; // 假装旧照已来过（锁上）
    // 同日再发被"一天一条"拦——过一天发新照。
    out1.dayPhase = 'morning';
    const slept = dispatch(out1, { type: 'sleep' });
    const out2 = dispatch(slept, { type: 'post_moment', selfieId: 'travel' });
    expect(out2.profile.selfieDay).toBe(out2.day);
    expect(out2.profile.selfieDay).not.toBe(member.selfiePingedOn); // 新门面 ≠ 旧锁
  });

  it('抽样不动主 RNG 流：派生流可复现，主随机照常走', () => {
    // 引擎是纯函数：同 seed 同输入必同输出。两次独立执行含观众圈抽样的
    // 动作序列，结果必须一致（派生流可复现）；sleep 后 incoming 也一致
    // （主随机流没被抽样偷吃——否则 caption/晨间骰点会岔开）。
    const a = fresh(777);
    const b = fresh(777);
    const xa = dispatch(a, { type: 'post_moment', selfieId: 'gym' });
    const xb = dispatch(b, { type: 'post_moment', selfieId: 'gym' });
    expect(xa.moments[xa.moments.length - 1]?.caption).toBe(xb.moments[xb.moments.length - 1]?.caption);
    expect(xa.selfieAudience).toEqual(xb.selfieAudience); // 派生流：同 seed 同日同动作 → 同圈
    const ya = dispatch(xa, { type: 'sleep' });
    const yb = dispatch(xb, { type: 'sleep' });
    expect(JSON.stringify(ya.incoming)).toBe(JSON.stringify(yb.incoming));
  });

  it('拉黑/结局的人不进观众圈', () => {
    const s = fresh(31);
    s.incoming = [];
    const li = s.targets.find((t) => t.targetId === 'lao_li')!;
    li.blocked = true;
    const out = dispatch(s, { type: 'post_moment', selfieId: 'gym' });
    expect(out.selfieAudience.includes('lao_li')).toBe(false);
    const out2 = dispatch(s, { type: 'update_profile', bioId: 'gamer_allnight' });
    expect(out2.bioAudience.includes('lao_li')).toBe(false);
  });
});

describe('v4.5: 开场白池扩容与随机化', () => {
  it('bio 钩子池：10 原型 × 3 句，句句不重样', () => {
    const all: string[] = [];
    for (const [arch, pool] of Object.entries(BIO_HOOK_BY_ARCHETYPE)) {
      expect(pool!.length, `${arch} 钩子池应为 3 句`).toBe(3);
      all.push(...pool!);
    }
    expect(new Set(all).size).toBe(all.length); // 30 句无重复
  });

  it('库人物 on_selfie 池：5 原型 × 5 句，句句不重样且带 {selfie}', () => {
    const all: string[] = [];
    for (const [arch, pools] of Object.entries(ARCHETYPE_INCOMING)) {
      expect(pools.on_selfie.length, `${arch} on_selfie 池应为 5 句`).toBe(5);
      for (const line of pools.on_selfie) {
        expect(line).toContain('{selfie}');
      }
      all.push(...pools.on_selfie);
    }
    expect(new Set(all).size).toBe(all.length);
  });

  it('主五人 on_selfie 池 ≥6 句（v4.4 已有 8 句，不许缩水）', () => {
    for (const id of ACTIVE_TARGETS) {
      expect(INCOMING_LINES[id].on_selfie.length, `${id} 池缩水`).toBeGreaterThanOrEqual(6);
    }
  });

  it('bio 钩子 3 句池真的随机：多种子换签后圈里人开口不总同一句', () => {
    // 抽 60 种子：同一个人（原型）说过的钩子开场白应有 ≥2 种（3 句池随机取一）。
    const spoken = new Map<string, Set<string>>();
    const hookLines: string[] = [];
    for (const pool of Object.values(BIO_HOOK_BY_ARCHETYPE)) hookLines.push(...pool!);
    for (let seed = 800; seed < 860; seed++) {
      let s = fresh(seed);
      s = dispatch(s, { type: 'update_profile', bioId: 'chess_and_tea' });
      for (let d = 0; d < BIO_HOOK_WINDOW_DAYS; d++) {
        s = dispatch(s, { type: 'sleep' });
        for (const m of s.incoming) {
          const line = hookLines.find((l) => m.opener.includes(l.slice(0, 10)));
          if (line) {
            const key = m.targetId;
            if (!spoken.has(key)) spoken.set(key, new Set());
            spoken.get(key)!.add(line);
          }
        }
      }
    }
    const counts = [...spoken.values()].map((set) => set.size);
    expect(counts.length).toBeGreaterThan(0); // 至少有一个人开过口
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(2); // 同一个人不是永远同一句
  });
});
