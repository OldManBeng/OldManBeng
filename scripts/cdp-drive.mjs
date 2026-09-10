/* 临时驱动脚本（不入库）：CDP 驱动真实 UI 走完 title→prologue→newgame→main 流程并截图。
   用法：node scripts/cdp-drive.mjs <screenshots-dir> [--fast]
   --fast: 主界面截图后注入存档推进到第 12 天再截一轮。 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || 'gui-test-screenshots/v411';
const FAST = process.argv.includes('--fast');
mkdirSync(OUT, { recursive: true });

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  /* v4.11.2 手机浏览器视口：375×667（iPhone SE / 带地址栏的典型可视高度） */
  process.env.MOBILE ? '--window-size=375,667' : '--window-size=560,920',
  '--hide-scrollbars', '--no-first-run',
  '--user-data-dir=' + path.join(process.cwd(), '.cdp-profile'),
], { stdio: 'ignore' });

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const tabs = await res.json();
      const page = tabs.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* retry */ }
    await sleep(300);
  }
  throw new Error('chrome CDP not reachable');
}

const wsUrl = await getWsUrl();
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
function send(method, params = {}) {
  return new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, (msg) => (msg.error ? rej(new Error(method + ': ' + JSON.stringify(msg.error))) : res(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaljs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
  return r.result.value;
}
async function screenshot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
  console.log('shot:', name);
}
/** 轮询直到 eval 为真（React 异步渲染保险） */
async function waitFor(expr, label, timeoutMs = 15000) {
  const t0 = Date.now();
  for (;;) {
    if (await evaljs(expr)) return;
    if (Date.now() - t0 > timeoutMs) throw new Error('waitFor timeout: ' + label);
    await sleep(250);
  }
}
/** 点含指定文案的按钮，并等待出现（可选） */
async function clickBtn(text) {
  const ok = await evaljs(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.replace(/\\s+/g,'').includes('${text}')); if (!b) return false; b.click(); return true; })()`);
  if (!ok) throw new Error('button not found: ' + text);
}
async function navigate(url) {
  await send('Page.navigate', { url });
  await waitFor(`!!document.querySelector('.screen')`, 'screen render');
}

await send('Page.enable');
await send('Runtime.enable');
await navigate('http://localhost:3100/');

/* 1. 标题屏 → 18+（若有）→ 新的一晚 */
await waitFor(`!!document.querySelector('.title-buttons .btn')`, 'title render');
await screenshot('00-title');
await evaljs(`[...document.querySelectorAll('button')].find(x => x.textContent.includes('18'))?.click()`);
await sleep(300);
await clickBtn('新的一晚');
await waitFor(`!!document.querySelector('.prologue-screen')`, 'prologue');
await screenshot('01-prologue');

/* 2. 序章 ×4（继续×3 → 进入这个月） */
for (let i = 0; i < 3; i++) {
  await clickBtn('继续');
  await sleep(350);
}
await screenshot('02-prologue-end');
await clickBtn('进入这个月');
await waitFor(`!!document.querySelector('.newgame-screen')`, 'newgame');
await screenshot('03-newgame');

/* 3. 建档：默认 小满 + wise_sister 已选 → 开始这个月 */
await clickBtn('开始这个月');
await waitFor(`!!document.querySelector('.hud')`, 'main screen');
await sleep(600);
await screenshot('04-main-day1');

/* 3.5 关掉今日简报 modal（若开着） */
const briefOpen = await evaljs(`!!document.querySelector('.briefing-overlay')`);
if (briefOpen) {
  await evaljs(`[...document.querySelectorAll('.briefing-overlay button')].find(b => b.textContent.includes('开始今天'))?.click()`);
  await sleep(400);
}
await screenshot('04b-main-noBrief');

/* 4. 各 tab 截图 */
const TABS = ['今天', '通讯录', '朋友圈', '聊天记录', '钱包'];
for (const tab of TABS) {
  await evaljs(`[...document.querySelectorAll('.nav-btn')].find(b => b.textContent.includes('${tab}'))?.click()`);
  await sleep(500);
  await screenshot('05-tab-' + tab);
}

/* 4.5 v4.11 变更人设浮层：今天页 → 点「变更人设」 */
await evaljs(`[...document.querySelectorAll('.nav-btn')].find(b => b.textContent.includes('今天'))?.click()`);
await sleep(400);
await evaljs(`[...document.querySelectorAll('button')].find(x => x.textContent.includes('变更人设'))?.click()`);
await sleep(500);
await screenshot('10-profile-overlay');
/* 换一个试试（点第一张非选中卡） */
await evaljs(`(() => { const cards=[...document.querySelectorAll('.persona-switch-grid .choice-tile')]; const c=cards.find(x=>!x.className.includes('on')); if(c){c.click();return true;} return false; })()`);
await sleep(500);
await screenshot('11-persona-switched');
await evaljs(`[...document.querySelectorAll('button')].find(x => x.textContent.includes('就这么办'))?.click()`);
await sleep(400);
await screenshot('12-after-close');

/* 5. 点开计划条（今天 tab 上） */
await evaljs(`[...document.querySelectorAll('.nav-btn')].find(b => b.textContent.includes('今天'))?.click()`);
await sleep(400);
await evaljs(`document.querySelector('.plan-bar-toggle')?.click()`);
await sleep(500);
await screenshot('06-plan-open');

/* 6. 选中一个计划 */
await evaljs(`document.querySelector('.plan-card')?.click()`);
await sleep(500);
await screenshot('07-plan-chosen');

/* 6.5 开一场聊天：白天只有周老师上午在线；先试「陪他说说话」 */
const chatBtn = await evaljs(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('陪他说说话') || x.textContent.includes('找他说话')); if (!b) return false; b.click(); return true; })()`);
if (chatBtn) {
  await sleep(900);
  await screenshot('08-chat-open');
  /* 快进：跳过打字动画，直到选项列表出现 */
  for (let i = 0; i < 10; i++) {
    await evaljs(`[...document.querySelectorAll('button')].find(x => x.textContent.includes('不等了'))?.click()`);
    await sleep(500);
    if (await evaljs(`!!document.querySelector('.option-list .option')`)) break;
  }
  /* 连点几个回复选项，让对话推进 */
  for (let i = 0; i < 4; i++) {
    const picked = await evaljs(`(() => { const b = document.querySelector('.option-list .option'); if (!b) return false; b.click(); return true; })()`);
    if (!picked) break;
    await sleep(600);
    await evaljs(`[...document.querySelectorAll('button')].find(x => x.textContent.includes('不等了'))?.click()`);
    await sleep(400);
  }
  await screenshot('09-chat-mid');
} else {
  console.log('no chat target awake (day1 morning) — skip');
}

if (FAST) {
  /* 7. 注入存档推进到第 12 天：改 localStorage 再刷新 */
  const saved = await evaljs(`localStorage.getItem('beng_save_v1') ? 'yes' : 'no'`);
  console.log('save exists:', saved);
  await evaljs(`
    (() => {
      const s = JSON.parse(localStorage.getItem('beng_save_v1'));
      s.day = 11; s.money = 862; s.packetsTotal = 862; s.energy = 8;
      for (const t of s.targets) { t.trust = Math.min(95, t.trust + 30); t.discoveredDay = 1; }
      localStorage.setItem('beng_save_v1', JSON.stringify(s));
    })()
  `);
  await navigate('http://localhost:3100/');
  await waitFor(`!!document.querySelector('.title-buttons .btn')`, 'title render');
  /* 有存档 → 「继续那一晚」进主界面 */
  await clickBtn('继续那一晚');
  await waitFor(`!!document.querySelector('.hud')`, 'day12 main');
  await sleep(600);
  const brief12 = await evaljs(`!!document.querySelector('.briefing-overlay')`);
  if (brief12) {
    await evaljs(`[...document.querySelectorAll('.briefing-overlay button')].find(b => b.textContent.includes('开始今天'))?.click()`);
    await sleep(400);
  }
  await screenshot('08-day12-main');
  for (const tab of TABS) {
    await evaljs(`[...document.querySelectorAll('.nav-btn')].find(b => b.textContent.includes('${tab}'))?.click()`);
    await sleep(450);
    await screenshot('09-d12-' + tab);
  }
}

console.log('DONE');
ws.close();
chrome.kill();
process.exit(0);
