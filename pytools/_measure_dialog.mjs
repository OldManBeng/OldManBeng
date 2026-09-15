// 一次性调试：测量弹窗内各控件盒宽
import { spawn } from 'node:child_process';
import path from 'node:path';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9350;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless','--disable-gpu',`--remote-debugging-port=${PORT}`,'--window-size=420,860','--hide-scrollbars','--no-first-run','--user-data-dir=' + path.join(process.cwd(),'.cdp-profile-dlg4')], { stdio: 'ignore' });
for (let i=0;i<40;i++){ try{ await fetch(`http://127.0.0.1:${PORT}/json/list`); break;}catch{ await sleep(500);} }
const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
const page = (await res.json()).find(t=>t.type==='page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let id=0; const pend=new Map();
ws.onmessage=(ev)=>{const m=JSON.parse(ev.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id);}};
const send=(method,params={})=>new Promise((res,rej)=>{const i=++id;pend.set(i,(m)=>m.error?rej(new Error(method+JSON.stringify(m.error))):res(m.result));ws.send(JSON.stringify({id:i,method,params}));});
const ev = async (expr)=>{ const r= await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception?.description)); return r.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
const save = JSON.stringify({ sessionId:'dlg', rngSeed:777, day:12, daysLimit:30, phase:'main', dayPhase:'morning', playerName:'小满', motive:'debt', personaId:'wise_sister', money:523, goal:1500, energy:12, energyMax:16, numbness:22, conscience:44, riskLevel:8, targets:[], chat:null, log:[], usedOneTimeEvents:[], stats:{totalEarned:300,redPacketsReceived:3,asksMade:1,asksFailed:0,nightsWorked:2,biggestPacket:120}, endingId:null, flags:{}, industryCourse:false, profile:{avatarId:1,ageClaim:24,traitId:'sweet_mouth',selfieId:'bestie',selfieDay:2,bioId:'hardup_plaintext'}, ledger:[], archives:[], incoming:[], todayPlan:'', numbnessToday:0, moments:[], unseenMoments:0, inventory:{}, briefingDay:11, pendingBeat:'', beatResolved:false, pinnedTargets:[], pendingIncident:'', incidentResolved:false, selfieAudience:[], bioAudience:[], bioAudienceDay:0, comfort:{active:true,family:74,love:88,minutes:30,blockedByBf:false,bfState:'normal',datesMet:{wu:8,chen:10},pending:'inc_cm_blackout'} });
await send('Page.navigate',{url:'http://localhost:4573/'});
for(let i=0;i<20;i++){ if(await ev(`!!document.querySelector('.title-buttons .btn')`)) break; await sleep(250); }
await ev(`localStorage.setItem('beng_save_v1', ${JSON.stringify(save)})`);
await send('Page.navigate',{url:'http://localhost:4573/'});
for(let i=0;i<20;i++){ if(await ev(`!!document.querySelector('.title-buttons .btn')`)) break; await sleep(250); }
await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('我已满 18 岁'))?.click()`);
await sleep(250);
await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('继续那一晚'))?.click()`);
for(let i=0;i<24;i++){ if(await ev(`!!document.querySelector('.comfort-day-card')`)) break; await sleep(250); }
await sleep(600);
const out = await ev(`(function(){
  const card = document.querySelector('.comfort-day-card');
  const cs = getComputedStyle(card);
  const rect = (el) => { const r = el.getBoundingClientRect(); return { left: Math.round(r.left), width: Math.round(r.width) }; };
  const out = { cardWidth: Math.round(card.getBoundingClientRect().width), cardPadding: cs.padding, children: {} };
  const sels = { line: '.comfort-day-line', money: '.comfort-day-money', incident: '.comfort-day-card .beat-card', verse: '.comfort-day-card .comfort-verse', firstBtn: '.comfort-day-card .beat-opt' };
  for (const k in sels) { const el = document.querySelector(sels[k]); if (el) out.children[k] = rect(el); }
  const beat = document.querySelector('.comfort-day-card .beat-card');
  out.beat = (()=>{ const b=getComputedStyle(beat); return { margin:b.margin, padding:b.padding, radius:b.borderRadius }; })();
  const verse = document.querySelector('.comfort-day-card .comfort-verse');
  out.verse = (()=>{ const v=getComputedStyle(verse); return { margin:v.margin, padding:v.padding, radius:v.borderRadius }; })();
  return JSON.stringify(out);
})()`);
console.log(out);
ws.close(); chrome.kill(); process.exit(0);
