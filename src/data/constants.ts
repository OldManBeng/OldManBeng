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

/** ---- v2.0：精力与节奏 ----
 *  16/4 = 每天最多 4 场对话（白天 2 + 深夜 2），同时经营 4 条线才转得开。 */
export const ENERGY_MAX = 16;
export const CHAT_SESSION_COST = 4;

/** ---- v2.0：性格 × 老头原型 亲和矩阵 ----
 *  每场对话开场结算一次：trust 是信任漂移（可为负），wariness 是警惕漂移
 *  （可为负=更放心）。设计意图：没有万能人设——嘴甜能哄住疑心重的，
 *  却让渴望被仰视的觉得廉价；高冷勾住老板型，却把丧偶老师越推越远。 */
export interface TraitAffinity {
  trust: number;
  wariness: number;
}
export const TRAIT_ARCHETYPE_AFFINITY: Record<string, Partial<Record<string, TraitAffinity>>> = {
  // 嘴甜：对孤独系是糖，对要面子的生意人是掉价
  sweet_mouth: {
    divorced_driver: { trust: 2, wariness: 0 },
    widowed_teacher: { trust: 2, wariness: 0 },
    lonely_engineer: { trust: 1, wariness: 0 },
    married_boss: { trust: -1, wariness: 2 },
    cafe_owner_ninety: { trust: 0, wariness: 0 },
    // 库存 45 人（共享原型 key 同名扩展）
 
    // 库存 45 人原型（9 原型）：    night_guard: { trust: 1, wariness: 0 },
    designated_driver: { trust: 1, wariness: 0 },
    fisherman: { trust: 1, wariness: 0 },
    chess_uncle: { trust: 1, wariness: 1 },
    square_dancer: { trust: 1, wariness: 0 },
  },
  // 高冷：让疑心重的更放心（不粘人=不图钱），让情感依赖型的更焦虑
  cold_queen: {
    divorced_driver: { trust: -1, wariness: 2 },
    widowed_teacher: { trust: -2, wariness: 3 },
    lonely_engineer: { trust: 1, wariness: -2 },
    married_boss: { trust: 2, wariness: -1 },
    cafe_owner_ninety: { trust: 0, wariness: 1 },
 
    // 库存 45 人原型（9 原型）：    night_guard: { trust: -1, wariness: 2 },
    designated_driver: { trust: 0, wariness: 1 },
    fisherman: { trust: 0, wariness: 1 },
    chess_uncle: { trust: 0, wariness: 1 },
    square_dancer: { trust: -2, wariness: 2 },
  },
  // 直爽：工程师式好感（有事说事），文青式的则觉得你煞风景
  straight_shooter: {
    lonely_engineer: { trust: 2, wariness: -1 },
    widowed_teacher: { trust: 1, wariness: 0 },
    divorced_driver: { trust: 1, wariness: 0 },
    married_boss: { trust: 0, wariness: 1 },
    cafe_owner_ninety: { trust: -1, wariness: 0 },
 
    // 库存 45 人原型（9 原型）：    night_guard: { trust: 1, wariness: 0 },
    designated_driver: { trust: 1, wariness: 0 },
    fisherman: { trust: 2, wariness: -1 },
    chess_uncle: { trust: 1, wariness: 0 },
    square_dancer: { trust: 1, wariness: 0 },
  },
  // 软文艺：所有"孤独成诗"原型 +，但对生意人像外星语
  soft_artsy: {
    widowed_teacher: { trust: 2, wariness: 0 },
    lonely_engineer: { trust: 1, wariness: 0 },
    cafe_owner_ninety: { trust: 1, wariness: 0 },
    divorced_driver: { trust: 0, wariness: 1 },
    married_boss: { trust: -2, wariness: 2 },
 
    // 库存 45 人原型（9 原型）：    night_guard: { trust: 0, wariness: 1 },
    designated_driver: { trust: 0, wariness: 1 },
    fisherman: { trust: 1, wariness: 0 },
    chess_uncle: { trust: 1, wariness: 0 },
    square_dancer: { trust: 1, wariness: 0 },
  },
};

/** 自称年龄 × 情感缺口 亲和（每场 +1/-1 级别）。
 *  设计意图：谎报年龄本身是话术——报小了哄"想找女儿感觉"的人，
 *  报真实了让"渴望被仰视"的老板觉得"像个大人，能聊"。 */
export const AGE_NEED_AFFINITY: Record<string, Partial<Record<string, number>>> = {
  // daughter_figure 老头：越像"闺女辈"越加分；自称 32 反而像同龄网友
  '20': { daughter_figure: 1, desired: -1, listened_to: 0, respected: 0 },
  '24': { daughter_figure: 1, desired: 0, listened_to: 0, respected: 0 },
  '28': { daughter_figure: 0, desired: 1, listened_to: 0, respected: 0 },
  '32': { daughter_figure: -1, desired: 1, listened_to: 0, respected: 1 },
};

/** ---- v2.0：朋友圈自拍 → "他来找你" ----
 *  新照片发布后 3 天内，他主动私聊的概率/天（按情感缺口加权）。 */
export const SELFIE_LINGER_DAYS = 3;
/** 他主动来找你的基础日概率（叠加：断联天数、信任、缺口匹配）。 */
export const INCOMING_BASE_CHANCE = 0.45;
/** 一天最多攒几条"他来找你"（多了等于全员轰炸）。 */
export const INCOMING_DAILY_CAP = 2;
/** 归档容量上限（防止存档无限膨胀）。 */
export const ARCHIVE_CAP = 40;
/** 麻木日上限：一天演四场也不会一晚变机器人——麻痹是月的事，不是天的事。 */
export const NUMBNESS_DAILY_CAP = 8;
/** 麻木的自然缓解：一晚不聊天缓 -5（表演的伤，休息一晚能缓一点，但缓得慢）。
 *  设计意图：麻木是"表演亲密"的累积伤，满场演出 30 天 × 8/天 ≈ 必然 end_numb
 *  ——这是这门生意的结构性代价；但"歇一晚"是个真实的取舍：少挣一场的钱，
 *  换回 5 点麻木。连续歇能从麻木边缘爬回来，代价是月底账面更难看。 */
export const NUMBNESS_REST_RECOVERY = 5;
