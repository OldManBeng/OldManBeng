# 实施计划：底部导航重构 + 朋友圈系统 + 钱包道具商店

## 任务 1：模块重排 + 手机底部 Tab 栏（固定不随滚动）

**改动文件：** `src/components/main-screen.tsx` + `src/styles.css`

**现状：** 5 个模块（今天/通讯录/钱包/聊天记录/人设）tab 已存在，但 `.screen` 整体滚动，nav 跟着滚。

**新结构：** MainScreen 根节点加 `app-shell` 类，改为三段式手机布局——HUD（顶部固定）/ 滚动内容区 / Tab 栏（底部固定）：

```tsx
<div className="screen main-screen app-shell">
  <header className="hud">…</header>
  <div className="risk-strip">…</div>
  {dayPhase === 'chat' ? <ChatView /> : (
    <>
      <div className="app-scroll">   {/* 只有这块滚动 */}
        {activeTab === 'xxx' && <XxxPanel />}
        {showLog && <LogOverlay />}
        <footer className="stats-row">…</footer>  {/* 移入滚动区 */}
      </div>
      <nav className="module-nav">…</nav>   {/* 永远钉在底部 */}
    </>
  )}
</div>
```

**CSS：** `.app-shell { overflow: hidden; padding: 12px 12px 0; }`（覆盖 .screen 的滚动），`.app-scroll { flex: 1; min-height: 0; overflow-y: auto; padding-bottom: 14px; }`，`.module-nav { margin: 0 -12px; padding: 6px 10px calc(6px + env(safe-area-inset-bottom)); border-radius: 12px 12px 0 0; border-width: 1px 0 0 0; }`。tab 栏不需要 position: fixed/sticky——它就是滚动区外的最后一个 flex 子元素，天然钉底。其他屏幕（标题/结局/序章）不受影响。

**Tab 顺序（6 个）：** 今天 ◐ → 通讯录 ☰ → **朋友圈 ⊛（新增）** → 聊天记录 ❝ → 钱包 ¥ → 人设 ☺。朋友圈 tab 带 `nav-badge`：老头未看过的评论数。

---

## 任务 2：朋友圈系统（新模块 + 自拍迁移 + 互动 + 增益）

### 2a. 数据模型

**`src/types/game.ts`**：
```ts
export type SelfieId = 'cake'|'gym'|'pool'|'cat'|'grind'|'travel'|'boba'|'sick';
export const SELFIE_IDS: SelfieId[] = [...8个];  // 测试与 UI 共用
export interface MomentComment { by: 'player'|'target'; targetId?: string; text: string; }
export interface MomentPost {
  id: string; momentDay: number; author: 'player'|'target'; targetId?: string;
  selfieId?: SelfieId;          // 玩家自拍类型
  photoId?: string;             // 老头发图的 photoId（复用 PHOTO_SCENES）
  caption: string;
  likes: string[];               // 点赞者 targetId
  comments: MomentComment[];
}
```
- `GameState` 加 `moments: MomentPost[]`（上限 80，超出 shift）+ `seenComments: number`（红点计数）
- `GameAction` 加 `post_moment {selfieId}` / `react_moment {momentId, kind:'like'|'comment', text?}`
- `LedgerEntry.kind` 不动（朋友圈不产生钱）

**`src/data/moments.ts`（新文件）：**
- `SELFIE_META`：8 种自拍 {id, label, emoji}：蛋糕照🍰 / 夜跑照🏃 / 泳池照🏊 / 橘猫照🐈 / **加班照💻（晒努力）/ 旅游照⛰ / 奶茶咖啡照🧋 / 病床输液照🩹（新确认）**
- `MOMENT_CAPTIONS: Record<SelfieId, string[]>`：玩家发圈的配文池（各 3 条，口语化真实朋友圈体）
- `MOMENT_TARGET_POSTS`：老头发圈的素材——主五人复用各自 2 张 photoId、按原型挂 caption 池；库 5 原型复用各自 arch photoId + caption 池（钓到鱼的/今晚棋摊赢了两把/广场舞新曲目之类）
- **增益效果表（用户要求：朋友圈产生信任/怀疑正负增益）：**
  - `MOMENT_EFFECT: Record<Need, {trust, wariness}>` 按情感缺口分档——daughter_figure（周老师）看输液照 trust +3；listened_to +2；desired +2 且 wariness +1（越看越想要见面）；respected +1（不咸不淡）
  - **怀疑线：** `trait` 含 `suspicious`（王总/陈工）或 wariness ≥ 40 的老头 → 换用 `MOMENT_SUSPICION` 话术池 + **trust −1 / wariness +3~5**（「你上个月还在旅游，这个月就输液？」——朋友圈穿帮的显微镜）
- `MOMENT_REACTIONS / MOMENT_SUSPICION: Record<Need, string[]>`：老头评论玩家朋友圈的话术（按 need 分 4 档，各 4 条，符合各原型声音：老李朴素/周老师书面/王总傲慢/陈工条目式/库按原型）
- `MOMENT_PLAYER_COMMENTS: Record<Need, string[]>`：玩家评论老头朋友圈的话术（按 need 4 档，各 4 条 → trust +1，评论比点赞更走心）

### 2b. 引擎接线

**`src/engine/state-machine.ts`：**
1. `SELFIE_LABEL` 扩到 8 条（`{selfie}` 占位符兼容——`fillProfileVars` 已有回退，8 种全给标签）
2. `case 'post_moment'`：当天已发 → no-op；否则 push 玩家 moment（id 用 `m{day}`、caption 从池抽）、`profile.selfieId/selfieDay` 同步更新（**人设里的自拍机制整体迁入这里**，`update_profile` 保留头像/年龄/性格三参数）、log 记录
3. `case 'react_moment'`：对老头贴点赞（likes.push，trust +1）或评论（comments.push，trust +1）；每个老头每条限评一次
4. `runMorning` 里老头对玩家新发自拍的反应（与既有 selfie incoming 机制分层，不互相替代）：
   - 已发现、未拉黑、随机 2-4 个老头给昨天玩家发的圈点赞/评论；按 MOMENT_EFFECT / 怀疑线结算 trust/wariness（clamp 保持 0-100）
   - **评论区撞车**：同一条玩家朋友圈收到 ≥3 个不同老头评论 → `riskLevel +6`，log「朋友圈的评论区里，他看见了另一个他。」（穿帮机制的自然延伸）
   - 每天早上随机 1 个已发现老头发一条自己的朋友圈（素材从 MOMENT_TARGET_POSTS 抽）
5. `createInitialState` / `new_game` 重置块 / `gameStore.migrate()` 三处补 `moments: []`、`seenComments: 0`

### 2c. 自拍 SVG 场景图

**`src/components/character-art.tsx`** 加 `SELFIE_SCENES: Record<SelfieId, ReactElement>` + `MomentPhoto({selfieId})` 组件：8 张程序化 SVG（200×150）——蛋糕（蜡烛+奶油层）/夜跑（跑道+路灯剪影）/泳池（水波纹+浮圈）/橘猫（猫耳+尾巴弧线）/**加班（笔记本屏光+咖啡杯）/旅游（山形+落日+公路）/奶茶（吸管+珍珠圆点）/病床输液（病床+吊瓶架+输液管线）**。零图片资源，与既有 PHOTO_SCENES 同风格。

### 2d. MomentsPanel UI

**`src/components/main-screen.tsx`** 新增 `MomentsPanel`：
- 顶部发布区：8 格类型瓷砖（emoji+label），点选直接 dispatch `post_moment`（每天一次，已发显示今日已发）
- Feed 倒序流：每张卡片 = 头像（OldManAvatar/ProfileAvatar）+ 名字 + 第 N 天 + 配图（MomentPhoto 或 PhotoRender）+ 配文 + 点赞/评论区
- 玩家的圈：展示老头们的评论与点赞（红点计数喂给 nav-badge）
- 老头的圈：两个按钮「点赞」「评论」——评论点开内联输入框 → dispatch react_moment
- ProfilePanel 删掉 SELFIE_OPTIONS 自拍选择区（迁入朋友圈），保留头像/年龄/性格

---

## 任务 3：钱包道具商店

### 3a. 道具数据

**`src/data/items.ts`（新文件）：** `SHOP_ITEMS: ShopItem[]`，`ShopItem { id, name, price, desc, effect }`：

| 道具 | 价格 | 效果（挂真实系统） |
|------|------|------|
| 能量饮料（红瓶） | ¥9 | 当天精力 +4 |
| 速溶咖啡 | ¥18 | 当天精力 +8 |
| 奶茶（大杯） | ¥16 | 当天精力 +5，麻木 −3（甜的东西让人清醒一点） |
| 地摊口红 | ¥25 | 下一次对话好感结算 +4（用完即止的一次性加成） |
| 廉价首饰（会掉色的手链） | ¥58 | 之后每场对话好感结算 +1（持续到月底——廉价但有光） |
| 修图 App 会员（月卡） | ¥30 | 30 天内：发朋友圈后老头来找你私聊的概率 +0.1 |
| 迷你充电宝 | ¥45 | 当天深夜聊天精力消耗 4→3 |
| 网红套餐（声卡+补光灯） | ¥780 | 精力上限 16→24（永久），风险 +10——欲望的天花板，买得起就停不下来了 |

定价刻意压在「奶茶钱能买、顶配一个月工资买不起」的档位，呼应红包层级（warming ~24 元/trusted ~35 元）——买首饰 = 两个红包；买网红套餐 = 放弃这个月目标。

### 3b. 引擎接线

**`src/engine/state-machine.ts`：**
- `GameState` 加 `inventory: Record<string, number>`（四处补默认值：类型/createInitialState/new_game/migrate）
- `case 'buy_item'`：钱不够或已购唯一道具 → **no-op（返回原 clone，JSON 不变，沿用聊天满精力的约定）**；否则 `money -= price`、`ledgerAdd(…, 'shop')`（**`LedgerEntry.kind` 加 `'shop'`**）、即时型当场生效、持久型写 inventory
- 挂点：`applyAffinity` 尾部读 inventory 结算首饰+口红；`runMorning` 精力回填行改 `state.energy = state.energyMax`（修掉写死 `ENERGY_MAX` 常量的隐患，网红套餐上限才能生效）；聊天扣精力处经 `chatCost(s)` 工具函数（充电宝当天 −1）；runMorning 的 selfie incoming 概率处 + 会员加成
- `ShopItem.effect` 描述文案走 log（买咖啡当天 log「咖啡因起效，今晚还能再撑一会儿。」）

### 3c. 商店 UI

**WalletPanel** 流水列表上方加 `.shop-section`：道具卡网格（名称/价格/一句话效果+风味描述/购买按钮）。钱不够或已拥有的按钮置灰；购买后钱款进流水（kind: 'shop'）。HUD 余额已可见，无需重复。

---

## 测试与收尾

**更新既有测试（新内容纳入门禁）：**
- `simulation.test.ts:268/275` 两个内容 blob 加入 `MOMENT_CAPTIONS / MOMENT_TARGET_POSTS / MOMENT_REACTIONS / MOMENT_SUSPICION / MOMENT_PLAYER_COMMENTS / SHOP_ITEMS / SELFIE_META`——新话术受禁词扫描约束
- `v2-systems.test.ts:342` 的 `['cake','gym','pool','cat'].length === 4` 断言改为 `SELFIE_IDS.length === 8`（'pool' 等既有用法不动）

**新增 `src/engine/__tests__/moments-shop.test.ts`：**
- 朋友圈：每天只能发一条（第二次 post no-op）；feed 上限；老头反应落 trust/wariness 且 clamp；怀疑线走 suspicious 池；玩家评论老头圈 trust +1；评论区 ≥3 人 → riskLevel +6；8 种自拍全有 label/配文/SVG 场景
- 商店：钱款精确入账（`money === before − price`）+ ledger 'shop' 条目；钱不够 no-op（JSON 深等）；咖啡精力 +8；首饰挂 applyAffinity；网红套餐 energyMax=24 且次日回填 24 而非 16；充电宝当天聊天扣 3
- 模拟器 bot（simulation.test.ts 的 autoPlay）不发圈不购物，走既有路径 → 61 个旧测试断言不受影响

**收尾验证：** `npx tsc --noEmit` 零错 → `npx vitest run` 全绿（旧 61 + 新增）→ `npm run build` 成功。

## 不改动的部分
- 话术引擎核心（dispatch 纯函数、askChance/红包结算曲线、balance.test 的数值契约）
- 既有自拍 incoming 机制（SELFIE_LINGER_DAYS=3、on_selfie 池照旧，朋友圈反应是新增层不替代）
- 头像/照片/序章/终章等上一轮全部产出
- 女主角 6 款头像预设、人设卡
