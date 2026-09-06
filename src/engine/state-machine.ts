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
import { makeRng } from '../utils/random';
import { nightStamp } from '../utils/format';
import {
  clamp, replyMultiplier, applyOptionToTrust, resolveAsk, walletReady,
} from './chat';
import { DAILY_PLANS } from '../data/plans';
import { ALL_TARGETS, LIBRARY_IDS, libraryTargetById } from '../data/target-library';
import { ARCHETYPE_PACKS } from '../data/archetype-packs';
import {
  MOMENT_CAPTIONS, MOMENT_EFFECT, MOMENT_REACTIONS, MOMENT_SUSPICION, MOMENT_SUSPICION_EFFECT,
  MOMENT_PLAYER_COMMENTS, MOMENTS_CAP, targetMomentPosts, hasReacted, SELFIE_REACTIONS,
  MOMENT_REACTIONS_FAR, MOMENT_REACTIONS_CLOSE,
} from '../data/moments';
import { SHOP_ITEMS } from '../data/items';
import { DAILY_GATHAS, TRIGGER_GATHAS } from '../data/gathas';
import {
  LIFE_BY_TARGET, LIFE_DAILY_CAP, ASK_COST_NARRATOR, ASK_COST_NARRATOR_GENERIC,
} from '../data/life-events';
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
  PERSONA_NEED_MATCH, PERSONA_SESSION_TRUST, PERSONA_SESSION_WARINESS,
  RECALL_CHANCE, GREETING_CLOSE_TRUST, GREETING_FAR_TRUST, PERSONA_GREET_TRUST,
} from '../data/constants';

export const TARGET_MAP: Record<string, Target> = Object.fromEntries(TARGETS.map((t) => [t.id, t]));
/** v2.0：含老头库的全量映射。 */
export const ALL_TARGET_MAP: Record<string, Target> = Object.fromEntries(ALL_TARGETS.map((t) => [t.id, t]));
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

/** v2.0：女主默认自设资料。 */
export function defaultProfile(): GameState['profile'] {
  return { avatarId: 1, ageClaim: 24, traitId: 'sweet_mouth', selfieId: 'bestie', selfieDay: 0 };
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

/** v2.0：话术里的 {selfie}/{age}/{trait} 占位符——他的台词会念到你的资料。 */
export const SELFIE_LABEL: Record<string, string> = {
  bestie: '那张闺蜜照', gym: '夜跑那几张', pool: '泳池照', cat: '那只橘猫',
  grind: '加班那几张', travel: '旅游照', boba: '那杯奶茶', sick: '输液那几张',
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
 *  3. 空段不产出。 */
function pushBubbles(transcript: ChatMsg[], speaker: ChatMsg['speaker'], raw: string, stamp: string): number {
  const clean = raw.replace(/^（\d{1,2}:\d{2}）\s*/, '');
  let n = 0;
  for (const seg of clean.split('｜')) {
    const t = seg.trim();
    if (t) { transcript.push({ speaker, text: t, stamp }); n += 1; }
  }
  return n;
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
  transcript.push({
    speaker: 'target' as const,
    photoId: photos[idx],
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

/** Morning-online targets: 06:00–12:00. Late-night targets (activeHour < 6)
 *  count as night — an hour of 1:00 must never land in the morning roster. */
export function isMorningTarget(def: Target): boolean {
  return def.activeHour >= 6 && def.activeHour <= MORNING_HOUR_MAX;
}

/** A target is reachable during the current dayPhase by his active hour. */
export function targetAwake(def: Target, dayPhase: GameState['dayPhase']): boolean {
  if (dayPhase === 'night' || dayPhase === 'chat') return def.activeHour >= 20 || def.activeHour < 6;
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
  const dailyBills = BILLS.reduce((s, b) => s + b.amount, 0) / 30;
  state.money -= dailyBills;
  state.ledger.push({ day: state.day, amount: -Math.round(dailyBills), note: '房租/话费/会员/伙食（日摊）', kind: 'bill' });
  log(state, 'bill', `今日开销 ${Math.round(dailyBills)} 元（房租/话费/会员/伙食摊到每天）`);

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
      log(state, 'packet', `早上醒来，${def?.name ?? '他'} 转了你 ${gift} 元。没有人开口要过这笔钱。`);
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
  state.incoming = state.incoming.filter((m) => state.day - m.day <= 1);
  while (state.incoming.length > INCOMING_DAILY_CAP) state.incoming.shift();
  let madeToday = 0;
  const selfieFresh = state.day - state.profile.selfieDay <= SELFIE_LINGER_DAYS && state.profile.selfieDay > 0;
  for (const t of state.targets) {
    t.pingedToday = false;
    if (t.blocked || t.ended || !t.discoveredDay) continue;
    const def = ALL_TARGET_MAP[t.targetId];
    if (!def) continue;
    if (state.incoming.length >= INCOMING_DAILY_CAP) break;
    let p = 0.08; // 想你了的基础
    if (selfieFresh) p += INCOMING_BASE_CHANCE * (def.need === 'daughter_figure' || def.need === 'desired' ? 1 : 0.5);
    if ((state.inventory.retouch ?? 0) > 0) p += 0.1; // v2.3：修图会员——照片更"真"
    if (t.trust >= 50) p += 0.1;
    if (t.daysSilent >= 3) p += 0.2; // 断联的人憋不住了
    if (t.daysSincePaid >= 5 && t.trust >= 40) p += 0.15; // 发工资的日子
    if (rng.chance(p)) {
      const script = scriptFor(t.targetId);
      const inc = script.incoming;
      let reason: 'selfie' | 'missed_you' | 'wallet_open' = 'missed_you';
      let pool = inc?.missed_you ?? ['（他发来一条消息。）'];
      if (selfieFresh && inc?.on_selfie?.length) { reason = 'selfie'; pool = inc.on_selfie; }
      else if (t.daysSincePaid >= 5 && inc?.wallet_open?.length) { reason = 'wallet_open'; pool = inc.wallet_open; }
      state.incoming.push({
        targetId: t.targetId,
        day: state.day,
        reason,
        // v3.2：进场白也跨场去重——同一句"就是想你了"不连着来。
        opener: fillProfileVars(pickFreshLine(rng, pool, '（他发来一条消息。）', t.recentIncoming ?? (t.recentIncoming = [])), state),
        stamp: nightStamp(def.activeHour, rng.int(0, 25)),
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
    const reactors = state.targets.filter((t) => !t.blocked && !t.ended && t.discoveredDay > 0);
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
        });
        t.pingedToday = true;
        while (state.incoming.length > INCOMING_DAILY_CAP) state.incoming.shift();
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
    const posts = targetMomentPosts(poster.targetId);
    const pick = posts.length ? rng.pick(posts) : null;
    if (def && pick) {
      state.moments.push({
        id: `t${poster.targetId}_${state.day}`,
        momentDay: state.day,
        author: 'target',
        targetId: poster.targetId,
        photoId: pick.photoId,
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
  state.energy = state.energyMax;
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
  if (state.targets.every((t) => t.blocked)) return 'end_caught';
  if (state.flags.li_confessed) return 'end_confessed';
  if (state.flags.li_lied_final) return 'end_lied';
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
      s.energyMax = ENERGY_MAX;
      s.money = START_MONEY;
      s.riskLevel = 0;
      s.numbness = 0;
      s.conscience = 50;
      s.stats = { totalEarned: 0, redPacketsReceived: 0, asksMade: 0, asksFailed: 0, nightsWorked: 0, biggestPacket: 0 };
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
      if (action.avatarId !== undefined) s.profile.avatarId = clamp(action.avatarId, 1, 6);
      if (action.ageClaim) s.profile.ageClaim = action.ageClaim;
      if (action.traitId) s.profile.traitId = action.traitId;
      return s;
    }

    case 'post_moment': {
      // v2.3：发一条朋友圈自拍——一天一条（新照片三天内他会更主动来找你）。
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
        caption: rng.pick(captions),
        likes: [] as string[],
        comments: [] as import('../types/game').MomentComment[],
      };
      s.moments.push(post);
      if (s.moments.length > MOMENTS_CAP) s.moments.splice(0, s.moments.length - MOMENTS_CAP);
      s.profile.selfieId = action.selfieId;
      s.profile.selfieDay = s.day;
      log(s, 'flag', `你发了条朋友圈：${SELFIE_LABEL[action.selfieId] ?? '一张自拍'}。明早他们会来看的。`);
      // v3.1：刚发的圈，此刻在线的人会立刻刷到——最多两个反应，朋友圈是活的。
      // 起疑线同样生效（疑心重的人当场就会来翻）；hasReacted 保证不与早晨浪潮重复。
      let instant = 0;
      for (const t of s.targets) {
        if (instant >= 2) break;
        if (t.blocked || t.ended || !t.discoveredDay) continue;
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
        const pool = MOMENT_PLAYER_COMMENTS[def.need] ?? ['（你点了赞。）'];
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
      if (!t || !def || t.blocked || s.energy < chatCost(s)) return s;
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
      const lines = scriptFor(t.targetId).lines;
      const chainNode = t.discoveredDay === 1 ? pickChainNode(s, def, t) : null;
      const pack = chainNode ? null : pickPack(s, t, def);
      const freeNode = chainNode || pack ? null : pickFreeNode(s, def, t);
      const node = chainNode ?? pack ?? freeNode;
      const transcript: ChatMsg[] = [];
      const phaseLabel = def.activeHour >= 6 && def.activeHour <= 12 ? '上午' : '深夜';
      transcript.push({ speaker: 'system' as const, text: `和 ${def.name} 的${phaseLabel}对话（他先找的你）`, stamp: msg.stamp });
      pushBubbles(transcript, 'target', fillProfileVars(msg.opener, s), msg.stamp);
      if (t.wariness >= 50 && t.timesPaid > 0) {
        pushBubbles(transcript, 'target', pickVaryLine(rng01(s), lines.wariness_high, '（他回得越来越慢。）', { val: -1 }), nightStamp(def.activeHour, 5));
      }
      if (node) {
        for (const opener of node.openers) {
          transcript.push({ speaker: 'target' as const, text: fillProfileVars(opener, s), stamp: nightStamp(def.activeHour, 6 + transcript.length) });
        }
        maybePushPhoto(t, rng01(s), transcript, def.activeHour);
        s.chat = {
          targetId: t.targetId,
          transcript,
          pendingOptions: node.options,
          pendingNodeId: chainNode ? chainNode.id : '',
          awaiting: 'player',
          closingNote: null,
        };
        if (chainNode) t.pendingChain = chainNode.next;
      } else {
        transcript.push({ speaker: 'target' as const, text: '（他今天就想说这么多。）', stamp: nightStamp(def.activeHour, 9) });
        s.chat = { targetId: t.targetId, transcript, pendingOptions: [], pendingNodeId: '', awaiting: 'closed', closingNote: null };
      }
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
      if (!t || !def || t.blocked || s.energy < chatCost(s)) return s;
      if (!targetAwake(def, s.dayPhase)) return s;
      // 一个人一天只聊一场：重复刷同一个老头没有额外收益——
      // 多线经营是这门生意的本质，也是风险的来源。
      if (t.lastChatDay === s.day) return s;
      t.lastChatDay = s.day;
      s.energy -= chatCost(s);
      s.dayPhase = 'chat';
      s.stats.nightsWorked += 1;
      const lines = scriptFor(t.targetId).lines;
      // v2.0：亲和结算——profile 性格/年龄 × 他的原型/缺口，先漂移再选话术。
      applyAffinity(s, t, def);
      // v3.0：话术优先级 = 剧情节点 > 闲聊组（60套，去重轮换）> 空闲节点 > 两句话。
      // 老头库目标没有剧情链，直接走话术组。
      const chainNode = t.discoveredDay === 1 ? pickChainNode(s, def, t) : null;
      const prevTopic = t.lastTopic; // v3.0：pickPack 会覆盖 lastTopic，先留住昨晚的
      const pack = chainNode ? null : pickPack(s, t, def);
      const freeNode = chainNode || pack ? null : pickFreeNode(s, def, t);
      const node = chainNode ?? pack ?? freeNode;
      const transcript = [];
      const rng = makeRng(s.rngSeed);
      s.rngSeed = (s.rngSeed * 1664525 + 1013904223) >>> 0;
      const phaseLabel = def.activeHour >= 6 && def.activeHour <= 12 ? '上午' : '深夜';
      transcript.push({ speaker: 'system' as const, text: `和 ${def.name} 的${phaseLabel}对话`, stamp: nightStamp(def.activeHour, 0) });
      // 近 3 条开场白原文去重（问候/警示/断联共用一个"最近说过"列表，谁说过谁让路）。
      const recent = t.recentGreetings ?? (t.recentGreetings = []);
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
      if (!chainNode && prevTopic && lines.recall?.length && rng.chance(RECALL_CHANCE)) {
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
          pendingNodeId: chainNode ? chainNode.id : '',
          awaiting: 'player',
          closingNote: null,
        };
        if (chainNode) t.pendingChain = chainNode.next;
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
          s.chat.transcript.push({ speaker: 'target' as const, text: '（他这个月已经给过了。这次他很久没回。）', stamp: nightStamp(def.activeHour, 12) });
          s.chat.awaiting = 'closed';
          s.chat.closingNote = '同一个钱包挖得太快了。';
          return s;
        }
        const result = resolveAsk(s, def, t);
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
          if (result.line) pushBubbles(s.chat.transcript, 'target', result.line, nightStamp(def.activeHour, 15));
          // v4.0 代价呈现层：要到钱的那一刻，插进她心里的一帧——用的全是他
          // 人生线里的事（手头紧/退休金/老婆查账/包夜钱/机票钱）。按天轮换、
          // 不耗 RNG。第 8 天起才出现：代价感是随着月份深入才浮上来的。
          if (s.day >= 8) {
            const pool = ASK_COST_NARRATOR[def.id] ?? ASK_COST_NARRATOR_GENERIC;
            s.chat.transcript.push({
              speaker: 'target' as const,
              text: pool[(s.day - 8) % pool.length],
              stamp: nightStamp(def.activeHour, 16),
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
      if (!isChain) {
        s.chat.awaiting = 'closed';
        s.chat.closingNote = '今天聊完了。';
      } else if (node) {
        // One story node per session — real people don't burn a whole
        // relationship arc in one sitting. Park the next node for tomorrow.
        if (node.next) t.pendingChain = node.next;
        s.chat.awaiting = 'closed';
        s.chat.closingNote = '他说"明天再聊"。';
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
      return s;
    }

    case 'sleep': {
      s.dayPhase = 'morning';
      s.todayPlan = '';
      // v2.0：一晚没聊（0 场对话）→ 麻木自然缓解一点。表演的伤，休息能缓，但缓得慢。
      if (s.targets.every((t) => t.lastChatDay !== s.day)) {
        s.numbness = clamp(s.numbness - NUMBNESS_REST_RECOVERY, 0, 100);
      }
      s.numbnessToday = 0;
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

    default:
      return s;
  }
}
