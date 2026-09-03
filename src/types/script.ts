import type { EmotionalNeed, TalkStyle } from './target';
import type { PersonaId } from './persona';

/** Long-form story chains — the scripted spines of a relationship (老李 M1: 4 阶段). */
export interface ChainNode {
  id: string;
  /** Minimum trust to fire; 'harvest' nodes also require stage gate. */
  minTrust?: number;
  minStage?: import('./target').TargetStage;
  /** His opening lines (played sequentially with typewriter). */
  openers: string[];
  /** Player reply options. */
  options: ChainOption[];
  /** Node that unlocks next after this resolves; '' ends chain for tonight. */
  next: string;
}

export interface ChainOption {
  text: string;
  style: TalkStyle;
  /** Base trust delta before persona match multiplier. */
  trust: number;
  /** Extra wariness from this reply. */
  wariness?: number;
  /** Numbness cost — performed intimacy charges her. */
  numbness?: number;
  /** Conscience nudge for heavy choices. */
  conscience?: number;
  /** Reply lines he answers with: shared array, or per-persona map with a `default` fallback. */
  replies?: string[] | ({ default?: string[] } & Partial<Record<PersonaId, string[]>>);
  /** Marks this branch as the scripted red-packet ask. */
  isAsk?: boolean;
  /** Marks a story flag set by this option. */
  setFlag?: string;
}

/** Ambience nodes that can fire on any night when no chain node is pending. */
export interface FreeNode {
  id: string;
  /** His current emotional tone decides availability. */
  minTrust?: number;
  openers: string[];
  options: ChainOption[];
}

export interface DialogueContextMap {
  [context: string]: string[];
}

/** Event table (rolled each morning). Effects are pure data, GL2-style. */
export type RandomEventEffect =
  | { kind: 'money'; amount: number }
  | { kind: 'wariness'; targetId?: string; amount: number }
  | { kind: 'trust'; targetId?: string; amount: number }
  | { kind: 'conscience'; amount: number }
  | { kind: 'mood' }
  | { kind: 'flag'; flag: string };

export interface DayEvent {
  id: string;
  name: string;
  description: string;
  /** Dice range on 2d6 (2-12). */
  diceRange: { min: number; max: number };
  oneTime?: boolean;
  effects: RandomEventEffect[];
  /** Flavor line variants; `default` is the fallback key. */
  lines?: { default?: string[] } & Partial<Record<PersonaId, string[]>>;
}

/** Persona × Need multiplier table (×2 good / ×0.3 bad / ×1 neutral), GL2-typeMatch. */
export type PersonaNeedMatch = Partial<Record<PersonaId, Partial<Record<EmotionalNeed, number>>>>;

export interface EndingDef {
  id: string;
  title: string;
  body: string[];
  /** Story-flag requirements. */
  requires?: string[];
}
