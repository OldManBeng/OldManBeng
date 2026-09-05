import type { SelfieId } from '../types/game';
import type { Target } from '../types/target';

/**
 * v2.3 朋友圈内容库：8 种自拍 + 老头发圈素材 + 互动话术。
 * 设计意图：朋友圈不是装饰——它是有代价的收益工具。每一种自拍招来的人不同，
 * 每一条动态都可能被评论区里"另一个哥哥"看见。多线经营的显微镜。
 */

/** 8 种自拍的元数据（UI 瓷砖 + 标签）。 */
export const SELFIE_META: { id: SelfieId; label: string; emoji: string; note: string }[] = [
  { id: 'cake', label: '蛋糕照', emoji: '🍰', note: '甜——女儿感拉满，像在等人记住生日。' },
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
  cake: ['长大以后，蛋糕要自己买给自己了。', '祝我快乐。别的就不许了。', '今天是我请我自己。'],
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
  { photoId: 'zhou_calligraphy', captions: ['今日习字：宁静致远。第四十个年头，还是写不好那个"远"。', '退休第七年。字越写越多，说话的人越写越少。'] },
  { photoId: 'zhou_flower_balcony', captions: ['茉莉开了。老伴在的时候，这时候该她浇水。', '阳台的花都活着。浇花的人换了一个。'] },
  { photoId: 'wang_garage_smoke', captions: ['这个点，车库里就我和这盏灯。', '应酬散了。没人知道我在车库坐了一小时。'] },
  { photoId: 'wang_store_front', captions: ['卷帘门修了三次。第四次我打算自己上。', '店是十年前盘下来的，梦是去年做的。'] },
  { photoId: 'hao_cafe_cats', captions: ['收店了。猫比我先躺下。', '今晚满机。热闹是他们的，猫是我的。'] },
  { photoId: 'hao_counter_noodles', captions: ['泡面加蛋。老板的伙食，就这样。', '第 N 次吃出服务员的节奏。'] },
  { photoId: 'chen_balcony_vise', captions: ['台钳夹着一个旧闹钟。1974 年出厂，比我儿子大。', '修东西这行，讲究一个"还有救"。'] },
  { photoId: 'chen_blueprint_desk', captions: ['今晚画一张根本没人要的图纸。睡不着，手要动。', '尺寸都标完了。甲方是我自己。'] },
  { photoId: 'arch_guard_booth', captions: ['监控室，凌晨两点。荧幕里的世界安安静静。', '值夜班第 N 年。门口那只流浪狗都认识我了。'] },
  { photoId: 'arch_fishing', captions: ['今天终于不是空军。三两鲫鱼，放生了。', '水边坐了一天，鱼没来，风来了。'] },
  { photoId: 'arch_chess', captions: ['棋摊赢了老张两把。他说明天找我算账。', '观棋的人比下棋的多，都挺急。'] },
  { photoId: 'arch_square', captions: ['音响是新换的，曲子是老掉牙的。', '今天队形走齐了三回。不容易。'] },
  { photoId: 'arch_roadside', captions: ['代驾到凌晨。最后一单的车主在车上睡着了。', '夜里的城市，方向盘是别人的，路是自己的。'] },
];

/** 老头发圈素材 → 按老头索引（主五人专属在前，库老头按原型 5 张兜底）。 */
export function targetMomentPosts(targetId: string): { photoId: string; captions: string[] }[] {
  const main: Record<string, { photoId: string; captions: string[] }[]> = {
    lao_li: [MOMENT_TARGET_POSTS[0], MOMENT_TARGET_POSTS[1]],
    zhou_teacher: [MOMENT_TARGET_POSTS[2], MOMENT_TARGET_POSTS[3]],
    boss_wang: [MOMENT_TARGET_POSTS[4], MOMENT_TARGET_POSTS[5]],
    hao_ge: [MOMENT_TARGET_POSTS[6], MOMENT_TARGET_POSTS[7]],
    chen_gong: [MOMENT_TARGET_POSTS[8], MOMENT_TARGET_POSTS[9]],
  };
  if (main[targetId]) return main[targetId];
  const arch: Record<string, { photoId: string; captions: string[] }> = {
    night_guard: MOMENT_TARGET_POSTS[10],
    fisherman: MOMENT_TARGET_POSTS[11],
    chess_uncle: MOMENT_TARGET_POSTS[12],
    square_dancer: MOMENT_TARGET_POSTS[13],
    designated_driver: MOMENT_TARGET_POSTS[14],
  };
  return [arch.night_guard, arch.fisherman, arch.chess_uncle, arch.square, arch.roadside];
}

type Need = Target['need'];

/** 老头评论你朋友圈的常规话术（按情感缺口分档，每种 4 条）。 */
export const MOMENT_REACTIONS: Record<Need, string[]> = {
  daughter_figure: [
    '丫头，这是在哪拍的？一个人要注意安全。饭要按时吃。',
    '看到你在外面跑，我就想起我带的学生。天冷了加衣服。',
    '评论一个"好"字容易，我想说的话评论框装不下。',
    '丫头真会过日子。比我强——我这周吃的全是食堂。',
  ],
  listened_to: [
    '照片我看了三遍。第 N 遍的时候，收音机里正好在放老歌。',
    '今晚就到这里。看到你的圈，今天就还算是好日子。',
    '我不太会评论。就是想说一句：今天有人看见你了。',
    '这条我截图存了。别问为什么，问就是手机相册太空。',
  ],
  desired: [
    '这张不错。下次发圈，先想想给谁看。',
    '你最近的照片越来越会拍了。谁教的？',
    '配文有点丧。改天带你去个不丧的地方。',
    '点赞点了三次，手机卡了两次。',
  ],
  respected: [
    '照片构图工整，光影尚可。配文情绪稳定。综合：优。',
    '已阅。保存。此操作犹豫了四十秒。',
    '记录生活是好习惯。数据留存要五十年起步。',
    '照片没问题。建议：下次加个时间水印。',
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

/** 玩家评论老头朋友圈的话术（按情感缺口分档，每种 4 条）——比点赞走心。 */
export const MOMENT_PLAYER_COMMENTS: Record<Need, string[]> = {
  daughter_figure: [
    '老师说得对，我们年轻人都该多学学。',
    '字真好。我小时候练过三年，后来手生了。',
    '茉莉开得好，是您浇水浇得勤。',
    '评论区没装下的话，我可以私信慢慢听。',
  ],
  listened_to: [
    '收车记得吃口热的。胃是自己的。',
    '凌晨两点的监控室，我在。您说，我听着。',
    '这个点还醒着的人，都是有心事的。',
    '照片我放大看了。那只狗是不是叫旺财？',
  ],
  desired: [
    '王总这品味，车库里都是岁月。',
    '这个点不睡的人，明天都是狠人。',
    '赢了老张两把，明天他真会找您算账的。',
    '老板的伙食不能这么糊弄，加个蛋。',
  ],
  respected: [
    '台钳那台 1974 的闹钟，还在走吗？',
    '图纸标完了，甲方自己——验收意见呢？',
    '尺寸标注很工整。看得出来手没生。',
    '修东西这行讲究"还有救"——这句话我记下了。',
  ],
};
