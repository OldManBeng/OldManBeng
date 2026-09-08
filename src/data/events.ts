import type { DayEvent } from '../types/script';

/** Morning event table, rolled on 2d6. GL2 events.ts pattern. */
export const DAY_EVENTS: DayEvent[] = [
  {
    id: 'ev_rent',
    name: '房东的消息',
    description: '「这个月房租记得按时哈」——发工资前的一万点伤害。',
    diceRange: { min: 2, max: 3 },
    effects: [],
  },
  {
    id: 'ev_mom',
    name: '妈妈的电话',
    description: '「钱还够不够花？不够妈给你转点。」你赶紧挂了，怕她听出你哭了。',
    diceRange: { min: 4, max: 4 },
    effects: [{ kind: 'conscience', amount: 3 }],
    oneTime: true,
  },
  {
    id: 'ev_dudu',
    name: '催收短信',
    description: '「【XX消费金融】您的还款日为3日后，逾期将影响征信。」',
    diceRange: { min: 5, max: 5 },
    effects: [],
  },
  {
    id: 'ev_news_police',
    name: '新闻推送',
    description: '「某交友App诈骗团伙被端，涉案3400万，被害人7000余名。」你把手机调成静音。',
    diceRange: { min: 6, max: 6 },
    effects: [{ kind: 'wariness', amount: 5 }, { kind: 'flag', flag: 'saw_news' }],
    oneTime: true,
  },
  {
    id: 'ev_mirror',
    name: '评论区的那位阿姨',
    description:
      '「姑娘，你长得像我家闺女。她爸去年在网上被一个\'小姑娘\'崩走了三万八——就是天天叫他哥哥那种。」你盯着这条评论看了很久。',
    diceRange: { min: 7, max: 7 },
    effects: [{ kind: 'flag', flag: 'saw_mirror' }],
    oneTime: true,
  },
  {
    id: 'ev_quiet',
    name: '无事发生',
    description: '睡到中午。刷了三小时手机，什么也没发生。这一天省下来的，只有时间。',
    diceRange: { min: 8, max: 9 },
    effects: [],
  },
  {
    id: 'ev_mrq',
    name: '奶茶自由',
    description:
      '你花了14块给自己点了杯奶茶。拍照的时候突然想到：你让他买的那些，也是这个牌子。',
    diceRange: { min: 10, max: 10 },
    effects: [{ kind: 'money', amount: -14 }, { kind: 'flag', flag: 'bought_milk_tea' }],
  },
  {
    id: 'ev_industry',
    name: '姐妹的私信',
    description:
      '「带你的那个姐问，你手上的哥哥稳定不？她那边有\'课程\'，一人一天能带三个号。」（私信还躺在列表里，等你回。）',
    diceRange: { min: 11, max: 12 },
    effects: [{ kind: 'flag', flag: 'industry_invite' }],
    oneTime: true,
  },
];
