/**
 * Pure-function game engine. dispatch(state, action) → new state.
 * GL2 pattern: engine never touches UI; everything lands in EventLog + chat transcript.
 * M2: multi-target, per-target script registry, 朋友圈穿帮 risk.
 */
import type { GameAction, GameState, EventLogEntry } from '../types/game';
import type { Target, TargetState } from '../types/target';
import type { ChainNode, ChainOption } from '../types/script';
import { PERSONAS } from '../data/personas';
import { TARGETS } from '../data/targets';
import { ACTIVE_TARGETS } from '../types/target';
import { scriptFor } from '../data/script-registry';
import { DAY_EVENTS } from '../data/events';
import { ENDINGS } from '../data/endings';
import { makeRng, pickVariant } from '../utils/random';
import { nightStamp, formatMoney } from '../utils/format';
import {
  clamp, replyMultiplier, applyOptionToTrust, resolveAsk, walletReady, askChance,
} from './chat';
import { DAILY_PLANS } from '../data/plans';
import { ALL_TARGETS, LIBRARY_IDS, libraryTargetById } from '../data/target-library';
import { ARCHETYPE_PACKS } from '../data/archetype-packs';
import {
  MOMENT_CAPTIONS, MOMENT_EFFECT, MOMENT_REACTIONS, MOMENT_SUSPICION, MOMENT_SUSPICION_EFFECT,
  MOMENT_PLAYER_COMMENTS, playerCommentPool, MOMENTS_CAP, targetMomentPosts, hasReacted, SELFIE_REACTIONS,
  MOMENT_REACTIONS_FAR, MOMENT_REACTIONS_CLOSE,
} from '../data/moments';
import { SHOP_ITEMS } from '../data/items';
import { DAILY_GATHAS, TRIGGER_GATHAS } from '../data/gathas';
import {
  LIFE_BY_TARGET, LIFE_DAILY_CAP, ASK_COST_NARRATOR_GENERIC,
  WORLD_BEAT_BY_DAY, interpolateBeat,
} from '../data/life-events';
import { LIBRARY_OPENERS, LIBRARY_INCOMING } from '../data/library-openers';
import { incomingReplyFor } from '../data/incoming-replies';
import { PLAYER_BIOS, PLAYER_BIO_MAP, BIO_HOOK_BY_ARCHETYPE, bioPhase } from '../data/player-bios';
import { PLAYER_BIO_IDS } from '../types/game';
import {
  packetTierOf, PACKET_SOURCE_SUBTITLE, PACKET_SOURCE_GENERIC,
  ASK_COST_NARRATOR_V2, GIFT_NARRATOR, GIFT_NARRATOR_GENERIC,
  MONEY_HOME_TAGS, MONEY_HOME_GENERIC_TAG,
} from '../data/cost-narratives';
import {
  START_MONEY, MONTHLY_GOAL, DAYS_LIMIT, ENERGY_MAX, CHAT_SESSION_COST,
  TRUST_DECAY_PER_DAY, WARINESS_DECAY_PER_DAY, SILENT_TRUST_PENALTY,
  CLINGY_SILENT_MULTIPLIER, ASK_SUCCESS_WARINESS, ASK_FAIL_WARINESS,
  STAGE_TRUST, BILLS, NUMBNESS_PER_FLIRT, ASK_MIN_STAGE,
  RISK_PER_ACTIVE_RELATION, RISK_DECAY_PER_DAY, RISK_EVENT_CHANCE,
  RISK_EXPOSE_WARINESS, MORNING_HOUR_MAX,
  INDUSTRY_COURSE_COST, INDUSTRY_MAINTAIN_TRUST, INDUSTRY_RISK_PER_DAY,
  INDUSTRY_NUMBNESS_PER_DAY, VERDICT_ASK_THRESHOLD,
  TRAIT_ARCHETYPE_AFFINITY, AGE_NEED_AFFINITY, INCOMING_BASE_CHANCE,
  INCOMING_DAILY_CAP, SELFIE_LINGER_DAYS, ARCHIVE_CAP, NUMBNESS_DAILY_CAP, NUMBNESS_REST_RECOVERY,
  SELFIE_AUDIENCE_MAX, BIO_AUDIENCE_MAX, BIO_HOOK_WINDOW_DAYS,
  PERSONA_NEED_MATCH, PERSONA_SESSION_TRUST, PERSONA_SESSION_WARINESS,
  RECALL_CHANCE, GREETING_CLOSE_TRUST, GREETING_FAR_TRUST, PERSONA_GREET_TRUST,
  ENERGY_EARLY_DAYS, ENERGY_EARLY_FACTOR,
  CHAIN_INTERLUDE_CHANCE,
  DIRECT_ASK_CHANCE_MULT, DIRECT_ASK_FAIL_WARINESS, DIRECT_ASK_SUCCESS_WARINESS, DIRECT_ASK_AMOUNT_WARINESS_DIV,
  INCIDENT_CHANCE, INCIDENT_FIRST_DAY,
} from '../data/constants';
import {
  DIRECT_ASK_AMOUNTS, DIRECT_ASK_REASONS,
  DIRECT_ASK_OFFENDED, DIRECT_ASK_COOLDOWN, DIRECT_ASK_FAIL_CHAT, DIRECT_ASK_SUCCESS_CHAT,
  DIRECT_ASK_FOLLOWUP_SUCCESS, DIRECT_ASK_FOLLOWUP_FAIL,
} from '../data/direct-ask';
import { INCIDENTS, incidentsAvailable } from '../data/incidents';
import type { IncidentDef, IncidentOption } from '../data/incidents';
import { freshComfortState } from '../data/comfort';
import { SWITCH_TO_COMFORT, SWITCH_TO_WORK } from '../data/comfort-contrast';
import {
  runComfortMorning, resolveComfortIncoming, openComfortChat, pickComfortOption, endComfortChat,
  postComfortMoment, reactComfortMoment,
} from './comfort';

export const TARGET_MAP: Record<string, Target> = Object.fromEntries(TARGETS.map((t) => [t.id, t]));
/** v2.0：含老头库的全量映射。 */
export const ALL_TARGET_MAP: Record<string, Target> = Object.fromEntries(ALL_TARGETS.map((t) => [t.id, t]));
/** v4.4 主五人 incoming 应答组前缀（incoming-replies.ts 的 key 命名）。 */
const MAIN_INCOMING_PREFIXES: Record<string, string> = {
  lao_li: 'li',
  zhou_teacher: 'zhou',
  boss_wang: 'wang',
  hao_ge: 'hao',
  chen_gong: 'chen',
};
export const PERSONA_MAP = Object.fromEntries(PERSONAS.map((p) => [p.id, p]));

function log(state: GameState, kind: EventLogEntry['kind'], details: string, line?: string) {
  state.log.push({ day: state.day, kind, details, line });
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** 一次性 RNG（动作内判定用）。 */
function rng01(s: GameState) {
  const rng = makeRng(s.rngSeed);
  s.rngSeed = (s.rngSeed * 1664525 + 1013904223) >>> 0;
  return rng;
}

type ChatMsg = import('../types/chat').ChatMessage;

/** 原型中文名（日志用）。 */
function archetypeCN(a: string): string {
  const m: Record<string, string> = {
    divorced_driver: '出租车司机', widowed_teacher: '退休教师', married_boss: '个体老板',
    cafe_owner_ninety: '网吧老板', lonely_engineer: '工程师', night_guard: '小区保安', designated_driver: '代驾师傅',
    fisherman: '钓友', chess_uncle: '棋友', square_dancer: '广场舞大爷',
  };
  return m[a] ?? a;
}

function freshTargetState(targetId: string): TargetState {
  return {
    targetId,
    trust: 0,
    wariness: 10,
    stage: 'stranger',
    daysSilent: 0,
    pendingChain: '',
    totalReceived: 0,
    timesPaid: 0,
    daysSincePaid: 0,
    lastChatDay: 0,
    discoveredDay: 0,
    pingedToday: false,
    recentPacks: [],
    recentGreetingIdx: -1, // v2.1：上一条的 greeting 下标——连聊两晚不再同一句开场白
    recentPhotoIdx: -1, // v2.2：上一场他发过的照片下标
    blocked: false,
    ended: null,
  };
}

/** v2.0：女主默认自设资料。v4.3.3 默认签名=直白哭穷（新手最容易理解的一条）。 */
export function defaultProfile(): GameState['profile'] {
  return { avatarId: 1, ageClaim: 24, traitId: 'sweet_mouth', selfieId: 'bestie', selfieDay: 0, bioId: 'hardup_plaintext' };
}

/** v2.0：钱包流水工具——每一笔钱都记账。 */
function ledgerAdd(s: GameState, amount: number, note: string, kind: import('../types/game').LedgerEntry['kind']) {
  s.ledger.push({ day: s.day, amount, note, kind });
}

/** v2.0：亲和结算——每场对话开场套一次（profile 性格/年龄 × 老头原型/缺口）。 */
function applyAffinity(s: GameState, t: TargetState, def: Target) {
  const trait = s.profile.traitId;
  const aff = TRAIT_ARCHETYPE_AFFINITY[trait]?.[def.archetype];
  if (aff) {
    t.trust = clamp(t.trust + aff.trust, 0, 100);
    t.wariness = clamp(t.wariness + aff.wariness, 0, 100);
  }
  const ageAff = AGE_NEED_AFFINITY[String(s.profile.ageClaim)]?.[def.need];
  if (ageAff) t.trust = clamp(t.trust + ageAff, 0, 100);
  // v3.0：人设×情感缺口 场次被动——命中的人设越聊越顺（+1 信任），
  // 冲突的人设他觉得不对劲（+1 警惕）。选错人设是有手感的。
  const needMatch = PERSONA_NEED_MATCH[s.personaId]?.[def.need] ?? 1;
  if (needMatch >= 2) t.trust = clamp(t.trust + PERSONA_SESSION_TRUST, 0, 100);
  else if (needMatch <= 0.3) t.wariness = clamp(t.wariness + PERSONA_SESSION_WARINESS, 0, 100);
  // v2.3：商店道具的对话加成——廉价首饰（持续）/地摊口红（下一场，用完即止）。
  if ((s.inventory.jewelry ?? 0) > 0) t.trust = clamp(t.trust + 1, 0, 100);
  if ((s.inventory.lipstick ?? 0) > 0) {
    t.trust = clamp(t.trust + 4, 0, 100);
    s.inventory.lipstick = (s.inventory.lipstick ?? 0) - 1;
    if (s.inventory.lipstick <= 0) delete s.inventory.lipstick;
  }
}

/** v2.3：一场对话的精力消耗——充电宝（本局持有）4 → 3。 */
function chatCost(s: GameState): number {
  return (s.inventory.powerbank ?? 0) > 0 ? CHAT_SESSION_COST - 1 : CHAT_SESSION_COST;
}

/** v2.0：话术里的 {selfie}/{age}/{trait} 占位符——他的台词会念到你的资料。
 *  v4.2.1 修复（S2）：标签只存纯名词——"那张/这只"由话术模板自己带。
 *  旧标签自带前缀，"你那张{selfie}"会拼出"你那张那张闺蜜照"这类叠字病句。 */
export const SELFIE_LABEL: Record<string, string> = {
  bestie: '闺蜜照', gym: '夜跑照', pool: '泳池照', cat: '橘猫照',
  grind: '加班照', travel: '旅游照', boba: '奶茶照', sick: '输液照',
};
export const TRAIT_LABEL: Record<string, string> = {
  sweet_mouth: '嘴甜', cold_queen: '清冷', straight_shooter: '直性子', soft_artsy: '文艺',
};
function fillProfileVars(text: string, s: GameState): string {
  return text
    .replace(/\{selfie\}/g, SELFIE_LABEL[s.profile.selfieId] ?? '你朋友圈那张照片')
    .replace(/\{age\}/g, String(s.profile.ageClaim))
    .replace(/\{trait\}/g, TRAIT_LABEL[s.profile.traitId] ?? '你');
}

/** v3.3 话风卡合规：
 *  1. 一条数据可含 ｜ 连发分隔——拆成多条气泡（一个气泡一行）；
 *  2. 剥掉条内旧式时间戳前缀（23:47）——引擎给每条气泡盖真实时间戳，条内戳既冗余又矛盾；
 *  3. 空段不产出。
 *  v4.2.1（S1）："（你…"开头的段是**她的**内心旁白，不是他的消息——
 *  以 narrator 身份入档，不再借他的气泡发出去（他不能"说出"只有她知道的事）。 */
function pushBubbles(transcript: ChatMsg[], speaker: ChatMsg['speaker'], raw: string, stamp: string): number {
  const clean = raw.replace(/^（\d{1,2}:\d{2}）\s*/, '');
  let n = 0;
  for (const seg of clean.split('｜')) {
    const t = seg.trim();
    if (!t) continue;
    // 旁白段：整段被（…）包住的都是叙事层（她的内心独白 / 场景交代），
    // 不是他说出的话——借他的气泡发出会穿帮（v4.13.3 收编库话术的旁白债）。
    const wholeParens = /^（[^（）]*）$/.test(t) && !t.includes('[图片') && !t.includes('[语音');
    const who = speaker === 'target' && (t.startsWith('（你') || wholeParens) ? 'narrator' as const : speaker;
    transcript.push({ speaker: who, text: t, stamp });
    n += 1;
  }
  return n;
}

/** v4.5 派生 RNG：观众圈抽样用的独立随机流——不消耗主种子流
 *  （种子确定性测试对 runMorning 的逐掷断言很敏感，门面抽样不能插队）。 */
function derivedRng(seed: number): ReturnType<typeof makeRng> {
  // 混一天的日子数进种子：同一天里换两次门面，抽的人不一样。
  return makeRng((Math.imul(seed ^ 0x85ebca6b, 0x27d4eb2d) ^ (seed >>> 15)) >>> 0);
}

/** v4.5 观众圈：发圈/换签名时抽"会注意到的人"。不是全员点名——
 *  回一条要花精力，每次换门面只惊动一部分人（回应玩家的精力诉求）。
 *  加权不缺席：需求对口（照片是给他的缺口发的/签名是他的原型顺眼的）
 *  权重高，但谁都有机会被抽中——抽中的是"缘分"，不是"名单"。 */
function sampleAudience(s: GameState, size: number, kind: 'selfie' | 'bio'): string[] {
  const eligible = s.targets.filter(
    (t) => !t.blocked && !t.ended && !t.mutedByPlayer && !!t.discoveredDay,
  );
  if (!eligible.length) return [];
  const rng = derivedRng(s.rngSeed + s.day * 7919 + (kind === 'selfie' ? 13 : 57));
  // 权重：需求对口 ×3（照片/签名击中他的情感缺口）；信任打底 ×（1+trust/100）；
  //  断联的人更会来翻你的门面（憋不住了）×（1+daysSilent/6）。
  const weightFor = (t: TargetState): number => {
    const def = ALL_TARGET_MAP[t.targetId];
    if (!def) return 0;
    let w = 1 + t.trust / 100;
    if (kind === 'selfie' && (def.need === 'daughter_figure' || def.need === 'desired')) w *= 3;
    if (kind === 'bio' && bioPhase(s.profile.bioId, def.archetype) > 0) w *= 3;
    if (kind === 'bio' && bioPhase(s.profile.bioId, def.archetype) < 0) w *= 0.4; // 犯嘀咕的人少来翻
    w *= 1 + Math.min(t.daysSilent, 6) / 6;
    return Math.max(0.05, w);
  };
  const pool = eligible.slice();
  const picked: string[] = [];
  while (picked.length < size && pool.length) {
    const weights = pool.map((t) => weightFor(t));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rng.next() * total;
    let hit = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { hit = i; break; }
    }
    picked.push(pool[hit].targetId);
    pool.splice(hit, 1);
  }
  return picked;
}

/** v2.1：选话术组——去重窗口随库扩容：池子越大，近期不再重复的套数越多。
 *  10 套（旧库）窗口 3；60 套（主五人 v2.1）窗口 10——玩家连续 10 晚不见同一套话术。 */
function recentPackWindow(packs: import('../types/script').ChatPack[]): number {
  return Math.max(3, Math.min(10, Math.floor(packs.length / 4)));
}

/** v2.1：台词池去重抽取——避开上一次选中的下标，连聊两晚不再同一句开场白。
 *  池只有 1 条时直接返回那条（不更新下标）。池为空时回退 fallback。 */
function pickVaryLine(rng: ReturnType<typeof makeRng>, pool: string[] | undefined, fallback: string, lastIdx: { val: number }): string {
  if (!pool || pool.length === 0) return fallback;
  if (pool.length === 1) return pool[0];
  let idx = rng.int(0, pool.length - 1);
  if (idx === lastIdx.val) idx = (idx + 1) % pool.length;
  lastIdx.val = idx;
  return pool[idx];
}

/** v3.0：跨场开场白去重——记最近 3 条原文，同一句晚安三天内不重样。
 *  全撞了就放宽（从全池重挑），保证总有得说。 */
function pickFreshLine(rng: ReturnType<typeof makeRng>, pool: string[] | undefined, fallback: string, recent: string[]): string {
  if (!pool || pool.length === 0) return fallback;
  const fresh = pool.filter((l) => !recent.includes(l));
  const candidates = fresh.length ? fresh : pool;
  const line = candidates[rng.int(0, candidates.length - 1)];
  recent.push(line);
  if (recent.length > 3) recent.splice(0, recent.length - 3);
  return line;
}

/** v3.0：同一句话在人设嘴里的不同说法——命中当前人设时替换原文（缺省回落）。 */
function personaTextFor(option: ChainOption, personaId: string): string {
  if (!option.personaText) return option.text;
  return option.personaText[personaId as PersonaIdKey] ?? option.personaText.default ?? option.text;
}

/** v2.2：他要给你看样东西——约 35% 的场次他会发一张照片（自己的世界）。
 *  孤独的人发照片不是炫，是"你看，我的生活还在动"。
 *  照片去重：上一场发过的不再发。 */
function maybePushPhoto(t: TargetState, rng: ReturnType<typeof makeRng>, transcript: ChatMsg[], activeHour: number): void {
  const photos = scriptFor(t.targetId).photos;
  if (!photos || photos.length === 0) return;
  if (!rng.chance(0.35)) return;
  // 上一场发过哪张——从 TargetState 挂 recentPhotoIdx（不持久化，场内状态足够）。
  const last = t.recentPhotoIdx ?? -1;
  let idx = rng.int(0, photos.length - 1);
  if (idx === last && photos.length > 1) idx = (idx + 1) % photos.length;
  t.recentPhotoIdx = idx;
  const pid = photos[idx];
  transcript.push({
    speaker: 'target' as const,
    photoId: pid,
    // v4.12：变体由纯哈希派生（不消耗 RNG）——key 用会话内唯一序号（与 stamp 的 4+len 一致）。
    variant: pickVariant(`${pid}#${activeHour}-${4 + transcript.length}`),
    text: '[图片]',
    stamp: nightStamp(activeHour, 4 + transcript.length),
  });
}

/** v2.0：选话术组——近 N 套用过的去重，避免"每次都是同一套话术"。 */
function pickPack(s: GameState, t: TargetState, def: Target): import('../types/script').ChatPack | null {
  const packs = scriptFor(t.targetId).packs ?? (def.archetype in ARCHETYPE_PACKS ? ARCHETYPE_PACKS[def.archetype] : undefined);
  if (!packs || packs.length === 0) return null;
  const pool = packs.filter((p) => !t.recentPacks.includes(p.id));
  const usable = pool.length ? pool : packs;
  const rng = makeRng(s.rngSeed);
  s.rngSeed = (s.rngSeed * 1664525 + 1013904223) >>> 0;
  const totalW = usable.reduce((sum, p) => sum + (p.weight ?? 1), 0);
  let roll = rng.next() * totalW;
  let chosen = usable[0];
  for (const p of usable) { roll -= (p.weight ?? 1); if (roll <= 0) { chosen = p; break; } }
  const window = recentPackWindow(packs);
  t.recentPacks = [...t.recentPacks, chosen.id].slice(-window);
  // v3.0：记下今晚的话题标签——下一晚的开场可能"接昨天的话"。
  t.lastTopic = chosen.topic;
  return chosen;
}

/** Stage from trust, monotonic upward (never demote on decay alone). */
function advanceStage(t: TargetState) {
  const order: TargetState['stage'][] = ['stranger', 'warming', 'trusted', 'harvest', 'burned'];
  let target: TargetState['stage'] = t.stage;
  if (t.trust >= STAGE_TRUST.harvest && order.indexOf(t.stage) < 3) target = 'harvest';
  else if (t.trust >= STAGE_TRUST.trusted && order.indexOf(t.stage) < 2) target = 'trusted';
  else if (t.trust >= STAGE_TRUST.warming && order.indexOf(t.stage) < 1) target = 'warming';
  t.stage = target;
}

function stageOrder(s: TargetState['stage']): number {
  return ['stranger', 'warming', 'trusted', 'harvest', 'burned'].indexOf(s);
}

function linesFor(option: ChainOption, personaId: string): string[] {
  const r = option.replies;
  if (!r) return [];
  if (Array.isArray(r)) return r;
  return r[personaId as PersonaIdKey] ?? r.default ?? [];
}

type PersonaIdKey = import('../types/persona').PersonaId;

function pickChainNode(state: GameState, t: Target, tstate: TargetState): ChainNode | null {
  const chain = scriptFor(t.id).chain;
  // 1. explicit pending chain node
  if (tstate.pendingChain) {
    const node = chain[tstate.pendingChain];
    if (node) return node;
    tstate.pendingChain = '';
  }
  // 2. first eligible chain node not yet consumed (in order)
  //    v3.0：onlyPersona 门控——人设不对的节点直接跳过，剧情分岔由人设驱动。
  for (const node of Object.values(chain)) {
    if (state.flags[`chain_${node.id}`]) continue;
    if (node.onlyPersona && !node.onlyPersona.includes(state.personaId)) continue;
    const trustOk = (node.minTrust ?? 0) <= tstate.trust;
    const stageOk = !node.minStage || stageOrder(tstate.stage) >= stageOrder(node.minStage);
    if (trustOk && stageOk) return node;
  }
  return null;
}

function pickFreeNode(state: GameState, t: Target, tstate: TargetState) {
  const rng = makeRng(state.rngSeed);
  state.rngSeed = (state.rngSeed * 1664525 + 1013904223) >>> 0;
  const pool = scriptFor(t.id).free.filter((n) => (n.minTrust ?? 0) <= tstate.trust);
  return pool.length ? rng.pick(pool) : null;
}

/** v4.1.2：链夜随机穿插——今晚推不推剧情由种子决定（30% 改聊闲聊组）。
 *  剧情弧保序不乱（节点原地保留到下一晚），随机的是节奏：重开后
 *  前几晚的剧情/闲聊交错不再逐字相同。首晚不穿插（见常量注释）。
 *  消耗 RNG：无（seed mod 10 做确定性分派——不同种子给不同节奏，
 *  同一存档同一天重放结果一致，且不挤占话术池的随机流）。 */
function chainInterludeTonight(state: GameState, tstate: TargetState, chainNode: ChainNode | null): boolean {
  if (!chainNode) return false;
  // 本局第一次走到剧情链（一个节点都没消费过）——首晚保稳，不穿插。
  const consumed = Object.keys(scriptFor(tstate.targetId).chain).filter((id) => state.flags[`chain_${id}`]).length;
  if (consumed === 0) return false;
  return state.rngSeed % 10 < Math.round(CHAIN_INTERLUDE_CHANCE * 10);
}

/** Morning-online targets: 06:00–12:00. Late-night targets (activeHour < 6)
 *  count as night — an hour of 1:00 must never land in the morning roster. */
export function isMorningTarget(def: Target): boolean {
  return def.activeHour >= 6 && def.activeHour <= MORNING_HOUR_MAX;
}

/** A target is reachable during the current dayPhase by his active hour. */
export function targetAwake(def: Target, dayPhase: GameState['dayPhase']): boolean {
  // v4.2 修：夜晚窗口放宽到 ≥14 点——棋摊（15-17）/广场舞（18-19）本来就是
  // 傍晚开始的场景，数据是对的，窗口没接住。原先 ≥20 让这批库人物永远"睡下了"。
  if (dayPhase === 'night' || dayPhase === 'chat') return def.activeHour >= 14 || def.activeHour < 6;
  // morning: 上午在线的老头（activeHour 6-12）
  return isMorningTarget(def);
}

// ---------------------------------------------------------------------------

export function createInitialState(): GameState {
  return {
    sessionId: `run_${Date.now().toString(36)}`,
    rngSeed: (Date.now() ^ 0x9e3779b9) >>> 0,
    day: 1,
    daysLimit: DAYS_LIMIT,
    phase: 'title',
    dayPhase: 'morning',
    playerName: '',
    motive: 'debt',
    personaId: 'wise_sister',
    money: START_MONEY,
    goal: MONTHLY_GOAL,
    energy: ENERGY_MAX,
    energyMax: ENERGY_MAX,
    numbness: 0,
    conscience: 50,
    riskLevel: 0,
    targets: ALL_TARGETS.map((t) => freshTargetState(t.id)),
    chat: null,
    log: [],
    usedOneTimeEvents: [],
    stats: { totalEarned: 0, redPacketsReceived: 0, asksMade: 0, asksFailed: 0, nightsWorked: 0, biggestPacket: 0 },
    endingId: null,
    flags: {},
    industryCourse: false,
    profile: defaultProfile(),
    ledger: [],
    archives: [],
    incoming: [],
    todayPlan: '',
    numbnessToday: 0,
    moments: [],
    unseenMoments: 0,
    inventory: {},
    briefingDay: 0,
    pendingBeat: '',
    beatResolved: false,
    pinnedTargets: [],
    pendingIncident: '',
    incidentResolved: false,
    selfieAudience: [],
    bioAudience: [],
    bioAudienceDay: 0,
    comfort: freshComfortState(),
  };
}

/** v3.1：一次朋友圈互动——起疑的留刺话；正常的六成点赞（沉默的大多数）、
 *  四成留评论，评论 45% 用照片专属话术（他评的是这张照片本身）。
 *  suspicious=false 的即时反应（刚发圈时）不记日志，只亮红点。 */
function applyMomentReaction(
  state: GameState,
  rng: ReturnType<typeof makeRng>,
  post: import('../types/game').MomentPost,
  t: TargetState,
  def: Target,
  suspicious: boolean,
): void {
  if (suspicious) {
    t.trust = clamp(t.trust + MOMENT_SUSPICION_EFFECT.trust, 0, 100);
    t.wariness = clamp(t.wariness + MOMENT_SUSPICION_EFFECT.wariness, 0, 100);
    post.comments.push({
      by: 'target', targetId: t.targetId,
      text: rng.pick(MOMENT_SUSPICION),
    });
    log(state, 'flag', `${def.name} 在你的朋友圈里翻了半天，留了句不太客气的话。`);
  } else {
    const eff = MOMENT_EFFECT[def.need] ?? { trust: 1, wariness: 0 };
    t.trust = clamp(t.trust + eff.trust, 0, 100);
    t.wariness = clamp(t.wariness + eff.wariness, 0, 100);
    advanceStage(t);
    if (rng.chance(0.6)) {
      post.likes.push(t.targetId);
    } else {
      // v3.2 距离分层：刚认识的人评论客气克制（远池），熟了才说得出知心话（近池）；
      // 照片专属评论也只在有些交情之后——不合逻辑的亲昵一句话都不说。
      const far = t.trust < 25;
      const near = t.trust >= 60;
      const selfieLines = !far && post.selfieId ? SELFIE_REACTIONS[post.selfieId] : undefined;
      let text: string;
      if (near && rng.chance(0.5)) text = rng.pick(MOMENT_REACTIONS_CLOSE[def.need] ?? MOMENT_REACTIONS[def.need] ?? ['（他点了赞。）']);
      else if (!far && selfieLines?.length && rng.chance(0.45)) text = rng.pick(selfieLines);
      else text = rng.pick((far ? MOMENT_REACTIONS_FAR[def.need] : undefined) ?? MOMENT_REACTIONS[def.need] ?? ['（他点了赞。）']);
      post.comments.push({ by: 'target', targetId: t.targetId, text });
    }
  }
  state.unseenMoments += 1;
}

/** Morning: roll event + bills + decay + risk. Called on each new day. */
function runMorning(state: GameState) {
  const rng = makeRng(state.rngSeed);
  state.rngSeed = (state.rngSeed * 1664525 + 1013904223) >>> 0;
  const d1 = rng.int(1, 6);
  const d2 = rng.int(1, 6);
  const roll = d1 + d2;
  const ev = DAY_EVENTS.find(
    (e) => roll >= e.diceRange.min && roll <= e.diceRange.max && !(e.oneTime && state.usedOneTimeEvents.includes(e.id)),
  );
  let eventLine = '无事发生的一天。';
  if (ev) {
    if (ev.oneTime) state.usedOneTimeEvents.push(ev.id);
    for (const eff of ev.effects) {
      if (eff.kind === 'money') {
        state.money += eff.amount;
        state.ledger.push({ day: state.day, amount: eff.amount, note: ev.name, kind: 'event' });
      }
      if (eff.kind === 'wariness') {
        // 无 targetId = 全员生效；否则只影响指定关系。
        const hit = 'targetId' in eff && eff.targetId ? [state.targets.find((t) => t.targetId === eff.targetId)] : state.targets;
        for (const t of hit) if (t) t.wariness = clamp(t.wariness + eff.amount, 0, 100);
      }
      if (eff.kind === 'trust') {
        const hit = 'targetId' in eff && eff.targetId ? [state.targets.find((t) => t.targetId === eff.targetId)] : state.targets;
        for (const t of hit) if (t) t.trust = clamp(t.trust + eff.amount, 0, 100);
      }
      if (eff.kind === 'conscience') state.conscience = clamp(state.conscience + eff.amount, 0, 100);
      // 'mood'：纯风味标记，无数值效果——留着供事件文案引用。
      if (eff.kind === 'flag') state.flags[eff.flag] = true;
    }
    eventLine = `${ev.name}——${ev.description}`;
  }
  log(state, 'event', eventLine);

  // Bills every day (rent pro-rated: keep simple — daily slice of monthly total).
  // v4.13.3：同一精度记账——取整后同一笔只进一次余额与流水（此前余额扣小数、
  // 流水记整数，30 天下来账面对不上 ~10 元）。
  const dailyBills = Math.round(BILLS.reduce((s, b) => s + b.amount, 0) / 30);
  state.money -= dailyBills;
  state.ledger.push({ day: state.day, amount: -dailyBills, note: '房租/话费/会员/伙食（日摊）', kind: 'bill' });
  log(state, 'bill', `今日开销 ${dailyBills} 元（房租/话费/会员/伙食摊到每天）`);

  // v2.4 晨钟月轮：每天早上敲一条偈。三十天一轮按五幕递进（因缘→贪欲→痴面具→业渐盈→归悟），
  // day 31+ 取模回卷——字面意义上的轮回。不消耗 RNG（保护种子确定性测试），
  // 释义走 line 字段，复用 .log-line 渲染。
  {
    const g = DAILY_GATHAS[(state.day - 1) % DAILY_GATHAS.length];
    log(state, 'gatha', `${g.verse}——${g.source}`, g.gloss);
  }

  // Trust/wariness drift + silent penalty + spontaneous gifts.
  for (const t of state.targets) {
    // v2.0：全量名单（库里 50 人也在 drift 循环里，但未认识的不吃断联惩罚）。
    const def = ALL_TARGET_MAP[t.targetId];
      const lines = scriptFor(t.targetId).lines;
      // 昨天聊过就不算断联（runMorning 在每日开始时跑，day 已 +1）。
      // v2.0：只有"认识过"的老头才吃断联惩罚——库里没解锁的人不欠你。
      const silentYesterday = !t.blocked && !!t.discoveredDay && t.lastChatDay !== state.day - 1 && t.lastChatDay !== state.day;
      let decay = TRUST_DECAY_PER_DAY;
      if (t.lastChatDay > 0 && silentYesterday) {
        decay += def?.traits.includes('clingy') ? SILENT_TRUST_PENALTY * CLINGY_SILENT_MULTIPLIER : SILENT_TRUST_PENALTY;
      }
      if (t.discoveredDay) t.trust = clamp(t.trust - decay, 0, 100);
      t.wariness = clamp(t.wariness - WARINESS_DECAY_PER_DAY, 0, 100);
    t.daysSincePaid = Math.min(99, t.daysSincePaid + 1);
    // 断联天数：拉黑的不算（结束了）；没被聊过的才积累。
    if (!t.blocked) t.daysSilent = silentYesterday ? Math.min(99, t.daysSilent + 1) : 0;
    if (t.blocked) continue;
      // He sometimes gives without being asked — the money that costs the most.
      if (!t.ended && t.trust >= 60 && t.stage !== 'stranger' && rng.chance(0.08)) {
        let gift = rng.int(100, 200);
        if (def?.traits.includes('generous')) gift = Math.round(gift * 1.4);
        t.totalReceived += gift;
        t.timesPaid += 1;
        t.daysSincePaid = 0;
        state.money += gift;
        state.stats.totalEarned += gift;
        state.stats.redPacketsReceived += 1;
        state.stats.biggestPacket = Math.max(state.stats.biggestPacket, gift);
        state.ledger.push({ day: state.day, amount: gift, note: `${def?.name ?? '他'} 主动转的（没人开口要过）`, kind: 'gift' });
        // v4.1 主动转账旁白：没人开口要过的钱，是最贵的——他的日子当时是什么时候。
        const giftPool = (def && GIFT_NARRATOR[def.id]) || GIFT_NARRATOR_GENERIC;
        log(state, 'packet', `早上醒来，${def?.name ?? '他'} 转了你 ${gift} 元。没有人开口要过这笔钱。`, giftPool[state.day % giftPool.length]);
      }
    // Terminal endings by story drift.
    if (t.trust <= 0 && t.stage !== 'stranger' && !t.ended) {
      t.ended = 'walked_away';
      t.blocked = true;
      log(state, 'target_ending', `${def?.name ?? t.targetId} 没有再回复过你。`, pickVaryLine(rng, lines.blocked, '（头像灰了。）', { val: -1 }));
    }
  }

  // 朋友圈穿帮风险：多线经营本身就是风险。每晚活跃关系越多，越容易被互相看见。
  // v2.0：只数"认识过"的活跃关系——库目标没加微信就不可能撞见彼此。
  const activeRels = state.targets.filter((t) => !t.blocked && !!t.discoveredDay && t.trust >= STAGE_TRUST.warming).length;
    if (activeRels >= 2) {
    state.riskLevel = clamp(state.riskLevel + RISK_PER_ACTIVE_RELATION * (activeRels - 1), 0, 100);
    if (state.riskLevel >= 40 && rng.chance(RISK_EVENT_CHANCE)) {
      // 穿帮事件：随机一个关系遭殃，全体警惕上升。
      const victims = state.targets.filter((t) => !t.blocked && !!t.discoveredDay && t.trust >= STAGE_TRUST.warming);
      const victim = victims.length ? rng.pick(victims) : null;
      if (victim) {
        const vdef = ALL_TARGET_MAP[victim.targetId];
        const vlines = scriptFor(victim.targetId).lines;
        victim.wariness = clamp(victim.wariness + RISK_EXPOSE_WARINESS, 0, 100);
        for (const other of state.targets) {
          if (!other.blocked) other.wariness = clamp(other.wariness + 6, 0, 100);
        }
        state.riskLevel = clamp(state.riskLevel - 25, 0, 100);
        log(state, 'flag', `穿帮了。${vdef?.name ?? '有个老头'} 在你的评论区看到了另一个人的留言——两个"哥哥"的世界，撞在一起。`, pickVaryLine(rng, vlines.wariness_high, '（他最近的回复，越来越短。）', { val: -1 }));
        // v2.4：穿帮是因果账本翻开的那一页——紧跟着敲一偈。
        {
          const g = TRIGGER_GATHAS.risk_exposed;
          log(state, 'gatha', `${g.verse}——${g.source}`, g.gloss);
        }
        if (victim.wariness >= 85) {
          victim.blocked = true;
          victim.ended = 'walked_away';
          log(state, 'blocked', `${vdef?.name} 把你删了。干净利落。`);
        }
        // 全员被穿帮拉黑 → 评论区结局。
        const aliveAfter = state.targets.filter((t) => !t.blocked && !!t.discoveredDay);
        if (aliveAfter.length === 0) {
          state.flags.risk_exposed_all = true;
        }
      }
    }
  } else {
    state.riskLevel = clamp(state.riskLevel - RISK_DECAY_PER_DAY, 0, 100);
  }

  // v2.0：他主动找你——新自拍 3 天内最猛，信任高的、断联的都会来。
  // incoming：两晚没回应，他就不再等你了。过期清理。满了还硬挤进来的人，把最早那条顶掉——
  // 等待列表总长 ≤ INCOMING_DAILY_CAP（别攒成轰炸队列）。
  // v4.5 观众圈：自拍/签名加成只作用于被抽中的"注意到的人"（sampleAudience，
  //  在 post_moment/update_profile 时抽好）。没被抽中的：门面是发给别人看的。
  //  且一照一签各只来一次（t.selfiePingedOn/t.bioPingedOn 记的是当时门面的日子，
  //  换新照片/新签名重抽重置——新门面值得再来一句）。
  state.incoming = state.incoming.filter((m) => state.day - m.day <= 1);
  while (state.incoming.length > INCOMING_DAILY_CAP) state.incoming.shift();
  let madeToday = 0;
  const selfieFresh = state.day - state.profile.selfieDay <= SELFIE_LINGER_DAYS && state.profile.selfieDay > 0;
  for (const t of state.targets) {
    t.pingedToday = false;
    if (t.blocked || t.ended || !t.discoveredDay || t.mutedByPlayer) continue;
    const def = ALL_TARGET_MAP[t.targetId];
    if (!def) continue;
    if (state.incoming.length >= INCOMING_DAILY_CAP) break;
    let p = 0.08; // 想你了的基础
    // v4.5：自拍加成只给观众圈里的人——且一人一照只来一次：
    // 他说过这张照片之后，加成跟着熄火（照片进过心里了，不用天天挂着）。
    // 拉黑/结局的人不在此列（他们进不了观众圈，进了也走不到这一行）。
    const inSelfieAudience = selfieFresh && state.selfieAudience.includes(t.targetId);
    const selfieDue = inSelfieAudience && t.selfiePingedOn !== state.profile.selfieDay;
    if (selfieDue) p += INCOMING_BASE_CHANCE * (def.need === 'daughter_figure' || def.need === 'desired' ? 1 : 0.5);
    if ((state.inventory.retouch ?? 0) > 0) p += 0.1; // v2.3：修图会员——照片更"真"
    if (t.trust >= 50) p += 0.1;
    if (t.daysSilent >= 3) p += 0.2; // 断联的人憋不住了
    if (t.daysSincePaid >= 5 && t.trust >= 40) p += 0.15; // 发工资的日子
    // v4.3.3 个性签名相位：顺眼的门面让他更想来找你，犯嘀咕的绕着走
    //（负相位=减概率；概率虽减，开场白还在——嘀咕本身也是一种来找你的方式）。
    // v4.5：签名钩子（bio_ 话头的开场白）同样只给 bioAudience 观众圈，
    //  一人一签只来一次；相位概率加成保留全员（门面长期挂在那，翻不翻是缘分）。
    const bioPhaseNow = bioPhase(state.profile.bioId, def.archetype);
    const bioHookPool = BIO_HOOK_BY_ARCHETYPE[def.archetype];
    const inBioAudience = state.bioAudience.includes(t.targetId)
      && state.day - state.bioAudienceDay <= BIO_HOOK_WINDOW_DAYS;
    const bioHook = bioPhaseNow !== 0 && !!bioHookPool && inBioAudience && t.bioPingedOn !== state.profile.bioId
      && !t.recentIncoming?.some((l) => bioHookPool.includes(l));
    p = Math.max(0, p + bioPhaseNow);
    if (rng.chance(p)) {
      const script = scriptFor(t.targetId);
      const inc = script.incoming;
      let reason: 'selfie' | 'missed_you' | 'wallet_open' | 'his_life' = 'missed_you';
      let pool = inc?.missed_you ?? ['（他发来一条消息。）'];
      let bioPoolUsed = false;
      if (selfieDue && inc?.on_selfie?.length) { reason = 'selfie'; pool = inc.on_selfie; t.selfiePingedOn = state.profile.selfieDay; }
      else if (bioHook && bioHookPool) {
        // 他顺着你的新签名找来——把话头第一句让给签名（3 句池随机取一）。
        reason = 'missed_you';
        pool = bioHookPool;
        bioPoolUsed = true;
        t.bioPingedOn = state.profile.bioId;
      }
      else if (t.daysSincePaid >= 5 && inc?.wallet_open?.length) { reason = 'wallet_open'; pool = inc.wallet_open; }
      // v4.1 库人物个人 incoming：他第一次来找你时说的话是他的，不是原型的——
      // 从 bio 长出来（雷子的四十块屏幕/老翟的北门收音机），五个人不再共用一句话。
      const rec = t.recentIncoming ?? (t.recentIncoming = []);
      const personalLine = LIBRARY_INCOMING[t.targetId];
      const usePersonal = !!personalLine && t.lastChatDay === 0 && !rec.includes(personalLine);
      if (usePersonal && personalLine) rec.push(personalLine);
      // v4.4 应答场景键：topicId 必须跟实际选中的开场白走——
      // bio 钩子分支（签名话头）→ bio_<archetype>；库首联 → 人物 id；
      // 其余按 主五人前缀/原型前缀 × reason（selfie/miss/wallet）。
      const reasonKey = reason === 'selfie' ? 'selfie' : reason === 'wallet_open' ? 'wallet' : 'miss';
      const topicId = usePersonal && personalLine
        ? t.targetId
        : bioPoolUsed
          ? `bio_${def.archetype}`
          : t.targetId in MAIN_INCOMING_PREFIXES
            ? MAIN_INCOMING_PREFIXES[t.targetId] + '_' + reasonKey
            : `arch_${def.archetype}_${reasonKey}`;
      state.incoming.push({
        targetId: t.targetId,
        day: state.day,
        reason,
        // v3.2：进场白也跨场去重——同一句"就是想你了"不连着来。
        opener: fillProfileVars(usePersonal && personalLine
          ? personalLine
          : pickFreshLine(rng, pool, '（他发来一条消息。）', rec), state),
        stamp: nightStamp(def.activeHour, rng.int(0, 25)),
        topicId,
      });
      t.pingedToday = true;
      madeToday += 1;
      // 顶到上限：新消息挤掉最老那条（他等不到回音了）。
      while (state.incoming.length > INCOMING_DAILY_CAP) state.incoming.shift();
    }
  }

  // v3.1 朋友圈互动浪潮：你发的圈（近 3 天内）每天早上都会被他们刷到——
  // 点赞的、评论的、起疑的。加了微信就会看到（不必先聊过天）；同一个人对
  // 同一条圈只互动一次；一条圈可以连续几天陆续收到回音，像真的朋友圈那样发酵。
  // 评论区是所有"哥哥"共享的一面墙：同一条圈 ≥3 个人留下评论，风险自然涨。
  for (const post of state.moments) {
    if (post.author !== 'player') continue;
    if (state.day - post.momentDay > SELFIE_LINGER_DAYS) continue;
    if (post.lastWaveDay === state.day) continue;
    post.lastWaveDay = state.day;
    const reactors = state.targets.filter((t) => !t.blocked && !t.ended && t.discoveredDay > 0 && !t.mutedByPlayer);
    for (const t of reactors) {
      const def = ALL_TARGET_MAP[t.targetId];
      if (!def || hasReacted(post, t.targetId)) continue;
      const suspicious = def.traits.includes('suspicious') || t.wariness >= 40;
      const reactChance = suspicious ? 0.4 : 0.45 + t.trust / 400;
      if (!rng.chance(reactChance)) continue;
      applyMomentReaction(state, rng, post, t, def, suspicious);
    }
    // 评论区撞车：≥3 个不同的人留下评论——他们迟早会看见彼此。
    const commenterCount = new Set(
      post.comments.filter((c) => c.by === 'target').map((c) => c.targetId),
    ).size;
    if (commenterCount >= 3) {
      state.riskLevel = clamp(state.riskLevel + 6, 0, 100);
      log(state, 'flag', '朋友圈的评论区里，他看见了另一个他。两个人都以为那面墙只属于自己。');
    }
  }

  // v4.0 老头人生线：他的人生按日历推进——不看她聊没聊，日子到了就发生。
  // 这是中期（第 4-30 天）新鲜感的骨架：他不是提款机，他是过着日子的人。
  // 三个变体：基准（他的人生）/ costText（她拿走的钱改写了哪一行）/ blockedLine
  // （他删了她，日子照过，只是她看不见了）。不消耗 RNG（种子确定性保护）。
  {
    let fired = 0;
    for (const t of state.targets) {
      if (fired >= LIFE_DAILY_CAP) break;
      if (!t.discoveredDay) continue;
      const arc = LIFE_BY_TARGET[t.targetId];
      if (!arc) continue;
      const beat = arc.find((b) => b.day === state.day);
      if (!beat) continue;
      fired += 1;
      if (t.blocked || t.ended) {
        if (beat.blockedLine) log(state, 'life', beat.blockedLine);
        continue;
      }
      const def = ALL_TARGET_MAP[t.targetId];
      const harvested = !!(beat.costText && t.totalReceived >= (beat.costFrom ?? Infinity));
      log(state, 'life', harvested ? (beat.costText ?? beat.text) : beat.text);
      if (beat.moment) {
        state.moments.push({
          id: `life_${beat.id}_${state.day}`,
          momentDay: state.day,
          author: 'target',
          targetId: t.targetId,
          photoId: beat.moment.photoId,
          variant: pickVariant(`life_${beat.id}_${state.day}`),
          caption: beat.moment.caption,
          likes: [],
          comments: [],
        });
        if (state.moments.length > MOMENTS_CAP) state.moments.splice(0, state.moments.length - MOMENTS_CAP);
        state.unseenMoments += 1;
      }
      if (beat.incoming && t.trust >= (beat.incoming.minTrust ?? 0)) {
        // 人生线优先：他今天的这件事，比"就是想你了"重要——同一天同老头
        // 只留一条（incoming 卡片按 targetId 取 key，重复入队会撞 key）。
        const dup = state.incoming.findIndex((m) => m.targetId === t.targetId);
        if (dup >= 0) state.incoming.splice(dup, 1);
        state.incoming.push({
          targetId: t.targetId,
          day: state.day,
          reason: 'his_life',
          opener: fillProfileVars(beat.incoming.opener, state),
          stamp: nightStamp(def?.activeHour ?? 20, 5),
          // v4.4：人生线 beat 的应答组键（incoming-replies.ts 的 life_<beatId>）。
          topicId: `life_${beat.id}`,
        });
        t.pingedToday = true;
        while (state.incoming.length > INCOMING_DAILY_CAP) state.incoming.shift();
      }
    }
  }

  // v4.1 节奏日（Day 5/10/15/20/25）：必现的世界节点——第 4-30 天的"停下来
  // 看自己"。带决策卡的（options）落 pendingBeat，等 resolve_beat；纯压迫文案
  // （电梯镜子）直接落日志。麻木门槛不到，镜子这面她看不见。
  {
    const beat = WORLD_BEAT_BY_DAY[state.day];
    if (beat && (beat.minNumbness ?? 0) <= state.numbness) {
      const body = interpolateBeat(beat.body, state.stats.totalEarned, state.stats.redPacketsReceived, Math.max(0, state.goal - state.stats.totalEarned));
      log(state, 'beat', `${beat.title}——${body}`);
      if (beat.options?.length && !state.beatResolved) {
        state.pendingBeat = beat.id;
      }
    }
  }

  // v4.2 突发事件：随机掷股（非日历）——约 1/5 的日子横生枝节，必须当场二选一。
  // 与节奏日错开（beat 日不掷，压迫已经够重了）；首两日不触发；一次只来一件；
  // 同一存档同一事件只来一次。选了才结算，拖到睡觉落"没接住"版。
  {
    const beatDay = !!WORLD_BEAT_BY_DAY[state.day];
    if (state.day >= INCIDENT_FIRST_DAY && !beatDay && rng.chance(INCIDENT_CHANCE)) {
      const discovered = new Set(state.targets.filter((t) => t.discoveredDay > 0).map((t) => t.targetId));
      const pool = incidentsAvailable(state.day, discovered).filter((i) => !state.usedOneTimeEvents.includes(i.id));
      if (pool.length) {
        const inc = rng.pick(pool);
        state.usedOneTimeEvents.push(inc.id);
        state.pendingIncident = inc.id;
        state.incidentResolved = false;
        log(state, 'incident', `${inc.title}——${inc.body}`);
      }
    }
  }

  // v2.3 老头发圈：每天早上随机一个认识的人发条自己的动态——
  // 你可以点赞（+1 信任）或评论（走心，+2）。评论是门手艺，也是门生意。
  // v4.0：今天已经发过人生线的老头不再重复发圈。
  const discovered = state.targets.filter(
    (t) => !t.blocked && !t.ended && t.discoveredDay > 0
      && !state.moments.some((m) => m.author === 'target' && m.targetId === t.targetId && m.momentDay === state.day),
  );
  if (discovered.length && rng.chance(0.75)) {
    const poster = rng.pick(discovered);
    const def = ALL_TARGET_MAP[poster.targetId];
    const posts = targetMomentPosts(poster.targetId, def.archetype);
    const pick = posts.length ? rng.pick(posts) : null;
    if (def && pick) {
      state.moments.push({
        id: `t${poster.targetId}_${state.day}`,
        momentDay: state.day,
        author: 'target',
        targetId: poster.targetId,
        photoId: pick.photoId,
        variant: pickVariant(`t${poster.targetId}_${state.day}`),
        caption: rng.pick(pick.captions),
        likes: [],
        comments: [],
      });
      if (state.moments.length > MOMENTS_CAP) state.moments.splice(0, state.moments.length - MOMENTS_CAP);
      state.unseenMoments += 1;
    }
  }

  // 产业化代聊结算：课程买断后，代聊群每天替你维护所有未拉黑的关系。
  if (state.industryCourse) {
    for (const t of state.targets) {
      if (t.blocked) continue;
      t.trust = clamp(t.trust + INDUSTRY_MAINTAIN_TRUST, 0, 100);
      advanceStage(t);
    }
    state.riskLevel = clamp(state.riskLevel + INDUSTRY_RISK_PER_DAY, 0, 100);
    state.numbness = clamp(state.numbness + INDUSTRY_NUMBNESS_PER_DAY, 0, 100);
  }

  // v2.3：精力回填跟随上限（网红套餐 16→24 后，24 才是"满"）。
  // v4.1（P1-4）早期疲劳：第 1-3 天回填 ×0.75——刚起步时体力最薄，Day 4 恢复全量。
  state.energy = state.day <= ENERGY_EARLY_DAYS
    ? Math.round(state.energyMax * ENERGY_EARLY_FACTOR)
    : state.energyMax;

  // 1.1.0 舒适圈：常用手机的早晨——妈/男友的事件卡派发（独立随机流，不耗主种子）。
  runComfortMorning(state);
}

/** Score the ending from run shape.
 *  1. 判决书优先于一切：进了产业链，结局就不由你的良心决定了。
 *  2. 全员穿帮压倒一切数字——那不是账的问题了。
 *  3. 存折/车库是"掏空了一个人"的大事件，压过账本；但存折要求真到 harvest
 *     （关系没深到那份上就开口，拿不到那笔钱——flag 本来就不会落）。
 *  4. 账本（达标/麻木/全灭）先于某晚的一次回答（坦白/嘴硬）——月底的账
 *     不会因为你嘴硬就变了。 */
export function scoreEnding(state: GameState): string {
  // 判决书：买了课 + 业务量做起来了（大量开口）→ 被卷进案件。
  if (state.industryCourse && state.stats.asksMade >= VERDICT_ASK_THRESHOLD) {
    state.flags.industry_course_done = true;
    return 'end_verdict';
  }
  if (state.flags.risk_exposed_all) return 'end_exposed';
  if (state.flags.wang_took_it_all) return 'end_family_man';
  // 存折：flag 只在要钱真成功时落下（pick_option 里保证）——拿到那笔钱
  // 的那一刻，这段关系和这个结局就都定了。贪到底的玩家就该走到这里。
  if (state.flags.zhou_took_deposit) return 'end_deposit';
  // 账本先说话。
  if (state.stats.totalEarned >= MONTHLY_GOAL) return 'end_debt_free';
  if (state.numbness >= 70) return 'end_numb';
  // 只看认识过的人：未偶遇的库目标 stage 恒为 stranger、永远不会 blocked，
  // 全量 every((t) => t.blocked) 永远为 false（end_caught 曾因此不可达）。
  if (state.targets.every((t) => t.blocked || !t.discoveredDay)) return 'end_caught';
  if (state.flags.li_confessed) return 'end_confessed';
  if (state.flags.li_lied_final) return 'end_lied';
  // v4.13.1（审查 H2）：阿豪/陈工的坦白-撒谎线结局——与老李同优先级层。
  if (state.flags.hao_confessed) return 'end_hao_confessed';
  if (state.flags.hao_lied_final) return 'end_hao_lied';
  if (state.flags.chen_confessed) return 'end_chen_confessed';
  if (state.flags.chen_gave_savings) return 'end_chen_gave';
  return 'end_broke';
}

// ---------------------------------------------------------------------------

export function dispatch(state: GameState, action: GameAction): GameState {
  const s = clone(state);
  switch (action.type) {
    case 'new_game': {
      // 测试可注入确定性 seed：先种 rngSeed 再 dispatch（覆盖 Date.now 默认值）。
      const injectedSeed = s.rngSeed;
      s.sessionId = `run_${Date.now().toString(36)}`;
      s.rngSeed = injectedSeed;
      s.phase = 'main';
      s.dayPhase = 'morning';
      s.playerName = action.name || '小满';
      s.motive = action.motive;
      s.personaId = action.personaId;
      s.targets = ALL_TARGETS.map((t) => freshTargetState(t.id));
      // 主五人开局即在通讯录；库里 45 人要靠计划偶遇解锁。
      for (const id of ACTIVE_TARGETS) {
        const t = s.targets.find((x) => x.targetId === id);
        if (t) t.discoveredDay = 1;
      }
      s.log = [];
      s.flags = {};
      s.industryCourse = false;
      s.profile = defaultProfile();
      s.ledger = [];
      s.archives = [];
      s.incoming = [];
      s.todayPlan = '';
      s.numbnessToday = 0;
      s.moments = [];
      s.unseenMoments = 0;
      s.inventory = {};
      s.selfieAudience = [];
      s.bioAudience = [];
      s.bioAudienceDay = 0;
      s.comfort = freshComfortState();
      s.energyMax = ENERGY_MAX;
      s.money = START_MONEY;
      s.riskLevel = 0;
      s.numbness = 0;
      s.conscience = 50;
      s.stats = { totalEarned: 0, redPacketsReceived: 0, asksMade: 0, asksFailed: 0, nightsWorked: 0, biggestPacket: 0 };
      // v4.5：开局签名（默认直白哭穷）就有观众圈——第 1 天早晨主五人里
      // 也有机会有人顺着签名来搭话（此前签名钩子只在换签后触发，开局死区）。
      s.bioAudience = sampleAudience(s, BIO_AUDIENCE_MAX, 'bio');
      s.bioAudienceDay = s.day;
      runMorning(s);
      log(s, 'day', `第 1 天。你还差 ${s.goal} 元。通讯录里躺着五个"哥哥"：一个深夜的司机，一个上午的老师，一个凌晨的老板，一个网吧的阿豪，一个画图纸的陈工。你一个都还没回。`);
      // v3.1：开局也弹"新的一天"简报（第 1 天的账单/事件/晨钟）。
      s.briefingDay = s.day;
      return s;
    }

    case 'industry_reply': {
      if (!s.flags.industry_invite || s.flags.industry_replied) return s;
      s.flags.industry_replied = true;
      if (action.accept) {
        if (s.money < INDUSTRY_COURSE_COST) {
          log(s, 'flag', '你想接下那个"课程"。但学费 300 块，你连这个都凑不出来。');
          s.flags.industry_rejected = true;
          return s;
        }
        s.money -= INDUSTRY_COURSE_COST;
        s.ledger.push({ day: s.day, amount: -INDUSTRY_COURSE_COST, note: '那位"姐"的课（代聊群）', kind: 'course' });
        s.industryCourse = true;
        s.riskLevel = clamp(s.riskLevel + 20, 0, 100);
        s.numbness = clamp(s.numbness + 10, 0, 100);
        log(s, 'flag', '你把 300 块转给了那位"姐"。进了群。群里四百多个头像，置顶是三套话术文档，所有人共用。你的号，从今晚开始不再只属于你一个人。');
        // v2.4：进了流水线的那一刻，华严偈跟着落地。
        {
          const g = TRIGGER_GATHAS.industry_accept;
          log(s, 'gatha', `${g.verse}——${g.source}`, g.gloss);
        }
      } else {
        s.conscience = clamp(s.conscience + 5, 0, 100);
        s.flags.industry_rejected = true;
        log(s, 'flag', '你把那条私信删了。删之前你盯着"一人一天带三个号"看了很久——原来这门生意，连你自己都只是个可以批量的"号"。');
        // v2.4：这一按，是本月最干净的一笔——知足偈。
        {
          const g = TRIGGER_GATHAS.industry_reject;
          log(s, 'gatha', `${g.verse}——${g.source}`, g.gloss);
        }
      }
      return s;
    }

    case 'enter_night': {
      s.dayPhase = 'night';
      return s;
    }

    case 'choose_plan': {
      // v2.0：每天一个计划——决定今晚在哪、遇到谁、花多少。
      if (s.dayPhase !== 'morning' || s.todayPlan) return s;
      const plan = DAILY_PLANS.find((p) => p.id === action.planId);
      if (!plan) return s;
      if (s.energy < plan.energyCost) return s;
      s.todayPlan = plan.id;
      s.energy -= plan.energyCost;
      if (plan.money) {
        s.money += plan.money;
        ledgerAdd(s, plan.money, `${plan.name}${plan.money > 0 ? '的零钱' : '花费'}`, 'plan');
      }
      if (plan.riskAdd) s.riskLevel = clamp(s.riskLevel + plan.riskAdd, 0, 100);
      // 偶遇判定：从库里抽一个未解锁的、原型对口的老头。
      let metLine = `${plan.name}。`;
      if (plan.meetArchetypes.length && rng01(s).chance(plan.meetChance)) {
        const pool = s.targets.filter((t) => {
          const d = ALL_TARGET_MAP[t.targetId];
          return d && !t.discoveredDay && !t.blocked && plan.meetArchetypes.includes(d.archetype);
        });
        if (pool.length) {
          const met = rng01(s).pick(pool);
          met.discoveredDay = s.day;
          const d = ALL_TARGET_MAP[met.targetId];
          metLine = `${plan.name}。你遇到了${d.name}（${d.age}岁，${archetypeCN(d.archetype)}）。他跟你搭话的方式有点笨拙——你把微信给了他。`;
          log(s, 'flag', metLine);
          s.chat = null;
          return s;
        }
        metLine = `${plan.name}。今晚没什么新鲜的遇见。`;
      }
      log(s, 'plan', metLine);
      return s;
    }

    case 'update_profile': {
      // v2.0：改资料（v2.3：发自拍迁去朋友圈模块的 post_moment）。
      // v4.3.3：头像库扩到 10 款（AVATAR_PRESETS），钳制上限跟着走。
      if (action.avatarId !== undefined) s.profile.avatarId = clamp(action.avatarId, 1, 10);
      if (action.ageClaim) s.profile.ageClaim = action.ageClaim;
      if (action.traitId) s.profile.traitId = action.traitId;
      // v4.3.3 个性签名——换签名当天就有感觉：顺眼的人更容易来找你，
      // 犯嘀咕的人警惕微涨（门面改了，看进去的人反应各不相同）。
      // v4.5 观众圈：换签名只惊动一部分人（重抽 bioAudience，≤BIO_AUDIENCE_MAX），
      //  窗口内只有他们会顺着签名找来——换一次门面不再变成全员点名。
      if (action.bioId && PLAYER_BIO_IDS.includes(action.bioId)) {
        const oldBio = PLAYER_BIO_MAP[s.profile.bioId];
        s.profile.bioId = action.bioId;
        if (oldBio && oldBio.id !== action.bioId) {
          for (const t of s.targets) {
            if (t.blocked || !t.discoveredDay) continue;
            const def = ALL_TARGET_MAP[t.targetId];
            if (!def) continue;
            if (PLAYER_BIO_MAP[action.bioId].penalties[def.archetype]) {
              t.wariness = clamp(t.wariness + 1, 0, 100);
            }
          }
          s.bioAudience = sampleAudience(s, BIO_AUDIENCE_MAX, 'bio');
          s.bioAudienceDay = s.day;
          if (s.bioAudience.length) {
            const names = s.bioAudience.map((id) => ALL_TARGET_MAP[id]?.name).filter(Boolean);
            log(s, 'flag', `换了签名。${names.length}个人会翻到这行字——谁先来，看谁心里搁着事。`);
          } else {
            log(s, 'flag', '换了签名。通讯录里暂时没人会注意到这行字。');
          }
        }
      }
      return s;
    }

    case 'post_moment': {
      // v2.3：发一条朋友圈自拍——一天一条（新照片三天内他会更主动来找你）。
      // v4.5 观众圈：发一张只惊动一部分人（重抽 selfieAudience，
      //  ≤SELFIE_AUDIENCE_MAX）——三天内只有他们会因照片来找你，
      //  每人这张照片只来一次。回消息要花精力，不该一发圈全员围上来。
      if (s.dayPhase === 'chat') return s;
      const postedToday = s.moments.some((m) => m.author === 'player' && m.momentDay === s.day);
      if (postedToday) return s;
      const captions = MOMENT_CAPTIONS[action.selfieId];
      if (!captions) return s;
      const rng = rng01(s);
      const post = {
        id: `m${s.day}`,
        momentDay: s.day,
        author: 'player' as const,
        selfieId: action.selfieId,
        variant: pickVariant(`${action.selfieId}#${s.day}`),
        caption: rng.pick(captions),
        likes: [] as string[],
        comments: [] as import('../types/game').MomentComment[],
      };
      s.moments.push(post);
      if (s.moments.length > MOMENTS_CAP) s.moments.splice(0, s.moments.length - MOMENTS_CAP);
      s.profile.selfieId = action.selfieId;
      s.profile.selfieDay = s.day;
      s.selfieAudience = sampleAudience(s, SELFIE_AUDIENCE_MAX, 'selfie');
      log(s, 'flag', `你发了条朋友圈：${SELFIE_LABEL[action.selfieId] ?? '一张自拍'}。${s.selfieAudience.length ? '明早刷到的人里，有人会来找你。' : '明早他们会来看的。'}`);
      // v3.1：刚发的圈，此刻在线的人会立刻刷到——最多两个反应，朋友圈是活的。
      // 起疑线同样生效（疑心重的人当场就会来翻）；hasReacted 保证不与早晨浪潮重复。
      let instant = 0;
      for (const t of s.targets) {
        if (instant >= 2) break;
        if (t.blocked || t.ended || !t.discoveredDay || t.mutedByPlayer) continue;
        const def = ALL_TARGET_MAP[t.targetId];
        if (!def || hasReacted(post, t.targetId)) continue;
        if (!rng.chance(0.3)) continue;
        const suspicious = def.traits.includes('suspicious') || t.wariness >= 40;
        applyMomentReaction(s, rng, post, t, def, suspicious);
        instant += 1;
      }
      return s;
    }

    case 'react_moment': {
      // v2.3：去他的圈里点赞/评论——比"想你"两个字有用，因为他真的被看见了。
      if (s.dayPhase === 'chat') return s;
      const post = s.moments.find((m) => m.id === action.momentId);
      if (!post || post.author !== 'target' || !post.targetId) return s;
      const t = s.targets.find((x) => x.targetId === post.targetId);
      const def = ALL_TARGET_MAP[post.targetId];
      if (!t || !def || t.blocked) return s;
      if (action.kind === 'like') {
        if (post.likes.includes('player')) return s; // 已经点过
        post.likes.push('player');
        t.trust = clamp(t.trust + 1, 0, 100);
        advanceStage(t);
      } else {
        const already = post.comments.some((c) => c.by === 'player');
        if (already) return s; // 一条圈只评论一次
        const pool = playerCommentPool(def);
        post.comments.push({ by: 'player', text: action.text ?? rng01(s).pick(pool) });
        t.trust = clamp(t.trust + 2, 0, 100);
        advanceStage(t);
      }
      return s;
    }

    case 'view_moments': {
      // v2.3：打开朋友圈，红点清零。
      s.unseenMoments = 0;
      return s;
    }

    case 'dismiss_briefing': {
      // v3.1：关闭"新的一天"简报——纯 UI 确认，之后计划列表才接管注意力。
      s.briefingDay = 0;
      return s;
    }

    case 'buy_item': {
      // v2.3：钱包商店。钱不够/唯一道具已购 → no-op（返回原 clone）。
      const item = SHOP_ITEMS.find((i) => i.id === action.itemId);
      if (!item) return s;
      if (item.unique && (s.inventory[item.id] ?? 0) > 0) return s;
      if (s.money < item.price) return s;
      s.money -= item.price;
      ledgerAdd(s, -item.price, `${item.name}（${item.unique ? '一件就是全部' : '消耗品'}）`, 'shop');
      const e = item.effect;
      if (e.kind === 'energy') {
        s.energy = Math.min(s.energyMax, s.energy + e.amount);
        log(s, 'flag', `${item.name}：${item.flavor}`);
      } else if (e.kind === 'energyCalm') {
        s.energy = Math.min(s.energyMax, s.energy + e.energy);
        s.numbness = clamp(s.numbness - e.numbnessDown, 0, 100);
        log(s, 'flag', `${item.name}：${item.flavor}`);
      } else if (e.kind === 'lipstick') {
        s.inventory.lipstick = (s.inventory.lipstick ?? 0) + 1;
        log(s, 'flag', `你买了${item.name}——下场对话有效。${item.flavor}`);
      } else if (e.kind === 'jewelry') {
        s.inventory.jewelry = 1;
        log(s, 'flag', `${item.flavor}之后每一场对话，好感 +1。`);
      } else if (e.kind === 'retouch') {
        s.inventory.retouch = 1;
        log(s, 'flag', `${item.flavor}新照片三天内，他们更容易来找你。`);
      } else if (e.kind === 'powerbank') {
        s.inventory.powerbank = 1;
        log(s, 'flag', `${item.flavor}之后每场对话精力 4 → 3。`);
      } else if (e.kind === 'streamerKit') {
        s.energyMax = e.energyMax;
        s.riskLevel = clamp(s.riskLevel + e.riskAdd, 0, 100);
        log(s, 'flag', `${item.flavor}你一晚上能聊的人更多了——也更不像在过自己的日子。`);
      }
      return s;
    }

    case 'accept_incoming': {
      // v2.0：回应"他来找你"——开一场他起头的会话。
      const idx = s.incoming.findIndex((m) => m.targetId === action.targetId);
      if (idx < 0 || s.dayPhase === 'chat') return s;
      const t = s.targets.find((x) => x.targetId === action.targetId);
      const def = ALL_TARGET_MAP[action.targetId];
      if (!t || !def || t.blocked || t.mutedByPlayer || s.energy < chatCost(s)) return s;
      if (t.lastChatDay === s.day) {
        // 今天聊过了：把这条 incoming 消掉但不开会话。
        s.incoming.splice(idx, 1);
        return s;
      }
      const msg = s.incoming[idx];
      s.incoming.splice(idx, 1);
      t.lastChatDay = s.day;
      s.energy -= chatCost(s);
      s.dayPhase = 'chat';
      s.stats.nightsWorked += 1;
      applyAffinity(s, t, def);
      // v4.4 解耦：他主动找你的会话是「一问一答」的独立小场——他的开场白
      // 落地后，女主从应答库（incoming-replies.ts）按 topicId 取上下文相关
      // 的回复选项。不再接剧情链/闲聊组/空闲节点——两个话题硬拼在一起，
      // 上下文就断了（他要的是「你接住我这句话」，不是「换个话题重新开聊」）。
      // 剧情链的推进权留给玩家自己 start_chat 的那一晚。
      const replySet = incomingReplyFor(msg.topicId);
      const transcript: ChatMsg[] = [];
      const phaseLabel = def.activeHour >= 6 && def.activeHour <= 12 ? '上午' : '深夜';
      transcript.push({ speaker: 'system' as const, text: `和 ${def.name} 的${phaseLabel}对话（他先找的你）`, stamp: msg.stamp });
      pushBubbles(transcript, 'target', fillProfileVars(msg.opener, s), msg.stamp);
      s.chat = {
        targetId: t.targetId,
        transcript,
        // 应答选项即本场的全部选项——选完他的回应播完即收场（pick_option
        // 对 pendingNodeId=='' 的非链会话本来就会 closing）。
        pendingOptions: replySet.options,
        pendingNodeId: '',
        awaiting: 'player',
        closingNote: null,
        fromIncoming: true,
        topicIdOf: msg.topicId,
      };
      t.daysSilent = 0;
      return s;
    }

    case 'ignore_incoming': {
      // v2.0：装没看见。不回应是有代价的——孤独的人记得每一次已读不回。
      const idx = s.incoming.findIndex((m) => m.targetId === action.targetId);
      if (idx < 0) return s;
      const t = s.targets.find((x) => x.targetId === action.targetId);
      if (t && !t.blocked) {
        t.trust = clamp(t.trust - 3, 0, 100);
        t.daysSilent += 1;
      }
      s.incoming.splice(idx, 1);
      log(s, 'flag', `你把那条消息划掉了。${t ? ALL_TARGET_MAP[t.targetId]?.name : '他'}的头像在列表里亮了一会儿，暗了。`);
      return s;
    }

    case 'start_chat': {
      if (s.dayPhase === 'chat') return s;
      const t = s.targets.find((x) => x.targetId === action.targetId);
      // v2.0：全量映射——库里偶遇的老头也能开聊。
      const def = ALL_TARGET_MAP[action.targetId];
      if (!t || !def || t.blocked || t.mutedByPlayer || s.energy < chatCost(s)) return s;
      if (!targetAwake(def, s.dayPhase)) return s;
      // 一个人一天只聊一场：重复刷同一个老头没有额外收益——
      // 多线经营是这门生意的本质，也是风险的来源。
      if (t.lastChatDay === s.day) return s;
      // v4.1：捕获"从未聊过"——lastChatDay 赋值后就再也读不到了。
      const firstEverChat = t.lastChatDay === 0;
      t.lastChatDay = s.day;
      s.energy -= chatCost(s);
      s.dayPhase = 'chat';
      s.stats.nightsWorked += 1;
      const lines = scriptFor(t.targetId).lines;
      // v2.0：亲和结算——profile 性格/年龄 × 他的原型/缺口，先漂移再选话术。
      applyAffinity(s, t, def);
      // v3.0：话术优先级 = 剧情节点 > 闲聊组（60套，去重轮换）> 空闲节点 > 两句话。
      // 老头库目标没有剧情链，直接走话术组。
      // v4.1.2：链夜随机穿插——30% 的链夜改聊闲聊组，剧情节点原地保留。
      // 重开后"哪一晚推剧情"随种子变化（剧情弧仍保序），不再每局逐字相同。
      // 注意：discoveredDay===1 意为"开局即在通讯录的五个主老头"——剧情链
      // 只对他们播放；偶遇解锁的库目标即使将来配了 chain 也不会走这里，
      // （给库人物加链时需要另行处理这个门槛。）
      const chainNode = t.discoveredDay === 1 ? pickChainNode(s, def, t) : null;
      const interlude = chainInterludeTonight(s, t, chainNode);
      const activeChain = chainNode && !interlude ? chainNode : null;
      const prevTopic = t.lastTopic; // v3.0：pickPack 会覆盖 lastTopic，先留住昨晚的
      const pack = activeChain ? null : pickPack(s, t, def);
      const freeNode = activeChain || pack ? null : pickFreeNode(s, def, t);
      const node = activeChain ?? pack ?? freeNode;
      const transcript = [];
      const rng = makeRng(s.rngSeed);
      s.rngSeed = (s.rngSeed * 1664525 + 1013904223) >>> 0;
      const phaseLabel = def.activeHour >= 6 && def.activeHour <= 12 ? '上午' : '深夜';
      transcript.push({ speaker: 'system' as const, text: `和 ${def.name} 的${phaseLabel}对话`, stamp: nightStamp(def.activeHour, 0) });
      // 近 3 条开场白原文去重（问候/警示/断联共用一个"最近说过"列表，谁说过谁让路）。
      const recent = t.recentGreetings ?? (t.recentGreetings = []);
      // v4.1 库人物个人开场白：第一次聊天必说自己的话（从 bio 长出来）——
      // 五个保安不再说一模一样的话。播完进原型组。
      // v4.1.2：两条池随机抽（原为按天索引——重开游戏同一天遇到他就永远是同一条）。
      const personalOpeners = LIBRARY_OPENERS[t.targetId];
      if (firstEverChat && personalOpeners?.length) {
        const line = pickFreshLine(rng, personalOpeners, personalOpeners[0], recent);
        pushBubbles(transcript, 'target', fillProfileVars(line, s), nightStamp(def.activeHour, 1));
      } else
      // v3.2 距离层：信任不足时开场白走 greeting_far——客气、试探、没称呼、目的性弱。
      if (t.trust < GREETING_FAR_TRUST && lines.greeting_far?.length) {
        pushBubbles(transcript, 'target', fillProfileVars(pickFreshLine(rng, lines.greeting_far, '（他来了。）', recent), s), nightStamp(def.activeHour, 1));
      } else if (t.wariness >= 50 && t.timesPaid > 0) {
        pushBubbles(transcript, 'target', fillProfileVars(pickFreshLine(rng, lines.wariness_high, '（他回得越来越慢。）', recent), s), nightStamp(def.activeHour, 2));
      } else if (t.daysSilent >= 3) {
        pushBubbles(transcript, 'target', fillProfileVars(pickFreshLine(rng, lines.silent_warning, '（他安静了很多天。）', recent), s), nightStamp(def.activeHour, 1));
      } else {
        // v3.2 三层开场白（亲疏分层）：熟了之后人设专属池才介入——
        // 他第一句话里"你是谁"的印记，是熟了才配有的；陌生期另走 greeting_far。
        let pool = t.trust >= GREETING_CLOSE_TRUST && lines.greeting_close?.length ? lines.greeting_close : lines.greeting;
        const short = s.personaId === 'femme_fatale' ? 'ff' : s.personaId === 'sweet_daughter' ? 'sd' : s.personaId === 'wise_sister' ? 'ws' : 'art';
        const personaPool = lines[`greet_${short}`];
        if (personaPool?.length && t.trust >= PERSONA_GREET_TRUST && rng.chance(0.55)) pool = personaPool;
        const greeting = fillProfileVars(pickFreshLine(rng, pool, '（他来了。）', recent), s);
        pushBubbles(transcript, 'target', greeting, nightStamp(def.activeHour, 1));
      }
      // v3.0 语境连续性：昨晚聊过带话题标签的闲聊，今晚有概率先"接昨天的话"。
      // （穿插晚也算"没推链"——昨晚的闲聊话题今晚可接。）
      if (!activeChain && prevTopic && lines.recall?.length && rng.chance(RECALL_CHANCE)) {
        const recent = t.recentGreetings ?? (t.recentGreetings = []);
        const line = pickFreshLine(rng, lines.recall, '', recent).replace(/\{topic\}/g, prevTopic);
        if (line) pushBubbles(transcript, 'target', fillProfileVars(line, s), nightStamp(def.activeHour, 2));
      }
      if (node) {
        for (const opener of node.openers) {
          pushBubbles(transcript, 'target', fillProfileVars(opener, s), nightStamp(def.activeHour, 3 + transcript.length));
        }
        maybePushPhoto(t, rng, transcript, def.activeHour);
        s.chat = {
          targetId: t.targetId,
          transcript,
          pendingOptions: node.options,
          pendingNodeId: activeChain ? activeChain.id : '',
          awaiting: 'player',
          closingNote: null,
        };
        if (activeChain) t.pendingChain = activeChain.next;
      } else {
        transcript.push({ speaker: 'target' as const, text: '（今天就这么两句。）', stamp: nightStamp(def.activeHour, 8) });
        s.chat = { targetId: t.targetId, transcript, pendingOptions: [], pendingNodeId: '', awaiting: 'closed', closingNote: null };
      }
      t.daysSilent = 0;
      return s;
    }

    case 'pick_option': {
      if (!s.chat || s.chat.awaiting !== 'player') return s;
      const t = s.targets.find((x) => x.targetId === s.chat!.targetId);
      const def = ALL_TARGET_MAP[s.chat.targetId];
      if (!t || !def) return s;
      const options = s.chat.pendingOptions;
      const isChain = s.chat.pendingNodeId !== '';
      const node = isChain ? scriptFor(t.targetId).chain[s.chat.pendingNodeId] : null;
      const option = options[action.optionIndex];
      if (!option) return s;
      if (isChain && node) s.flags[`chain_${node.id}`] = true;

      const mult = replyMultiplier(def, t, option.style, s.personaId);
      const trustDelta = applyOptionToTrust(option, mult);
      t.trust = clamp(t.trust + trustDelta, 0, 100);
      if (option.wariness) t.wariness = clamp(t.wariness + option.wariness, 0, 100);
      // v2.0：麻木每日上限（+8）——一天演四场，也不能一晚透支成机器人。
      // flirty 的固定 +4 同样吃日额度：否则连开四场挑 flirty 直接绕过上限。
      const room = Math.max(0, NUMBNESS_DAILY_CAP - s.numbnessToday);
      const numbCut = Math.min((option.numbness ?? 0) + (option.style === 'flirty' ? NUMBNESS_PER_FLIRT : 0), room);
      if (numbCut > 0) {
        s.numbness = clamp(s.numbness + numbCut, 0, 100);
        s.numbnessToday += numbCut;
      }
      if (option.conscience) s.conscience = clamp(s.conscience + option.conscience, 0, 100);
      // 要钱的 setFlag 延后到 ask 分支：只有真拿到钱，故事 flag 才成立
      // （"拿到了周老师的存折"不能发生在她拒绝你的那一晚）。
      const pendingFlag = option.isAsk ? option.setFlag : null;
      if (option.setFlag && !option.isAsk) s.flags[option.setFlag] = true;
      advanceStage(t);

      s.chat.transcript.push({ speaker: 'player' as const, text: personaTextFor(option, s.personaId), stamp: nightStamp(def.activeHour, 10 + s.chat.transcript.length) });

      // Red-packet ask branch.
      if (option.isAsk) {
        s.stats.asksMade += 1;
        if (stageOrder(t.stage) < stageOrder(ASK_MIN_STAGE)) {
          s.stats.asksFailed += 1;
          t.wariness = clamp(t.wariness + ASK_FAIL_WARINESS, 0, 100);
          t.trust = clamp(t.trust - 6, 0, 100);
          s.chat.transcript.push({ speaker: 'target' as const, text: '（他愣了一下。）你这……跟我开这种玩笑？', stamp: nightStamp(def.activeHour, 12) });
          s.chat.transcript.push({ speaker: 'target' as const, text: '（他那天没再说晚安。）', stamp: nightStamp(def.activeHour, 13) });
          s.chat.awaiting = 'closed';
          s.chat.closingNote = '太急了。这种叔叔，要的是脸。';
          return s;
        }
        if (!walletReady(t)) {
          s.stats.asksFailed += 1;
          t.wariness = clamp(t.wariness + ASK_FAIL_WARINESS, 0, 100);
          // v4.3.3 修：没给过钱的人说不出"已经给过了"——那 3 天不是钱包冷却，是还不到开口的日子。
          pushBubbles(
            s.chat.transcript, 'target',
            t.timesPaid > 0 ? '（他这个月已经给过了。这次他很久没回。）' : '（他没接这个话。｜顿了很久，他说：还没到这个份上吧，丫头。）',
            nightStamp(def.activeHour, 12),
          );
          s.chat.awaiting = 'closed';
          s.chat.closingNote = t.timesPaid > 0 ? '同一个钱包挖得太快了。' : '还没到开口的日子。';
          return s;
        }
        const result = resolveAsk(s, def, t, option.askAmount);
        if (result.success) {
          if (pendingFlag) s.flags[pendingFlag] = true;
          t.wariness = clamp(t.wariness + ASK_SUCCESS_WARINESS, 0, 100);
          t.totalReceived += result.amount;
          t.timesPaid += 1;
          t.daysSincePaid = 0;
          s.money += result.amount;
          s.stats.totalEarned += result.amount;
          s.stats.redPacketsReceived += 1;
          s.stats.biggestPacket = Math.max(s.stats.biggestPacket, result.amount);
          s.ledger.push({ day: s.day, amount: result.amount, note: `${def.name} 的红包（${result.tierLabel}）`, kind: 'packet' });
          s.chat.transcript.push({ speaker: 'system' as const, label: `红包 +${result.amount} 元`, text: `（${result.tierLabel}）`, stamp: nightStamp(def.activeHour, 14) });
          // v4.2.1（S4）：开口选项若带手写场景反馈，用场景替代通用成功台词。
          // 此前主五人 6 组手写反馈是死数据——extra 里 replies:[] 压着，引擎也不读。
          // （场景文案已去掉写死金额，红包数由引擎按阶段照发——两边不再对不上。）
          const askScene = linesFor(option, s.personaId);
          if (askScene.length) {
            for (const r of askScene) pushBubbles(s.chat.transcript, 'target', r, nightStamp(def.activeHour, 15));
          } else if (result.line) {
            pushBubbles(s.chat.transcript, 'target', result.line, nightStamp(def.activeHour, 15));
          }
          // v4.1 红包来源字幕：到账即字幕——这笔钱在他的世界里是什么钱。
          // （他的世界：夜班多跑的单/复查的单子/车库的烟钱。不耗 RNG，按天轮换。）
          {
            const tier = packetTierOf(result.amount);
            const pool = PACKET_SOURCE_SUBTITLE[def.id]?.[tier] ?? PACKET_SOURCE_GENERIC[tier];
            s.chat.transcript.push({
              speaker: 'target' as const,
              text: pool[s.day % pool.length],
              stamp: nightStamp(def.activeHour, 16),
            });
          }
          // v4.0/4.1 代价呈现层：要到钱的那一刻，插进她心里的一帧——用的全是他
          // 人生线里的事（手头紧/退休金/老婆查账/包夜钱/机票钱）。按天轮换、
          // 不耗 RNG。第 8 天起才出现：代价感是随着月份深入才浮上来的。
          if (s.day >= 8) {
            const pool = ASK_COST_NARRATOR_V2[def.id] ?? ASK_COST_NARRATOR_GENERIC;
            s.chat.transcript.push({
              speaker: 'target' as const,
              text: pool[(s.day - 8) % pool.length],
              stamp: nightStamp(def.activeHour, 17),
            });
          }
          log(s, 'packet', `${def.name} 的红包：${result.amount} 元`);
        } else {
          s.stats.asksFailed += 1;
          t.wariness = clamp(t.wariness + ASK_FAIL_WARINESS, 0, 100);
          t.trust = clamp(t.trust - 4, 0, 100);
          if (result.line) pushBubbles(s.chat.transcript, 'target', result.line, nightStamp(def.activeHour, 14));
          log(s, 'ask_fail', `你试探着开了口，${def.name} 岔开了话题。`);
        }
        s.chat.awaiting = 'closed';
        s.chat.closingNote = result.success ? '今晚到此为止。' : '今晚不能再要了。';
        return s;
      }

      // Normal reply lines.
      const replies = linesFor(option, s.personaId);
      for (const r of replies) {
        pushBubbles(s.chat.transcript, 'target', r, nightStamp(def.activeHour, 16 + s.chat.transcript.length));
      }
      // v4.13.1：replies 叙述了他红包/转账的选项（autoPacket）→ 引擎同步落账——
      // 叙事说转多少，账本记多少。横幅/来源字幕/流水与 ask 红包同通路；他主动的，
      // 不吃 wariness，只按转账把 daysSincePaid 重置（同教学红包逻辑）。
      if (option.autoPacket) {
        const amt = option.autoPacket;
        t.wariness = clamp(t.wariness + ASK_SUCCESS_WARINESS * 0.5, 0, 100);
        t.totalReceived += amt;
        t.timesPaid += 1;
        t.daysSincePaid = 0;
        s.money += amt;
        s.stats.totalEarned += amt;
        s.stats.redPacketsReceived += 1;
        s.stats.biggestPacket = Math.max(s.stats.biggestPacket, amt);
        s.ledger.push({ day: s.day, amount: amt, note: `${def.name} 的红包（心意）`, kind: 'packet' });
        s.chat.transcript.push({ speaker: 'system' as const, label: `红包 +${amt} 元`, text: '（他主动的）', stamp: nightStamp(def.activeHour, 20) });
        const tier = packetTierOf(amt);
        const pool = PACKET_SOURCE_SUBTITLE[def.id]?.[tier] ?? PACKET_SOURCE_GENERIC[tier];
        s.chat.transcript.push({
          speaker: 'target' as const,
          text: pool[s.day % pool.length],
          stamp: nightStamp(def.activeHour, 21),
        });
        log(s, 'packet', `${def.name} 的红包：${amt} 元（他主动的，没人开口要过）`);
      }
      if (!isChain) {
        s.chat.awaiting = 'closed';
        // v4.4 他先找你的应答会话：收束旁白跟应答组走（他放下手机那一下），
        // 提示写明这场是「他为那句话来的」——今晚的话题圆了，就到这里。
        if (s.chat.fromIncoming) {
          const closingSet = incomingReplyFor(s.chat.topicIdOf);
          if (closingSet.closing) {
            s.chat.transcript.push({ speaker: 'target' as const, text: closingSet.closing, stamp: nightStamp(def.activeHour, 30 + s.chat.transcript.length) });
          }
          s.chat.closingNote = '他今晚就为那句话来的——说完了，他就去睡了。';
        } else {
          s.chat.closingNote = '今天聊完了。';
        }
      } else if (node) {
        // One story node per session — real people don't burn a whole
        // relationship arc in one sitting. Park the next node for tomorrow.
        if (node.next) t.pendingChain = node.next;
        s.chat.awaiting = 'closed';
        s.chat.closingNote = '他说"明天再聊"。';
      }
      // v4.3.1（审查 P1-3）教学红包的可见时刻：第一晚与老李的对话收尾，
      // 他收完车"顺了一单"——5.2 到账（数字写在横幅上，钱在 end_chat 落账）。
      // 放最后一条：他发完这句就去睡了，今晚到此为止。
      if (s.day === 1 && s.chat.targetId === 'lao_li' && !s.flags.tutorial_gift_seen) {
        s.flags.tutorial_gift_seen = true;
        const st = nightStamp(def.activeHour, 55);
        s.chat.transcript.push({ speaker: 'system' as const, label: '红包 +5.2 元', text: '（奶茶钱）', stamp: st });
        pushBubbles(s.chat.transcript, 'target', '夜班顺了一单。拿着，买块糖。｜别多想，叔叔钱多烧的。', st);
        s.chat.transcript.push({ speaker: 'target' as const, text: PACKET_SOURCE_SUBTITLE.lao_li?.small[0] ?? '（这笔钱，是他今晚多跑的单。）', stamp: nightStamp(def.activeHour, 56) });
      }
      return s;
    }

    case 'end_chat': {
      if (!s.chat) return s;
      const from = s.chat;
      const t = s.targets.find((x) => x.targetId === from.targetId);
      // v2.0：整场对话归档（聊天记录模块的数据源）。
      s.archives.push({ targetId: from.targetId, day: s.day, transcript: from.transcript });
      if (s.archives.length > ARCHIVE_CAP) s.archives.splice(0, s.archives.length - ARCHIVE_CAP);
      if (t) {
        if (from.awaiting === 'player') {
          t.pendingChain = from.pendingNodeId;
        }
      }
      const def = ALL_TARGET_MAP[from.targetId];
      s.chat = null;
      // Return to the phase we came from: a morning chat (退休老师/上午在线)
      // stays in morning; a night chat returns to the night roster.
      s.dayPhase = def && isMorningTarget(def) ? 'morning' : 'night';
      // v4.3.1（审查 P1-3）第一天收车后的教学红包：老李主动 5.2——让玩家在
      // 第一晚就见到"红包 +N 元"横幅、来源字幕和账本入账（爽感系统第一周
      // 开张）。他主动的，不算她开口：不落 wariness/trust 变动，只吃
      // daysSincePaid 重置（教学"钱包被挖过一次"这件事本身）。红线：带
      // 后果——来源字幕与 GIFT_NARRATOR 都在，只是这一天不吓她。
      if (s.day === 1 && from.targetId === 'lao_li' && t && !s.flags.tutorial_gift_done) {
        s.flags.tutorial_gift_done = true;
        t.totalReceived += 5.2;
        t.timesPaid += 1;
        t.daysSincePaid = 0;
        s.money += 5.2;
        s.stats.totalEarned += 5.2;
        s.stats.redPacketsReceived += 1;
        s.stats.biggestPacket = Math.max(s.stats.biggestPacket, 5.2);
        s.ledger.push({ day: s.day, amount: 5.2, note: '老李 的红包（奶茶钱）', kind: 'packet' });
        log(s, 'packet', '老李 的红包：5.2 元（他主动的，没人开口要过）', GIFT_NARRATOR.lao_li[0]);
      }
      return s;
    }

    case 'sleep': {
      s.dayPhase = 'morning';
      s.todayPlan = '';
      // v4.2 突发事件落锤：拖到睡觉没选 → "没接住"版后果照付（不处理也是一种处理）。
      if (s.pendingIncident && !s.incidentResolved) {
        const inc = INCIDENTS.find((i) => i.id === s.pendingIncident);
        if (inc) {
          const eff = inc.staleEffects ?? {};
          const t = eff.targetId ? s.targets.find((x) => x.targetId === eff.targetId) : null;
          if (t) {
            if (eff.trust) t.trust = clamp(t.trust + eff.trust, 0, 100);
            if (eff.wariness) t.wariness = clamp(t.wariness + eff.wariness, 0, 100);
          }
          if (eff.money) {
            s.money += eff.money;
            s.ledger.push({ day: s.day, amount: eff.money, note: inc.title, kind: 'event' });
          }
          if (eff.conscience) s.conscience = clamp(s.conscience + eff.conscience, 0, 100);
          if (eff.numbness) s.numbness = clamp(s.numbness + eff.numbness, 0, 100);
          if (eff.risk) s.riskLevel = clamp(s.riskLevel + eff.risk, 0, 100);
          if (eff.energy) s.energy = clamp(s.energy + eff.energy, 0, s.energyMax);
          log(s, 'incident', `${inc.title}——${inc.options[0].stale}`, '（这一天过去了。没接住的事，也算了结。）');
        }
      }
      s.pendingIncident = '';
      s.incidentResolved = false;
      // v4.1 收工账：今天进账的每一笔，长在谁的哪件事上——睡前一行。
      {
        const todaysIn = s.ledger.filter((l) => l.day === s.day && (l.kind === 'packet' || l.kind === 'gift'));
        if (todaysIn.length) {
          const byTarget = new Map<string, number>();
          for (const l of todaysIn) {
            const nm = l.note.split(' ')[0];
            if (!nm) continue;
            byTarget.set(nm, (byTarget.get(nm) ?? 0) + l.amount);
          }
          const names = [...byTarget.entries()].map(([n, amt]) => {
            const tdef = ALL_TARGETS.find((x) => x.name === n);
            const tag = (tdef && MONEY_HOME_TAGS[tdef.id]) || MONEY_HOME_GENERIC_TAG;
            return `${n}：${amt}（${tag}）`;
          });
          log(s, 'packet', `收工账——${names.join('；')}。今天进账的钱，在他们的账本上各有名字。`);
        }
      }
      // v2.0：一晚没聊（0 场对话）→ 麻木自然缓解一点。表演的伤，休息能缓，但缓得慢。
      if (s.targets.every((t) => t.lastChatDay !== s.day)) {
        s.numbness = clamp(s.numbness - NUMBNESS_REST_RECOVERY, 0, 100);
      }
      s.numbnessToday = 0;
      // v4.1 节奏日决策只能选一次：过夜即落锤（拖过今天 = 没选，机会过去）。
      s.pendingBeat = '';
      s.beatResolved = false;
      s.day += 1;
      if (s.day > s.daysLimit) {
        s.phase = 'ended';
        s.endingId = scoreEnding(s);
        return s;
      }
      runMorning(s);
      log(s, 'day', `第 ${s.day} 天。还差 ${Math.max(0, s.goal - s.stats.totalEarned)} 元。风险 ${Math.round(s.riskLevel)}%。`);
      // v3.1：新的一天——先弹简报（账单/事件/晨钟），确认后再进入计划列表。
      s.briefingDay = s.day;
      return s;
    }

    case 'toggle_pin': {
      // v4.1.2 名单置顶：把重要的老头钉到「今天」名单最顶（纯 UI 偏好，无代价）。
      // 后钉的排前面——最近置顶的人最显眼。
      const known = s.targets.find((t) => t.targetId === action.targetId && t.discoveredDay > 0);
      if (!known) return s;
      s.pinnedTargets = s.pinnedTargets.includes(action.targetId)
        ? s.pinnedTargets.filter((id) => id !== action.targetId)
        : [...s.pinnedTargets, action.targetId];
      return s;
    }

    case 'toggle_mute': {
      // v4.3.3 玩家拉黑（UI v4.13.2 起「免打扰」按钮统一叫「拉黑」）：可逆，与结局性的
      // blocked（他删了你）不同。拉黑不是删人（他不掉信任、不吃断联惩罚），只是她的世界
      // 单方面安静下来：他不再被主动推来，她的朋友圈他不再刷到，他的朋友圈她也看不到了。
      // 解除即恢复——代价是这期间的断联照常累积（他没等的话，也在过着）。
      const known = s.targets.find((t) => t.targetId === action.targetId && t.discoveredDay > 0);
      if (!known) return s;
      known.mutedByPlayer = !known.mutedByPlayer;
      if (known.mutedByPlayer) s.incoming = s.incoming.filter((m) => m.targetId !== action.targetId);
      const def = ALL_TARGET_MAP[action.targetId];
      log(s, 'flag', known.mutedByPlayer
        ? `你拉黑了 ${def?.handle ?? def?.name ?? '他'}。他的世界照旧，只是不再推到你眼前。`
        : `你解除了对 ${def?.handle ?? def?.name ?? '他'} 的拉黑。断联的日子照算——他没等的话，也在过着。`);
      return s;
    }

    case 'direct_ask': {
      // v4.1.2 主动要钱：绕开剧情链的直接开口——金额、理由都玩家自选。
      // 和「陪他说说话」同一套对话体验：真实聊天会话（耗一场精力、他先打招呼、
      // 她把话发出去、他当面答复、她还有一轮追问的选择权）。判定规则不变
      // 且比链上开口贵：概率打折、警惕涨更狠、金额越大越像冲钱来的。
      // 门槛与剧情链开口一致：认识的人、没拉黑、阶段 ≥ warming、钱包冷却完；
      // 门槛不达标照发也行——但和链上开口一样算一次开口、一样付冒犯的代价。
      const t = s.targets.find((x) => x.targetId === action.targetId);
      const def = ALL_TARGET_MAP[action.targetId];
      const reason = DIRECT_ASK_REASONS.find((r) => r.id === action.reasonId);
      if (!t || !def || t.blocked || t.mutedByPlayer || !t.discoveredDay) return s;
      if (!reason || !DIRECT_ASK_AMOUNTS.includes(action.amount as (typeof DIRECT_ASK_AMOUNTS)[number])) return s;
      if (s.dayPhase === 'chat' || s.energy < chatCost(s) || t.lastChatDay === s.day) return s;
      if (!targetAwake(def, s.dayPhase)) return s;

      // —— 会话成本与「一场对话」的账目（与 start_chat 完全同账）——
      t.lastChatDay = s.day;
      s.energy -= chatCost(s);
      s.dayPhase = 'chat';
      s.stats.nightsWorked += 1;
      applyAffinity(s, t, def);
      s.stats.asksMade += 1;

      const transcript: ChatMsg[] = [];
      const rng = makeRng(s.rngSeed);
      s.rngSeed = (s.rngSeed * 1664525 + 1013904223) >>> 0;
      const phaseLabel = def.activeHour >= 6 && def.activeHour <= 12 ? '上午' : '深夜';
      transcript.push({ speaker: 'system' as const, text: `和 ${def.name} 的${phaseLabel}对话`, stamp: nightStamp(def.activeHour, 0) });
      const lines = scriptFor(t.targetId).lines;
      const recent = t.recentGreetings ?? (t.recentGreetings = []);
      // 他先打招呼——完整复用 start_chat 的开场白分层（亲疏/警惕/断联），
      // 让这场"要钱的对话"读起来就是一场普通对话的前两秒。
      const greetPool =
        t.trust < GREETING_FAR_TRUST && lines.greeting_far?.length ? lines.greeting_far
        : t.wariness >= 50 && t.timesPaid > 0 && lines.wariness_high?.length ? lines.wariness_high
        : t.daysSilent >= 3 && lines.silent_warning?.length ? lines.silent_warning
        : t.trust >= GREETING_CLOSE_TRUST && lines.greeting_close?.length ? lines.greeting_close
        : lines.greeting;
      pushBubbles(transcript, 'target', fillProfileVars(pickFreshLine(rng, greetPool, '（他来了。）', recent), s), nightStamp(def.activeHour, 1));
      maybePushPhoto(t, rng, transcript, def.activeHour);

      // 她把要钱的话发出去（他收到的是一句人话，不是一条转账请求）。
      const sayText = reason.say.replace('{n}', String(action.amount));
      transcript.push({ speaker: 'player' as const, text: sayText, stamp: nightStamp(def.activeHour, 6) });

      const amountWariness = Math.min(12, Math.round(action.amount / DIRECT_ASK_AMOUNT_WARINESS_DIV));
      // 追问选项：成/败两套，ChainOption 形状 → pick_option 非链分支直接能跑。
      // （{n} 已在构造时替换成实际金额。）
      const followup = (fu: typeof DIRECT_ASK_FOLLOWUP_FAIL, pushyWariness: number): ChainOption[] => [
        { text: fu.texts.mild, style: 'caring', trust: 2, replies: fu.mildReplies },
        { text: fu.texts.pushy.replace('{n}', String(action.amount)), style: 'sweet', trust: -2, wariness: pushyWariness, numbness: 1, replies: fu.pushyReplies },
      ];
      const closeFailed = (note: string) => {
        s.chat = { targetId: t.targetId, transcript, pendingOptions: [], pendingNodeId: '', awaiting: 'closed', closingNote: note };
      };

      // —— 门槛一：还没混熟就开口（吓着他）——
      if (stageOrder(t.stage) < stageOrder(ASK_MIN_STAGE)) {
        s.stats.asksFailed += 1;
        t.wariness = clamp(t.wariness + ASK_FAIL_WARINESS, 0, 100);
        t.trust = clamp(t.trust - 6, 0, 100);
        pushBubbles(transcript, 'target', pickFreshLine(rng, DIRECT_ASK_OFFENDED, DIRECT_ASK_OFFENDED[0], recent), nightStamp(def.activeHour, 8));
        pushBubbles(transcript, 'target', '（他那天没再说晚安。）', nightStamp(def.activeHour, 9));
        closeFailed('太急了。这种叔叔，要的是脸。');
        log(s, 'ask_fail', `你跟还没混熟的 ${def.name} 直接开了口——他被这种话吓着了。他没接。`, '（这种叔叔，要的是脸。直接开口只会吓跑他。）');
        return s;
      }
      // —— 门槛二：同一个钱包挖两次（他开始算了）——
      if (!walletReady(t)) {
        s.stats.asksFailed += 1;
        t.wariness = clamp(t.wariness + ASK_FAIL_WARINESS, 0, 100);
        // v4.3.3 修：没给过钱的人说不出"已经给过了"——那 3 天不是钱包冷却，是还不到开口的日子。
        if (t.timesPaid > 0) {
          pushBubbles(transcript, 'target', pickFreshLine(rng, DIRECT_ASK_COOLDOWN, DIRECT_ASK_COOLDOWN[0], recent), nightStamp(def.activeHour, 8));
          closeFailed('同一个钱包挖得太快了。');
          log(s, 'ask_fail', `${def.name} 这个钱包刚开过——再张口就是同一个钱包挖两次。他很久没回。`, '（挖得太快了。他会开始算。）');
        } else {
          pushBubbles(transcript, 'target', '（他没接这个话。｜顿了很久，他说：还没到这个份上吧，丫头。）', nightStamp(def.activeHour, 8));
          closeFailed('还没到开口的日子。');
          log(s, 'ask_fail', `你跟 ${def.name} 开口要 ${formatMoney(action.amount)}——他没接。你们还没到聊这个的份上。`, '（话太重了。这种开口，隔三天才不吓人。）');
        }
        return s;
      }
      // —— 判定：成功率 = askChance 打 direct 折扣 × 狠理由加成 ——
      const chance = askChance(def, t) * DIRECT_ASK_CHANCE_MULT * (0.85 + reason.weight * 0.3);
      if (!rng.chance(chance)) {
        s.stats.asksFailed += 1;
        t.wariness = clamp(t.wariness + DIRECT_ASK_FAIL_WARINESS + amountWariness, 0, 100);
        t.trust = clamp(t.trust - 5, 0, 100);
        s.numbness = clamp(s.numbness + 2, 0, 100);
        // v4.3.3 修：翻车话术池里有一句"上次那笔你还没还"——他一分钱没给过的人
        // 说不出这句（讨不存在的债=穿帮）。没给过钱的人换用其余的翻车话术。
        const failPool = t.timesPaid > 0 ? DIRECT_ASK_FAIL_CHAT : DIRECT_ASK_FAIL_CHAT.filter((l) => !l.includes('上次那笔'));
        pushBubbles(transcript, 'target', pickFreshLine(rng, failPool, DIRECT_ASK_FAIL_CHAT[0], recent), nightStamp(def.activeHour, 8));
        s.chat = {
          targetId: t.targetId, transcript,
          pendingOptions: followup(DIRECT_ASK_FOLLOWUP_FAIL, DIRECT_ASK_FAIL_WARINESS),
          pendingNodeId: '', awaiting: 'player', closingNote: null,
        };
        log(s, 'ask_fail', `你跟 ${def.name} 开了口（${reason.label}，要 ${formatMoney(action.amount)}）——他没接。`, '（没有剧情铺到这里就开的口，最生硬。他记住了这个感觉。）');
        return s;
      }
      // —— 到账：与红包同账（totalReceived/timesPaid/ledger/stats），代价字幕跟上 ——
      t.wariness = clamp(t.wariness + DIRECT_ASK_SUCCESS_WARINESS + amountWariness, 0, 100);
      t.totalReceived += action.amount;
      t.timesPaid += 1;
      t.daysSincePaid = 0;
      s.money += action.amount;
      s.stats.totalEarned += action.amount;
      s.stats.redPacketsReceived += 1;
      s.stats.biggestPacket = Math.max(s.stats.biggestPacket, action.amount);
      s.numbness = clamp(s.numbness + 3, 0, 100);
      s.ledger.push({ day: s.day, amount: action.amount, note: `${def.name} 的转账（${reason.label}）`, kind: 'packet' });
      transcript.push({ speaker: 'system' as const, label: `转账 +${action.amount} 元`, text: `（${reason.label}）`, stamp: nightStamp(def.activeHour, 9) });
      pushBubbles(transcript, 'target', pickFreshLine(rng, DIRECT_ASK_SUCCESS_CHAT, DIRECT_ASK_SUCCESS_CHAT[0], recent), nightStamp(def.activeHour, 10));
      // v4.1 红包来源字幕：到账即字幕——这笔钱在他的世界里是什么钱。
      {
        const tier = packetTierOf(action.amount);
        const pool = PACKET_SOURCE_SUBTITLE[def.id]?.[tier] ?? PACKET_SOURCE_GENERIC[tier];
        transcript.push({ speaker: 'target' as const, text: pool[s.day % pool.length], stamp: nightStamp(def.activeHour, 11) });
      }
      // v4.0/4.1 代价呈现层：要到钱的那一刻，插进她心里的一帧。
      if (s.day >= 8) {
        const pool = ASK_COST_NARRATOR_V2[def.id] ?? ASK_COST_NARRATOR_GENERIC;
        transcript.push({ speaker: 'target' as const, text: pool[(s.day - 8) % pool.length], stamp: nightStamp(def.activeHour, 12) });
      }
      s.chat = {
        targetId: t.targetId, transcript,
        pendingOptions: followup(DIRECT_ASK_FOLLOWUP_SUCCESS, DIRECT_ASK_SUCCESS_WARINESS),
        pendingNodeId: '', awaiting: 'player', closingNote: null,
      };
      log(s, 'packet', `你跟 ${def.name} 开了口（${reason.label}）：${sayText}——他转了 ${formatMoney(action.amount)}。`);
      return s;
    }

    case 'resolve_beat': {
      // v4.1 节奏日决策：只能选一次，过夜即落锤。
      if (!s.pendingBeat || s.beatResolved) return s;
      const beat = WORLD_BEAT_BY_DAY[s.day];
      if (!beat || beat.id !== s.pendingBeat) return s;
      const opt = beat.options?.[action.optionIndex];
      if (!opt) return s;
      s.beatResolved = true;
      s.pendingBeat = '';
      if (opt.money) {
        s.money += opt.money;
        s.ledger.push({ day: s.day, amount: opt.money, note: beat.title, kind: 'event' });
      }
      if (opt.conscience) s.conscience = clamp(s.conscience + opt.conscience, 0, 100);
      if (opt.numbness) s.numbness = clamp(s.numbness + opt.numbness, 0, 100);
      if (opt.risk) s.riskLevel = clamp(s.riskLevel + opt.risk, 0, 100);
      if (opt.energy) s.energy = clamp(s.energy + opt.energy, 0, s.energyMax);
      if (opt.flag) s.flags[opt.flag] = true;
      log(s, 'beat', opt.after);
      return s;
    }

    case 'resolve_incident': {
      // v4.2 突发事件决策：只能选一次，过夜落"没接住"。
      if (!s.pendingIncident || s.incidentResolved) return s;
      const inc = INCIDENTS.find((i) => i.id === s.pendingIncident);
      if (!inc) return s;
      const opt = inc.options[action.optionIndex];
      if (!opt) return s;
      s.incidentResolved = true;
      const eff: Partial<IncidentOption> = opt;
      const t = eff.targetId ? s.targets.find((x) => x.targetId === eff.targetId) : null;
      if (t) {
        if (eff.trust) t.trust = clamp(t.trust + eff.trust, 0, 100);
        if (eff.wariness) t.wariness = clamp(t.wariness + eff.wariness, 0, 100);
      }
      if (eff.money) {
        s.money += eff.money;
        s.ledger.push({ day: s.day, amount: eff.money, note: inc.title, kind: 'event' });
      }
      if (eff.conscience) s.conscience = clamp(s.conscience + eff.conscience, 0, 100);
      if (eff.numbness) s.numbness = clamp(s.numbness + eff.numbness, 0, 100);
      if (eff.risk) s.riskLevel = clamp(s.riskLevel + eff.risk, 0, 100);
      if (eff.energy) s.energy = clamp(s.energy + eff.energy, 0, s.energyMax);
      if (eff.flag) s.flags[eff.flag] = true;
      log(s, 'incident', `${inc.title}——${opt.after}`);
      return s;
    }

    case 'set_persona': {
      // v4.11 变更人设：她换一个「人」来演。话术链（personaText/linesFor/剧情节点）
      // 全部动态读 s.personaId——即刻生效；他不看她后台，信任/警惕不动。
      // 同人设重复 set 是 no-op（不刷日志）。
      // v4.13：头像空间按人设划分（public/avatars/{personaId}/avatar-1..10），
      // 旧 avatarId 是旧人设空间里的序号，跨空间无意义 → 重置为新 #1（该人设默认脸）。
      if (!PERSONA_MAP[action.personaId]) return s;
      if (s.personaId === action.personaId) return s;
      const old = PERSONA_MAP[s.personaId];
      s.personaId = action.personaId;
      s.profile.avatarId = 1;
      const next = PERSONA_MAP[action.personaId];
      log(s, 'flag', `你卸下了「${old.name}」，换上「${next.name}」。声音的语气变了，人还是那些人。`);
      return s;
    }

    case 'retire': {
      s.phase = 'ended';
      s.endingId = scoreEnding(s);
      return s;
    }

    case 'continue_playing': {
      s.phase = 'main';
      s.dayPhase = 'morning';
      s.daysLimit = s.day + 10;
      return s;
    }

    // ---- 1.1.0 舒适圈（常用手机）----
    case 'switch_phone': {
      // 纯视图切换：工作手机 ↔ 常用手机。时间共用同一条轴线，他不看你后台，
      // 妈和男友也不看你后台——两个世界互不可见，只有你两头都在。
      s.comfort.active = !s.comfort.active;
      // 翻转计数：每次切机 +1，驱动两侧屏幕重挂载并重放"翻面"动画
      // （人设的翻转、角色的翻转、命运的翻转）。
      s.comfort.flipTick = (s.comfort.flipTick ?? 0) + 1;
      // 切机旁白走对比池（温情 vs 算计——按天轮换，不耗 RNG）。
      const contrast = s.comfort.active ? SWITCH_TO_COMFORT : SWITCH_TO_WORK;
      log(s, 'comfort', '你按下了电源键。', contrast[s.day % contrast.length]);
      if (s.comfort.active) s.comfort.unseenMoments = 0;
      return s;
    }

    case 'comfort_open_chat': {
      // 熟人聊天不耗体力——那是她的生活，不是生意。
      if (s.comfort.chat) return s;
      if (action.contactId === 'boyfriend' && s.comfort.blockedByBf) return s;
      openComfortChat(s, action.contactId);
      return s;
    }

    case 'comfort_pick': {
      pickComfortOption(s, action.optionIndex);
      return s;
    }

    case 'comfort_end_chat': {
      endComfortChat(s);
      return s;
    }

    case 'comfort_resolve_incoming': {
      resolveComfortIncoming(s, action.incomingId, action.accept);
      return s;
    }

    case 'comfort_post_moment': {
      postComfortMoment(s, action.kind);
      return s;
    }

    case 'comfort_react_moment': {
      reactComfortMoment(s, action.momentId, action.kind);
      return s;
    }

    case 'comfort_view_moments': {
      s.comfort.unseenMoments = 0;
      return s;
    }

    default:
      return s;
  }
}
