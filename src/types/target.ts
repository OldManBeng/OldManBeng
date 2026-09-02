import type { PersonaId } from './persona';

/** Story stages of the long con. Gate for scripts and ask chance. */
export type TargetStage = 'stranger' | 'warming' | 'trusted' | 'harvest' | 'burned';

/** What hole in his life she is selling into — decides persona match. */
export type EmotionalNeed = 'listened_to' | 'desired' | 'daughter_figure' | 'respected';

/** Reply flavours he responds to. */
export type TalkStyle = 'sweet' | 'flirty' | 'caring' | 'intellectual' | 'playful';

/** Which target archetype the character card belongs to. */
export type TargetArchetype =
  | 'widowed_teacher'    // 丧偶退休教师
  | 'divorced_driver'   // 离异出租车司机
  | 'married_boss'      // 已婚个体老板
  | 'cafe_owner_ninety' // 九零后网吧老板
  | 'lonely_engineer';  // 独居老工程师

/** Mechanical hooks the engine reads (mirrors GL2's GirlfriendTrait). */
export const TargetTrait = {
  /** Only reliably online after 23:00. */
  NightOwl: 'night_owl',
  /** Red packets are bigger. */
  Generous: 'generous',
  /** Wariness decays slower, thresholds higher. */
  Suspicious: 'suspicious',
  /** Deeply lonely — asks land easier. */
  Loneliness: 'loneliness',
  /** Clingy — trust decays faster without contact. */
  Clingy: 'clingy',
} as const;
export type TargetTraitId = (typeof TargetTrait)[keyof typeof TargetTrait];

export interface Target {
  id: string;
  name: string;
  archetype: TargetArchetype;
  age: number;
  bio: string;
  /** One-line emotional pitch, shown on his card. */
  personality: string;
  likes: string;
  dislikes: string;
  need: EmotionalNeed;
  /** Which talk flavours land ×2 with him; mismatched ones ×0.3. */
  preferredStyles: TalkStyle[];
  /** Preferred personas: match multiplier ×2. Anti-personas ×0.3. */
  goodPersonas: PersonaId[];
  badPersonas: PersonaId[];
  /** Wariness % that must be undercut for a red-packet ask to even roll. */
  warinessThreshold: number;
  /** Packet size tier — see constants RED_PACKET_TIERS. */
  generosity: number;
  /** Chat topics he initiates (hooks into scripts + free-roam pool). */
  topics: string[];
  activeHour: number;
  traits: TargetTraitId[];
  /** Programmatic avatar spec (drawn in components/character-art.tsx). */
  portraitSpec: {
    hair: number;       // hairline style index
    hairColor: string;
    glasses: number;
    beard: number;
    cheeks: number;     // fullness 0-1
    shirtColor: string;
  };
}

export type TargetEndingId =
  | 'walked_away'    // 信任跌破后不再回来
  | 'he_knew'        // 他早就知道，只想有人说话
  | 'wants_to_meet'  // 要求线下见面
  | 'gave_and_sick'; // 给了养老钱后生病

export interface TargetState {
  targetId: string;
  /** 0-100. */
  trust: number;
  /** 0-100. */
  wariness: number;
  stage: TargetStage;
  /** Days since she last talked to him. */
  daysSilent: number;
  /** Story-chain id he currently rides; '' when pool-only. */
  pendingChain: string;
  totalReceived: number;
  timesPaid: number;
  /** Days since last successful ask (wallet cooldown). */
  daysSincePaid: number;
  /** Day of his last chat session — one conversation per person per day. */
  lastChatDay: number;
  blocked: boolean;
  /** Set when he stops being reachable forever. */
  ended: TargetEndingId | null;
}

/** Content-complete targets shipped in this build. */
export const ACTIVE_TARGETS: string[] = ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong'];
