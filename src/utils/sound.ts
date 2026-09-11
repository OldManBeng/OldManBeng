/**
 * Web Audio 合成音效 + 环境音乐（GL2 模式，零音频文件）。
 *
 * v4.14 架构三层：
 * 1. 音色层——noise burst / 滤波 / 衰减包络，让 7 个基础 SFX 有"质感"
 * 2. 环境层——标题/晨/夜/聊天/结局五态音景（低频 pad + 稀疏音符，不是旋律，
 *    是"安静的房间"）；UI 主动 setAmbient() 切换，crossfade 过渡。
 * 3. 场景层——打字机/晨钟/朋友圈/人设切换等交互补齐。
 *
 * 静音偏好（beng_muted）同时控制 SFX 与音乐层。
 * 兼容：v4.13 的 7 个 play*() 签名不变，旧调用点零改动即可享受新音色。
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;   // 总线（SFX + 音乐都过这里）
let musicGain: GainNode | null = null;    // 音乐层独立 gain（crossfade 用）
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(masterGain);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem('beng_muted', v ? '1' : '0'); } catch { /* ok */ }
  // v4.14：静音同时压掉音乐层（保持 ambient 图，gain=0——解除静音 crossfade 回来）
  const a = ac();
  if (a && musicGain) {
    musicGain.gain.cancelScheduledValues(a.currentTime);
    musicGain.gain.setTargetAtTime(v ? 0 : currentMusicTarget, a.currentTime, 0.3);
  }
}
export function isMuted() {
  return muted;
}
export function loadMutePref() {
  try { muted = localStorage.getItem('beng_muted') === '1'; } catch { /* ok */ }
}

// ---------------------------------------------------------------------------
// 基础件
// ---------------------------------------------------------------------------

/** 单音：osc + gain 包络（attack 20ms → 指数衰减）。 */
function tone(freq: number, dur: number, delay = 0, type: OscillatorType = 'sine', gain = 0.08, dest?: AudioNode) {
  const a = ac();
  if (!a || muted) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + delay);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + delay + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + delay + dur);
  osc.connect(g).connect(dest ?? masterGain!);
  osc.start(a.currentTime + delay);
  osc.stop(a.currentTime + delay + dur + 0.05);
}

/** 噪声脉冲：白噪声 → 带通/高通 → 包络。给"质感"用（消息嗡、打字嗒、金币沙）。 */
function noiseBurst(dur: number, delay = 0, opts: { hp?: number; lp?: number; gain?: number; type?: BiquadFilterType } = {}) {
  const a = ac();
  if (!a || muted) return;
  const { hp = 2000, lp = 8000, gain = 0.06, type = 'bandpass' } = opts;
  // 复用一段 1s 噪声缓冲（懒建）
  if (!noiseBurst.buf) {
    const len = a.sampleRate;
    noiseBurst.buf = a.createBuffer(1, len, a.sampleRate);
    const d = noiseBurst.buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = a.createBufferSource();
  src.buffer = noiseBurst.buf;
  src.loop = true;
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.value = hp;
  if (type === 'bandpass') {
    f.Q.value = 0.9;
    if (lp > hp) f.frequency.value = (hp + lp) / 2;
  }
  const g = a.createGain();
  g.gain.setValueAtTime(0, a.currentTime + delay);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + delay + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + delay + dur);
  src.connect(f).connect(g).connect(masterGain!);
  src.start(a.currentTime + delay);
  src.stop(a.currentTime + delay + dur + 0.05);
}
namespace noiseBurst { export let buf: AudioBuffer | null = null; }

/** 钟声：基频 + 非谐泛音簇 + 长衰减（晨钟偈语用）。 */
function bell(baseFreq: number, dur = 3.2, gain = 0.1, delay = 0) {
  const a = ac();
  if (!a || muted) return;
  // 佛钟的非谐泛音：基频 ×1 / 2.76 / 5.4 / 8.9——金属感的来源
  const partials = [1, 2.76, 5.4, 8.93];
  const weights = [1, 0.5, 0.25, 0.12];
  partials.forEach((p, i) => {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = 'sine';
    osc.frequency.value = baseFreq * p;
    const amp = gain * weights[i];
    g.gain.setValueAtTime(0, a.currentTime + delay);
    g.gain.linearRampToValueAtTime(amp, a.currentTime + delay + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + delay + dur * (1 - i * 0.15));
    osc.connect(g).connect(masterGain!);
    osc.start(a.currentTime + delay);
    osc.stop(a.currentTime + delay + dur + 0.1);
  });
}

// ---------------------------------------------------------------------------
// SFX（v4.14 音色升级：签名不变，声音更有质感）
// ---------------------------------------------------------------------------

/** A message arrives from him —— 双音上行 + 一点空气感噪声。 */
export function playMessage() {
  tone(660, 0.12, 0, 'sine', 0.045);
  tone(880, 0.1, 0.08, 'sine', 0.04);
  noiseBurst(0.06, 0, { hp: 4000, lp: 9000, gain: 0.012 });
}
/** She sends a reply — softer, 往下拉一点点像"放回桌上"。 */
export function playSend() {
  tone(520, 0.08, 0, 'sine', 0.038);
  tone(430, 0.05, 0.05, 'sine', 0.02);
}
/** Red packet lands —— 三音琶音 + 金属沙（币落感）。 */
export function playPacket() {
  tone(784, 0.12, 0, 'sine', 0.07);
  tone(988, 0.16, 0.07, 'sine', 0.065);
  tone(1319, 0.2, 0.14, 'sine', 0.055);
  noiseBurst(0.12, 0.1, { hp: 6000, lp: 11000, gain: 0.02 });
  tone(1976, 0.1, 0.16, 'sine', 0.02);
}
/** Ask refused — descending minor + 低频闷响垫底。 */
export function playFail() {
  tone(392, 0.18, 0, 'triangle', 0.07);
  tone(311, 0.25, 0.14, 'triangle', 0.065);
  tone(98, 0.3, 0.05, 'sine', 0.05);
}
/** Blocked — hollow thud：低频锯齿 + 房间残响感（短噪声尾）。 */
export function playBlocked() {
  tone(140, 0.4, 0, 'sawtooth', 0.045);
  tone(70, 0.5, 0.02, 'sine', 0.06);
  noiseBurst(0.25, 0.04, { hp: 120, lp: 600, gain: 0.02, type: 'lowpass' });
}
/** New day starts —— 双音晨光 + 一声远钟（很轻）。 */
export function playMorning() {
  tone(523, 0.1, 0, 'sine', 0.038);
  tone(659, 0.12, 0.09, 'sine', 0.036);
  bell(392, 2.4, 0.03, 0.18);
}
/** Ending chord —— 四音大和弦，慢放。 */
export function playEnding() {
  tone(523, 0.5, 0, 'sine', 0.045);
  tone(659, 0.5, 0.06, 'sine', 0.042);
  tone(784, 0.7, 0.12, 'sine', 0.04);
  tone(1047, 0.9, 0.2, 'sine', 0.03);
}

// ---------------------------------------------------------------------------
// v4.14 场景层（新增）
// ---------------------------------------------------------------------------

/** 打字机气泡——每字轻嗒（超高频短噪声，机械键盘气声）。 */
export function playTypeTick() {
  noiseBurst(0.02, 0, { hp: 6500, lp: 12000, gain: 0.008, type: 'highpass' });
}
/** 照片送达——快门声：两段短噪声 + 轻微音高感。 */
export function playPhoto() {
  noiseBurst(0.03, 0, { hp: 3000, lp: 9000, gain: 0.03 });
  noiseBurst(0.05, 0.07, { hp: 1800, lp: 7000, gain: 0.022 });
  tone(1200, 0.04, 0.08, 'sine', 0.012);
}
/** 朋友圈发布——轻快两连音（发出去的"落定"感）。 */
export function playPost() {
  tone(587, 0.09, 0, 'sine', 0.04);
  tone(880, 0.12, 0.07, 'sine', 0.038);
}
/** 有人来互动（赞/评论）——小气泡感，双短音。 */
export function playSocial() {
  tone(740, 0.06, 0, 'sine', 0.028);
  tone(988, 0.07, 0.05, 'sine', 0.026);
}
/** 晨钟偈语——正钟（比 playMorning 里的重，这是仪式，不是提示）。 */
export function playBell() {
  bell(261.6, 4, 0.12);
  tone(131, 4.2, 0.02, 'sine', 0.06);
}
/** 换人设——面孔切换：玻璃质感滑音 + 三音身份签名（四人各自不同的音高组留给后续）。 */
export function playPersonaSwitch() {
  const a = ac();
  if (!a || muted) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(340, a.currentTime);
  osc.frequency.exponentialRampToValueAtTime(660, a.currentTime + 0.35);
  g.gain.setValueAtTime(0, a.currentTime);
  g.gain.linearRampToValueAtTime(0.04, a.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5);
  osc.connect(g).connect(masterGain!);
  osc.start();
  osc.stop(a.currentTime + 0.55);
  tone(392, 0.15, 0.28, 'triangle', 0.035);
  tone(523, 0.2, 0.4, 'triangle', 0.03);
}
/** 切换头像——轻快单音 + 噪声气声（挑衣服的轻巧感）。 */
export function playAvatarPick() {
  tone(880, 0.08, 0, 'sine', 0.03);
  noiseBurst(0.04, 0.02, { hp: 5000, lp: 10000, gain: 0.01 });
}
/** 钱包进账（转账/打工）——硬币小落（比 playPacket 轻，零碎钱）。 */
export function playMoney() {
  tone(988, 0.07, 0, 'sine', 0.035);
  tone(1319, 0.09, 0.05, 'sine', 0.03);
}
/** 风险上涨——低频不谐和二音（隐隐的不安，不吓人）。 */
export function playRisk() {
  tone(196, 0.4, 0, 'sine', 0.03);
  tone(207, 0.45, 0.06, 'sine', 0.025); // 相邻半音——拍频的不安感
}
/** 翻牌/切 tab——极轻的界面音。 */
export function playTab() {
  noiseBurst(0.03, 0, { hp: 2500, lp: 6000, gain: 0.012 });
}

// ---------------------------------------------------------------------------
// v4.14 环境音乐层——五态音景（不是旋律，是"安静的房间"）
// ---------------------------------------------------------------------------

export type AmbientId = 'none' | 'title' | 'morning' | 'night' | 'ending';

interface AmbientSpec {
  /** pad 基础音（根音，Hz）。 */
  root: number;
  /** pad 和弦泛音（root 的倍数）。 */
  partials: number[];
  /** pad 音量。 */
  padGain: number;
  /** 稀疏钢琴音：随机出现的音池（五声音阶——避免和声冲突，永远"对"）。 */
  sparsePool: number[];
  /** 稀疏音出现间隔范围 [min, max] 秒。 */
  sparseEvery: [number, number];
  /** 稀疏音音量。 */
  sparseGain: number;
}

const AMBIENTS: Record<Exclude<AmbientId, 'none'>, AmbientSpec> = {
  // 标题屏：夜空感——低根音 + 高五声稀疏音（月亮、城市、孤独）
  title: {
    root: 110, partials: [1, 1.5, 2], padGain: 0.028,
    sparsePool: [523.25, 587.33, 659.25, 783.99, 880], sparseEvery: [4, 9], sparseGain: 0.018,
  },
  // 白天：暖一点——根音抬高 + 大三度（晨光的暖）
  morning: {
    root: 130.81, partials: [1, 1.26, 1.5], padGain: 0.02,
    sparsePool: [523.25, 587.33, 659.25, 783.99, 880], sparseEvery: [5, 11], sparseGain: 0.014,
  },
  // 深夜：最沉——低根音 + 纯五度（凌晨三点的重量）
  night: {
    root: 98, partials: [1, 1.5], padGain: 0.03,
    sparsePool: [440, 523.25, 587.33, 659.25], sparseEvery: [3, 8], sparseGain: 0.014,
  },
  // 结局：近乎停止——只有一根线（一切归于平）
  ending: {
    root: 87.31, partials: [1, 2], padGain: 0.032,
    sparsePool: [523.25, 659.25], sparseEvery: [7, 14], sparseGain: 0.012,
  },
};

let currentAmbient: AmbientId = 'none';
let currentMusicTarget = 0.32; // 音乐层目标音量（setMuted 用）
let ambientNodes: { oscillators: OscillatorNode[]; gain: GainNode; timers: number[] } | null = null;
/** 解除静音时音乐层的目标 gain（0.32 ≈ pad 0.03 × 10 的总线感）。 */
const MUSIC_LEVEL = 0.32;

function stopAmbient(fadeSec = 1.2) {
  const a = ac();
  if (!ambientNodes) return;
  const { oscillators, gain, timers } = ambientNodes;
  timers.forEach((t) => window.clearTimeout(t));
  if (a) {
    gain.gain.cancelScheduledValues(a.currentTime);
    gain.gain.setTargetAtTime(0, a.currentTime, fadeSec / 3);
    oscillators.forEach((o) => { try { o.stop(a.currentTime + fadeSec + 0.1); } catch { /* already stopped */ } });
  }
  ambientNodes = null;
}

/** 切换环境音景（crossfade）。App 层按 phase/标题/结局调用；重复 set 同态是 no-op。 */
export function setAmbient(id: AmbientId) {
  const a = ac();
  if (!a) return;
  if (currentAmbient === id) return;
  currentAmbient = id;
  // 先淡出旧的
  stopAmbient(1.2);
  if (id === 'none') return;

  const spec = AMBIENTS[id];
  const gain = a.createGain();
  gain.gain.value = 0;
  gain.connect(musicGain!);
  // 音乐层总 gain 拉到目标（首次 / 解除静音后）
  musicGain!.gain.cancelScheduledValues(a.currentTime);
  musicGain!.gain.setTargetAtTime(muted ? 0 : MUSIC_LEVEL, a.currentTime, 0.5);

  const oscillators: OscillatorNode[] = [];
  // pad：根音 + 泛音簇，轻微 detune 让它"呼吸"
  for (const p of spec.partials) {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = 'sine';
    osc.frequency.value = spec.root * p;
    osc.detune.value = (Math.random() - 0.5) * 7; // 微失谐——合成 pad 不"死"
    g.gain.value = spec.padGain / spec.partials.length / p; // 高泛音更轻
    osc.connect(g).connect(gain);
    osc.start();
    oscillators.push(osc);
    // 极慢 LFO 调制音量（呼吸感，周期 ~13s）
    const lfo = a.createOscillator();
    const lfoGain = a.createGain();
    lfo.frequency.value = 0.075 + Math.random() * 0.02;
    lfoGain.gain.value = spec.padGain * 0.3;
    lfo.connect(lfoGain).connect(g.gain);
    lfo.start();
    oscillators.push(lfo);
  }
  gain.gain.setTargetAtTime(1, a.currentTime, 0.6); // crossfade in

  // 稀疏音：随机间隔从五声池里掉一个音出来（长衰减 sine，像远处的钢琴）
  const timers: number[] = [];
  const scheduleNext = () => {
    if (currentAmbient !== id) return;
    const wait = spec.sparseEvery[0] + Math.random() * (spec.sparseEvery[1] - spec.sparseEvery[0]);
    timers.push(window.setTimeout(() => {
      if (currentAmbient !== id || !ctx) return;
      const f = spec.sparsePool[Math.floor(Math.random() * spec.sparsePool.length)];
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(spec.sparseGain, ctx.currentTime + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);
      osc.connect(g).connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 3.7);
      scheduleNext();
    }, wait * 1000));
  };
  scheduleNext();

  ambientNodes = { oscillators, gain, timers };
}

/** 当前环境态（App 层幂等切换用）。 */
export function currentAmbientId(): AmbientId {
  return currentAmbient;
}
