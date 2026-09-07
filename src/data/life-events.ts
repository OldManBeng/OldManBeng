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

  // ---- v4.1 人生线第二卷：中段加密（每个老头的线从 4-7 站加深到 6-9 站）----
  {
    id: 'li_shift_week', day: 7, targetId: 'lao_li',
    text: '老李这周跑了六天连班。车队群里有人说他"上岁数了别硬撑"，他退了群——十分钟后又加了回来。退群那一下，是他这十年里最硬气的一回。',
  },
  {
    id: 'li_daughter_voice', day: 12, targetId: 'lao_li',
    text: '闺女发来一条三秒的语音："爸，钱收到了。"他听了十七遍。三秒。他这个月跑了六天连班换来的，是三秒。',
    costText: '闺女发来一条三秒的语音："爸，钱收到了。"他听了十七遍。这三秒里的钱，有一笔本来是他留着修腰的。',
    costFrom: 300,
  },
  {
    id: 'li_waist_film', day: 20, targetId: 'lao_li',
    text: '老李去医院拿了腰的片子。医生说再这样坐下去，以后就不用修了。他把片子收进了副驾的储物格——那格子里，全是闺女的东西。',
  },
  {
    id: 'li_month_end', day: 30, targetId: 'lao_li',
    text: '月底最后一天。老李把车洗了，里外都洗。他说要干干净净地进下个月——像是要去见什么人。',
  },
  {
    id: 'zhou_exhibition', day: 18, targetId: 'zhou_teacher',
    text: '书法班秋季汇展的通知贴出来了。周老师的名字排在教员栏最后一个。他数了两遍，跟谁都没说。',
  },
  {
    id: 'zhou_clock', day: 19, targetId: 'zhou_teacher',
    text: '周老师把阳台的挂钟拆开修好了——其实没坏，他就是想拆点什么。装回去的时候，他把它调慢了两分钟。',
  },
  {
    id: 'wang_support_retracted', day: 16, targetId: 'boss_wang',
    text: '建材城商户群里在传"整体升级改造"的评估方案。王总在群里发了条"支持"，凌晨一点撤回了。',
  },
  {
    id: 'wang_class_group', day: 21, targetId: 'boss_wang',
    text: '王总今晚在车里坐到两点。他给儿子的班级群发了个"收到"——那是他今天说过的唯一一句话。',
  },
  {
    id: 'wang_stocktake', day: 29, targetId: 'boss_wang',
    text: '月底盘货。王总蹲在卷帘门里算了很久，算完他把计算器扣在货箱上，像扣了一张牌。',
    costText: '月底盘货。王总蹲在卷帘门里算了很久。有两栏数字对不上——哪两栏，他心里清楚，账本也清楚。',
    costFrom: 500,
  },
  {
    id: 'hao_cat_spill', day: 22, targetId: 'hao_ge',
    text: '"键盘"（那只橘猫）今早把一杯奶茶碰翻在主板上。阿豪没生气，他把猫抱起来举了一会儿——店里就它不会走。',
  },
  {
    id: 'hao_study_room', day: 27, targetId: 'hao_ge',
    text: '网吧对面新开了家自习室，灯亮到后半夜。阿豪隔着马路看了一会儿，把"通宵特价"的牌子翻了个面。',
  },
  {
    id: 'chen_tolerance', day: 13, targetId: 'chen_gong',
    text: '陈工把手机支架第二版的公差从 ±0.1 调到了 ±0.02。没人会量这个。他知道没人会量。',
  },
  {
    id: 'chen_student_car', day: 14, targetId: 'chen_gong',
    text: '当年带过的徒弟今天在朋友圈晒了新车，配文"感谢师傅当年不弃"。陈工看了很久，没点赞——他的赞停在了三年前那条。',
  },
  {
    id: 'chen_handover_bag', day: 25, targetId: 'chen_gong',
    text: '陈工今天没画图。他把图纸都收进了那个牛皮纸袋——袋子上写着"退休交接"，日期空着。',
  },

  // ---- v4.1 库人物人生线：他们也要过日子（5 个最有戏的）----
  {
    id: 'f8_son_card', day: 2, targetId: 'f8',
    text: '儿子的钓鱼卡到期了，续费六百八。宁叔盯着短信看了一会儿，回了儿子一句"好，续"。他不会调漂，他续的是那个"坐一下午"。',
  },
  {
    id: 'g5_hall_lights', day: 7, targetId: 'g5',
    text: '商场四楼那家倒闭的火锅店，灯又亮了一夜。毕师傅巡逻路过给它关了——第二天它还亮着。他在巡查表上写：电路异常，已处理。其实没处理，它比他有主意。',
  },
  {
    id: 'c8_second_talk', day: 11, targetId: 'c8',
    text: '棋摊今天有人跟老雷搭话了——第二回。第一回是谁，他记着。他把这两句话都记在心里，跟下棋记谱一样记。',
  },
  {
    id: 'd2_speaker_stairs', day: 24, targetId: 'd2',
    text: '搬音响上五楼的时候，蒋叔在四楼半歇了一次。就一次。队里没人看见——他歇的那半层，窗帘正好好看。',
  },
  {
    id: 'c4_grandson_call', day: 30, targetId: 'c4',
    text: '孙子今天打来了视频电话，五分钟。孙老爷子把那盘"马走日"的教棋视频翻出来发过去。孙子那头说"爷爷我看看"——第四十一期，头一回有人说要看看。',
  },
];

/** 按 targetId 建索引（引擎 O(1) 查询）。 */
export const LIFE_BY_TARGET: Record<string, LifeEventDef[]> = {};
for (const ev of LIFE_EVENTS) {
  (LIFE_BY_TARGET[ev.targetId] ??= []).push(ev);
}

// ---------------------------------------------------------------------------
// v4.1 节奏日（评审 P0-1 修复）：Day 5/10/15/20/25 的强置叙事节点 + 决策。
// 与骰子事件的区别：必现、按日历、承载主题——第 4-30 天的"停下来看自己"。
// ---------------------------------------------------------------------------

/** 节奏日的决策选项——她在这一天必须选一次，两个选项都有代价。 */
export interface BeatOption {
  /** 按钮文案。 */
  text: string;
  /** 选完落日志的一行（她的选择之后，叙述视角）。 */
  after: string;
  money?: number;
  conscience?: number;
  numbness?: number;
  risk?: number;
  energy?: number;
  flag?: string;
}

export interface WorldBeat {
  id: string;
  day: number;
  title: string;
  /** 正文（{earned}/{packets}/{gap} 由引擎按 state 插值）。 */
  body: string;
  /** 有 options 才出决策卡；没有就是纯压迫文案。 */
  options?: BeatOption[];
  /** 麻木门槛：numbness ≥ 才触发（麻木不到，她看不见镜子里的自己）。 */
  minNumbness?: number;
}

export const WORLD_BEATS: WorldBeat[] = [
  {
    id: 'beat_mom_album', day: 5,
    title: '妈的相册',
    body: '妈妈发了条朋友圈：你小时候的照片，两岁，扎着歪辫子。配文只有两个字——"想你"。点赞的是你三个姨。',
    options: [
      {
        text: '打个电话回去',
        after: '电话里她说"你声音听着累"。你说不累。挂了以后你在楼梯间站了十分钟。这四十分钟，是这个月你最像自己的四十分钟。',
        conscience: 10,
      },
      {
        text: '回个笑脸，接着背话术',
        after: '那张照片你看了三秒就锁了屏。你熟的话术里有八种回应"想你"的套路——没有一种用在这。',
        conscience: -4,
        numbness: 4,
      },
    ],
  },
  {
    id: 'beat_group_exposed', day: 10,
    title: '群里出事了',
    body: '姐妹的群炸了——有人被挂了。受害人的女儿把聊天记录贴到了网上，头像是打码的，话术一条没码。你翻了翻：那些句式，跟你手机里的，是同一套。',
    options: [
      {
        text: '这几天收着点',
        after: '你把和每个人的聊天记录翻了一遍，删了几句最露骨的。删的时候你发现你在用他们的口吻检查自己——这手艺你太熟了。',
        risk: -12,
        numbness: 2,
      },
      {
        text: '照常上号',
        after: '被挂的那个，手法跟你一模一样。你把"可惜了"打完又删了——群里发这个的都会被记一笔。你回了句"稳住"。',
        risk: 6,
      },
    ],
  },
  {
    id: 'beat_mirror', day: 15,
    title: '电梯里的镜子',
    body: '电梯里的镜面，你跟里头那个人对了两秒。你没认出来——认出来了，是第一天的你。你伸手按了关门。',
    minNumbness: 40,
  },
  {
    id: 'beat_half_ledger', day: 20,
    title: '半程账单',
    body: '过半了。{packets} 个红包，{earned} 元。你妈的利息是这个数的一半。你不敢算另一本账：这个月你叫了多少声"哥哥"。',
    options: [
      {
        text: '算了算另一本账',
        after: '你翻了聊天记录，搜了"哥哥"。搜出来的数字你看了很久，没告诉任何人——包括现在。',
        conscience: 6,
      },
      {
        text: '别算了，还差得远',
        after: '你把计算器关了。"还差得远"这四个字你一个月说了二十几遍——以前是对老头们说。这一次是说给你自己的。',
        numbness: 5,
      },
    ],
  },
  {
    id: 'beat_countdown', day: 25,
    title: '最后五天',
    body: '还剩五天。差 {gap} 元。够了，或者差远了——这个月的答案，五天后揭晓。他们那边没有人知道期限。',
  },
];

/** 节奏日按日查表。 */
export const WORLD_BEAT_BY_DAY: Record<number, WorldBeat> = {};
for (const b of WORLD_BEATS) WORLD_BEAT_BY_DAY[b.day] = b;

/** 正文插值：{earned} 总入账 / {packets} 红包笔数 / {gap} 距目标差额。 */
export function interpolateBeat(text: string, earned: number, packets: number, gap: number): string {
  return text
    .replace(/\{earned\}/g, String(earned))
    .replace(/\{packets\}/g, String(packets))
    .replace(/\{gap\}/g, String(gap));
}

/** v4.0/4.1 代价呈现层：开口旁白已迁至 cost-narratives.ts 的 ASK_COST_NARRATOR_V2
 *  （每人 6 条，覆盖人生线全节点）。此处仅留库目标（无专属人生线的偶遇老头）兜底。 */
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
