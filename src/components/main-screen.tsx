import { useGame } from '../store/gameStore';
import { ALL_TARGET_MAP, PERSONA_MAP, targetAwake, isMorningTarget, SELFIE_LABEL, TRAIT_LABEL } from '../engine/state-machine';
import { formatMoney } from '../utils/format';
import { OldManAvatar, PersonaAvatar, ProfileAvatar, AVATAR_PRESETS, PhotoRender, MomentPhoto } from './character-art';
import { playMessage, playSend, playPacket, playFail, playBlocked, playMorning } from '../utils/sound';
import { useEffect, useRef, useState } from 'react';
import { INDUSTRY_COURSE_COST, CHAT_SESSION_COST } from '../data/constants';
import { DAILY_PLANS } from '../data/plans';
import { SELFIE_META, MOMENT_PLAYER_COMMENTS } from '../data/moments';
import { SHOP_ITEMS } from '../data/items';
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

/** v3.0 底部导航 SVG 图标（细线条，深夜 App 质感）。 */
function NavIcon({ name }: { name: ModuleTab }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'today':
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <circle cx="10" cy="11" r="4" />
          <path d="M 10 3.5 L 10 5.5 M 4.4 5.4 L 5.8 6.8 M 15.6 5.4 L 14.2 6.8 M 2.5 15.5 L 17.5 15.5" />
        </svg>
      );
    case 'contacts':
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <circle cx="10" cy="6.6" r="3.1" />
          <path d="M 3.8 16.5 Q 4.6 11.4 10 11.4 Q 15.4 11.4 16.2 16.5" />
        </svg>
      );
    case 'moments':
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <circle cx="10" cy="10" r="2.1" />
          <path d="M 10 3.2 Q 11.6 6.4 10 8 M 16.8 10 Q 13.6 11.6 12 10 M 10 16.8 Q 8.4 13.6 10 12 M 3.2 10 Q 6.4 8.4 8 10 M 14.8 5.2 Q 12.7 7.3 11.5 8.5 M 14.8 14.8 Q 12.7 12.7 11.5 11.5 M 5.2 14.8 Q 7.3 12.7 8.5 11.5 M 5.2 5.2 Q 7.3 7.3 8.5 8.5" />
        </svg>
      );
    case 'history':
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <path d="M 3.5 9.2 Q 3.5 4.6 10 4.6 Q 16.5 4.6 16.5 9.2 Q 16.5 13.8 10 13.8 Q 8.6 13.8 7.4 13.4 L 4.6 15.4 L 5.2 12.7 Q 3.5 11.4 3.5 9.2 Z" />
          <path d="M 7 9.2 L 13 9.2" />
        </svg>
      );
    case 'wallet':
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <rect x="3" y="5.4" width="14" height="10.4" rx="2" />
          <path d="M 3 8.2 L 17 8.2 M 13.2 12.2 L 14.8 12.2" />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 20 20" {...s}>
          <circle cx="10" cy="7" r="3" />
          <path d="M 4.4 16.4 Q 5.2 11.8 10 11.8 Q 14.8 11.8 15.6 16.4" />
          <path d="M 12.6 4.2 Q 14 3.4 14.8 4.8" />
        </svg>
      );
  }
}

/** 计划图标（今天去哪）。 */
const PLAN_ICONS: Record<string, string> = {
  plan_home: '🏠', plan_park: '🌳', plan_gym: '🏃', plan_market: '🛵',
  plan_chess: '♟', plan_square: '🎶', plan_netbar: '🎮', plan_overnight: '🚕',
};

type ModuleTab = 'today' | 'contacts' | 'moments' | 'history' | 'wallet' | 'profile';

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
  // v3.0 昼夜氛围：白天掺暖光，深夜更沉，聊天跟随对象时区。
  const phaseCls =
    state.dayPhase === 'chat'
      ? state.chat && isMorningTarget(ALL_TARGET_MAP[state.chat.targetId])
        ? 'screen-morning'
        : 'screen-night'
      : state.dayPhase === 'morning'
        ? 'screen-morning'
        : 'screen-night';
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
    <div className={`screen main-screen app-shell ${phaseCls}`}>
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
      <div className={`risk-strip ${risk.cls}`}>
        <span>朋友圈</span>
        <span className="risk-meter"><i /></span>
        <span>{risk.text}（{Math.round(state.riskLevel)}%）</span>
      </div>

      {/* 聊天会话永远全屏（模块无关） */}
      {state.dayPhase === 'chat' && state.chat && <ChatView />}

      {state.dayPhase !== 'chat' && (
        <>
          {/* v2.3 手机布局：只有这一块滚动，导航钉死在底部。 */}
          <div className="app-scroll">
            {activeTab === 'today' && <TodayPanel phaseLabel={phaseLabel} />}
            {activeTab === 'contacts' && <ContactsPanel />}
            {activeTab === 'moments' && <MomentsPanel />}
            {activeTab === 'history' && <HistoryPanel />}
            {activeTab === 'wallet' && <WalletPanel />}
            {activeTab === 'profile' && <ProfilePanel />}
            <footer className="stats-row">
              <span>红包 {state.stats.redPacketsReceived} 个</span>
              <span>开口 {state.stats.asksMade} 次</span>
              <button className="log-toggle" onClick={() => setShowLog(!showLog)}>流水</button>
            </footer>
          </div>

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

          {/* v3.0 底部六模块导航（SVG 图标 + 活动指示条） */}
          <nav className="module-nav">
            <button className={activeTab === 'today' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('today')}>
              <span className="nav-ico"><NavIcon name="today" /></span>今天
              {state.incoming.length > 0 && <span className="nav-badge">{state.incoming.length}</span>}
            </button>
            <button className={activeTab === 'contacts' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('contacts')}>
              <span className="nav-ico"><NavIcon name="contacts" /></span>通讯录
            </button>
            <button className={activeTab === 'moments' ? 'nav-btn on' : 'nav-btn'} onClick={() => { setTab('moments'); store.dispatch({ type: 'view_moments' }); }}>
              <span className="nav-ico"><NavIcon name="moments" /></span>朋友圈
              {state.unseenMoments > 0 && <span className="nav-badge">{state.unseenMoments}</span>}
            </button>
            <button className={activeTab === 'history' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('history')}>
              <span className="nav-ico"><NavIcon name="history" /></span>聊天记录
            </button>
            <button className={activeTab === 'wallet' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('wallet')}>
              <span className="nav-ico"><NavIcon name="wallet" /></span>钱包
            </button>
            <button className={activeTab === 'profile' ? 'nav-btn on' : 'nav-btn'} onClick={() => setTab('profile')}>
              <span className="nav-ico"><NavIcon name="profile" /></span>人设
            </button>
          </nav>
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
        <PersonaAvatar personaId={state.personaId} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="persona-line">{state.playerName} · 人设「{persona.name}」</div>
          <div className="bars" style={{ margin: '5px 0 3px' }}>
            <div className="bar energy"><span style={{ width: `${(state.energy / state.energyMax) * 100}%` }} />精力 {state.energy}/{state.energyMax}（一场 {CHAT_SESSION_COST} 点）</div>
            <div className="bar numb"><span style={{ width: `${state.numbness}%` }} />麻木 {state.numbness}% · 良心 {state.conscience}</div>
          </div>
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
          {/* v2.4 回头是岸——不劝退，只是放在这里。 */}
          <p className="muted small center retire-note">
            苦海无边，回头是岸——这句偈不劝你，只是放在这里。
          </p>
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
            <div className="plan-name"><span className="plan-ico">{PLAN_ICONS[p.id] ?? '📍'}</span>{p.name}</div>
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
                <div className="contact-bio">{def.bio}</div>
                <div className="muted small contact-personality">{def.personality}</div>
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

/** 朋友圈（v2.3）：发自拍 + 看他的动态 + 点赞评论。 */
function MomentsPanel() {
  const store = useGame();
  const { state } = store;
  const postedToday = state.moments.some((m) => m.author === 'player' && m.momentDay === state.day);
  const [openComment, setOpenComment] = useState<string | null>(null);
  const nameFor = (id?: string) => (id === 'player' || !id ? '你' : ALL_TARGET_MAP[id]?.name ?? '他');

  return (
    <section className="moments-panel">
      <h3>朋友圈</h3>

      <div className="moment-poster">
        <h4>发一张自拍（每天一条）</h4>
        {postedToday ? (
          <p className="muted small">今天发过了。刷得太勤，看的人多——穿帮的也多。</p>
        ) : (
          <>
            <div className="choice-grid moment-grid">
              {SELFIE_META.map((o) => (
                <button key={o.id} className="choice-tile" title={o.note} onClick={() => store.dispatch({ type: 'post_moment', selfieId: o.id })}>
                  <div className="tile-emoji">{o.emoji}</div>
                  <div className="tile-label">{o.label}</div>
                </button>
              ))}
            </div>
            <p className="muted small">新照片三天内，找你的人会变多。疑心重的，会去翻你的旧动态。</p>
          </>
        )}
      </div>

      <div className="moment-feed">
        {state.moments.length === 0 && <p className="muted small">还没有动态。发一张自拍，或者等他们发。</p>}
        {[...state.moments].reverse().map((m) => {
          const def = m.targetId ? ALL_TARGET_MAP[m.targetId] : null;
          const tstate = m.targetId ? state.targets.find((x) => x.targetId === m.targetId) : undefined;
          const liked = m.likes.includes('player');
          const commented = m.comments.some((c) => c.by === 'player');
          const need = def ? def.need : null;
          return (
            <div key={m.id} className={`moment-card ${m.author}`}>
              <div className="moment-head">
                {m.author === 'player'
                  ? <ProfileAvatar avatarId={state.profile.avatarId} size={36} />
                  : def ? <OldManAvatar target={def} state={tstate} size={36} /> : null}
                <div>
                  <div className="moment-name">{m.author === 'player' ? state.playerName || '你' : def?.name ?? '他'}</div>
                  <div className="muted small">第 {m.momentDay} 天</div>
                </div>
              </div>
              <div className="moment-photo">
                {m.author === 'player' && m.selfieId ? <MomentPhoto selfieId={m.selfieId} /> : m.photoId ? <PhotoRender photoId={m.photoId} /> : null}
              </div>
              <div className="moment-caption">{m.caption}</div>
              {m.likes.length > 0 && <div className="moment-likes">♥ {m.likes.map(nameFor).join('、')}</div>}
              {m.comments.length > 0 && (
                <div className="moment-comments">
                  {m.comments.map((c, i) => (
                    <div key={i} className="moment-comment">
                      <span className="mc-author">{nameFor(c.by === 'player' ? 'player' : c.targetId)}：</span>
                      {c.text}
                    </div>
                  ))}
                </div>
              )}
              {m.author === 'target' && (
                <div className="moment-actions">
                  <button className="btn small" disabled={liked} onClick={() => store.dispatch({ type: 'react_moment', momentId: m.id, kind: 'like' })}>
                    {liked ? '已赞' : '点赞'}
                  </button>
                  <button className="btn small" disabled={commented} onClick={() => setOpenComment(openComment === m.id ? null : m.id)}>
                    {commented ? '已评论' : '评论'}
                  </button>
                </div>
              )}
              {m.author === 'target' && openComment === m.id && !commented && need && (
                <div className="moment-comment-options">
                  <p className="muted small">说点什么？（评论比点赞走心——被看见的人，记很久。）</p>
                  {(MOMENT_PLAYER_COMMENTS[need] ?? []).map((text, i) => (
                    <button key={i} className="option" onClick={() => { store.dispatch({ type: 'react_moment', momentId: m.id, kind: 'comment', text }); setOpenComment(null); }}>
                      {text}
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

/** 钱包：余额 + 商店 + 全部流水。 */
function WalletPanel() {
  const store = useGame();
  const { state } = store;
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

      {/* v2.3 商店：廉价的道具，真实的代价。 */}
      <h4>小卖部</h4>
      <div className="shop-grid">
        {SHOP_ITEMS.map((it) => {
          const owned = it.unique && (state.inventory[it.id] ?? 0) > 0;
          const afford = state.money >= it.price;
          return (
            <div key={it.id} className="shop-card">
              <div className="shop-name">{it.name}</div>
              <div className="shop-desc">{it.desc}</div>
              <div className="muted small shop-flavor">{it.flavor}</div>
              <button
                className={`btn small ${afford && !owned ? 'primary' : ''}`}
                disabled={owned || !afford}
                onClick={() => store.dispatch({ type: 'buy_item', itemId: it.id })}
              >
                {owned ? '已入手' : formatMoney(it.price)}
              </button>
            </div>
          );
        })}
      </div>
      <p className="muted small">买口红的钱，是两个 warming 红包；买那套声卡补光灯，是这个月的目标。花出去的每一块，都记在流水里。</p>

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
                      {m.photoId && (
                        <div className="bubble-photo">
                          <PhotoRender photoId={m.photoId} />
                        </div>
                      )}
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
                {!t.blocked && awake && !chatted && <span className="online-dot" title="在线" />}
              </div>
              <div className={`stage-chip stage-${t.stage}`}>{STAGE_LABEL[t.stage]}</div>
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
    night_guard: '小区保安', designated_driver: '代驾师傅',
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
              {m.photoId && !isTyping && (
                <div className="bubble-photo">
                  <PhotoRender photoId={m.photoId} />
                </div>
              )}
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
              <span className="muted small option-meta">
                <span className={`style-chip style-${o.style}`}>{styleTag(o.style)}</span>
                {o.isAsk && <span className="ask-chip">· 要开口了</span>}
              </span>
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

/** 人设：头像/自称年龄/性格——全部影响他的话术与好感走向。
 *  v3.0：人设不只是皮肤——被动/剧情分岔/代价写在卡上，换人设前看得见后果。 */
function ProfilePanel() {
  const store = useGame();
  const { state } = store;
  const p = state.profile;
  const persona = PERSONA_MAP[state.personaId];
  const setProfile = (patch: Partial<PlayerProfile>) => store.dispatch({ type: 'update_profile', ...patch });
  return (
    <section className="profile-panel">
      <h3>人设档案</h3>
      <p className="muted small">你对外呈现的这个人。换头像、改年龄、调性格——他记住的是同一个你。</p>

      <div className="profile-current">
        <PersonaAvatar personaId={state.personaId} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="profile-current-name">{persona.name} <span className="muted small">{persona.tagline}</span></div>
          {persona.passiveNote && <div className="profile-current-note">被动 · {persona.passiveNote}</div>}
          {persona.hook && <div className="muted small">剧情 · {persona.hook}</div>}
          {persona.risk && <div className="muted small" style={{ color: 'var(--danger)', opacity: 0.85 }}>代价 · {persona.risk}</div>}
        </div>
      </div>

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
      <p className="muted small">
        朋友圈现在挂着{SELFIE_LABEL[p.selfieId]}（第 {p.selfieDay || '—'} 天发布）——发新照片去朋友圈模块。
      </p>
    </section>
  );
}
