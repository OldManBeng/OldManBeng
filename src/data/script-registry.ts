import type { TargetScript } from '../types/scripts-registry';
import { LAO_LI_CHAIN, LAO_LI_FREE } from './scripts';
import { LAO_LI_LINES } from './dialogue';
import { ZHOU_CHAIN, ZHOU_FREE, ZHOU_LINES } from './zhou-script';
import { WANG_CHAIN, WANG_FREE, WANG_LINES } from './wang-script';
import { HAO_CHAIN, HAO_FREE, HAO_LINES } from './hao-script';
import { CHEN_CHAIN, CHEN_FREE, CHEN_LINES } from './chen-script';

/**
 * All per-target content, assembled. Engine reads from here only —
 * no target-specific imports leak into engine code.
 */
export const SCRIPTS: Record<string, TargetScript> = {
  lao_li: { chain: LAO_LI_CHAIN, free: LAO_LI_FREE, lines: LAO_LI_LINES },
  zhou_teacher: { chain: ZHOU_CHAIN, free: ZHOU_FREE, lines: ZHOU_LINES },
  boss_wang: { chain: WANG_CHAIN, free: WANG_FREE, lines: WANG_LINES },
  hao_ge: { chain: HAO_CHAIN, free: HAO_FREE, lines: HAO_LINES },
  chen_gong: { chain: CHEN_CHAIN, free: CHEN_FREE, lines: CHEN_LINES },
};

/** Resolve with a hard error on missing content — a typo must fail loudly. */
export function scriptFor(targetId: string): TargetScript {
  const s = SCRIPTS[targetId];
  if (!s) throw new Error(`No script registered for target: ${targetId}`);
  return s;
}
