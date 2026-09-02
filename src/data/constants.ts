/** Initial savings. */
export const START_MONEY = 350;

/** The hook: next month's online-loan instalment due — M1 win bar.
 *  Balance math (single target, 30 days): warming asks avg ~24元 ×2-3,
 *  trusted asks avg ~35元 ×3, harvest asks avg ~220元 ×5-6, plus one
 *  spontaneous 200 gift → a near-perfect run lands ~1400-1700. The goal
 *  sits exactly at the wire on purpose: a sloppy run lands end_broke,
 *  which is the dominant designed M1 ending for a reason. */
export const MONTHLY_GOAL = 1500;

/** One run lasts this many days; retire or keep grinding to the wire. */
export const DAYS_LIMIT = 30;

/** Nightly energy: every chat session costs this much. */
export const ENERGY_MAX = 10;
export const CHAT_SESSION_COST = 4;

/** Trust/wariness drift, GL2-style per-turn decay.
 *  Wariness decays 6/day so recovery is a real tactic: after one failed
 *  ask (+16) or a success (+18), ~3 quiet days make him receptive again. */
export const TRUST_DECAY_PER_DAY = 2;
export const WARINESS_DECAY_PER_DAY = 6;
export const SILENT_TRUST_PENALTY = 4;
export const CLINGY_SILENT_MULTIPLIER = 2;
/** Every successful ask bakes wariness in; failed asks bake slightly more. */
export const ASK_SUCCESS_WARINESS = 18;
export const ASK_FAIL_WARINESS = 16;

/** Trust stage gates. */
export const STAGE_TRUST = { warming: 20, trusted: 50, harvest: 75 } as const;

/** Red-packet ask probability = BASE + trust×RATE − wariness×RATE2.
 *  At trust 80 / wariness 30: 0.25 + 0.40 − 0.15 = 0.50.
 *  Wariness above his personal threshold OR the global ceiling aborts the roll. */
export const ASK_BASE = 0.25;
export const ASK_TRUST_RATE = 0.5;
export const ASK_WARINESS_RATE = 0.5;
/** Absolute wariness ceiling for any ask. */
export const ASK_WARINESS_CEILING = 60;
/** Deeply lonely targets are easier marks. */
export const LONELINESS_ASK_BONUS = 0.1;

/** Wallet cooldown after a successful ask (he's a driver, not an ATM). */
export const WALLET_COOLDOWN_DAYS = 3;

/** Packet size ladder by relationship stage — 蚂蚁搬家 growing into 心意.
 *  Weighted averages: warming ~24元, trusted ~35元, harvest ~220元. */
export interface PacketTier {
  min: number;
  max: number;
  weight: number;
  label: string;
}

export const PACKET_TIERS: Record<'warming' | 'trusted' | 'harvest', PacketTier[]> = {
  warming: [
    { min: 10, max: 20, weight: 70, label: '奶茶钱' },
    { min: 20, max: 50, weight: 30, label: '奶茶钱' },
  ],
  trusted: [
    { min: 10, max: 30, weight: 30, label: '奶茶钱' },
    { min: 50, max: 88, weight: 70, label: '零花钱' },
  ],
  harvest: [
    { min: 88, max: 131, weight: 45, label: '零花钱' },
    { min: 150, max: 200, weight: 35, label: '零花钱' },
    { min: 300, max: 520, weight: 20, label: '心意' },
  ],
};

/** Asks before 'trusted' stage auto-fail — he's not that kind of 叔叔 yet. */
export const ASK_MIN_STAGE = 'warming';

/** Monthly bills, pro-rated daily in the engine. */
export const BILLS = [
  { name: '房租（单间）', amount: 900 },
  { name: '手机话费+流量', amount: 60 },
  { name: '美颜相机会员', amount: 25 },
  { name: '伙食（省着吃）', amount: 600 },
];

/** Morning-online window (retired targets active 06:00–12:00). */
export const MORNING_HOUR_MAX = 12;

/** Numbness grows on performed-intimacy options; feeds endings. */
export const NUMBNESS_PER_FLIRT = 4;

/** ---- 朋友圈穿帮风险（M2） ----
 *  Risk accumulates per extra ACTIVE relationship (warming+) each day and
 *  decays only when running a single line. At >=40% an exposure event can
 *  fire each morning (25%/day): one victim's wariness spikes, everyone gets
 *  +6. Design intent: two steady marks ≈ +7/day net, three ≈ +14/day —
 *  "多线经营" pays better but burns the whole book in ~a week. */
export const RISK_PER_ACTIVE_RELATION = 7;
export const RISK_DECAY_PER_DAY = 10;
export const RISK_EVENT_CHANCE = 0.25;
export const RISK_EXPOSE_WARINESS = 30;

/** ---- 产业化分支（M3）----
 *  姐妹的"课程"：一次性买断，之后每个早上代聊群替你维护一个老头
 *  （信任+5、断联清零），但话术全网共用——风险每天+3，麻木每天+2。
 *  设计意图：买课用钱换精力，代价是"手作"变"流水线"——判决书结局的入口。 */
export const INDUSTRY_COURSE_COST = 300;
export const INDUSTRY_MAINTAIN_TRUST = 5;
export const INDUSTRY_RISK_PER_DAY = 3;
export const INDUSTRY_NUMBNESS_PER_DAY = 2;
/** 产业化结局门槛：接了课 + 开口次数（业务量做起来了才会被卷进去）。 */
export const VERDICT_ASK_THRESHOLD = 8;

/** Persona × Need match matrix (GL2 typeMatch pattern). */
export const PERSONA_NEED_MATCH: Record<string, Record<string, number>> = {
  femme_fatale: { listened_to: 0.6, desired: 2, daughter_figure: 0.3, respected: 1 },
  sweet_daughter: { listened_to: 1, desired: 0.3, daughter_figure: 2, respected: 0.6 },
  wise_sister: { listened_to: 2, desired: 0.6, daughter_figure: 1, respected: 1.4 },
  artistic_soul: { listened_to: 1.4, desired: 1, daughter_figure: 0.6, respected: 2 },
};

/** events.ts / scripts.ts line maps allow a `default` key fallback. */
export type LineVariantMap = Partial<Record<string, string[]>>;
