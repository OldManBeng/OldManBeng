import type { TargetState } from './target';
import type { PersonaId } from './persona';
import type { ChatMessage } from './chat';

/** App-level screens. */
export type GamePhase = 'title' | 'newGame' | 'main' | 'ended';

/** Phases inside one game day (morning bills → night roster → chat session). */
export type DayPhase = 'morning' | 'night' | 'chat';

/** Why she is doing this — sets goal and tone. M1: debt only, others reserved. */
export type Motive = 'debt' | 'family_illness' | 'escape_town';

export type EventKind =
  | 'day'
  | 'plan'
  | 'bill'
  | 'event'
  | 'packet'
  | 'ask_fail'
  | 'blocked'
  | 'target_ending'
  | 'ending'
  | 'flag';

export interface EventLogEntry {
  day: number;
  kind: EventKind;
  details: string;
  line?: string;
}

export interface RunStats {
  totalEarned: number;
  redPacketsReceived: number;
  asksMade: number;
  asksFailed: number;
  nightsWorked: number;
  biggestPacket: number;
}

/** 女主可编辑的自设资料——头像/年龄/性格/朋友圈自拍，全部影响他的话术。 */
export interface PlayerProfile {
  /** 头像预设 1-6（程序化 SVG 发型×发色组合）。 */
  avatarId: number;
  /** 她自称的年龄（档位 20/24/28/32，全部成年）。 */
  ageClaim: 20 | 24 | 28 | 32;
  /** 性格人设：话术触发 + 轻量机制钩子。 */
  traitId: 'sweet_mouth' | 'cold_queen' | 'straight_shooter' | 'soft_artsy';
  /** 朋友圈最新一张自拍照的类型。 */
  selfieId: 'cake' | 'gym' | 'pool' | 'cat';
  /** 那张照片发布于第几天（新发布才会引来"他来找你"）。 */
  selfieDay: number;
}

/** 钱包流水（每一笔钱的进出都记账）。 */
export interface LedgerEntry {
  day: number;
  amount: number;
  note: string;
  kind: 'bill' | 'packet' | 'gift' | 'course' | 'event' | 'plan';
}

/** 聊天记录归档——end_chat 时整场对话存档。 */
export interface ChatArchive {
  targetId: string;
  day: number;
  transcript: import('./chat').ChatMessage[];
}

/** 他主动找你（可能因为你发了新自拍、也可能只是想你了）。 */
export interface IncomingChat {
  targetId: string;
  /** 到达日（用于过期）。 */
  day: number;
  reason: 'selfie' | 'missed_you' | 'wallet_open';
  opener: string;
  stamp: string;
}

/** Live chat session state (transcript is the source of truth for the chat UI). */
export interface ActiveChat {
  targetId: string;
  transcript: ChatMessage[];
  /** Options currently on the table (chain node or free node snapshot). */
  pendingOptions: import('./script').ChainOption[];
  /** Chain node id if riding the story chain; '' for free nodes. */
  pendingNodeId: string;
  /** 'player' = awaiting option pick; 'closed' = session winding down. */
  awaiting: 'target' | 'player' | 'closed';
  /** Set when the session auto-ends (ask resolved / blocked / energy out). */
  closingNote: string | null;
}

export interface GameState {
  sessionId: string;
  rngSeed: number;
  day: number;
  daysLimit: number;
  phase: GamePhase;
  dayPhase: DayPhase;
  playerName: string;
  motive: Motive;
  personaId: PersonaId;
  money: number;
  /** Money still needed this month (debt instalment + bills are separate). */
  goal: number;
  energy: number;
  energyMax: number;
  /** 麻木 — cost of performed intimacy, 0-100. */
  numbness: number;
  /** 良心 — 0-100, starts mid, moved by story choices. */
  conscience: number;
  /** 朋友圈穿帮风险 — becomes meaningful with multiple targets (M2). */
  riskLevel: number;
  targets: TargetState[];
  chat: ActiveChat | null;
  log: EventLogEntry[];
  usedOneTimeEvents: string[];
  stats: RunStats;
  endingId: string | null;
  /** Flags for run-level story (industry invite etc.). */
  flags: Record<string, boolean>;
  /** 产业化：姐妹的"课程"是否已购买（代聊群接管日常维护）。 */
  industryCourse: boolean;
  /** 女主自设资料（头像/年龄/性格/朋友圈照片）。 */
  profile: PlayerProfile;
  /** 钱包流水。 */
  ledger: LedgerEntry[];
  /** 聊天记录归档（最新在后，容量封顶）。 */
  archives: ChatArchive[];
  /** 等你回应的"他来找你"列表。 */
  incoming: IncomingChat[];
  /** 今天已选的计划 id（'' = 还没选）。 */
  todayPlan: string;
  /** 今日已累计的麻木（日上限用）。 */
  numbnessToday: number;
}

export type GameAction =
  | { type: 'new_game'; name: string; motive: Motive; personaId: PersonaId }
  | { type: 'enter_night' }
  | { type: 'start_chat'; targetId: string }
  | { type: 'pick_option'; optionIndex: number }
  | { type: 'end_chat' }
  | { type: 'sleep' }
  | { type: 'retire' }
  | { type: 'continue_playing' }
  | { type: 'industry_reply'; accept: boolean }
  | { type: 'choose_plan'; planId: string }
  | { type: 'accept_incoming'; targetId: string }
  | { type: 'ignore_incoming'; targetId: string }
  | { type: 'update_profile'; avatarId?: number; ageClaim?: PlayerProfile['ageClaim']; traitId?: PlayerProfile['traitId']; selfieId?: PlayerProfile['selfieId'] };
