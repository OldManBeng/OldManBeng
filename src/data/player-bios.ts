import type { TargetArchetype } from '../types/target';
import type { PlayerBioId } from '../types/game';

/**
 * v4.3.3 玩家个性签名（bio）——她挂在微信资料页的一句话。
 * 微信生态里这行字就是广告位：孤独的人读出陪伴，生意人读出生意。
 *
 * 机制：每天早晨 runMorning 按"他的原型 × 你的签名"掷骰——
 * 顺眼的签名让他主动来找你（正增益加概率），不顺眼的让他犯嘀咕
 * （负增益不但不加概率，还提他的警惕）。签名选谁是策略：
 * 你不能讨好所有人——你只能选择被谁看见。
 *
 * 效果上限刻意压着（gains 里最大 +0.10，约等于"断联三天"的拉力；
 * penalties 最大 -0.06，可见但不出戏）——签名是门面，不是钩子。
 * 真正的钩子（自拍/断联/发工资）仍然是剧情行为，门面只负责放大。
 */

export interface PlayerBioOption {
  id: PlayerBioId;
  /** 话术原文——朋友圈签名画风，她自己的口吻。 */
  text: string;
  /** 选卡上的一句效果说明（写给玩家看的，不写数字）。 */
  note: string;
  /** 原型 → 每日"主动来找你"概率增益。 */
  gains: Partial<Record<TargetArchetype, number>>;
  /** 原型 → 每日主动概率减益 + 警惕微涨（他看了犯嘀咕）。 */
  penalties: Partial<Record<TargetArchetype, number>>;
}

export const PLAYER_BIOS: PlayerBioOption[] = [
  {
    id: 'hardup_plaintext',
    text: '交不起房租的第 N 个月，谁来救救孩子',
    note: '直白哭穷。心软的想救你，精明的心里记账。',
    gains: { widowed_teacher: 0.10, night_guard: 0.06, fisherman: 0.06 },
    penalties: { married_boss: 0.05, lonely_engineer: 0.05, chess_uncle: 0.04 },
  },
  {
    id: 'moon_side',
    text: '白天上班，晚上代驾，白天你看到的不是我',
    note: '两份工的疲惫感——同为夜班的人一眼认出同类。',
    gains: { divorced_driver: 0.10, night_guard: 0.10, designated_driver: 0.08 },
    penalties: { widowed_teacher: 0.03 },
  },
  {
    id: 'business_face',
    text: '小本经营｜诚信第一｜非诚勿扰',
    note: '把自己当生意来经营——老板们看着眼熟，老师傅们敬而远之。',
    gains: { married_boss: 0.10, cafe_owner_ninety: 0.05 },
    penalties: { widowed_teacher: 0.05, lonely_engineer: 0.04 },
  },
  {
    id: 'daughter_smile',
    text: '爸走后就没给人撒过娇了',
    note: '一句戳心窝的话。缺女儿的老头坐不住，孤僻的觉得你在演。',
    gains: { widowed_teacher: 0.10, square_dancer: 0.06, fisherman: 0.05 },
    penalties: { lonely_engineer: 0.05, chess_uncle: 0.04 },
  },
  {
    id: 'chess_and_tea',
    text: '落子无悔，输棋认账，人生亦然',
    note: '棋茶中年话术——棋友当你是知己，年轻人划走。',
    gains: { chess_uncle: 0.10, widowed_teacher: 0.05, lonely_engineer: 0.04 },
    penalties: { cafe_owner_ninety: 0.04 },
  },
  {
    id: 'gamer_allnight',
    text: '通宵排位，掉分找我笑',
    note: '网吧画风——九零后老板来劲了，老同志们看不懂。',
    gains: { cafe_owner_ninety: 0.10 },
    penalties: { widowed_teacher: 0.05, lonely_engineer: 0.04, divorced_driver: 0.03 },
  },
  {
    id: 'fish_and_wait',
    text: '愿者上钩，我先睡了',
    note: '钓鱼佬的自我修养——钓友会心，不钓的摸不着头脑。',
    gains: { fisherman: 0.10 },
    penalties: { widowed_teacher: 0.04, married_boss: 0.03 },
  },
  {
    id: 'workout_self',
    text: '自律给我自由，凌晨五点的操场只有我',
    note: '晨练人设——广场舞大爷觉得这孩子有股劲，夜猫子对不上表。',
    gains: { square_dancer: 0.10, married_boss: 0.04 },
    penalties: { divorced_driver: 0.05, night_guard: 0.04, cafe_owner_ninety: 0.04 },
  },
  {
    id: 'cigarettes_alcohol',
    text: '会抽烟会喝酒，就是不会哄人',
    note: '痞气直给——开车的、守夜的吃这套；要正经媳妇的绕道。',
    gains: { divorced_driver: 0.06, night_guard: 0.08, designated_driver: 0.06 },
    penalties: { widowed_teacher: 0.05, lonely_engineer: 0.04, square_dancer: 0.04 },
  },
  {
    id: 'cold_read',
    text: '不聊天，不约见，不接语音——谢谢理解',
    note: '三不原则挂门口。疑心重的反而安心，粘人的直接劝退。',
    gains: { lonely_engineer: 0.08, chess_uncle: 0.05 },
    penalties: { divorced_driver: 0.04, square_dancer: 0.05, designated_driver: 0.03 },
  },
];

export const PLAYER_BIO_MAP: Record<PlayerBioId, PlayerBioOption> = Object.fromEntries(
  PLAYER_BIOS.map((b) => [b.id, b]),
) as Record<PlayerBioId, PlayerBioOption>;

/** 他顺着签名找来时说的第一句——按原型写的，不重样。
 *  注意：老头只"第一次注意到签名"，不引用签名的具体内容——
 *  任何一句签名进场都成立（他不可能知道你上一句写的是什么）。 */
export const BIO_HOOK_BY_ARCHETYPE: Partial<Record<TargetArchetype, string>> = {
  widowed_teacher: '翻到你资料页，那句签名我盯着看了半天。孩子，这句话是写给谁看的？',
  divorced_driver: '深夜跑车，手机一亮就想是不是你。点开一看是你签名那句——刚换的吧？',
  married_boss: '你签名那句我看到了。挂在门口的话得掂量着写——看的人，比你想的多。',
  cafe_owner_ninety: '看到你换签名了。来网吧报我名字，机子给你留好——那句签名当会员卡用。',
  lonely_engineer: '你签名改了。上一句是什么，我记性不好，但你的我记得。',
  night_guard: '值夜班没事翻资料页。你那句签名，我在岗亭里看了三遍。',
  designated_driver: '代驾等单的时候看了你签名。夜里讨生活的人，见了同类的字就挪不开眼。',
  fisherman: '钓鱼的时候刷到你的签名。鱼没咬钩，那句话先咬住我了。',
  chess_uncle: '刷到你签名了。这年头还肯往签名里写真话的人，不多了。',
  square_dancer: '刷到你的签名了。字里带劲的人，广场上也讨人喜欢。哪天来坐坐？',
};

/** 签名与原型的相位：正=顺眼（主动概率↑），负=犯嘀咕（概率↓+警惕微涨），0=没感觉。 */
export function bioPhase(bioId: PlayerBioId, archetype: TargetArchetype): number {
  const bio = PLAYER_BIO_MAP[bioId];
  if (!bio) return 0;
  const g = bio.gains[archetype] ?? 0;
  const p = bio.penalties[archetype] ?? 0;
  return g - p;
}

/** 签名选卡的相位小结：↑ 拉近谁、↓ 谁看着犯嘀咕（不写数字，写给玩家看）。 */
export function bioMatchLine(bioId: PlayerBioId, archetype: TargetArchetype): string | null {
  const bio = PLAYER_BIO_MAP[bioId];
  if (!bio) return null;
  if (bio.gains[archetype]) return '他常顺着这句来找你';
  if (bio.penalties[archetype]) return '这句让他犯嘀咕';
  return null;
}
