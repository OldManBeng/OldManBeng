/**
 * 舒适圈朋友圈内容（第二阶段 1.1.0）。
 *
 * 小满在常用手机上发的圈主打三类：励志向语录 / 晒家庭幸福 / 晒恩爱。
 * 妈和男友会来点赞评论——评论按各自人设写，且按圈的类型分池（评的是这条圈本身）。
 */

/** 励志向语录（素颜小满的自我打气——在两个世界之间挣扎的痕迹）。 */
export const INSPIRE_POSTS: { text: string; photoId?: string }[] = [
  { text: '成年人的世界没有容易二字，但有明天的豆浆。加油。', photoId: 'cm_soy' },
  { text: ' "日子是自己的，一步一步走。" ', photoId: 'cm_sunrise' },
  { text: '今天也是努力生活的一天。许愿：这个月的坎，迈过去。', photoId: 'cm_sunrise' },
  { text: '不熬夜了，从今天起（补发于凌晨一点半）。' },
  { text: '妈妈说，人要往前看。往前看的意思是：路在前面，坎也在前面，都得走。', photoId: 'cm_road' },
  { text: '存钱的第一天。目标不大：先把这个月过完。' },
  { text: '生活嘛，起起落落落落落……但也有豆浆。', photoId: 'cm_soy' },
  { text: '"凡是过往，皆为序章。" 剪了头发，从头开始。' },
];

/** 晒家庭幸福。 */
export const FAMILY_POSTS: { text: string; photoId?: string }[] = [
  { text: '妈寄的被子到了。五年了她还记得我睡觉怕冷。', photoId: 'cm_quilt' },
  { text: '和妈视频，她非说我瘦了。妈，我真没瘦，是美颜开了（笑）。', photoId: 'cm_video' },
  { text: '家里的老规矩：再难，过节也要吃顿好的。替爸多吃了一只螃蟹。', photoId: 'cm_crab' },
  { text: '妈今天又发养生文章了。以前嫌烦，现在一条条看完——她只是想找话题跟我说话。' },
  { text: '爸的忌日快到了。翻出他最后的语音："到了给你打电话。" 五年了，爸，我都好。', photoId: 'cm_old_phone' },
  { text: '妈学用智能手机，把我发的照片全设成了屏保。妈，同事看到会笑话我的（也会偷偷高兴）。', photoId: 'cm_video' },
];

/** 晒恩爱。 */
export const LOVE_POSTS: { text: string; photoId?: string }[] = [
  { text: '他嘴笨，但会把奶茶的糖度记得比游戏段位还清楚。', photoId: 'cm_boba' },
  { text: '恋爱脑怎么了？开心是真的就行。', photoId: 'cm_couple' },
  { text: '电竞少年的浪漫：双人成行，通关一整晚。', photoId: 'cm_couple' },
  { text: '他说等工作室做起来就带我搬去大平层。我知道是画饼，但饼画得真好。', photoId: 'cm_couple' },
  { text: '凌晨的炸鸡分一半，是同居人的默契。', photoId: 'cm_chicken' },
  { text: '吵架了，但他半夜偷偷给我盖了被子。算了，睡吧。', photoId: 'cm_quilt' },
];

/** 妈的评论池（按圈的类型）。 */
export const MOM_COMMENTS: Record<'inspire' | 'family' | 'love', string[]> = {
  inspire: [
    '闺女真棒，妈给你点个赞。好好吃饭，别熬太晚。',
    '我闺女懂事。有啥事跟妈说，妈在。',
    '看不懂你写的话，但看着就有劲。妈转发到姐妹群了啊。',
  ],
  family: [
    '被子旧是旧了点，弹过棉花，比买的暖。你盖着，妈就放心。',
    '妈看到你朋友圈了。螃蟹留了最肥的两只，你爸那份你替他吃了，他高兴。',
    '傻闺女，妈不识几个字，但你的朋友圈妈一条条都看。别嫌妈烦。',
  ],
  love: [
    '小凯看着是个实在孩子？处对象妈不反对，你俩好好的，妈就放心一半。',
    '妈看不懂这些年轻人拍照的姿势，但你笑得真，妈就高兴。',
    '处对象归处对象，自己的钱自己攥着，妈就嘱咐这一句。',
  ],
};

/** 男友的评论池（按圈的类型）。 */
export const BF_COMMENTS: Record<'inspire' | 'family' | 'love', string[]> = {
  inspire: [
    '老婆最棒！不过"不熬夜"这条建议你自己先执行一下？',
    '给你点赞了。顺便一提，今天家里没米了。',
  ],
  family: [
    '替我向阿姨问好！下次回去我一起，我给阿姨带两瓶好酒（赊账的那种）。',
    '阿姨人真好。宝你越来越像阿姨了，越来越好看（真心的）。',
  ],
  love: [
    '谁嘴笨？出来，我键盘已就位。',
    '官宣都发了？那我也发一张，兄弟们等着看呢（骄傲）。',
    '奶茶的糖度我是用脑子记的，谢谢。',
  ],
};

/** 妈/男友偶尔自己发的圈（低频，让这面墙也活着）。 */
export const OTHER_POSTS: { author: 'mother' | 'boyfriend'; text: string; photoId?: string }[] = [
  { author: 'mother', text: '今天东家姑娘教我用滤镜，把我拍得年轻了十岁。发给满满看看。', photoId: 'cm_video' },
  { author: 'mother', text: '家政公司发了全勤奖。做人呢，靠的就是个踏实。' },
  { author: 'boyfriend', text: '新赛季第一天，王者归来（字面意思）。接代练，私聊。', photoId: 'cm_game' },
  { author: 'boyfriend', text: '今天遇个神仙阿姨队友，格局打开。有些人的温柔，是隔着屏幕都挡不住的。', photoId: 'cm_game' },
];

/** 舒适圈配图场景（public/comfort/scenes/{id}.jpg，404 落 SVG 场景渲染）。 */
export const COMFORT_SCENES: Record<string, string> = {
  cm_soy: '早餐店的热豆浆',
  cm_sunrise: '出租屋窗台的日出',
  cm_road: '清晨的斑马线',
  cm_quilt: '妈寄来的旧棉花被',
  cm_video: '和妈的视频通话截屏',
  cm_crab: '中秋的螃蟹',
  cm_old_phone: '爸的旧手机',
  cm_boba: '他买的奶茶',
  cm_couple: '两个人的合照',
  cm_chicken: '分一半的炸鸡',
  cm_game: '他的游戏截图',
};
