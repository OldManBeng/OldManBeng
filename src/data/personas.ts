import type { Persona } from '../types/persona';

/** 4 人设卡。换人设有养号成本（M2 实装），M1 开局选定后锁定。 */
export const PERSONAS: Persona[] = [
  {
    id: 'femme_fatale',
    name: '御姐',
    tagline: '「睡不着？」',
    bio: '黑头像，一句晚安能让他多看两眼。适合渴望被征服欲的大哥。',
    topics: ['夜生活', '酒', '深夜电台'],
  },
  {
    id: 'sweet_daughter',
    name: '学妹',
    tagline: '「哥哥晚安！」',
    bio: '白裙滤镜，笑起来有虎牙。适合想找女儿感觉、想被叫"叔叔"的人。',
    topics: ['校园生活', '奶茶', '追星'],
  },
  {
    id: 'wise_sister',
    name: '知心姐姐',
    tagline: '「今天辛苦了」',
    bio: '素颜感，聊天像睡前的一杯温水。适合只想有人听他说话的人。',
    topics: ['家常', '工作烦恼', '养生'],
  },
  {
    id: 'artistic_soul',
    name: '文青',
    tagline: '「今晚的月亮很圆」',
    bio: '胶片滤镜，三天发一条朋友圈。适合自认有品位、渴望被仰视的人。',
    topics: ['书', '电影', '民谣'],
  },
];
