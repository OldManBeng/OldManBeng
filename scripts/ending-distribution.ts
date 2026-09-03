/**
 * 数值校准脚本（不进测试套件，手动跑）：
 * 多策略 × 多种子自动跑局，统计结局分布、经济曲线、被拉黑率、偶遇/被找次数。
 * v2.0：计划偶遇解锁 + 他来找你（incoming）+ 每晚 4 场精力。
 * 用法：npx tsx scripts/ending-distribution.ts
 */
import { createInitialState, dispatch, targetAwake, ALL_TARGET_MAP } from '../src/engine/state-machine';
import { ENDINGS } from '../src/data/endings';
import { DAILY_PLANS } from '../src/data/plans';

type Policy = 'greedy' | 'single' | 'smart' | 'social';

/**
 * 通用一天流程。pickAsk 决定要不要抓住要红包的选项。
 * - greedy：能开口就开口（急功近利玩家）。
 * - smart：只在低警惕、包冷却完、信任起来后开口。
 * - single：只经营一条线（老李/周老师）。
 * - social：v2.0 玩法——每天选偶遇计划扩通讯录，回应他来找你，晚场聊信任最高的。
 */
function autoPlay(seed: number, policy: Policy) {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'auto', motive: 'debt', personaId: 'wise_sister' });
  let guard = 0;
  const planPool = DAILY_PLANS.filter((p) => p.meetArchetypes.length > 0);
  let planIdx = 0;
  while (s.phase === 'main' && guard++ < 1200) {
    if (s.dayPhase === 'morning') {
      // v2.0：白天先选计划（偶遇玩法轮换地点，其他策略宅家省精力）。
      if (policy === 'social' && !s.todayPlan) {
        const plan = planPool[planIdx++ % planPool.length];
        s = dispatch(s, { type: 'choose_plan', planId: plan.id });
      }
      // 他来找你：回应一个（信任最高的优先）。
      if (s.incoming.length && s.energy >= 4) {
        const best = [...s.incoming].sort((a, b) => {
          const ta = s.targets.find((x) => x.targetId === a.targetId)!;
          const tb = s.targets.find((x) => x.targetId === b.targetId)!;
          return tb.trust - ta.trust;
        })[0];
        s = dispatch(s, { type: 'accept_incoming', targetId: best.targetId });
        continue;
      }
      const morningTargets = s.targets.filter(
        (t) => !t.blocked && t.discoveredDay > 0 && t.lastChatDay !== s.day && targetAwake(ALL_TARGET_MAP[t.targetId], 'morning') && s.energy >= 4,
      );
      const pick = policy === 'single' ? morningTargets.filter((t) => t.targetId === 'zhou_teacher') : morningTargets;
      if (pick.length) s = dispatch(s, { type: 'start_chat', targetId: pick[0].targetId });
      else s = dispatch(s, { type: 'enter_night' });
    } else if (s.dayPhase === 'night') {
      const nightTargets = s.targets
        .filter((t) => !t.blocked && t.discoveredDay > 0 && t.lastChatDay !== s.day && targetAwake(ALL_TARGET_MAP[t.targetId], 'night') && s.energy >= 4)
        .sort((a, b) => b.trust - a.trust);
      const pick = policy === 'single' ? nightTargets.filter((t) => t.targetId === 'lao_li') : nightTargets;
      if (pick.length) s = dispatch(s, { type: 'start_chat', targetId: pick[0].targetId });
      else s = dispatch(s, { type: 'sleep' });
    } else if (s.dayPhase === 'chat' && s.chat) {
      if (s.chat.awaiting === 'player') {
        const t = s.targets.find((x) => x.targetId === s.chat!.targetId)!;
        let best = 0; let bestScore = -Infinity; let askIdx = -1;
        s.chat.pendingOptions.forEach((o, i) => {
          let score = o.trust;
          if (o.isAsk) { askIdx = i; score -= 2; }
          if (score > bestScore) { bestScore = score; best = i; }
        });
        let wantAsk = false;
        if (policy === 'greedy') wantAsk = askIdx >= 0 && t.stage !== 'stranger';
        if (policy === 'smart' || policy === 'single') wantAsk = askIdx >= 0 && t.stage !== 'stranger' && t.daysSincePaid >= 3 && t.wariness < 25 && t.trust >= 30;
        if (policy === 'social') wantAsk = askIdx >= 0 && t.stage !== 'stranger' && t.daysSincePaid >= 3 && t.wariness < 35;
        s = dispatch(s, { type: 'pick_option', optionIndex: wantAsk && askIdx >= 0 ? askIdx : best });
      } else {
        s = dispatch(s, { type: 'end_chat' });
      }
    } else {
      break;
    }
  }
  return s;
}

const SEEDS = Array.from({ length: 60 }, (_, i) => 1000 + i);
const policies: Policy[] = ['greedy', 'single', 'smart', 'social'];

console.log('=== 结局分布（每策略 60 种子）===');
for (const p of policies) {
  const counts: Record<string, number> = {};
  const totals: number[] = [];
  const blockedCounts: number[] = [];
  const knownCounts: number[] = [];
  const incomingCounts: number[] = [];
  const days: number[] = [];
  const riskPeak: number[] = [];
  const numb: number[] = [];
  const asks: number[] = [];
  for (const seed of SEEDS) {
    const s = autoPlay(seed, p);
    const e = s.endingId ?? '(no-ending)';
    counts[e] = (counts[e] ?? 0) + 1;
    totals.push(s.stats.totalEarned);
    blockedCounts.push(s.targets.filter((t) => t.blocked).length);
    knownCounts.push(s.targets.filter((t) => t.discoveredDay > 0).length);
    incomingCounts.push(s.stats.redPacketsReceived); // proxy
    days.push(s.day);
    riskPeak.push(s.riskLevel);
    numb.push(s.numbness);
    asks.push(s.stats.asksMade);
  }
  const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
  console.log(`\n策略 ${p}:`);
  console.log(`  结局: ${JSON.stringify(counts)}`);
  console.log(`  平均总收入 ${avg(totals)} / 目标 1500 · 达标率 ${(totals.filter((t) => t >= 1500).length / SEEDS.length * 100).toFixed(0)}%`);
  console.log(`  平均被拉黑 ${avg(blockedCounts)} · 认识人数 ${avg(knownCounts)}/50 · 风险峰值均 ${avg(riskPeak)}% · 麻木 ${avg(numb)}% · 开口 ${avg(asks)} 次 · 跑到第 ${avg(days)} 天`);
}

console.log('\n=== 全部结局（可达成性对照）===');
console.log(ENDINGS.map((e) => e.id).join(', '));
