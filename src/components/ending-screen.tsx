import { useGame } from '../store/gameStore';
import { ENDINGS } from '../data/endings';
import { formatMoney } from '../utils/format';
import { playEnding } from '../utils/sound';
import { TARGET_MAP } from '../engine/state-machine';
import { useEffect } from 'react';
import type { Target } from '../types/target';
import type { TargetState } from '../types/target';

/** 每个老头一段后记——结局画廊的核心。按角色声口分化，不共用模板。 */
function epilogueFor(def: Target, t: TargetState): string {
  const total = formatMoney(t.totalReceived);
  // 终局态优先：走了 / 拉黑了，声口照旧，只是事没了。
  if (t.ended === 'walked_away') {
    switch (def.id) {
      case 'lao_li': return '老李没再接过你的单。有天下大雨，你在路口看见一辆顶灯亮着的空车，司机看着前面，没看你。';
      case 'zhou_teacher': return '周老师把你的微信备注改回了全名。他没删你——老师不做绝。只是挂钟响的时候，他不再拿手机了。';
      case 'boss_wang': return '王总的车库里，烟照抽，手机照刷。有天他手滑点开了你的头像，盯了一会儿，锁屏，上楼。生意人，止损。';
      case 'hao_ge': return '阿豪给你发了最后一个"6"，然后头像就灰了。网吧通宵的人，下线从来不打招呼。';
      case 'chen_gong': return '陈工最后一条消息带编号：' + '「7. 终。台账我核过了。不欠你的。」然后他就没有然后了。';
      default: return `${def.name} 没有再回复过你。`;
    }
  }
  if (t.blocked) {
    switch (def.id) {
      case 'lao_li': return '老李的头像灰了。他手机里还存着你说"叔叔注意腰"那条，没舍得删，也不会再看。';
      case 'zhou_teacher': return '周老师的头像灰了。他给你留过一句"闺女，早点睡"，停在你俩聊天的最后一屏。';
      case 'boss_wang': return '王总的头像灰了。他朋友圈还在更新励志语录，一条比一条长，一条比一条没人点赞。';
      case 'hao_ge': return '阿豪的头像灰了。"键盘"还蹲在柜台上，等着有人开机。';
      case 'chen_gong': return '陈工的头像灰了。阳台那台1992年的台钳，这周没人擦。';
      default: return `${def.name} 的头像灰了。`;
    }
  }
  // 还在的人：按信任档位，各自的样子。
  const high = t.trust >= 75;
  const mid = t.trust >= 30;
  switch (def.id) {
    case 'lao_li':
      return high
        ? `老李还在夜里十一点收车后找你。他说等天暖了带你去水库钓鱼——他知道那不可能，你就是他的夜班电台。这个月他一共给了你 ${total}，他觉得这钱花得比修车值。`
        : mid
          ? '老李偶尔还在晚上发来一句"跑了趟长途，堵"。回不回，你自己看。'
          : '老李大概是想明白了。也可能没想明白——他只是不发了。收音机还开着，屋里还有个声。';
    case 'zhou_teacher':
      return high
        ? `周老师每天早上五点半醒，第一件事是看你的头像亮没亮。他管你叫闺女，你管他叫周老师，这个月他一共给了你 ${total}——他的退休金不多，但花在这上面，他觉得比买保健品强。`
        : mid
          ? '周老师还给你发他写的字。你三天没回，他也照发。老师批改作业，从不迟到。'
          : '周老师的挂钟还是那么响。他后来没再发日记给你，倒是社区书法班多收了个学生。';
    case 'boss_wang':
      return high
        ? `王总还是每天在车库待四十分钟。他跟你说生意难做，跟老婆说挺好的，跟你说的是真的。这个月他一共给了你 ${total}，账是他自己偷偷记的，反正没人查他。`
        : mid
          ? '王总的朋友圈还在发励志语录。你在底下点了个赞，他没回——但那晚他的车在车库里熄火熄得很晚。'
          : '王总想明白了。生意人最懂止损，只是这一单，他亏的说不出口。';
    case 'hao_ge':
      return high
        ? `阿豪还留着你的微信置顶。网吧的机器从四十台降到二十六台，他跟你说"这把还没输"。这个月他一共给了你 ${total}，比他一个月的利润还多。他自己吃泡面不加蛋。`
        : mid
          ? '阿豪偶尔发来一句"上号吗"。你不接，他也懂。网吧这行，早晚会散。'
          : '阿豪不找你了。他大概是这五个人里唯一想明白得快的——90后，下线快。';
    case 'chen_gong':
      return high
        ? `陈工还给你发带编号的消息，错别字都改好了。他说等儿子从德国回来，介绍你认识——你是他清单里"人"那一栏的最后一条。这个月他一共给了你 ${total}，账目他记得比你还清。`
        : mid
          ? '陈工还在发图纸给你。你看得懂一半，他不在乎，有人收就行。'
          : '陈工大概把你的备注改成编号了。他自己就是一套编号系统，删除一项，不响。';
    default:
      return high
        ? `${def.name} 还在原来的时间上线，这个月一共给了你 ${total}。他觉得值。`
        : mid
          ? `${def.name} 头像还亮着。老时间，老地方，照旧。`
          : `${def.name} 大概想明白了什么。也可能什么都没想明白——他只是不问了。`;
  }
}

export function EndingScreen() {
  const store = useGame();
  const { state } = store;
  const ending = ENDINGS.find((e) => e.id === state.endingId) ?? ENDINGS[ENDINGS.length - 1];
  useEffect(() => { playEnding(); }, []);

  return (
    <div className="screen ending-screen">
      <h2 className="ending-title">{ending.title}</h2>
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

      <div className="target-epilogue">
        <h3>他们后来</h3>
        {state.targets.map((t) => {
          const def = TARGET_MAP[t.targetId];
          return (
            <p key={t.targetId}>
              {epilogueFor(def, t)}
            </p>
          );
        })}
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
