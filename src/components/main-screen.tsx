import { useGame } from '../store/gameStore';
import { TARGET_MAP, PERSONA_MAP, targetAwake, isMorningTarget } from '../engine/state-machine';
import { formatMoney } from '../utils/format';
import { OldManAvatar, PersonaAvatar } from './character-art';
import { playMessage } from '../utils/sound';
import { useEffect, useRef, useState } from 'react';
import { INDUSTRY_COURSE_COST } from '../data/constants';

/** 打字机入场：每个气泡先露一个字，再逐字打完（收到新气泡时也走这个）。 */
function firstChunk(text: string): number {
  return text.length > 0 ? 1 : 0;
}

const STAGE_LABEL: Record<string, string> = {
  stranger: '刚认识',
  warming: '熟了点',
  trusted: '挺信任你',
  harvest: '离不开你',
  burned: '完了',
};

function riskLabel(risk: number): { text: string; cls: string } {
  if (risk < 15) return { text: '风平浪静', cls: 'risk-safe' };
  if (risk < 40) return { text: '有点风声', cls: 'risk-warm' };
  if (risk < 70) return { text: '有人在打听你', cls: 'risk-hot' };
  return { text: '评论区快烧起来了', cls: 'risk-burn' };
}

export function MainScreen() {
  const store = useGame();
  const { state } = store;
  const persona = PERSONA_MAP[state.personaId];
  const risk = riskLabel(state.riskLevel);
  const [showLog, setShowLog] = useState(false);
  // HUD label survives the chat phase (dayPhase === 'chat').
  const phaseLabel =
    state.dayPhase === 'chat'
      ? state.chat && isMorningTarget(TARGET_MAP[state.chat.targetId])
        ? '上午 · 聊天中'
        : '深夜 · 聊天中'
      : state.dayPhase === 'morning'
        ? '白天 · 账单与新闻'
        : '深夜';

  return (
    <div className="screen main-screen">
      <header className="hud">
        <div className="hud-left">
          <span className="day-chip">第 {state.day}/{state.daysLimit} 天</span>
          <span className="muted">{phaseLabel}</span>
        </div>
        <div className="hud-right">
          <span className="money">余额 {formatMoney(state.money)}</span>
          <span className="goal">还差 {formatMoney(Math.max(0, state.goal - state.stats.totalEarned))}</span>
        </div>
      </header>
      <div className={`risk-strip ${risk.cls}`}>朋友圈：{risk.text}（{Math.round(state.riskLevel)}%）</div>

      {/* morning: bills, news, and the morning-online targets */}
      {state.dayPhase === 'morning' && (
        <section className="morning-panel">
          <div className="persona-row">
            <PersonaAvatar personaId={state.personaId} size={40} />
            <div>
              <div className="persona-line">{state.playerName} · 人设「{persona.name}」</div>
              <div className="muted small">精力 {state.energy}/{state.energyMax} · 麻木 {state.numbness}% · 良心 {state.conscience}</div>
              {state.industryCourse && <div className="industry-badge">代聊群运行中 · 话术共用 · 判决书线已激活</div>}
            </div>
          </div>
          <div className="event-feed">
            {state.log.slice(-6).map((l, i) => (
              <div key={i} className={`log-entry log-${l.kind}`}>
                <span className="log-day">D{l.day}</span>
                <span>{l.details}</span>
                {l.line && <div className="log-line">{l.line}</div>}
              </div>
            ))}
          </div>
          <IndustryInviteCard />
          <TargetList dayPhase="morning" />
          <button className="btn primary wide" onClick={() => store.dispatch({ type: 'enter_night' })}>
            天黑了
          </button>
        </section>
      )}

      {/* night: roster of everyone awake now */}
      {state.dayPhase === 'night' && (
        <section className="roster-panel">
          <p className="muted small">今晚精力还剩 {state.energy} 点，一场深夜对话要 4 点。</p>
          <TargetList dayPhase="night" />
          <button className="btn wide" onClick={() => store.dispatch({ type: 'sleep' })}>
            睡了（进入明天）
          </button>
          <button className="btn small muted-btn" onClick={() => store.dispatch({ type: 'retire' })}>
            这个游戏让你不舒服了？结束这一个月。
          </button>
        </section>
      )}

      {/* chat */}
      {state.dayPhase === 'chat' && state.chat && <ChatView />}

      {showLog && (
        <div className="log-overlay" onClick={() => setShowLog(false)}>
          <div className="log-panel" onClick={(e) => e.stopPropagation()}>
            <h3>这个月的事</h3>
            {state.log.map((l, i) => (
              <div key={i} className={`log-entry log-${l.kind}`}>
                <span className="log-day">D{l.day}</span>
                <span>{l.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <button className="log-toggle" onClick={() => setShowLog(!showLog)}>流水</button>
      <footer className="stats-row">
        <span>红包 {state.stats.redPacketsReceived} 个</span>
        <span>开口 {state.stats.asksMade} 次</span>
        <span>最大 {formatMoney(state.stats.biggestPacket)}</span>
      </footer>
    </div>
  );
}

/** 姐妹的"课程"私信——产业化分支的入口，只在白天出现一次。 */
function IndustryInviteCard() {
  const store = useGame();
  const { state } = store;
  if (!state.flags.industry_invite || state.flags.industry_replied) return null;
  return (
    <div className="industry-card">
      <div className="industry-head">私信 · 带你的那个姐</div>
      <p className="industry-msg">
        「妹妹，看你手上哥哥不少。姐这边有<b>课程</b>，三套话术，共用群，一天能带三个号。
        学费 {INDUSTRY_COURSE_COST}，回个 1 就进群。」
      </p>
      <div className="industry-actions">
        <button className="btn primary small" onClick={() => store.dispatch({ type: 'industry_reply', accept: true })}>
          转 300，进群（代聊群每天替你维护他们）
        </button>
        <button className="btn small" onClick={() => store.dispatch({ type: 'industry_reply', accept: false })}>
          删掉这条私信
        </button>
      </div>
      <p className="muted small">进了群，你的号就不再只属于你。风险每天 +3%，麻木每天 +2%。</p>
    </div>
  );
}

function TargetList({ dayPhase }: { dayPhase: 'morning' | 'night' }) {
  const store = useGame();
  const { state } = store;
  return (
    <div className="target-list">
      {state.targets.map((t) => {
        const def = TARGET_MAP[t.targetId];
        const awake = targetAwake(def, dayPhase);
        const chatted = t.lastChatDay === state.day;
        const canChat = !t.blocked && awake && !chatted && state.energy >= 4 && state.dayPhase !== 'chat';
        return (
          <div key={t.targetId} className={`target-card ${t.blocked ? 'blocked' : ''} ${!awake ? 'asleep' : ''}`}>
            <OldManAvatar target={def} state={t} size={56} />
            <div className="target-info">
              <div className="target-name">
                {def.name} <span className="muted small">{def.age}岁 · {archetypeLabel(def.archetype)}</span>
              </div>
              <div className="stage-chip">{STAGE_LABEL[t.stage]}</div>
              <div className="bars">
                <div className="bar trust"><span style={{ width: `${t.trust}%` }} />信任</div>
                <div className="bar wariness"><span style={{ width: `${t.wariness}%` }} />警惕</div>
              </div>
              <div className="muted small">他给你的：{formatMoney(t.totalReceived)}（{t.timesPaid} 次）</div>
            </div>
            {t.blocked ? (
              <div className="blocked-note">他不回你了。</div>
            ) : !awake ? (
              <div className="muted small asleep-note">{dayPhase === 'night' ? '睡下了' : '还没醒'}</div>
            ) : chatted ? (
              <div className="muted small">今天聊过了。</div>
            ) : canChat ? (
              <button className="btn primary" onClick={() => { playMessage(); store.dispatch({ type: 'start_chat', targetId: t.targetId }); }}>
                {dayPhase === 'morning' ? '陪他说说话' : '找他说话'}
              </button>
            ) : (
              <div className="muted small">今晚没精力了。</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function archetypeLabel(a: string): string {
  const map: Record<string, string> = {
    divorced_driver: '出租车司机',
    widowed_teacher: '退休教师',
    married_boss: '建材老板',
    cafe_owner_ninety: '网吧老板',
    lonely_engineer: '工程师',
  };
  return map[a] ?? '';
}

function ChatView() {
  const store = useGame();
  const { state } = store;
  const chat = state.chat!;
  const t = state.targets.find((x) => x.targetId === chat.targetId)!;
  const def = TARGET_MAP[chat.targetId];
  const total = chat.transcript.length;

  // 打字机：气泡逐个浮出，最上面一个逐字打出；skipAll 供急性子玩家。
  const [bubbleCount, setBubbleCount] = useState(() => Math.min(1, total));
  const [typed, setTyped] = useState(() => (total > 0 ? firstChunk(chat.transcript[0].text) : 0));
  const [skipAll, setSkipAll] = useState(false);
  const done = bubbleCount >= total;
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skipAll) return;
    if (bubbleCount >= total) return;
    const cur = chat.transcript[bubbleCount - 1];
    if (typed < cur.text.length) return;
    // 当前气泡打完 → 停顿一拍，浮出下一个（到达动画），再开始打字。
    // 玩家自己那条打字极快——话是你选的，屏幕上只是补上；他的话才是"打字中"。
    const isPlayerMsg = cur.speaker === 'player';
    const delay = isPlayerMsg ? 40 : Math.min(1200, 350 + cur.text.length * 6);
    const id = window.setTimeout(() => {
      if (!isPlayerMsg) playMessage();
      setBubbleCount((c) => c + 1);
      setTyped(firstChunk(chat.transcript[bubbleCount]?.text ?? ''));
    }, delay);
    return () => window.clearTimeout(id);
  }, [bubbleCount, typed, total, chat, skipAll]);

  useEffect(() => {
    if (skipAll || bubbleCount >= total) return;
    const cur = chat.transcript[bubbleCount - 1];
    if (typed >= cur.text.length) return;
    // 35ms/字 ≈ 真人打字节奏；句读处稍慢。玩家自己的话 12ms/字 一闪而过。
    const isPlayerMsg = cur.speaker === 'player';
    const ch = cur.text[typed];
    const speed = isPlayerMsg ? 12 : /[，。？！…—]/.test(ch) ? 140 : 35;
    const id = window.setTimeout(() => setTyped((n) => n + 1), speed);
    return () => window.clearTimeout(id);
  }, [typed, bubbleCount, total, chat, skipAll]);

  useEffect(() => {
    // 打字中气泡变化 → 贴底跟随（聊天软件习惯）。
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight });
  }, [typed, bubbleCount]);

  const showAll = done || skipAll;
  const visible = showAll ? chat.transcript : chat.transcript.slice(0, bubbleCount);
  const typingBubble = !showAll && bubbleCount > 0 ? chat.transcript[bubbleCount - 1] : null;

  const skip = () => {
    setSkipAll(true);
    setBubbleCount(total);
    setTyped(total > 0 ? chat.transcript[total - 1].text.length : 0);
  };

  return (
    <section className="chat-panel">
      <header className="chat-header">
        <OldManAvatar target={def} state={t} size={36} />
        <div>
          <div className="target-name">{def.name}</div>
          <div className="muted small">{STAGE_LABEL[t.stage]} · 警惕 {t.wariness}%</div>
        </div>
        <span className="stamp-chip">{chat.transcript[0]?.stamp}</span>
      </header>

      <div className="chat-stream" ref={streamRef}>
        {visible.map((m, i) => {
          const isTyping = typingBubble === m && i === visible.length - 1;
          const text = isTyping ? m.text.slice(0, typed) : m.text;
          return (
            <div key={i} className={`bubble ${m.speaker} ${m.label ? 'packet' : ''} ${isTyping ? 'typing' : ''}`}>
              {m.label && <div className="packet-label">{m.label}</div>}
              <div className="bubble-text">
                {text}
                {isTyping && <span className="type-caret" />}
              </div>
              {m.stamp && !isTyping && <div className="bubble-stamp">{m.stamp}</div>}
            </div>
          );
        })}
        {!showAll && (
          <button className="btn small muted-btn skip-btn" onClick={skip}>
            （不等了，直接看完）
          </button>
        )}
      </div>

      {chat.awaiting === 'player' && showAll && (
        <div className="option-list">
          {chat.pendingOptions.map((o, i) => (
            <button
              key={i}
              className="option"
              onClick={() => {
                playMessage();
                store.dispatch({ type: 'pick_option', optionIndex: i });
                // 追加消息（你的选择 + 他的回应）从当前位置继续打字机；他的停在后面。
                setSkipAll(false);
                setBubbleCount(chat.transcript.length);
                setTyped(chat.transcript[chat.transcript.length - 1].text.length);
              }}
            >
              {o.text}
              <span className="muted small option-meta">{styleTag(o.style)}{o.isAsk ? ' · 要开口了' : ''}</span>
            </button>
          ))}
        </div>
      )}

      {chat.awaiting === 'closed' && showAll && (
        <>
          <div className="closing-note">{chat.closingNote}</div>
          <div className="chat-actions">
            <button className="btn" onClick={() => store.dispatch({ type: 'end_chat' })}>
              {isMorningTarget(def) ? '回到上午' : '回到深夜'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function styleTag(style: string): string {
  const tags: Record<string, string> = {
    sweet: '甜', flirty: '撩', caring: '暖', intellectual: '正', playful: '贫',
  };
  return tags[style] ?? style;
}
