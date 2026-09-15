/**
 * 常用手机 —— 舒适圈（第二阶段 1.1.0）。
 *
 * 暖色系另一套界面：素颜的小满、妈、同居男友。和工作手机同一根时间轴，
 * 但这里没有精力、没有警惕、没有话术——聊天不耗体力，钱不带代价字幕。
 * 五个菜单与工作手机同名不同套：今天/通讯录/朋友圈/聊天记录/钱包。
 *
 * 叙事锚点：家人的温情关怀 vs 工作手机的冷漠算计——
 * 镜像行、对照旁白、钱包的两本账，全部落在界面上。
 */
import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/format';
import { ComfortAvatar, ComfortSceneRender, type ComfortAvatarKey } from './comfort-art';
import { Ico, type IconName } from './icons';
import { playMessage, playSend, playMoney, playTab, playBlocked, playPost, playSocial, playMorning } from '../utils/sound';
import { COMFORT_CONTACTS, COMFORT_DAY_MINUTES, COMFORT_CHAT_MINUTES, FATHER_MEMORIAL, XIAOMAN } from '../data/comfort';
import { MIRROR_LINES, WALLET_CONTRAST } from '../data/comfort-contrast';
import { STORY_BEATS, STORY_OPEN_LABEL } from '../data/comfort-story';
import { BLIND_DATES, BLIND_DATE_MAP } from '../data/comfort-dates';
import { COMFORT_MORNING_LINES } from '../data/comfort-packs';
import { COMFORT_INCIDENTS, DAILY_VERSES } from '../data/comfort-incidents';
import { myMomentCommentOptions } from '../engine/comfort';
import type { ComfortContactId, ComfortMessage, ComfortSpeakerId } from '../types/comfort';

/** 说话人显示名：联系人 / 叙事位 / 相亲对象统一入口。 */
function speakerName(id: ComfortSpeakerId): string {
  if (id === 'sys') return '消息';
  if (id.startsWith('bd:')) return BLIND_DATE_MAP[id.slice(3)]?.handle ?? id;
  return COMFORT_CONTACTS[id as ComfortContactId].handle;
}

/** 说话人头像 key：bd:{id} 直接透传给 ComfortAvatar（PNG 优先，首字兜底）。 */
function speakerAvatar(id: ComfortSpeakerId): ComfortAvatarKey | undefined {
  if (id === 'mother' || id === 'boyfriend' || id === 'auntie' || id === 'bestie') return id;
  if (id.startsWith('bd:')) return id as `bd:${string}`;
  return undefined;
}

type ComfortTab = 'today' | 'contacts' | 'moments' | 'history' | 'wallet';

/** 舒适圈导航图标——与主线 NavIcon 同源口径：fill:none / stroke:currentColor / 1.6 / 圆头圆角。 */
function ComfortNavIcon({ name }: { name: ComfortTab }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'today': // 日出——温情的那部手机，一天从暖光开始
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <path d="M 4 14.5 Q 6.8 11.8 10 11.8 Q 13.2 11.8 16 14.5" />
          <path d="M 2.5 14.5 L 17.5 14.5 M 10 11.8 L 10 9.2" />
          <path d="M 5.6 7.4 L 6.8 8.6 M 14.4 7.4 L 13.2 8.6 M 3.2 11 L 4.8 11.8 M 16.8 11 L 15.2 11.8" />
        </svg>
      );
    case 'contacts': // 通讯录——两个挨着的头像位（妈和阿凯，爸在置灰位）
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <circle cx="6.8" cy="6.4" r="3" />
          <path d="M 1.8 16.4 Q 2.6 11.4 6.8 11.4 Q 8.4 11.4 9.5 12.1" />
          <circle cx="13.6" cy="7.4" r="2.5" />
          <path d="M 11.5 16.4 Q 12.2 12.4 13.6 12.4 Q 15 12.4 15.7 16.4" />
        </svg>
      );
    case 'moments': // 朋友圈——同主线花瓣风（镜头光圈 8 翅），暖色语境换相机快门
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <circle cx="10" cy="10" r="2.1" />
          <path d="M 10 3.2 Q 11.6 6.4 10 8 M 16.8 10 Q 13.6 11.6 12 10 M 10 16.8 Q 8.4 13.6 10 12 M 3.2 10 Q 6.4 8.4 8 10 M 14.8 5.2 Q 12.7 7.3 11.5 8.5 M 14.8 14.8 Q 12.7 12.7 11.5 11.5 M 5.2 14.8 Q 7.3 12.7 8.5 11.5 M 5.2 5.2 Q 7.3 7.3 8.5 8.5" />
        </svg>
      );
    case 'history': // 聊天记录——话机式对话泡（语音条所在的那部）
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <path d="M 3.5 8.6 Q 3.5 4.8 10 4.8 Q 16.5 4.8 16.5 8.6 Q 16.5 12.4 10 12.4 Q 8.9 12.4 7.8 12.2 L 5 14.4 L 5.5 12 Q 3.5 10.9 3.5 8.6 Z" />
          <circle cx="7.1" cy="8.6" r="0.5" fill="currentColor" stroke="none" />
          <circle cx="10" cy="8.6" r="0.5" fill="currentColor" stroke="none" />
          <circle cx="12.9" cy="8.6" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'wallet': // 钱包——同主线卡式（two-card 插角），温情里的两本账
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <rect x="3" y="5.4" width="14" height="10.4" rx="2" />
          <path d="M 3 8.2 L 17 8.2 M 13.2 12.2 L 14.8 12.2" />
        </svg>
      );
  }
}

const REL_LABEL = (v: number) => (v >= 75 ? '很亲' : v >= 50 ? '还行' : v >= 30 ? '有点淡了' : '快凉透了');

/** 微信式语音条 + 下方真文字——熟人全靠语音，文字是玩家可见的译文。 */
function VoiceBubble({ m, name, who }: { m: ComfortMessage; name?: string; who?: ComfortAvatarKey }) {
  if (m.speaker === 'sys') {
    return (
      <div className="cbubble-sys">
        {m.label && <div className="cbubble-sys-label">{m.label}</div>}
        <div>{m.text}</div>
      </div>
    );
  }
  if (m.speaker === 'narrator') {
    return (
      <div className="cbubble-narrator">{m.text}</div>
    );
  }
  return (
    <div className={`cbubble-row ${m.speaker}`}>
      {m.speaker === 'them' && (who ? <span className="cbubble-ava"><ComfortAvatar who={who} size={30} /></span> : <span className="cbubble-ava">{(name ?? '他')[0]}</span>)}
      <div className={`cbubble ${m.speaker}`}>
        {m.voiceSecs !== undefined && (
          <div className="voice-bar" title="语音消息（点不出声音——这只是一部游戏里的手机）">
            <span className="voice-tri" />
            <span className="voice-wave"><i /><i /><i /><i /><i /></span>
            <span className="voice-secs">{m.voiceSecs}″</span>
          </div>
        )}
        {m.text && <div className="cbubble-text">{m.text}</div>}
      </div>
    </div>
  );
}

/** 「开始今天」：常用手机版的晨间简报（v1.0.0 的 DayBriefingModal 同构）。
 *  日期 pop → 晨线一句 → 余额格 → 昨日回响逐行浮现（昨日事件⚡行）→ 今日突发事件决策卡 → 第一天的规矩 → 经文 → 开始今天。
 *  昨日回响直接从 log 组装（comfort 条目），不在 state 里重复存文案。 */
function ComfortDayDialog() {
  const store = useGame();
  const { state } = store;
  const c = state.comfort;
  const morningLine = COMFORT_MORNING_LINES[(state.day - 1) % COMFORT_MORNING_LINES.length];
  // 每日经文（工作手机敲佛偈，常用手机读经文——同一双手，各念各的经）
  const verse = DAILY_VERSES[(state.day - 1) % DAILY_VERSES.length];
  const firstDay = state.day === 1;
  // 昨天这部手机上发生的一切（同工作手机的账单/事件行）：直接从 log 组装，
  // 去掉「常用手机 ·」前缀与事件经文行。
  const yesterday = state.day > 1
    ? state.log
        .filter((l) => l.kind === 'comfort' && l.day === state.day - 1)
        .map((l) => ({ text: l.details.replace(/^常用手机 · /, ''), line: l.line ?? '' }))
    : [];
  // 突发事件单独成行（v1.0.0 的「今天出事了」⚡ 行同构）：不挤回响池——
  // 就算被一晚上的聊天淹没，第二天早上也要单独交代一句。
  const isIncidentRow = (t: string) => COMFORT_INCIDENTS.some((i) => t.startsWith(`${i.title}——`));
  const incidentRows = yesterday.filter((r) => isIncidentRow(r.text));
  const yesterdayRows = yesterday
    .map((r) => r.text)
    .filter((t) => t && !t.startsWith('「') && !isIncidentRow(t))
    .slice(-3);
  // 回响行图标：钱事 → 现金，朋友圈 → 心，其余 → 对话泡
  const icoOf = (t: string): IconName =>
    /元|红包|转账|拿走/.test(t) ? 'cash' : t.includes('朋友圈') ? 'heart' : 'chat';
  // 余额格（工作手机的余额三格同构）：钱两机共用；关系是暖色系里的"风险条"
  const bfNormal = c.bfState === 'normal' && !c.blockedByBf;
  const moneyCells: { label: string; value: string; sub?: string }[] = [
    { label: '活命钱', value: formatMoney(state.money), sub: '（两机共用）' },
    { label: '还差', value: formatMoney(Math.max(0, state.goal - state.stats.totalEarned)), sub: '（债）' },
    { label: '家庭', value: String(Math.round(c.family)) },
    ...(bfNormal ? [{ label: '感情', value: String(Math.round(c.love)) }] : []),
  ];
  const step = 150;
  const delay = (i: number) => `${300 + i * step}ms`;
  let rowIdx = 0;
  return (
    <div className="comfort-day-overlay">
      <div className="comfort-day-card">
        <div className="comfort-day-head">
          <span className="comfort-day-num">第 {state.day} 天</span>
          <span className="comfort-day-sub">常用手机 · 睁眼</span>
        </div>
        <p className="comfort-day-line cd-in" style={{ animationDelay: delay(rowIdx++) }}>{morningLine}</p>
        <div className="comfort-day-money cd-in" style={{ animationDelay: delay(rowIdx++), gridTemplateColumns: `repeat(${moneyCells.length}, 1fr)` }}>
          {moneyCells.map((cell) => (
            <div key={cell.label}>
              <span>{cell.label}</span>
              <strong>{cell.value}{cell.sub && <i className="hud-sub">{cell.sub}</i>}</strong>
            </div>
          ))}
        </div>
        {yesterdayRows.map((t) => {
          const i = rowIdx++;
          return (
            <div key={i} className="comfort-day-row" style={{ animationDelay: delay(i) }}>
              <span className="briefing-ico"><Ico name={icoOf(t)} size={20} /></span>
              <div className="comfort-day-row-body">
                <div className="comfort-day-row-label">昨天的手机</div>
                <div className="comfort-day-row-text">{t}</div>
              </div>
            </div>
          );
        })}
        {incidentRows.map((r, k) => {
          const i = rowIdx++;
          const dash = r.text.indexOf('——');
          const title = dash >= 0 ? r.text.slice(0, dash) : r.text;
          const outcome = dash >= 0 ? r.text.slice(dash + 2) : '';
          const segs = [outcome, r.line].filter(Boolean);
          return (
            <div key={`inc-${k}`} className="comfort-day-row comfort-day-row-incident" style={{ animationDelay: delay(i) }}>
              <span className="briefing-ico"><Ico name="bolt" size={20} /></span>
              <div className="comfort-day-row-body">
                <div className="comfort-day-row-label">昨天出事了 · {title}</div>
                {segs.map((seg, si) => (
                  <div key={si} className="comfort-day-row-text">{seg}</div>
                ))}
              </div>
            </div>
          );
        })}
        {/* 今天的突发事件（v1.0.0 简报里的决策卡同构）：弹窗里就能选，
            不选也不丢——进了今天，它还挂在主界面的事件栏里等。 */}
        {(() => {
          const inc = COMFORT_INCIDENTS.find((i) => i.id === c.pending);
          if (!inc) return null;
          return (
            <div className="beat-card comfort-incident cd-in" style={{ animationDelay: delay(rowIdx++) }}>
              <div className="beat-title"><Ico name="bolt" size={14} /> {inc.title}</div>
              <div className="beat-body">{inc.body}</div>
              <div className="beat-options">
                {inc.options.map((opt, i) => (
                  <button key={i} className="btn small beat-opt" onClick={() => { playMessage(); store.dispatch({ type: 'comfort_resolve_incident', optionIndex: i }); }}>
                    {opt.text}
                  </button>
                ))}
              </div>
              {inc.verse && <div className="comfort-incident-verse">「{inc.verse.v}」——{inc.verse.s}</div>}
              <p className="muted small">不接也行——拖到明天，就按「没接住」算。</p>
            </div>
          );
        })()}
        {firstDay && (
          <div className="comfort-day-rule cd-in" style={{ animationDelay: delay(rowIdx++) }}>
            <div className="comfort-day-rule-row"><span className="briefing-ico"><Ico name="clock" size={20} /></span>
              <div><div className="comfort-day-rule-label">一天的时长</div>
                <div>一天能匀给这部手机的时间只有 <b>40 分钟</b>。每一场对话，10 分钟——妈的、姨的、曼曼的、他的，都一样。时间花给谁，就是爱给了谁。</div>
              </div>
            </div>
            <div className="comfort-day-rule-row"><span className="briefing-ico"><Ico name="hourglass" size={20} /></span>
              <div><div className="comfort-day-rule-label">他的作息</div>
                <div>他白天睡觉，夜里活过来。这部手机上，<b>黑夜才是他的白天</b>。</div>
              </div>
            </div>
          </div>
        )}
        <div className="comfort-verse cd-in" style={{ animationDelay: delay(rowIdx++) }}>
          <div className="comfort-verse-text">「{verse.v}」</div>
          <div className="comfort-verse-src">——{verse.s}</div>
          <div className="comfort-verse-gloss">{verse.g}</div>
        </div>
        <button className="btn primary wide cd-in" style={{ animationDelay: delay(rowIdx + 0.4) }} onClick={() => { playMorning(); store.dispatch({ type: 'comfort_ack_day' }); }}>
          开始今天
        </button>
      </div>
    </div>
  );
}

export function ComfortScreen() {
  const store = useGame();
  const { state } = store;
  const c = state.comfort;
  const [tab, setTab] = useState<ComfortTab>('today');
  const scrollRef = useRef<HTMLDivElement>(null);
  const switchTab = (next: ComfortTab) => {
    if (tab !== next) playTab();
    setTab(next);
    if (next === 'moments') store.dispatch({ type: 'comfort_view_moments' });
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const policeToday = c.policeDay === state.day;
  const night = state.dayPhase === 'night';

  return (
    <div className={`screen main-screen app-shell comfort-theme ${night ? 'comfort-night' : ''} ${c.chat ? 'chat-mode' : ''} phone-flip-in phone-flip-r`} key={`comfort-flip-${c.flipTick}`}>
      {/* 「开始今天」：新的一天先过这道幕，才落进消息堆里 */}
      {c.dayAck < state.day && <ComfortDayDialog />}
      <header className="hud">
        <div className="hud-left">
          <span className="day-chip">第 {state.day}/{state.daysLimit} 天</span>
          <span className="comfort-phone-tag">常用手机 · 舒适圈{night ? ' · 夜' : ''}</span>
        </div>
        <div className="hud-right">
          <span className="money">活命钱 {formatMoney(state.money)}</span>
          <span className="goal">债 {formatMoney(Math.max(0, state.goal - state.stats.totalEarned))}<i className="hud-sub">（两机共用）</i></span>
        </div>
      </header>

      {/* 关系条：家庭/感情——常用手机的"风险条"是暖色的 */}
      <div className="comfort-rel-strip">
        <span>家庭 {Math.round(c.family)} · {REL_LABEL(c.family)}</span>
        <span className="comfort-rel-meter"><i style={{ width: `${c.family}%` }} /></span>
        {c.bfState === 'normal' && !c.blockedByBf ? (
          <>
            <span>感情 {Math.round(c.love)} · {REL_LABEL(c.love)}</span>
            <span className="comfort-rel-meter love"><i style={{ width: `${c.love}%` }} /></span>
          </>
        ) : (
          <span className="comfort-rel-broken">阿凯 · 已拉黑（分手）</span>
        )}
      </div>

      {c.chat && <ComfortChatView />}

      {!c.chat && (
        <>
          <div className="app-scroll" ref={scrollRef}>
            {tab === 'today' && <ComfortToday policeToday={policeToday} />}
            {tab === 'contacts' && <ComfortContacts />}
            {tab === 'moments' && <ComfortMoments />}
            {tab === 'history' && <ComfortHistory />}
            {tab === 'wallet' && <ComfortWallet />}
            <footer className="stats-row">
              <span>妈给过 {formatMoney(c.momGiven)}</span>
              <span>阿凯给过 {formatMoney(c.bfGiven)}</span>
              <span>阿凯拿走 {formatMoney(c.bfTaken)}</span>
            </footer>
          </div>

          <nav className="module-nav">
            <button className={tab === 'today' ? 'nav-btn on' : 'nav-btn'} onClick={() => switchTab('today')}>
              <span className="nav-ico"><ComfortNavIcon name="today" /></span>今天
              {c.incoming.length > 0 && <span className="nav-badge">{c.incoming.length}</span>}
            </button>
            <button className={tab === 'contacts' ? 'nav-btn on' : 'nav-btn'} onClick={() => switchTab('contacts')}>
              <span className="nav-ico"><ComfortNavIcon name="contacts" /></span>通讯录
            </button>
            <button className={tab === 'moments' ? 'nav-btn on' : 'nav-btn'} onClick={() => switchTab('moments')}>
              <span className="nav-ico"><ComfortNavIcon name="moments" /></span>朋友圈
              {c.unseenMoments > 0 && <span className="nav-badge">{c.unseenMoments}</span>}
            </button>
            <button className={tab === 'history' ? 'nav-btn on' : 'nav-btn'} onClick={() => switchTab('history')}>
              <span className="nav-ico"><ComfortNavIcon name="history" /></span>聊天记录
            </button>
            <button className={tab === 'wallet' ? 'nav-btn on' : 'nav-btn'} onClick={() => switchTab('wallet')}>
              <span className="nav-ico"><ComfortNavIcon name="wallet" /></span>钱包
            </button>
          </nav>
        </>
      )}
    </div>
  );
}

/** 「今天」：事件卡（要/不要、给/不给）+ 镜像行 + 熟人速聊 + 舒适圈事件流。
 *  1.1.x 时间制：一天 40 分钟联系时间（每场 −10′）；两段式日夜——天黑了 → 进入明天。 */
function ComfortToday({ policeToday }: { policeToday: boolean }) {
  const store = useGame();
  const { state } = store;
  const c = state.comfort;
  const mirror = MIRROR_LINES[state.day % MIRROR_LINES.length];
  const comfortLog = state.log.filter((l) => l.kind === 'comfort').slice(-8).reverse();
  const nameOf = (id: ComfortContactId) => COMFORT_CONTACTS[id].handle;
  const night = state.dayPhase === 'night';
  const timeLeft = c.minutes >= COMFORT_CHAT_MINUTES;
  /** 这个人现在能不能开口说话：别人白天，阿凯夜里；时间不足谁也叫不醒。 */
  const canTalk = (id: ComfortContactId) => (id === 'boyfriend' ? night : !night) && timeLeft;
  const talkHint = (id: ComfortContactId) => {
    if (canTalk(id)) return `一场 ${COMFORT_CHAT_MINUTES} 分钟`;
    if (id === 'boyfriend') return night ? '今天的时间用完了' : '他这会儿在补觉——黑夜才是他的白天';
    return !night ? `一场 ${COMFORT_CHAT_MINUTES} 分钟` : '这个点睡了，明天再聊';
  };

  return (
    <section className="comfort-today">
      {/* 素颜的她——名字就是全部说明，别的话让故事自己讲 */}
      <div className="persona-row">
        <ComfortAvatar who="xiaoman" size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="persona-line">
            {state.playerName || XIAOMAN.name} · 常用手机
            {/* 切回工作手机——入口跟人设行走，描边胶囊与工作手机侧「切换常用手机」同款框 */}
            <button
              className="persona-change-btn comfort-switch-chip"
              onClick={() => { playTab(); store.dispatch({ type: 'switch_phone' }); }}
            >
              切回工作手机
            </button>
          </div>
          <div className="bars" style={{ margin: '5px 0 0' }}>
            <div className="bar minutes"><span style={{ width: `${(c.minutes / COMFORT_DAY_MINUTES) * 100}%` }} />今日空闲时间 {c.minutes}′（一场 {COMFORT_CHAT_MINUTES}′）</div>
          </div>
        </div>
      </div>

      {policeToday && (
        <div className="comfort-police-card">
          <strong>今天你在派出所录了一天口供。</strong>
          <p className="muted small">民警说，金额不大，先登记备案；再来一次，就不是登记了。工作手机躺在兜里，一夜没敢开机。</p>
        </div>
      )}

      {/* 突发事件：生活横生枝节的那一下——当场选，拖到明天落「没接住」 */}
      {(() => {
        const inc = COMFORT_INCIDENTS.find((i) => i.id === c.pending);
        if (!inc) return null;
        return (
          <div className="beat-card comfort-incident">
            <div className="beat-title"><Ico name="bolt" size={14} /> {inc.title}</div>
            <div className="beat-body">{inc.body}</div>
            <div className="beat-options">
              {inc.options.map((opt, i) => (
                <button key={i} className="btn small beat-opt" onClick={() => { playMessage(); store.dispatch({ type: 'comfort_resolve_incident', optionIndex: i }); }}>
                  {opt.text}
                </button>
              ))}
            </div>
            {inc.verse && <div className="comfort-incident-verse">「{inc.verse.v}」——{inc.verse.s}</div>}
            <p className="muted small">不接也行——拖到明天，就按「没接住」算。</p>
          </div>
        );
      })()}

      {/* 事件卡：妈的生活费 / 阿凯的红包 / 阿凯要钱 / 嘘寒问暖 / 暗线剧情 */}
      {c.incoming.map((m) => {
        const beat = m.kind === 'story' ? STORY_BEATS.find((b) => b.id === m.beatId) : undefined;
        const storyFrom = beat?.from ?? 'sys';
        const isStory = m.kind === 'story';
        const isTalk = m.kind === 'mom_talk' || m.kind === 'bf_talk' || m.kind === 'bestie_talk';
        const isIntro = m.kind === 'auntie_intro';
        const isQuarrel = m.kind === 'quarrel';
        const isMom = m.kind === 'mom_gift' || m.kind === 'mom_talk';
        const isDemand = m.kind === 'bf_demand';
        // 每种卡的"说话人"：故事卡按 beat 来源，其余按卡的归属
        const speaker: ComfortSpeakerId = isStory
          ? (storyFrom as ComfortSpeakerId)
          : isMom ? 'mother'
          : (m.kind === 'bf_packet' || m.kind === 'bf_demand' || m.kind === 'bf_talk' || isQuarrel) ? 'boyfriend'
          : m.kind === 'bestie_talk' ? 'bestie'
          : 'auntie';
        const tag = isStory ? ' · ' + (storyFrom === 'sys' ? '消息' : '语音')
          : isIntro ? ' · 给你介绍个人'
          : isQuarrel ? ' · 火气'
          : m.tone === 'birthday' ? ' · 生日'
          : isTalk ? ' · 语音'
          : m.kind === 'bf_packet' ? ' · 红包'
          : isDemand ? ' · 要钱' : ' · 转账';
        const storyName = speakerName(speaker);
        const chatOpen = c.chat !== null;
        // 聊天卡的作息门禁：妈/曼曼白天，阿凯夜里；时间不足开不了场。
        const talkIsBf = m.kind === 'bf_talk';
        const talkAwake = (talkIsBf ? night : !night) && timeLeft;
        const talkPronoun = m.kind === 'bf_talk' ? '他' : '她';
        const talkBlockReason = chatOpen ? '（先回完手头这场）'
          : (talkIsBf ? !night : night)
            ? (talkIsBf ? '他白天在补觉（晚上再说）' : '她这个点睡了（明天再说）')
            : '今天的时间用完了';
        // 吵架卡：他只有夜里醒着。
        const quarrelAwake = night && timeLeft;
        const quarrelBlockReason = chatOpen ? '（先回完手头这场）'
          : !night ? '他白天在补觉（晚上再说）' : '今天的时间用完了';
        // 介绍卡：见面首聊是白天的事，也占一场时间。
        const introAwake = !night && timeLeft;
        const introBlockReason = chatOpen ? '（先回完手头这场）'
          : night ? '明天白天再见了' : '今天没空见了';
        return (
          <div key={m.id} className={`comfort-event-card ${m.kind}`}>
            <div className="cec-head">
              {isStory && storyFrom === 'sys'
                ? <span className="cec-sys-mark"><Ico name="letter" size={22} /></span>
                : <ComfortAvatar who={speakerAvatar(speaker) ?? 'xiaoman'} size={36} />}
              <div>
                <div className="cec-name">{storyName}{tag}</div>
                <div className="muted small">{m.note}</div>
              </div>
            </div>
            {m.lines.map((l, i) => (
              <VoiceBubble key={i} m={{ speaker: 'them', text: l, voiceSecs: Math.min(58, Math.max(2, Math.ceil(l.length / 4))) }} name={storyName} who={speakerAvatar(speaker)} />
            ))}
            <div className="cec-actions">
              {isStory ? (
                <button
                  className="btn small primary"
                  disabled={chatOpen}
                  onClick={() => { playMessage(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: true }); }}
                >
                  {chatOpen ? '（先回完手头这场）' : STORY_OPEN_LABEL[storyFrom]}
                </button>
              ) : isIntro ? (
                <>
                  <button
                    className="btn small primary"
                    disabled={!introAwake}
                    title={introAwake ? `一场 ${COMFORT_CHAT_MINUTES} 分钟` : undefined}
                    onClick={() => { playMessage(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: true }); }}
                  >
                    {introAwake ? '见见（阿姨都安排好了）' : introBlockReason}
                  </button>
                  <button className="btn small muted-btn" onClick={() => { playBlocked(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: false }); }}>
                    婉拒（姨有点可惜，还会再来）
                  </button>
                </>
              ) : isQuarrel ? (
                <>
                  <button
                    className="btn small primary"
                    disabled={!quarrelAwake}
                    title={quarrelAwake ? `一场 ${COMFORT_CHAT_MINUTES} 分钟` : undefined}
                    onClick={() => { playMessage(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: true }); }}
                  >
                    {quarrelAwake ? '听他说完' : quarrelBlockReason}
                  </button>
                  <button className="btn small muted-btn" onClick={() => { playBlocked(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: false }); }}>
                    晾着他（感情更凉）
                  </button>
                </>
              ) : isTalk ? (
                  <>
                    <button
                      className="btn small primary"
                      disabled={!talkAwake}
                      title={talkAwake ? `一场 ${COMFORT_CHAT_MINUTES} 分钟` : undefined}
                      onClick={() => { playMessage(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: true }); }}
                    >
                      {talkAwake ? `回${talkPronoun}` : talkBlockReason}
                    </button>
                    <button className="btn small muted-btn" onClick={() => { playBlocked(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: false }); }}>
                      先不回（{isMom ? '她会等到很晚' : talkIsBf ? '他马上追问' : '她转头就忘了'}）
                    </button>
                  </>
                ) : isDemand ? (
                <>
                  <button className="btn small primary" onClick={() => { playMoney(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: true }); }}>
                    给他 {formatMoney(m.amount)}
                  </button>
                  <button className="btn small muted-btn" onClick={() => { playBlocked(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: false }); }}>
                    不给（他会有意见）
                  </button>
                </>
              ) : (
                <>
                  <button className="btn small primary" onClick={() => { playMoney(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: true }); }}>
                    收下（+{formatMoney(m.amount)}）
                  </button>
                  <button className="btn small muted-btn" onClick={() => { playBlocked(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: false }); }}>
                    不要（{isMom ? (m.tone === 'birthday' ? '她把红包原路收回' : '她会念叨你倔') : '他觉得你有别人了'}）
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* 镜像行：两台手机同构的那句话 */}
      <div className="comfort-mirror">
        <div className="comfort-mirror-tag">两台手机</div>
        {mirror}
      </div>

      {/* 熟人速聊：时间花给谁，就是爱给了谁 */}
      <div className="comfort-quick-chat">
        <h3>家人</h3>
        {(['mother', 'boyfriend'] as ComfortContactId[]).map((id) => {
          const def = COMFORT_CONTACTS[id];
          const gone = id === 'boyfriend' && (c.blockedByBf || c.bfState !== 'normal');
          const goneText = c.bfState === 'arrested' ? '（他的头像再也没有亮过。）' : '（他把你删了。）';
          const awake = canTalk(id);
          return (
            <div key={id} className={`comfort-contact-row ${gone ? 'gone' : ''}`}>
              <ComfortAvatar who={id} size={40} />
              <div className="ccr-body">
                <div className="ccr-name">{def.handle}</div>
                <div className="muted small">{gone ? goneText : awake ? def.signature : talkHint(id)}</div>
              </div>
              {!gone && (
                <button
                  className="btn small primary"
                  disabled={!awake}
                  title={awake ? talkHint(id) : undefined}
                  onClick={() => { playMessage(); store.dispatch({ type: 'comfort_open_chat', contactId: id }); }}
                >
                  {awake ? '发消息' : talkHint(id)}
                </button>
              )}
            </div>
          );
        })}
        <h3>身边人</h3>
        {(['auntie', 'bestie'] as ComfortContactId[]).map((id) => {
          const def = COMFORT_CONTACTS[id];
          const awake = canTalk(id);
          return (
            <div key={id} className="comfort-contact-row">
              <ComfortAvatar who={id} size={40} />
              <div className="ccr-body">
                <div className="ccr-name">{def.handle}</div>
                <div className="muted small">{awake ? def.signature : talkHint(id)}</div>
              </div>
              <button
                className="btn small primary"
                disabled={!awake}
                title={awake ? talkHint(id) : undefined}
                onClick={() => { playMessage(); store.dispatch({ type: 'comfort_open_chat', contactId: id }); }}
              >
                {awake ? '发消息' : talkHint(id)}
              </button>
            </div>
          );
        })}
        {Object.keys(c.datesMet).length > 0 && (
          <>
            <h3>阿姨介绍的</h3>
            {Object.entries(c.datesMet).sort((a, b) => b[1] - a[1]).map(([id, metDay]) => {
              const date = BLIND_DATE_MAP[id];
              if (!date) return null;
              const awake = !night && timeLeft;
              return (
                <div key={id} className="comfort-contact-row">
                  <ComfortAvatar who={`bd:${id}` as ComfortAvatarKey} size={40} />
                  <div className="ccr-body">
                    <div className="ccr-name">{date.handle}</div>
                    <div className="muted small">{awake ? `${date.job} · 第 ${metDay} 天经凤霞姨认识` : talkHint('mother')}</div>
                  </div>
                  <button
                    className="btn small primary"
                    disabled={!awake}
                    onClick={() => { playMessage(); store.dispatch({ type: 'comfort_open_date_chat', dateId: id }); }}
                  >
                    {awake ? '发消息' : talkHint('mother')}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="event-feed">
        {comfortLog.map((l, i) => (
          <div key={i} className={`log-entry log-${l.kind}`}>
            <span className="log-day">D{l.day}</span>
            <span>{l.details}</span>
            {l.line && <div className="log-line">{l.line}</div>}
          </div>
        ))}
      </div>

      {/* 两段式日夜：天黑了 → 他的时间 → 进入明天 */}
      {night ? (
        <>
          <p className="muted small center" style={{ margin: '2px 0 4px' }}>
            {timeLeft ? `夜里还剩 ${c.minutes} 分钟——是他的时间，也是你的。` : '今天的时间用完了。明天再说。'}
          </p>
          <button className="btn wide" onClick={() => store.dispatch({ type: 'sleep' })}>
            进入明天
          </button>
        </>
      ) : (
        <button className="btn primary wide" onClick={() => { playTab(); store.dispatch({ type: 'enter_night' }); }}>
          天黑了
        </button>
      )}
    </section>
  );
}

/** 通讯录：父亲（置灰纪念位）、妈、男友。 */
function ComfortContacts() {
  const { state } = useGame();
  const c = state.comfort;
  const [dadOpen, setDadOpen] = useState(false);
  const bfGone = c.blockedByBf || c.bfState !== 'normal';
  const bfGoneTag = c.bfState === 'arrested' ? ' · 被带走了' : ' · 已拉黑';

  return (
    <section className="comfort-contacts">
      <h3>通讯录（{4 + Object.keys(c.datesMet).length} 人）</h3>
      {/* 父亲：置灰 */}
      <div className="comfort-contact-row father" onClick={() => setDadOpen(!dadOpen)}>
        <ComfortAvatar who="father" size={44} />
        <div className="ccr-body">
          <div className="ccr-name">{FATHER_MEMORIAL.handle}</div>
          <div className="muted small">{FATHER_MEMORIAL.signature}</div>
          {dadOpen && <div className="comfort-father-bio">{FATHER_MEMORIAL.bio}</div>}
        </div>
        {dadOpen && <span className="muted small">收起</span>}
      </div>
      {/* 妈 */}
      <div className="comfort-contact-row">
        <ComfortAvatar who="mother" size={44} />
        <div className="ccr-body">
          <div className="ccr-name">{COMFORT_CONTACTS.mother.handle}（{COMFORT_CONTACTS.mother.name} · {COMFORT_CONTACTS.mother.age}岁）</div>
          <div className="muted small">{COMFORT_CONTACTS.mother.signature}</div>
          <div className="comfort-contact-bio">{COMFORT_CONTACTS.mother.bio}</div>
          <div className="muted small">家庭关系 {Math.round(c.family)} · 给过你 {formatMoney(c.momGiven)} · 你推掉过 {formatMoney(c.momRefused)}</div>
        </div>
      </div>
      {/* 凤霞姨（红娘） */}
      <div className="comfort-contact-row">
        <ComfortAvatar who="auntie" size={44} />
        <div className="ccr-body">
          <div className="ccr-name">{COMFORT_CONTACTS.auntie.handle}（{COMFORT_CONTACTS.auntie.name} · {COMFORT_CONTACTS.auntie.age}岁）</div>
          <div className="muted small">{COMFORT_CONTACTS.auntie.signature}</div>
          <div className="comfort-contact-bio">{COMFORT_CONTACTS.auntie.bio}</div>
          <div className="muted small">介绍过 {c.auntie.count} 个 · 认识了 {Object.keys(c.datesMet).length} 个</div>
        </div>
      </div>
      {/* 曼曼Lisa（闺蜜） */}
      <div className="comfort-contact-row">
        <ComfortAvatar who="bestie" size={44} />
        <div className="ccr-body">
          <div className="ccr-name">{COMFORT_CONTACTS.bestie.handle}（{COMFORT_CONTACTS.bestie.name} · {COMFORT_CONTACTS.bestie.age}岁）</div>
          <div className="muted small">{COMFORT_CONTACTS.bestie.signature}</div>
          <div className="comfort-contact-bio">{COMFORT_CONTACTS.bestie.bio}</div>
          <div className="muted small">找你唠过 {c.bestieTalk.count} 回 · 劝分 {c.bestieTalk.count > 3 ? '（她自己都数不清了）' : '若干回'}</div>
        </div>
      </div>
      {/* 男友 */}
      <div className={`comfort-contact-row ${bfGone ? 'gone' : ''}`}>
        <ComfortAvatar who="boyfriend" size={44} />
        <div className="ccr-body">
          <div className="ccr-name">{COMFORT_CONTACTS.boyfriend.handle}（{COMFORT_CONTACTS.boyfriend.name} · {COMFORT_CONTACTS.boyfriend.age}岁）{bfGone ? bfGoneTag : ''}</div>
          <div className="muted small">{bfGone ? '（长期离线）' : COMFORT_CONTACTS.boyfriend.signature}</div>
          <div className="comfort-contact-bio">{COMFORT_CONTACTS.boyfriend.bio}</div>
          {!bfGone && <div className="muted small">感情 {Math.round(c.love)} · 给过你 {formatMoney(c.bfGiven)} · 从你这儿拿走 {formatMoney(c.bfTaken)}</div>}
          {bfGone && c.bfState === 'broken_up' && <div className="comfort-contact-bio muted">他卷走了活命钱里剩下的每一块，连同他游戏里那个"满姐"的聊天记录。你被他拉黑了——常用手机里，这行灰色的名字删不删，你还没想好。</div>}
          {bfGone && c.bfState === 'arrested' && <div className="comfort-contact-bio muted">警情通报里没有他的名字，只有那件灰卫衣。兰姨的五万成了"彩礼"，你转他的每一笔都躺在案卷第 9 页。妈听说了，只说了一句：早看出来了，就没敢说。</div>}
        </div>
      </div>
      <p className="muted small">爸的名字一直置着灰。妈说，留着吧，就当这个号还在等他上线。</p>
      {Object.keys(c.datesMet).length > 0 && (
        <>
          <h3>阿姨介绍的</h3>
          {Object.entries(c.datesMet).sort((a, b) => b[1] - a[1]).map(([id, metDay]) => {
            const date = BLIND_DATE_MAP[id];
            if (!date) return null;
            return (
              <div key={id} className="comfort-contact-row candidate">
                <ComfortAvatar who={`bd:${id}` as ComfortAvatarKey} size={44} />
                <div className="ccr-body">
                  <div className="ccr-name">{date.handle}（{date.name} · {date.age}岁）<span className="ccr-tag">凤霞姨介绍的</span></div>
                  <div className="muted small">{date.job} · {date.signature}</div>
                  <div className="comfort-contact-bio">{date.bio}</div>
                  <div className="muted small">第 {metDay} 天经凤霞姨认识</div>
                </div>
              </div>
            );
          })}
          <p className="muted small">阿姨的花名册还有半本没翻完。她说好男人不等人，她能等。</p>
        </>
      )}
    </section>
  );
}

/** 朋友圈：励志/晒家/晒恩爱三选一 + 妈和男友的互动。 */
function ComfortMoments() {
  const store = useGame();
  const { state } = store;
  const c = state.comfort;
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const postedToday = c.moments.some((m) => m.author === 'me' && m.day === state.day);

  return (
    <section className="comfort-moments">
      <h3>朋友圈</h3>
      <div className="moment-poster">
        {postedToday ? (
          <p className="muted small">今天发过了。妈已经点过赞了。</p>
        ) : (
          <div className="choice-grid moment-grid">
            <button className="choice-tile" onClick={() => { playPost(); store.dispatch({ type: 'comfort_post_moment', kind: 'inspire' }); }}>
              <div className="tile-label">励志语录</div>
              <div className="muted small">打气的话——给刷到的人，也给自己</div>
            </button>
            <button className="choice-tile" onClick={() => { playPost(); store.dispatch({ type: 'comfort_post_moment', kind: 'family' }); }}>
              <div className="tile-label">晒家庭幸福</div>
              <div className="muted small">妈的被子、爸的螃蟹、养生文章</div>
            </button>
            <button className="choice-tile" onClick={() => { playPost(); store.dispatch({ type: 'comfort_post_moment', kind: 'love' }); }}>
              <div className="tile-label">晒恩爱</div>
              <div className="muted small">他的奶茶、双人成行、画不完的饼</div>
            </button>
          </div>
        )}
      </div>

      <div className="moment-feed">
        {c.moments.length === 0 && <p className="muted small">还没有动态。发一条——妈在等着看。</p>}
        {[...c.moments].reverse().map((m) => {
          const liked = m.likes.includes('me');
          const commented = m.comments.some((cm) => cm.by === 'me');
          const nameOf = (by: string) => {
            if (by === 'me') return state.playerName || '小满';
            if (by === 'sys') return '消息';
            if (by.startsWith('bd:')) return BLIND_DATE_MAP[by.slice(3)]?.handle ?? by;
            return COMFORT_CONTACTS[by as ComfortContactId].handle;
          };
          const authorAvatar = (by: string): ComfortAvatarKey | undefined => {
            if (by === 'me') return 'xiaoman';
            if (by.startsWith('bd:')) return by as `bd:${string}`;
            return by as ComfortAvatarKey;
          };
          const ava = <ComfortAvatar who={authorAvatar(m.author) ?? 'xiaoman'} size={36} />;
          return (
            <div key={m.id} className="moment-card">
              <div className="moment-head">
                {ava}
                <div>
                  <div className="moment-name">{nameOf(m.author)}</div>
                  <div className="muted small">第 {m.day} 天</div>
                </div>
              </div>
              <div className="moment-photo">{m.photoId && <ComfortSceneRender photoId={m.photoId} />}</div>
              <div className="moment-caption">{m.text}</div>
              {m.likes.length > 0 && <div className="moment-likes"><Ico name="heart" size={12} /> {m.likes.map((l) => nameOf(l)).join('、')}</div>}
              {m.comments.length > 0 && (
                <div className="moment-comments">
                  {m.comments.map((cm, i) => (
                    <div key={i} className="moment-comment">
                      <span className="mc-author">{nameOf(cm.by)}：</span>{cm.text}
                    </div>
                  ))}
                </div>
              )}
              {m.author !== 'me' && (
                <div className="moment-actions">
                  <button className="btn small" disabled={liked} onClick={() => { playSocial(); store.dispatch({ type: 'comfort_react_moment', momentId: m.id }); }}>
                    {liked ? '已赞' : '点赞'}
                  </button>
                  <button className="btn small" disabled={commented} onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}>
                    {commented ? '已评论' : '评论'}
                  </button>
                </div>
              )}
              {m.author !== 'me' && pickerFor === m.id && !commented && (
                <div className="moment-comment-picker">
                  <div className="muted small">随口回一句——话不带目的，但有分量。</div>
                  {myMomentCommentOptions(m.author).map((opt, i) => (
                    <button key={i} className="moment-comment-opt" onClick={() => { playSend(); setPickerFor(null); store.dispatch({ type: 'comfort_comment_moment', momentId: m.id, optionIndex: i }); }}>
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** 聊天记录：和妈/男友的归档（语音条样式）。 */
function ComfortHistory() {
  const { state } = useGame();
  const c = state.comfort;
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className="comfort-history">
      <h3>聊天记录</h3>
      {c.archives.length === 0 && <p className="muted small">还没有聊过。给妈发条消息吧——她的语音条都很长。</p>}
      <div className="history-list">
        {[...c.archives].reverse().map((a, i) => {
          const realIdx = c.archives.length - 1 - i;
          return (
            <div key={realIdx} className="history-item">
              <button className="history-head" onClick={() => setOpenIdx(openIdx === realIdx ? null : realIdx)}>
                <span className="history-day">第 {a.day} 天</span>
                <span className="history-name">{speakerName(a.contactId)}</span>
                <span className="muted small">{a.transcript.length} 条 · {openIdx === realIdx ? '收起' : '展开'}</span>
              </button>
              {openIdx === realIdx && (
                <div className="history-transcript">
                  {a.transcript.map((m, j) => (
                    <VoiceBubble key={j} m={m} name={speakerName(a.contactId)} who={speakerAvatar(a.contactId)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** 钱包：活命钱 + 两本账的对照。 */
function ComfortWallet() {
  const { state } = useGame();
  const c = state.comfort;
  const familyRows = state.ledger.filter((e) => e.kind === 'family');
  return (
    <section className="comfort-wallet">
      <h3>钱包</h3>
      <div className="wallet-summary">
        <div><span>活命钱</span><strong>{formatMoney(state.money)}</strong></div>
        <div><span>妈给过</span><strong className="pos">{formatMoney(c.momGiven)}</strong></div>
        <div><span>阿凯给过</span><strong className="pos">{formatMoney(c.bfGiven)}</strong></div>
        <div><span>阿凯拿走</span><strong className="neg">{formatMoney(c.bfTaken)}</strong></div>
      </div>
      <div className="comfort-mirror">
        <div className="comfort-mirror-tag">两本账</div>
        {WALLET_CONTRAST[state.day % WALLET_CONTRAST.length]}
      </div>
      <h4>家里的账</h4>
      <div className="ledger-list">
        {familyRows.length === 0 && <p className="muted small">还没有家里的账。</p>}
        {[...familyRows].reverse().map((e, i) => (
          <div key={i} className={`ledger-row ${e.amount >= 0 ? 'pos' : 'neg'}`}>
            <span className="ledger-day">D{e.day}</span>
            <span className="ledger-note">{e.note}</span>
            <span className="ledger-amt">{e.amount > 0 ? '+' : ''}{formatMoney(e.amount)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 舒适圈聊天视图：语音条气泡流 + 回复选项（无打字机、无精力、无警惕）。 */
function ComfortChatView() {
  const store = useGame();
  const { state } = store;
  const c = state.comfort;
  const chat = c.chat!;
  const name = speakerName(chat.contactId);
  const streamRef = useRef<HTMLDivElement>(null);
  // 新气泡到达 → 平滑贴底（微信式：旧消息向上滚，最新的永远可见）。
  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.transcript.length]);

  return (
    <section className="chat-panel comfort-chat">
      <header className="chat-header">
        <ComfortAvatar who={speakerAvatar(chat.contactId) ?? 'xiaoman'} size={36} />
        <div>
          <div className="target-name">{name}</div>
        </div>
      </header>
      <div className="chat-stream" ref={streamRef}>
        {chat.transcript.map((m, i) => (
          <VoiceBubble key={i} m={m} name={name} who={speakerAvatar(chat.contactId)} />
        ))}
      </div>
      {chat.awaiting === 'player' && (
        <div className="option-list">
          {chat.pending.map((o, i) => (
            <button key={i} className="option" onClick={() => { playSend(); store.dispatch({ type: 'comfort_pick', optionIndex: i }); }}>
              {o.text}
            </button>
          ))}
        </div>
      )}
      {chat.awaiting === 'closed' && (
        <>
          <div className="closing-note">{chat.closingNote}</div>
          <div className="chat-actions">
            <button className="btn" onClick={() => store.dispatch({ type: 'comfort_end_chat' })}>放下手机</button>
          </div>
        </>
      )}
    </section>
  );
}
