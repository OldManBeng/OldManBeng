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
  | 'gatha'
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

/** v2.3 朋友圈自拍的 8 种类型（全部成年向生活照）。 */
export type SelfieId = 'cake' | 'gym' | 'pool' | 'cat' | 'grind' | 'travel' | 'boba' | 'sick';
export const SELFIE_IDS: SelfieId[] = ['cake', 'gym', 'pool', 'cat', 'grind', 'travel', 'boba', 'sick'];

/** 女主可编辑的自设资料——头像/年龄/性格，全部影响他的话术。 */
export interface PlayerProfile {
  /** 头像预设 1-6（程序化 SVG 发型×发色组合）。 */
  avatarId: number;
  /** 她自称的年龄（档位 20/24/28/32，全部成年）。 */
  ageClaim: 20 | 24 | 28 | 32;
  /** 性格人设：话术触发 + 轻量机制钩子。 */
  traitId: 'sweet_mouth' | 'cold_queen' | 'straight_shooter' | 'soft_artsy';
  /** 朋友圈最新一张自拍照的类型（v2.3：发朋友圈在朋友圈模块，此处是数据快照）。 */
  selfieId: SelfieId;
  /** 那张照片发布于第几天（新发布才会引来"他来找你"）。 */
  selfieDay: number;
}

/** 朋友圈的一条评论——他能评你，你也能评他。 */
export interface MomentComment {
  by: 'player' | 'target';
  targetId?: string;
  text: string;
}

/** 朋友圈动态（v2.3）。玩家的圈=自拍类型；他的圈=复用 photoId 场景图。 */
export interface MomentPost {
  id: string;
  momentDay: number;
  author: 'player' | 'target';
  /** 作者为老头时的 targetId。 */
  targetId?: string;
  /** 玩家圈：自拍类型（决定配图与老头的反应档位）。 */
  selfieId?: SelfieId;
  /** 老头圈：程序化照片场景 id。 */
  photoId?: string;
  caption: string;
  /** 点赞的人（targetId 列表；玩家的点赞记 'player'）。 */
  likes: string[];
  comments: MomentComment[];
  /** v3.1：最近一次"早晨互动浪潮"扫过这条圈的日子（同一天不重复扫）。 */
  lastWaveDay?: number;
}

/** 钱包流水（每一笔钱的进出都记账）。 */
export interface LedgerEntry {
  day: number;
  amount: number;
  note: string;
  kind: 'bill' | 'packet' | 'gift' | 'course' | 'event' | 'plan' | 'shop';
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
  /** v2.3 朋友圈动态流（最新在后，容量封顶）。 */
  moments: MomentPost[];
  /** v2.3 你还没看过的老头评论/点赞数（朋友圈 tab 红点）。 */
  unseenMoments: number;
  /** v2.3 钱包商店库存（itemId → 数量；一次性道具买了即从可购列表消失）。 */
  inventory: Record<string, number>;
  /** v3.1 待展示的"新的一天"简报（= 那一天的天数；0 = 无）。弹框确认后清零，
   *  内容从当天 log（bill/event/gatha 条目）组装，不在 state 里重复存文案。 */
  briefingDay: number;
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
  | { type: 'update_profile'; avatarId?: number; ageClaim?: PlayerProfile['ageClaim']; traitId?: PlayerProfile['traitId'] }
  /** v2.3 发一条朋友圈自拍（每天最多一条；替代原 update_profile 的 selfieId 通道）。 */
  | { type: 'post_moment'; selfieId: SelfieId }
  /** v2.3 对朋友圈动态点赞/评论（他的圈：+信任；看你自己的圈不算）。 */
  | { type: 'react_moment'; momentId: string; kind: 'like' | 'comment'; text?: string }
  /** v2.3 打开朋友圈模块（清红点）。 */
  | { type: 'view_moments' }
  /** v2.3 钱包商店购买。钱不够/唯一道具已购 → no-op。 */
  | { type: 'buy_item'; itemId: string }
  /** v3.1 关闭"新的一天"简报弹框（纯 UI 确认，无结算）。 */
  | { type: 'dismiss_briefing' };
