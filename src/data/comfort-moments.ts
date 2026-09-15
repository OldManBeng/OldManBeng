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
  // ---- 扩充 1.2：生活切片 ----
  { text: '泡面卧个蛋，是成年人最后的仪式感。晚安，明天见。', photoId: 'cm_noodles' },
  { text: '本月账本结清：房租、伙食、给妈的。剩下的都是赚的。', photoId: 'cm_ledger' },
  { text: '晨跑第三天。不是自律，是路灯还没熄，不好意思回去。', photoId: 'cm_running' },
  { text: '旧的不去，新的不来了也得去。头发的、事的，都一样。', photoId: 'cm_haircut' },
  { text: '末班车上的城市比白天好看——它不问你要什么。', photoId: 'cm_bus' },
  { text: '下雨的出租屋最诚实：哪里漏、哪里响，清清楚楚。修不起，受得起。', photoId: 'cm_rain' },
  { text: '台灯下的十一点是借来的，要还。还的方式是：明早照常起床。', photoId: 'cm_desk' },
  { text: '收摊的菜场是穷人的专场——叶子蔫了，价也蔫了。互不嫌弃。', photoId: 'cm_market' },
];

/** 晒家庭幸福。 */
export const FAMILY_POSTS: { text: string; photoId?: string }[] = [
  { text: '妈寄的被子到了。五年了她还记得我睡觉怕冷。', photoId: 'cm_quilt' },
  { text: '和妈视频，她非说我瘦了。妈，我真没瘦，是美颜开了（笑）。', photoId: 'cm_video' },
  { text: '家里的老规矩：再难，过节也要吃顿好的。替爸多吃了一只螃蟹。', photoId: 'cm_crab' },
  { text: '妈今天又发养生文章了。以前嫌烦，现在一条条看完——她只是想找话题跟我说话。' },
  { text: '爸的忌日快到了。翻出他最后的语音："到了给你打电话。" 五年了，爸，我都好。', photoId: 'cm_old_phone' },
  { text: '妈学用智能手机，把我发的照片全设成了屏保。妈，同事看到会笑话我的（也会偷偷高兴）。', photoId: 'cm_video' },
  // ---- 扩充 1.2：家的痕迹 ----
  { text: '拆妈寄的箱子：辣酱两层，干香菇一层，剩下的全是她的旧围巾——防震用的。', photoId: 'cm_tomato' },
  { text: '妈织的毛衣，洗得发白也舍不得扔。冬天搭在膝盖上，等于妈陪着。', photoId: 'cm_sweater' },
  { text: '今晚月色好，拍给妈看。她回了三个字：吃了吗。——这就是妈的月亮。', photoId: 'cm_moon' },
  { text: '抢到回家的票。绿皮车慢，慢得有道理。', photoId: 'cm_train' },
  { text: '发烧了，没敢跟妈说。药盒和水摆好，自己给自己当妈。', photoId: 'cm_pill' },
  { text: '汤要小火，日子要慢火。今晚的汤，替妈煮的。', photoId: 'cm_pot' },
];

/** 晒恩爱。 */
export const LOVE_POSTS: { text: string; photoId?: string }[] = [
  { text: '他嘴笨，但会把奶茶的糖度记得比游戏段位还清楚。', photoId: 'cm_boba' },
  { text: '恋爱脑怎么了？开心是真的就行。', photoId: 'cm_couple' },
  { text: '电竞少年的浪漫：双人成行，通关一整晚。', photoId: 'cm_couple' },
  { text: '他说等工作室做起来就带我搬去大平层。我知道是画饼，但饼画得真好。', photoId: 'cm_couple' },
  { text: '凌晨的炸鸡分一半，是同居人的默契。', photoId: 'cm_chicken' },
  { text: '吵架了，但他半夜偷偷给我盖了被子。算了，睡吧。', photoId: 'cm_quilt' },
  // ---- 扩充 1.2：恋爱的痕迹 ----
  { text: '一把伞，他淋了半边。嘴硬说不亏，壮。', photoId: 'cm_umbrella' },
  { text: '看他打游戏都可以看一晚上——背影比正脸帅（不许告诉他）。', photoId: 'cm_back' },
  { text: '他赢来的徽章，现在挂我包上。战利品的正确使用方式。', photoId: 'cm_gift' },
  { text: '超市买的面包，公园铺块垫子。浪漫不看预算。', photoId: 'cm_picnic' },
  { text: '深夜散步，他走外侧。这件小事，他做了两年。', photoId: 'cm_night_walk' },
  { text: '电玩城战报：他赢了一筐币，我赢了一晚上笑声。', photoId: 'cm_arcade' },
  { text: '姐妹局 KTV。跑调是真的，快乐也是。', photoId: 'cm_karaoke' },
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

/** 舒适圈配图场景（public/comfort/scenes/{cm|bd|bm}/{id}.jpg，404 落 SVG 场景渲染）。 */
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
  // ---- 扩充 1.2 ----
  cm_noodles: '泡面卧个蛋',
  cm_ledger: '手写记账本',
  cm_running: '清晨的跑道',
  cm_haircut: '理发店的碎发',
  cm_bus: '末班公交的车窗',
  cm_rain: '窗玻璃上的雨痕',
  cm_desk: '深夜的书桌',
  cm_market: '收摊前的菜市场',
  cm_match: '公园相亲角',
  cm_tomato: '妈寄来的纸箱',
  cm_sweater: '妈织的旧毛衣',
  cm_moon: '天台上的月亮',
  cm_train: '回家的站台',
  cm_pill: '药盒和温水',
  cm_pot: '炖着的一锅汤',
  cm_umbrella: '一把伞下的两个人',
  cm_arcade: '电玩城的游戏机台',
  cm_night_walk: '深夜并肩的散步',
  cm_back: '打游戏的背影',
  cm_gift: '包上的徽章挂件',
  cm_picnic: '公园的简易野餐',
  cm_karaoke: 'KTV的姐妹局',
  bm_car: '新车提车',
  bm_hotel: '度假酒店的泳池',
  bm_shoes: '新款高跟鞋',
  bm_dinner: '烛光晚餐',
  bm_flight: '机场贵宾厅',
  bm_flower: '开业的花篮',
};

/** ---- 凤霞姨的朋友圈（红娘的日常：相亲角/老姐妹/她做这行的骄傲） ---- */
export const AUNTIE_POSTS: { text: string; photoId?: string }[] = [
  { text: '今天相亲角，挂出去的牌子比上个月多了二十张。年轻人啊——机会从来不会自己走来，得有人推着走。', photoId: 'cm_road' },
  { text: '上午茶的时候老姐妹们感慨：我们那时候东西坏了想着修，现在的人坏了就想换。人和人，也一样。', photoId: 'cm_soy' },
  { text: '妈们托我的人越来越多。受人之托，忠人之事——这八个字，比啥都金贵。', photoId: 'cm_quilt' },
  // ---- 扩充 1.2：红娘的日常 ----
  { text: '今天相亲角，风把纸牌吹得哗啦响。每张纸上都是一个孩子的一生，不敢怠慢。', photoId: 'cm_match' },
  { text: '老姐妹问我图什么。图的是喝上喜酒那天，你都得喊我一声姨。', photoId: 'cm_match' },
];

/** 阿姨给小满朋友圈的评论（她把每一条都当成了解小满的窗口）。 */
export const AUNTIE_COMMENTS: string[] = [
  '满满这照片拍得好！心态好的人，照片里都带着光。姨给你转给你妈看了啊。',
  '哎哟我们满满真俊！姨把这条也记下了——好姑娘的日子，就该这么亮堂。',
  '满满会生活！姨跟你说，会记录生活的人，日子差不了。',
];

/** ---- 曼曼Lisa的朋友圈：她的橱窗（下午茶/新包/医美，人间富贵的样本间） ---- */
export const BESTIE_POSTS: { text: string; photoId?: string }[] = [
  { text: '人均三百八的下午茶，摆盘精致到不忍心吃——开玩笑的，都吃了。姐妹说值，就是值。', photoId: 'bm_tea' },
  { text: '忍了三个月，拿下了。女人对得起自己，世界才会对你客气。', photoId: 'bm_bag' },
  { text: '今天店里冲业绩，姐妹价。变美是刚需，别的都是选修。', photoId: 'bm_spa' },
  // ---- 扩充 1.2：橱窗的第二排 ----
  { text: '提了。红色的。奖励自己这三年的辛苦——凭本事富养自己。', photoId: 'bm_car' },
  { text: '赶早班机。别问去哪，问就是在回血。', photoId: 'bm_flight' },
  { text: '这家酒店的泳池，人少、水好、出片。专业点说，这叫环境投资。', photoId: 'bm_hotel' },
  { text: '新入的鞋。人生建议：鞋跟要高，底线要稳。', photoId: 'bm_shoes' },
  { text: '谈成一个大单，犒劳自己一顿贵的。钱花在自己身上才叫花。', photoId: 'bm_dinner' },
  { text: '店里三周年，花篮摆满了半条街。谢谢每一位姐妹的信任。', photoId: 'bm_flower' },
];

/** 曼曼给小满朋友圈的评论（按圈的类型分池：毒舌是门面，撑腰是里子）。 */
export const BESTIE_COMMENTS: Record<'inspire' | 'family' | 'love', string[]> = {
  inspire: [
    '宝这条可以 状态在线 保持住 好状态是免费的 也是最贵的',
    '点赞了。今日份夸夸到账 请查收（下不为例 夸人很累的）',
  ],
  family: [
    '阿姨真好……（没有别的意思 就是突然觉得阿姨真好）',
    '宝 你是被爱着的 这点姐作证。就是被子……算了 旧被子暖和 懂的都懂',
  ],
  love: [
    '替你开心（真的）就是……算了 没什么 陪你记录',
    '宝 记得我说的：难受的时候看他在哪。别的姐不多嘴',
    '他是有点帅的（不客观）你开心就好',
  ],
};
