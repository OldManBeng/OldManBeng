# 实施计划：头像置灰 + 全新头像系统 + 照片消息 + 序章/终章

## 任务 1：已下线老头头像置灰

**改动文件：** `src/components/character-art.tsx`

`OldManAvatar` 组件已经接收 `state?: TargetState`，且 `state.blocked` 可读。在 SVG 根节点上条件加 `filter: grayscale(1) opacity(0.4)` 即可——不用改任何调用方。

```tsx
// character-art.tsx OldManAvatar 函数内
const blocked = state?.blocked ?? false;
return (
  <svg
    width={size} height={size} viewBox="0 0 54 54" role="img" aria-label={target.name}
    style={blocked ? { filter: 'grayscale(1) opacity(0.4)' } : undefined}
  >
```

**验证：** 现有 CSS `.contact-row.blocked { opacity: 0.45 }` 和 `.target-card.blocked { opacity: 0.5 }` 保留（容器层降透明度），SVG 自身 grayscale 补齐"灰色头像"视觉。手动拉黑一个老头看通讯录和卡片头像变灰。

---

## 任务 2：全新头像系统（混合方案）

### 2a. 扩展 portraitSpec 类型

**文件：** `src/types/target.ts`

在现有 `portraitSpec` 接口上扩展字段（保持旧字段兼容）：

```ts
portraitSpec: {
  hair: number;
  hairColor: string;
  glasses: number;
  beard: number;
  cheeks: number;
  shirtColor: string;
  // ---- v2.2 新增 ----
  /** 头像背景场景类型：决定 SVG 背景图层 */
  bgScene: 'night_road' | 'study' | 'garage' | 'internet_cafe' | 'balcony'
    | 'guard_booth' | 'fishing' | 'chess' | 'square' | 'roadside' | 'default';
  /** 配饰图标类型：在头像角落画一个小图标 */
  accessory: 'steering_wheel' | 'calligraphy_brush' | 'cigarette' | 'gamepad'
    | 'wrench' | 'flashlight' | 'fishing_rod' | 'chess_piece' | 'speaker' | 'helmet' | 'none';
  /** 头像色调（背景渐变用） */
  accent: string;
};
```

### 2b. 重写 OldManAvatar 渲染器

**文件：** `src/components/character-art.tsx`

重写 `OldManAvatar` 函数，按三层渲染：
1. **背景层**——按 `bgScene` 画一个简化场景 SVG（深夜公路=深蓝渐变+路灯黄点、书房=暖黄灯+书架线条、车库=暗灰+车窗轮廓、网吧=蓝屏光、阳台=花盆+栏杆等）
2. **人脸层**——保留现有 portraitSpec 面部渲染逻辑（发际线/眼镜/胡须/表情）
3. **配饰层**——按 `accessory` 在角落画小图标（方向盘圆环、毛笔竖线、烟头白点、手柄方块等）

关键：背景和配饰用极简几何图形（3-5 个 path/circle），不追求写实，追求辨识度。

### 2c. 为每人配独特参数

**文件：** `src/data/targets.ts`（主五人）+ `src/data/target-library.ts`（库 45 人）

主五人每人独立配置 bgScene + accessory + accent：

| 角色 | bgScene | accessory | accent | 设计逻辑 |
|------|---------|-----------|--------|----------|
| 老李 | night_road | steering_wheel | #4a5d6e | 深夜公路+方向盘=出租车司机身份 |
| 周老师 | study | calligraphy_brush | #7a6f5f | 书房+毛笔=退休教师 |
| 王总 | garage | cigarette | #8a4a3a | 车库+烟头=深夜独处的中年老板 |
| 阿豪 | internet_cafe | gamepad | #3d6b5e | 网吧蓝光+手柄=90后网吧老板 |
| 陈工 | balcony | wrench | #5a6d7a | 阳台台钳+扳手=退休工程师 |

库 45 人按原型分化（5 原型各 9 人），每原型共享 bgScene + accessory 但 accent 色微调：

| 原型 | bgScene | accessory | accent |
|------|---------|-----------|--------|
| night_guard | guard_booth | flashlight | #3a4a5a |
| designated_driver | roadside | helmet | #6a5a3a |
| fisherman | fishing | fishing_rod | #4a6a4a |
| chess_uncle | chess | chess_piece | #6a5a4a |
| square_dancer | square | speaker | #8a3a5a |

库人物 `lib()` 函数签名加 `accent` 参数，每个库人物单独传 accent 色值做微调（同原型 9 人色调递变），避免一模一样。

### 2d. 女主角头像扩展

现有 `AVATAR_PRESETS` 6 款和 `PersonaAvatar` 4 款保留不变。女主角头像已经是程序化 SVG 人脸，风格统一，**不改动**——用户要求是为"所有人"设计新头像，但女主角已有 6 款可选 + 4 款人设卡，够用了。重点放在老头侧。

### 2e. bio 展示增强

**文件：** `src/components/main-screen.tsx`

通讯录的 `.contact-bio` 当前只显示 `def.bio.slice(0, 42)`。改为显示完整 bio（CSS 去掉 `white-space: nowrap`，加 `display: -webkit-box; -webkit-line-clamp: 2` 两行截断），让每个老头的身份背景更完整地展示。

同时把 `personality` 字段接入 UI——在通讯录行 `.contact-body` 里加一行小字显示 `def.personality`（当前此字段有数据但 UI 从未读取）。

---

## 任务 2 续：照片/立绘系统

### 2f. ChatMessage 加图片字段

**文件：** `src/types/chat.ts`

```ts
export interface ChatMessage {
  speaker: ChatSpeaker;
  label?: string;
  text: string;
  stamp?: string;
  /** v2.2：附带照片——渲染程序化 SVG 立绘图。 */
  photoId?: string;
}
```

### 2g. 照片立绘渲染器

**文件：** `src/components/character-art.tsx` 新增 `PhotoRender` 组件

按 `photoId` + `targetId` 渲染一张程序化 SVG "照片"——比头像更大（200×150），场景更丰富：
- `lao_li_taxi_night`：夜间出租车内视角，方向盘+挡风玻璃外的路灯
- `zhou_calligraphy`：书桌俯拍，毛笔架+宣纸+挂钟
- `wang_garage_smoke`：车库视角，方向盘+车窗外的烟
- `hao_cafe_cats`：网吧柜台，显示器排+橘猫
- `chen_balcony_vise`：阳台台钳+图纸
- 库人物复用原型场景图（5 张各原型代表照片）

每张照片都是一段 SVG 几何抽象（10-15 个 path/rect），不是写实绘画。

### 2h. 引擎推送照片消息

**文件：** `src/engine/state-machine.ts`

在 `start_chat` 和 `accept_incoming` 的 transcript 构建中，当满足条件时（约 15% 概率，或特定话术组关联），在 node openers 之间插入一条 `{ speaker: 'target', photoId: 'xxx', text: '（他发来一张照片。）', stamp: ... }` 消息。

照片 ID 从 `scriptFor(t.targetId)` 的新字段 `photos?: string[]` 取，随机选一个。主五人每人 2 张照片 ID，库人物按原型挂 1 张。

**文件：** `src/types/scripts-registry.ts` —— `TargetScript` 接口加 `photos?: string[]`
**文件：** `src/data/script-registry.ts` —— 主五人配 photos，库人物按原型配

### 2i. 聊天渲染器加图片分支

**文件：** `src/components/main-screen.tsx`

在 ChatSession 和 history-transcript 两处气泡渲染中，`m.photoId` 存在时在 `bubble-text` 下方插入 `<PhotoRender photoId={m.photoId} targetId={...} />`。

**文件：** `src/styles.css` 加 `.bubble-photo { width: 100%; max-width: 200px; border-radius: 8px; overflow: hidden; margin: 4px 0; }` 等样式。

---

## 任务 3：序章 + 终章

### 3a. 序章

**文件：** `src/components/screens.tsx` 新增 `PrologueScreen` 组件

在 `TitleScreen` 的"新的一晚"按钮点击后，不直接弹 `NewGameScreen`，而是先展示序章（分 3-4 屏文字，点击"继续"翻页）：

**序章内容（约 600 字，分 4 屏）：**
1. **背景：** 2025 年的某种网络现象——年轻女性伪装身份，通过聊天软件接近孤独的中老年男性，建立情感关系后索取红包。网上管这叫"崩老头"。
2. **女主角：** 24 岁，小城出身，大专毕业，在城里做着 4000 块一个月的工作。网贷下月到期，利息滚到了她还不起的数字。她不是天生的骗子——她只是一个被数字逼到墙角的人。
3. **手段：** 她在网上有五个人设，通讯录里躺着五个"哥哥"。每个深夜，她切换身份，走进不同老头的孤独。红包、转账、"束脩"——钱以各种名目流动。同时崩的越多，钱来得越快——穿帮也来得越快。
4. **选择：** 你是这个月的主角。30 天，1500 元。你要怎么凑？谁来凑？代价是什么？

**流程改动：**
- `App.tsx`：加 `prologueOpen` 本地 state，TitleScreen"新的一晚"→ 先展示 PrologueScreen → 完成后展示 NewGameScreen
- PrologueScreen 用"继续"按钮翻页，最后一页"开始"按钮派发 `beng:newgame` 事件

### 3b. 终章（编者按式）

**文件：** `src/components/ending-screen.tsx`

在 EndingScreen 的底部（结局正文 + 账本 + 老头后记之后，"再过一个月"按钮之前）加一个「终章」区块。

**终章内容（约 1000 字，3-4 段）：**

> **终章：不只是"崩老头"**
>
> 第一段——**经济维度**：这不是一个人的贪婪。网贷、消费主义、低薪——当一个人的劳动换不来体面，总有人会用另一种"劳动"补上差价。她不是不想靠双手吃饭，是那双手挣的，不够还利息。
>
> 第二段——**老龄化与孤独**：五个老头不是五个傻子。他们是退休的教师、下岗的工人、独居的父亲——一辈子奉公守法，到老发现身边连个说话的人都没有。他们的孤独不是偶然的，是城市化进程把三代人拆散在三个城市的结果。
>
> 第三段——**数字鸿沟**：他们分不清美颜和真人，分不清群发和私信，分不清关心和套路。不是他们蠢——是他们这代人，没上过这堂课。
>
> 第四段——**情感产业**：当孤独本身变成一门生意——不只是"崩老头"，还有代聊群、情感陪聊、虚拟恋人——这说明什么？说明这个社会有一种需求，量很大，得不到正视，于是有人用最坏的方式满足了它。
>
> 收束：**"崩老头"不是一个人的病。它是一代人的孤独，撞上了另一代人的困境。要解决这个问题，不是抓几个人那么简单——得让劳动值得，让孤独有人管，让数字世界对老人友好。在那之前，凌晨三点，还会有下一个"哥哥"。**

用 `.epilogue-essay` CSS 类做排版（分段、缩进、斜体收束句）。

---

## 实施顺序

1. **Task 1**（置灰）：改 `character-art.tsx` 的 OldManAvatar SVG 根节点 → tsc 验证（最小改动，先行）
2. **Task 2a-2e**（头像系统）：扩类型 → 重写渲染器 → 配数据 → bio UI → tsc+build
3. **Task 2f-2i**（照片系统）：扩 ChatMessage → PhotoRender 组件 → 引擎推送 → 渲染+CSS → tsc+build
4. **Task 3a**（序章）：PrologueScreen 组件 → App.tsx 流程 → CSS → build
5. **Task 3b**（终章）：ending-screen.tsx 加区块 → endings.ts 不改（终章独立于结局） → CSS → build
6. **收尾验证**：tsc + vitest run + npm run build 全绿；手动验证置灰效果、头像分化、照片消息、序章终章渲染

## 不改动的文件

- 引擎核心逻辑（dispatch 纯函数）——只在 transcript 构建处加照片消息推送
- 现有话术数据文件——照片是新维度，不改已有话术
- 测试文件——除非新增字段导致类型不兼容（balance.test.ts 的 tstate 已在上轮修过 recentGreetingIdx，photos 是可选字段不影响）
- 女主角头像系统——已有 6 款预设 + 4 款人设卡，够用