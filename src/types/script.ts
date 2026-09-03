import type { EmotionalNeed, TalkStyle, TargetArchetype } from './target';
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

/** v2.0 闲聊话术组——每个老头 10 套，开场按权重轮换，近期用过的不再重复。 */
export interface ChatPack {
  id: string;
  /** 相对权重（话题冷热）。 */
  weight?: number;
  /** 他的开场 2-4 条（第一句引用 profile 时按 selfie/age/_trait 变体）。 */
  openers: string[];
  options: ChainOption[];
}

/** v2.0 每日计划：白天选一个，决定今晚在哪、遇到什么人。 */
export interface DailyPlan {
  id: string;
  name: string;
  /** 1-2 句计划描述。 */
  description: string;
  /** 能遇到的库原型池（空 = 本来就在通讯录里的人）。 */
  meetArchetypes: TargetArchetype[];
  /** 遇到新人的概率。 */
  meetChance: number;
  /** 白天精力花费（占用今天额度）。 */
  energyCost: number;
  /** 计划事件的钱务效果（可正可负）。 */
  money?: number;
  /** 随机风险微调（危险计划才有）。 */
  riskAdd?: number;
}

/** v2.0 他主动找你的开场台词组。 */
export interface IncomingLines {
  /** 因为你的新自拍。 */
  on_selfie: string[];
  /** 就是想你了。 */
  missed_you: string[];
  /** 发工资/退休金的日子。 */
  wallet_open: string[];
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
