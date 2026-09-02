/** Web Audio synthesized SFX (GL2 pattern, zero audio files). */
let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem('beng_muted', v ? '1' : '0'); } catch { /* ok */ }
}
export function isMuted(): boolean {
  return muted;
}
export function loadMutePref() {
  try { muted = localStorage.getItem('beng_muted') === '1'; } catch { /* ok */ }
}

function tone(freq: number, dur: number, delay = 0, type: OscillatorType = 'sine', gain = 0.08) {
  const a = ac();
  if (!a || muted) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + delay);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + delay + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + delay + dur);
  osc.connect(g).connect(a.destination);
  osc.start(a.currentTime + delay);
  osc.stop(a.currentTime + delay + dur + 0.05);
}

/** A message arrives from him. */
export function playMessage() { tone(660, 0.12, 0, 'sine', 0.05); tone(880, 0.1, 0.08); }
/** She sends a reply — softer. */
export function playSend() { tone(520, 0.08, 0, 'sine', 0.04); }
/** Red packet lands. Two-note coin, warm major third. */
export function playPacket() { tone(784, 0.12, 0); tone(988, 0.16, 0.07); tone(1319, 0.2, 0.14, 'sine', 0.06); }
/** Ask refused — descending minor. */
export function playFail() { tone(392, 0.18, 0, 'triangle'); tone(311, 0.25, 0.14, 'triangle'); }
/** Blocked — hollow thud. */
export function playBlocked() { tone(140, 0.4, 0, 'sawtooth', 0.05); }
/** New day starts. */
export function playMorning() { tone(523, 0.1, 0, 'sine', 0.04); tone(659, 0.12, 0.09, 'sine', 0.04); }
/** Ending chord. */
export function playEnding() {
  tone(523, 0.5, 0, 'sine', 0.05); tone(659, 0.5, 0.06); tone(784, 0.7, 0.12);
}
