import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { PERSONAS } from '../data/personas';
import { isMuted, loadMutePref, setMuted } from '../utils/sound';
import { formatMoney } from '../utils/format';
import { MONTHLY_GOAL as GOAL } from '../data/constants';
import type { PersonaId } from '../types/persona';
import { PersonaAvatar } from './character-art';

export function TitleScreen() {
  const store = useGame();
  const [muted, setM] = useState(isMuted());
  useEffect(() => { loadMutePref(); setM(isMuted()); }, []);
  const hasSave = store.hasSave();

  return (
    <div className="screen title-screen">
      <div className="title-block">
        <h1>凌晨三点，哥哥</h1>
        <p className="subtitle">一个关于「崩老头」的游戏</p>
      </div>
      <div className="title-buttons">
        {hasSave && (
          <button
            className="btn primary"
            onClick={() => {
              store.load();
            }}
          >
            继续那一晚
          </button>
        )}
        <button
          className="btn"
          onClick={() => {
            // Go to newGame screen via a lightweight local state in App.
            window.dispatchEvent(new CustomEvent('beng:newgame'));
          }}
        >
          新的一晚
        </button>
        <button className="btn small" onClick={() => { const v = !muted; setMuted(v); setM(v); }}>
          {muted ? '🔇 音效关' : '🔊 音效开'}
        </button>
      </div>
      <div className="content-warning">
        <p><strong>内容提示</strong></p>
        <p>本游戏涉及：孤独、情感操纵、网络诈骗、经济压力等主题。</p>
        <p>游戏中所有角色、话术均为虚构的艺术抽象，不构成任何可操作的指引。</p>
        <p>如果你正在经历类似的困境——无论是孤独还是债务——请寻求身边真实的帮助。</p>
        <p className="muted small">原型来自2025年流行的网络现象「崩老头」。它不是玩笑。</p>
      </div>
    </div>
  );
}

export function NewGameScreen({ onStart }: { onStart: (name: string, personaId: PersonaId) => void }) {
  const [name, setName] = useState('小满');
  const [persona, setPersona] = useState<PersonaId>('wise_sister');
  return (
    <div className="screen newgame-screen">
      <h2>你打算叫他什么</h2>
      <label className="field">
        <span>你的名字（网上的）</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={12} />
      </label>
      <h3>你的头像是什么样</h3>
      <div className="persona-grid">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            className={`persona-card ${persona === p.id ? 'selected' : ''}`}
            onClick={() => setPersona(p.id)}
          >
            <PersonaAvatar personaId={p.id} size={56} />
            <div className="persona-name">{p.name}</div>
            <div className="persona-tag">{p.tagline}</div>
            <div className="persona-bio">{p.bio}</div>
          </button>
        ))}
      </div>
      <p className="muted small">人设决定了他吃哪一套。选错了，你的每一句晚安都像诈骗。</p>
      <div className="newgame-start">
        <button className="btn primary" onClick={() => onStart(name || '小满', persona)}>
          开始这个月
        </button>
      </div>
      <p className="muted small">
        这个月你要凑出 <strong>{formatMoney(GOAL)}</strong>——网贷下月就到期了。
        通讯录里躺着五个人：深夜的司机、上午的老师、凌晨的老板、网吧的阿豪、画图纸的陈工。
        同时崩的越多，钱来得越快——穿帮也来得越快。
      </p>
    </div>
  );
}
