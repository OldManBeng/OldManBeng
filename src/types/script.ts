import type { EmotionalNeed, TalkStyle, TargetArchetype } from './target';
import type { PersonaId } from './persona';

/** Long-form story chains — the scripted spines of a relationship (老李 M1: 4 阶段). */
export interface ChainNode {
  id: string;
  /** Minimum trust to fire; 'harvest' nodes also require stage gate. */
  minTrust?: number;
  minStage?: import('./target').TargetStage;
  /** v3.0：人设门控——只有当前人设命中时该节点才会推进（剧情分岔：不同人设走出不同的关系线）。 */
  onlyPersona?: import('./persona').PersonaId[];
  /** His opening lines (played sequentially with typewriter). */
  openers: string[];
  /** Player reply options. */
  options: ChainOption[];
  /** Node that unlocks next after this resolves; '' ends chain for tonight. */
  next: string;
}

export interface ChainOption {
  text: string;
  /** v3.0：同一句话在人设嘴里的不同说法——命中当前人设时替换 text（缺省回落 text）。 */
  personaText?: { default?: string } & Partial<Record<import('./persona').PersonaId, string>>;
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
  /** v4.2.1（S4）：剧本写死的红包金额（如王总的"四千三"）——
   *  让引擎结算与叙事金额一致。缺省走随机档位。 */
  askAmount?: number;
  /** v4.13.1：非开口选项的「他主动转账」金额——replies 里叙述了他转了红包
   *  的选项必须声明此字段，引擎才会在 reply 落账（红包横幅+流水+timesPaid）。
   *  叙事说转了多少，账本就记多少——没有此字段的话术不得叙述具体转账行为。 */
  autoPacket?: number;
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
  /** v3.0：话题标签——聊过之后存进记忆，下一晚的开场可能"接昨天的话"。 */
  topic?: string;
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

/**
 * v4.4 他主动找你之后的应答组——一次「一问一答」的独立小会话。
 * 主动开场白不再接常规话术（chain/pack/free），而是从对应场景的
 * IncomingReplySet 里取回复选项：每条都针对他这次说的话，带正/负增益。
 * 增益复用 ChainOption（trust/wariness/numbness/conscience 全套机制）。
 */
export interface IncomingReplySet {
  /** 女主的回复选项（2-4 个，针对该场景的话头）。 */
  options: ChainOption[];
  /** 选完后的收束旁白（他的收尾动作），可不填。 */
  closing?: string;
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
