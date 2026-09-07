import { useGame } from '../store/gameStore';
import { ENDINGS } from '../data/endings';
import { formatMoney } from '../utils/format';
import { playEnding } from '../utils/sound';
import { PERSONA_MAP } from '../engine/state-machine';
import { finalEpilogues, epilogueFor } from '../engine/epilogues';
import { OldManAvatar } from './character-art';
import { PERSONA_EPILOGUE } from '../data/personas';
import { ENDING_EPIGRAPHS, TRIGGER_GATHAS } from '../data/gathas';
import { GathaBlock } from './gatha-block';
import { useEffect } from 'react';

export function EndingScreen() {
  const store = useGame();
  const { state } = store;
  const ending = ENDINGS.find((e) => e.id === state.endingId) ?? ENDINGS[ENDINGS.length - 1];
  useEffect(() => { playEnding(); }, []);

  return (
    <div className="screen ending-screen">
      <h2 className="ending-title">{ending.title}</h2>
      {/* v2.4 结局卷首偈——标题与正文之间，善恶各有其报的一句。 */}
      {ENDING_EPIGRAPHS[ending.id] && (
        <GathaBlock gatha={ENDING_EPIGRAPHS[ending.id]} className="ending-epigraph" />
      )}
      <div className="ending-body">
        {ending.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>

      <div className="ledger">
        <h3>这个月的账</h3>
        <div className="ledger-grid">
          <div><span>收到的钱</span><strong>{formatMoney(state.stats.totalEarned)}</strong></div>
          <div><span>目标</span><strong>{formatMoney(state.goal)}</strong></div>
          <div><span>红包</span><strong>{state.stats.redPacketsReceived} 个</strong></div>
          <div><span>开口要钱</span><strong>{state.stats.asksMade} 次</strong></div>
          <div><span>麻木</span><strong>{state.numbness}%</strong></div>
          <div><span>良心</span><strong>{state.conscience}</strong></div>
        </div>
      </div>

      {/* v3.0 人设尾声——同一个月，不同人设的人是怎么走过来的。 */}
      <div className="persona-epilogue">
        <h3>这个月，你演的是谁</h3>
        {(PERSONA_EPILOGUE[state.personaId] ?? []).map((line, i) => <p key={i}>{line}</p>)}
      </div>

      <div className="target-epilogue">
        {/* v4.1 结局归档：认识的人的最后一行账——头像 × 总转账 × 状态（P1-2）。
            v4.1.2 修复：旧实现只查主五人的 TARGET_MAP——偶遇入册的库人物
            （代驾韩叔、钓友老周……）就算给过钱也不出现，与下方「他们后来」
            的全量口径打架。改走 finalEpilogues 的全量解析：谁认识，谁入账。 */}
        <h3>认识的人的最后一行账</h3>
        <div className="final-roster">
          {finalEpilogues(state).map(({ def, t }) => {
            const status = t.blocked
              ? '把你删了'
              : t.totalReceived >= 1000
                ? '掏空了'
                : t.totalReceived > 0
                  ? '还在等你上线'
                  : t.trust >= 60
                    ? '一分钱没给过——他在等的不是这个'
                    : '刚认识';
            return (
              <div key={t.targetId} className="final-roster-row">
                <OldManAvatar target={def} state={t} size={36} />
                <div className="final-roster-main">
                  <strong>{def.name}</strong>
                  <span className={`final-status ${t.blocked ? 'gone' : ''}`}>{status}</span>
                </div>
                <div className="final-roster-num">
                  <strong>{t.totalReceived > 0 ? formatMoney(t.totalReceived) : '—'}</strong>
                  <span>{t.timesPaid > 0 ? `${t.timesPaid} 笔` : '0 笔'}</span>
                </div>
              </div>
            );
          })}
        </div>
        <h3>他们后来</h3>
        {/* v4.1.1 修复：改走 finalEpilogues（认识过的人 + 全量映射解析）——
            旧实现用只有主五人的 TARGET_MAP 查全部 50 个 target，
            任何一局走到结局屏都在第一个库人物上 undefined 白屏。 */}
        {finalEpilogues(state).map(({ def, t }) => (
          <p key={t.targetId}>
            {epilogueFor(def, t)}
          </p>
        ))}
        {state.flags.saw_mirror && (
          <p className="mirror-note">
            那条评论区的阿姨后来又给你发过一条：「闺女，我不怪你。我就想知道，我老伴那三万八，够不够他现在在养老院吃口热的。」你没回。这条你也删不掉。
          </p>
        )}
      </div>

      {/* v2.2 终章——编者按式的社会视角收束。 */}
      <div className="ending-essay">
        <h3>终章：不只是「崩老头」</h3>
        <p>
          这个游戏讲的是骗局，但它想说的不止是骗局。故事的两侧，站着两群被困住的人——
          一群被钱困住，一群被孤独困住。把他们推向彼此的，从来不是某一次「在吗」，
          而是各自身后那些更大的东西。
        </p>
        <p>
          <strong>先说她。</strong>二十四岁，四千块的工资，四千块的城市。母亲一场病，
          手机上点几下就欠出的网贷——这不是她一个人的草率，是一整代年轻人共享的算术题：
          劳动换来的钱，追不上生活开出的账单。当诚实劳动不能兑现体面，
          总有人会用另一种「劳动」补上差价。她当然是加害者，但在她身后，
          站着把利息做成人血馒头的那套东西。批判她的选择是容易的；
          难的是回答：如果她是你的女儿，你想让她在哪个环节被接住？——是在网贷广告
          投进校园的那天，还是在四千块的工资到账的那天？
        </p>
        <p>
          <strong>再说他们。</strong>五个老头不是五个傻子。他们是退休的教师、下岗的工人、
          独居的父亲、婚姻名存实亡的老板。他们能一眼看出菜市场哪个秤不准，
          却看不出一张美颜照片——不是他们蠢，是这一代人没上过这堂课。
          他们成长的世界里，信任是熟人社会的出厂设置，不需要验证。
          他们老了，世界忽然要求人人自证清白，没人给他们补这门课。
          更深的一层是孤独本身：城市化把三代人拆进了三座城市，单位制散了，
          老邻居拆了，老伴走了，孩子在远方过着他们插不上手的生活。
          「凌晨三点，哥哥」——那声「哥哥」买到的从来不是爱情，是有人听他把话说完。
        </p>
        <p>
          <strong>这门生意为什么存在？</strong>因为孤独本身已经是一门产业——
          崩老头只是它最坏的一种。代聊群、情感陪聊、虚拟恋人、哄睡主播……
          付费买陪伴的名单越来越长，说明这个社会有一种需求，量大，真实，
          却始终得不到正视和正经的供给。需求不会消失，只会改道。你不给它河床，
          它就自己冲出一条浑的。骗子是最先闻到水的人，但水本来就在那里。
        </p>
        <p className="essay-close">
          「崩老头」不是一个人的病，是一代人的孤独，撞上了另一代人的困境。
          所以解决它，从来不只是抓几个人、封几个号的事：得让劳动挣的钱配得上体面，
          让年轻人不必在深夜里做那道算术题；得让社区里有个地方，让老头们白天有棋下、
          有人说话；得有人手把手教他们，什么照片是假的，什么「在吗」背后是刀；
          也得承认：陪伴是刚需，它需要正经的、不丢人的出口。
          在这些河床修好之前，凌晨三点，还会有下一个「哥哥」——
          也还会有下一个不得不按下「接受」的手指。
        </p>
        {/* v2.4 编者按收音——河床不会自己长出来，灯得有人点。 */}
        <GathaBlock gatha={TRIGGER_GATHAS.essay_close} className="essay-gatha" />
      </div>

      <div className="ending-actions">
        <button className="btn primary" onClick={() => store.reset()}>再过一个月</button>
        <button className="btn" onClick={() => store.dispatch({ type: 'continue_playing' })}>再撑十天</button>
      </div>
      <p className="muted small center">
        现实里，这件事有个名字，叫诈骗。老人手里那点钱，是他们最后的体面。
      </p>
    </div>
  );
}
