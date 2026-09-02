import type { ChainNode, FreeNode, DialogueContextMap } from './script';

/** Per-target content bundle: story chain + free pool + voice lines. */
export interface TargetScript {
  chain: Record<string, ChainNode>;
  free: FreeNode[];
  lines: DialogueContextMap;
}

/**
 * Content registry, one bundle per target id. Adding a new 老头 = one entry
 * here plus a Target card in data/targets.ts — the engine stays generic.
 */
export const SCRIPTS: Record<string, TargetScript> = {};
