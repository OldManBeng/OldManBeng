import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch } from '../state-machine';
import { INCIDENTS, incidentsAvailable } from '../../data/incidents';
import { INCIDENT_CHANCE, INCIDENT_FIRST_DAY } from '../../data/constants';
import type { GameState } from '../../types/game';
import type { PersonaId } from '../../types/persona';

/**
 * v4.2 突发事件系统回归锁：
 *  1. 数据完备（四类、两难选项、落锤代价、红线）
 *  2. 随机触发（不是日历——多种子里有触发也有不触发；首两日不触发；节奏日不掷）
 *  3. 决策后果入账（钱/良心/麻木/风险/人头上的信任警惕）
 *  4. 拖到睡觉落"没接住"（staleEffects 照付）
 *  5. 同一事件只来一次（usedOneTimeEvents 记账）
 *  6. 红线：不出现可实操诈骗细节；每笔"白来的钱"都有良心/风险代价
 */

function fresh(seed: number, personaId: PersonaId = 'wise_sister'): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId });
  return s;
}

/** 睡到第 n 天早晨（跳过 briefing 不影响引擎——简报是纯 UI）。 */
function playToDay(seed: number, day: number): GameState {
  let s = fresh(seed);
  while (s.day < day) s = dispatch(s, { type: 'sleep' });
  return s;
}

describe('v4.2: 突发事件数据完备', () => {
  it('池子 ≥12 件、每件两个选项、文案齐', () => {
    expect(INCIDENTS.length).toBeGreaterThanOrEqual(12);
    for (const inc of INCIDENTS) {
      expect(inc.id).toBeTruthy();
      expect(inc.title.length).toBeGreaterThan(0);
      expect(inc.body.length).toBeGreaterThan(20);
      expect(inc.options.length).toBe(2);
      for (const opt of inc.options) {
        expect(opt.text.length).toBeGreaterThan(0);
        expect(opt.after.length).toBeGreaterThan(10);
        expect(opt.stale.length).toBeGreaterThan(10); // "没接住"旁白必填
      }
      // 落锤代价：警惕/信任类别一刀别太狠（钱另算）
      if (inc.staleEffects) {
        for (const [k, v] of Object.entries(inc.staleEffects)) {
          if (typeof v === 'number' && k !== 'money' && k !== 'conscience') {
            expect(Math.abs(v), `${inc.id} 的落锤 ${k}=${v} 太狠`).toBeLessThanOrEqual(25);
          }
        }
      }
    }
  });

  it('四类都有：他那边/你这边/世界逼近/钱的事（minDay 覆盖早中后期）', () => {
    const days = INCIDENTS.map((i) => i.minDay);
    expect(Math.min(...days)).toBeLessThanOrEqual(3);
    expect(Math.max(...days)).toBeGreaterThanOrEqual(10);
    expect(new Set(INCIDENTS.map((i) => i.id)).size).toBe(INCIDENTS.length); // id 唯一
  });

  it('requireTarget 的目标都存在于全量目标（主五人 e1 库人物）', () => {
    for (const inc of INCIDENTS) {
      if (!inc.requireTarget) continue;
      const all = playToDay(1, 1);
      expect(all.targets.some((t) => t.targetId === inc.requireTarget), `${inc.id} 的 requireTarget ${inc.requireTarget} 不存在`).toBe(true);
    }
  });

  it('incidentsAvailable 按天/认识过滤', () => {
    // 第 2 天：谁都不够格
    expect(incidentsAvailable(2, new Set(['lao_li'])).length).toBe(0);
    // 第 3 天，只认识主五人：手机摔了（无 requireTarget）够格
    const day3 = incidentsAvailable(3, new Set(['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong']));
    expect(day3.map((i) => i.id)).toContain('inc_phone_broken');
    // 侯师傅的退款事件要认识 e1 才出现
    const noE1 = incidentsAvailable(10, new Set(['lao_li']));
    expect(noE1.map((i) => i.id)).not.toContain('inc_refund_demand');
    const withE1 = incidentsAvailable(10, new Set(['lao_li', 'e1']));
    expect(withE1.map((i) => i.id)).toContain('inc_refund_demand');
  });

  it('红线：全部文案不含可实操诈骗细节', () => {
    const blob = JSON.stringify(INCIDENTS);
    for (const banned of ['银行卡', '验证码', '收款码', '支付宝账号', '转账到', '删除聊天记录', '清空记录']) {
      expect(blob.includes(banned), `突发事件文案出现了红线词：${banned}`).toBe(false);
    }
  });

  it('没有白来的钱：正收益选项必带代价——除非是良心换来的（退钱/还钱例外）', () => {
    for (const inc of INCIDENTS) {
      for (const opt of inc.options) {
        if ((opt.money ?? 0) > 0) {
          const cost = (opt.conscience ?? 0) < 0 || (opt.risk ?? 0) > 0 || (opt.numbness ?? 0) > 0 || (opt.wariness ?? 0) > 0;
          const honest = (opt.conscience ?? 0) > 0 && (opt.trust ?? 0) >= 0; // 良心选项：钱是"少拿了"，不是白来
          expect(cost || honest, `${inc.id} 的「${opt.text}」进钱没有代价——免费的钱违反全游戏账本纪律`).toBe(true);
        }
      }
    }
    // 落锤同理
    for (const inc of INCIDENTS) {
      const m = inc.staleEffects?.money;
      if (m && m > 0) {
        const cost = (inc.staleEffects!.conscience ?? 0) < 0 || (inc.staleEffects!.numbness ?? 0) > 0 || (inc.staleEffects!.risk ?? 0) > 0;
        expect(cost, `${inc.id} 落锤进钱没有代价`).toBe(true);
      }
    }
  });
});

describe('v4.2: 随机触发（不是日历）', () => {
  it('多种子扫描：30 天内总会有事，也总有日子没事——不确定性存在', () => {
    let hit = 0;
    let quiet = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let s = fresh(seed);
      let sawIncident = false;
      let sawNone = false;
      for (let d = 0; d < 28; d++) {
        const before = s.usedOneTimeEvents.length;
        s = dispatch(s, { type: 'sleep' });
        if (s.usedOneTimeEvents.length > before && s.log.some((l) => l.kind === 'incident')) {
          sawIncident = true;
        } else if (s.day >= INCIDENT_FIRST_DAY + 1) {
          sawNone = true;
        }
      }
      if (sawIncident) hit += 1;
      if (sawNone) quiet += 1;
    }
    expect(hit, '30 种子 × 28 天居然一次突发事件都没有').toBeGreaterThanOrEqual(20);
    expect(quiet, '30 种子里没有一天平静——那不是随机，是日历').toBeGreaterThanOrEqual(20);
  });

  it('首两日不触发（INCIDENT_FIRST_DAY）', () => {
    for (let seed = 1; seed <= 20; seed++) {
      let s = fresh(seed);
      const day1 = s.log.filter((l) => l.kind === 'incident').length;
      s = dispatch(s, { type: 'sleep' });
      const day2 = s.log.filter((l) => l.day === 2 && l.kind === 'incident').length;
      s = dispatch(s, { type: 'sleep' });
      const day3 = s.log.filter((l) => l.day === 3 && l.kind === 'incident').length;
      expect(day1, '第 1 天不该有突发').toBe(0);
      expect(day2, '第 2 天不该有突发').toBe(0);
      // 第 3 天起允许触发（INCIDENT_FIRST_DAY=3）——不检查 day3，那是随机的
      void day3;
    }
    // 第 3-5 天的窗口里，30 种子总要有触发——随机性真实存在
    let fired = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let s = fresh(seed);
      for (let d = 0; d < 3 && s.day < 4; d++) s = dispatch(s, { type: 'sleep' });
      if (s.log.some((l) => l.kind === 'incident')) fired += 1;
    }
    expect(fired, '30 种子 × 头几天一次突发都没有——触发概率失效').toBeGreaterThan(0);
  });

  it('同一事件只来一次（一次性记账）', () => {
    let dupFound = false;
    let dupWhich = '';
    for (let seed = 1; seed <= 10 && !dupFound; seed++) {
      let s = fresh(seed);
      // 同一事件的日志行 ≤ 2（触发行 + 当天再选/落锤的结果行）；> 2 即触发两次
      const perIncident = new Map<string, number>();
      for (let d = 0; d < 30; d++) {
        for (const r of s.log.filter((l) => l.kind === 'incident' && l.day === s.day)) {
          const title = r.details.split('——')[0];
          perIncident.set(title, (perIncident.get(title) ?? 0) + 1);
        }
        s = dispatch(s, { type: 'sleep' });
        if (s.phase === 'ended') break;
      }
      for (const [title, n] of perIncident) {
        if (n > 2) { dupFound = true; dupWhich = `种子 ${seed}: ${title} ×${n}`; }
      }
    }
    expect(dupFound, `同一事件在同一存档触发了两次（${dupWhich}）`).toBe(false);
  });

  it('节奏日（5/10/15/20/25）当天不掷突发——压迫不叠压迫', () => {
    for (let seed = 1; seed <= 20; seed++) {
      let s = fresh(seed);
      for (let d = 0; d < 26; d++) {
        const onBeatDay = [5, 10, 15, 20, 25].includes(s.day);
        const incidentsToday = s.log.filter((l) => l.day === s.day && l.kind === 'incident');
        if (onBeatDay) expect(incidentsToday.length, `种子 ${seed} 第 ${s.day} 天节奏日叠了突发`).toBe(0);
        s = dispatch(s, { type: 'sleep' });
        if (s.phase === 'ended') break;
      }
    }
  });

  it('同存档重放一致（种子确定性）', () => {
    const run = (seed: number) => {
      let s = fresh(seed);
      const titles: string[] = [];
      for (let d = 0; d < 20; d++) {
        for (const r of s.log.filter((l) => l.kind === 'incident')) titles.push(r.details);
        s = dispatch(s, { type: 'sleep' });
      }
      return titles;
    };
    expect(run(42)).toEqual(run(42));
    expect(run(42).length).toBeGreaterThan(0);
  });
});

describe('v4.2: 决策入账', () => {
  it('resolve_incident 按选项结算：钱进账本、良心/风险入账、人头上的信任警惕生效', () => {
    // 直接构造待决事件（引擎内部状态可注入——与 beat 同测试法）
    let s = fresh(7);
    s.pendingIncident = 'inc_paid_double';
    const money0 = s.money;
    const li0 = s.targets.find((t) => t.targetId === 'lao_li')!;
    li0.trust = 50;
    const cons0 = s.conscience;
    s = dispatch(s, { type: 'resolve_incident', optionIndex: 0 }); // 退回去 450
    const li = s.targets.find((t) => t.targetId === 'lao_li')!;
    expect(s.money).toBe(money0 + 50); // 留下他本来要给的 50
    expect(s.ledger.some((e) => e.amount === 50 && e.kind === 'event')).toBe(true);
    expect(li.trust).toBe(55); // +5
    expect(s.conscience).toBe(cons0 + 8); // 良心 +8
    expect(s.incidentResolved).toBe(true);
    expect(s.log.some((l) => l.kind === 'incident' && l.details.includes('退了 450'))).toBe(true);
    // 选过了不能再选
    s = dispatch(s, { type: 'resolve_incident', optionIndex: 1 });
    expect(s.money).toBe(money0 + 50);
  });

  it('落锤：拖到睡觉没选 → staleEffects 照付 + "没接住"旁白', () => {
    // 同种子同晚对照（差值即落锤效果，绕开晨间账单/衰减的干扰）。
    const run = (pending: boolean) => {
      let s = playToDay(8, 2);
      const e1 = s.targets.find((t) => t.targetId === 'e1')!;
      e1.discoveredDay = 1;
      e1.wariness = 30; // 抬离 0 地板——两组衰减对称，差值才能精确对上
      e1.trust = 50;
      if (pending) s.pendingIncident = 'inc_refund_demand';
      return dispatch(s, { type: 'sleep' });
    };
    const withPending = run(true);
    const baseline = run(false);

    const e1a = withPending.targets.find((t) => t.targetId === 'e1')!;
    const e1b = baseline.targets.find((t) => t.targetId === 'e1')!;
    expect(e1a.wariness - e1b.wariness, `落锤警惕差值（期望 +25）`).toBe(25);
    expect(e1a.trust - e1b.trust, `落锤信任差值（期望 -10）`).toBe(-10);
    expect(withPending.conscience - baseline.conscience, `落锤良心差值（期望 -4）`).toBe(-4);
    expect(withPending.log.some((l) => l.kind === 'incident' && l.details.includes('头像再没亮过'))).toBe(true);
  });

  it('落锤含钱也要入账（多打的红包：不退 = 收下 500）', () => {
    const run = (pending: boolean) => {
      let s = playToDay(9, 2);
      if (pending) s.pendingIncident = 'inc_paid_double';
      return dispatch(s, { type: 'sleep' });
    };
    const withPending = run(true);
    const baseline = run(false);
    expect(withPending.money - baseline.money).toBe(500); // 落锤 +500（基线同种子无事件）
    expect(withPending.ledger.some((e) => e.amount === 500 && e.kind === 'event')).toBe(true);
    expect(withPending.conscience).toBeLessThan(baseline.conscience); // 良心 -5
  });

  it('事件卡 UI 状态：未决时 pendingIncident/落锤后清空（引擎侧可观察）', () => {
    let s = fresh(11);
    s.pendingIncident = 'inc_news_push';
    s = dispatch(s, { type: 'resolve_incident', optionIndex: 0 });
    expect(s.riskLevel).toBeLessThanOrEqual(3); // 初始 0，-10 clamp 到底仍 ≥0
    expect(s.incidentResolved).toBe(true);
  });

  it('INCIDENT_CHANCE 在合理区间（不是天天有，也不是月月净）', () => {
    expect(INCIDENT_CHANCE).toBeGreaterThan(0.1);
    expect(INCIDENT_CHANCE).toBeLessThan(0.35);
    expect(INCIDENT_FIRST_DAY).toBeGreaterThanOrEqual(3);
  });
});
