import type { SelfieId, MomentPost } from '../types/game';
import type { Target } from '../types/target';

/**
 * v2.3 朋友圈内容库：8 种自拍 + 老头发圈素材 + 互动话术。
 * 设计意图：朋友圈不是装饰——它是有代价的收益工具。每一种自拍招来的人不同，
 * 每一条动态都可能被评论区里"另一个哥哥"看见。多线经营的显微镜。
 */

/** 8 种自拍的元数据（UI 瓷砖 + 标签）。 */
export const SELFIE_META: { id: SelfieId; label: string; emoji: string; note: string }[] = [
  { id: 'bestie', label: '闺蜜照', emoji: '👭', note: '有人陪——关心多一倍，试探也多一倍：旁边那位是谁。' },
  { id: 'gym', label: '夜跑照', emoji: '🏃', note: '自律人设——"努力生活"的通用证词。' },
  { id: 'pool', label: '泳池照', emoji: '🏊', note: '贵——谁看了都觉得你"过得不缺钱"。' },
  { id: 'cat', label: '橘猫照', emoji: '🐈', note: '无害——宠物是孤独者之间的通行证。' },
  { id: 'grind', label: '加班照', emoji: '💻', note: '苦——凌晨还亮着的屏幕，配上"没事，习惯了"。' },
  { id: 'travel', label: '旅游照', emoji: '⛰', note: '远——晒的是远方，账单留在这个月。' },
  { id: 'boba', label: '奶茶咖啡照', emoji: '🧋', note: '小确幸——一杯十九的东西，拍出十九万的滤镜。' },
  { id: 'sick', label: '病床输液照', emoji: '🩹', note: '惨——互动最猛的一张；疑心重的会去数针眼。' },
];

/** 玩家发圈的配文池（口语化真实朋友圈体）。 */
export const MOMENT_CAPTIONS: Record<SelfieId, string[]> = {
  bestie: ['合影两张，一张她好看，一张我好看。', '闺蜜说，她负责美，我负责笑。', '有人陪的日子，要大声发出来。'],
  gym: ['第 N 次夜跑。风把耳机线吹得乱七八糟。', '五公里。跑完发现自己还是不想回家。', '坚持的第 9 天，腿是酸的，人是空的。'],
  pool: ['蹭朋友的会员卡。水是温的，天是蓝的。', '学游泳第 3 课，教练说我不怕水，我说是啊。', '晒不到太阳的角落，刚好够自拍。'],
  cat: ['楼下的橘猫又来敲门了。它不认识我，但它选了我。', '捡到一只不太亲人的猫。我们互相观察。', '它睡了我半张床，我付的全款。'],
  grind: ['凌晨的办公室只剩我这一盏灯。没事，习惯了。', '改完最后一版。甲方说"明天再说"。', '工资是按月发的，班是按天加的。'],
  travel: ['年假用最后一点余额换的。值。', '山里没信号。躲两天。', '拍了一百张，挑这张。'],
  boba: ['十九块的一杯，喝出了仪式感。', '三分糖，去冰，像我现在的生活。', '续命。'],
  sick: ['一个人输液，一只手要举着手机。', '护士说你家属呢。我说我就是家属。', '第三天。不疼，就是慢。'],
};

/** 朋友圈动态流容量（超出挤掉最老的）。 */
export const MOMENTS_CAP = 80;

/** 老头发圈素材——主五人各有专属场景，库老头按原型共用。
 *  photoId 复用照片系统（PHOTO_SCENES）的场景图。 */
export const MOMENT_TARGET_POSTS: { photoId: string; captions: string[] }[] = [
  { photoId: 'lao_li_radio_night', captions: ['这台收音机比车龄都大。今晚放的是《夜半歌声》。', '收车了。空车灯还亮着——忘了关，也懒得关。'] },
  { photoId: 'lao_li_taxi_night', captions: ['今晚跑了十六单。最后一位客人下车说了句"师傅慢点开"。', '凌晨的高架，路灯一根一根往后退。'] },
  { photoId: 'zhou_calligraphy', captions: ['今日习字：宁静致远。第四十个年头，还是写不好那个"远"。', '今日习字：观自在。三个字写了一上午——「观」字最难。', '退休第三年。字越写越多，说话的人越来越少。'] },
  { photoId: 'zhou_flower_balcony', captions: ['茉莉开了。老伴在的时候，这时候该她浇水。', '阳台的花都活着。浇花的人换了一个。'] },
  { photoId: 'wang_garage_smoke', captions: ['这个点，车库里就我和这盏灯。', '应酬散了。没人知道我在车库坐了一小时。'] },
  { photoId: 'wang_store_front', captions: ['卷帘门修了三次。第四次我打算自己上。', '店开了三十年。梦，是去年才敢做的。'] },
  { photoId: 'hao_cafe_cats', captions: ['收店了。猫比我先躺下。', '今晚满机。热闹是他们的，猫是我的。'] },
  { photoId: 'hao_counter_noodles', captions: ['泡面加蛋。老板的伙食，就这样。', '第 N 次吃出服务员的节奏。'] },
  { photoId: 'chen_balcony_vise', captions: ['台钳夹着一个旧闹钟。1974 年出厂，比我儿子大。', '修东西这行，讲究一个"还有救"。'] },
  { photoId: 'chen_blueprint_desk', captions: ['今晚画一张根本没人要的图纸。睡不着，手要动。', '尺寸都标完了。甲方是我自己。'] },
  { photoId: 'arch_guard_booth', captions: ['监控室，凌晨两点。荧幕里的世界安安静静。', '值夜班第 N 年。门口那只流浪猫都认识我了。'] },
  { photoId: 'arch_fishing', captions: ['今天终于不是空军。三两鲫鱼，放生了。', '放生了三两鲫鱼。放它的时候想：鱼也有家人。', '水边坐了一天，鱼没来，风来了。'] },
  { photoId: 'arch_chess', captions: ['棋摊又赢了。对面那老头撂了话：明天找我算账。', '观棋的人比下棋的多，都挺急。'] },
  { photoId: 'arch_square', captions: ['音响还是那台老的，曲子还是那些老的。', '今天队形走齐了三回。不容易。'] },
  { photoId: 'arch_roadside', captions: ['代驾到凌晨。最后一单的车主在车上睡着了。', '夜里的城市，方向盘是别人的，路是自己的。'] },
  // v4.1.2：每个原型补第二张贴（库老头一个月会发好几条，两条素材撑不起一个"人"）。
  // 仍严格贴着自己的世界写——代驾只写代驾的事，保安只写监控室的事。
  { photoId: 'arch_guard_booth', captions: ['夜巡两圈。风把岗亭的窗拍得咯咯响，楼里人睡得稳。', '监控里的小区安安静静。32 号楼的灯又亮了一夜。'] },
  { photoId: 'arch_fishing', captions: ['今天线断了。鱼跑了，晚饭也没了。', '三尾小鲫鱼，全放生了。放的时候想：明天它家里会不会找它。'] },
  { photoId: 'arch_chess', captions: ['连输三把。回家路上想明白了输在哪。', '棋友说下棋要"忘我"。我忘了的是吃降压药。'] },
  { photoId: 'arch_square', captions: ['领队阿姨今天没来，全场是我带下来的。累。', '新歌跟不上。年轻人管那叫什么来着。'] },
  { photoId: 'arch_roadside', captions: ['今晚连着三单。电动车还在楼下充着电，人先回来了。', '平台今天抽成又涨了。抢满十单，两单是白跑。', '等单的间隙在路边吃了碗馄饨。老板问我怎么天天这个点来。'] },
];

/** 老头发圈素材 → 按老头索引。
 *  v4.1.2 修复：库老头以前拿到的是全部 5 原型的素材——代驾韩叔会发钓鱼、
 *  下棋、广场舞的动态，一人的朋友圈五个人生，前言不搭后语。现在库老头
 *  只拿自己原型的两张贴（主五人专属在前，不受影响）。 */
export function targetMomentPosts(targetId: string, archetype: string): { photoId: string; captions: string[] }[] {
  const main: Record<string, { photoId: string; captions: string[] }[]> = {
    lao_li: [MOMENT_TARGET_POSTS[0], MOMENT_TARGET_POSTS[1]],
    zhou_teacher: [MOMENT_TARGET_POSTS[2], MOMENT_TARGET_POSTS[3]],
    boss_wang: [MOMENT_TARGET_POSTS[4], MOMENT_TARGET_POSTS[5]],
    hao_ge: [MOMENT_TARGET_POSTS[6], MOMENT_TARGET_POSTS[7]],
    chen_gong: [MOMENT_TARGET_POSTS[8], MOMENT_TARGET_POSTS[9]],
  };
  if (main[targetId]) return main[targetId];
  const arch: Record<string, { photoId: string; captions: string[] }[]> = {
    night_guard: [MOMENT_TARGET_POSTS[10], MOMENT_TARGET_POSTS[15]],
    fisherman: [MOMENT_TARGET_POSTS[11], MOMENT_TARGET_POSTS[16]],
    chess_uncle: [MOMENT_TARGET_POSTS[12], MOMENT_TARGET_POSTS[17]],
    square_dancer: [MOMENT_TARGET_POSTS[13], MOMENT_TARGET_POSTS[18]],
    designated_driver: [MOMENT_TARGET_POSTS[14], MOMENT_TARGET_POSTS[19]],
  };
  return arch[archetype] ?? [MOMENT_TARGET_POSTS[10]]; // 未知原型兜底：贴保安的，不跨原型串味
}

type Need = Target['need'];

/** 老头评论你朋友圈的常规话术（按情感缺口分档）——比点赞走心。 */
export const MOMENT_REACTIONS: Record<Need, string[]> = {
  daughter_figure: [
    '丫头，这是在哪拍的？一个人要注意安全。饭要按时吃。',
    '看到你在外面跑，就惦记一句话：天冷了，加衣服。',
    '评论一个"好"字容易，我想说的话评论框装不下。',
    '丫头真会过日子。比我强——我这周就没好好开过火。',
    '发了照片也不说一声。叔这边看着就行。',
    '拍得随性。日子就该这么过。',
  ],
  listened_to: [
    '照片我看了三遍。第 N 遍的时候，电视里正好在放老歌。',
    '今晚就到这里。看到你的圈，今天就还算是好日子。',
    '我不太会评论。就是想说一句：今天有人看见你了。',
    '这条我截图存了。别问为什么，问就是手机相册太空。',
    '看你的朋友圈，像屋里有个动静。不用回话，知道有人在就行。',
    '你的圈子，叔也算一个看客吧。挺好的。',
  ],
  desired: [
    '这张不错。下次发圈，先想想给谁看。',
    '你最近的照片越来越会拍了。谁教的？',
    '配文有点丧。改天带你去个不丧的地方。',
    '点赞点了三次，手机卡了两次。',
    '这张比上张强。继续保持。',
    '行，这条够气派。不愧是我看重的人。',
  ],
  respected: [
    '照片构图工整，光影尚可。配文情绪稳定。综合：优。',
    '已阅。保存。此操作犹豫了四十秒。',
    '记录生活是好习惯。数据留存要五十年起步。',
    '照片没问题。建议：下次加个时间水印。',
    '已阅。构图较上张提升约 12%。继续。',
    '内容健康，情绪稳定。转发就不必了。',
  ],
};

/** v3.1：照片专属评论——他评的是这张照片本身，不是泛泛的寒暄。
 *  45% 概率优先从这里抽，剩下的落回按情感缺口的常规池。 */
export const SELFIE_REACTIONS: Record<SelfieId, string[]> = {
  bestie: [
    '旁边这位是你的闺蜜？替你高兴。',
    '俩人玩得开心就好。叔就怕你一个人闷着。',
    '拍照的是谁？你们仨——算上拍照的手——都要平安。',
  ],
  gym: [
    '夜跑是好，就是别跑得太晚。',
    '五公里？叔年轻时候能跑十公里。（不信你问叔的老腰。）',
  ],
  pool: [
    '游泳好。不伤膝盖。',
    '这地方不便宜吧？你们年轻人是真会玩。',
  ],
  cat: [
    '这猫有福气，遇上你了。',
    '橘猫能吃。你养得起吗？（叔养过，深有体会。）',
  ],
  grind: [
    '这个点还亮着灯？老板给你加班费吗。',
    '别学叔。叔的腰，就是年轻时候这么熬坏的。',
  ],
  travel: [
    '山里信号不好。别让叔找不着你。',
    '替叔看看那座山。叔这辈子没出过省。',
  ],
  boba: [
    '三分糖是对的。全糖太腻。',
    '这一杯，顶叔两天的烟钱。替叔多喝一口。',
  ],
  sick: [
    '输液？严不严重？怎么不吱一声。',
    '一个人输液不行，得有人看着。叔隔空看着呢。',
  ],
};

/** 这个人是否已经对这条圈互动过（点赞或评论过）——每人每条圈只互动一次。 */
export function hasReacted(post: MomentPost, targetId: string): boolean {
  return (
    post.likes.includes(targetId) ||
    post.comments.some((c) => c.by === 'target' && c.targetId === targetId)
  );
}

/** v3.2 距离分层：信任 <25 时的远距离评论——客气、克制、公事公办。
 *  刚认识的人看你朋友圈，不会像老朋友那样热络——这才是常理。 */
export const MOMENT_REACTIONS_FAR: Record<Need, string[]> = {
  daughter_figure: [
    '注意休息。',
    '一个人在外，多留心。',
    '看到了。挺好。',
  ],
  listened_to: [
    '看过了。',
    '挺好。忙你的。',
    '（他看了很久，最后只回了一句：不错。）',
  ],
  desired: [
    '还行。',
    '照片一般，人精神。',
    '嗯。记下了。',
  ],
  respected: [
    '已阅。',
    '构图尚可。',
    '记录规范。',
  ],
};

/** v3.2 距离分层：信任 ≥60 后的亲密评论——熟了才说得出的话。 */
export const MOMENT_REACTIONS_CLOSE: Record<Need, string[]> = {
  daughter_figure: [
    '丫头，叔看照片看出了神。哪天回来，叔去接你。',
    '这张压在书桌玻璃板底下了。有人问是谁，我说：闺女。',
    '傻丫头，对自己好点。缺什么，跟叔说。',
  ],
  listened_to: [
    '你这张照片我看了半天——好像有声音，是你在笑。',
    '存了。今晚电视里的歌，都像是给你放的。',
    '看到你，今晚就不算白熬。',
  ],
  desired: [
    '美！这张照片，我能吹一年。',
    '美。这照片往圈里一放，谁看了不夸。',
    '下次拍，哥给你当助理。拎包那种。',
  ],
  respected: [
    '1. 已阅。2. 已存。3. 已设为屏保。4. 此操作通过了我的全部评审。',
    '这张照片的编号：台历上今天那页。',
    '我计算了看这张照片的时间。结论：值。',
  ],
};

/** 怀疑线——疑心重的老头（suspicious trait 或警惕 ≥ 40）看到你朋友圈的反应。 */
export const MOMENT_SUSPICION: string[] = [
  '这张和上个月那几张，风格差得有点远。哪个才是你？',
  '照片的定位，跟你上次说的对不上。',
  '你朋友圈设置三天可见——之前那条怎么删了？',
  '这条的配文，跟你上次那条一个字没改。转发多了吧。',
  '拍得挺好。就是不知道，这条是拍给谁看的。',
];

/** 朋友圈的信任增益（按情感缺口分档；怀疑线走负档）。 */
export const MOMENT_EFFECT: Record<Need, { trust: number; wariness: number }> = {
  daughter_figure: { trust: 3, wariness: 0 },
  listened_to: { trust: 2, wariness: 0 },
  desired: { trust: 2, wariness: 1 },
  respected: { trust: 1, wariness: 0 },
};

/** 怀疑线的代价：换用 MOMENT_SUSPICION 话术时套用。 */
export const MOMENT_SUSPICION_EFFECT = { trust: -1, wariness: 4 };

/** 玩家评论老头朋友圈的话术（按情感缺口分档，每种 4 条）——比点赞走心。
 *  v4.1.2：主五人的专名评论（王总的车库、陈工的台钳、老张的棋摊）只对
 *  主五人展示；库老头走 LIBRARY_COMMENT_FALLBACK 的通用池——评论对的
 *  是这条动态，不点名别人的生活。 */
export const MOMENT_PLAYER_COMMENTS: Record<Need, string[]> = {
  daughter_figure: [
    '老师说得对，我们年轻人都该多学学。',
    '字真好。我小时候练过三年，后来手生了。',
    '茉莉开得好，是您浇水浇得勤。',
    '评论区没装下的话，我可以私信慢慢听。',
  ],
  listened_to: [
    '忙完记得吃口热的。胃是自己的。',
    '这个点还亮着灯的，我在。您说，我听着。',
    '这个点还醒着的人，都是有心事的。',
    '照片我放大看了。这角落收拾得真用心。',
  ],
  desired: [
    '王总这品味，车库里都是岁月。',
    '这个点不睡的人，明天都是狠人。',
    '您这励志语录，配上车库这张图，朋友圈能火。',
    '老板也得按时吃饭。您那胃，比签的合同金贵。',
  ],
  respected: [
    '台钳那台 1974 的闹钟，还在走吗？',
    '图纸标完了，甲方自己——验收意见呢？',
    '尺寸标注很工整。看得出来手没生。',
    '修东西这行讲究"还有救"——这句话我记下了。',
  ],
};

/** 库老头的通用评论池（按缺口分档）：只评"这条动态"本身，不提主五人
 *  的专名生活——不然评论韩叔的圈却聊起王总的车库，前言不搭后语。 */
export const LIBRARY_COMMENT_FALLBACK: Record<Need, string[]> = {
  daughter_figure: [
    '叔这个点才吃上饭？胃是自己的，慢慢吃。',
    '又熬一个大夜。明天的觉，白天补回来。',
    '看着都替您累。回头教教我，怎么熬得住。',
    '这条我存下了。回头翻出来还能看着。'
  ],
  listened_to: [
    '这个点还醒着的人，都是有心事的。',
    '您说，我听着。评论框装不下的，私信慢慢说。',
    '夜里的活儿最熬人。今晚就早点歇了吧。',
    '日子是自己的，记录下来就值了。'
  ],
  desired: [
    '这个点不睡的人，明天都是狠人。',
    '哥这状态，比我们年轻人还能扛。',
    '忙成这样还惦记发条圈——哥是真讲究人。',
    '下次这种场面，带上我一个。'
  ],
  respected: [
    '记录得真认真。这年头肯认真记事的人不多了。',
    '这个点的城市，是你们这样的人撑着的。',
    '这行干到您这个岁数，是真功夫。',
    '这份认真，我拿小本本记下了。'
  ],
};

/** 玩家评论池解析：主五人用专属池，库老头用通用池（只评动态本身）。 */
export function playerCommentPool(def: Target): string[] {
  const mainFive = ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong'];
  if (mainFive.includes(def.id)) return MOMENT_PLAYER_COMMENTS[def.need];
  return LIBRARY_COMMENT_FALLBACK[def.need];
}
