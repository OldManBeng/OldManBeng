/**
 * 舒适圈人物设定 + 平衡常量（第二阶段 1.1.0）。
 *
 * 常用手机里住着三个人：过世的父亲（置灰的纪念）、家政公司的妈、
 * 游手好闲的同居男友。小满在这里素颜。
 */
import type { ComfortState } from '../types/comfort';

/** 父亲——几年前过世，通讯录置灰。他的存在是一行纪念日和一张旧照。 */
export interface ComfortContact {
  id: 'mother' | 'boyfriend';
  name: string;
  handle: string;          // 微信昵称
  age: number;
  avatarKey: 'mother' | 'boyfriend';
  signature: string;
  bio: string;
}

export const COMFORT_CONTACTS: Record<'mother' | 'boyfriend', ComfortContact> = {
  mother: {
    id: 'mother',
    name: '王秀兰',
    handle: '妈',
    age: 55,
    avatarKey: 'mother',
    signature: '日子往前看，人要好好吃饭',
    bio: '五年前爸走后，家里的天塌了一半。她先是在超市理货，去年进了家政公司做保洁——东家换了一个又一个，唯独每天晚上的那通语音从不缺席。她不知道小满在外面做什么，只当女儿在大城市上班忙。',
  },
  boyfriend: {
    id: 'boyfriend',
    name: '阿凯',
    handle: '凯凯',
    age: 27,
    avatarKey: 'boyfriend',
    signature: '代练接单 · 私聊 · 带上分',
    bio: '小满的同居男友。不上班，自称"灵活就业"，主业是打游戏——在游戏里扮成温柔体贴的年轻男人，哄中老年女性玩家刷礼物，圈里管这叫"崩阿姨"。他管这叫生意，对小满甜言蜜语，对房租熟视无睹。缺钱的时候，甜言蜜语会换一副面孔。',
  },
};

/** 父亲（通讯录置灰位——点开是一段纪念，不能聊天）。 */
export const FATHER_MEMORIAL = {
  name: '老周',
  handle: '爸',
  avatarKey: 'father' as const,
  signature: '（长期离线）',
  bio: '小满的父亲。货运司机，跑了半辈子长途，五年前心梗走在了路上——手机里最后一条消息是发给小满的：「到了给你打电话」。通讯录里这行灰色的名字，小满一直没舍得删。',
  /** 纪念日：这天早晨常用手机会多一行（忌日）。 */
  memorialDay: 17,
  memorialLine: '今天是爸的忌日。五年了。你在工作手机的日历上忘了这件事，常用手机的这行字替你记着。',
};

/** 小满——本名口径：农历小满那天出生，所以叫小满。素颜一般，化妆后小美；
 *  对男朋友恋爱脑——这正是舒适圈存在的理由：她在工作手机上演别人，
 *  在常用手机上把真的自己，交给一个不值得的人。 */
export const XIAOMAN = {
  name: '小满',
  avatarKey: 'xiaoman' as const,
  plainNote: '素颜的她：马尾，眼镜，皮肤一般。化妆后是小美——工作手机里的那十张脸，都不是她。',
  birthNote: '农历小满那天出生——妈说，那天麦子正好灌浆。',
  /** 生日落在游戏第 21 天（农历小满节气的日子）。 */
  birthdayDay: 21,
};

/** ---- 舒适圈平衡常量 ---- */

/** 初始关系值：恋爱脑的小满给男友的起点分远高于给妈的。 */
export const COMFORT_FAMILY_START = 72;
export const COMFORT_LOVE_START = 82;

/** 妈的生活费：家政零工的钱，一次 150-300。 */
export const MOM_GIFT_MIN = 150;
export const MOM_GIFT_MAX = 300;
/** 妈的生活费节奏：每 3-5 天一次机会（冷却是"她刚结过工资"，不是抠）。 */
export const MOM_GIFT_GAP_MIN = 3;
export const MOM_GIFT_GAP_MAX = 5;
/** 首次生活费最早出现的日子（第 1 天留给主线教学）。 */
export const MOM_GIFT_FIRST_DAY = 3;
/** 家庭关系低于此值：妈寒了心/信了你的"我过得很好"，不再主动打钱。 */
export const MOM_GIFT_FAMILY_FLOOR = 30;

/** 男友红包：他"崩阿姨"的小钱分你一半，52-188。 */
export const BF_PACKET_MIN = 52;
export const BF_PACKET_MAX = 188;
export const BF_PACKET_GAP_MIN = 4;
export const BF_PACKET_GAP_MAX = 6;
export const BF_PACKET_FIRST_DAY = 2;
/** 感情低于此值：他连红包都懒得发了。 */
export const BF_PACKET_LOVE_FLOOR = 25;

/** 男友要钱：200-600，从活命钱扣，扣不动的部分记到债上。 */
export const BF_DEMAND_MIN = 200;
export const BF_DEMAND_MAX = 600;
export const BF_DEMAND_GAP = 5;
/** 感情越凉他伸手越勤（要钱是威胁的前奏）。 */
export const BF_DEMAND_GAP_COLD = 3;
export const BF_DEMAND_COLD_LOVE = 60;
export const BF_DEMAND_FIRST_DAY = 6;

/** 拒绝要钱的连锁：累计拒绝 ≥2 次 或 感情 < 25 时再拒绝 → 分手+卷钱+拉黑。 */
export const BF_BREAKUP_REFUSES = 2;
export const BF_BREAKUP_LOVE = 25;
/** 未达分手线的拒绝：报复判定——35% 举报（穿帮风险+25），举报里再 55% 警察上门。 */
export const BF_REVENGE_REPORT_CHANCE = 0.35;
export const BF_REPORT_RISK = 25;
export const BF_POLICE_CHANCE = 0.55;
/** 给钱的关系收益与代价（给 = 息事宁人；麻木的另一种形状）。 */
export const BF_DEMAND_LOVE_GIVE = 6;
export const BF_DEMAND_LOVE_REFUSE = -12;
export const BF_PACKET_LOVE_TAKE = 3;
export const BF_PACKET_LOVE_REFUSE = -8;
export const MOM_GIFT_FAMILY_TAKE = 4;
export const MOM_GIFT_FAMILY_REFUSE = -6;

/** 一次性剧情锚：第 14 天男友深夜的"真心话"（分手伏笔的种子）。
 *  当天聊天没空档就顺延（最多等 3 天），不丢。 */
export const BF_OMEN_DAY = 14;
export const BF_OMEN_GRACE = 3;
export const BF_OMEN_PACK = 'bf_omen';

/** ---- 嘘寒问暖（纯聊天卡）：关心比转账勤——这才是"经常关心"的本义 ----
 *  妈每 2-3 天总有一句"吃了没"；阿凯每 3-5 天一句甜言蜜语。
 *  回 = 原样开一场那套话术的免费聊天；不回 = 关系小扣（消息是要还的）。 */
export const MOM_TALK_FIRST_DAY = 2;
export const MOM_TALK_GAP_MIN = 2;
export const MOM_TALK_GAP_MAX = 3;
export const MOM_TALK_FAMILY_FLOOR = 15;
export const BF_TALK_FIRST_DAY = 2;
export const BF_TALK_GAP_MIN = 3;
export const BF_TALK_GAP_MAX = 5;
export const BF_TALK_LOVE_FLOOR = 25;
export const TALK_IGNORE_FAMILY = -2;
export const TALK_IGNORE_LOVE = -2;

/** 小满生日（农历小满，第 21 天）：妈一定记得；阿凯看感情——这一天把"家"和"他"称出斤两。 */
export const XIAOMAN_BIRTHDAY_DAY = XIAOMAN.birthdayDay;
export const XIAOMAN_BIRTHDAY_GIFT = 200;
export const XIAOMAN_BIRTHDAY_PACKET = 21;
/** 感情 ≥ 此值，阿凯才记得你生日。 */
export const BF_BIRTHDAY_REMEMBER_LOVE = 55;

/** 舒适圈聊天归档容量（防存档膨胀）。 */
export const COMFORT_ARCHIVE_CAP = 40;
/** 朋友圈容量。 */
export const COMFORT_MOMENTS_CAP = 30;
/** 待处理事件卡上限（一天最多攒到这么多）。 */
export const COMFORT_INCOMING_CAP = 3;

/** 舒适圈状态初值。 */
export function freshComfortState(): ComfortState {
  return {
    active: false,
    family: COMFORT_FAMILY_START,
    love: COMFORT_LOVE_START,
    bfState: 'normal',
    blockedByBf: false,
    momGift: { lastDay: 0, count: 0 },
    bfPacket: { lastDay: 0, count: 0 },
    bfDemand: { lastDay: 0, count: 0, refuses: 0 },
    momTalk: { lastDay: 0, count: 0 },
    bfTalk: { lastDay: 0, count: 0 },
    momGiven: 0,
    momRefused: 0,
    bfGiven: 0,
    bfRefused: 0,
    bfTaken: 0,
    incoming: [],
    chat: null,
    storyDone: [],
    archives: [],
    recentPacks: { mother: [], boyfriend: [] },
    moments: [],
    unseenMoments: 0,
    policeDay: 0,
  };
}
