/**
 * v4.13.1 红包话术与实际行为一致性验收。
 *
 * 玩家诉求：话术里叙述「他转了钱/发了红包」的，钱包必须真的入账——
 * 叙事与账本不再各说各话；反向（说之前转过但没发生）在引擎侧用
 * timesPaid 门控 + 话术改写兜住。
 *
 * 实现：ChainOption.autoPacket（非开口选项的他主动转账金额）——
 * pick_option 渲染完 replies 后同步落账（红包横幅 + 来源字幕 + 流水 +
 * totalReceived/timesPaid/daysSincePaid/stats），与教学红包同通路。
 *
 * 红线：
 * 1. 带 autoPacket 的选项 → 钱包/流水/统计/横幅全部落账，金额与叙事一致。
 * 2. 不带 autoPacket 的普通选项 → 不落任何账（没有"幽灵入账"）。
 * 3. autoPacket 后 daysSincePaid 归零 + timesPaid+1——后续「已经给过了」
 *    类话术从此有事实支撑（钱包冷却分支的 timesPaid 门控成立）。
 */
import { describe, it, expect } from 'vitest';
import { createInitialState, dispatch } from '../state-machine';
import { walletReady } from '../chat';
import type { GameState, GameAction } from '../../types/game';
import type { ChainOption } from '../../types/script';

function fresh(seed: number): GameState {
  const s = { ...createInitialState(), rngSeed: seed };
  return dispatch(s, { type: 'new_game', name: '小满', motive: 'debt', personaId: 'wise_sister' });
}

/** 直接构造一场非链会话（闲聊/incoming 应答与链共用同一条 pick_option 分支）。
 *  用周老师——避开 lao_li 的 day1 教学红包横幅干扰断言。 */
function stageChat(s: GameState, options: ChainOption[]): GameState {
  const st = { ...s };
  st.day = 3;
  st.dayPhase = 'chat';
  st.chat = {
    targetId: 'zhou_teacher',
    transcript: [],
    pendingOptions: options,
    pendingNodeId: '',
    awaiting: 'player',
    closingNote: null,
  };
  return st;
}

const PACKET_OPT: ChainOption = {
  text: '「叔叔，挑礼物的钱……」', style: 'playful', trust: -4,
  replies: ['（他给你转了 200。礼物的钱他从烟钱里省。）'],
  autoPacket: 200,
};
const PLAIN_OPT: ChainOption = {
  text: '「你也发一个，让他们抢」', style: 'playful', trust: 5,
  replies: ['他真发了。'],
};

describe('v4.13.1: 话术红包一致性（autoPacket）', () => {
  it('红线1：autoPacket 选项 → 钱包/流水/统计/横幅/关系账全部落账', () => {
    let s = stageChat(fresh(31), [PACKET_OPT]);
    // dispatch 内部 clone——每次后重新 find target 引用
    s.targets.find((t) => t.targetId === 'zhou_teacher')!.daysSincePaid = 9;
    const money0 = s.money, earned0 = s.stats.totalEarned, packets0 = s.stats.redPacketsReceived, ledger0 = s.ledger.length;
    s = dispatch(s, { type: 'pick_option', optionIndex: 0 } as GameAction);
    const zhou = s.targets.find((t) => t.targetId === 'zhou_teacher')!;
    expect(s.money).toBe(money0 + 200);
    expect(zhou.totalReceived).toBe(200);
    expect(zhou.timesPaid).toBe(1);
    expect(zhou.daysSincePaid).toBe(0);
    expect(s.stats.totalEarned).toBe(earned0 + 200);
    expect(s.stats.redPacketsReceived).toBe(packets0 + 1);
    expect(s.stats.biggestPacket).toBeGreaterThanOrEqual(200);
    expect(s.ledger.length).toBe(ledger0 + 1);
    expect(s.ledger[s.ledger.length - 1].kind).toBe('packet');
    expect(s.ledger[s.ledger.length - 1].amount).toBe(200);
    const banner = s.chat?.transcript.find((m) => m.label === '红包 +200 元');
    expect(banner, '红包横幅必须出现在气泡流里').toBeDefined();
    expect(s.chat?.transcript.some((m) => m.text.includes('他主动的') || m.label === '红包 +200 元')).toBe(true);
  });

  it('红线2：普通选项（无 autoPacket）→ 一分钱不落（无幽灵入账）', () => {
    let s = stageChat(fresh(41), [PLAIN_OPT]);
    const money0 = s.money, ledger0 = s.ledger.length;
    s = dispatch(s, { type: 'pick_option', optionIndex: 0 } as GameAction);
    const zhou = s.targets.find((t) => t.targetId === 'zhou_teacher')!;
    expect(s.money).toBe(money0);
    expect(zhou.timesPaid).toBe(0);
    expect(zhou.totalReceived).toBe(0);
    expect(s.ledger.length).toBe(ledger0);
    expect(s.chat?.transcript.some((m) => m.label?.includes('红包'))).toBe(false);
  });

  it('红线3：autoPacket 后 timesPaid>0 → 钱包冷却门控成立（「已经给过了」话术的事实前提）', () => {
    let s = stageChat(fresh(77), [PACKET_OPT]);
    s = dispatch(s, { type: 'pick_option', optionIndex: 0 } as GameAction);
    const zhou = s.targets.find((t) => t.targetId === 'zhou_teacher')!;
    expect(zhou.timesPaid).toBeGreaterThan(0);
    // 「他这个月已经给过了」话术的引擎门控（state-machine.ts 钱包冷却分支）：
    // timesPaid>0 才说"已经给过"、否则说"还没到这个份上"——autoPacket 落过账
    // 后 timesPaid=1，冷却分支从此有事实支撑（他真的给过）。
    expect(walletReady(zhou)).toBe(false); // daysSincePaid=0 < 3 天冷却 → 冷却分支命中
  });
});
