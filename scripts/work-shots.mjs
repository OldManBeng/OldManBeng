/* 工作手机视觉走查截图（site-audit 第 2 轮 · 第 1 阶段勘探基线）：
   注入最小工作手机存档 → 截 简报/今天/通讯录/朋友圈/聊天记录/钱包/夜态/375px。
   用法：node scripts/work-shots.mjs <out-dir> */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || 'docs/site-audit/screenshots/before';
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;
const BASE = 'http://localhost:4573/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  '--window-size=420,860', '--hide-scrollbars', '--no-first-run',
  '--user-data-dir=' + path.join(process.cwd(), '.cdp-profile-workshots'),
], { stdio: 'ignore' });

for (let i = 0; i < 40; i++) {
  try { await fetch(`http://127.0.0.1:${PORT}/json/list`); break; } catch { await sleep(500); }
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await res.json()).find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* retry */ }
    await sleep(300);
  }
  throw new Error('chrome CDP not reachable');
}
const ws = new WebSocket(await getWsUrl());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, (m) => (m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result))); ws.send(JSON.stringify({ id, method, params })); });
async function evaljs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
  return r.result.value;
}
async function screenshot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64')); console.log('shot:', name); }
async function waitFor(expr, label, timeoutMs = 20000) { const t0 = Date.now(); for (;;) { if (await evaljs(expr)) return; if (Date.now() - t0 > timeoutMs) throw new Error('waitFor timeout: ' + label); await sleep(250); } }
const click = (txt) => evaljs(`[...document.querySelectorAll('button')].filter(b => !b.disabled).find(b => b.textContent.includes(${JSON.stringify(txt)}))?.click()`);

await send('Page.enable');
await send('Runtime.enable');

/** 工作手机最小存档：migrate() 会补全缺省字段。老李入册（warming），夜间=链夜态。 */
const saveFor = (night) => JSON.stringify({
  sessionId: 'run_wshots', rngSeed: 12345, day: 5, daysLimit: 30,
  phase: 'main', dayPhase: night ? 'night' : 'morning',
  playerName: '小满', motive: 'debt', personaId: 'wise_sister',
  money: 523, goal: 1500, energy: 12, energyMax: 16, numbness: 22, conscience: 44,
  riskLevel: 8,
  targets: [{
    targetId: 'lao_li', trust: 46, wariness: 22, stage: 'warming', daysSilent: 0,
    pendingChain: '', totalReceived: 800, timesPaid: 2, daysSincePaid: 1, lastChatDay: 0,
    discoveredDay: 1, pingedToday: false, recentPacks: [], recentGreetingIdx: -1,
    recentPhotoIdx: -1, blocked: false, ended: null,
  }],
  chat: null, log: [], usedOneTimeEvents: [],
  stats: { totalEarned: 862, redPacketsReceived: 9, asksMade: 6, asksFailed: 2, nightsWorked: 4, biggestPacket: 200 },
  endingId: null, flags: {}, industryCourse: false,
  profile: { avatarId: 1, ageClaim: 24, traitId: 'sweet_mouth', selfieId: 'bestie', selfieDay: 2, bioId: 'hardup_plaintext' },
  ledger: [
    { day: 3, amount: 300, note: '老李的红包（深夜的顺风车）', kind: 'income' },
    { day: 4, amount: -53, note: '今日开销', kind: 'living' },
  ],
  archives: [], incoming: [], todayPlan: '', numbnessToday: 0,
  moments: [], unseenMoments: 0, inventory: {}, briefingDay: 0,
  pendingBeat: '', beatResolved: false, pinnedTargets: [], pendingIncident: '', incidentResolved: false,
  selfieAudience: [], bioAudience: [], bioAudienceDay: 0,
  comfort: { active: false, family: 62, love: 41, minutes: 40, blockedByBf: false, bfState: 'normal', datesMet: {} },
});

await send('Page.navigate', { url: BASE });
await waitFor(`!!document.querySelector('.title-buttons .btn')`, 'title');
await evaljs(`localStorage.setItem('beng_save_v1', ${JSON.stringify(saveFor(false))})`);
await send('Page.navigate', { url: BASE });
await waitFor(`!!document.querySelector('.title-buttons .btn')`, 'title2');
await click('我已满 18 岁');
await sleep(300);
await click('继续那一晚');
await waitFor(`!!document.querySelector('.hud')`, 'main');
await sleep(500);

// ① 白天 · 简报弹窗（带佛偈与「开始今天」）
await screenshot('wp-day-0-briefing');
await click('开始今天');
await sleep(500);

// ② 白天 · 今天页
await screenshot('wp-day-1-today');

// ③ 尝试打开一场聊天（他来找你的卡，若有）
const opened = await evaljs(`(function(){
  const b = [...document.querySelectorAll('button')].filter(x => !x.disabled)
    .find(x => /回他|听他说完|听他说/.test(x.textContent));
  if (b) { b.click(); return b.textContent.trim(); }
  return null;
})()`);
await sleep(600);
if (opened) { await screenshot('wp-day-2-chat'); await click('放下手机'); await click('挂断'); await sleep(400); }

// ④ 四个标签页
for (const [i, tab] of [['3', '通讯录'], ['4', '朋友圈'], ['5', '聊天记录'], ['6', '钱包']]) {
  await evaljs(`[...document.querySelectorAll('.nav-btn')].find(b => b.textContent.includes('${tab}'))?.click()`);
  await sleep(500);
  await screenshot(`wp-day-${i}-${tab}`);
}
await evaljs(`[...document.querySelectorAll('.nav-btn')].find(b => b.textContent.includes('今天'))?.click()`);
await sleep(400);

// ⑤ 夜态（天黑了 → 链夜视图）
await click('天黑了');
await sleep(800);
await screenshot('wp-night-0-chain');
await click('进入明天');
await sleep(600);

// ⑥ 375px 窄屏抽查（今天页）
await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await sleep(600);
await screenshot('wp-375-today');
await send('Emulation.clearDeviceMetricsOverride');

console.log('DONE');
ws.close(); chrome.kill();
process.exit(0);
