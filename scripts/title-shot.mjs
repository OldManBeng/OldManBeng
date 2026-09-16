/* 标题屏截图：验证 H1 版本角标（V1.1）呈现。 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9347;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  '--window-size=420,860', '--hide-scrollbars', '--no-first-run',
  '--user-data-dir=' + path.join(process.cwd(), '.cdp-profile-title2'),
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
async function waitFor(expr, label, timeoutMs = 20000) {
  const t0 = Date.now();
  for (;;) {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result?.value) return;
    if (Date.now() - t0 > timeoutMs) throw new Error('timeout: ' + label);
    await sleep(300);
  }
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: 'http://localhost:4573/' });
await waitFor(`!!document.querySelector('.h1-ver')`, 'title h1');
await sleep(800);
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('docs/site-audit/screenshots/after/title-v11.png', Buffer.from(shot.data, 'base64'));
console.log('shot ok');
ws.close();
chrome.kill();
process.exit(0);
