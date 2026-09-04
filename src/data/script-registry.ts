import type { TargetScript } from '../types/scripts-registry';
import type { DialogueContextMap } from '../types/script';
import { LAO_LI_CHAIN, LAO_LI_FREE } from './scripts';
import { LAO_LI_LINES } from './dialogue';
import { ZHOU_CHAIN, ZHOU_FREE, ZHOU_LINES } from './zhou-script';
import { WANG_CHAIN, WANG_FREE, WANG_LINES } from './wang-script';
import { HAO_CHAIN, HAO_FREE, HAO_LINES } from './hao-script';
import { CHEN_CHAIN, CHEN_FREE, CHEN_LINES } from './chen-script';
import { LAO_LI_PACKS, ZHOU_PACKS, WANG_PACKS, HAO_PACKS, CHEN_PACKS, INCOMING_LINES } from './main-packs';
// v2.1 话术库·第二卷——主五人各 +50 套（共 60 套/人），近 N 套去重轮换。
import { LAO_LI_PACKS_V2 } from './packs-li';
import { ZHOU_PACKS_V2 } from './packs-zhou';
import { WANG_PACKS_V2 } from './packs-wang';
import { HAO_PACKS_V2 } from './packs-hao';
import { CHEN_PACKS_V2 } from './packs-chen';

/**
 * All per-target content, assembled. Engine reads from here only —
 * no target-specific imports leak into engine code.
 */
export const SCRIPTS: Record<string, TargetScript> = {
  lao_li: { chain: LAO_LI_CHAIN, free: LAO_LI_FREE, lines: LAO_LI_LINES, packs: [...LAO_LI_PACKS, ...LAO_LI_PACKS_V2], incoming: INCOMING_LINES.lao_li },
  zhou_teacher: { chain: ZHOU_CHAIN, free: ZHOU_FREE, lines: ZHOU_LINES, packs: [...ZHOU_PACKS, ...ZHOU_PACKS_V2], incoming: INCOMING_LINES.zhou_teacher },
  boss_wang: { chain: WANG_CHAIN, free: WANG_FREE, lines: WANG_LINES, packs: [...WANG_PACKS, ...WANG_PACKS_V2], incoming: INCOMING_LINES.boss_wang },
  hao_ge: { chain: HAO_CHAIN, free: HAO_FREE, lines: HAO_LINES, packs: [...HAO_PACKS, ...HAO_PACKS_V2], incoming: INCOMING_LINES.hao_ge },
  chen_gong: { chain: CHEN_CHAIN, free: CHEN_FREE, lines: CHEN_LINES, packs: [...CHEN_PACKS, ...CHEN_PACKS_V2], incoming: INCOMING_LINES.chen_gong },
};

/** 库目标（45 人）没有专属脚本——按原型挂 ARCHETYPE_PACKS + 原型 incoming 台词。 */
import { ARCHETYPE_PACKS, ARCHETYPE_INCOMING } from './archetype-packs';
import { LIBRARY } from './target-library';
const LIBRARY_FALLBACK_LINES: DialogueContextMap = {
  greeting: ['（他来了。）'],
  wariness_high: ['（他最近的回复，越来越短。）'],
  silent_warning: ['（他安静了很多天。）'],
  ask_success: ['（他发来了红包。）'],
  ask_fail: ['（他岔开了话题。）'],
  blocked: ['（头像灰了。）'],
};
for (const t of LIBRARY) {
  SCRIPTS[t.id] = {
    chain: {},
    free: [],
    lines: LIBRARY_FALLBACK_LINES,
    packs: ARCHETYPE_PACKS[t.archetype],
    incoming: ARCHETYPE_INCOMING[t.archetype],
    archetype: t.archetype,
  };
}

/** Resolve with a hard error on missing content — a typo must fail loudly. */
export function scriptFor(targetId: string): TargetScript {
  const s = SCRIPTS[targetId];
  if (!s) throw new Error(`No script registered for target: ${targetId}`);
  return s;
}
