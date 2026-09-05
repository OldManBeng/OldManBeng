import type { Target } from '../types/target';

/**
 * M1: 老李 fully written (story chain + free-roam pool + voice lines).
 * Others are card stubs pending M3 content pass — excluded from M1_TARGETS.
 */
export const TARGETS: Target[] = [
  {
    id: 'lao_li',
    name: '老李',
    archetype: 'divorced_driver',
    age: 47,
    bio: '跑了二十年夜班出租车，两年前离的婚。女儿判给了前妻，一年见两回。晚上收车回家，一个人对着电视吃外卖，电视开着不是为了看，是为了屋里有个声。',
    personality: '话不多，但聊起来了就刹不住——没人听他说话太久了。',
    likes: '钓鱼、车载收音机、辣的',
    dislikes: '股评、网红店、他前妻',
    need: 'listened_to',
    preferredStyles: ['caring', 'sweet'],
    goodPersonas: ['wise_sister', 'sweet_daughter'],
    badPersonas: ['femme_fatale'],
    warinessThreshold: 40,
    generosity: 1,
    topics: ['夜班', '钓鱼', '女儿', '离婚', '外卖', '收音机'],
    activeHour: 23,
    traits: ['night_owl', 'loneliness'],
    portraitSpec: {
      hair: 2, // receding
      hairColor: '#3a3a3a',
      glasses: 0,
      beard: 1,
      cheeks: 0.55,
      shirtColor: '#4a5d6e', skin: 2, brow: 1,
      bgScene: 'night_road',
      accessory: 'steering_wheel',
      accent: '#4a5d6e',
    },
  },
  {
    id: 'zhou_teacher',
    name: '周老师',
    archetype: 'widowed_teacher',
    age: 63,
    bio: '中学语文教师，退休三年，丧偶四年。儿子在深圳，一年回来一次。早上五点半醒，给阳台的花浇水，然后一整天，家里只剩下一口走得比谁都响的挂钟。在社区书法班带课，学生都是比他年纪大的人；老年大学还请他讲一节诗词赏析，教室里有讲台，也有粉笔。',
    personality: '客气、老派、克制。他的孤独是文人式的——把"无事发生"写成日记，给谁看都行，就是没人看。',
    likes: '旧诗、毛笔字、浇花、白粥',
    dislikes: '空调直吹、短视频神曲、忘性大',
    need: 'daughter_figure',
    preferredStyles: ['intellectual', 'caring'],
    goodPersonas: ['sweet_daughter', 'artistic_soul'],
    badPersonas: ['femme_fatale'],
    warinessThreshold: 55,
    generosity: 1,
    topics: ['书法', '旧诗', '老伴', '儿子', '体检', '挂钟'],
    activeHour: 9, // morning — 退休人的清晨从五点半开始
    traits: ['generous', 'clingy'],
    portraitSpec: {
      hair: 1, // thinning combed-over
      hairColor: '#c9c2b8',
      glasses: 1, // square
      beard: 0,
      cheeks: 0.3,
      shirtColor: '#7a6f5f', skin: 0, brow: 0,
      bgScene: 'study',
      accessory: 'calligraphy_brush',
      accent: '#7a6f5f',
    },
  },
  {
    id: 'boss_wang',
    name: '王总',
    archetype: 'married_boss',
    age: 52,
    bio: '建材店个体老板，五十平的门脸，三十年。老婆管账，他管进货和应酬。白天赔笑，深夜在车库的车里抽烟刷手机——那是他一天里唯一属于自己的四十分钟。朋友圈全是自己喝多了写的励志语录。',
    personality: '生意腔、酒桌话，自嘲和炫耀一样多。他想要的不是钱花出去，是被人真心觉得"王总还行"。',
    likes: '白粥、糖葫芦、开车、被人叫"王总"',
    dislikes: '要账的、财务软件、儿子成绩单',
    need: 'desired',
    preferredStyles: ['flirty', 'playful'],
    goodPersonas: ['femme_fatale', 'sweet_daughter'],
    badPersonas: ['wise_sister'],
    warinessThreshold: 65,
    generosity: 1,
    topics: ['生意', '酒局', '车库', '儿子', '励志语录'],
    activeHour: 1, // 凌晨——太太睡着以后
    traits: ['suspicious', 'night_owl'],
    portraitSpec: {
      hair: 2, // receding
      hairColor: '#4a4038',
      glasses: 0,
      beard: 0,
      cheeks: 0.8, // well-fed
      shirtColor: '#8a4a3a', skin: 1, brow: 1,
      bgScene: 'garage',
      accessory: 'cigarette',
      accent: '#8a4a3a',
    },
  },
  {
    id: 'hao_ge',
    name: '阿豪',
    archetype: 'cafe_owner_ninety',
    age: 35,
    bio: '90年生的网吧老板——"老头"这个称呼里最年轻的讽刺。开了十年网吧，从满座到只剩外卖小哥蹭网。守着四十台机器和一只叫"键盘"的橘猫。朋友们结婚的结婚、跑路的跑路，他还在柜台后面煮泡面加蛋。',
    personality: '话短，打字快，全用游戏黑话。他嘴上"上号""这把稳"，心里算的是这家店还能开几年。',
    likes: 'WOW老号、橘猫键盘、腌萝卜干、38块通宵包早面',
    dislikes: '房东、手游、发小的婚礼请柬',
    need: 'listened_to',
    preferredStyles: ['playful', 'caring'],
    goodPersonas: ['sweet_daughter', 'artistic_soul'],
    badPersonas: ['wise_sister'],
    warinessThreshold: 45,
    generosity: 1,
    topics: ['网吧', '橘猫', 'WOW', '发小', '通宵'],
    activeHour: 21, // 网吧黄金档
    traits: ['clingy'],
    portraitSpec: {
      hair: 0, // full, casual
      hairColor: '#2e2a26',
      glasses: 0,
      beard: 2, // light stubble
      cheeks: 0.4,
      shirtColor: '#3d6b5e', skin: 0, brow: 0,
      bgScene: 'internet_cafe',
      accessory: 'gamepad',
      accent: '#3d6b5e',
    },
  },
  {
    id: 'chen_gong',
    name: '陈工',
    archetype: 'lonely_engineer',
    age: 58,
    bio: '退休机械工程师，独居，儿子在德国。一辈子跟图纸和机床打交道，老伴走后家里安静得像下了班的厂房。阳台上有一台1992年的台钳，每周擦，擦得锃亮。他给手机支架画图纸，公差要求和给机床的一样。',
    personality: '工程师式精确——消息带编号、纠正错别字、说"参数""公差"。他最想要的，是再有人叫他一声"师傅"。',
    likes: '图纸、台钳、浇花装置、被叫"陈总工"',
    dislikes: '咸鱼、"别想太多"、没编号的说明书',
    need: 'respected',
    preferredStyles: ['intellectual', 'caring'],
    goodPersonas: ['artistic_soul', 'wise_sister'],
    badPersonas: ['femme_fatale'],
    warinessThreshold: 70,
    generosity: 1,
    topics: ['图纸', '公差', '老伴', '德国的儿子', '带徒弟'],
    activeHour: 22, // 睡前刷一会儿手机
    traits: ['suspicious', 'generous'],
    portraitSpec: {
      hair: 1, // thinning
      hairColor: '#9a948e',
      glasses: 1, // square
      beard: 0,
      cheeks: 0.35,
      shirtColor: '#5a6d7a', skin: 1, brow: 0,
      bgScene: 'balcony',
      accessory: 'wrench',
      accent: '#5a6d7a',
    },
  },
];
