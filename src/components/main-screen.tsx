import { useGame } from '../store/gameStore';
import { ALL_TARGET_MAP, PERSONA_MAP, targetAwake, isMorningTarget, SELFIE_LABEL, TRAIT_LABEL } from '../engine/state-machine';
import { formatMoney } from '../utils/format';
import { OldManAvatar, PersonaAvatar, ProfileAvatar, AVATAR_PRESETS } from './character-art';
import { playMessage, playSend, playPacket, playFail, playBlocked, playMorning } from '../utils/sound';
import { useEffect, useRef, useState } from 'react';
import { INDUSTRY_COURSE_COST, CHAT_SESSION_COST } from '../data/constants';
import { DAILY_PLANS } from '../data/plans';
import type { PlayerProfile } from '../types/game';

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

type ModuleTab = 'today' | 'contacts' | 'wallet' | 'history' | 'profile';

export function MainScreen() {
  const store = useGame();
  const { state } = store;
  const risk = riskLabel(state.riskLevel);
  const [tab, setTab] = useState<ModuleTab>('today');
  const [showLog, setShowLog] = useState(false);
  // 事件日志驱动的音效：只对"新增"条目响一次（重渲染/读档不重放）。
  const lastPlayedLog = useRef(state.log.length);
  useEffect(() => {
    const fresh = state.log.slice(lastPlayedLog.current);
    lastPlayedLog.current = state.log.length;
    for (const e of fresh) {
      if (e.kind === 'ask_fail') playFail();
      if (e.kind === 'blocked' || e.kind === 'target_ending') playBlocked();
      if (e.kind === 'day') playMorning();
    }
  }, [state.log]);
  // 聊天中强制回"今天"，聊天是全屏体验。
  const activeTab: ModuleTab = state.dayPhase === 'chat' ? 'today' : tab;
  // HUD label survives the chat phase (dayPhase === 'chat').
  const phaseLabel =
    state.dayPhase === 'chat'
      ? state.chat && isMorningTarget(ALL_TARGET_MAP[state.chat.targetId])
        ? '上午 · 聊天中'
        : '深夜 · 聊天中'
      : state.dayPhase === 'morning'
        ? '白天 · 账单与计划'
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

      {/* 聊天会话永远全屏（模块无关） */}
      {state.dayPhase === 'chat' && state.chat && <ChatView />}

      {state.dayPhase !== 'chat' && (
        <>
          {activeTab === 'today' && <TodayPanel phaseLabel={phaseLabel} />}
          {activeTab === 'contacts' && <ContactsPanel />}
          {activeTab === 'wallet' && <WalletPanel />}
          {activeTab === 'history' && <HistoryPanel />}
          {activeTab === 'profile' && <ProfilePanel />}

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

          {/* v2.0 底部五模块导航 */}
          <nav className="module-nav">
            <button className={activeTab === 'today' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('today')}>
              <span className="nav-ico">◐</span>今天
              {state.incoming.length > 0 && <span className="nav-badge">{state.incoming.length}</span>}
            </button>
            <button className={activeTab === 'contacts' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('contacts')}>
              <span className="nav-ico">☰</span>通讯录
            </button>
            <button className={activeTab === 'wallet' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('wallet')}>
              <span className="nav-ico">¥</span>钱包
            </button>
            <button className={activeTab === 'history' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('history')}>
              <span className="nav-ico">❝</span>聊天记录
            </button>
            <button className={activeTab === 'profile' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('profile')}>
              <span className="nav-ico">☺</span>人设
            </button>
          </nav>
          <footer className="stats-row">
            <span>红包 {state.stats.redPacketsReceived} 个</span>
            <span>开口 {state.stats.asksMade} 次</span>
            <button className="log-toggle" onClick={() => setShowLog(!showLog)}>流水</button>
          </footer>
        </>
      )}
    </div>
  );
}

/** 「今天」= 每日计划 + 他来找你 + 白天/深夜面板。 */
function TodayPanel({ phaseLabel }: { phaseLabel: string }) {
  const store = useGame();
  const { state } = store;
  const persona = PERSONA_MAP[state.personaId];
  const morning = state.dayPhase === 'morning';

  return (
    <section className="today-panel">
      <div className="persona-row">
        <PersonaAvatar personaId={state.personaId} size={40} />
        <div>
          <div className="persona-line">{state.playerName} · 人设「{persona.name}」</div>
          <div className="muted small">精力 {state.energy}/{state.energyMax}（一天最多 {Math.floor(state.energyMax / CHAT_SESSION_COST)} 场对话） · 麻木 {state.numbness}% · 良心 {state.conscience}</div>
          {state.industryCourse && <div className="industry-badge">代聊群运行中 · 话术共用 · 判决书线已激活</div>}
        </div>
      </div>

      {/* 他来找你——回应/装没看见 */}
      {state.incoming.length > 0 && (
        <div className="incoming-list">
          <h3>他来找你了</h3>
          {state.incoming.map((m) => {
            const def = ALL_TARGET_MAP[m.targetId];
            const t = state.targets.find((x) => x.targetId === m.targetId);
            if (!def) return null;
            return (
              <div key={m.targetId} className="incoming-card">
                <OldManAvatar target={def} state={t} size={40} />
                <div className="incoming-body">
                  <div className="incoming-head">{def.name} · {m.reason === 'selfie' ? '因为你的新照片' : m.reason === 'wallet_open' ? '他发工资了' : '就是想你了'}</div>
                  <div className="incoming-msg">{m.opener}</div>
                </div>
                <div className="incoming-actions">
                  <button className="btn primary small" onClick={() => store.dispatch({ type: 'accept_incoming', targetId: m.targetId })}>回他</button>
                  <button className="btn small muted-btn" onClick={() => store.dispatch({ type: 'ignore_incoming', targetId: m.targetId })}>划掉</button>
                </div>
              </div>
            );
          })}
          <p className="muted small">划掉是有代价的——孤独的人记得每一次已读不回。</p>
        </div>
      )}

      {/* 白天：计划 + 事件 + 上午老头 */}
      {morning && (
        <>
          <PlanPanel />
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
        </>
      )}

      {/* 深夜：名单 + 睡觉 */}
      {!morning && (
        <div className="roster-panel">
          <p className="muted small">{phaseLabel} · 精力 {state.energy} 点，一场对话 {CHAT_SESSION_COST} 点。</p>
          <TargetList dayPhase="night" />
          <button className="btn wide" onClick={() => store.dispatch({ type: 'sleep' })}>
            睡了（进入明天）
          </button>
          <button className="btn small muted-btn" onClick={() => store.dispatch({ type: 'retire' })}>
            这个游戏让你不舒服了？结束这一个月。
          </button>
        </div>
      )}
    </section>
  );
}

/** 每日计划：白天选一个——决定今晚在哪、遇到什么人。 */
function PlanPanel() {
  const store = useGame();
  const { state } = store;
  if (state.todayPlan) {
    const plan = DAILY_PLANS.find((p) => p.id === state.todayPlan);
    return (
      <div className="plan-panel chosen">
        <h3>今天的计划</h3>
        <div className="plan-chosen">{plan?.name ?? '宅家'}<span className="muted small"> · 已定（明天可换）</span></div>
        <p className="muted small">{plan?.description}</p>
      </div>
    );
  }
  return (
    <div className="plan-panel">
      <h3>今天去哪？（选一个计划）</h3>
      <div className="plan-grid">
        {DAILY_PLANS.map((p) => (
          <button key={p.id} className="plan-card" onClick={() => store.dispatch({ type: 'choose_plan', planId: p.id })}>
            <div className="plan-name">{p.name}</div>
            <div className="plan-desc">{p.description}</div>
            <div className="plan-meta muted small">
              精力 -{p.energyCost}
              {p.money ? ` · 钱 ${p.money > 0 ? '+' : ''}${p.money}` : ''}
              {p.meetArchetypes.length ? ' · 可能遇到人' : ''}
            </div>
          </button>
        ))}
      </div>
      <p className="muted small">计划花的是白天的精力；晚上聊天每场 {CHAT_SESSION_COST} 点。</p>
    </div>
  );
}

/** 通讯录：已认识的全部老头（含偶遇入册的库目标）。 */
function ContactsPanel() {
  const { state } = useGame();
  const known = state.targets.filter((t) => t.discoveredDay > 0);
  const unknownLeft = state.targets.length - known.length;
  return (
    <section className="contacts-panel">
      <h3>通讯录（{known.length} 人）</h3>
      <p className="muted small">全部加过微信的人。拉黑的沉底。</p>
      <div className="contacts-list">
        {[...known].sort((a, b) => Number(a.blocked) - Number(b.blocked)).map((t) => {
          const def = ALL_TARGET_MAP[t.targetId];
          return (
            <div key={t.targetId} className={`contact-row ${t.blocked ? 'blocked' : ''}`}>
              <OldManAvatar target={def} state={t} size={44} />
              <div className="contact-body">
                <div className="contact-name">{def.name} <span className="muted small">{def.age}岁 · 第 {t.discoveredDay} 天认识</span></div>
                <div className="muted small contact-bio">{def.bio.slice(0, 42)}…</div>
                <div className="muted small">信任 {Math.round(t.trust)} · 警惕 {Math.round(t.wariness)} · 给过 {formatMoney(t.totalReceived)}</div>
              </div>
              {t.blocked && <span className="blocked-note">不回你了</span>}
            </div>
          );
        })}
      </div>
      {unknownLeft > 0 && (
        <p className="muted small">还有 {unknownLeft} 个人在这座城里——去公园、棋摊、广场舞边走一走，可能会遇到。</p>
      )}
    </section>
  );
}

/** 钱包：余额 + 全部流水。 */
function WalletPanel() {
  const { state } = useGame();
  const income = state.ledger.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const spend = state.ledger.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0);
  return (
    <section className="wallet-panel">
      <h3>钱包</h3>
      <div className="wallet-summary">
        <div><span>余额</span><strong>{formatMoney(state.money)}</strong></div>
        <div><span>收入</span><strong className="pos">{formatMoney(income)}</strong></div>
        <div><span>支出</span><strong className="neg">{formatMoney(spend)}</strong></div>
        <div><span>目标进度</span><strong>{Math.min(100, Math.round(state.stats.totalEarned / state.goal * 100))}%</strong></div>
      </div>
      <h4>流水</h4>
      <div className="ledger-list">
        {state.ledger.length === 0 && <p className="muted small">这个月还没有账。</p>}
        {[...state.ledger].reverse().map((e, i) => (
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

/** 聊天记录：归档的每场对话。 */
function HistoryPanel() {
  const { state } = useGame();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className="history-panel">
      <h3>聊天记录</h3>
      {state.archives.length === 0 && <p className="muted small">还没有聊过（或聊天还没结束归档）。</p>}
      <div className="history-list">
        {[...state.archives].reverse().map((a, i) => {
          const def = ALL_TARGET_MAP[a.targetId];
          const realIdx = state.archives.length - 1 - i;
          return (
            <div key={realIdx} className="history-item">
              <button className="history-head" onClick={() => setOpenIdx(openIdx === realIdx ? null : realIdx)}>
                <span className="history-day">第 {a.day} 天</span>
                <span className="history-name">{def?.name ?? a.targetId}</span>
                <span className="muted small">{a.transcript.length} 条 · {openIdx === realIdx ? '收起' : '展开'}</span>
              </button>
              {openIdx === realIdx && (
                <div className="history-transcript">
                  {a.transcript.map((m, j) => (
                    <div key={j} className={`bubble ${m.speaker} ${m.label ? 'packet' : ''}`}>
                      {m.label && <div className="packet-label">{m.label}</div>}
                      <div className="bubble-text">{m.text}</div>
                      {m.stamp && <div className="bubble-stamp">{m.stamp}</div>}
                    </div>
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
  // v2.0：名单只显示已认识的（库目标要靠计划偶遇才能解锁进通讯录）。
  const known = state.targets.filter((t) => t.discoveredDay > 0);
  return (
    <div className="target-list">
      {known.map((t) => {
        const def = ALL_TARGET_MAP[t.targetId];
        const awake = targetAwake(def, dayPhase);
        const chatted = t.lastChatDay === state.day;
        const canChat = !t.blocked && awake && !chatted && state.energy >= CHAT_SESSION_COST && state.dayPhase !== 'chat';
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
    night_guard: '小区保安',
    fisherman: '钓友',
    chess_uncle: '棋友',
    square_dancer: '广场舞大爷',
  };
  return map[a] ?? '';
}

function ChatView() {
  const store = useGame();
  const { state } = store;
  const chat = state.chat!;
  const t = state.targets.find((x) => x.targetId === chat.targetId)!;
  const def = ALL_TARGET_MAP[chat.targetId];
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
      const next = chat.transcript[bubbleCount];
      // 到达音随气泡：红包系统条用金币声，他的话用消息声，你自己的话不出声。
      if (next && next.speaker !== 'player') {
        if (next.label) playPacket();
        else playMessage();
      }
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
                playSend();
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

const AGE_OPTIONS: { value: PlayerProfile['ageClaim']; label: string; note: string }[] = [
  { value: 20, label: '20岁', note: '像刚出校园——"女儿感"拉满，但对想找大人说话的人有点装。' },
  { value: 24, label: '24岁', note: '安全牌：像刚工作的妹妹，谁都不反感。' },
  { value: 28, label: '28岁', note: '像懂事的成年人——老板型愿意跟你"正经聊"。' },
  { value: 32, label: '32岁', note: '接近同龄网友——"女儿感"全无，仰视感拉满。' },
];

const TRAIT_OPTIONS: { value: PlayerProfile['traitId']; label: string; note: string }[] = [
  { value: 'sweet_mouth', label: '嘴甜', note: '哄得住孤独的，但生意人觉得你廉价。' },
  { value: 'cold_queen', label: '清冷', note: '疑心重的反而放心（不像图钱的），情感依赖型却被推远。' },
  { value: 'straight_shooter', label: '直性子', note: '工程师式好感——有事说事；文艺的嫌你煞风景。' },
  { value: 'soft_artsy', label: '文艺', note: '孤独成诗的人觉得遇到了知己，老板们看不懂。' },
];

const SELFIE_OPTIONS: { value: PlayerProfile['selfieId']; label: string; emoji: string }[] = [
  { value: 'cake', label: '蛋糕照', emoji: '🍰' },
  { value: 'gym', label: '夜跑照', emoji: '🏃' },
  { value: 'pool', label: '泳池照', emoji: '🏊' },
  { value: 'cat', label: '橘猫照', emoji: '🐈' },
];

/** 人设：头像/自称年龄/性格/朋友圈自拍——全部影响他的话术与好感走向。 */
function ProfilePanel() {
  const store = useGame();
  const { state } = store;
  const p = state.profile;
  const setProfile = (patch: Partial<PlayerProfile>) => store.dispatch({ type: 'update_profile', ...patch });
  return (
    <section className="profile-panel">
      <h3>人设档案</h3>
      <p className="muted small">你对外呈现的这个人。每换一张朋友圈自拍，最近几天他会更主动来找你。</p>

      <h4>头像</h4>
      <div className="choice-grid avatars">
        {AVATAR_PRESETS.map((a) => (
          <button key={a.id} className={`choice-tile ${p.avatarId === a.id ? 'on' : ''}`} onClick={() => setProfile({ avatarId: a.id })}>
            <ProfileAvatar avatarId={a.id} size={56} />
          </button>
        ))}
      </div>

      <h4>自称年龄</h4>
      <div className="choice-grid">
        {AGE_OPTIONS.map((o) => (
          <button key={o.value} className={`choice-tile wide ${p.ageClaim === o.value ? 'on' : ''}`} onClick={() => setProfile({ ageClaim: o.value })}>
            <div className="tile-label">{o.label}</div>
            <div className="muted small">{o.note}</div>
          </button>
        ))}
      </div>

      <h4>性格</h4>
      <div className="choice-grid">
        {TRAIT_OPTIONS.map((o) => (
          <button key={o.value} className={`choice-tile wide ${p.traitId === o.value ? 'on' : ''}`} onClick={() => setProfile({ traitId: o.value })}>
            <div className="tile-label">{o.label}（{TRAIT_LABEL[o.value]}）</div>
            <div className="muted small">{o.note}</div>
          </button>
        ))}
      </div>

      <h4>朋友圈自拍</h4>
      <div className="choice-grid">
        {SELFIE_OPTIONS.map((o) => (
          <button key={o.value} className={`choice-tile ${p.selfieId === o.value ? 'on' : ''}`} onClick={() => setProfile({ selfieId: o.value })}>
            <div className="tile-emoji">{o.emoji}</div>
            <div className="tile-label">{o.label}</div>
          </button>
        ))}
      </div>
      <p className="muted small">
        现在挂的是{SELFIE_LABEL[p.selfieId]}（第 {p.selfieDay || '—'} 天发布）。换照片会刷新发布日——新照片三天内，找你的人会变多。
      </p>
    </section>
  );
}
