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
import { useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { formatMoney } from '../utils/format';
import { ComfortAvatar, ComfortSceneRender } from './comfort-art';
import { Ico } from './icons';
import { playMessage, playSend, playMoney, playTab, playBlocked, playPost, playSocial } from '../utils/sound';
import { COMFORT_CONTACTS, FATHER_MEMORIAL, XIAOMAN } from '../data/comfort';
import { MIRROR_LINES, WALLET_CONTRAST } from '../data/comfort-contrast';
import { BF_PACKET_MAX, MOM_GIFT_MAX } from '../data/comfort';
import type { ComfortContactId, ComfortMessage } from '../types/comfort';

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
function VoiceBubble({ m, name, who }: { m: ComfortMessage; name?: string; who?: 'mother' | 'boyfriend' | 'xiaoman' | 'father' }) {
  if (m.speaker === 'sys') {
    return (
      <div className="cbubble-sys">
        {m.label && <div className="cbubble-sys-label">{m.label}</div>}
        <div>{m.text}</div>
      </div>
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

  return (
    <div className="screen main-screen app-shell comfort-theme">
      <header className="hud">
        <div className="hud-left">
          <span className="day-chip">第 {state.day}/{state.daysLimit} 天</span>
          <span className="comfort-phone-tag">常用手机 · 舒适圈</span>
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

/** 「今天」：事件卡（要/不要、给/不给）+ 镜像行 + 熟人速聊 + 舒适圈事件流。 */
function ComfortToday({ policeToday }: { policeToday: boolean }) {
  const store = useGame();
  const { state } = store;
  const c = state.comfort;
  const mirror = MIRROR_LINES[state.day % MIRROR_LINES.length];
  const comfortLog = state.log.filter((l) => l.kind === 'comfort').slice(-8).reverse();
  const nameOf = (id: ComfortContactId) => COMFORT_CONTACTS[id].handle;

  return (
    <section className="comfort-today">
      {/* 素颜的小满 */}
      <div className="persona-row">
        <ComfortAvatar who="xiaoman" size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="persona-line">
            {state.playerName || XIAOMAN.name} · 常用手机
            {/* 切回工作手机——入口跟人设行走（与主线「变更人设」旁的切机入口同款风格） */}
            <button
              className="persona-change-btn"
              title="崩老头的那部手机——冷色的，聊天耗体力"
              onClick={() => { playTab(); store.dispatch({ type: 'switch_phone' }); }}
            >
              切回工作手机
            </button>
          </div>
          <div className="persona-bio muted small">{XIAOMAN.plainNote}{XIAOMAN.birthNote}</div>
          <div className="muted small">这里的聊天不耗体力——这边的人，不收你的表演费。</div>
        </div>
      </div>

      {policeToday && (
        <div className="comfort-police-card">
          <strong>今天你在派出所录了一天口供。</strong>
          <p className="muted small">民警说，金额不大，先登记备案；再来一次，就不是登记了。工作手机躺在兜里，一夜没敢开机。</p>
        </div>
      )}

      {/* 事件卡：妈的生活费 / 阿凯的红包 / 阿凯要钱 / 嘘寒问暖 */}
      {c.incoming.map((m) => {
        const isTalk = m.kind === 'mom_talk' || m.kind === 'bf_talk';
        const isMom = m.kind === 'mom_gift' || m.kind === 'mom_talk';
        const isDemand = m.kind === 'bf_demand';
        const contactId: ComfortContactId = isMom ? 'mother' : 'boyfriend';
        const tag = m.tone === 'birthday' ? ' · 生日'
          : isTalk ? ' · 语音'
          : m.kind === 'bf_packet' ? ' · 红包'
          : isDemand ? ' · 要钱' : ' · 转账';
        const chatOpen = c.chat !== null;
        return (
          <div key={m.id} className={`comfort-event-card ${m.kind}`}>
            <div className="cec-head">
              <ComfortAvatar who={isMom ? 'mother' : 'boyfriend'} size={36} />
              <div>
                <div className="cec-name">{nameOf(contactId)}{tag}</div>
                <div className="muted small">{m.note}</div>
              </div>
            </div>
            {m.lines.map((l, i) => (
              <VoiceBubble key={i} m={{ speaker: 'them', text: l, voiceSecs: Math.min(58, Math.max(2, Math.ceil(l.length / 4))) }} name={nameOf(contactId)} who={isMom ? 'mother' : 'boyfriend'} />
            ))}
            <div className="cec-actions">
              {isTalk ? (
                <>
                  <button
                    className="btn small primary"
                    disabled={chatOpen}
                    onClick={() => { playMessage(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: true }); }}
                  >
                    {chatOpen ? '（先回完手头这场）' : `回${isMom ? '她' : '他'}（免费聊天）`}
                  </button>
                  <button className="btn small muted-btn" onClick={() => { playBlocked(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: false }); }}>
                    先不回（{isMom ? '她会等到很晚' : '他马上追问'}）
                  </button>
                </>
              ) : isDemand ? (
                <>
                  <button className="btn small primary" onClick={() => { playMoney(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: true }); }}>
                    给他 {formatMoney(m.amount)}（活命钱扣，不够记债）
                  </button>
                  <button className="btn small muted-btn" onClick={() => { playBlocked(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: false }); }}>
                    不给（他会有意见）
                  </button>
                </>
              ) : (
                <>
                  <button className="btn small primary" onClick={() => { playMoney(); store.dispatch({ type: 'comfort_resolve_incoming', incomingId: m.id, accept: true }); }}>
                    收下（+{formatMoney(m.amount)}，进活命钱）
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

      {/* 熟人速聊（不耗体力） */}
      <div className="comfort-quick-chat">
        <h3>家人</h3>
        {(['mother', 'boyfriend'] as ComfortContactId[]).map((id) => {
          const def = COMFORT_CONTACTS[id];
          const gone = id === 'boyfriend' && (c.blockedByBf || c.bfState === 'broken_up');
          return (
            <div key={id} className={`comfort-contact-row ${gone ? 'gone' : ''}`}>
              <ComfortAvatar who={id === 'mother' ? 'mother' : 'boyfriend'} size={40} />
              <div className="ccr-body">
                <div className="ccr-name">{def.handle}</div>
                <div className="muted small">{gone ? '（他把你删了。）' : def.signature}</div>
              </div>
              {!gone && (
                <button className="btn small primary" onClick={() => { playMessage(); store.dispatch({ type: 'comfort_open_chat', contactId: id }); }}>
                  发消息
                </button>
              )}
            </div>
          );
        })}
        <p className="muted small">跟家人聊天不要钱（精力）——可你一天里留给这部手机的时间，总是最少。</p>
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

      <button className="btn wide" onClick={() => store.dispatch({ type: 'sleep' })}>
        睡了（进入明天）
      </button>
    </section>
  );
}

/** 通讯录：父亲（置灰纪念位）、妈、男友。 */
function ComfortContacts() {
  const { state } = useGame();
  const c = state.comfort;
  const [dadOpen, setDadOpen] = useState(false);
  const bfGone = c.blockedByBf || c.bfState === 'broken_up';

  return (
    <section className="comfort-contacts">
      <h3>通讯录（3 人）</h3>
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
      {/* 男友 */}
      <div className={`comfort-contact-row ${bfGone ? 'gone' : ''}`}>
        <ComfortAvatar who="boyfriend" size={44} />
        <div className="ccr-body">
          <div className="ccr-name">{COMFORT_CONTACTS.boyfriend.handle}（{COMFORT_CONTACTS.boyfriend.name} · {COMFORT_CONTACTS.boyfriend.age}岁）{bfGone ? ' · 已拉黑' : ''}</div>
          <div className="muted small">{bfGone ? '（长期离线）' : COMFORT_CONTACTS.boyfriend.signature}</div>
          <div className="comfort-contact-bio">{COMFORT_CONTACTS.boyfriend.bio}</div>
          {!bfGone && <div className="muted small">感情 {Math.round(c.love)} · 给过你 {formatMoney(c.bfGiven)} · 从你这儿拿走 {formatMoney(c.bfTaken)}</div>}
          {bfGone && <div className="comfort-contact-bio muted">他卷走了活命钱里剩下的每一块，连同他游戏里那个"满姐"的聊天记录。你被他拉黑了——常用手机里，这行灰色的名字删不删，你还没想好。</div>}
        </div>
      </div>
      <p className="muted small">爸的名字一直置着灰。妈说，留着吧，就当这个号还在等他上线。</p>
    </section>
  );
}

/** 朋友圈：励志/晒家/晒恩爱三选一 + 妈和男友的互动。 */
function ComfortMoments() {
  const store = useGame();
  const { state } = store;
  const c = state.comfort;
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
          const nameOf = (by: string) => by === 'me' ? (state.playerName || '小满') : by === 'mother' ? '妈' : by === 'boyfriend' ? COMFORT_CONTACTS.boyfriend.handle : by;
          const ava = m.author === 'me' ? <ComfortAvatar who="xiaoman" size={36} /> : <ComfortAvatar who={m.author === 'mother' ? 'mother' : 'boyfriend'} size={36} />;
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
                  <button className="btn small" disabled={liked} onClick={() => { playSocial(); store.dispatch({ type: 'comfort_react_moment', momentId: m.id, kind: 'like' }); }}>
                    {liked ? '已赞' : '点赞'}
                  </button>
                  <button className="btn small" disabled={commented} onClick={() => { playSocial(); store.dispatch({ type: 'comfort_react_moment', momentId: m.id, kind: 'comment' }); }}>
                    {commented ? '已评论' : '评论'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="muted small">常用手机的朋友圈没有穿帮风险——这边的人本来就都认识彼此。妈一条条看，男友抢第一个赞。</p>
    </section>
  );
}

/** 聊天记录：和妈/男友的归档（语音条样式）。 */
function ComfortHistory() {
  const { state } = useGame();
  const c = state.comfort;
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const nameOf = (id: ComfortContactId) => COMFORT_CONTACTS[id].handle;
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
                <span className="history-name">{nameOf(a.contactId)}</span>
                <span className="muted small">{a.transcript.length} 条 · {openIdx === realIdx ? '收起' : '展开'}</span>
              </button>
              {openIdx === realIdx && (
                <div className="history-transcript">
                  {a.transcript.map((m, j) => (
                    <VoiceBubble key={j} m={m} name={nameOf(a.contactId)} who={a.contactId} />
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
      <p className="muted small">
        妈的一次生活费 {formatMoney(MOM_GIFT_MAX)} 封顶，是她在别人家厨房跪四个钟头换的；
        阿凯的红包最多 {formatMoney(BF_PACKET_MAX)}，是哪个阿姨的晚安换的——他没说，你也没问。
      </p>
    </section>
  );
}

/** 舒适圈聊天视图：语音条气泡流 + 回复选项（无打字机、无精力、无警惕）。 */
function ComfortChatView() {
  const store = useGame();
  const { state } = store;
  const c = state.comfort;
  const chat = c.chat!;
  const name = chat.contactId === 'mother' ? '妈' : COMFORT_CONTACTS.boyfriend.handle;
  const streamRef = useRef<HTMLDivElement>(null);
  streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight });

  return (
    <section className="chat-panel comfort-chat">
      <header className="chat-header">
        <ComfortAvatar who={chat.contactId === 'mother' ? 'mother' : 'boyfriend'} size={36} />
        <div>
          <div className="target-name">{name}</div>
          <div className="muted small">{chat.contactId === 'mother' ? `家庭 ${Math.round(c.family)} · 免费（不耗精力）` : `感情 ${Math.round(c.love)} · 免费（不耗精力）`}</div>
        </div>
      </header>
      <div className="chat-stream" ref={streamRef}>
        {chat.transcript.map((m, i) => (
          <VoiceBubble key={i} m={m} name={name} who={chat.contactId} />
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
