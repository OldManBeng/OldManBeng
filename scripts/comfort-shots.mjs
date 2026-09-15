/* 舒适圈视觉走查截图（site-audit 第 5 阶段补录）：
   启动 dev server → 注入舒适圈存档 → 截 常用手机 五模块（昼/夜两态）+ 360px。
   用法：node scripts/comfort-shots.mjs <out-dir> */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || 'docs/site-audit/screenshots/after';
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  '--window-size=420,860', '--hide-scrollbars', '--no-first-run',
  '--user-data-dir=' + path.join(process.cwd(), '.cdp-profile-shots'),
], { stdio: 'ignore' });

const dev = spawn('npm.cmd', ['run', 'dev'], { stdio: 'ignore', shell: true });
for (let i = 0; i < 60; i++) {
  try { await fetch('http://localhost:3100/'); break; } catch { await sleep(500); }
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

await send('Page.enable');
await send('Runtime.enable');

/** 舒适圈最小存档：migrate() 会补全一切缺省字段。night=true 走夜态。 */
const saveFor = (night) => JSON.stringify({
  sessionId: 'run_shots', rngSeed: 12345, day: 5, daysLimit: 30,
  phase: 'main', dayPhase: night ? 'night' : 'morning',
  playerName: '小满', motive: 'debt', personaId: 'wise_sister',
  money: 523, goal: 1500, energy: 12, energyMax: 16, numbness: 22, conscience: 44,
  riskLevel: 8, targets: [], chat: null, log: [], usedOneTimeEvents: [],
  stats: { totalEarned: 862, redPacketsReceived: 9, asksMade: 6, asksFailed: 2, nightsWorked: 4, biggestPacket: 200 },
  endingId: null, flags: {}, industryCourse: false,
  profile: { avatarId: 1, ageClaim: 24, traitId: 'sweet_mouth', selfieId: 'bestie', selfieDay: 2, bioId: 'hardup_plaintext' },
  ledger: [], archives: [], incoming: [], todayPlan: '', numbnessToday: 0,
  moments: [], unseenMoments: 0, inventory: {}, briefingDay: 0,
  pendingBeat: '', beatResolved: false, pinnedTargets: [], pendingIncident: '', incidentResolved: false,
  selfieAudience: [], bioAudience: [], bioAudienceDay: 0,
  comfort: { active: true, family: 62, love: 41, minutes: 40, blockedByBf: false, bfState: 'normal', datesMet: { chen: 3, sun: 4 } },
});

async function drive(night, tag) {
  await send('Page.navigate', { url: 'http://localhost:3100/' });
  await waitFor(`!!document.querySelector('.title-buttons .btn')`, 'title');
  await evaljs(`localStorage.setItem('beng_save_v1', ${JSON.stringify(saveFor(night))})`);
  await send('Page.navigate', { url: 'http://localhost:3100/' });
  await waitFor(`!!document.querySelector('.title-buttons .btn')`, 'title2');
  await evaljs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('我已满 18 岁'))?.click()`);
  await sleep(300);
  await evaljs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('继续那一晚'))?.click()`);
  await waitFor(`!!document.querySelector('.hud')`, 'main');
  await sleep(500);
  // 关掉可能存在的「新的一天」简报
  await evaljs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('开始今天'))?.click()`);
  await sleep(400);
  // 存档里 comfort.active 已是 true——main-screen 直接渲染 ComfortScreen，无需再点切机
  // （点了反而会 toggle 回工作手机）。等待舒适圈主题出现即可。
  await waitFor(`!!document.querySelector('.comfort-theme')`, 'comfort', 10000).catch(() => console.log('comfort theme not visible'));
  await sleep(600);
  await screenshot(`${tag}-0-today`);
  for (const [i, tab] of [['1', '通讯录'], ['2', '朋友圈'], ['3', '聊天记录'], ['4', '钱包']]) {
    await evaljs(`[...document.querySelectorAll('.nav-btn')].find(b => b.textContent.includes('${tab}'))?.click()`);
    await sleep(500);
    await screenshot(`${tag}-${i}-${tab}`);
  }
}

await drive(false, 'day');
await drive(true, 'night');
console.log('DONE');
ws.close(); chrome.kill(); dev.kill();
process.exit(0);
