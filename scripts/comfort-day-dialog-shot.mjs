/* 舒适圈晨间弹窗（突发事件 + 经文卡）现场截图：注入 dayAck=0 + pending 事件的存档。 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = 'docs/site-audit/screenshots/after';
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9337;
const BASE = 'http://localhost:4573/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  '--window-size=420,860', '--hide-scrollbars', '--no-first-run',
  '--user-data-dir=' + path.join(process.cwd(), '.cdp-profile-daydialog'),
], { stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { await fetch(`http://127.0.0.1:${PORT}/json/list`); break; } catch { await sleep(500); } }

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await res.json()).find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { await sleep(300); }
  }
  throw new Error('cdp not reachable');
}
const ws = new WebSocket(await getWsUrl());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++msgId; pending.set(id, (m) => (m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result))); ws.send(JSON.stringify({ id, method, params })); });
async function evaljs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails?.exception?.description || r.exceptionDetails));
  return r.result.value;
}
async function screenshot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64')); console.log('shot:', name); }
async function waitFor(expr, label, timeoutMs = 20000) { const t0 = Date.now(); for (;;) { if (await evaljs(expr)) return; if (Date.now() - t0 > timeoutMs) throw new Error('timeout: ' + label); await sleep(250); } }

await send('Page.enable');
await send('Runtime.enable');

const save = JSON.stringify({
  sessionId: 'run_daydialog', rngSeed: 777, day: 12, daysLimit: 30,
  phase: 'main', dayPhase: 'morning',
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
  stats: { totalEarned: 300, redPacketsReceived: 3, asksMade: 1, asksFailed: 0, nightsWorked: 2, biggestPacket: 120 },
  endingId: null, flags: {}, industryCourse: false,
  profile: { avatarId: 1, ageClaim: 24, traitId: 'sweet_mouth', selfieId: 'bestie', selfieDay: 2, bioId: 'hardup_plaintext' },
  ledger: [], archives: [], incoming: [], todayPlan: '', numbnessToday: 0,
  moments: [], unseenMoments: 0, inventory: {}, briefingDay: 0,
  pendingBeat: '', beatResolved: false, pinnedTargets: [], pendingIncident: '', incidentResolved: false,
  selfieAudience: [], bioAudience: [], bioAudienceDay: 0,
  comfort: { active: true, family: 74, love: 88, minutes: 30, blockedByBf: false, bfState: 'normal', datesMet: { wu: 8, chen: 10 }, momGiven: 460, bfGiven: 160, bfTaken: 260, pending: 'inc_cm_blackout' },
});

await send('Page.navigate', { url: BASE });
await waitFor(`!!document.querySelector('.title-buttons .btn')`, 'title');
await evaljs(`localStorage.setItem('beng_save_v1', ${JSON.stringify(save)})`);
await send('Page.navigate', { url: BASE });
await waitFor(`!!document.querySelector('.title-buttons .btn')`, 'title2');
await evaljs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('我已满 18 岁'))?.click()`);
await sleep(300);
await evaljs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('继续那一晚'))?.click()`);
await waitFor(`!!document.querySelector('.comfort-day-card')`, 'day dialog', 12000);
await sleep(900);
await screenshot('comfort-day-dialog');
console.log('DONE');
ws.close();
chrome.kill();
