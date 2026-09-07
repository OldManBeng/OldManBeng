import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch } from '../state-machine';
import { scriptFor } from '../../data/script-registry';
import { LIBRARY_OPENERS } from '../../data/library-openers';
import type { GameState } from '../../types/game';
import type { PersonaId } from '../../types/persona';

/** v4.1.2 话术新鲜度回归：链夜随机穿插 + 库人物首聊随机化。
 *  背景：修复前主五人前几晚是逐字固定的剧本（不耗 RNG），重开一局
 *  同一个老头命中的永远是同一套话术；库人物首聊开场白按"发现日"索引，
 *  同一天遇到的永远是同一条。修复后：30% 的链夜随机改聊闲聊组
 *  （剧情节点原地保留、弧序不乱），库人物两条个人开场白随机抽。
 *  穿插判定不消耗随机流（seed mod 10 分派）——同存档同晚重放一致，
 *  不挤占话术池的随机流。 */

function fresh(seed: number, personaId: PersonaId = 'wise_sister'): GameState {
  let s = { ...createInitialState(), rngSeed: seed };
  s = dispatch(s, { type: 'new_game', name: 'test', motive: 'debt', personaId });
  return s;
}

function nightChat(s: GameState, targetId: string): GameState {
  let cur = s;
  if (cur.dayPhase === 'morning') cur = dispatch(cur, { type: 'enter_night' });
  return dispatch(cur, { type: 'start_chat', targetId });
}

const li = (s: GameState) => s.targets.find((x) => x.targetId === 'lao_li')!;
/** 编号主链节点（按数据插入序）：顺序保证的基准。 */
const LI_NUMBERED = Object.keys(scriptFor('lao_li').chain).filter((id) => /^c_li_\d+$/.test(id));

/** 选信任最高的非开口选项推进（口袋被掏空不是本测试的事）。 */
function pickBest(s: GameState): GameState {
  if (!s.chat || s.chat.awaiting !== 'player') return s;
  let best = 0; let bs = -Infinity;
  s.chat.pendingOptions.forEach((o, i) => {
    const score = (o.trust ?? 0) - (o.isAsk ? 99 : 0);
    if (score > bs) { bs = score; best = i; }
  });
  return dispatch(s, { type: 'pick_option', optionIndex: best });
}

describe('v4.1.2: 链夜随机穿插（主五人前几晚不再逐字相同）', () => {
  it('首晚保护：第一次链夜任何种子都必推剧情（c_li_1）', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = nightChat(fresh(seed * 61), 'lao_li');
      expect(s.chat?.pendingNodeId).toBe('c_li_1'); // 20 个种子全部直推链头
    }
  });

  it('第二晚起剧情/闲聊随种子交错：30 个种子出现 ≥3 种前四晚节奏（重开不再同一剧本）', () => {
    const patterns = new Set<string>();
    let sawInterlude = false;
    for (let seed = 1; seed <= 30; seed++) {
      let s = fresh(seed * 31);
      let pattern = '';
      for (let night = 1; night <= 4; night++) {
        const t = li(s);
        t.trust = 40; // c_li_2/3/4（minTrust 8/14/24）全部放行——分类干净
        t.wariness = 0;
        s = nightChat(s, 'lao_li');
        if (!s.chat) { pattern += '!'; break; }
        const isChain = s.chat.pendingNodeId !== '';
        pattern += isChain ? 'C' : 'P';
        if (!isChain) sawInterlude = true;
        s = pickBest(s);
        if (s.chat) s = dispatch(s, { type: 'end_chat' });
        s = dispatch(s, { type: 'sleep' });
      }
      patterns.add(pattern);
    }
    expect(patterns.size).toBeGreaterThanOrEqual(3); // 修复前：30 个种子全是 "CCCC" 一种
    expect(sawInterlude).toBe(true); // 必然有种子撞上穿插晚
    for (const p of patterns) expect(p[0]).toBe('C'); // 首晚保护贯穿所有种子
  });

  it('穿插只改节奏不改顺序：闲聊晚零消耗，链节点严格按 c_li_1→11 推进', () => {
    let sawInterlude = false;
    let completed = 0;
    for (let seed = 1; seed <= 8; seed++) {
      let s = fresh(seed * 7, 'femme_fatale'); // 人设节点被 persona 门挡死——只测编号主链
      const consumedOrder: string[] = [];
      for (let night = 1; night <= 26 && consumedOrder.length < LI_NUMBERED.length; night++) {
        const t = li(s);
        t.trust = 90; t.wariness = 0; // 门槛全开：随机的是节奏，不是"能不能推"
        s = nightChat(s, 'lao_li');
        if (!s.chat) break;
        const wasChain = s.chat.pendingNodeId !== '';
        const before = LI_NUMBERED.filter((id) => s.flags[`chain_${id}`]);
        s = pickBest(s);
        if (!s.chat) break;
        const after = LI_NUMBERED.filter((id) => s.flags[`chain_${id}`]);
        if (!wasChain) {
          sawInterlude = true;
          expect(after.length, '穿插晚不得消耗任何剧情节点').toBe(before.length);
        } else {
          for (const id of after) if (!before.includes(id)) consumedOrder.push(id);
        }
        s = dispatch(s, { type: 'end_chat' });
        s = dispatch(s, { type: 'sleep' });
      }
      // 消费序必须是编号主链的前缀：不跳号、不回头、不乱序。
      expect(consumedOrder.join(',')).toBe(LI_NUMBERED.slice(0, consumedOrder.length).join(','));
      if (consumedOrder.length === LI_NUMBERED.length) completed += 1;
    }
    expect(sawInterlude).toBe(true); // 8 局 × 最多 26 晚必然撞上穿插
    expect(completed).toBeGreaterThanOrEqual(1); // 至少一局走完整个弧（穿插不吞剧情）
  });
});

describe('v4.1.2: 库人物首聊随机化（同一天遇到不再同一条）', () => {
  it('g8 的两条个人开场白跨种子都会出现（修复前 30/30 永远同一条）', () => {
    const seen = new Map<string, number>();
    for (let seed = 1; seed <= 30; seed++) {
      let s = fresh(seed * 41);
      s.targets.find((x) => x.targetId === 'g8')!.discoveredDay = s.day; // 计划偶遇入册
      s = dispatch(s, { type: 'enter_night' });
      s = dispatch(s, { type: 'start_chat', targetId: 'g8' });
      const first = s.chat?.transcript.find((m) => m.speaker === 'target')?.text ?? '';
      seen.set(first, (seen.get(first) ?? 0) + 1);
    }
    const pool = LIBRARY_OPENERS.g8.map((o) => o.split('｜')[0]);
    for (const line of seen.keys()) {
      expect(pool, '首句必须来自 g8 的个人池').toContain(line);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2); // 两条池都现身（修复前永远 1 条）
  });
});

describe('v4.1.2: 穿插判定只依赖存档（重放一致性）', () => {
  it('同一存档同一晚，两次开聊结果逐字一致（穿插不读时钟/外部随机）', () => {
    let base = fresh(123);
    base.flags.chain_c_li_1 = true; // 链中段：穿插判定已被激活
    const t = li(base);
    t.trust = 40;
    t.wariness = 0;
    base = dispatch(base, { type: 'enter_night' });
    const run = () => dispatch(
      JSON.parse(JSON.stringify(base)) as GameState,
      { type: 'start_chat', targetId: 'lao_li' },
    );
    const a = run();
    const b = run();
    expect(a.chat?.pendingNodeId).toBe(b.chat?.pendingNodeId);
    expect(JSON.stringify(a.chat?.transcript)).toBe(JSON.stringify(b.chat?.transcript));
    expect(a.rngSeed).toBe(b.rngSeed);
  });
});
