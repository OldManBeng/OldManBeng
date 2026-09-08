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
  | 'lonely_engineer'   // 独居老工程师
  // ---- v2.0 老头库：4 个新原型（45 人库按这些扩展）----
  | 'night_guard'       // 小区夜班保安：话说三句，烟买两包
  | 'designated_driver' // 代驾师傅：折叠电动车、烧烤摊、听了一车醉话
  | 'fisherman'         // 钓友大叔：水库、鱼护、永远差一根竿
  | 'chess_uncle'       // 棋摊大爷：悔棋、观棋、输棋骂孙子
  | 'square_dancer'     // 广场舞大爷：音响、领队阿姨、腰不好

/** v2.2：头像背景场景类型——决定 SVG 背景图层。 */
export type BgScene =
  | 'night_road'      // 深夜公路（出租车司机）
  | 'study'           // 书房（退休教师）
  | 'garage'          // 车库（个体老板）
  | 'internet_cafe'   // 网吧（网吧老板）
  | 'balcony'         // 阳台（退休工程师）
  | 'guard_booth'     // 保安岗亭（夜班保安）
  | 'roadside'        // 路边等单（代驾师傅）
  | 'fishing'         // 水边钓位（钓友）
  | 'chess'           // 棋摊（棋友）
  | 'square'          // 广场（广场舞大爷）
  | 'default';        // 兜底

/** v2.2：头像配饰图标类型——在头像角落画一个小图标。 */
export type Accessory =
  | 'steering_wheel'    // 方向盘
  | 'calligraphy_brush' // 毛笔
  | 'cigarette'         // 烟
  | 'gamepad'           // 游戏手柄
  | 'wrench'            // 扳手
  | 'flashlight'        // 手电筒
  | 'fishing_rod'       // 钓竿
  | 'chess_piece'       // 棋子
  | 'speaker'           // 音箱
  | 'helmet'            // 安全帽
  | 'none';

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
  /** v4.3.2 微信昵称——手机界面（名单/通讯录/聊天顶栏/朋友圈）显示这个；
   *  叙事面（结局/日志/台词）仍用 name。缺省回落 name。 */
  handle?: string;
  /** v4.3.2 微信个性签名——小老板的广告位、退休人的通知、手艺人的接活卡。
   *  只在手机界面显示，缺省不显示。 */
  signature?: string;
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
    hair: number;       // 发型档位 0-7（蓬乱密发/三七分/板寸/中年短发/重地中海/油头背头/花白背头/稀疏分头）
    hairColor: string;
    glasses: number;
    beard: number;
    cheeks: number;     // fullness 0-1
    shirtColor: string;
    /** v2.2：头像背景场景——决定 SVG 背景图层。 */
    bgScene: BgScene;
    /** v2.2：配饰图标——在头像角落画一个小图标。 */
    accessory: Accessory;
    /** v2.2：头像色调（背景渐变 / 装饰用）。 */
    accent: string;
    /** v3.0：肤色档 0 白皙 / 1 常年风吹 / 2 黝黑（缺省 1）。 */
    skin?: 0 | 1 | 2;
    /** v3.0：眉型 0 细眉 / 1 浓眉（缺省 0）。 */
    brow?: 0 | 1;
    /** v3.2：脸型 0 国字方脸 / 1 富态圆脸 / 2 清瘦尖脸 / 3 瘦长脸 / 4 年轻短圆脸（缺省 1）。 */
    face?: 0 | 1 | 2 | 3 | 4;
    /** v3.3：头像类型学——中国直男社交头像还原（face=真人脸，其余为"不是人人都拿脸当头像"）。
     *  wheel 方向盘照 / business 商务形象照 / gym 健身房镜拍 / lowangle 迷之低角度自拍 /
     *  zen 禅意茶具 / cap 帽子墨镜半身 / kid 孩子照片（隐藏已婚核弹）/ wallpaper 网图风景 /
     *  fishing 钓鱼照 / brunch 精致生活摆拍。缺省 face。 */
    shotType?: 'face' | 'wheel' | 'business' | 'gym' | 'lowangle' | 'zen' | 'cap' | 'kid' | 'wallpaper' | 'fishing' | 'brunch';
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
  /** v2.0：偶遇入通讯录的日期（0 = 还没遇到——主五人开局即 1）。 */
  discoveredDay: number;
  /** v2.0：今天他来找过你（防重复投递）。 */
  pingedToday: boolean;
  /** v2.1：近 N 套用过的话术组 id（去重轮换，N 随话术库扩容自适应 3-8）。 */
  recentPacks: string[];
  /** v2.1：上一晚的 greeting 下标——连聊两晚不再同一句开场白（-1 = 无记录）。 */
  recentGreetingIdx: number;
  /** v3.0：最近说过的开场白原文（近 3 条去重，跨档位生效）。 */
  recentGreetings?: string[];
  /** v3.2：最近收到的"他来找你"原文（跨场去重，同一句想念不连发）。 */
  recentIncoming?: string[];
  /** v3.0：上一场闲聊的话题标签——下一晚可能"接昨天的话"（语境连续性）。 */
  lastTopic?: string;
  /** v2.2：上一场他发过的照片下标——连发两张不重复（-1 = 无记录）。 */
  recentPhotoIdx: number;
  blocked: boolean;
  /** v4.3.3 玩家拉黑——她把他设成"消息免打扰"：可逆，与引擎结局性的 blocked 区分。 */
  mutedByPlayer?: boolean;
  /** Set when he stops being reachable forever. */
  ended: TargetEndingId | null;
}

/** Content-complete main targets (story chains fully written). */
export const ACTIVE_TARGETS: string[] = ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong'];

/** v2.0 老头库：45 个偶遇目标（9 原型 × 5 人），按计划事件逐步入通讯录。 */
export const LIBRARY_TARGETS: string[] = []; // 由 data/target-library.ts 填充
