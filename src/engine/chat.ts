/**
 * Red-packet ask resolution and chat math. Pure functions only.
 */
import type { GameState } from '../types/game';
import type { Target, TargetState, TalkStyle } from '../types/target';
import type { ChainOption } from '../types/script';
import { makeRng } from '../utils/random';
import {
  ASK_BASE, ASK_TRUST_RATE, ASK_WARINESS_RATE, ASK_WARINESS_CEILING,
  LONELINESS_ASK_BONUS, PACKET_TIERS, PERSONA_NEED_MATCH, WALLET_COOLDOWN_DAYS,
} from '../data/constants';
import { scriptFor } from '../data/script-registry';

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Persona × his emotional need × style fit → reply multiplier (GL2 typeMatch). */
export function replyMultiplier(
  target: Target,
  state: TargetState,
  style: TalkStyle,
  personaId: string,
): number {
  void state;
  let m = 1;
  m *= PERSONA_NEED_MATCH[personaId]?.[target.need] ?? 1;
  if (target.preferredStyles.includes(style)) m *= 2;
  if (target.badPersonas.includes(personaId as never)) m *= 0.3;
  return m;
}

/** Ask success chance. Formula documented in constants.ts. */
export function askChance(target: Target, state: TargetState): number {
  if (state.wariness > Math.min(ASK_WARINESS_CEILING, target.warinessThreshold + 30)) return 0;
  let p = ASK_BASE + (state.trust / 100) * ASK_TRUST_RATE - (state.wariness / 100) * ASK_WARINESS_RATE;
  if (target.traits.includes('loneliness')) p += LONELINESS_ASK_BONUS;
  return clamp(p, 0, 0.9);
}

export interface AskResult {
  success: boolean;
  amount: number;
  tierLabel: string;
  line: string;
}

/** Resolve one red-packet ask roll (consumes seed from state).
 *  Packet size scales with relationship stage — the deeper the con, the
 *  bigger the "心意" he thinks it is. */
export function resolveAsk(state: GameState, target: Target, tstate: TargetState): AskResult {
  const rng = makeRng(state.rngSeed);
  state.rngSeed = (state.rngSeed * 1664525 + 1013904223) >>> 0;
  const lines = scriptFor(target.id).lines;
  const success = rng.chance(askChance(target, tstate));
  if (!success) {
    const line = rng.pick(lines.ask_fail ?? []);
    return { success: false, amount: 0, tierLabel: '', line };
  }
  const stage = tstate.stage === 'harvest' ? 'harvest' : tstate.stage === 'trusted' ? 'trusted' : 'warming';
  const tiers = PACKET_TIERS[stage];
  const totalW = tiers.reduce((s, t) => s + t.weight, 0);
  let roll = rng.next() * totalW;
  let tier = tiers[0];
  for (const t of tiers) {
    roll -= t.weight;
    if (roll <= 0) { tier = t; break; }
  }
  let amount = rng.int(tier.min, tier.max);
  if (target.traits.includes('generous')) amount = Math.round(amount * 1.4);
  const line = rng.pick(lines.ask_success ?? []);
  return { success: true, amount, tierLabel: tier.label, line };
}

/** Trust delta for a picked option with multiplier applied. */
export function applyOptionToTrust(option: ChainOption, multiplier: number): number {
  // Negative effects are not amplified by persona mismatch (punishing twice).
  if (option.trust <= 0) return option.trust;
  const scaled = option.trust * multiplier;
  return scaled > 12 ? 12 : scaled; // per-reply soft cap
}

/** Wallet cooldown: he won't pay again within N days of last packet.
 *  Fresh targets start at 0 — the first ask also needs the 3-day pacing,
 *  which keeps day-1 asks from firing at 25% trust (see ASK_MIN_STAGE). */
export function walletReady(tstate: TargetState): boolean {
  return tstate.daysSincePaid >= WALLET_COOLDOWN_DAYS;
}
