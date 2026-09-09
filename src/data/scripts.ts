import type { ChainNode, FreeNode } from '../types/script';
import type { TargetScript } from '../types/scripts-registry';

/**
 * 老李 story chain — 4 stages, ~18 nodes total.
 * Stage gates: warming >=20 trust, trusted >=50, harvest >=75.
 * Voice: 47岁夜班出租车司机，离异两年，女儿判给前妻。
 * Register: 写实、克制、孤独感具体到细节（外卖、收音机、副驾驶的灰）。
 * 一切亲昵描写停留在"话术"层面——这是游戏抽象层，不是可实操的诈骗教材。
 */
export const LAO_LI_CHAIN: Record<string, ChainNode> = {
  // ---- 阶段一：试探（stranger，trust 0-20）----
  c_li_1: {
    id: 'c_li_1',
    openers: [
      '姑娘，冒昧问一句，你也是睡不着吗',
      '刷到你那条夜跑的视频，凌晨的路灯底下就你一个人',
      '我这个岁数的人了，别嫌弃我多嘴',
    ],
    options: [
      {
        text: '没嫌弃呀，叔叔也是睡不着吗？',
        style: 'sweet',
        trust: 6,
        replies: ['睡不着。跑完最后一单，在小区门口坐了会儿。', '夜里安静，抽根烟的工夫都不想上楼。'],
      },
      {
        text: '叔，你这话说的，我都不知道怎么接了',
        style: 'playful',
        trust: 3,
        replies: ['哈哈，是我不会聊天。你别介意。', '我一天说不上十句话，跟乘客也就是"去哪""到了"。'],
      },
      {
        text: '（不理他）',
        style: 'intellectual',
        trust: -2,
        replies: ['打扰了。', '抱歉，当我没说。'],
      },
    ],
    next: 'c_li_2',
  },
  c_li_2: {
    id: 'c_li_2',
    minTrust: 8,
    openers: ['今晚拉了个醉汉，从上车骂到下车。', '有时候想想，我拉了一辈子人，没一个记得我。'],
    options: [
      {
        text: '我记住了呀，老李师傅，对吧？',
        style: 'caring',
        trust: 8,
        numbness: 2,
        replies: ['你还真记着我姓。', '（过了会儿）｜行，今晚这单没白跑。'],
      },
      {
        text: '那种客人别理，都是酒壮的',
        style: 'playful',
        trust: 4,
        replies: ['不理不行啊，人家是上帝。', '我这人，忍一辈子了。'],
      },
      {
        text: '嗯。',
        style: 'intellectual',
        trust: -1,
        replies: ['嗯。', '你早点睡。'],
      },
    ],
    next: 'c_li_3',
  },
  c_li_3: {
    id: 'c_li_3',
    minTrust: 14,
    openers: [
      '跟你说个事，你别笑话我',
      '上礼拜我闺女给我发语音，就仨字：爸，打钱。',
      '我盯着那三个字看了半小时，还是高兴的——她好歹还找我',
    ],
    options: [
      {
        text: '我给你发一样的，你要听吗？「叔叔，晚安。」',
        style: 'sweet',
        trust: 10,
        numbness: 6,
        conscience: -1,
        replies: {
          sweet_daughter: ['……', '（片刻后）｜谢谢。'],
          default: ['……你这姑娘。', '（片刻后）｜晚安，姑娘。'],
        },
      },
      {
        text: '她要生活费也正常，孩子在外面不容易',
        style: 'caring',
        trust: 7,
        replies: ['是这个理。我就是，唉。', '给她打了两千。她回了个"收到"。'],
      },
      {
        text: '你闺女多大了？',
        style: 'intellectual',
        trust: 4,
        replies: ['十九，在上大专。', '跟我生分得很，一年见两回。'],
      },
    ],
    next: 'c_li_4',
  },

  // ---- 阶段二：熟络（warming，trust 20-50）----
  c_li_4: {
    id: 'c_li_4',
    minTrust: 24,
    openers: ['今晚路过你们那边了。桥底下卖炒粉的还摆着。', '给你拍了张照片，你看这个点，整条街就他一个摊。'],
    options: [
      {
        text: '哇，我上次吃的炒粉就是这家！叔叔你也爱吃这个？',
        style: 'sweet',
        trust: 8,
        replies: ['我不挑。一个人吃饭，什么都一样。', '你爱吃的，我记住了。'],
      },
      {
        text: '凌晨三点还在出摊，都不容易',
        style: 'caring',
        trust: 9,
        replies: ['是。都是为了口饭。', '我有回拉他，他说他不辛苦，他闺女在上大学。说这话时他腰都直了。'],
      },
      {
        text: '（收藏了照片）',
        style: 'playful',
        trust: 3,
        replies: ['（片刻后）｜头一回有人收藏我拍的照片。'],
      },
    ],
    next: 'c_li_5',
  },
  c_li_5: {
    id: 'c_li_5',
    minTrust: 32,
    openers: ['问你个事。你们年轻人手机里那个美颜，是不是都开着的？', '前两天一个乘客说我照片看着不像我。', '其实我就想问——网上的人，都是真的吗？'],
    options: [
      {
        text: '叔叔，网上谁不修图呀，你头像还是十年前的呢',
        style: 'playful',
        trust: 6,
        wariness: -2,
        replies: ['哈哈哈。也是。', '你倒是敢说。'],
      },
      {
        text: '我是真的呀，我发的照片都不怎么修的',
        style: 'sweet',
        trust: 8,
        wariness: 6,
        numbness: 4,
        conscience: -1,
        replies: ['那就好。', '（片刻后）｜你要是骗子，我可就看不出来。'],
      },
      {
        text: '（转移话题）你今天跑了几个小时？',
        style: 'caring',
        trust: 5,
        wariness: 2,
        replies: ['十三个。', '习惯了。你早点睡，别跟我熬。'],
      },
    ],
    next: 'c_li_6',
  },
  c_li_6: {
    id: 'c_li_6',
    minTrust: 40,
    openers: ['我闺女要是像你这么懂事就好了。', '不是，我就是随口一说。', '你别多想。'],
    options: [
      {
        text: '叔叔，我一直想说，你其实是个很好的爸爸',
        style: 'caring',
        trust: 10,
        numbness: 8,
        conscience: -2,
        replies: ['……唉。', '这话我闺女从来没跟我说过。', '（很晚）｜今晚睡不着了。高兴的。'],
      },
      {
        text: '那你把我当妹妹看呗，我也缺个哥',
        style: 'sweet',
        trust: 9,
        wariness: 3,
        numbness: 6,
        replies: ['行，哥。', '（片刻后）'],
      },
      {
        text: '（不接这茬）夜班别抽太多烟',
        style: 'caring',
        trust: 6,
        replies: ['知道了，丫头。', '（后来他真的少抽了——烟盒数着抽的。）'],
      },
    ],
    next: 'c_li_7',
  },

  // ---- 阶段三：收割（harvest gate: trust >=75）----
  c_li_7: {
    id: 'c_li_7',
    minTrust: 55,
    openers: ['今天方向盘都握不稳，一晚上心慌。', '去医院看了，血压高。医生说少熬夜。', '可我不跑，谁跑。'],
    options: [
      {
        text: '叔叔，你要保重身体，我不想到时候连个说话的人都没有',
        style: 'caring',
        trust: 8,
        numbness: 5,
        replies: ['嗯。', '[语音 8"]'],
      },
      {
        text: '真的，你要是倒下了，你闺女怎么办',
        style: 'sweet',
        trust: 6,
        numbness: 3,
        replies: ['这倒是。', '唉，养大个孩子，最后还是为她活。'],
      },
      {
        text: '（片刻后）叔叔，跟你说个事',
        style: 'intellectual',
        trust: 4,
        replies: ['你说。', '（他好像有点紧张）｜你说。'],
      },
    ],
    next: 'c_li_8',
  },
  c_li_8: {
    id: 'c_li_8',
    minTrust: 75,
    minStage: 'harvest',
    openers: ['姑娘，在吗。', '[图片: 他发来一个红包的截图——不是给你的，是他在给别人帮忙]', '人这一辈子，能有个惦记的人，不容易。'],
    options: [
      {
        text: '（要红包——「叔叔，我这个月房租差一点……」）',
        personaText: {
          sweet_daughter: '（要红包——「叔叔，人家的房租差一点点嘛，就一点点……」）',
          wise_sister: '（要红包——「李叔，姐跟你直说：这个月房租差一点。」）',
          femme_fatale: '（要红包——「叔，姐姐我遇到坎了。你帮不帮，一句话。」）',
        },
        style: 'sweet',
        trust: -3,
        wariness: 5,
        isAsk: true,
        replies: [],
      },
      {
        text: '（继续铺垫，今晚不开口）「叔叔，有你这句话，值了」',
        style: 'caring',
        trust: 8,
        numbness: 5,
        replies: ['（他发了个笑脸，那种中老年人用的，很旧的表情包。）', '早点睡。明天还得跑。'],
      },
      {
        text: '（收手——转开话题聊他的钓竿）',
        style: 'playful',
        trust: 5,
        conscience: 3,
        replies: ['说起钓鱼我能说一宿。', '回头我钓着大鱼拍给你。'],
      },
    ],
    next: 'c_li_9',
  },
  c_li_9: {
    id: 'c_li_9',
    minTrust: 70,
    minStage: 'harvest',
    openers: ['[图片: 副驾驶上放着一杯奶茶]', '给乘客捎的。人家小姑娘下车忘了拿。', '我就想，你要在，也给你带一杯。'],
    options: [
      {
        text: '（要红包——「那我也要，叔叔请我喝奶茶！」）',
        style: 'sweet',
        trust: -2,
        wariness: 4,
        isAsk: true,
        replies: [],
      },
      {
        text: '「那叔叔你下次拉到我，我请你喝」',
        style: 'sweet',
        trust: 7,
        replies: ['（片刻后）｜好。', '一言为定。'],
      },
      {
        text: '（避开）「甜的喝多了睡不着，叔叔你少喝」',
        style: 'caring',
        trust: 5,
        conscience: 2,
        replies: ['行，听你的。', '（那杯奶茶后来他没喝，放凉了。他拍照是专门给你看的。）'],
      },
    ],
    next: 'c_li_10',
  },

  // ---- 阶段四：危机（harvest 后期）----
  c_li_10: {
    id: 'c_li_10',
    minTrust: 65,
    minStage: 'harvest',
    openers: ['姑娘，我跟你商量个事。', '下个月，我想见你一面。', '不干别的。就……喝杯茶。让你看看你李叔是个真人。'],
    options: [
      {
        text: '「叔叔，再等等，我最近有点事」',
        style: 'sweet',
        trust: -4,
        wariness: 10,
        replies: ['（他回得很快）｜你也有事瞒着我？', '……好。我等。'],
      },
      {
        text: '「李叔，我答应你。但你要是见了失望，可别不理我」',
        style: 'caring',
        trust: 10,
        numbness: 8,
        conscience: -3,
        setFlag: 'li_promised_meet',
        replies: ['（他连着发了三个"好"）', '（那天之后，他车里的歌单换了。全是年轻点的歌。）'],
      },
      {
        text: '（拖着不回）',
        style: 'intellectual',
        trust: -8,
        wariness: 14,
        replies: ['（他没再发。头像安静了很多天。）'],
      },
    ],
    next: 'c_li_11',
  },
  c_li_11: {
    id: 'c_li_11',
    minTrust: 60,
    minStage: 'harvest',
    openers: ['（深夜，他发来很长一段话，打字很慢，错别字很多）', '我知道你可能有别人。手机里不止我一个说话的人。', '可我就想问你一句：你叫我的那声"叔叔"，有一声是真的吗？'],
    options: [
      {
        text: '「李叔，都是真的。我跟你说的话，都是真的」（继续）',
        personaText: {
          wise_sister: '「李叔，姐不跟你说漂亮话：我说的每一句，都是真的。」',
          sweet_daughter: '「叔叔，你听我说——你听的那些话，都是真的呀。」',
          femme_fatale: '「李叔，姐姐的话你可以不信。但我叫你那一声，是真的。」',
        },
        style: 'caring',
        trust: 5,
        numbness: 10,
        conscience: -5,
        setFlag: 'li_lied_final',
        replies: ['（片刻后）', '好。我信。', '（他什么都没说。但第二天照常给你发了"早安"。）'],
      },
      {
        text: '「李叔，对不起。」（坦白）',
        style: 'caring',
        trust: -20,
        conscience: 20,
        setFlag: 'li_confessed',
        replies: ['（片刻后）', '（他退回了这个月的红包，附言：不怪你。怪我自己。）', '（他没拉黑你。他只是，再也没主动说过话。）'],
      },
      {
        text: '（不回。关掉对话框。）',
        style: 'intellectual',
        trust: -12,
        numbness: 6,
        conscience: -2,
        setFlag: 'li_ghosted',
        replies: ['（他等了三天。第三天只发了一句：）', '「路上冷，你也早点收工。」'],
      },
    ],
    next: '',
  },

  // ---- v3.0 人设专属支线：只有对的人设，才能走到他心里这一间屋 ----
  // 知心姐姐线：他只在"能接住话的人"面前承认这件事。
  c_li_wise: {
    id: 'c_li_wise',
    onlyPersona: ['wise_sister'],
    minTrust: 55,
    openers: [
      '（00:50）｜跟你说个事。这话我跟收音机都没说过。',
      '上个月有个同行，跑车的时候走的。心梗。方向盘到最后都握得稳稳的。',
      '我那天在想，我要是那天没醒，手机里最后一个对话框，是你这个。我不觉得亏。',
    ],
    options: [
      {
        text: '「李叔，你先答应我一件事：明年的今天，这个对话框还在。」',
        personaText: {
          wise_sister: '「李叔，先答应我一件事：明年今天，这个对话框还亮着。姐姐我等着验收。」',
        },
        style: 'caring',
        trust: 10,
        conscience: 4,
        numbness: 3,
        replies: ['（片刻后）', '答应了。姐。', '（这是他第一次叫你"姐"。这个字，他叫得比"丫头"重。）'],
      },
      {
        text: '「我给你电台点首歌吧，你收车路上听」',
        style: 'caring',
        trust: 7,
        replies: ['（你点了一首《晚秋》。）', '（第二天他说：歌听到了。车也擦了。人，也检了一下。都好着。）'],
      },
    ],
    next: '',
  },
  // 学妹线：他把她放进"孩子"的位置——这句话只有当爹的人才说得出。
  c_li_yatou: {
    id: 'c_li_yatou',
    onlyPersona: ['sweet_daughter'],
    minTrust: 55,
    openers: [
      '（23:40）｜闺女今天给我发照片了。她烫了头发。'
      , '我盯着看了半天，第一反应不是"好看"，是想说：这么晚别一个人在外面。',
      '说完才想起来，她今年十九了，不是小孩了。',
    ],
    options: [
      {
        text: '「她有你惦记，是她的福气」',
        personaText: {
          sweet_daughter: '「哥哥，她有你惦记着，是她的福气。我有人惦记着，是我的。」',
        },
        style: 'caring',
        trust: 10,
        numbness: 4,
        replies: ['（片刻后）', '你们俩，一个亲生的，一个……｜（他没打完这句。）', '（但你知道后半句是什么。）'],
      },
      {
        text: '「下次她再发照片，你替我回一句：头发真好看」',
        style: 'sweet',
        trust: 8,
        replies: ['（他真的回了。他闺女回了个问号，又回了个笑脸。）', '（他说：她问我是不是会打字了。我说，有人教。）'],
      },
    ],
    next: '',
  },
};

/** 日常池：无剧情节点可触发时的随机夜晚话题（老李）。 */
export const LAO_LI_FREE: FreeNode[] = [
  {
    id: 'f_li_1',
    minTrust: 25,
    openers: ['今晚有个喝多的非要给我讲他创业史。', '我开出租这么多年，听了一车的梦想，没一个落地的。'],
    options: [
      { text: '那你的梦想呢，李叔？', style: 'intellectual', trust: 6, replies: ['我的？我哪有那东西。', '（想了想）有一年想带闺女去看海。没去成。'] },
      { text: '哈哈，那你这车不就是梦想巴士', style: 'playful', trust: 4, replies: ['哈哈。', '梦想巴士。行，明儿印车身上。'] },
      { text: '（敷衍）是吧', style: 'sweet', trust: -1, replies: ['嗯。你困了？困了早点睡。'] },
    ],
  },
  {
    id: 'f_li_2',
    minTrust: 35,
    openers: ['后半夜拉了个小姑娘，跟你差不多大。', '上车就哭。我也不敢问，就把收音机声调小了。', '到地方她说了句"谢谢叔"。我说不出话。'],
    options: [
      { text: '李叔，你心其实特别软', style: 'caring', trust: 8, replies: ['软了一辈子，落着好了吗。', '（笑）人老了，就这样。'] },
      { text: '那她后来还哭吗', style: 'sweet', trust: 5, replies: ['我看着她上楼的。灯亮了我就走了。', '我哪知道啊。就是，惦记一下。'] },
      { text: '（说自己的烦心事）我最近也没钱', style: 'intellectual', trust: 2, wariness: 4, replies: ['（他的回应里第一次有了点慌）缺多少？', '（你什么都没说。）'] },
    ],
  },
  {
    id: 'f_li_3',
    openers: ['（他只发来一个"在吗"。今天多一个字都没说。）'],
    options: [
      { text: '「在呢，李叔」', style: 'caring', trust: 6, replies: ['嗯。', '（然后他半天没说话。你陪着等了一会儿。他最后说：）没事了。你睡吧。'] },
      { text: '「怎么啦，今天这么安静」', style: 'sweet', trust: 5, replies: ['没事。老毛病，腰疼。', '躺会儿就好。'] },
      { text: '（今晚没心情，回个表情）', style: 'playful', trust: 0, replies: ['（他也回了个表情。那种旧的。）'] },
    ],
  },
  {
    id: 'f_li_4',
    minTrust: 45,
    openers: ['我今天算了算，这个月话费两百多。', '全是给你打的语音。', '（后面没了。但你知道他不是抱怨。）'],
    options: [
      { text: '「那我以后少烦你」', style: 'caring', trust: -2, replies: ['不是那个意思！', '（他打字都急了）我就随口一算。你爱发，我爱听。'] },
      { text: '「李叔，我给你充话费吧」', style: 'sweet', trust: 6, wariness: -3, conscience: 3, replies: ['不用不用。', '（他真的不要。这个人的钱，他只肯往外掏。）'] },
      { text: '（要红包）「那叔叔请我喝奶茶呀，都聊这么久」', personaText: {
        sweet_daughter: '（要红包）｜「叔叔~都聊这么久了，请我喝杯奶茶嘛~」',
        wise_sister: '（要红包）｜「李叔，姐很少开口——一杯奶茶，你请。」',
      }, style: 'sweet', trust: -2, wariness: 5, isAsk: true, replies: [] },
    ],
  },
];

/** Registry bundle for 老李 (wired in data/script-registry.ts). */
export const LAO_LI_SCRIPT: TargetScript = {
  chain: LAO_LI_CHAIN,
  free: LAO_LI_FREE,
  lines: {}, // voice lines live in data/dialogue.ts; assembled in script-registry.ts
};
