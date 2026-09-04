import type { Target } from '../types/target';
import { ACTIVE_TARGETS } from '../types/target';
export { ACTIVE_TARGETS };
import { TARGETS } from './targets';

/**
 * v2.0 老头库：50 个偶遇目标（夜班保安/钓友/棋友/广场舞/代驾师傅 各 5 人，9 原型里的 5 类）。
 * 库目标没有手写剧情链——他们共用原型闲聊话术组（archetype packs），
 * 各自有独立的卡面小传/在线时段/警惕/慷慨度。加一个人 = 加一行数据。
 */

/** 库目标生成器：小传一行 + 原型参数。 */
function lib(
  id: string, name: string, age: number, archetype: Target['archetype'],
  bio: string, personality: string, need: Target['need'],
  activeHour: number, traits: Target['traits'], warinessThreshold: number,
  portrait: Target['portraitSpec'],
): Target {
  return {
    id, name, archetype, age, bio, personality,
    likes: '看心情', dislikes: '被敷衍',
    need,
    preferredStyles: ['caring', 'playful'],
    goodPersonas: ['sweet_daughter', 'wise_sister'],
    badPersonas: [],
    warinessThreshold,
    generosity: 0.8,
    topics: [],
    activeHour, traits, portraitSpec: portrait,
  };
}

const P = {
  guard: { hair: 0, hairColor: '#2a2a2a', glasses: 0, beard: 1, cheeks: 0.45, shirtColor: '#3a4a5a' } as Target['portraitSpec'],
  driver: { hair: 1, hairColor: '#333', glasses: 0, beard: 1, cheeks: 0.5, shirtColor: '#6a5a3a' } as Target['portraitSpec'],
  fish:  { hair: 2, hairColor: '#555', glasses: 1, beard: 2, cheeks: 0.6, shirtColor: '#4a6a4a' } as Target['portraitSpec'],
  chess: { hair: 1, hairColor: '#999', glasses: 1, beard: 0, cheeks: 0.5, shirtColor: '#6a5a4a' } as Target['portraitSpec'],
  dance: { hair: 1, hairColor: '#777', glasses: 0, beard: 0, cheeks: 0.55, shirtColor: '#8a3a5a' } as Target['portraitSpec'],
};

export const LIBRARY: Target[] = [
  // ---- 小区夜班保安 ×5 ----
  lib('g1', '老铁', 51, 'night_guard', '小区夜班保安，看了十一年大门。监控室里有张凳子是自带的。喜欢在凌晨巡逻的时候跟晚归的住户点头——一天里他能点十几个头，说不上三句话。', '话少，但记性好得吓人。谁家几点回来、谁的外卖总放门口，他都记得。', 'listened_to', 2, ['night_owl'], 45, P.guard),
  lib('g2', '赵师傅', 56, 'night_guard', '物业保安，白班换夜班倒了半辈子生物钟。手机里存着三十多个"养生"公众号，每篇都收藏，没一篇看完。', '养生话题一开就刹不住，但你咳嗽一声他半夜给你送枇杷膏。', 'listened_to', 1, ['night_owl', 'loneliness'], 40, P.guard),
  lib('g3', '小马哥', 42, 'night_guard', '其实不小了，保安队里最年轻的。别人叫他小马，他自己都习惯了。梦想是开个烧烤摊，看了五年转让信息。', '爱吹牛，烧烤摊的话术比崩老头还熟练。', 'respected', 3, ['night_owl'], 35, P.guard),
  lib('g4', '门卫老冯', 60, 'night_guard', '厂区门卫，厂子半停产后就他一个人守。传达室的搪瓷缸用了二十年，印着"先进工作者"。', '惜字如金，但会修一切东西。', 'listened_to', 23, ['night_owl', 'clingy'], 50, P.guard),
  lib('g5', '夜巡的毕师傅', 49, 'night_guard', '商场夜巡保安。整栋楼闭店之后是他一个人的。他的巡逻路线会经过倒闭的火锅店和还在营业的猫咖。', '巡逻久了会自言自语，你回他，他就当真聊。', 'listened_to', 22, ['night_owl', 'loneliness'], 45, P.guard),

  // ---- 钓友大叔 ×5 ----
  lib('f1', '水库老宋', 54, 'fisherman', '钓鱼三十年，装备两万八，钓上来的鱼加起来不到两百条。他说钓鱼钓的不是鱼，你信吗，他也半信半疑。', '痴迷，讲起浮漂就变了个人。', 'listened_to', 6, [], 40, P.fish),
  lib('f2', '空军老唐', 47, 'fisherman', '每次都说"今天爆护"，每次都空手回家（钓友黑话：空军=没钓到）。他老婆不知道他那根竿四千块。', '爱面子，输了也嘴硬，需要有人捧。', 'desired', 7, [], 45, P.fish),
  lib('f3', '石斑钟叔', 62, 'fisherman', '退休后把钓鱼变成了主业。家里有面墙挂满了鱼获照片，每张旁边写着日期和"当时水深两米"。', '严谨的钓手，连你随口问的问题都要回去查资料再回你。', 'respected', 8, ['generous'], 55, P.fish),
  lib('f4', '江边老郑', 58, 'fisherman', '只钓江，说塘里的鱼没魂。凌晨四点出竿是他的仪式感。老伴走后，仪式感成了唯一的作息。', '沉默，话都在竿子上。', 'listened_to', 4, ['loneliness'], 50, P.fish),
  lib('f5', '海竿老佟', 53, 'fisherman', '一次甩六根海竿的"资本家"。鱼护基本是空的，但阵仗必须大。他的抖音全是抛竿慢动作。', '表演型选手，需要观众。', 'desired', 5, [], 40, P.fish),

  // ---- 棋摊大爷 ×5 ----
  lib('c1', '悔棋王大爷', 68, 'chess_uncle', '小区棋摊霸主，特点是悔棋。他的规矩是：他能悔你不能悔。孩子们都躲他，只有棋友受得了。', '要赢，更要赢得有人看。', 'respected', 15, ['suspicious'], 60, P.chess),
  lib('c2', '观棋马叔', 61, 'chess_uncle', '不下棋，只观棋，专支招。支对了是他的功劳，支错了是走的人手臭。棋摊人称"马指导"。', '存在感全靠一张嘴。', 'respected', 16, [], 50, P.chess),
  lib('c3', '弃车的齐伯', 66, 'chess_uncle', '一年到头赢不了几盘，但有一手弃车杀的绝活，一年总成全他一次。那天他能高兴一个月。', '输得起，但赢的那天需要全世界知道。', 'listened_to', 14, ['generous', 'loneliness'], 45, P.chess),
  lib('c4', '孙老爷子', 72, 'chess_uncle', '棋摊最老的。孙子在国外，两年没回来了。他给孙子录过教棋的视频，没人看，发朋友圈也没人点。', '把陌生人当徒弟教，是想念的另一种写法。', 'daughter_figure', 10, ['clingy'], 55, P.chess),
  lib('c5', '喝水的老聂', 59, 'chess_uncle', '保温杯泡枸杞，下棋慢得让人睡着。他说快有什么用，"我这辈子就没快过"。', '慢性子，聊天像下长棋。', 'listened_to', 11, [], 50, P.chess),

  // ---- 广场舞大爷 ×5 ----
  lib('d1', '领舞对面的', 63, 'square_dancer', '站领队阿姨正对面的位置十年。阿姨换了几任舞伴，他没挪过窝。他说那个位置"音响的回音最好"。', '嘴上不服老，膝盖最先服。', 'desired', 19, [], 45, P.dance),
  lib('d2', '搬音响的蒋叔', 60, 'square_dancer', '每天负责搬40斤的音响上五楼台阶。队里没人知道他有腰椎间盘突出，包括他自己——他以为是老了都这样。', '力气是他在这个世界上的存在证明。', 'respected', 18, ['generous'], 50, P.dance),
  lib('d3', '慢四步老康', 65, 'square_dancer', '只会慢四，快三快二一概不上场。他说慢四才有"社交"，快的都是蹦迪。他老伴以前嫌他跳得难看。', '守旧，礼数多，在意"体面"两个字。', 'listened_to', 20, ['clingy'], 55, P.dance),
  lib('d4', '新来的老岳', 55, 'square_dancer', '退休三个月，被楼下邻居拉来看热闹，第三天就站在了队尾。他学得笨，但每天都来。', '孤独是新的，热络是装出来的，渴望是真的。', 'listened_to', 19, ['loneliness'], 40, P.dance),
  lib('d5', '音响师傅老樊', 57, 'square_dancer', '其实是修家电的，来给领队修过一次音响就没走成。队里谁的电器坏都找他。他说这是"售后"。', '用有用换亲近，他自己没意识到。', 'respected', 20, [], 45, P.dance),

  // ---- 代驾司机 ×5（夜里蹲活的那批人——和白天开出租的老李不是一个时区） ----
  lib('e1', '等单的侯师傅', 48, 'designated_driver', '代驾司机，电动车折叠塞在后备厢跟客户一起走。等单的间隙在路边刷手机，屏幕亮着，人像睡着了。', '话不多，一单结束会在朋友圈发定位。', 'listened_to', 1, ['night_owl'], 45, P.driver),
  lib('e2', '烧烤摊老潘', 53, 'designated_driver', '开代驾三年，认得全城所有还亮着灯的摊子。收工必在烧烤摊吃一顿，那是一天里唯一坐着吃的热饭。', '热络，跟摊主都熟，唯独家里没人等他。', 'listened_to', 0, ['night_owl', 'loneliness'], 40, P.driver),
  lib('e3', '夜班代驾小魏', 41, 'designated_driver', '白天在物流园卸货，晚上跑代驾，一天睡五个小时。他说等攒够钱就不干了，这句话说了四年。', '疲惫，但回消息快得像在等一个人。', 'listened_to', 2, ['night_owl'], 35, P.driver),
  lib('e4', '酒后陪聊的谢叔', 57, 'designated_driver', '代驾接的单一半是喝多的。有的客人上车就哭，他就听着。他说这活儿一半是开车，一半是听人说话。', '好脾气，酒后的话他都替人收着。', 'listened_to', 1, ['night_owl', 'loneliness'], 50, P.driver),
  lib('e5', '抢单的吴师傅', 46, 'designated_driver', '代驾平台积分榜前十。他给自己定了规矩：每天必须抢满十单，哪怕最后一单是凌晨四点。', '较劲，跟平台较劲，也跟自己较劲。', 'respected', 3, ['night_owl'], 45, P.driver),

  lib('g6', '物业刘主管', 47, 'night_guard', '物业维修班主管，管着小区八个门。业主群里谁骂物业他都第一个出来回，回到最后没声了。', '责任心过剩，深夜下班要在车里坐半小时才上楼。', 'respected', 21, [], 50, P.guard),
  lib('g7', '北门老翟', 55, 'night_guard', '只在北门。北门对着高架，一年四季吃灰。他说北门好，"清净，能听收音机"。', '自得其乐，收音机评书能跟你复述一整段。', 'listened_to', 22, ['loneliness'], 40, P.guard),
  lib('g8', '监控室的雷子', 44, 'night_guard', '监控室值机的，一晚上盯四十块屏幕。屏幕里的人生比电视剧全——就是没有声音。', '话痨，因为一晚上没人跟他说一句话。', 'listened_to', 1, ['night_owl'], 35, P.guard),
  lib('g9', '退休返聘的钱伯', 62, 'night_guard', '退休后被返聘回来看地下车库。一个月退休金六千三，他说看车库不是为了钱，"是为了每天有人跟我点头"。', '和气，谁的车停歪了都要伸手扶一把。', 'daughter_figure', 20, ['generous'], 55, P.guard),
  lib('f6', '夜钓的史哥', 45, 'fisherman', '只夜钓，说白天的鱼不咬钩是"鱼也在上班"。他上二班倒，钓鱼时间和上班时间正好反过来。', '精力全在夜里，聊到鱼就睡不着。', 'listened_to', 0, ['night_owl'], 40, P.fish),
  lib('f7', '开渔具店的秦老板', 53, 'fisherman', '钓友里唯一的"商人"。开店二十年，全城钓鱼的他都认识。他自己却越来越钓不动了。', '人面广，谁的事都知道一点。', 'respected', 15, [], 45, P.fish),
  lib('f8', '陪钓的宁叔', 58, 'fisherman', '儿子给办的"钓鱼卡"，他不会调漂，就在水边坐着。他说坐一下午，比在家里对着电视强。', '温和，什么都说"好，好"。', 'listened_to', 6, ['loneliness'], 50, P.fish),
  lib('f9', '直播钓鱼的虎哥', 41, 'fisherman', '边钓边直播，三十几个粉丝。鱼没钓到过几条，"老铁们双击666"说得比报数还顺。', '需要观众，你一个赞他能高兴一天。', 'desired', 4, [], 35, P.fish),
  lib('c6', '残局摊的余师傅', 66, 'chess_uncle', '在桥头摆象棋残局摊，一块钱一局。他自己就是从书上学的一百多个残局，摆了二十年。', '精明，但输一块钱会念叨一下午。', 'respected', 16, ['suspicious'], 55, P.chess),
  lib('c7', '象棋班的白老师', 61, 'chess_uncle', '社区象棋班的义务老师，教了七年。他教棋先教"落子无悔"，自己悔棋时说这叫"复盘"。', '爱讲道理，道理都是好道理。', 'respected', 10, [], 50, P.chess),
  lib('c8', '棋摊新客老雷', 57, 'chess_uncle', '刚退休才发现小区有个棋摊，去了一个月没人跟他多说话。他天天去，就为了那个"有人"的感觉。', '局促，别人笑他也跟着笑。', 'listened_to', 15, ['loneliness'], 40, P.chess),
  lib('c9', '云棋的甄大爷', 69, 'chess_uncle', '不来了，改下云棋。他说网上好，"输了没人看见"。他赢棋的截图存了两百多张。', '较真，会把聊天当对弈。', 'listened_to', 9, [], 45, P.chess),
  lib('d6', '队尾的丁姨夫', 63, 'square_dancer', '被老伴拉来的，站队尾五年。他自己不跳，就站着，"帮大家看东西"。', '耐心，谁的包都记得住。', 'listened_to', 19, ['loneliness'], 45, P.dance),
  lib('d7', '替补的武叔', 60, 'square_dancer', '队里男的不够，他是"替补"。领队喊他上他就上，不喊他就在边上跟着比划。', '随和到没有存在感，直到你跟他说话。', 'listened_to', 20, [], 40, P.dance),
  lib('d8', '写队史的鲁老', 71, 'square_dancer', '广场舞队九年的"队史记录员"，谁哪天入队、哪年换的音响，都记在一个笔记本上。没人看过那个本子。', '珍视被记住的人。', 'listened_to', 18, ['clingy'], 55, P.dance),
  lib('d9', '对跳的荣姐夫', 58, 'square_dancer', '领队阿姨的对跳搭档，位置在"领舞对面的"正对面。两人谁也不承认自己是被安排的。', '嘴硬，心软，跳完总给全场买水。', 'desired', 19, ['generous'], 45, P.dance),
  lib('e6', '机场线的孔师傅', 50, 'designated_driver', '专跑机场线的代驾。凌晨的机场高速他闭着眼都认得。他说这条线最清净，"客人一上车就睡，没人说话"。', '安静，会主动把音乐调小。', 'listened_to', 2, ['night_owl'], 45, P.driver),
  lib('e7', '雨天翻倍的桂师傅', 46, 'designated_driver', '雨天单子翻倍，他从不休息。雨衣里揣着手机，怕漏单，也怕漏掉谁的晚安。', '要强，觉得自己还能更拼。', 'respected', 1, ['night_owl'], 40, P.driver),
  lib('e8', '电动车的韩叔', 59, 'designated_driver', '代驾界"活地图"，全城的小巷他都知道。年轻时蹬三轮送货练出来的。', '知识型选手，就盼着有人问路。', 'respected', 3, [], 50, P.driver),
  lib('e9', '等单区的小岳', 43, 'designated_driver', '酒吧街代驾聚集区的"区长"。等单的师傅们凑一块抽烟，他从不抽，就在边上刷你发的朋友圈。', '观察型，你说过的话他都记得。', 'listened_to', 2, ['night_owl', 'loneliness'], 35, P.driver),
];

/** 主五人 + 库 45 人 = 全量目标。 */
export const ALL_TARGETS: Target[] = [...TARGETS, ...LIBRARY];
export const LIBRARY_IDS: string[] = LIBRARY.map((t) => t.id);
export function libraryTargetById(id: string): Target | undefined {
  return LIBRARY.find((t) => t.id === id);
}

/** 供 safeguards 测试：全库年龄。 */
export const LIBRARY_AGES = LIBRARY.map((t) => t.age);
