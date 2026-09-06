import type { Target } from '../types/target';

/**
 * v4.0 老头人生线：他的日子照过，不等你上线。
 *
 * 重设计的锚点（评审答复）：目标玩家是男性、要理解受害者视角；30 天保留。
 * 中期（第 4-30 天）的新鲜感不来自新机制，而来自一件事：
 * 五个老头各自的人生按日历推进——不看信任度，不看聊没聊，日子到了就发生。
 *
 * 三层受害者视角：
 *  1. text        —— 基准版：他的人生今天发生了什么
 *  2. costText    —— 同一件事的另一面：她从他那拿走的钱，正在改写哪一行
 *  3. blockedLine —— 他把她删了，他的日子照过，只是她看不见了
 *
 * 派发通道全部复用已有系统：晨报（log）、他的朋友圈（moment）、他来找你（incoming）。
 * 引擎按 day 精确匹配，不消耗 RNG（保护种子确定性测试）。
 */

export interface LifeEventDef {
  id: string;
  /** 哪一天早上发生（日历驱动，与信任无关）。 */
  day: number;
  targetId: string;
  /** 晨报日志行（基准版）。 */
  text: string;
  /** 她已从他身上拿走 ≥ costFrom 元时改用的版本——同一件事，被她的账改变的那一面。 */
  costText?: string;
  costFrom?: number;
  /** 他已把她删掉时改用的一行——人生不因删除而停摆。 */
  blockedLine?: string;
  /** 同步发一条他的朋友圈（复用照片场景）。 */
  moment?: { photoId: string; caption: string };
  /** 同步来一条"他来找你"（走 incoming 队列，点开即聊）。 */
  incoming?: { opener: string; minTrust?: number };
}

/** 每天最多两条人生线（简报不刷屏）。 */
export const LIFE_DAILY_CAP = 2;

export const LIFE_EVENTS: LifeEventDef[] = [
  // ---- 周老师 · 63 · 丧偶语文教师 —— 他的月历：忌日、场地费、复查、长卷、存折 ----
  {
    id: 'zhou_anniversary', day: 3, targetId: 'zhou_teacher',
    text: '阳台上的茉莉开了第二茬。周老师摆了两只茶杯——今天是对门的张阿姨来喝茶的日子，四年前开始，她不来了。',
    blockedLine: '今天是那个人的忌日。他把你删了，这个日子他不会告诉任何人。',
    moment: { photoId: 'zhou_flower_balcony', caption: '今日不习字。今日陪她坐坐。' },
  },
  {
    id: 'zhou_venue_fee', day: 8, targetId: 'zhou_teacher',
    text: '书法班下学期的场地费涨到三百了。周老师在交费窗口前站了一会儿——"三百，够买一刀好纸了。"最后还是交了。',
    costText: '书法班下学期的场地费涨到三百。周老师犹豫了三天，最后退了班，"在家写也是写"。他那套练了四十年的字帖，现在用的是五块钱一刀的毛边纸。',
    costFrom: 200,
  },
  {
    id: 'zhou_massage', day: 12, targetId: 'zhou_teacher',
    text: '深圳寄来的包裹到了：按摩仪、两盒降压茶、一张纸条——"爸，别太省。"按摩仪他用了，茶转送了书法班的老张。纸条收进了抽屉。',
  },
  {
    id: 'zhou_checkup', day: 17, targetId: 'zhou_teacher',
    text: '社区医院第三次打电话来，请周老师去复查血压。他跟电话里说："过几天，过几天。"挂钟在他身后走了十一下。',
    costText: '社区医院第三次催他复查。他没去。复查的缴费单被他夹进了字帖里——压着"宁静致远"那一页。他跟谁都没提，包括你。',
    costFrom: 200,
  },
  {
    id: 'zhou_son_no_return', day: 22, targetId: 'zhou_teacher',
    text: '深圳的儿子来电话：今年过年，大概率又回不来了。周老师说"回不来回不来吧，机票贵"。挂了电话，他把老伴的照片擦了一遍。',
  },
  {
    id: 'zhou_scroll', day: 26, targetId: 'zhou_teacher',
    text: '周老师这几日在写一幅小长卷，《劝学》里的一句。他写得极慢——写一个字，对着它看十分钟。',
    blockedLine: '那幅长卷裱好了，挂在他书房。它本来是写给谁的，他不会告诉任何人。',
    incoming: {
      minTrust: 30,
      opener: '在写一幅小长卷 写的是《劝学》里的一句｜写好了想寄给你｜就是不知道 你那边 挂得下吗',
    },
  },
  {
    id: 'zhou_deposit_hint', day: 29, targetId: 'zhou_teacher',
    text: '周老师随口提了一句：他有张定期的存折，下个月初到期。"这笔钱放着也是放着。"他是随口说的。你听得很清楚。',
  },

  // ---- 老李 · 47 · 夜班出租车司机 —— 他的月历：体检、闺女的生日、变速箱、老周 ----
  {
    id: 'li_checkup', day: 5, targetId: 'lao_li',
    text: '老李的体检报告出了：脂肪肝，血压偏高。他没当回事，拍照发你："我这身子骨，还能跑十年。"',
    costText: '老李的体检报告出了：脂肪肝，血压偏高。医生让他复查——他说"下个月吧，这个月手头有点紧"。手头为什么紧，你认识原因。',
    costFrom: 200,
  },
  {
    id: 'li_daughter_birthday', day: 11, targetId: 'lao_li',
    text: '老李的闺女下礼拜生日。十五岁。他把这日子记得比谁都清楚——他准备了好几年，每年都失败。',
    blockedLine: '老李的女儿今天满十五岁。他把你删了，这个日子你只能猜。',
    incoming: {
      minTrust: 10,
      opener: '丫头 叔跟你商量个事｜闺女下礼拜生日 十五了｜你说十五的姑娘 喜欢啥｜叔十年没给她买对过东西',
    },
  },
  {
    id: 'li_shift_fight', day: 15, targetId: 'lao_li',
    text: '老李跟车队的人吵了一架——排班表把他排到了连着七天的夜班。他吵完还是把表接了。"接了才有单。"',
  },
  {
    id: 'li_gearbox', day: 19, targetId: 'lao_li',
    text: '老李的车年检没过——变速箱渗油。修理厂报价两千八，他咬牙修了："车是饭碗。"',
    costText: '老李的车变速箱渗油。修理厂报价两千八，他说"先开着，再等等"。渗着油的变速箱，跑的还是夜班。',
    costFrom: 300,
  },
  {
    id: 'li_lao_zhou', day: 24, targetId: 'lao_li',
    text: '跑夜班的同行老周心梗走了，人在车里发现的。老李今晚在电台点了首《驼铃》。他说："叔想歇几天。"又说："歇不起。"',
    blockedLine: '同行老周走了。老李在电台点了首歌。你听不到了。',
    moment: { photoId: 'lao_li_radio_night', caption: '老周 今天这歌是给你点的' },
  },
  {
    id: 'li_child_support', day: 28, targetId: 'lao_li',
    text: '老李把闺女的抚养费转了，比该转的日子早了两天。转账附言只有两个字："给妞。"',
    costText: '闺女的抚养费，老李找他妹妹周转了五百。他跟妹妹说"运费压着呢"，没说别的。他也没跟你说。',
    costFrom: 300,
  },

  // ---- 王总 · 52 · 建材店老板 —— 他的月历：家长会、查账、车库、教育金 ----
  {
    id: 'wang_parents_meeting', day: 9, targetId: 'boss_wang',
    text: '儿子的家长会是王总去的。数学28，英语92。老师在台上说"有些家长要上心"，他坐最后一排，点头。回家没跟老婆提，只跟你说了一句："英语随我。"',
  },
  {
    id: 'wang_wife_checks', day: 13, targetId: 'boss_wang',
    text: '王总的老婆这个月开始翻他的手机账单。他的转账备注，从那天起全部改成了"零花钱"。',
  },
  {
    id: 'wang_garage_night', day: 18, targetId: 'boss_wang',
    text: '应酬散场，王总在车库里睡着了，凌晨三点醒的。烟灰缸里七个烟头。他那"一天里唯一属于自己的四十分钟"，超时了。',
  },
  {
    id: 'wang_store_street', day: 23, targetId: 'boss_wang',
    text: '建材城这条街又空出两间铺子，卷帘门上贴着"转让"。房东拍着王总的肩膀说"王哥你扛住"。他扛了三十年了。',
    moment: { photoId: 'wang_store_front', caption: '这条街的灯 又少了两盏 扛着' },
  },
  {
    id: 'wang_education_fund', day: 27, targetId: 'boss_wang',
    text: '王总按时把儿子的教育金存上了。三千块，雷打不动。"我这辈子就这样了。他得出去。"',
    costText: '这个月，王总给儿子存的教育金，没存上。他跟你说"月底再说"。月底他老婆要是查账，第一个对不上的，就该是这笔。',
    costFrom: 500,
  },

  // ---- 阿豪 · 35 · 网吧老板 —— 他的月历：主板、键盘、房东、账本 ----
  {
    id: 'hao_motherboard', day: 6, targetId: 'hao_ge',
    text: '网吧又烧了一块主板。阿豪没换新的，从报废机里拆了块旧的顶上。"能亮就行。四十台呢，矜贵不起。"',
  },
  {
    id: 'hao_cat_sick', day: 10, targetId: 'hao_ge',
    text: '那只叫"键盘"的橘猫吐了两天。阿豪带它去了宠物医院，检查加药花了八百三。"比我一天流水都高。"他嘴上骂，第二天买了进口猫粮。',
    costText: '"键盘"病了。宠物医院报价八百三，阿豪在楼道里站了十分钟，进去说"医生，用便宜点的方案行不行"。回来的路上他没提这事，只发了四个字："猫没事，放心。"',
    costFrom: 200,
  },
  {
    id: 'hao_wedding', day: 14, targetId: 'hao_ge',
    text: '发小的婚礼请柬到了。阿豪随了八百，没去——"店里走不开"。那天网吧锁了门，挂牌"设备维护"。',
  },
  {
    id: 'hao_landlord', day: 20, targetId: 'hao_ge',
    text: '房东又来电话了。阿豪开着免提，一边"嗯嗯"一边给猫铲屎。挂了电话他说："又是涨租。我这店，是在给房东打工。"',
  },
  {
    id: 'hao_books', day: 25, targetId: 'hao_ge',
    text: '月底对账。网吧这个月净亏两千二。阿豪把账本合上，转身发了条朋友圈："新主板到货，通宵特价。"',
  },

  // ---- 陈工 · 58 · 退休机械工程师 —— 他的月历：时差、机床厂、打样、圣诞 ----
  {
    id: 'chen_time_diff', day: 4, targetId: 'chen_gong',
    text: '凌晨三点，德国的视频电话来了。通话21分47秒——陈工掐了表。挂断后，他把这个时长记在了台历上。',
  },
  {
    id: 'chen_factory_demo', day: 16, targetId: 'chen_gong',
    text: '陈工干了半辈子的机床厂，拆迁定了，设备论吨卖。他那台1992年的台钳是当年偷偷留下的——他今天多擦了一遍。',
    moment: { photoId: 'chen_balcony_vise', caption: '厂子拆了 设备论吨卖 这台钳 算是当年救了它' },
  },
  {
    id: 'chen_prototype', day: 21, targetId: 'chen_gong',
    text: '手机支架第二版图纸，陈工真的送去打样了。CNC加工报价150，他付钱的时候特别痛快——这辈子他没为自己的钱痛快过。',
  },
  {
    id: 'chen_christmas', day: 26, targetId: 'chen_gong',
    text: '德国的儿子说，圣诞节也不回来了。第三年。陈工回："忙就好，忙说明有事业。"发完他去擦了台钳。',
  },
];

/** 按 targetId 建索引（引擎 O(1) 查询）。 */
export const LIFE_BY_TARGET: Record<string, LifeEventDef[]> = {};
for (const ev of LIFE_EVENTS) {
  (LIFE_BY_TARGET[ev.targetId] ??= []).push(ev);
}

/**
 * v4.0 代价呈现层（评审 P0-4 路线 A）：开口要到钱的那一刻，她的内心反应。
 * 第 8 天起生效（代价感是随着月份深入才浮现的）；按天轮换，不耗 RNG。
 * 她看见的是他那边的事——男性玩家在这里看见的是：钱是从哪个人身上来的。
 */
export const ASK_COST_NARRATOR: Record<string, string[]> = {
  lao_li: [
    '（他转账的这几秒，你想起他说过这个月手头有点紧。你把这个念头关掉了。）',
    '（红包到账的提示音很短。他多跑的那些个夜班，听不见这声响。）',
    '（他说"够不够？不够再说"。你数了一下余额，没数他这句话。）',
  ],
  zhou_teacher: [
    '（他的退休金每月十号到账。你把这个日子记得比自己的生日清楚。）',
    '（他写了一上午的字，才等来你这一句。红包里装的不是钱，是他今天仅有的回音。）',
    '（他跟你说"放着也是放着"。他没说那是留着做什么的。）',
  ],
  boss_wang: [
    '（备注又是"零花钱"。他老婆的账本上，今晚多了一行对不上的数。）',
    '（车库那四十分钟，挣不来这个数。但他说：别回，让她看见。）',
    '（他说"王总还行"。你回了个笑脸。今天说这四个字的，只有你一个人。）',
  ],
  hao_ge: [
    '（38块的通宵包早面。这一笔，够他一百个包夜。你算过。）',
    '（他打字还是那么快。快得像怕你等不及就走了。）',
    '（他那个月的亏损是两千二。他给你的这笔，你算过能占几台机器的电费。）',
  ],
  chen_gong: [
    '（他把给儿子攒的机票钱挪了一格。他没说。你装作不知道。）',
    '（标题栏里那个"审核：陈"，今晚审的是他自己的钱包。）',
    '（他这辈子公差不超过0.02毫米。给你的钱，他没量过。）',
  ],
};

/** 库目标（无人生线的偶遇老头）共用的代价旁白。 */
export const ASK_COST_NARRATOR_GENERIC: string[] = [
  '（到账了。这是这个月你听过的最顺耳的声响。）',
  '（你盯着余额看了两秒，退出去，开始下一个。）',
];

/** 日历覆盖检查用：人生线安排到的日子（升序去重）。 */
export const LIFE_DAYS: number[] = [...new Set(LIFE_EVENTS.map((e) => e.day))].sort((a, b) => a - b);

/** 五个主角的名字（简报行标签用）。 */
export const LIFE_TARGET_NAMES: Record<string, string> = {
  lao_li: '老李',
  zhou_teacher: '周老师',
  boss_wang: '王总',
  hao_ge: '阿豪',
  chen_gong: '陈工',
};

export type { Target };
