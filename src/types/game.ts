import type { TargetState } from './target';
import type { PersonaId } from './persona';
import type { ChatMessage } from './chat';
import type { ComfortState } from './comfort';

/** App-level screens. */
export type GamePhase = 'title' | 'newGame' | 'main' | 'ended';

/** Phases inside one game day (morning bills → night roster → chat session). */
export type DayPhase = 'morning' | 'night' | 'chat';

/** 舒适圈（常用手机）事件——两个手机共用一条时间轴，日志也共账。 */
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
  | 'flag'
  | 'life'
  | 'beat'
  | 'incident'
  | 'comfort';

/** Why she is doing this — sets goal and tone. M1: debt only, others reserved. */
export type Motive = 'debt' | 'family_illness' | 'escape_town';

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
export type SelfieId = 'bestie' | 'gym' | 'pool' | 'cat' | 'grind' | 'travel' | 'boba' | 'sick';
export const SELFIE_IDS: SelfieId[] = ['bestie', 'gym', 'pool', 'cat', 'grind', 'travel', 'boba', 'sick'];

/** v4.3.3 个性签名话术 id——挂在她微信资料页的一句话，老头看得见。 */
export type PlayerBioId =
  | 'hardup_plaintext'   // 直白哭穷
  | 'moon_side'          // 两份工的夜行
  | 'business_face'      // 生意人门面
  | 'daughter_smile'     // 缺个爹的
  | 'chess_and_tea'      // 棋茶中年
  | 'gamer_allnight'     // 网吧通宵
  | 'fish_and_wait'      // 钓鱼佬
  | 'workout_self'       // 晨练自律
  | 'cigarettes_alcohol' // 痞气直给
  | 'cold_read';         // 三不原则

export const PLAYER_BIO_IDS: PlayerBioId[] = [
  'hardup_plaintext', 'moon_side', 'business_face', 'daughter_smile', 'chess_and_tea',
  'gamer_allnight', 'fish_and_wait', 'workout_self', 'cigarettes_alcohol', 'cold_read',
];

/** 女主可编辑的自设资料——头像/年龄/性格/签名，全部影响他的话术。 */
export interface PlayerProfile {
  /** 头像预设 1-10（文生图 PNG，public/avatars/；加载失败回退程序化 SVG）。 */
  avatarId: number;
  /** 她自称的年龄（档位 20/24/28/32，全部成年）。 */
  ageClaim: 20 | 24 | 28 | 32;
  /** 性格人设：话术触发 + 轻量机制钩子。 */
  traitId: 'sweet_mouth' | 'cold_queen' | 'straight_shooter' | 'soft_artsy';
  /** 朋友圈最新一张自拍照的类型（v2.3：发朋友圈在朋友圈模块，此处是数据快照）。 */
  selfieId: SelfieId;
  /** 那张照片发布于第几天（新发布才会引来"他来找你"）。 */
  selfieDay: number;
  /** v4.3.3 个性签名话术——挂在资料页，影响老头主动找你的概率与警惕。 */
  bioId: PlayerBioId;
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
  /** v4.12：照片/自拍变体 1..6——1=基准图，2..6=_v2.._v6。旧存档缺省 → 基准图。 */
  variant?: number;
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
  kind: 'bill' | 'packet' | 'gift' | 'course' | 'event' | 'plan' | 'shop' | 'family';
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
  reason: 'selfie' | 'missed_you' | 'wallet_open' | 'his_life';
  opener: string;
  stamp: string;
  /** v4.4 应答场景键（incoming-replies.ts 的 key）——回他时取哪组上下文应答。 */
  topicId?: string;
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
  /** v4.4 本场是「他先找的你」的一问一答应答会话（收束旁白跟应答组走）。 */
  fromIncoming?: boolean;
  /** v4.4 应答场景键（incoming 的 topicId 快照）——收束旁白跟应答组取。 */
  topicIdOf?: string;
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
  /** v4.1 节奏日：今天的 beat id（'' = 无）+ 是否已决策。决策卡与简报同屏。 */
  pendingBeat: string;
  beatResolved: boolean;
  /** v4.1.2：「今天」名单置顶——把重要的老头钉在最顶（targetId 集合）。
   *  顺序即展示顺序：后钉的排前面（最近操作的人最显眼）。 */
  pinnedTargets: string[];
  /** v4.2 突发事件：今天悬而未决的事件 id（'' = 无）。带选择卡，睡觉落锤。 */
  pendingIncident: string;
  incidentResolved: boolean;
  /** v4.5 观众圈：最近一次发圈被抽中"会刷到"的老头（SELFIE_LINGER_DAYS 窗口内
   *  只有他们会因照片来找你；一人一照只来一次）。换新照片重抽。 */
  selfieAudience: string[];
  /** v4.5 观众圈：最近一次换签名被抽中"会翻资料页"的老头（窗口内只有
   *  他们会顺签名找来；一人一签只来一次）。换新签名重抽。 */
  bioAudience: string[];
  /** v4.5：观众圈是哪天抽的（换签 4 天内有效——过了窗口还没来，
   *  就是没注意到，不再拿"刚换的吧"这句旧话说事）。 */
  bioAudienceDay: number;
  /** 1.1.0 舒适圈：常用手机——小满的另一个世界（妈/男友/活命钱/家庭账）。 */
  comfort: import('./comfort').ComfortState;
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
  | { type: 'update_profile'; avatarId?: number; ageClaim?: PlayerProfile['ageClaim']; traitId?: PlayerProfile['traitId']; bioId?: PlayerBioId }
  /** v2.3 发一条朋友圈自拍（每天最多一条；替代原 update_profile 的 selfieId 通道）。 */
  | { type: 'post_moment'; selfieId: SelfieId }
  /** v2.3 对朋友圈动态点赞/评论（他的圈：+信任；看你自己的圈不算）。 */
  | { type: 'react_moment'; momentId: string; kind: 'like' | 'comment'; text?: string }
  /** v2.3 打开朋友圈模块（清红点）。 */
  | { type: 'view_moments' }
  /** v2.3 钱包商店购买。钱不够/唯一道具已购 → no-op。 */
  | { type: 'buy_item'; itemId: string }
  /** v3.1 关闭"新的一天"简报弹框（纯 UI 确认，无结算）。 */
  | { type: 'dismiss_briefing' }
  /** v4.1 节奏日决策——今天的 beat 选了哪个选项（只能选一次）。 */
  | { type: 'resolve_beat'; optionIndex: number }
  /** v4.1.2 名单置顶——targetId 进/出置顶集合（幂等切换）。 */
  | { type: 'toggle_pin'; targetId: string }
  /** v4.3.3 玩家拉黑老头——一键屏蔽（再点解除）：他不再来扰，你看不见他的圈。 */
  | { type: 'toggle_mute'; targetId: string }
  /** v4.1.2 主动要钱——绕开剧情链直接开口（理由 + 金额自选，代价照付）。 */
  | { type: 'direct_ask'; targetId: string; reasonId: string; amount: number }
  /** v4.2 突发事件决策——今天的事件选了哪个选项（只能选一次，过夜落锤）。 */
  | { type: 'resolve_incident'; optionIndex: number }
  /** v4.11 变更人设——白天随时可换（话术/被动/剧情分岔即刻切换；他不看你后台）。 */
  | { type: 'set_persona'; personaId: PersonaId }
  /** 1.1.0 切换常用手机——工作手机（崩老头）↔ 常用手机（舒适圈）。纯视图切换。 */
  | { type: 'switch_phone' }
  /** 舒适圈：主动找妈/男友聊天（不耗体力）。 */
  | { type: 'comfort_open_chat'; contactId: 'mother' | 'boyfriend' | 'auntie' }
  | { type: 'comfort_open_date_chat'; dateId: string }
  /** 舒适圈：选一个回复（对方回应 + 关系变化）。 */
  | { type: 'comfort_pick'; optionIndex: number }
  /** 舒适圈：结束当前聊天（归档）。 */
  | { type: 'comfort_end_chat' }
  /** 舒适圈：处理事件卡——要/不要（妈生活费、男友红包）、给/不给（男友要钱）。 */
  | { type: 'comfort_resolve_incoming'; incomingId: string; accept: boolean }
  /** 舒适圈：发一条朋友圈（励志/晒家/晒恩爱，每天一条）。 */
  | { type: 'comfort_post_moment'; kind: 'inspire' | 'family' | 'love' }
  /** 舒适圈：给妈/男友的动态点赞/评论（关系+微调）。 */
  | { type: 'comfort_react_moment'; momentId: string; kind: 'like' | 'comment' }
  /** 舒适圈：打开朋友圈模块（清红点）。 */
  | { type: 'comfort_view_moments' };;
