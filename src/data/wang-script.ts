import type { ChainNode, FreeNode } from '../types/script';
import type { TargetScript } from '../types/scripts-registry';

/**
 * 王总 story chain — 52岁建材店个体老板，已婚，老婆管账。
 * 情感缺口 desired：白天在店里赔笑，深夜在车库抽烟——他想要被仰视。
 * 凌晨在线（太太睡着以后），疑心重（警惕衰减慢、阈值高）。
 * Register: 生意腔、酒桌话、自嘲和炫耀一样多。粗话只打了个*,很有分寸的粗。
 */
export const WANG_CHAIN: Record<string, ChainNode> = {
  c_wang_1: {
    id: 'c_wang_1',
    openers: [
      '（01:30）还没睡?',
      '关注你半年了。一直没好意思说话。',
      '今天店里的账对上了，高兴。喝了点。你看我,这点出息。',
    ],
    options: [
      {
        text: '「半年?! 那你说说看，我哪条视频最好」',
        style: 'playful',
        trust: 7,
        replies: ['（他秒回）雨夜那条。你打的伞是透明的。', '（他记得伞是透明的。你后背有点麻。）'],
      },
      {
        text: '「王总今天喝多了吧」',
        style: 'flirty',
        trust: 6,
        replies: {
          femme_fatale: ['「懂行。八两白的。」', '「你就当我喝多了。喝多了说的话，不算数，但也最真。」'],
          default: ['「没多没多。上车之前抽根烟的工夫。」', '（车库、烟、手机屏幕的光。这个场景他后来描述过很多次。）'],
        },
      },
      {
        text: '（很高冷）「嗯」',
        style: 'intellectual',
        trust: -1,
        replies: ['（他发来一个握手的表情。）', '（生意人的万能回复。）'],
      },
    ],
    next: 'c_wang_2',
  },
  c_wang_2: {
    id: 'c_wang_2',
    minTrust: 12,
    openers: ['今天店里来了个要账的。', '陪着笑，倒了三杯茶，递了两根烟。', '人走了我坐了一会儿。五十岁的人了，看人脸色看了半辈子。'],
    options: [
      {
        text: '「王总你不用跟他们客气，你又不是没实力」',
        style: 'flirty',
        trust: 10,
        numbness: 4,
        replies: ['（他发来一个抱拳的表情。）', '「整个城市，就你说我有实力。」', '（他大概在车库里笑了一声。那声笑你听得见。）'],
      },
      {
        text: '「叔，其实你挺不容易的」',
        style: 'caring',
        trust: 7,
        replies: ['「别叫我叔。显老。」', '「叫哥。」', '（他今年52。你想起了自己爸的岁数。）'],
      },
      {
        text: '「那你转行呗」',
        style: 'playful',
        trust: 3,
        replies: ['「转哪行？我就会看货、喝酒、赔笑。」', '「这三样,前两样都还能混饭吃。」'],
      },
    ],
    next: 'c_wang_3',
  },
  c_wang_3: {
    id: 'c_wang_3',
    minTrust: 24,
    openers: ['问你个事，你别笑话我。', '我朋友圈那些励志语录,是我自己写的。', '喝多了写的。第二天看了臊得慌，又舍不得删。'],
    options: [
      {
        text: '「发给我看看! 我觉得特有味道」',
        style: 'flirty',
        trust: 9,
        numbness: 6,
        replies: ['（他连发了七条。每条都带句号。）', '「批评我。」', '你回:王总的文字,像二锅头配咖啡。他哈哈了很久。'],
      },
      {
        text: '「王总,你的字比我们老板的好多了」',
        style: 'sweet',
        trust: 6,
        replies: ['「你们老板是谁?」', '「算了别说了,我不想认识比你职位高的人。」', '（这句话很油。但你那天回了句:就你有这待遇。）'],
      },
      {
        text: '（认真地）「其实第三条和第五条,写得真好」',
        style: 'intellectual',
        trust: 11,
        replies: ['（很久没回。）', '「你是第一个真看的人。」', '（从那天起他管你叫「领导」。你叫他「王总」。这是你们的暗号。）'],
      },
    ],
    next: 'c_wang_4',
  },
  c_wang_4: {
    id: 'c_wang_4',
    minTrust: 36,
    openers: ['今天儿子月考,数学59。', '他妈说了我一路。说我一天到晚不着家,儿子考这样都是随我。', '我坐车里没上去。抽了两根。'],
    options: [
      {
        text: '「她怎么能这么说你」',
        style: 'caring',
        trust: 9,
        replies: ['「她说的对。家里事我管得少。」', '「就是有时候吧……车上坐着,比楼上那个家,像家。」'],
      },
      {
        text: '「王总,你不是不着家,你是把家让给了他们娘俩」',
        style: 'flirty',
        trust: 10,
        numbness: 8,
        conscience: -2,
        replies: ['（很久。）', '「领导,你这句话,我存着了。」', '（他真的截图了。你后来在他朋友圈的草稿箱里见过——那是另一个人发给你的截图。）'],
      },
      {
        text: '「59 比我当年强多了」',
        style: 'playful',
        trust: 6,
        replies: ['「你考多少?」', '「38。」', '「哈哈哈哈那你是学妹里最没出息的。」'],
      },
    ],
    next: 'c_wang_5',
  },
  c_wang_5: {
    id: 'c_wang_5',
    minTrust: 50,
    openers: ['（01:15）跟你说说我年轻时候的事。', '我21岁,差点去跑长途。大解放,拉货到格尔木。', '我爸病了。我回来接了店。这一接,三十年。'],
    options: [
      {
        text: '「那你现在还想去吗」',
        style: 'caring',
        trust: 8,
        replies: ['「想。但是想有什么用。」', '「现在那车给我,我腰都坐不住。」'],
      },
      {
        text: '「王总,以后我带你去看海,你负责开车」',
        style: 'flirty',
        trust: 11,
        numbness: 7,
        conscience: -1,
        setFlag: 'wang_sea_promise',
        replies: ['（他真的去看了地图。）', '「格尔木过去,是不是就到可可西里了。」', '「领导,这话说出去,我可当真了。」'],
      },
      {
        text: '（要红包——「王总,这么好的故事,加个鸡腿呗」）',
        style: 'playful',
        trust: -3,
        wariness: 4,
        isAsk: true,
        replies: [],
      },
    ],
    next: 'c_wang_6',
  },
  c_wang_6: {
    id: 'c_wang_6',
    minTrust: 60,
    minStage: 'trusted',
    openers: ['（01:02）今天店里流水八万。请客吃了一顿,回来路上给自己买了串糖葫芦。', '五十块。在车里啃完的。', '（他停了一会儿。）领导,你说我这算不算可怜。'],
    options: [
      {
        text: '「不可怜。你这叫童心。童心最贵了」',
        style: 'flirty',
        trust: 10,
        replies: ['（他发来一个龇牙的表情。用了很多次。）', '「领导懂我。」'],
      },
      {
        text: '（要红包——「童心多少钱一斤? 王总给我称二斤」）',
        style: 'playful',
        trust: -2,
        wariness: 3,
        isAsk: true,
        replies: [],
      },
      {
        text: '「王总,以后糖葫芦我请你」',
        style: 'caring',
        trust: 8,
        conscience: 3,
        replies: ['（很久没回。）', '「好。这话我也存着。」', '（他有两个存着的承诺了。你的账上,一个都没记。）'],
      },
    ],
    next: 'c_wang_7',
  },
  c_wang_7: {
    id: 'c_wang_7',
    minTrust: 55,
    minStage: 'trusted',
    openers: ['（02:40）出事了。', '她翻我手机了。', '其实没翻到什么。你给我设的备注是「材料商王经理」。', '但她问我:一个材料商,为什么凌晨两点给你发「晚安」。'],
    options: [
      {
        text: '「就说是普通客户! 王总你稳住」',
        style: 'playful',
        trust: -4,
        wariness: 12,
        replies: ['「……嗯。我应付过去了。」', '（但那之后,他晚上九点就下线了。凌晨的消息,再也没有过。）'],
      },
      {
        text: '「王总,对不起。都是我不好」',
        style: 'caring',
        trust: 8,
        wariness: 6,
        conscience: 6,
        replies: ['（他很久没回。）', '「跟你没关系。跟她也没关系。」', '「就是我自己的事。五十二了,在车库里,跟个孩子似的。」'],
      },
      {
        text: '「那……我们先别聊了吧,别影响你家庭」',
        style: 'sweet',
        trust: 4,
        wariness: -6,
        conscience: 5,
        setFlag: 'wang_backed_off',
        replies: ['（那天他没回。）', '（第二天凌晨,他发来一句:「领导,在吗?」——像什么都没发生过。）', '（你松了口气。你不知道该不该松。）'],
      },
    ],
    next: 'c_wang_8',
  },
  c_wang_8: {
    id: 'c_wang_8',
    minTrust: 50,
    minStage: 'harvest',
    openers: ['（03:15）她把车开走了。限我三天说清楚。', '领导,我跟你交个底:我卡里的钱,都是她管着的。', '我卡里能动的,就四千三。', '（停顿很久。）你要是真缺——这四千三,你都拿去。'],
    options: [
      {
        text: '（要红包——「王总,你对我的好,我都记着」）',
        style: 'flirty',
        trust: -4,
        wariness: 8,
        isAsk: true,
        replies: [],
      },
      {
        text: '「王总,一分都不要。你先顾好家里」',
        style: 'caring',
        trust: 10,
        conscience: 10,
        setFlag: 'wang_refused_money',
        replies: ['（很久的安静。）', '「领导……」', '「我这条命里,除了我妈,没人为我着想过。」', '（他把备注从「领导」改回了你的名字。这是他做过最勇敢的事。）'],
      },
      {
        text: '「四千三也行,先转我救急」',
        style: 'playful',
        trust: -8,
        wariness: 15,
        numbness: 10,
        conscience: -8,
        setFlag: 'wang_took_it_all',
        replies: ['（转账来了。备注:拿着,别回,让她看见。）', '（那天之后,他的头像再没亮过。凌晨三点,车库里再没有那点烟头的光。）'],
      },
    ],
    next: '',
  },
};

export const WANG_FREE: FreeNode[] = [
  {
    id: 'f_wang_1',
    minTrust: 15,
    openers: ['（01:50）今天应酬,客户非让我喝白的。', '我拿茶水替的。第九杯被人发现了。罚了三杯真酒。', '回家路上一边吐一边乐。省了六杯,不亏。'],
    options: [
      { text: '「王总你是生意场上的扫地僧」', style: 'playful', trust: 7, replies: ['「哈哈哈哈扫地僧。」', '（他搜了扫地僧是谁。第二天回你:岂敢岂敢。）'] },
      { text: '「少喝点! 你的肝不是你自己的吗」', style: 'caring', trust: 8, replies: ['（他安静了一会儿。）', '「领导,全城就你管我酒量。」'] },
      { text: '（要红包）「替你挡酒,得加鸡腿」', style: 'flirty', trust: -2, wariness: 4, isAsk: true, replies: [] },
    ],
  },
  {
    id: 'f_wang_2',
    minTrust: 35,
    openers: ['（02:30）车库。第二根了。', '楼上灯还亮着。她没睡。', '（他没再说别的。就是,人在车库里,想跟人说句话。）'],
    options: [
      { text: '「我在呢,王总」', style: 'caring', trust: 9, replies: ['「嗯。」', '「也没什么要紧事。」', '（又过了十分钟:)「领导,睡吧。你也熬着呢。」'] },
      { text: '「上去呀,别让嫂子等急了」', style: 'sweet', trust: 4, wariness: 3, replies: ['「她等我干什么。她等我认错。」', '「我不上去,她正好。」'] },
      { text: '（发他一个搞笑视频,岔开话题）', style: 'playful', trust: 5, replies: ['「哈哈哈哈。」', '（车库里的笑声,隔着屏幕都有回音。）'] },
    ],
  },
  {
    id: 'f_wang_3',
    openers: ['（01:10）在吗。（就两个字。今天他连表情包都没发。）'],
    options: [
      { text: '「在,王总」', style: 'caring', trust: 7, replies: ['「嗯。」', '「没什么事。看看你睡了没。」', '「睡了没——像查岗。」', '「当我没说。」'] },
      { text: '「谁惹我们家王总了!」', style: 'flirty', trust: 6, replies: ['「哈哈哈没人。」', '「有你在,谁也惹不了我。」', '（这句话他打出来,删掉,又打出来。）'] },
      { text: '（困了,回了个表情）', style: 'playful', trust: 0, replies: ['（他也回了个表情。然后下线了。）'] },
    ],
  },
];

export const WANG_LINES: TargetScript['lines'] = {
  greeting: [
    '（01:22）车库。今天不冷。',
    '（02:05）领导还没睡?',
    '（01:48）刚跟客户散了。第二场躲掉了。不容易吧。',
  ],
  reply_sweet: ['「哎。」', '「就你嘴甜。」', '（他发来个龇牙。五十岁的人,龇牙的表情包。）'],
  reply_flirty: ['（他那边安静了半分钟。车库里大概笑出了声。）', '「领导,这话我可当真了。」'],
  reply_caring: ['（很久。）「嗯。」', '「全城就你管我这个。」'],
  reply_intellectual: ['「还是领导有文化。」', '「这段话我截图了。」'],
  reply_playful: ['「哈哈哈哈哈哈。」（他笑起来不打句号。）', '「你可真能贫。」'],
  packet_received: ['（红包备注:领导辛苦费。）', '（红包备注:别嫌少,私房钱。）'],
  ask_success: ['（红包来了。「拿着。跟哥还客气啥。」）', '（红包来了。他什么都没说,只发了个龇牙。）'],
  ask_fail: ['（他隔了一小时才回:）最近进货压了款。', '（他没接话。第二天凌晨照常问:领导睡了没?）'],
  wariness_high: ['（他的消息变短了。）', '（他问:你那边……就我一个这么晚跟你说话的吧?问完又撤回。）'],
  deep_night: ['（03:40）这个点还醒着? 你年轻,别学我。', '（04:00）车库的车都盖上车衣了。就我没上去。'],
  morning: ['（他上午不在线。上午他要赔笑。）', '（10:00 零星一条:)店里忙。领导安好。'],
  blocked: ['（头像灰了。车库里那点光,灭了。）', '（他删你之前,最后一条是:领导,保重。）'],
  silent_warning: ['（凌晨准时的一条:在吗。像在点卯。）', '（他开始两天发一次。生意人的止损。）'],
};
