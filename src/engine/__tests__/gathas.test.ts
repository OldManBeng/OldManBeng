import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch } from '../state-machine';
import { DAILY_GATHAS, PROLOGUE_GATHAS, ENDING_EPIGRAPHS, TRIGGER_GATHAS } from '../../data/gathas';
import { ENDINGS } from '../../data/endings';

/** 晨钟月轮：每天一条，五幕递进，day 31+ 取模回卷——轮回。 */
describe('gathas: morning bell data', () => {
  it('has exactly 30 daily gathas (one per day of the month)', () => {
    expect(DAILY_GATHAS.length).toBe(30);
  });

  it('every daily gatha is unique and complete (verse/source/gloss)', () => {
    const verses = new Set<string>();
    for (const g of DAILY_GATHAS) {
      expect(verses.has(g.verse)).toBe(false);
      verses.add(g.verse);
      expect(g.verse.length).toBeGreaterThan(3);
      expect(g.source.length).toBeGreaterThan(1);
      expect(g.gloss.length).toBeGreaterThan(5);
    }
  });

  it('frames the month: day 2 神秀拂拭, day 30 慧能无物', () => {
    expect(DAILY_GATHAS[1].verse).toContain('时时勤拂拭');
    expect(DAILY_GATHAS[29].verse).toContain('本来无一物');
  });

  it('prologue has one gatha per page (4 pages)', () => {
    expect(PROLOGUE_GATHAS.length).toBe(4);
    for (const g of PROLOGUE_GATHAS) {
      expect(g.verse.length).toBeGreaterThan(3);
      expect(g.gloss.length).toBeGreaterThan(5);
    }
  });

  it('every one of the 10 endings has an epigraph gatha', () => {
    for (const e of ENDINGS) {
      expect(ENDING_EPIGRAPHS[e.id]).toBeDefined();
      expect(ENDING_EPIGRAPHS[e.id].verse.length).toBeGreaterThan(3);
      expect(ENDING_EPIGRAPHS[e.id].gloss.length).toBeGreaterThan(5);
    }
  });

  it('all four trigger gathas are present and complete', () => {
    const keys = ['industry_accept', 'industry_reject', 'risk_exposed', 'essay_close'] as const;
    for (const k of keys) {
      expect(TRIGGER_GATHAS[k].verse.length).toBeGreaterThan(3);
      expect(TRIGGER_GATHAS[k].gloss.length).toBeGreaterThan(5);
    }
  });
});

describe('gathas: engine wiring', () => {
  it('day 1 morning bell rings right after the bill, with the gloss as line', () => {
    let s = createInitialState();
    s = dispatch(s, { type: 'new_game', name: 't', motive: 'debt', personaId: 'wise_sister' });
    const gathas = s.log.filter((l) => l.kind === 'gatha');
    expect(gathas.length).toBe(1);
    expect(gathas[0].details).toContain(DAILY_GATHAS[0].verse);
    expect(gathas[0].details).toContain(DAILY_GATHAS[0].source);
    expect(gathas[0].line).toBe(DAILY_GATHAS[0].gloss);
    // 晨钟紧跟在账单之后敲响（bill → gatha 相邻）。
    const kinds = s.log.map((l) => l.kind);
    expect(kinds.indexOf('gatha')).toBe(kinds.lastIndexOf('bill') + 1);
  });

  it('each new day advances the wheel (day 2 rings the second gatha)', () => {
    let s = createInitialState();
    s = dispatch(s, { type: 'new_game', name: 't', motive: 'debt', personaId: 'wise_sister' });
    s = dispatch(s, { type: 'sleep' });
    const day2 = s.log.filter((l) => l.kind === 'gatha' && l.day === 2);
    expect(day2.length).toBe(1);
    expect(day2[0].details).toContain(DAILY_GATHAS[1].verse);
    expect(day2[0].line).toBe(DAILY_GATHAS[1].gloss);
  });

  it('past day 30 the wheel wraps — day 32 rings the second gatha again (轮回)', () => {
    let s = createInitialState();
    s = dispatch(s, { type: 'new_game', name: 't', motive: 'debt', personaId: 'wise_sister' });
    for (let d = 1; d <= 30; d++) s = dispatch(s, { type: 'sleep' }); // day 30 → 在 31 天翻页时结束
    expect(s.phase).toBe('ended');
    s = dispatch(s, { type: 'continue_playing' }); // day 31，加时十天
    s = dispatch(s, { type: 'sleep' });            // day 32 morning：(32-1) % 30 = 1
    const bell = s.log.filter((l) => l.kind === 'gatha' && l.day === 32);
    expect(bell.length).toBe(1);
    expect(bell[0].details).toContain(DAILY_GATHAS[1].verse);
    expect(bell[0].line).toBe(DAILY_GATHAS[1].gloss);
  });

  it('buying the industry course rings the 华严 gatha; deleting the DM rings 知足', () => {
    // 接受路径：造好邀请 flag + 足够的钱。
    let s = createInitialState();
    s = dispatch(s, { type: 'new_game', name: 't', motive: 'debt', personaId: 'wise_sister' });
    s.flags.industry_invite = true;
    s.money = 1000;
    s = dispatch(s, { type: 'industry_reply', accept: true });
    const acceptGatha = s.log.find((l) => l.kind === 'gatha' && l.details.includes(TRIGGER_GATHAS.industry_accept.verse));
    expect(acceptGatha).toBeDefined();
    expect(acceptGatha!.line).toBe(TRIGGER_GATHAS.industry_accept.gloss);
    // 拒绝路径：删掉私信 → 知足偈。
    let s2 = createInitialState();
    s2 = dispatch(s2, { type: 'new_game', name: 't', motive: 'debt', personaId: 'wise_sister' });
    s2.flags.industry_invite = true;
    s2 = dispatch(s2, { type: 'industry_reply', accept: false });
    const rejectGatha = s2.log.find((l) => l.kind === 'gatha' && l.details.includes('知足之人'));
    expect(rejectGatha).toBeDefined();
    expect(rejectGatha!.line).toBe(TRIGGER_GATHAS.industry_reject.gloss);
  });

  it('exposure events append the 因果不空 gatha right after the flag log', () => {
    // 穿帮是 25% 概率事件：扫一批种子，只要命中一次就完成断言（引擎按种子确定）。
    let hits = 0;
    for (let seed = 1; seed <= 64; seed++) {
      let s = { ...createInitialState(), rngSeed: seed };
      s = dispatch(s, { type: 'new_game', name: 't', motive: 'debt', personaId: 'wise_sister' });
      const a = s.targets.find((t) => t.targetId === 'lao_li')!;
      const b = s.targets.find((t) => t.targetId === 'boss_wang')!;
      a.trust = 50; a.wariness = 0; a.lastChatDay = 1; a.stage = 'warming';
      b.trust = 50; b.wariness = 0; b.lastChatDay = 1; b.stage = 'warming';
      s.riskLevel = 95;
      s = dispatch(s, { type: 'sleep' });
      const exposureIdx = s.log.findIndex((l) => l.details.startsWith('穿帮了'));
      if (exposureIdx < 0) continue;
      hits += 1;
      const next = s.log[exposureIdx + 1];
      expect(next.kind).toBe('gatha');
      expect(next.details).toContain(TRIGGER_GATHAS.risk_exposed.verse);
      expect(next.line).toBe(TRIGGER_GATHAS.risk_exposed.gloss);
    }
    // 64 个种子 × 25% 概率，全部落空的概率约 1e-8。
    expect(hits).toBeGreaterThan(0);
  });
});
