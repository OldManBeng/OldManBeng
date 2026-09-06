import { describe, it, expect } from 'vitest';
import { SCRIPTS } from '../../data/script-registry';
import { PERSONA_IDS } from '../../types/persona';

/**
 * v3.2 话术全量审计——结构层面保证"上下文通顺 / 不重复 / 池子够 / 人设键合法"：
 *  1. 任何非开口选项必须有回复词（不能点了没反应）；
 *  2. 同一老头的话术库内，开场白/选项文本不允许逐字重复（玩家会觉得"次次一样"）；
 *  3. 占位符只允许 {selfie}/{age}/{trait}/{topic}——写错变量名玩家会看到原始花括号；
 *  4. replies/personaText 的键必须是合法人设或 default——写错键等于白写；
 *  5. 台词池规模底线：greeting ≥6、警示/断联 ≥2、红包成败 ≥3、偈语池 recall/greeting_close ≥3；
 *  6. 人设专属开场白键 greet_(ff|sd|ws|art) 每池 ≥3 条。
 * 单条开场白的节点（如"在吗"）是刻意的戏剧设计，不在此列。
 */
const PLACEHOLDER_OK = new Set(['selfie', 'age', 'trait', 'topic']);
const SHORT_KEY = new Set(['femme_fatale', 'sweet_daughter', 'wise_sister', 'artistic_soul']);

function badPlaceholders(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(/\{([a-zA-Z_]+)\}/g)) {
    if (!PLACEHOLDER_OK.has(m[1])) found.push(m[1]);
  }
  return found;
}

function personaKeysValid(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).every((k) => k === 'default' || (SHORT_KEY as Set<string>).has(k));
}


// ---------------------------------------------------------------------------
// v3.2.1 语境与身份审计：
//  A. 称呼越界（鸡同鸭讲）：他的台词里对她的称呼/自称必须属于本剧本——
//     老李叫"丫头"、周老师叫"闺女"、王总叫"领导"、这些词出现在别人嘴里就是穿帮。
//  B. 时间戳与作息一致：以（HH:MM）开头的池子台词，小时数必须落在
//     该老头的在线时段（夜行 20-5，晨型 5-12）——上午的老师不能说"凌晨两点"。
//  C. 玩家选项人设锁词：基础选项文本里出现"姐姐我/姐我/老娘/本仙女/妹妹我"
//     这类锁死人设的自称——基础选项是四个人设共用的，锁词会让学妹说出御姐的话。
// ---------------------------------------------------------------------------
const CALLSIGN_MAP: Record<string, string[]> = {
  lao_li: ['丫头'],
  zhou_teacher: ['闺女'],
  boss_wang: ['领导'],
  hao_ge: ['豪哥说'],
  chen_gong: [],
};
/** 各剧本的"豁免词"——该词在本剧本里有第三人称含义，不作称呼越界处理。 */
const EXEMPT_WORDS: Record<string, string[]> = {
  lao_li: ['闺女'], // 老李的亲闺女：给"闺女"打生活费是他自己的生活，不是对她的称呼
};
const ALL_NICKS = ['丫头', '闺女', '领导'];

function hourOk(text: string, activeHour: number, poolKey: string): boolean {
  if (poolKey === 'morning' || poolKey === 'deep_night') return true; // 回味池，时间属于"另一段生活"
  const m = text.match(/^（(\d{1,2}):(\d{2})）/);
  if (!m) return true; // 不带时间戳的台词不检查
  const h = Number(m[1]);
  if (activeHour >= 20 || activeHour < 6) return h >= 20 || h <= 6; // 夜猫子横跨整个深夜带
  const diff = Math.min(Math.abs(h - activeHour), 24 - Math.abs(h - activeHour));
  return diff <= 5; // 白天型以在线时刻为中心 ±5 小时
}

function selfLockWords(text: string): string[] {
  const bad: string[] = [];
  for (const w of ['姐姐我', '姐我', '姐可很少', '姐不跟', '老娘', '本仙女', '妹妹我']) {
    if (text.includes(w)) bad.push(w);
  }
  return bad;
}

describe('话术全量审计', () => {
  it('全部剧本结构合规（上下文/重复/占位符/池子规模/人设键）', () => {
    const issues: string[] = [];
    let packsTotal = 0;
    let optionsTotal = 0;
    let openersTotal = 0;

    for (const [tid, script] of Object.entries(SCRIPTS)) {
      const seenOpeners = new Map<string, string>();
      const seenOptions = new Map<string, string>();
      // ---- v3.2.1 语境与身份检查 ----
      const isMain = ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong'].includes(tid);
      const activeHour = (() => {
        const t = (LIB_REGISTRY as Record<string, { activeHour?: number }>)[tid];
        return t?.activeHour ?? 23;
      })();
      const nickBlacklist = ALL_NICKS.filter((n) => !(CALLSIGN_MAP[tid] ?? []).includes(n) && !(EXEMPT_WORDS[tid] ?? []).includes(n));
      const scanVoice = (where: string, text: string, poolKey: string) => {
        // 去掉第三人称指涉（"讲他闺女的近况"不是在叫她）
        const stripped = text.replace(/[他她自人的讲]的?(闺女|丫头|领导)/g, '◇');
        if (!poolKey.startsWith('greet_')) {
          // 人设专属池（greet_*）本来就对应"她是谁"，称呼随人设变——不查越界
          for (const n of nickBlacklist) {
            if (stripped.includes(n)) issues.push(`${tid}/${where}: 称呼越界「${n}」（鸡同鸭讲）：${text.slice(0, 22)}…`);
          }
        }
        // 时间戳作息检查只管五位主角——库人物共用原型台词，时段随原型不随个人
        if (isMain && !hourOk(text, activeHour, poolKey)) issues.push(`${tid}/${where}: 时间戳超出作息时段：${text.slice(0, 22)}…`);
      };
      for (const [k, arr] of Object.entries(script.lines)) {
        if (!Array.isArray(arr)) continue;
        arr.forEach((line, idx) => scanVoice(`lines.${k}[${idx}]`, line, k));
      }
      if (script.incoming) {
        for (const [k, arr] of Object.entries(script.incoming)) {
          ((arr ?? []) as string[]).forEach((line: string, idx: number) => scanVoice(`incoming.${k}[${idx}]`, line, `incoming.${k}`));
        }
      }
      const checkPlayerVoice = (where: string, o: { text: string; personaText?: unknown }) => {
        const locks = selfLockWords(o.text);
        if (locks.length) issues.push(`${tid}/${where}: 基础选项锁死人设自称（${locks.join('/')}）：${o.text.slice(0, 24)}…`);
      };



      const checkOpeners = (where: string, openers: string[]) => {
        openersTotal += openers.length;
        let prev = '';
        for (const op of openers) {
          if (!op?.trim()) { issues.push(`${tid}/${where}: 空开场白`); continue; }
          const bad = badPlaceholders(op);
          if (bad.length) issues.push(`${tid}/${where}: 非法占位符 {${bad.join(',')}}`);
          // 同一套话术内相邻重复是刻意的连发效果（"在吗。在吗。"），放行
          if (op !== prev && seenOpeners.has(op)) issues.push(`${tid}: 开场白重复（${where} 与 ${seenOpeners.get(op)}）「${op.slice(0, 18)}…」`);
          if (op !== prev && !seenOpeners.has(op)) seenOpeners.set(op, where);
          prev = op;
        }
      };

      const checkOption = (where: string, o: { text: string; isAsk?: boolean; replies?: unknown; personaText?: unknown }, gated?: boolean) => {
        optionsTotal += 1;
        if (!o.text?.trim()) { issues.push(`${tid}/${where}: 空选项文本`); return; }
        const bad = badPlaceholders(o.text);
        if (bad.length) issues.push(`${tid}/${where}: 选项非法占位符 {${bad.join(',')}}`);
        if (seenOptions.has(o.text) && !o.isAsk) {
          issues.push(`${tid}: 选项重复（${where} 与 ${seenOptions.get(o.text)}）「${o.text.slice(0, 18)}…」`);
        } else if (!seenOptions.has(o.text)) {
          seenOptions.set(o.text, where);
        }
        if (o.personaText) {
          const pt = o.personaText as Record<string, unknown>;
          if (!personaKeysValid(pt)) issues.push(`${tid}/${where}: personaText 键非法`);
        }
        if (!gated) checkPlayerVoice(where, o);
        if (o.isAsk) return; // 开口选项的反馈由红包结算生成
        const r = o.replies;
        if (Array.isArray(r)) {
          if (r.length === 0) issues.push(`${tid}/${where}: 非开口选项没有回复词`);
          const bad2 = r.flatMap((x) => badPlaceholders(String(x)));
          if (bad2.length) issues.push(`${tid}/${where}: 回复非法占位符 {${bad2.join(',')}}`);
        } else if (r && typeof r === 'object') {
          const ro = r as Record<string, unknown>;
          if (!personaKeysValid(ro)) issues.push(`${tid}/${where}: replies 键非法`);
          const total = Object.values(ro).reduce((n: number, v) => n + (Array.isArray(v) ? v.length : 0), 0);
          if (total === 0) issues.push(`${tid}/${where}: 分人设回复全为空`);
        } else {
          issues.push(`${tid}/${where}: 非开口选项没有回复词`);
        }
      };

      for (const p of script.packs ?? []) {
        packsTotal += 1;
        checkOpeners(`pack:${p.id}`, p.openers);
        p.options.forEach((o, i) => checkOption(`pack:${p.id}#${i}`, o));
      }
      for (const [nid, n] of Object.entries(script.chain)) {
        checkOpeners(`chain:${nid}`, n.openers);
        n.options.forEach((o, i) => checkOption(`chain:${nid}#${i}`, o, !!n.onlyPersona));
      }
      for (const n of script.free) {
        checkOpeners(`free:${n.id}`, n.openers);
        n.options.forEach((o, i) => checkOption(`free:${n.id}#${i}`, o));
      }

      // ---- 台词池规模底线 ----
      const L = script.lines;
      const pool = (k: string) => (L[k] ?? []).length;
      if (pool('greeting') < 6) issues.push(`${tid}: greeting 池过小（${pool('greeting')}<6）`);
      if (pool('wariness_high') < 2) issues.push(`${tid}: wariness_high 池过小`);
      if (pool('silent_warning') < 2) issues.push(`${tid}: silent_warning 池过小`);
      if (pool('ask_success') < 3) issues.push(`${tid}: ask_success 池过小`);
      if (pool('ask_fail') < 3) issues.push(`${tid}: ask_fail 池过小`);
      if (pool('blocked') < 1) issues.push(`${tid}: blocked 池过小`);
      if (script.packs?.length && !LIB_NO_RECALL.has(tid)) {
        if (pool('recall') < 3) issues.push(`${tid}: recall 池缺失/过小（${pool('recall')}<3）`);
        if (pool('greeting_close') < 3) issues.push(`${tid}: greeting_close 池缺失/过小（${pool('greeting_close')}<3）`);
      }
      for (const k of Object.keys(L)) {
        if (k.startsWith('greet_')) {
          const short = k.slice(6);
          if (!SHORT_KEY.has(
            short === 'ff' ? 'femme_fatale' : short === 'sd' ? 'sweet_daughter' : short === 'ws' ? 'wise_sister' : short === 'art' ? 'artistic_soul' : short,
          )) issues.push(`${tid}: 人设开场白键 ${k} 非法`);
          if (pool(k) < 3) issues.push(`${tid}: ${k} 池过小（${pool(k)}<3）`);
        }
      }
      if (script.incoming) {
        for (const [k, v] of Object.entries(script.incoming)) {
          if (!v?.length) issues.push(`${tid}: incoming.${k} 为空`);
        }
      }
    }

    // 汇总信息打到输出里，方便人工 review 规模
    console.log(`审计规模：${Object.keys(SCRIPTS).length} 个剧本 / ${packsTotal} 套话术 / ${openersTotal} 条开场白 / ${optionsTotal} 个选项`);
    expect(issues).toEqual([]);
  });

  it('人设覆盖面：五主角都有四套人设专属开场白', () => {
    for (const tid of ['lao_li', 'zhou_teacher', 'boss_wang', 'hao_ge', 'chen_gong']) {
      const L = SCRIPTS[tid].lines;
      for (const short of ['ff', 'sd', 'ws', 'art']) {
        expect(L[`greet_${short}`]?.length ?? 0).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

const LIB_NO_RECALL = new Set<string>();
import { ALL_TARGETS as AUDIT_TARGETS } from '../../data/target-library';
const LIB_REGISTRY: Record<string, { activeHour: number }> = Object.fromEntries(
  AUDIT_TARGETS.map((t) => [t.id, { activeHour: t.activeHour }]),
);
