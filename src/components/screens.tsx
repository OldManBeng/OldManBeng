import { useEffect, useState } from 'react';
import { useGame } from '../store/gameStore';
import { PERSONAS } from '../data/personas';
import { isMuted, loadMutePref, setMuted, isMusicMuted, setMusicMuted } from '../utils/sound';
import { formatMoney } from '../utils/format';
import { MONTHLY_GOAL as GOAL } from '../data/constants';
import type { PersonaId } from '../types/persona';
import { PersonaAvatar } from './character-art';
import { Ico } from './icons';
import { PROLOGUE_GATHAS } from '../data/gathas';
import { GathaBlock } from './gatha-block';

/** v3.0 标题屏背景：凌晨三点的城市天际线——月亮、星、楼影、几扇还没睡的窗。 */
function TitleBackdrop() {
  return (
    <div className="title-backdrop" aria-hidden>
      <svg viewBox="0 0 480 800" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="tbSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1020" />
            <stop offset="62%" stopColor="#0c1524" />
            <stop offset="100%" stopColor="#060a10" />
          </linearGradient>
          <radialGradient id="tbMoonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8e4d0" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#e8e4d0" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#e8e4d0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="480" height="800" fill="url(#tbSky)" />
        {/* 月亮 + 月晕 */}
        <circle cx="368" cy="118" r="86" fill="url(#tbMoonGlow)" className="title-moon" />
        <circle cx="368" cy="118" r="34" fill="#e8e4d0" opacity="0.85" className="title-moon" />
        <circle cx="356" cy="108" r="5" fill="#c9c8b8" opacity="0.35" />
        <circle cx="378" cy="128" r="3.4" fill="#c9c8b8" opacity="0.3" />
        {/* 星 */}
        {[[44, 92], [110, 60], [180, 130], [262, 78], [320, 200], [80, 210], [420, 240], [30, 320]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 1} fill="#e8e4d0" opacity={0.35 + (i % 3) * 0.18} className={i % 2 ? 'title-win w2' : 'title-win'} />
        ))}
        {/* 远景楼影 */}
        <g fill="#0b1220">
          <rect x="0" y="430" width="70" height="370" />
          <rect x="58" y="470" width="56" height="330" />
          <rect x="330" y="452" width="66" height="348" />
          <rect x="404" y="500" width="76" height="300" />
        </g>
        {/* 近景楼群（带窗灯，三扇会呼吸） */}
        <g fill="#0e1523">
          <rect x="120" y="392" width="88" height="408" />
          <rect x="208" y="452" width="72" height="348" />
          <rect x="276" y="416" width="60" height="384" />
        </g>
        <g>
          {[[136, 412], [160, 440], [188, 412], [136, 470], [176, 502], [222, 470], [246, 540], [292, 436], [292, 500], [208, 560]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="9" height="6.4" rx="0.8" fill={i % 3 === 0 ? '#e8b45c' : '#f4d03f'}
              opacity={i % 4 === 0 ? 0.5 : 0.8} className={i % 5 === 2 ? 'title-win' : i % 5 === 4 ? 'title-win w2' : i % 7 === 3 ? 'title-win w3' : ''} />
          ))}
        </g>
        {/* 地平线灯带雾光 */}
        <rect x="0" y="760" width="480" height="40" fill="#e8b45c" opacity="0.04" />
        <rect x="0" y="796" width="480" height="4" fill="#f4d03f" opacity="0.08" />
      </svg>
    </div>
  );
}

export function TitleScreen() {
  const store = useGame();
  const [muted, setM] = useState(isMuted());
  const [musicMuted, setMM] = useState(isMusicMuted());
  const [ageOk, setAgeOk] = useState(false);
  useEffect(() => {
    loadMutePref();
    setM(isMuted());
    setMM(isMusicMuted());
    // v4.3.1 年龄门槛（审查 P0-2）：18+ 确认记在 localStorage，二周目免打断。
    try { if (localStorage.getItem('beng:age_ok') === '1') setAgeOk(true); } catch { /* 隐私模式忽略 */ }
  }, []);
  const confirmAge = () => {
    setAgeOk(true);
    try { localStorage.setItem('beng:age_ok', '1'); } catch { /* 隐私模式忽略 */ }
  };
  const hasSave = store.hasSave();

  return (
    <div className="screen title-screen">
      <TitleBackdrop />
      <div className="title-block">
        <h1>情感反诈模拟器</h1>
        <p className="subtitle">原名《凌晨三点，哥哥》 · 一个关于「崩老头」的游戏</p>
      </div>
      <div className="title-buttons">
        {!ageOk && (
          <button className="btn primary" onClick={confirmAge}>
            我已满 18 岁，我知道这是虚构作品
          </button>
        )}
        {ageOk && hasSave && (
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
          disabled={!ageOk}
          onClick={() => {
            // Go to newGame screen via a lightweight local state in App.
            window.dispatchEvent(new CustomEvent('beng:newgame'));
          }}
        >
          新的一晚
        </button>
        <button className="btn small" onClick={() => { const v = !muted; setMuted(v); setM(v); }}>
          <Ico name={muted ? 'spk-off' : 'spk-on'} size={14} /> {muted ? '音效关' : '音效开'}
        </button>
        <button className="btn small" onClick={() => { const v = !musicMuted; setMusicMuted(v); setMM(v); }}>
          <Ico name={musicMuted ? 'spk-off' : 'spk-on'} size={14} /> {musicMuted ? '音乐关' : '音乐开'}
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
            {p.passiveNote && <div className="persona-passive">{p.passiveNote}</div>}
            {p.hook && <div className="persona-hook">剧情 · {p.hook}</div>}
            {p.risk && <div className="persona-risk">代价 · {p.risk}</div>}
          </button>
        ))}
      </div>
      <p className="muted small">人设决定他跟你走哪条故事线、吃哪一套话。选错了，你的每一句晚安都像诈骗。</p>
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

// ---------------------------------------------------------------------------
// v2.2 序章——游戏开始前交代：这个现象是什么、她是谁、她为什么做这个。
// ---------------------------------------------------------------------------
const PROLOGUE_PAGES: { title: string; body: string[] }[] = [
  {
    title: '序章 · 一',
    body: [
      '2025年，网上流行一个词，叫「崩老头」。',
      '不是黑话里的暴力，是另一种东西：年轻人在聊天软件上扮成温柔的女性，接近深夜睡不着的中老年男人，叫他们「哥哥」，听他们说话，然后，在恰当的时候开口——红包、话费、路费、生日礼物。',
      '老哥们管这叫「网恋」。派出所管这叫「诈骗」。评论区管这叫「活该」。',
      '只有当事人知道，那叫什么——一个收车后没人等他回家的司机，一个挂钟比人声还响的退休教师，一个只能在车库里抽完那支烟的老板。',
      '凌晨三点，他们都醒着。',
    ],
  },
  {
    title: '序章 · 二',
    body: [
      '她今年二十四。县城出来的，大专毕业，在这座城市做着一份四千块的工作。',
      '工资六号发，房租一号交，中间的日子靠花呗。半年前母亲住院，她在手机上点了几下，点了三万块出来。',
      '网贷的短信比任何人都准时。这个月的账单是三千，她的余额是三百五。',
      '她不是天生干这个的。她的第一份工作是幼儿园保育员，孩子哭了她会跟着掉眼泪。',
      '只是数字不认眼泪。三千块的月供，四千块的工资，房租一扣，这道算术题怎么算都算不平。',
    ],
  },
  {
    title: '序章 · 三',
    body: [
      '她学得很快。什么年纪的老头，几点在线，吃哪一套话——比上班学的任何东西都快。',
      '通讯录里躺着五个「哥哥」：深夜收车的司机，上午练字的老师，凌晨在车库抽烟的老板，网吧守夜的阿豪，画图纸的陈工。',
      '每个深夜，她切换身份，走进不同人的孤独。他们要的不是那种事——他们要的是有人问一句「今天累不累」。',
      '红包以各种名目流动：话费、束脩、生日的五百二、「给闺女买件外套」。',
      '同时崩的越多，钱来得越快。穿帮，也来得越快。',
    ],
  },
  {
    title: '序章 · 终',
    body: [
      '这个月，三十天，一千五百块。你来决定怎么凑。',
      '谁的钱可以拿，谁的钱碰不得，什么时候开口，什么时候收手——每个「哥哥」背后是一个真实的人生，你的每一次选择都在他们的晚年里留下刻痕。',
      '游戏里的每个人都是虚构的。但凌晨三点还亮着的那些头像，不是。',
      '——你现在可以开始了。',
    ],
  },
];

/** 序章：分页文字，读完进入建档（NewGameScreen）。 */
export function PrologueScreen({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const p = PROLOGUE_PAGES[page];
  const last = page === PROLOGUE_PAGES.length - 1;
  return (
    <div className="screen prologue-screen">
      <div className="prologue-block">
        <h2 className="prologue-title">{p.title}</h2>
        <div className="prologue-body">
          {p.body.map((t, i) => <p key={i}>{t}</p>)}
        </div>
        {/* v2.4 页脚偈——正文读完，偈语收音。 */}
        <GathaBlock gatha={PROLOGUE_GATHAS[page]} className="prologue-gatha" />
      </div>
      <div className="prologue-actions">
        <button className="btn small muted-btn" onClick={onDone}>跳过</button>
        {last ? (
          <button className="btn primary" onClick={onDone}>进入这个月</button>
        ) : (
          <button className="btn primary" onClick={() => setPage(page + 1)}>继续</button>
        )}
      </div>
      <p className="muted small center">{page + 1} / {PROLOGUE_PAGES.length}</p>
    </div>
  );
}
