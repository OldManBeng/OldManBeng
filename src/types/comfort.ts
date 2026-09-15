/**
 * 舒适圈（第二阶段 1.1.0）：常用手机——小满的另一个世界。
 *
 * 工作手机（崩老头，深夜冷色）之外，她还有一部常用手机：暖色、素颜、
 * 妈和同居男友在里面。切换手机只切视图，时间共用同一条 30 天轴线。
 * 舒适圈的聊天不消耗体力——那是她的生活，不是生意。
 */

/** 舒适圈联系人：父亲在通讯录置灰，不参与聊天。
 *  auntie = 红娘阿姨（受小满妈所托物色对象）；bestie = 闺蜜曼曼（拜金，嘴毒心热）。 */
export type ComfortContactId = 'mother' | 'boyfriend' | 'auntie' | 'bestie';

/** 聊天/归档的说话人 id：三位联系人 + 叙事位 sys + 相亲对象 bd:{id}。 */
export type ComfortSpeakerId = ComfortContactId | 'sys' | `bd:${string}`;

/** 舒适圈事件卡类型。mom_talk/bf_talk/bestie_talk：嘘寒问暖的纯聊天卡；story：暗线剧情卡；
 *  auntie_intro：红娘介绍相亲对象；quarrel：阿凯因相亲炸毛。 */
export type ComfortIncomingKind =
  | 'mom_gift' | 'bf_packet' | 'bf_demand'
  | 'mom_talk' | 'bf_talk' | 'bestie_talk'
  | 'auntie_intro' | 'quarrel'
  | 'story';

/** 挂在常用手机「今天」页的待处理事件（妈的生活费/男友红包/男友要钱/嘘寒问暖/暗线剧情）。 */
export interface ComfortIncoming {
  id: string;
  kind: ComfortIncomingKind;
  day: number;
  /** 红包/要钱的金额（聊天卡/剧情卡为 0）。 */
  amount: number;
  /** 对方的话（每段一条语音，气泡显示语音条 + 文字）。 */
  lines: string[];
  /** 红包备注 / 事件的补充说明。 */
  note?: string;
  /** 引子话术包 id（聊天卡/介绍卡：接受后原样开场的这套话术）。 */
  packId?: string;
  /** 生日卡（农历小满这天的一次性事件）。 */
  tone?: 'birthday';
  /** 暗线剧情卡：对应的 beat id（comfort-story.ts）。 */
  beatId?: string;
}

/** 舒适圈聊天气泡。voiceSecs：语音条显示秒数（纯显示效果，游戏无真实语音）。
 *  narrator：无联系人的叙事气泡（暗线里"她读到的消息"）。 */
export interface ComfortMessage {
  speaker: 'me' | 'them' | 'sys' | 'narrator';
  text: string;
  stamp?: string;
  /** 显示为微信式语音条「某某语音 xx″」；有此字段的气泡先画语音条、文字在下。 */
  voiceSecs?: number;
  /** sys 条横幅文字（转账到账等）。 */
  label?: string;
}

/** 舒适圈聊天里她的一个回复选项 + 对方的回应。 */
export interface ComfortOption {
  text: string;
  /** 对方的回应（可 ｜ 连发，引擎拆气泡）。 */
  reply: string;
  /** 关系变化：family = 家庭关系（妈），love = 感情（男友）。 */
  family?: number;
  love?: number;
}

/** 一套日常话术：他说的话 + 她的选项——同套内上下文天然连贯。 */
export interface ComfortPack {
  id: string;
  /** 话题标签（审计与去重用）。 */
  topic: string;
  /** 他的话（可 ｜ 连发）。 */
  lines: string[];
  /** 她能回的话。 */
  options: ComfortOption[];
}

/** 进行中的一场舒适圈聊天。contactId：联系人 / 叙事位 / 相亲对象。 */
export interface ComfortChat {
  contactId: ComfortSpeakerId;
  transcript: ComfortMessage[];
  pending: ComfortOption[];
  awaiting: 'player' | 'closed';
  closingNote: string | null;
}

/** 聊天归档（容量封顶）。sys = 无联系人的叙事记录；bd:{id} = 相亲对象。 */
export interface ComfortArchive {
  contactId: ComfortSpeakerId;
  day: number;
  transcript: ComfortMessage[];
}

/** 舒适圈朋友圈：小满发励志/晒家/晒恩爱，妈/阿姨/男友/相亲对象来互动。 */
export interface ComfortMoment {
  id: string;
  day: number;
  /** 我 / 三位联系人 / 相亲对象（bd:{id}）。 */
  author: ComfortSpeakerId | 'me';
  /** 我发的三类主打内容。 */
  kind?: 'inspire' | 'family' | 'love';
  /** 配图场景 id（public/comfort/scenes/{cm|bd|bm}/{id}.jpg，404 落 SVG 场景）。 */
  photoId?: string;
  text: string;
  likes: (ComfortSpeakerId | 'me')[];
  comments: { by: ComfortSpeakerId | 'me'; text: string }[];
}

/** 男友线状态：normal → （要钱不给的连锁）→ broken_up（分手+拉黑）→/或→ arrested（D28 崩坏结局：因诈骗"阿姨"们被带走）。 */
export type BfState = 'normal' | 'broken_up' | 'arrested';

/** 舒适圈运行时状态——挂在 GameState.comfort 下，随主存档一起序列化。 */
export interface ComfortState {
  /** 当前是不是常用手机（true = 舒适圈视图）。 */
  active: boolean;
  /** 家庭关系（妈）0-100。 */
  family: number;
  /** 和男友的感情 0-100。 */
  love: number;
  bfState: BfState;
  /** 分手后男友把她拉黑（通讯录置灰、事件停发）。 */
  blockedByBf: boolean;
  /** 男友的生活费/红包/要钱/嘘寒问暖——各线冷却与计数。 */
  momGift: { lastDay: number; count: number };
  bfPacket: { lastDay: number; count: number };
  bfDemand: { lastDay: number; count: number; refuses: number };
  momTalk: { lastDay: number; count: number };
  bfTalk: { lastDay: number; count: number };
  /** 闺蜜的闲聊节奏（她的语音大多在补货路上的碎片时间发出）。 */
  bestieTalk: { lastDay: number; count: number };
  /** 累计从妈那里收过/推掉的钱（钱包页展示）。 */
  momGiven: number;
  momRefused: number;
  bfGiven: number;
  bfRefused: number;
  bfTaken: number;
  /** 待处理事件卡。 */
  incoming: ComfortIncoming[];
  /** 进行中的聊天。 */
  chat: ComfortChat | null;
  /** 暗线剧情：已派发过的 beat id（一次性的故事只讲一遍）。 */
  storyDone: string[];
  /** 聊天归档（最新在后）。 */
  archives: ComfortArchive[];
  /** 每人最近用过的话术套（去重窗口）。 */
  recentPacks: Record<ComfortContactId, string[]>;
  /** 朋友圈动态（最新在后）。 */
  moments: ComfortMoment[];
  unseenMoments: number;
  /** 警察上门的那一天（当天精力清零——录口供，游戏进程被打断）。 */
  policeDay: number;
  /** 切机翻转计数：每次 switch_phone +1（驱动翻面动画重放，随存档序列化）。 */
  flipTick: number;
  /** 阿姨的嘘寒问暖/介绍节奏。 */
  auntie: { lastDay: number; count: number };
  /** 已认识的相亲对象：candidateId → 认识那天的 day。 */
  datesMet: Record<string, number>;
  /** 阿凯因相亲炸毛：已吵架次数 + 待引爆（认识新对象后的第二天早晨）。 */
  quarrel: { count: number; pending: boolean };
  /** 今日联系时间（分钟）：一天只有 40 分钟，每场对话 10 分钟——
   *  忙，是这个家的常态：时间花给谁，就是爱给了谁。每个早晨重置。 */
  minutes: number;
  /** 已确认「开始今天」的天数：dayAck < day 时常用手机弹今日开场景。 */
  dayAck: number;
  /** 待处理的突发事件 id（'' = 无）。一次只来一件；拖到明天落「没接住」。 */
  pending: string;
  /** 这个整月已经来过的事件（事件不重复，除非池子转完一轮）。 */
  incidentsDone: string[];
}
