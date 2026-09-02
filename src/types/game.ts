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
}

export type GameAction =
  | { type: 'new_game'; name: string; motive: Motive; personaId: PersonaId }
  | { type: 'enter_night' }
  | { type: 'start_chat'; targetId: string }
  | { type: 'pick_option'; optionIndex: number }
  | { type: 'end_chat' }
  | { type: 'sleep' }
  | { type: 'advance_morning' }
  | { type: 'retire' }
  | { type: 'continue_playing' }
  | { type: 'industry_reply'; accept: boolean };
