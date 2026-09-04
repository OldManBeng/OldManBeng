import type { DailyPlan } from '../types/script';

/**
 * v2.0 每日计划：白天选一个，决定今晚在哪、遇到什么人。
 * 设计意图：计划的能量开销让"今天去哪"变成真实的取舍——
 * 去公园容易遇钓友，去棋摊遇棋友，但都会花掉晚上一场对话的精力。
 */
export const DAILY_PLANS: DailyPlan[] = [
  {
    id: 'plan_home',
    name: '宅家刷手机',
    description: '不化妆，不出门。外卖、短视频、修图。省精力，但也遇不到任何人。',
    meetArchetypes: [],
    meetChance: 0,
    energyCost: 0,
  },
  {
    id: 'plan_park',
    name: '公园走一圈',
    description: '傍晚的江边公园。跑步的、遛狗的、下棋的、钓鱼的——全在这。',
    meetArchetypes: ['fisherman', 'chess_uncle', 'square_dancer'],
    meetChance: 0.5,
    energyCost: 2,
  },
  {
    id: 'plan_gym',
    name: '健身房打卡',
    description: '动感单车一小时，拍照发圈。会员卡是分期买的。',
    meetArchetypes: ['night_guard'],
    meetChance: 0.25,
    energyCost: 2,
    money: -20,
  },
  {
    id: 'plan_market',
    name: '菜市场买菜',
    description: '学做饭的第一步。摊主会多送你一把葱，你忽然想起有人也是这么被哄的。',
    meetArchetypes: [],
    meetChance: 0,
    energyCost: 1,
    money: -35,
  },
  {
    id: 'plan_chess',
    name: '去棋摊看热闹',
    description: '小区门口的棋摊。观棋不语真君子——但总有人想教你怎么观。',
    meetArchetypes: ['chess_uncle'],
    meetChance: 0.6,
    energyCost: 2,
  },
  {
    id: 'plan_square',
    name: '广场舞边上看',
    description: '音响开到最大，领队阿姨的丝巾像一面旗。大爷们的眼神你懂。',
    meetArchetypes: ['square_dancer'],
    meetChance: 0.5,
    energyCost: 2,
  },
  {
    id: 'plan_netbar',
    name: '去网吧开黑',
    description: '通宵包早面38。柜台后面那只橘猫认得你了。',
    meetArchetypes: ['cafe_owner_ninety'],
    meetChance: 0.35,
    energyCost: 3,
    money: -38,
  },
  {
    id: 'plan_overnight',
    name: '夜班代驾蹲单',
    description: '在酒吧街口等代驾单。凌晨的客人什么都有——包括话多的老板——还有一起等单的代驾师傅。',
    meetArchetypes: ['married_boss', 'divorced_driver', 'designated_driver'],
    meetChance: 0.4,
    energyCost: 4,
    money: 120,
    riskAdd: 3,
  },
];
