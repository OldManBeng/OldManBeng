/**
 * v2.3 钱包商店：廉价的道具，真实的代价。
 * 设计意图：定价压在「奶茶钱能买、顶配一个月工资买不起」的档位——
 * 一个红包 warming ~24 元 / trusted ~35 元，所以买口红 ≈ 一个红包。
 * 顶配 ¥780 几乎等于放弃这个月目标：欲望的天花板，买得起就停不下来了。
 */

export type ShopItemEffect =
  /** 当天精力 +N。 */
  | { kind: 'energy'; amount: number }
  /** 当天精力 +N，麻木 -M。 */
  | { kind: 'energyCalm'; energy: number; numbnessDown: number }
  /** 下一场对话开场好感 +N（用完即止）。 */
  | { kind: 'lipstick'; bonus: number }
  /** 之后每场对话开场好感 +N（本局持续）。 */
  | { kind: 'jewelry'; bonus: number }
  /** 本局：发自拍后 incoming 概率 +bonus。 */
  | { kind: 'retouch'; bonus: number }
  /** 本局：聊天精力消耗 -1（4 → 3）。 */
  | { kind: 'powerbank' }
  /** 本局：精力上限 → 24（多两场对话/天），风险 +10。 */
  | { kind: 'streamerKit'; energyMax: number; riskAdd: number };

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  desc: string;
  flavor: string;
  /** 一次性（唯一道具，买一次就没）还是可复购。 */
  unique: boolean;
  effect: ShopItemEffect;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'energy_drink', name: '能量饮料', price: 9,
    desc: '当天精力 +4。',
    flavor: '红瓶的。喝完心口发热——你分不清是精神了还是慌了。',
    unique: false, effect: { kind: 'energy', amount: 4 },
  },
  {
    id: 'instant_coffee', name: '速溶咖啡', price: 18,
    desc: '当天精力 +8。',
    flavor: '咖啡因起效，今晚还能再撑一会儿。白天困的时候想起，这是谁提的神。',
    unique: false, effect: { kind: 'energy', amount: 8 },
  },
  {
    id: 'milk_tea', name: '奶茶（大杯）', price: 16,
    desc: '当天精力 +5，麻木 -3。',
    flavor: '甜的东西让人清醒一点——这话说出来自己都不信。',
    unique: false, effect: { kind: 'energyCalm', energy: 5, numbnessDown: 3 },
  },
  {
    id: 'lipstick', name: '地摊口红', price: 25,
    desc: '下一场对话好感 +4（用完即止）。',
    flavor: '二十五块的口红涂出二十五万的效果，全靠晚上那盏路灯。',
    unique: false, effect: { kind: 'lipstick', bonus: 4 },
  },
  {
    id: 'jewelry', name: '廉价首饰（手链）', price: 58,
    desc: '之后每场对话好感 +1（本局持续）。',
    flavor: '会掉色的手链。但掉色之前的那段日子，它真的有光。',
    unique: true, effect: { kind: 'jewelry', bonus: 1 },
  },
  {
    id: 'retouch_app', name: '修图 App 会员', price: 30,
    desc: '本局发自拍后他来找你的概率更高。',
    flavor: '月卡三十块。滤镜是租的，人设是搭的。',
    unique: true, effect: { kind: 'retouch', bonus: 0.1 },
  },
  {
    id: 'powerbank', name: '迷你充电宝', price: 45,
    desc: '本局每场对话省 1 点精力（4 → 3）。',
    flavor: '手机不关机，人就不下班。',
    unique: true, effect: { kind: 'powerbank' },
  },
  {
    id: 'streamer_kit', name: '网红套餐（声卡+补光灯）', price: 780,
    desc: '精力上限 16 → 24（本局），风险 +10。',
    flavor: '欲望的天花板，买得起就停不下来了。这钱够还半个月的目标。',
    unique: true, effect: { kind: 'streamerKit', energyMax: 24, riskAdd: 10 },
  },
];
