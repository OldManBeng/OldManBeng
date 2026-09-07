/**
 * v4.2 突发事件——这个月不是一条直线。
 *
 * 与已有系统的分工（别互相抢戏）：
 *  - DAY_EVENTS（2d6 晨间小事）：日常天气，无选择、后果轻。
 *  - WORLD_BEATS（Day 5/10/15/20/25 日历）：必现的世界节点，"停下来看自己"。
 *  - LIFE_EVENTS（人生线日历）：他的人生按日历推进，与她的操作无关。
 *  - 穿帮（riskLevel ≥ 40 掷骰）：多线经营的代价，盯的是"评论区撞车"。
 *  - 突发事件（本文件）：**随机**、**紧迫**、**必须当场二选一**——
 *    没有铺垫的横生枝节，拖到睡觉落"没接住"的后果。
 *
 * 概率口径（constants.ts）：
 *  - INCIDENT_CHANCE = 0.22：约五分之一的日子横生枝节（不是日历，是运气）。
 *  - INCIDENT_FIRST_DAY = 3：首两日不触发（先站稳节奏）。
 *  - 节奏日当天不掷（压迫已经够重了）；一次只来一件；同一事件只来一次。
 *
 * 后果明码标价（与全游戏同一套账本语言）：
 *  trust/wariness 落到 targetId 指的那个人头上；
 *  money/conscience/numbness/risk/energy 是她自己的账；
 *  staleEffects 是"拖到睡觉没选"的代价——不处理也是一种处理，也要付钱。
 *
 * 文案纪律：与全游戏同源——不出现任何可实操的诈骗细节（无账号/渠道/
 * 验证码/删记录指南），只有人话层面的"她怎么办"。台词家常、口语，
 * 像那个场景里真会说的话。
 */

export interface IncidentOption {
  /** 按钮文案（她的话/她的动作）。 */
  text: string;
  /** 选完落日志的一行（结果，叙述视角）。 */
  after: string;
  /** 拖到睡觉没选时落的一行（两个选项共用同一句——"没接住"只有一个版本）。 */
  stale: string;
  money?: number;
  conscience?: number;
  numbness?: number;
  risk?: number;
  energy?: number;
  /** 落到具体某个人头上的信任/警惕变化。 */
  targetId?: string;
  trust?: number;
  wariness?: number;
  flag?: string;
}

export interface IncidentDef {
  id: string;
  /** 最早可能出现的天数（别在第 2 天就摔手机）。 */
  minDay: number;
  /** 前置条件：认识这个人才触发（主五人 Day 1 就认识；库人物要偶遇过）。 */
  requireTarget?: string;
  title: string;
  /** 事件正文（她的视角——早上刷手机看见/被告知）。 */
  body: string;
  options: [IncidentOption, IncidentOption];
  /** "没接住"的机械代价（旁白用 options[0].stale）。 */
  staleEffects?: Partial<Omit<IncidentOption, 'text' | 'after' | 'stale'>>;
}

/**
 * 突发事件池。四类：
 *  A 他那边出事了 —— 关系突然升温或突然降温，今晚的安排全乱。
 *  B 你这边出事了 —— 现实世界的账单和意外，不等人。
 *  C 世界逼近了   —— 风声、新闻、身边人的下场。
 *  D 钱的事横生枝节 —— 到手的钱和还没到手的钱，都长了脚。
 */
export const INCIDENTS: IncidentDef[] = [
  // ---------- A 他那边出事了 ----------
  {
    id: 'inc_taxi_accident',
    minDay: 4,
    requireTarget: 'lao_li',
    title: '老李的车停在路边了',
    body: '凌晨两点，老李发来一张照片：出租车的后备箱凹了一块，保险杠耷拉着。他说人没事，就是"这个月白跑了"。照片后面跟着一句："丫头，叔跟你说这些干嘛。"你盯着这句看了很久。',
    options: [
      {
        text: '打过去陪他聊到天亮',
        after: '电话那头是他坐在马路牙子上的声音。你没背话术，听他骂了四十分钟保险公司。挂电话前他说："你这丫头，比你说的年龄懂事。"信任涨了——你却不太舒服，因为那句夸是真的。',
        stale: '你回了句"叔你注意安全"，就去睡了。第二天他只字未提。有些时刻过了就是过了。',
        targetId: 'lao_li', trust: 6, wariness: -2,
        energy: -2, conscience: 3,
      },
      {
        text: '发两条语音安慰一下，省点精力',
        after: '你的语音是排练过的温柔，三句话，句句熨帖。他回了句"谢谢丫头"。你没听他骂保险公司的四十分钟——那四十分钟省下来，能多聊一个人。',
        stale: '你回了句"叔你注意安全"，就去睡了。第二天他只字未提。有些时刻过了就是过了。',
        targetId: 'lao_li', trust: 1,
        numbness: 2,
      },
    ],
    staleEffects: { targetId: 'lao_li', trust: -2, wariness: 3 },
  },
  {
    id: 'inc_hao_hospital',
    minDay: 6,
    requireTarget: 'hao_ge',
    title: '阿豪的网吧今天不开门',
    body: '阿豪的消息："姐，我住院了，胃出血，老毛病。网吧托给小工看两天。"后面跟了张输液的照片，又补了一句："没事，就是没人说话，闷得慌。"',
    options: [
      {
        text: '这两天他随叫随到',
        after: '你把阿豪置了顶。他半夜疼醒就给你发一句，你秒回。他出院那天说："这两天，比我姐来看我那天还记得住。"你发现这两天里，你一次话术都没用。',
        stale: '你隔了一天多才回。他回你"没事了"，两个字。那两天陪他说话的，是网吧常客老宋。',
        targetId: 'hao_ge', trust: 5, conscience: 4,
        energy: -3,
      },
      {
        text: '在群里点了个"早日康复"',
        after: '一个表情，一句祝福，三十秒办完。够体面，也够远。他回了个抱拳。',
        stale: '你隔了一天多才回。他回你"没事了"，两个字。那两天陪他说话的，是网吧常客老宋。',
        targetId: 'hao_ge', trust: -1,
        numbness: 1,
      },
    ],
    staleEffects: { targetId: 'hao_ge', trust: -3, wariness: 4 },
  },
  {
    id: 'inc_wang_wife_checks',
    minDay: 8,
    requireTarget: 'boss_wang',
    title: '王总的老婆开始对账了',
    body: '王总今天的话很短："这两天别发圈了，她翻我手机。"停了停又发来："不是不信任你，是我家里那位……你懂。"你懂。你还知道他上个月给你转的那两千，是哪张卡上的钱。',
    options: [
      {
        text: '这两天彻底安静，圈也停更',
        after: '你把朋友圈设了三天可见。两天里你一个字没发，他也没找你。第三天他主动来了："没事了。还是你懂事。"懂事这个词你听了很多遍——这是第一次觉得它值钱。',
        stale: '你没忍住，还是发了条自拍。他没点赞。两天后再聊，他的话短了一半。',
        targetId: 'boss_wang', trust: 4, wariness: -4,
        risk: -6, conscience: 2,
      },
      {
        text: '照常发圈，赌他老婆不翻评论区',
        after: '圈照发。他没点赞，也没说话——但你注意到，他把以前给你点过的赞，一个一个全取消了。这个动作，只有你看得懂。',
        stale: '你没忍住，还是发了条自拍。他没点赞。两天后再聊，他的话短了一半。',
        targetId: 'boss_wang', wariness: 10,
        risk: 8,
      },
    ],
    staleEffects: { targetId: 'boss_wang', wariness: 9, risk: 7 },
  },
  {
    id: 'inc_zhou_retouch',
    minDay: 5,
    requireTarget: 'zhou_teacher',
    title: '周老师要看看你的字',
    body: '周老师："丫头，你不是说在学书法嘛。给叔写两个字看看？"你上一次摸毛笔是小学三年级，还是描红。',
    options: [
      {
        text: '网上找张字帖拍了发他',
        after: '你找的图笔锋太好了，好得不像练了一年的手。周老师回了三个字："继续练。"没夸你。第二天他的话少了一截——语文老师看字，看了四十年。',
        stale: '你说"笔在老家没带来"。他说"那等你回去写"。这一页翻过去了，翻得有点太快。',
        targetId: 'zhou_teacher', wariness: 8, trust: -3,
        numbness: 1,
      },
      {
        text: '坦白：就是随口一说，没在练',
        after: '"叔，我骗你的，我就是觉得写字的人好看。"周老师在那头笑了很久："难得你跟我说实话。想学，叔教你，从握笔开始。"这段关系里，你第一次没背台词。',
        stale: '你说"笔在老家没带来"。他说"那等你回去写"。这一页翻过去了，翻得有点太快。',
        targetId: 'zhou_teacher', trust: 6, conscience: 5,
      },
    ],
    staleEffects: { targetId: 'zhou_teacher', wariness: 5 },
  },
  {
    id: 'inc_chen_overtime',
    minDay: 7,
    requireTarget: 'chen_gong',
    title: '陈工的图纸今晚要通宵',
    body: '陈工："项目要评审，今晚通宵画图。你别等我，睡你的。"过了一会儿又发来一句："就是想说一声。以前说这话的人，现在不在了。"',
    options: [
      {
        text: '定个闹钟，凌晨给他发夜宵',
        after: '凌晨你准时发："图还剩几张？"他回你一张空咖啡杯的照片："最后一张。"他熬夜的夜里你在场了——用一杯奶茶的价钱。',
        stale: '你回了句"早点睡"，他说"嗯"。第二天他没提通宵的事。',
        targetId: 'chen_gong', trust: 5,
        energy: -2, conscience: 2,
      },
      {
        text: '回一句"早点睡"，明早再聊',
        after: '"嗯。"一个字。他通宵的世界里没有你了。第二天早上他说"昨晚画完了"——像在汇报，不像在聊天。',
        stale: '你回了句"早点睡"，他说"嗯"。第二天他没提通宵的事。',
        targetId: 'chen_gong', wariness: 4,
      },
    ],
    staleEffects: { targetId: 'chen_gong', trust: -3 },
  },

  // ---------- B 你这边出事了 ----------
  {
    id: 'inc_phone_broken',
    minDay: 3,
    title: '手机摔了',
    body: '出门买早点，手机从口袋里滑出去，屏幕裂成蜘蛛网。维修店报价：换屏三百八。你的余额是这个数的一半——而且屏幕一黑，谁都联系不上你，包括那五个"哥哥"。',
    options: [
      {
        text: '换屏，这个月吃泡面',
        after: '三百八，你数了两遍现金。屏幕亮起来的那一刻，几个聊天气泡同时弹出来——最上面的三条都是"怎么不回我"。你这条命脉，值一周泡面。',
        stale: '你贴了张钢化膜凑合用，裂纹里打字。触摸开始漂移，一句话要打三遍。',
        money: -380,
      },
      {
        text: '贴膜凑合，钱留给月底',
        after: '碎屏撑了两天，触屏开始乱跳。你跟每个人都解释"手机坏了回得慢"——"解释"这个词，在你这门生意里是危险词。',
        stale: '你贴了张钢化膜凑合用，裂纹里打字。触摸开始漂移，一句话要打三遍。',
        risk: 4, numbness: 1,
      },
    ],
    staleEffects: { risk: 5, numbness: 1 },
  },
  {
    id: 'inc_landlord_key',
    minDay: 6,
    title: '房东要带人看房',
    body: '房东的语音："月底房子要卖，这两天有人来看，你把东西收一收。"没提你的名字，但"东西"两个字包括你——你没有下一个住处的钱。',
    options: [
      {
        text: '今天不聊天，先去看房',
        after: '你跑了两家中介，看了三个隔断间，最便宜的一个月八百。回来的时候手机上有六条未回——你第一次觉得，"在忙"两个字有时是真的。',
        stale: '你谁也没回。两天里五个人里有三个不再每天找你了。房子的事，房东又催了一遍。',
        energy: -4, conscience: 3, money: -200,
      },
      {
        text: '先稳住线上——房子可以慢慢找',
        after: '你把每个人的话都接住了，稳稳的。中介的电话你没回。房东的第二条语音，比第一条短。',
        stale: '你谁也没回。两天里五个人里有三个不再每天找你了。房子的事，房东又催了一遍。',
        numbness: 3, risk: 3,
      },
    ],
    staleEffects: { numbness: 2, conscience: -3 },
  },
  {
    id: 'inc_mom_sudden',
    minDay: 9,
    title: '妈的电话（又一个早上）',
    body: '妈妈的电话在早上八点打来："你舅住院了，家里凑了一圈还差两千。妈跟人说你在城里工作得好，能不能……"她没说完。你听见她那边的挂钟在响。',
    options: [
      {
        text: '从账上划一笔回去',
        after: '你转了六百——从"哥哥们"给你的钱里，划出来给妈。这笔钱的来路和去路，第一次接到了一起。妈说"妈不着急，你先顾自己"。挂钟还在响。',
        stale: '你按掉了。晚上妈妈发来一条："妈明白了，你忙。"五个字，你看了半宿。',
        money: -600, conscience: 10,
        flag: 'helped_mom',
      },
      {
        text: '说工资还没发，缓几天',
        after: '"过两天，过两天。"你听见她跟身边的人说"她说过两天"——那个声音里的失望，隔着六百公里砸在你床上。你挂了电话，解锁手机，翻开了五个对话框。',
        stale: '你按掉了。晚上妈妈发来一条："妈明白了，你忙。"五个字，你看了半宿。',
        conscience: -6, numbness: 4,
      },
    ],
    staleEffects: { conscience: -7, numbness: 3 },
  },

  // ---------- C 世界逼近了 ----------
  {
    id: 'inc_news_push',
    minDay: 5,
    title: '新闻又推了一条',
    body: '锁屏上的推送："警方通报：破获冒充女性网络交友诈骗案 12 起，受害人多为中老年男性。"你没点开。你数了数自己手机里的人——数到第三个，停了。',
    options: [
      {
        text: '这两天把最露骨的话收一收',
        after: '你把和每个人的聊天记录翻了一遍，把那些甜得发腻的称呼都改了口。改的时候你很冷静，像在给自己留后路。改完你盯着屏幕想：我在怕什么呢。',
        stale: '推送被你划掉了。世界没有因为你不看它，就绕开你。',
        risk: -10, numbness: 2,
      },
      {
        text: '关掉推送，当没看见',
        after: '你把新闻 App 卸了。"眼不见为净"这五个字，你以前觉得是玩笑，现在是操作说明。',
        stale: '推送被你划掉了。世界没有因为你不看它，就绕开你。',
        numbness: 4, conscience: -3,
      },
    ],
    staleEffects: { risk: 3, numbness: 1 },
  },
  {
    id: 'inc_sister_caught',
    minDay: 10,
    title: '带你的那个姐，进去了',
    body: '姐妹群突然安静，然后炸出一句："L 姐昨天没上线，今天听说是被带走了。"群里安静得能听见各自打字又删掉的声音。你的入门话术，一半是 L 姐教的。',
    options: [
      {
        text: '今晚全部暂停，冷静两天',
        after: '你一晚没上号。几个对话框静悄悄的，像同时灭掉的灯。第二天你数了数存款，忽然想算算"收手"这个词的成本。',
        stale: '你照常上号了。头像都还亮着。只是那晚你回每个人的话时，手指比平时慢半拍。',
        risk: -8, conscience: 5, numbness: -3,
      },
      {
        text: '照常上号——枪不打安静的人',
        after: '你照常营业，甚至比平时更甜。L 姐空出来的位置，总得有人坐——你这么跟自己解释。解释完，你在屏幕这头坐了很久。',
        stale: '你照常上号了。头像都还亮着。只是那晚你回每个人的话时，手指比平时慢半拍。',
        numbness: 5, risk: 5,
      },
    ],
    staleEffects: { numbness: 3, conscience: -2 },
  },
  {
    id: 'inc_antifraud_poster',
    minDay: 12,
    requireTarget: 'boss_wang',
    title: '小区门口的反诈海报',
    body: '买早点回来，小区门口贴了张新海报："网恋牵手带你投资？五十岁以上的叔伯阿姨看过来。"落款是社区派出所。你拍照的手停了半秒——王总住的那个小区，也有这样的门。',
    options: [
      {
        text: '提醒王总：最近骗子多，别乱加人',
        after: '你把提醒发给王总——用防骗的名义。他回："我这种老头，就你一个线上的朋友，谁骗我？"这句话你读了两遍，第二遍的时候有点喘不上气。',
        stale: '海报你拍下来了，谁也没提醒。第三天王总问你在哪看的社区新闻。',
        targetId: 'boss_wang', trust: 3, conscience: 4,
        risk: -5,
      },
      {
        text: '什么都不说，别引他注意这个',
        after: '你什么都没说。但那晚他的话里第一次出现"防骗"两个字——他儿子发给他一个视频。你顺着他的话聊开了，聊得比平时累。',
        stale: '海报你拍下来了，谁也没提醒。第三天王总问你在哪看的社区新闻。',
        targetId: 'boss_wang', wariness: 6,
        risk: 6, numbness: 2,
      },
    ],
    staleEffects: { targetId: 'boss_wang', wariness: 7, risk: 4 },
  },

  // ---------- D 钱的事横生枝节 ----------
  {
    id: 'inc_refund_demand',
    minDay: 8,
    requireTarget: 'e1',
    title: '有个"哥哥"要退款',
    body: '侯师傅突然发来："丫头，上回那五百，你叔这月手头紧，你看能不能先退叔？就当叔借的。"他是上个月刚熟起来的人——给过你五百的那一个。',
    options: [
      {
        text: '退他——这个人以后还长着',
        after: '你退了五百。他发来一长串感谢，末了说："叔认的是你这个朋友，不是那个红包。"这句话你存下来了——存的时候你分不清是想留证据，还是想留人。',
        stale: '你装没看见。两天后他的头像再没亮过。',
        money: -500, conscience: 6,
        targetId: 'e1', wariness: -8, trust: 4,
      },
      {
        text: '装没看见这条',
        after: '你上号、下号，都没回那条。第三天他发来最后一句："叔明白了。"然后头像灰了。五百块留在你账上，像一个烙印。',
        stale: '你装没看见。两天后他的头像再没亮过。',
        targetId: 'e1', wariness: 22,
        numbness: 6, conscience: -8, risk: 5,
      },
    ],
    staleEffects: { targetId: 'e1', wariness: 25, trust: -10, conscience: -4 },
  },
  {
    id: 'inc_paid_double',
    minDay: 6,
    requireTarget: 'lao_li',
    title: '红包多打了一个零',
    body: '早上醒来看见：老李半夜转了你 500——可他上一条还在说"这个月白跑了"。往上翻聊天记录，他说的是"给你转 50，丫头买点早饭"。多出来的那 450，他还没发现。',
    options: [
      {
        text: '退回去 450',
        after: '你退了 450，留下了他本来要给的 50。老李那边半天没动静，最后回了句："叔手滑。你这丫头实在。"——"实在"这个词你包装了一个月，今天它白来了。白来的东西，你反而记住了。',
        stale: '你谁也没退。老李今天没再发消息。那 450 在你余额里躺着，像一块烧红的炭。',
        targetId: 'lao_li', money: 50, trust: 5, conscience: 8, numbness: -1,
      },
      {
        text: '收下，等他发现了再说',
        after: '你收下了。一整天你都在等那句"丫头，叔好像多打了"——它没来。晚上他照常跟你说话，照常叫你丫头。你数着余额，把良心按了下去。',
        stale: '你谁也没退。老李今天没再发消息。那 450 在你余额里躺着，像一块烧红的炭。',
        targetId: 'lao_li', money: 500, numbness: 5, conscience: -6,
      },
    ],
    staleEffects: { targetId: 'lao_li', money: 500, conscience: -5, numbness: 3 },
  },
  {
    id: 'inc_sister_poach',
    minDay: 11,
    requireTarget: 'boss_wang',
    title: '姐妹盯上了你的"哥哥"',
    body: '带你的另一个姐妹私信你："你手上那个开建材店的，资料借我用用呗，我号空着，分成你四我六。"王总的名字她没说——但"开建材店的"，这座城里只有你一个。',
    options: [
      {
        text: '不给——王总是我的人',
        after: '你把话堵回去了："这个不行。"她回了个"行吧，架不住一个老头"。晚上王总找你的时候，你回话比平时快了一点。',
        stale: '你没回她。三天后她换了个号加了王总——头像是你用过的那张奶茶照。',
        targetId: 'boss_wang', conscience: 3, numbness: -2,
        risk: -3,
      },
      {
        text: '给了——四六分成不亏',
        after: '资料发过去了。四六分，你算过，比你自己下功夫快。但那天晚上王总跟你说的话，你不知道屏幕那头是不是只有你一个人在听。',
        stale: '你没回她。三天后她换了个号加了王总——头像是你用过的那张奶茶照。',
        targetId: 'boss_wang', money: 300, numbness: 5, conscience: -7, risk: 6,
      },
    ],
    staleEffects: { targetId: 'boss_wang', wariness: 12, risk: 8 },
  },
];

/** 引擎掷股用：按天 + 已认识的人过滤可用池（一次性记账在引擎侧）。 */
export function incidentsAvailable(day: number, discoveredIds: Set<string>): IncidentDef[] {
  return INCIDENTS.filter((i) => i.minDay <= day && (!i.requireTarget || discoveredIds.has(i.requireTarget)));
}
