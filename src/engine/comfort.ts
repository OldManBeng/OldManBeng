/**
 * 舒适圈引擎（第二阶段 1.1.0）。
 *
 * 全部走独立派生 RNG（derivedComfortRng）——不消耗主种子流，
 * 主线模拟的种子确定性测试不受影响。事件在每天早晨 runComfortMorning
 * 派发成事件卡（state.comfort.incoming），玩家切到常用手机再处理。
 *
 * 现金流语义（用户需求"进活命钱 / 从债中扣"）：
 * - 妈的生活费、男友红包：要 → 进活命钱（state.money）。
 * - 男友要钱：给了 → 先扣活命钱，扣不动的部分记到债上（goal 增加）——
 *   这个月的窟窿更大了，崩老头的进度被直接拖慢。
 */
import type { GameState } from '../types/game';
import type { ComfortContactId, ComfortIncoming, ComfortMoment, ComfortPack, ComfortOption } from '../types/comfort';
import { makeRng } from '../utils/random';
import {
  MOM_GIFT_MIN, MOM_GIFT_MAX, MOM_GIFT_GAP_MIN, MOM_GIFT_GAP_MAX, MOM_GIFT_FIRST_DAY, MOM_GIFT_FAMILY_FLOOR,
  BF_PACKET_MIN, BF_PACKET_MAX, BF_PACKET_GAP_MIN, BF_PACKET_GAP_MAX, BF_PACKET_FIRST_DAY, BF_PACKET_LOVE_FLOOR,
  BF_DEMAND_MIN, BF_DEMAND_MAX, BF_DEMAND_GAP, BF_DEMAND_GAP_COLD, BF_DEMAND_COLD_LOVE, BF_DEMAND_FIRST_DAY,
  BF_BREAKUP_REFUSES, BF_BREAKUP_LOVE, BF_REVENGE_REPORT_CHANCE, BF_REPORT_RISK, BF_POLICE_CHANCE,
  BF_DEMAND_LOVE_GIVE, BF_DEMAND_LOVE_REFUSE, BF_PACKET_LOVE_TAKE, BF_PACKET_LOVE_REFUSE,
  MOM_GIFT_FAMILY_TAKE, MOM_GIFT_FAMILY_REFUSE,
  BF_OMEN_DAY, BF_OMEN_GRACE, BF_OMEN_PACK, COMFORT_INCOMING_CAP, COMFORT_MOMENTS_CAP,
  COMFORT_ARCHIVE_CAP, FATHER_MEMORIAL,
  MOM_TALK_FIRST_DAY, MOM_TALK_GAP_MIN, MOM_TALK_GAP_MAX, MOM_TALK_FAMILY_FLOOR,
  BF_TALK_FIRST_DAY, BF_TALK_GAP_MIN, BF_TALK_GAP_MAX, BF_TALK_LOVE_FLOOR,
  TALK_IGNORE_FAMILY, TALK_IGNORE_LOVE,
  XIAOMAN_BIRTHDAY_DAY, XIAOMAN_BIRTHDAY_GIFT, XIAOMAN_BIRTHDAY_PACKET, BF_BIRTHDAY_REMEMBER_LOVE,
  AUNTIE_TALK_FIRST_DAY, AUNTIE_TALK_GAP_MIN, AUNTIE_TALK_GAP_MAX,
  DATE_INTRO_FAMILY, DATE_INTRO_LOVE, QUARREL_IGNORE_LOVE,
  BESTIE_TALK_FIRST_DAY, BESTIE_TALK_GAP_MIN, BESTIE_TALK_GAP_MAX,
  COMFORT_DAY_MINUTES, COMFORT_CHAT_MINUTES,
  COMFORT_INCIDENT_CHANCE, COMFORT_INCIDENT_FIRST_DAY,
} from '../data/comfort';
import {
  MOTHER_PACKS, BOYFRIEND_PACKS, AUNTIE_PACKS, BESTIE_PACKS, QUARREL_PACKS, BF_OMEN_PACK as BF_OMEN_DATA,
  MOM_GIFT_LINES, MOM_GIFT_TAKEN, MOM_GIFT_REFUSED,
  BF_PACKET_LINES, BF_PACKET_TAKEN, BF_PACKET_REFUSED,
  BF_DEMAND_LINES, BF_DEMAND_GIVEN, BF_DEMAND_REFUSED_THREAT,
  BF_BREAKUP_LINES, BF_REPORT_LINES, BF_POLICE_NARRATION, COMFORT_AMBIENT_LINES,
  MOM_BIRTHDAY_LINES, MOM_BIRTHDAY_TAKEN, MOM_BIRTHDAY_REFUSED,
  BF_BIRTHDAY_REMEMBER_LINES, BF_BIRTHDAY_TAKEN, BF_BIRTHDAY_REFUSED,
  BF_BIRTHDAY_REMEMBER_LOG, BF_BIRTHDAY_FORGOT_LOG,
} from '../data/comfort-packs';
import { BLIND_DATES, BLIND_DATE_MAP, dateName } from '../data/comfort-dates';
import {
  INSPIRE_POSTS, FAMILY_POSTS, LOVE_POSTS, MOM_COMMENTS, BF_COMMENTS, OTHER_POSTS,
  AUNTIE_POSTS, AUNTIE_COMMENTS, BESTIE_POSTS, BESTIE_COMMENTS,
  MY_MOMENT_COMMENTS, type MyMomentComment,
} from '../data/comfort-moments';
import {
  MOM_MONEY_TAKE_CONTRAST, MOM_MONEY_REFUSE_CONTRAST, BF_PACKET_CONTRAST,
  BF_DEMAND_CONTRAST, BF_BREAKUP_CONTRAST, MIRROR_LINES,
} from '../data/comfort-contrast';
import { STORY_BEATS, type ComfortStoryBeat } from '../data/comfort-story';
import { COMFORT_INCIDENTS, comfortIncidentsAvailable, type ComfortIncident } from '../data/comfort-incidents';
import { clamp } from './chat';

/** 按天取模取一行（对比旁白/镜像行不耗 RNG）。 */
function byDay<T>(pool: T[], day: number, salt = 0): T {
  return pool[(day + salt) % pool.length];
}

/** 舒适圈独立随机流：混入天数——同一天重放结果一致，且不碰主种子。 */
export function derivedComfortRng(state: GameState, salt: number): ReturnType<typeof makeRng> {
  return makeRng((Math.imul(state.rngSeed ^ 0x9e3779b9, 0x85ebca6b) ^ (state.day * 7919 + salt)) >>> 0);
}

function clog(state: GameState, details: string, line?: string) {
  state.log.push({ day: state.day, kind: 'comfort', details, line });
}

/** 微信式语音条秒数：纯显示效果，按文本长度确定性派生（约 4 字/秒，封顶 58″）。 */
export function voiceSecs(text: string): number {
  return Math.min(58, Math.max(2, Math.ceil(text.replace(/\s/g, '').length / 4)));
}

/** 拆 ｜ 连发 + 盖时间戳（舒适圈全天候，时间戳取上午 9-11 / 晚 20-23 的日间口吻）。 */
function dayStamp(rng: ReturnType<typeof makeRng>): string {
  const h = rng.chance(0.5) ? 9 + rng.int(0, 2) : 20 + rng.int(0, 3);
  return `${String(h).padStart(2, '0')}:${String(rng.int(10, 55)).padStart(2, '0')}`;
}

export function packFor(contactId: ComfortContactId, id: string): ComfortPack | null {
  if (id === BF_OMEN_PACK) return BF_OMEN_DATA;
  if (id.startsWith('quarrel_')) return QUARREL_PACKS.find((p) => p.id === id) ?? null;
  const pools: Record<ComfortContactId, ComfortPack[]> = {
    mother: MOTHER_PACKS, boyfriend: BOYFRIEND_PACKS, auntie: AUNTIE_PACKS, bestie: BESTIE_PACKS,
  };
  return pools[contactId].find((p) => p.id === id) ?? null;
}

/** 给嘘寒问暖卡抽一套话术 id（走去重窗口，保证回卡开场的就是卡上那句）。 */
function pickPackId(state: GameState, contactId: ComfortContactId, salt: number): string {
  const pools: Record<ComfortContactId, ComfortPack[]> = {
    mother: MOTHER_PACKS, boyfriend: BOYFRIEND_PACKS, auntie: AUNTIE_PACKS, bestie: BESTIE_PACKS,
  };
  const all = pools[contactId];
  const fresh = all.filter((p) => !state.comfort.recentPacks[contactId].includes(p.id));
  const rng = derivedComfortRng(state, salt);
  const pool = fresh.length ? fresh : all;
  return pool[rng.int(0, pool.length - 1)].id;
}

/** 每天早晨：舒适圈事件派发（runMorning 末尾调用）。 */
export function runComfortMorning(state: GameState): void {
  const c = state.comfort;
  // 新的一天：联系时间回满。忙，是这个家的常态——40 分钟是今天能匀给这部手机的全部。
  c.minutes = COMFORT_DAY_MINUTES;
  // 过期清理：事件卡放两天没处理就撤下（妈会重发，男友的火气攒着）。
  // 暗线剧情卡不过期——信不会被收回，故事不会因为你忙就散场。
  // 过期的嘘寒问暖卡与"先不回"同代价：已读不回不是免费的，拖过去也一样。
  const expired = c.incoming.filter((m) => m.kind !== 'story' && state.day - m.day > 1);
  for (const m of expired) {
    if (m.kind === 'mom_talk') {
      c.family = clamp(c.family + TALK_IGNORE_FAMILY, 0, 100);
      clog(state, '妈前几天发来的语音，你还一条没听。她没提，你也没敢点开。');
    }
    if (m.kind === 'bf_talk') {
      c.love = clamp(c.love + TALK_IGNORE_LOVE, 0, 100);
      clog(state, '阿凯喊你听游戏战况的那几条语音还堆在列表里。他问你怎么老是「在忙」。');
    }
    if (m.kind === 'quarrel') {
      c.love = clamp(c.love + QUARREL_IGNORE_LOVE, 0, 100);
      clog(state, '阿凯那场火，你拖到它自己熄了。他没再提——那晚的键盘声响到了天亮。');
    }
    if (m.kind === 'bestie_talk') {
      clog(state, '曼曼的语音你划掉了。她没问你怎么没回——她的下午茶，永远有下一个姐妹。');
    }
  }
  c.incoming = c.incoming.filter((m) => m.kind === 'story' || state.day - m.day <= 1);

  // 分手后的世界安静了：只留妈的事件链。
  const bfAlive = c.bfState === 'normal' && !c.blockedByBf;

  // 一天一人最多一条消息（v1.1.0）：随机事件卡按联系人去重——
  // 妈转了账就不再唠家常，阿凯发了红包就不再要钱。一天之内，一个人只对你说一件事。
  // 剧情卡是"信"不算消息（不受此限）；第 14 天的真心话占掉阿凯当天的名额——故事优先于日常。
  const taken = new Set<ComfortContactId>();
  const claim = (who: ComfortContactId): boolean => {
    if (taken.has(who)) return false;
    taken.add(who);
    return true;
  };
  if (bfAlive && !state.flags.bf_omen_done && !c.chat
    && state.day >= BF_OMEN_DAY && state.day <= BF_OMEN_DAY + BF_OMEN_GRACE) {
    taken.add('boyfriend');
  }

  // 暗线剧情（日历锚定，一次性）：把明线没交代的交代清楚——这笔债从哪个家里长出来。
  // 剧情卡不受事件卡上限约束也不占上限位数（挂在独立的"信件"通道），
  // 常规事件卡的配额只数非剧情卡——否则不听剧情的玩家会饿死整个事件经济。
  // 注意用实时判断：同一天内先推送的卡要立刻占位，不能用开头算好的快照。
  const capRoom = () => c.incoming.filter((m) => m.kind !== 'story').length < COMFORT_INCOMING_CAP;
  for (const beat of STORY_BEATS) {
    if (beat.day !== state.day || c.storyDone.includes(beat.id)) continue;
    const when = beat.when ?? 'any';
    if (when === 'bf_normal' && !bfAlive) continue;
    if (when === 'bf_gone' && bfAlive) continue;
    c.storyDone.push(beat.id);
    const opener = beat.lines[0].split('｜')[0];
    c.incoming.push({
      id: `story_${beat.id}`,
      kind: 'story',
      day: state.day,
      amount: 0,
      lines: [opener.length > 30 ? `${opener.slice(0, 30)}……` : opener],
      note: beat.note,
      beatId: beat.id,
    });
  }

  // 父亲忌日：一天只有一次的置灰头像会"亮"一下。
  if (state.day === FATHER_MEMORIAL.memorialDay) {
    clog(state, `常用手机 · ${FATHER_MEMORIAL.memorialLine}`);
  }

  // 氛围行（低频）：常用手机也在过日子。
  {
    const rng = derivedComfortRng(state, 41);
    if (rng.chance(0.18)) clog(state, COMFORT_AMBIENT_LINES[rng.int(0, COMFORT_AMBIENT_LINES.length - 1)]);
  }

  // 镜像行（低频）：两台手机同构的那句话——温情与算计的反差，让玩家自己撞见。
  {
    const rng = derivedComfortRng(state, 59);
    if (rng.chance(0.24)) clog(state, byDay(MIRROR_LINES, state.day, 3));
  }

  // 小满生日（农历小满，一次性）：妈一定记得；阿凯看感情。这一天把"家"和"他"称出斤两。
  // 生日是故事不是消息——和剧情卡一样绕开事件上限，且标志只在卡片真正落地后才置位。
  if (state.day === XIAOMAN_BIRTHDAY_DAY && !state.flags.xiaoman_birthday_done) {
    if (claim('mother') && !c.incoming.some((m) => m.tone === 'birthday' && m.kind === 'mom_gift')) {
      state.flags.xiaoman_birthday_done = true;
      c.incoming.push({
        id: `mom_birthday_${state.day}`,
        kind: 'mom_gift',
        day: state.day,
        amount: XIAOMAN_BIRTHDAY_GIFT,
        lines: [...MOM_BIRTHDAY_LINES],
        note: `生日红包 ${XIAOMAN_BIRTHDAY_GIFT} 元`,
        tone: 'birthday',
      });
    }
    if (bfAlive) {
      if (c.love >= BF_BIRTHDAY_REMEMBER_LOVE) {
        clog(state, `常用手机 · ${BF_BIRTHDAY_REMEMBER_LOG[state.day % BF_BIRTHDAY_REMEMBER_LOG.length]}`);
        if (claim('boyfriend') && !c.incoming.some((m) => m.kind === 'bf_packet')) {
          c.incoming.push({
            id: `bf_birthday_${state.day}`,
            kind: 'bf_packet',
            day: state.day,
            amount: XIAOMAN_BIRTHDAY_PACKET,
            lines: [...BF_BIRTHDAY_REMEMBER_LINES],
            note: `红包 ${XIAOMAN_BIRTHDAY_PACKET} 元`,
            tone: 'birthday',
          });
        }
      } else {
        clog(state, `常用手机 · ${BF_BIRTHDAY_FORGOT_LOG[state.day % BF_BIRTHDAY_FORGOT_LOG.length]}`);
      }
    }
  }

  if (state.day >= MOM_GIFT_FIRST_DAY && c.family >= MOM_GIFT_FAMILY_FLOOR) {
    const gapMin = MOM_GIFT_GAP_MIN, gapMax = MOM_GIFT_GAP_MAX;
    if (c.momGift.lastDay === 0 || state.day - c.momGift.lastDay >= gapMin) {
      const rng = derivedComfortRng(state, 71);
      const due = c.momGift.lastDay === 0 || state.day - c.momGift.lastDay >= gapMax
        || rng.chance(0.55);
      if (due && capRoom() && !c.incoming.some((m) => m.kind === 'mom_gift') && claim('mother')) {
        const amount = rng.int(MOM_GIFT_MIN, MOM_GIFT_MAX);
        c.incoming.push({
          id: `mom_gift_${state.day}`,
          kind: 'mom_gift',
          day: state.day,
          amount,
          lines: [MOM_GIFT_LINES[rng.int(0, MOM_GIFT_LINES.length - 1)]],
          note: `转账 ${amount} 元`,
        });
      }
    }
  }

  if (bfAlive && state.day >= BF_PACKET_FIRST_DAY && c.love >= BF_PACKET_LOVE_FLOOR) {
    if (c.bfPacket.lastDay === 0 || state.day - c.bfPacket.lastDay >= BF_PACKET_GAP_MIN) {
      const rng = derivedComfortRng(state, 97);
      const due = c.bfPacket.lastDay === 0 || state.day - c.bfPacket.lastDay >= BF_PACKET_GAP_MAX
        || rng.chance(0.5);
      if (due && capRoom() && !c.incoming.some((m) => m.kind === 'bf_packet') && claim('boyfriend')) {
        const amount = rng.int(BF_PACKET_MIN, BF_PACKET_MAX);
        c.incoming.push({
          id: `bf_packet_${state.day}`,
          kind: 'bf_packet',
          day: state.day,
          amount,
          lines: [BF_PACKET_LINES[rng.int(0, BF_PACKET_LINES.length - 1)]],
          note: `红包 ${amount} 元`,
        });
      }
    }
  }

  if (bfAlive && state.day >= BF_DEMAND_FIRST_DAY) {
    const gap = c.love < BF_DEMAND_COLD_LOVE ? BF_DEMAND_GAP_COLD : BF_DEMAND_GAP;
    if (c.bfDemand.lastDay === 0 || state.day - c.bfDemand.lastDay >= gap) {
      // 保底：感情越凉，伸手越必然；热恋期也有三成概率（他缺钱是常态）。
      const rng = derivedComfortRng(state, 131);
      const due = state.day - (c.bfDemand.lastDay || 0) >= gap + 2 || rng.chance(0.3);
      if (due && capRoom() && !c.incoming.some((m) => m.kind === 'bf_demand') && claim('boyfriend')) {
        const amount = rng.int(BF_DEMAND_MIN, BF_DEMAND_MAX);
        c.incoming.push({
          id: `bf_demand_${state.day}`,
          kind: 'bf_demand',
          day: state.day,
          amount,
          lines: BF_DEMAND_LINES[rng.int(0, BF_DEMAND_LINES.length - 1)],
          note: `要 ${amount} 元`,
        });
      }
    }
  }

  // 凤霞姨的介绍卡（纯聊天节奏）：她受小满妈所托，隔几天就要推一个"靠谱的"。
  // 候选人从还没认识过的池子里随机抽；阿姨不知道阿凯的存在——这张卡是干净的。
  if (state.day >= AUNTIE_TALK_FIRST_DAY && c.family >= 20) {
    if (c.auntie.lastDay === 0 || state.day - c.auntie.lastDay >= AUNTIE_TALK_GAP_MIN) {
      const rng = derivedComfortRng(state, 307);
      const due = c.auntie.lastDay === 0 || state.day - c.auntie.lastDay >= AUNTIE_TALK_GAP_MAX || rng.chance(0.5);
      const unmet = BLIND_DATES.filter((d) => !(d.id in c.datesMet));
      if (due && unmet.length > 0 && capRoom() && !c.incoming.some((m) => m.kind === 'auntie_intro') && claim('auntie')) {
        const pick = unmet[rng.int(0, unmet.length - 1)];
        c.auntie.lastDay = state.day;
        c.auntie.count += 1;
        c.incoming.push({
          id: `auntie_intro_${state.day}`,
          kind: 'auntie_intro',
          day: state.day,
          amount: 0,
          lines: [pick.intro.split('｜')[0]],
          packId: pick.id,
          note: `${pick.job} · ${pick.age}岁`,
        });
      }
    }
  }

  // 阿凯的相亲炸毛：认识新候选人的第二天早晨引爆（他在，他就忍不了）。
  // 名额被占（真心话日/已有红包）就顺延到明天——火气不丢，只是再憋一天。
  if (bfAlive && c.quarrel.pending && c.quarrel.count < QUARREL_PACKS.length && claim('boyfriend')) {
    c.quarrel.pending = false;
    c.quarrel.count += 1;
    const pack = QUARREL_PACKS[Math.min(c.quarrel.count - 1, QUARREL_PACKS.length - 1)];
    c.incoming.push({
      id: `quarrel_${state.day}`,
      kind: 'quarrel',
      day: state.day,
      amount: 0,
      lines: [pack.lines[0].split("｜")[0]],
      packId: pack.id,
      note: '他发火了，语音一条接一条',
    });
  }

  // 曼曼的闲聊卡：她的语音大多在补货路上发出——嘴毒心热的姐妹，唠的都是钱和底气。
  // 排在妈/阿凯的聊天卡之前：她最随口，不该被更"重要"的卡挤没。
  if (state.day >= BESTIE_TALK_FIRST_DAY) {
    if (c.bestieTalk.lastDay === 0 || state.day - c.bestieTalk.lastDay >= BESTIE_TALK_GAP_MIN) {
      const rng = derivedComfortRng(state, 331);
      const due = c.bestieTalk.lastDay === 0 || state.day - c.bestieTalk.lastDay >= BESTIE_TALK_GAP_MAX || rng.chance(0.5);
      if (due && capRoom() && !c.incoming.some((m) => m.kind === 'bestie_talk') && claim('bestie')) {
        const packId = pickPackId(state, 'bestie', 337);
        const pack = packFor('bestie', packId)!;
        c.bestieTalk.lastDay = state.day;
        c.bestieTalk.count += 1;
        c.incoming.push({
          id: `bestie_talk_${state.day}`,
          kind: 'bestie_talk',
          day: state.day,
          amount: 0,
          lines: [pack.lines[0].split("｜")[0]],
          packId,
          note: '发来几条语音，背景音全是商场',
        });
      }
    }
  }

  // 妈的嘘寒问暖（纯聊天卡）：她的关心比她的转账勤——这才是"经常关心"的本义。
  if (state.day >= MOM_TALK_FIRST_DAY && c.family >= MOM_TALK_FAMILY_FLOOR) {
    if (c.momTalk.lastDay === 0 || state.day - c.momTalk.lastDay >= MOM_TALK_GAP_MIN) {
      const rng = derivedComfortRng(state, 251);
      const due = c.momTalk.lastDay === 0 || state.day - c.momTalk.lastDay >= MOM_TALK_GAP_MAX || rng.chance(0.6);
      if (due && capRoom() && !c.incoming.some((m) => m.kind === 'mom_talk') && claim('mother')) {
        const packId = pickPackId(state, 'mother', 257);
        const pack = packFor('mother', packId)!;
        c.momTalk.lastDay = state.day;
        c.momTalk.count += 1;
        c.incoming.push({
          id: `mom_talk_${state.day}`,
          kind: 'mom_talk',
          day: state.day,
          amount: 0,
          lines: [pack.lines[0].split("｜")[0]],
          packId,
          note: '发来一条语音，等你回',
        });
      }
    }
  }

  // 阿凯的甜言蜜语（纯聊天卡）：恋爱脑的燃料——他在的时候，这套东西管用。
  if (bfAlive && state.day >= BF_TALK_FIRST_DAY && c.love >= BF_TALK_LOVE_FLOOR) {
    if (c.bfTalk.lastDay === 0 || state.day - c.bfTalk.lastDay >= BF_TALK_GAP_MIN) {
      const rng = derivedComfortRng(state, 277);
      const due = c.bfTalk.lastDay === 0 || state.day - c.bfTalk.lastDay >= BF_TALK_GAP_MAX || rng.chance(0.5);
      if (due && capRoom() && !c.incoming.some((m) => m.kind === 'bf_talk') && claim('boyfriend')) {
        const packId = pickPackId(state, 'boyfriend', 281);
        const pack = packFor('boyfriend', packId)!;
        c.bfTalk.lastDay = state.day;
        c.bfTalk.count += 1;
        c.incoming.push({
          id: `bf_talk_${state.day}`,
          kind: 'bf_talk',
          day: state.day,
          amount: 0,
          lines: [pack.lines[0].split("｜")[0]],
          packId,
          note: '发来几条语音，喊你听他打游戏',
        });
      }
    }
  }

  // 第 14 天伏笔：他那句说漏嘴的"真心话"（一次性）。当天聊天没空档就顺延——
  // 这句话不会丢，只会在你忙完的那天，原样砸过来。
  if (bfAlive && !state.flags.bf_omen_done && !c.chat
    && state.day >= BF_OMEN_DAY && state.day <= BF_OMEN_DAY + BF_OMEN_GRACE) {
    state.flags.bf_omen_done = true;
    openComfortChat(state, 'boyfriend', BF_OMEN_PACK);
    clog(state, '常用手机 · 阿凯深夜发来一段很长的语音，说了一句他不该说的话。');
  }

  // 突发事件（参考工作手机 INCIDENTS）：日子不是一条直线。随机、一次一件、
  // 同件一个整月只来一次；独立槽位，不与事件卡抢位。
  if (state.day >= COMFORT_INCIDENT_FIRST_DAY && !c.pending) {
    const rngI = derivedComfortRng(state, 419);
    if (rngI.chance(COMFORT_INCIDENT_CHANCE)) {
      const bfOk = c.bfState === 'normal' && !c.blockedByBf;
      const eligible = comfortIncidentsAvailable(state.day, bfOk)
        .filter((i) => !c.incidentsDone.includes(i.id));
      const pool = eligible.length
        ? eligible
        : comfortIncidentsAvailable(state.day, bfOk); // 池子转完一轮，允许重来
      if (pool.length) {
        const pick = pool[rngI.int(0, pool.length - 1)];
        c.pending = pick.id;
        if (!c.incidentsDone.includes(pick.id)) c.incidentsDone.push(pick.id);
      }
    }
  }

  // 妈/男友/阿姨偶尔自己发圈（低频）——这面墙也活着。
  {
    const rng = derivedComfortRng(state, 173);
    if (rng.chance(0.3) && c.moments.length < COMFORT_MOMENTS_CAP) {
      const pick = OTHER_POSTS[rng.int(0, OTHER_POSTS.length - 1)];
      if (!c.moments.some((m) => m.author === pick.author && m.day === state.day)) {
        const post: ComfortMoment = {
          id: `${pick.author}_${state.day}`,
          day: state.day,
          author: pick.author,
          text: pick.text,
          photoId: pick.photoId,
          likes: [],
          comments: [],
        };
        c.moments.push(post);
        c.unseenMoments += 1;
      }
    }
    // 阿姨的战报（更低频——她的朋友圈就是半本相亲花名册）。
    if (rng.chance(0.15) && c.moments.length < COMFORT_MOMENTS_CAP) {
      const pick = AUNTIE_POSTS[state.day % AUNTIE_POSTS.length];
      if (!c.moments.some((m) => m.author === 'auntie' && m.text === pick.text)) {
        c.moments.push({ id: `auntie_${state.day}`, day: state.day, author: 'auntie', text: pick.text, photoId: pick.photoId, likes: [], comments: [] });
        c.unseenMoments += 1;
      }
    }
    // 曼曼的橱窗（更低频——她的朋友圈是人间富贵的样本间）。
    if (rng.chance(0.16) && c.moments.length < COMFORT_MOMENTS_CAP) {
      const pick = BESTIE_POSTS[state.day % BESTIE_POSTS.length];
      if (!c.moments.some((m) => m.author === 'bestie' && m.text === pick.text)) {
        c.moments.push({ id: `bestie_${state.day}`, day: state.day, author: 'bestie', text: pick.text, photoId: pick.photoId, likes: [], comments: [] });
        c.unseenMoments += 1;
      }
    }
  }

  // 相亲对象的朋友圈：认识第 2 / 第 4 / 第 6 天各浮出一条——他们的日子也在过。
  for (const [id, metDay] of Object.entries(c.datesMet)) {
    const date = BLIND_DATE_MAP[id];
    if (!date) continue;
    [2, 4, 6].forEach((offset, i) => {
      const postDay = metDay + offset;
      const moment = date.moments[i];
      if (!moment || state.day !== postDay) return;
      if (c.moments.some((m) => m.author === `bd:${id}` && m.text === moment.text)) return;
      if (c.moments.length >= COMFORT_MOMENTS_CAP) return;
      c.moments.push({ id: `bd_${id}_${postDay}`, day: postDay, author: `bd:${id}`, text: moment.text, photoId: moment.photoId, likes: [], comments: [] });
      c.unseenMoments += 1;
    });
  }
}

/** 舒适圈里事件卡结算后的归档：opener + 她的选择 + 对方的回应，转成一场已收束的聊天。 */
function archiveIncoming(
  state: GameState,
  contactId: ComfortContactId,
  lines: string[],
  chosen: string,
  replies: string[],
  label?: string,
): void {
  const rng = derivedComfortRng(state, 211);
  const transcript = [];
  for (const l of lines) {
    transcript.push({ speaker: 'them' as const, text: l, voiceSecs: voiceSecs(l), stamp: dayStamp(rng) });
  }
  transcript.push({ speaker: 'me' as const, text: chosen, stamp: dayStamp(rng) });
  if (label) transcript.push({ speaker: 'sys' as const, text: label, label, stamp: dayStamp(rng) });
  for (const r of replies) {
    for (const seg of r.split('｜')) {
      const t = seg.trim();
      if (t) transcript.push({ speaker: 'them' as const, text: t, voiceSecs: voiceSecs(t), stamp: dayStamp(rng) });
    }
  }
  state.comfort.archives.push({ contactId, day: state.day, transcript });
  if (state.comfort.archives.length > COMFORT_ARCHIVE_CAP) {
    state.comfort.archives.splice(0, state.comfort.archives.length - COMFORT_ARCHIVE_CAP);
  }
}

/** 事件卡：要/不要（妈的生活费、男友红包）、给/不给（男友要钱）、回/不回（嘘寒问暖）。 */
export function resolveComfortIncoming(state: GameState, incomingId: string, accept: boolean): void {
  const c = state.comfort;
  const idx = c.incoming.findIndex((m) => m.id === incomingId);
  if (idx < 0) return;
  const inc = c.incoming[idx];
  // 嘘寒问暖/介绍/吵架卡：一场聊天没完不能"回"下一场——卡片保留，回完手头这场再说。
  if ((inc.kind === 'mom_talk' || inc.kind === 'bf_talk' || inc.kind === 'story'
    || inc.kind === 'bestie_talk'
    || inc.kind === 'auntie_intro' || inc.kind === 'quarrel') && c.chat) return;
  // 作息门禁（只拦"接了要开口说话"的那半边）：别人只在白天说话，
  // 阿凯作息日夜颠倒、只有夜里醒着；时间不足 10 分钟也开不了场。
  // 剧情卡是"信"，转账卡是"钱"——都不开口，不受门禁。
  const night = state.dayPhase === 'night';
  const opensChat = accept && (inc.kind === 'mom_talk' || inc.kind === 'bf_talk'
    || inc.kind === 'bestie_talk' || inc.kind === 'quarrel' || inc.kind === 'auntie_intro');
  if (opensChat) {
    const bfCard = inc.kind === 'bf_talk' || inc.kind === 'quarrel';
    if (bfCard && !night) return;
    if (!bfCard && night) return;
    if (c.minutes < COMFORT_CHAT_MINUTES) return;
  }
  c.incoming.splice(idx, 1);
  const rng = derivedComfortRng(state, 233);

  // 暗线剧情卡：只能听完，没有"划掉"——这是她的家，不是选择题。
  if (inc.kind === 'story') {
    const beat = STORY_BEATS.find((b) => b.id === inc.beatId);
    if (!beat) return;
    if (beat.from === 'sys') {
      // 无联系人的叙事消息：不成聊天，直接归档成一条她读过的记录。
      const rngS = derivedComfortRng(state, 431);
      const transcript = [];
      for (const l of beat.lines) {
        for (const seg of l.split('｜')) {
          const t = seg.trim();
          if (t) transcript.push({ speaker: 'narrator' as const, text: t, stamp: dayStamp(rngS) });
        }
      }
      c.archives.push({ contactId: 'sys', day: state.day, transcript });
      if (c.archives.length > COMFORT_ARCHIVE_CAP) {
        c.archives.splice(0, c.archives.length - COMFORT_ARCHIVE_CAP);
      }
    } else {
      openStoryChat(state, beat);
    }
    if (beat.narration) clog(state, beat.narration);
    if (beat.effect === 'kai_arrested') {
      c.bfState = 'arrested';
      c.blockedByBf = true;
    }
    return;
  }

  if (inc.kind === 'auntie_intro') {
    const date = inc.packId ? BLIND_DATE_MAP[inc.packId] : null;
    if (!date) return;
    const bfAlive = c.bfState === 'normal' && !c.blockedByBf;
    if (accept) {
      // 认识新候选人：妈的心愿 +（她那边已经报喜），阿凯那边 -（第二天引爆）。
      c.minutes -= COMFORT_CHAT_MINUTES; // 见面首聊，占一场时间
      c.datesMet[date.id] = state.day;
      c.family = clamp(c.family + DATE_INTRO_FAMILY, 0, 100);
      if (bfAlive) {
        c.love = clamp(c.love + DATE_INTRO_LOVE, 0, 100);
        c.quarrel.pending = true;
      }
      clog(state, `凤霞姨把「${date.handle}」的微信推给了你。妈那边已经报过喜了——阿凯还不知道。`);
      archiveIncoming(state, 'auntie', inc.lines, '好，那……我加加看。', ['加了！人家条件是不错，可处对象这事儿，得处了才知道｜姨就一句话：你自己拿主意，别委屈自己']);
      openDateChat(state, date.id);
    } else {
      clog(state, `你婉拒了「${date.handle}」。凤霞姨说没关系，姨手里还有的是——只是语气里有一点可惜。`);
      archiveIncoming(state, 'auntie', inc.lines, '姨，这个先算了吧。', ['行，听你的。｜姨再多看几个，有好的一准儿想着你']);
    }
    return;
  }

  if (inc.kind === 'quarrel') {
    if (accept) {
      c.minutes -= COMFORT_CHAT_MINUTES;
      openComfortChat(state, 'boyfriend', inc.packId);
      clog(state, '阿凯的火气隔着屏幕都能烫手。你还是点了回去——这笔账早晚要算。');
    } else {
      c.love = clamp(c.love + QUARREL_IGNORE_LOVE, 0, 100);
      clog(state, '你把阿凯的火气晾在了一边。晚上他蹲在电脑前，一句「哦」打发了你一整天的沉默。');
    }
    return;
  }

  if (inc.kind === 'mom_talk') {
    if (accept) {
      c.minutes -= COMFORT_CHAT_MINUTES;
      openComfortChat(state, 'mother', inc.packId);
      clog(state, '妈发来一条长语音，问你最近吃得好不好。你点了回去。');
    } else {
      c.family = clamp(c.family + TALK_IGNORE_FAMILY, 0, 100);
      clog(state, '妈的语音你没回。晚上十一点，她换了个说法重新发来：「睡了没？」');
    }
    return;
  }

  if (inc.kind === 'bf_talk') {
    if (accept) {
      c.minutes -= COMFORT_CHAT_MINUTES;
      openComfortChat(state, 'boyfriend', inc.packId);
      clog(state, '阿凯喊你听他的游戏战况。你戴着耳机，一条条听完了。');
    } else {
      c.love = clamp(c.love + TALK_IGNORE_LOVE, 0, 100);
      clog(state, '阿凯的语音你没回。他的下一句马上就到：「忙什么呢？」');
    }
    return;
  }

  if (inc.kind === 'bestie_talk') {
    if (accept) {
      c.minutes -= COMFORT_CHAT_MINUTES;
      openComfortChat(state, 'bestie', inc.packId);
      clog(state, '曼曼的语音一条接一条，背景音全是商场的广播。你戴着耳机听完了，笑了一声。');
    } else {
      clog(state, '曼曼的语音你先放着。她不会问你怎么没回——她的下午茶，永远有下一个姐妹。');
    }
    return;
  }

  if (inc.kind === 'mom_gift') {
    c.momGift.lastDay = state.day;
    c.momGift.count += 1;
    const birthday = inc.tone === 'birthday';
    if (accept) {
      state.money += inc.amount;
      c.momGiven += inc.amount;
      c.family = clamp(c.family + MOM_GIFT_FAMILY_TAKE, 0, 100);
      state.ledger.push({ day: state.day, amount: inc.amount, note: birthday ? `妈的生日红包（农历小满）` : `妈的生活费（${inc.note ?? '转账'}）`, kind: 'family' });
      clog(state, birthday
        ? `妈的生日红包，${inc.amount} 元。农历小满——这个日子，全世界只有她记得。`
        : `妈转来了 ${inc.amount} 元生活费。你收了。`, byDay(MOM_MONEY_TAKE_CONTRAST, state.day, 1));
      archiveIncoming(state, 'mother', inc.lines, birthday ? '妈……我收到了。谢谢你。' : '收下了，谢谢妈。', [birthday
        ? MOM_BIRTHDAY_TAKEN[rng.int(0, MOM_BIRTHDAY_TAKEN.length - 1)]
        : MOM_GIFT_TAKEN[rng.int(0, MOM_GIFT_TAKEN.length - 1)]], `转账 +${inc.amount} 元`);
    } else {
      c.momRefused += inc.amount;
      c.family = clamp(c.family + MOM_GIFT_FAMILY_REFUSE, 0, 100);
      clog(state, birthday
        ? `妈给你包的 ${inc.amount} 元生日红包，你没要。她把那笔钱原路收了回去，像收回一句没说出口的话。`
        : `妈要给你转 ${inc.amount} 元，你没要。她说你是跟你爸一个倔脾气。`, byDay(MOM_MONEY_REFUSE_CONTRAST, state.day, 2));
      archiveIncoming(state, 'mother', inc.lines, birthday ? '妈，生日红包我也不要，你留着。' : '妈我不要，你留着。', [birthday
        ? MOM_BIRTHDAY_REFUSED[rng.int(0, MOM_BIRTHDAY_REFUSED.length - 1)]
        : MOM_GIFT_REFUSED[rng.int(0, MOM_GIFT_REFUSED.length - 1)]]);
    }
    // 家庭关系跌破冰点：妈不再主动打钱——得有一行字告诉玩家为什么安静了。
    if (!birthday && c.family < MOM_GIFT_FAMILY_FLOOR) {
      clog(state, '这个月剩下的日子，妈没再提转账的事。她在语音里说：闺女长大了，有本事了。这句话你听不出是夸还是疼。');
    }
    return;
  }

  if (inc.kind === 'bf_packet') {
    c.bfPacket.lastDay = state.day;
    c.bfPacket.count += 1;
    const birthday = inc.tone === 'birthday';
    if (accept) {
      state.money += inc.amount;
      c.bfGiven += inc.amount;
      c.love = clamp(c.love + BF_PACKET_LOVE_TAKE, 0, 100);
      state.ledger.push({ day: state.day, amount: inc.amount, note: birthday ? `阿凯的生日红包（${inc.amount} 元）` : `阿凯的红包（崩阿姨分你的一半）`, kind: 'family' });
      clog(state, birthday
        ? `阿凯的生日红包：${inc.amount} 元。他还记得。你收了——恋爱脑收下的从来不是钱，是"他还记得"这四个字。`
        : `阿凯把他"崩阿姨"的钱分了你一半：${inc.amount} 元。你收了。`, byDay(BF_PACKET_CONTRAST, state.day, 5));
      archiveIncoming(state, 'boyfriend', inc.lines, birthday ? '哈哈你居然记得，谢谢宝。' : '哈哈收下了，凯老板大气！', [birthday
        ? BF_BIRTHDAY_TAKEN[rng.int(0, BF_BIRTHDAY_TAKEN.length - 1)]
        : BF_PACKET_TAKEN[rng.int(0, BF_PACKET_TAKEN.length - 1)]], `红包 +${inc.amount} 元`);
    } else {
      c.bfRefused += inc.amount;
      c.love = clamp(c.love + BF_PACKET_LOVE_REFUSE, 0, 100);
      clog(state, birthday
        ? `他发的 ${inc.amount} 元生日红包，你没要。他来了句"你这人真没劲"，然后去上号了。`
        : `阿凯给你发了 ${inc.amount} 元红包，你没要。他觉得你在外面有人了。`, birthday
        ? BF_BIRTHDAY_REFUSED[0]
        : BF_PACKET_REFUSED[rng.int(0, BF_PACKET_REFUSED.length - 1)]);
      archiveIncoming(state, 'boyfriend', inc.lines, birthday ? '不用了，你留着上分吧。' : '不用了，你自己留着吧。', [birthday
        ? BF_BIRTHDAY_REFUSED[0]
        : BF_PACKET_REFUSED[rng.int(0, BF_PACKET_REFUSED.length - 1)]]);
    }
    return;
  }

  if (inc.kind === 'bf_demand') {
    c.bfDemand.lastDay = state.day;
    c.bfDemand.count += 1;
    if (accept) {
      // 给：先扣活命钱，扣不动的部分记到债上（"从债中扣"）——崩老头进度被拖慢。
      const fromPocket = Math.min(state.money, inc.amount);
      state.money -= fromPocket;
      const fromDebt = inc.amount - fromPocket;
      if (fromDebt > 0) state.goal += fromDebt;
      state.ledger.push({
        day: state.day, amount: -inc.amount,
        note: fromDebt > 0
          ? `阿凯要走 ${inc.amount} 元（活命钱 ${fromPocket} + 记到债上 ${fromDebt}）`
          : `阿凯要走 ${inc.amount} 元`,
        kind: 'family',
      });
      c.bfTaken += inc.amount;
      c.love = clamp(c.love + BF_DEMAND_LOVE_GIVE, 0, 100);
      clog(state, fromDebt > 0
        ? `你把 ${inc.amount} 元给了阿凯。活命钱不够的部分，记到了这个月的债上——窟窿又厚了一截。`
        : `你把 ${inc.amount} 元给了阿凯。他说周五还你。`, byDay(BF_DEMAND_CONTRAST, state.day, 7));
      archiveIncoming(state, 'boyfriend', inc.lines, '……转你了，拿去吧。', [BF_DEMAND_GIVEN[rng.int(0, BF_DEMAND_GIVEN.length - 1)]], `转账 -${inc.amount} 元`);
      return;
    }

    // 不给：关系重挫，然后走连锁——分手（卷钱+拉黑）或报复（举报/警察上门）。
    c.love = clamp(c.love + BF_DEMAND_LOVE_REFUSE, 0, 100);
    c.bfDemand.refuses += 1;
    const threat = BF_DEMAND_REFUSED_THREAT[Math.min(c.bfDemand.refuses - 1, BF_DEMAND_REFUSED_THREAT.length - 1)];
    clog(state, `阿凯要 ${inc.amount} 元，你没给。`, threat);

    const shouldBreakup = c.bfDemand.refuses >= BF_BREAKUP_REFUSES || c.love <= BF_BREAKUP_LOVE;
    if (shouldBreakup) {
      // 分手线：卷走全部活命钱 + 拉黑。
      const stolen = state.money;
      state.money = 0;
      c.bfTaken += stolen;
      c.blockedByBf = true;
      c.bfState = 'broken_up';
      state.ledger.push({ day: state.day, amount: -stolen, note: '阿凯卷走的活命钱（分手，人已拉黑）', kind: 'family' });
      for (const l of BF_BREAKUP_LINES) clog(state, `常用手机 · ${l}`);
      clog(state, `他转走了活命钱里剩下的 ${stolen} 元，把你拉黑了。常用手机里，他的头像变成了灰色。`, byDay(BF_BREAKUP_CONTRAST, state.day, 11));
      archiveIncoming(state, 'boyfriend', inc.lines, '不给。', [...BF_DEMAND_REFUSED_THREAT.slice(0, 1), ...BF_BREAKUP_LINES]);
      return;
    }

    // 报复线：举报（穿帮风险+25），举报里再 roll 警察上门（当天精力清零——进程被打断）。
    if (rng.chance(BF_REVENGE_REPORT_CHANCE)) {
      state.riskLevel = clamp(state.riskLevel + BF_REPORT_RISK, 0, 100);
      for (const l of BF_REPORT_LINES) clog(state, `常用手机 · ${l}`);
      clog(state, '工作手机的风险条烧起来了一格——他真的去做那件事了。');
      if (rng.chance(BF_POLICE_CHANCE)) {
        state.energy = 0;
        c.policeDay = state.day;
        clog(state, '常用手机 · 警察上门录口供，今天这一天没了。', BF_POLICE_NARRATION[rng.int(0, BF_POLICE_NARRATION.length - 1)]);
      }
      archiveIncoming(state, 'boyfriend', inc.lines, '不给。这个家不能一直这么填。', [...BF_DEMAND_REFUSED_THREAT.slice(0, 1), ...BF_REPORT_LINES]);
      return;
    }

    // 没到连锁：冷战收场。
    archiveIncoming(state, 'boyfriend', inc.lines, '不给。', [threat]);
    clog(state, '他当天没再回消息。空气里悬着一把没落下来的刀。');
  }
}

/** 主动找妈/男友聊天：抽一套没聊过的话术（去重窗口 5），不耗体力。 */
export function openComfortChat(state: GameState, contactId: ComfortContactId, forcedPackId?: string): void {
  const c = state.comfort;
  if (c.chat) return; // 一场没完不开下一场
  const pools: Record<ComfortContactId, ComfortPack[]> = {
    mother: MOTHER_PACKS, boyfriend: BOYFRIEND_PACKS, auntie: AUNTIE_PACKS, bestie: BESTIE_PACKS,
  };
  const all = pools[contactId];
  const recent = c.recentPacks[contactId];
  // 强制套（第 14 天的伏笔 bf_omen 不在常规池里，走 packFor 解析）。
  let pack = forcedPackId ? packFor(contactId, forcedPackId) : null;
  if (!pack) {
    const fresh = all.filter((p) => !recent.includes(p.id));
    const usable = fresh.length ? fresh : all;
    const rng = derivedComfortRng(state, contactId === 'mother' ? 293 : 317);
    pack = usable[rng.int(0, usable.length - 1)];
  }
  recent.push(pack.id);
  if (recent.length > 5) recent.splice(0, recent.length - 5);

  const rng = derivedComfortRng(state, 353);
  const transcript = [];
  const speakerName: Record<ComfortContactId, string> = { mother: '妈', boyfriend: '阿凯', auntie: '凤霞姨', bestie: '曼曼' };
  transcript.push({ speaker: 'sys' as const, text: `和 ${speakerName[contactId]} 的聊天`, stamp: dayStamp(rng) });
  for (const l of pack.lines) {
    for (const seg of l.split('｜')) {
      const t = seg.trim();
      if (t) transcript.push({ speaker: 'them' as const, text: t, voiceSecs: voiceSecs(t), stamp: dayStamp(rng) });
    }
  }
  c.chat = {
    contactId,
    transcript,
    pending: pack.options,
    awaiting: 'player',
    closingNote: null,
  };
}

/** 选一个回复：对方回应 + 关系变化 + 归档收束。 */
export function pickComfortOption(state: GameState, optionIndex: number): void {
  const c = state.comfort;
  if (!c.chat || c.chat.awaiting !== 'player') return;
  const opt: ComfortOption | undefined = c.chat.pending[optionIndex];
  if (!opt) return;
  const contactId = c.chat.contactId;
  const rng = derivedComfortRng(state, 389);
  c.chat.transcript.push({ speaker: 'me' as const, text: opt.text, stamp: dayStamp(rng) });
  for (const seg of opt.reply.split('｜')) {
    const t = seg.trim();
    if (t) c.chat.transcript.push({ speaker: 'them' as const, text: t, voiceSecs: voiceSecs(t), stamp: dayStamp(rng) });
  }
  if (opt.family) c.family = clamp(c.family + opt.family, 0, 100);
  if (opt.love) c.love = clamp(c.love + opt.love, 0, 100);
  c.chat.pending = [];
  c.chat.awaiting = 'closed';
  c.chat.closingNote = contactId === 'mother' ? '妈放下手机去忙了。'
    : contactId === 'auntie' ? '姨去跳舞了，回头聊。'
    : contactId === 'bestie' ? '她那头还有下一场饭局，回头聊。'
    : '他去打游戏了。';
  // 分手后他的日常聊天入口关闭（已在 UI 侧挡住，这里兜底）。
}

/** 暗线剧情聊天：话术来自 beat 本体（不在常规池里），听完即收束。 */
export function openStoryChat(state: GameState, beat: ComfortStoryBeat): void {
  const c = state.comfort;
  if (c.chat) return;
  const rng = derivedComfortRng(state, 401);
  const transcript = [];
  transcript.push({
    speaker: 'sys' as const,
    text: `和 ${beat.from === 'mother' ? '妈' : '阿凯'} 的对话`,
    stamp: dayStamp(rng),
  });
  for (const l of beat.lines) {
    for (const seg of l.split('｜')) {
      const t = seg.trim();
      if (t) transcript.push({ speaker: 'them' as const, text: t, voiceSecs: voiceSecs(t), stamp: dayStamp(rng) });
    }
  }
  c.chat = {
    contactId: beat.from as 'mother' | 'boyfriend',
    transcript,
    pending: beat.options ?? [],
    awaiting: beat.options?.length ? 'player' : 'closed',
    closingNote: beat.options?.length ? null : '（这段语音到这里就完了。）',
  };
}

/** 相亲对象的开场/回访聊天：首聊走 pack（认识礼数），再聊换 pack2（他们也有自己的日子要讲）。 */
export function openDateChat(state: GameState, dateId: string): void {
  const c = state.comfort;
  if (c.chat) return;
  const date = BLIND_DATE_MAP[dateId];
  if (!date) return;
  const chats = c.dateChats[dateId] ?? 0;
  c.dateChats[dateId] = chats + 1;
  const pack = chats === 0 || !date.pack2 ? date.pack : date.pack2;
  const rng = derivedComfortRng(state, 449);
  const transcript = [];
  transcript.push({ speaker: 'sys' as const, text: `和 ${date.handle} 的聊天`, stamp: dayStamp(rng) });
  for (const l of pack.lines) {
    for (const seg of l.split('｜')) {
      const t = seg.trim();
      if (t) transcript.push({ speaker: 'them' as const, text: t, voiceSecs: voiceSecs(t), stamp: dayStamp(rng) });
    }
  }
  c.chat = {
    contactId: `bd:${dateId}`,
    transcript,
    pending: pack.options,
    awaiting: 'player',
    closingNote: null,
  };
}

/** 结束当前聊天（归档）。 */
export function endComfortChat(state: GameState): void {
  const c = state.comfort;
  if (!c.chat) return;
  c.archives.push({ contactId: c.chat.contactId, day: state.day, transcript: c.chat.transcript });
  if (c.archives.length > COMFORT_ARCHIVE_CAP) {
    c.archives.splice(0, c.archives.length - COMFORT_ARCHIVE_CAP);
  }
  c.chat = null;
}

/** 发一条舒适圈朋友圈：励志/晒家/晒恩爱。妈和男友当天就可能来互动。 */
export function postComfortMoment(state: GameState, kind: 'inspire' | 'family' | 'love'): void {
  const c = state.comfort;
  if (c.moments.some((m) => m.author === 'me' && m.day === state.day)) return;
  const pools = { inspire: INSPIRE_POSTS, family: FAMILY_POSTS, love: LOVE_POSTS } as const;
  const pool = pools[kind];
  const rng = derivedComfortRng(state, 421 + kind.length);
  const pick = pool[rng.int(0, pool.length - 1)];
  const post: ComfortMoment = {
    id: `me_${state.day}`,
    day: state.day,
    author: 'me',
    kind,
    text: pick.text,
    photoId: pick.photoId,
    likes: [],
    comments: [],
  };
  // 妈必互动（她一条条看）；凤霞姨必评论（她把朋友圈当成了解小满的窗口）；
  // 曼曼必来（毒舌是门面，撑腰是里子——她的评论按圈的类型分池）；
  // 最近认识的相亲对象按礼貌也会来点赞评论——他们的客气没有恶意，只是社交。
  post.likes.push('mother');
  post.comments.push({ by: 'mother', text: MOM_COMMENTS[kind][rng.int(0, MOM_COMMENTS[kind].length - 1)] });
  c.family = clamp(c.family + 1, 0, 100);
  post.likes.push('auntie');
  post.comments.push({ by: 'auntie', text: AUNTIE_COMMENTS[rng.int(0, AUNTIE_COMMENTS.length - 1)] });
  post.likes.push('bestie');
  post.comments.push({ by: 'bestie', text: BESTIE_COMMENTS[kind][rng.int(0, BESTIE_COMMENTS[kind].length - 1)] });
  const metIds = Object.keys(c.datesMet).sort((a, b) => c.datesMet[b] - c.datesMet[a]);
  const latest = metIds[0];
  const latestDate = latest ? BLIND_DATE_MAP[latest] : null;
  if (latestDate && rng.chance(0.7)) {
    if (rng.chance(0.5)) post.likes.push(`bd:${latest}`);
    else post.comments.push({ by: `bd:${latest}`, text: latestDate.comments[state.day % latestDate.comments.length] });
  }
  if (c.bfState === 'normal' && !c.blockedByBf && c.love >= 20 && rng.chance(0.75)) {
    if (rng.chance(0.5)) post.likes.push('boyfriend');
    else post.comments.push({ by: 'boyfriend', text: BF_COMMENTS[kind][rng.int(0, BF_COMMENTS[kind].length - 1)] });
    c.love = clamp(c.love + 1, 0, 100);
  }
  c.moments.push(post);
  if (c.moments.length > COMFORT_MOMENTS_CAP) c.moments.splice(0, c.moments.length - COMFORT_MOMENTS_CAP);
  clog(state, `常用手机 · 你发了一条朋友圈（${kind === 'inspire' ? '励志' : kind === 'family' ? '晒家' : '晒恩爱'}）。妈第一个点了赞。`);
}

/** 给别人的动态点赞：不用花钱的礼貌，也是一点心意。 */
export function reactComfortMoment(state: GameState, momentId: string): void {
  const c = state.comfort;
  const post = c.moments.find((m) => m.id === momentId);
  if (!post || post.author === 'me') return;
  if (post.likes.includes('me')) return;
  post.likes.push('me');
  // 给妈/阿姨的动态点赞是亲情；给男友的是感情；给相亲对象的——那是不用付费的礼貌。
  if (post.author === 'mother' || post.author === 'auntie') c.family = clamp(c.family + 1, 0, 100);
  else if (post.author === 'boyfriend') c.love = clamp(c.love + 1, 0, 100);
}

/** 小满在某条他人动态下可选的评论（按作者取池；相亲对象走通用客气池）。 */
export function myMomentCommentOptions(author: string): MyMomentComment[] {
  if (author === 'mother') return MY_MOMENT_COMMENTS.mother;
  if (author === 'boyfriend') return MY_MOMENT_COMMENTS.boyfriend;
  if (author === 'auntie') return MY_MOMENT_COMMENTS.auntie;
  if (author === 'bestie') return MY_MOMENT_COMMENTS.bestie;
  if (author.startsWith('bd:')) return MY_MOMENT_COMMENTS.date;
  return [];
}

/**
 * 小满评论别人的朋友圈（v1.1.0）：从随口的几句话里挑一句。
 * 不是话术、不带目的——但说出口的话有分量：暖人的、噎人的，
 * 都会落到家庭关系 / 感情上（闺蜜和相亲对象的圈不动账）。
 */
export function commentComfortMoment(state: GameState, momentId: string, optionIndex: number): void {
  const c = state.comfort;
  const post = c.moments.find((m) => m.id === momentId);
  if (!post || post.author === 'me') return;
  if (post.comments.some((cm) => cm.by === 'me')) return;
  const opt = myMomentCommentOptions(post.author)[optionIndex];
  if (!opt) return;
  post.comments.push({ by: 'me', text: opt.text });
  if (opt.family) c.family = clamp(c.family + opt.family, 0, 100);
  if (opt.love) c.love = clamp(c.love + opt.love, 0, 100);
}

/**
 * 舒适圈突发事件：当场结算。选了哪条路，代价与收获都落在
 * 活命钱 / 今日时间 / 家庭 / 感情 / 债 上——事件不等人，也不收回。
 * 挂了经文的事件，经文跟着落日志（工作手机的偈照生意，这里的经照日子）。
 */
export function resolveComfortIncident(state: GameState, optionIndex: number): void {
  const c = state.comfort;
  const inc: ComfortIncident | undefined = COMFORT_INCIDENTS.find((i) => i.id === c.pending);
  if (!inc) return;
  const opt = inc.options[optionIndex];
  if (!opt) return;
  c.pending = '';
  const fx = opt.fx;
  if (fx.money) {
    state.money += fx.money;
    state.ledger.push({ day: state.day, amount: fx.money, note: `${inc.title}（${opt.text}）`, kind: 'family' });
  }
  if (fx.goal) {
    state.goal += fx.goal;
    state.ledger.push({ day: state.day, amount: -fx.goal, note: `${inc.title}——记到债上`, kind: 'family' });
  }
  if (fx.minutes) c.minutes = clamp(c.minutes + fx.minutes, 0, COMFORT_DAY_MINUTES);
  if (fx.family) c.family = clamp(c.family + fx.family, 0, 100);
  if (fx.love) c.love = clamp(c.love + fx.love, 0, 100);
  clog(state, `常用手机 · ${inc.title}——${opt.text}`, opt.after);
  if (inc.verse) clog(state, `「${inc.verse.v}」——${inc.verse.s}`);
}

/**
 * 「没接住」：突发事件拖到明天（进入明天时仍挂着），后果自己找上门。
 * 由 state-machine 的 sleep 分支调用——不处理也是一种处理。
 */
export function staleComfortIncident(state: GameState): void {
  const c = state.comfort;
  const inc = COMFORT_INCIDENTS.find((i) => i.id === c.pending);
  c.pending = '';
  if (!inc) return;
  const fx = inc.staleFx;
  if (fx.money) {
    state.money += fx.money;
    state.ledger.push({ day: state.day, amount: fx.money, note: `${inc.title}（没接住）`, kind: 'family' });
  }
  if (fx.goal) state.goal += fx.goal;
  if (fx.minutes) c.minutes = clamp(c.minutes + fx.minutes, 0, COMFORT_DAY_MINUTES);
  if (fx.family) c.family = clamp(c.family + fx.family, 0, 100);
  if (fx.love) c.love = clamp(c.love + fx.love, 0, 100);
  clog(state, `常用手机 · ${inc.title}——没接住`, inc.stale);
}
