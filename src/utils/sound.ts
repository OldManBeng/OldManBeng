/**
 * Web Audio 合成音效 + 环境音乐（GL2 模式，零音频文件）。
 *
 * v4.14 架构三层：
 * 1. 音色层——noise burst / 滤波 / 衰减包络，让 7 个基础 SFX 有"质感"
 * 2. 音乐层——独立 BGM（和弦进行+琶音，按场景 crossfade），与音效独立开关
 * 3. 场景层——打字机/晨钟/朋友圈/人设切换等交互补齐。
 *
 * 静音偏好独立两条：beng_muted（音效）、beng_music_muted（音乐）。
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
  // v4.14：静音只关音效，BGM 由 setMusicMuted 独立控制
}
export function isMuted() {
  return muted;
}
export function loadMutePref() {
  try { muted = localStorage.getItem('beng_muted') === '1'; } catch { /* ok */ }
  try { musicMuted = localStorage.getItem('beng_music_muted') === '1'; } catch { /* ok */ }
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
// v4.14 独立音乐系统——真正的旋律性 BGM（零音频文件）
// 与音效系统独立开关（beng_music_muted），标题屏两个按钮分别控制。
// ---------------------------------------------------------------------------

let musicMuted = false;

/** 音乐静音偏好（与音效静音独立）。 */
export function setMusicMuted(v: boolean) {
  musicMuted = v;
  try { localStorage.setItem('beng_music_muted', v ? '1' : '0'); } catch { /* ok */ }
  // 立即静音/恢复 BGM
  if (v) stopBgm();
  else if (currentBgm !== 'none') startBgm(currentBgm);
}
export function isMusicMuted(): boolean { return musicMuted; }
export function loadMusicMutePref() {
  try { musicMuted = localStorage.getItem('beng_music_muted') === '1'; } catch { /* ok */ }
}

export type MusicId = 'none' | 'title' | 'morning' | 'night' | 'ending';

type Chord = number[]; // 频率数组（Hz）

/** 和弦进行（每个 BGM 场景 4 和弦，每和弦 4 拍 ~3s → ~12s 循环 × 柔和包络）。 */
const BGM: Record<Exclude<MusicId, 'none'>, {
  chords: Chord[];
  bpm: number;
  arpPattern: number[];  // 琶音踩拍偏移 [0, 0.5, 1, 0.75] 等
  arpGain: number;
  padPartials: number[];
  padGain: number;
}> = {
  // 标题屏：Cmaj7 → Am7 → Fmaj7 → G——夜色、城市、孤独的旋律线
  title: {
    bpm: 68,
    chords: [
      [261.63, 329.63, 392, 493.88],   // Cmaj7
      [220, 261.63, 329.63, 440],       // Am7
      [174.61, 220, 261.63, 349.23],   // Fmaj7
      [196, 246.94, 293.66, 392],       // G
    ],
    arpPattern: [0, 0.33, 0.67, 0.17, 0.5, 0.83],
    arpGain: 0.04,
    padPartials: [1, 1.5, 2],
    padGain: 0.018,
  },
  // 白天：G → D → Em → C——晨光、暖意、向前走
  morning: {
    bpm: 72,
    chords: [
      [196, 246.94, 293.66, 392],       // G
      [146.83, 185, 220, 293.66],       // D
      [164.81, 196, 246.94, 329.63],    // Em
      [261.63, 329.63, 392, 523.25],    // C
    ],
    arpPattern: [0, 0.25, 0.5, 0.75, 0.125, 0.375, 0.625],
    arpGain: 0.035,
    padPartials: [1, 1.26, 1.5],
    padGain: 0.014,
  },
  // 深夜：Am → F → C → G——凌晨三点的重量、他的故事、她的手机屏
  night: {
    bpm: 64,
    chords: [
      [220, 261.63, 329.63, 440],       // Am
      [174.61, 220, 261.63, 349.23],   // Fmaj7
      [261.63, 329.63, 392, 523.25],    // C
      [196, 246.94, 293.66, 392],       // G
    ],
    arpPattern: [0, 0.5, 0.25, 0.75, 0.125, 0.625],
    arpGain: 0.038,
    padPartials: [1, 1.5],
    padGain: 0.02,
  },
  // 结局：C → G/B → Am → F → C/G → F——结束、收线、放下
  ending: {
    bpm: 58,
    chords: [
      [261.63, 329.63, 392, 523.25],    // C
      [246.94, 293.66, 349.23, 493.88], // G/B
      [220, 261.63, 329.63, 440],       // Am
      [174.61, 220, 261.63, 349.23],   // F
      [261.63, 329.63, 392, 493.88],   // C/G (cmaj7 第二转位)
      [174.61, 220, 261.63, 349.23],   // F
    ],
    arpPattern: [0, 0.33, 0.67, 0.17, 0.5, 0.83],
    arpGain: 0.032,
    padPartials: [1, 2],
    padGain: 0.022,
  },
};

let currentBgm: MusicId = 'none';
let bgmNodes: { oscillators: OscillatorNode[]; timers: number[]; gain: GainNode } | null = null;

/** 停止 BGM（即用）。 */
function stopBgm() {
  if (!bgmNodes) return;
  const { oscillators, timers, gain } = bgmNodes;
  timers.forEach((t) => window.clearTimeout(t));
  const a = ac();
  if (a) {
    gain.gain.setTargetAtTime(0, a.currentTime, 0.15);
    oscillators.forEach((o) => { try { o.stop(a.currentTime + 0.5); } catch { /* ok */ } });
  }
  bgmNodes = null;
}

/** 启动 BGM 循环（分解和弦琶音 + pad）。音乐静音时静默。 */
function startBgm(id: Exclude<MusicId, 'none'>) {
  const a = ac();
  if (!a || musicMuted) return;
  stopBgm();

  const spec = BGM[id];
  const busGain = a.createGain();
  busGain.gain.value = 1;
  busGain.connect(masterGain!);

  const oscillators: OscillatorNode[] = [];
  const timers: number[] = [];

  // Pad: 根音 + 泛音簇持续（与旧 ambient pad 结构相同但走独立 bus）
  for (const p of spec.padPartials) {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = 'sine';
    osc.frequency.value = spec.chords[0][0] * p; // 用第一和弦根音
    osc.detune.value = (Math.random() - 0.5) * 6;
    g.gain.value = spec.padGain / spec.padPartials.length / p;
    osc.connect(g).connect(busGain);
    osc.start();
    oscillators.push(osc);
    // 极慢 LFO 呼吸
    const lfo = a.createOscillator();
    const lfoG = a.createGain();
    lfo.frequency.value = 0.07 + Math.random() * 0.015;
    lfoG.gain.value = spec.padGain * 0.35;
    lfo.connect(lfoG).connect(g.gain);
    lfo.start();
    oscillators.push(lfo);
  }

  // 琶音循环：和弦进行 × 拍子 × 分解模式
  const beatSec = 60 / spec.bpm;
  const chordLen = 4; // 每和弦 4 拍
  const beatOffsets = spec.arpPattern;
  let chordIdx = 0;

  const scheduleLoop = () => {
    if (currentBgm !== id || !ctx) return;
    const chord = spec.chords[chordIdx];
    const t0 = ctx.currentTime;

    // 这个和弦持续期内的所有琶音
    for (let beat = 0; beat < chordLen; beat++) {
      for (const offset of beatOffsets) {
        const t = t0 + beat * beatSec + offset * beatSec;
        const freq = chord[Math.floor(offset * chord.length) % chord.length];
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle'; // 温暖音色
        osc.frequency.value = freq + (Math.random() - 0.5) * 2; // 微 detune 不机器
        // 包络：Attack 30ms → Sustain → Release
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(spec.arpGain, t + 0.03);
        g.gain.setTargetAtTime(spec.arpGain * 0.6, t + 0.1, 0.12);

        // 该音符持续到下一拍
        g.gain.setTargetAtTime(0.0001, t + beatSec * 1.2, 0.04);

        osc.connect(g).connect(busGain);
        osc.start(t);
        osc.stop(t + beatSec * 1.5);
        oscillators.push(osc);
      }
    }

    // 切换下一个和弦
    chordIdx = (chordIdx + 1) % spec.chords.length;
    // 安排在 chordLen 拍后触发下一轮
    timers.push(window.setTimeout(scheduleLoop, chordLen * beatSec * 1000));
  };
  scheduleLoop();

  bgmNodes = { oscillators, timers, gain: busGain };
}

/** 切换 BGM（crossfade transition）。App 层按 phase 调用。 */
export function setBgm(id: MusicId) {
  if (id === currentBgm) return;
  stopBgm();
  currentBgm = id;
  if (id !== 'none') startBgm(id);
}

export function currentBgmId(): MusicId { return currentBgm; }
export function isBgmPlaying(): boolean { return currentBgm !== 'none' && !musicMuted && bgmNodes !== null; }
