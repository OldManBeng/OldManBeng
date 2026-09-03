import type { ChainNode, FreeNode, ChatPack, DialogueContextMap, IncomingLines } from './script';

/** Per-target content bundle: story chain + free pool + voice lines. */
export interface TargetScript {
  chain: Record<string, ChainNode>;
  free: FreeNode[];
  lines: DialogueContextMap;
  /** v2.0：10 套闲聊话术组（无剧情节点时轮换，去重近期）。 */
  packs?: ChatPack[];
  /** v2.0：他主动找你的台词。 */
  incoming?: IncomingLines;
  /** v2.0：老头库目标共享的原型闲聊组（按 archetype 查）。 */
  archetype?: string;
}

/**
 * Content registry, one bundle per target id. Adding a new 老头 = one entry
 * here plus a Target card in data/targets.ts — the engine stays generic.
 */
export const SCRIPTS: Record<string, TargetScript> = {};
