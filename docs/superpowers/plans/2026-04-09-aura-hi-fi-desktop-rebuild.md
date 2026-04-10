# Aura Hi-Fi Desktop Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution notes:** 在执行本计划前，必须遵守 `@superpowers:test-driven-development`；在宣告完成前，必须遵守 `@superpowers:verification-before-completion`。

**Goal:** 将当前 3 页面桌面播放器重构为 5 个中文页面的 `Aura Hi-Fi` 产品壳，统一深色视觉、统一底部 Dock、在线模拟资源、Howler 播放底层与 Liricle 歌词同步能力。

**Architecture:** 先以新的路由、内容数据层、播放器状态机和歌词状态层打底，再重建固定侧栏、固定顶栏、唯一 Dock 和 5 个页面。页面与组件不直接依赖第三方音频/歌词库，而是统一通过 adapter 与 Pinia store 交互，保证测试稳定和后续扩展性。

**Tech Stack:** Vue 3, TypeScript, Pinia, Vue Router, Vitest, Vue Test Utils, UnoCSS, Less, GSAP, Iconify, Howler.js, Liricle, Tauri

---

## File Structure

### Existing Files To Modify

- Modify: `package.json`
- Modify: `src/router/routes.ts`
- Modify: `src/router/index.ts`
- Modify: `src/types/music.ts`
- Modify: `src/data/music-library.ts`
- Modify: `src/lib/player/audio.ts`
- Modify: `src/lib/player/rules.ts`
- Modify: `src/stores/player.ts`
- Modify: `src/composables/use-gsap.ts`
- Modify: `src/components/AppShell.vue`
- Modify: `src/components/chrome/AppSidebar.vue`
- Modify: `src/components/chrome/AppTopbar.vue`
- Modify: `src/components/dock/PlayerDock.vue`
- Modify: `src/components/dock/PlaybackControls.vue`
- Modify: `src/components/dock/PlaybackProgress.vue`
- Modify: `src/components/dock/VolumeControl.vue`
- Modify: `src/styles/theme.less`
- Modify: `src/styles/index.less`
- Modify: `src/styles/utilities.less`
- Modify: `src/components/chrome/__tests__/AppShell.test.ts`
- Modify: `src/components/dock/__tests__/PlayerDock.test.ts`
- Modify: `src/stores/__tests__/player.test.ts`
- Modify: `src/lib/player/__tests__/rules.test.ts`

### New Files To Create

- Create: `src/data/aura-content.ts`
- Create: `src/data/__tests__/aura-content.test.ts`
- Create: `scripts/validate-aura-resources.mjs`
- Create: `src/lib/player/queue.ts`
- Create: `src/lib/player/__tests__/queue.test.ts`
- Create: `src/lib/lyrics/liricle-adapter.ts`
- Create: `src/stores/lyrics.ts`
- Create: `src/stores/__tests__/lyrics.test.ts`
- Create: `src/views/HomeView.vue`
- Create: `src/views/ExploreView.vue`
- Create: `src/views/PlaylistView.vue`
- Create: `src/views/LibraryView.vue`
- Create: `src/views/PlayerView.vue`
- Create: `src/views/__tests__/HomeView.test.ts`
- Create: `src/views/__tests__/ExploreView.test.ts`
- Create: `src/views/__tests__/PlaylistView.test.ts`
- Create: `src/views/__tests__/LibraryView.test.ts`
- Create: `src/views/__tests__/PlayerView.test.ts`
- Create: `src/components/music/QueuePopover.vue`
- Create: `src/components/music/LyricsPanel.vue`
- Create: `src/components/music/MediaHeroCard.vue`
- Create: `src/components/music/MediaSectionTitle.vue`
- Create: `src/components/music/MediaShelfCard.vue`
- Create: `src/components/music/TrackQueueList.vue`

### Existing Files To Delete After Migration

- Delete: `src/views/DiscoverView.vue`
- Delete: `src/views/LikedView.vue`
- Delete: `src/views/ProfileView.vue`
- Delete: `src/views/__tests__/DiscoverView.test.ts`
- Delete: `src/views/__tests__/LikedView.test.ts`
- Delete: `src/views/__tests__/ProfileView.test.ts`

## Task 1: 建立新的路由骨架与中文导航契约

**Files:**
- Create: `src/views/HomeView.vue`
- Create: `src/views/ExploreView.vue`
- Create: `src/views/PlaylistView.vue`
- Create: `src/views/LibraryView.vue`
- Create: `src/views/PlayerView.vue`
- Modify: `src/router/routes.ts`
- Modify: `src/components/chrome/__tests__/AppShell.test.ts`

- [ ] **Step 1: 先写路由与导航失败测试**

在 `src/components/chrome/__tests__/AppShell.test.ts` 中新增断言：

- 左侧导航存在 5 条链接
- 目标路径分别为 `/`、`/explore`、`/playlist`、`/library`、`/player`
- 导航文案全部为中文，不出现“Home / Explore / Playlist / Library / Player”
- `Player` 页路由切换后，侧栏、顶栏、Dock 仍然存在
- 路由表同时支持 `/playlist` 与 `/playlist/:playlistId`

- [ ] **Step 2: 运行测试确认先红**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`

Expected: FAIL，因为当前项目仍然是 3 个页面路由，且没有新的 5 页面结构。

- [ ] **Step 3: 写最小实现让新路由成立**

实现内容：

- 在 `src/router/routes.ts` 中改成 5 个主路由
- 明确补上歌单详情深链 `/playlist/:playlistId`
- 为 5 个新页面先创建最小可挂载的 Vue 组件占位
- 每个页面根节点提供稳定的 `id`：
  - `home-page`
  - `explore-page`
  - `playlist-page`
  - `library-page`
  - `player-page`
- 路由 `meta.title` 改为中文标题

- [ ] **Step 4: 再次运行测试确认转绿**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`

Expected: PASS，新的路由和页面占位已可渲染。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add src/router/routes.ts src/views/HomeView.vue src/views/ExploreView.vue src/views/PlaylistView.vue src/views/LibraryView.vue src/views/PlayerView.vue src/components/chrome/__tests__/AppShell.test.ts
git commit -m "test: add five-page aura route skeleton"
```

## Task 2: 建立在线模拟内容数据层与中文内容模型

**Files:**
- Create: `src/data/aura-content.ts`
- Create: `src/data/__tests__/aura-content.test.ts`
- Modify: `src/types/music.ts`
- Modify: `src/data/music-library.ts`

- [ ] **Step 1: 先写内容数据失败测试**

在 `src/data/__tests__/aura-content.test.ts` 中覆盖以下规则：

- 所有展示给用户的标题、标签、状态字段为中文内容
- 每首曲目都有稳定的 `https` 封面图地址
- 每首曲目都有稳定的 `https` 音频地址
- 每首曲目都有静态 `durationSeconds` 与 `durationLabel`
- 歌词字段要么是 LRC 字符串，要么是明确的 `null`
- 每首曲目都提供 `moods` 与 `tags`
- 默认歌单、推荐区、资料库区都能从同一套内容源派生
- 所有在线资源都通过一份“资源清单”导出，便于后续做可用性验收

- [ ] **Step 2: 运行测试确认先红**

Run: `pnpm exec vitest run src/data/__tests__/aura-content.test.ts`

Expected: FAIL，因为 `src/data/aura-content.ts` 还不存在，当前内容数据也仍然使用本地资源。

- [ ] **Step 3: 写最小实现**

实现内容：

- 在 `src/types/music.ts` 中补齐新的内容类型：
  - `Track`
  - `PlaylistSummary`
  - `ArtistProfile`
  - `MoodEntry`
  - `QueueSource`
- 在 `src/data/aura-content.ts` 中集中管理：
  - 5 页面需要的主内容
  - 在线图片
  - 在线音频
  - LRC 歌词或 `null`
  - 默认主打歌单
  - 单独导出的 mock 资源清单
- 将 `src/data/music-library.ts` 改为兼容层或直接转发到新数据源，避免第一轮改动打断现有 store import

- [ ] **Step 4: 再次运行测试确认转绿**

Run: `pnpm exec vitest run src/data/__tests__/aura-content.test.ts`

Expected: PASS，内容数据与在线 mock 资源契约成立。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add src/types/music.ts src/data/aura-content.ts src/data/music-library.ts src/data/__tests__/aura-content.test.ts
git commit -m "feat: add aura content data source"
```

## Task 3: 提前验收在线 mock 资源包

**Files:**
- Create: `scripts/validate-aura-resources.mjs`
- Modify: `src/data/aura-content.ts`
- Modify: `src/data/__tests__/aura-content.test.ts`

- [ ] **Step 1: 先补资源清单契约测试与验收脚本占位**

在 `src/data/__tests__/aura-content.test.ts` 中新增可执行检查：

- 关键资源都带稳定的 `resourceKey`
- 资源声明中可标记主地址与备用地址
- 歌词资源可以是内置 LRC 或远程地址
- 数据层能导出供独立验收脚本消费的资源清单

同时为 `scripts/validate-aura-resources.mjs` 预留命令入口，后续用独立脚本而不是 Vitest 做真实网络探测。

- [ ] **Step 2: 运行测试确认先红**

Run: `pnpm exec vitest run src/data/__tests__/aura-content.test.ts`

Expected: FAIL，因为资源清单契约和独立验收脚本占位还未补齐。

- [ ] **Step 3: 写最小实现**

实现内容：

- 在 `src/data/aura-content.ts` 中为关键资源维护主地址与备用地址说明
- 为首页主打曲目、默认歌单和 Player 页主曲目至少准备一套已验收的稳定资源
- 创建 `scripts/validate-aura-resources.mjs`：
  - 对主资源做可达性检查
  - 为每个请求设置明确超时
  - 网络不可用时输出可读错误并允许通过环境变量 `AURA_SKIP_RESOURCE_VALIDATION=1` 跳过
  - 失败时打印需替换的 `resourceKey` 与 URL
- 将“资源包已验收”作为后续页面联调前的前置条件

- [ ] **Step 4: 再次运行测试确认转绿**

Run:

```bash
pnpm exec vitest run src/data/__tests__/aura-content.test.ts
pnpm exec node scripts/validate-aura-resources.mjs
```

Expected: PASS，页面联调前已具备稳定 mock 资源包。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add src/data/aura-content.ts src/data/__tests__/aura-content.test.ts scripts/validate-aura-resources.mjs
git commit -m "test: validate aura mock resources"
```

## Task 4: 重写播放规则与稳定随机队列

**Files:**
- Create: `src/lib/player/queue.ts`
- Create: `src/lib/player/__tests__/queue.test.ts`
- Modify: `src/lib/player/rules.ts`
- Modify: `src/lib/player/__tests__/rules.test.ts`
- Modify: `src/types/music.ts`

- [ ] **Step 1: 先写失败测试**

补充两组测试：

- `src/lib/player/__tests__/rules.test.ts`
  - 顺序播放到最后一首后停止
  - 单曲循环结束后重播当前曲目
  - 单曲循环模式下手动 `next` / `previous` 仍切换到相邻曲目
  - 随机播放下 `next` / `previous` 按稳定随机顺序移动
  - 随机队列播到最后一首后停止并停留在最后一首
- `src/lib/player/__tests__/queue.test.ts`
  - 同一上下文生成的随机队列顺序稳定
  - 队列中必须包含当前曲目
  - 切换上下文后随机顺序会重新生成

- [ ] **Step 2: 运行测试确认先红**

Run:

```bash
pnpm exec vitest run src/lib/player/__tests__/rules.test.ts src/lib/player/__tests__/queue.test.ts
```

Expected: FAIL，因为当前模式仍是 `repeat-all` 语义，也没有稳定随机队列实现。

- [ ] **Step 3: 写最小实现**

实现内容：

- 将 `PlaybackMode` 改成：
  - `sequential`
  - `repeat-one`
  - `shuffle`
- 在 `src/lib/player/queue.ts` 中实现稳定随机队列生成与索引查找
- 在 `src/lib/player/rules.ts` 中写死规格里的模式行为：
  - 顺序播放结束停在最后一首
  - 单曲循环只循环当前曲目
  - 随机播放使用稳定随机顺序

- [ ] **Step 4: 再次运行测试确认转绿**

Run:

```bash
pnpm exec vitest run src/lib/player/__tests__/rules.test.ts src/lib/player/__tests__/queue.test.ts
```

Expected: PASS，新的模式状态机和稳定随机队列成立。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add src/types/music.ts src/lib/player/rules.ts src/lib/player/queue.ts src/lib/player/__tests__/rules.test.ts src/lib/player/__tests__/queue.test.ts
git commit -m "feat: add aura playback rule semantics"
```

## Task 5: 接入 Howler 与 Liricle 的 adapter / store 基础层

**Files:**
- Modify: `package.json`
- Modify: `src/lib/player/audio.ts`
- Modify: `src/stores/player.ts`
- Modify: `src/stores/__tests__/player.test.ts`
- Create: `src/lib/lyrics/liricle-adapter.ts`
- Create: `src/stores/lyrics.ts`
- Create: `src/stores/__tests__/lyrics.test.ts`

- [ ] **Step 1: 先写失败测试**

补充测试覆盖：

- `src/stores/__tests__/player.test.ts`
  - 测试中固定使用 fake audio adapter，不实例化真实 Howler
  - 静态时长先展示，真实时长到达后允许运行时回填
  - 队列来源变更时随机顺序重建
  - 收藏状态仅在当前会话内同步
  - 音频加载失败或播放错误时，store 会写入清晰错误状态
- `src/stores/__tests__/lyrics.test.ts`
  - 有歌词时能根据时间高亮当前行
  - 无歌词时返回空状态
  - 切歌时会重置并重新加载歌词上下文

- [ ] **Step 2: 运行测试确认先红**

Run:

```bash
pnpm exec vitest run src/stores/__tests__/player.test.ts src/stores/__tests__/lyrics.test.ts
```

Expected: FAIL，因为歌词 store 尚不存在，现有 player store 也没有新规则与歌词联动。

- [ ] **Step 3: 写最小实现**

实现内容：

- 在 `package.json` 中新增 `liricle`
- 在 `src/lib/player/audio.ts` 中保留可注入工厂能力，同时完成 Howler adapter 的事件映射
- 约定 `createAudioAdapter()`：
  - 生产环境默认走 Howler
  - 测试环境通过 fake adapter 注入，不触发真实音频、网络或不受控定时器
- 在 `src/stores/player.ts` 中加入：
  - 新的 `shuffle` 模式
  - 当前上下文队列来源
  - 基于 `QueueSource` 与 track id 列表生成的稳定随机队列 key
  - upcoming 队列只读视图
  - 收藏会话态同步
  - 加载失败与播放错误状态同步
- 在 `src/lib/lyrics/liricle-adapter.ts` 中封装 LRC 解析与当前行定位
- 在 `src/stores/lyrics.ts` 中封装：
  - 当前歌词数组
  - 当前行索引
  - 加载状态
  - 空状态
  - 基础 offset 校正能力

- [ ] **Step 4: 再次运行测试确认转绿**

Run:

```bash
pnpm exec vitest run src/stores/__tests__/player.test.ts src/stores/__tests__/lyrics.test.ts
```

Expected: PASS，播放和歌词底层能力已具备稳定接口。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add package.json src/lib/player/audio.ts src/stores/player.ts src/stores/__tests__/player.test.ts src/lib/lyrics/liricle-adapter.ts src/stores/lyrics.ts src/stores/__tests__/lyrics.test.ts
git commit -m "feat: add howler and liricle adapters"
```

## Task 6: 重建桌面壳层、中文导航与顶部搜索入口

**Files:**
- Modify: `src/components/AppShell.vue`
- Modify: `src/components/chrome/AppSidebar.vue`
- Modify: `src/components/chrome/AppTopbar.vue`
- Modify: `src/components/chrome/__tests__/AppShell.test.ts`
- Modify: `src/router/index.ts`
- Modify: `src/styles/theme.less`
- Modify: `src/styles/index.less`
- Modify: `src/styles/utilities.less`

- [ ] **Step 1: 先写失败测试**

扩展 `src/components/chrome/__tests__/AppShell.test.ts`：

- 固定侧栏、固定顶栏、内容滚动区 testid 都存在
- `Explore` 外的页面顶部展示“进入探索”按钮
- 点击搜索入口会跳转到 `Explore` 并自动聚焦搜索框
- `Player` 页仍然保留壳层但视觉区域不同
- 顶部按钮与头像区域都存在中文辅助文案或 aria 标签
- 主题切换与主题色面板相关 UI 与旧测试断言已被移除
- 根布局内容容器的最小宽度固定为 `1280px`
- 窗口宽度小于 `1280px` 时，通过内容区 `min-width` 与横向滚动保护结构完整，而不是压缩组件
- 窄宽度下 Dock 仍保持完整结构，不因横向保护而退化为残缺布局

- [ ] **Step 2: 运行测试确认先红**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`

Expected: FAIL，因为当前顶栏未并入壳层，也没有新的搜索入口和 5 页面中文导航。

- [ ] **Step 3: 写最小实现**

实现内容：

- 在 `AppShell` 中挂上固定顶部栏
- `AppSidebar` 改成 5 项中文导航
- `AppTopbar` 改成：
  - 页面中文标题
  - `Explore` 页直输搜索框
  - 非 `Explore` 页的“进入探索”按钮
  - 应用状态按钮
  - 头像/个人入口占位
- 明确移除或禁用当前工程里的 `UiThemeToggle` / `UiThemePalette` 入口与相关测试断言，保证只交付深色主题
- 从非 `Explore` 页进入后，使用路由状态或页面挂载逻辑自动聚焦 `Explore` 搜索框
- 补齐桌面端最小宽度容器与横向滚动保护，阈值固定为 `1280px`
- 在 `src/styles/theme.less` 中将深色主题、布局尺寸、表面层级、交互态统一收口为 CSS Variables，作为唯一主题出口
- 为路由切换补上统一 GSAP 页面过渡动画
- 侧栏、顶栏、状态按钮的图标全部改为 Iconify，移除混用来源

- [ ] **Step 4: 再次运行测试确认转绿**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`

Expected: PASS，新的壳层、导航和顶栏规则成立。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add src/components/AppShell.vue src/components/chrome/AppSidebar.vue src/components/chrome/AppTopbar.vue src/components/chrome/__tests__/AppShell.test.ts src/router/index.ts src/styles/theme.less src/styles/index.less src/styles/utilities.less
git commit -m "feat: rebuild aura shell chrome"
```

## Task 7: 重做唯一底部 Dock、队列面板与控制组件

**Files:**
- Modify: `src/components/dock/PlayerDock.vue`
- Modify: `src/components/dock/PlaybackControls.vue`
- Modify: `src/components/dock/PlaybackProgress.vue`
- Modify: `src/components/dock/VolumeControl.vue`
- Modify: `src/components/dock/__tests__/PlayerDock.test.ts`
- Create: `src/components/music/QueuePopover.vue`
- Create: `src/components/music/TrackQueueList.vue`

- [ ] **Step 1: 先写失败测试**

在 `src/components/dock/__tests__/PlayerDock.test.ts` 中新增断言：

- Dock 文案全部为中文
- 模式按钮循环顺序为“顺序播放 → 单曲循环 → 随机播放”
- 队列入口能打开只读 upcoming 面板
- upcoming 面板展示“当前播放曲目”
- upcoming 面板展示“总队列长度”
- upcoming 面板可点击切歌
- Dock 右侧存在进入 `Player` 页按钮

- [ ] **Step 2: 运行测试确认先红**

Run: `pnpm exec vitest run src/components/dock/__tests__/PlayerDock.test.ts`

Expected: FAIL，因为当前 Dock 仍是旧布局，也没有 upcoming 队列面板和新的模式语义。

- [ ] **Step 3: 写最小实现**

实现内容：

- 以 `src/assets/stitch_/your_library/screen.png` 的 Dock 风格为最高优先级重做 `PlayerDock`
- 新建 `QueuePopover.vue` 和 `TrackQueueList.vue`
- 保持 Dock 为全站唯一版本
- 所有按钮改为中文 `aria-label`
- Dock 内所有控制图标统一替换为 Iconify
- 队列面板必须展示：
  - 当前播放曲目
  - 下一首列表
  - 总队列长度
- 提供跳转 `/player` 的按钮

- [ ] **Step 4: 再次运行测试确认转绿**

Run: `pnpm exec vitest run src/components/dock/__tests__/PlayerDock.test.ts`

Expected: PASS，Dock 的唯一结构和最小功能成立。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add src/components/dock/PlayerDock.vue src/components/dock/PlaybackControls.vue src/components/dock/PlaybackProgress.vue src/components/dock/VolumeControl.vue src/components/dock/__tests__/PlayerDock.test.ts src/components/music/QueuePopover.vue src/components/music/TrackQueueList.vue
git commit -m "feat: rebuild unified aura dock"
```

## Task 8: 实现 Home 与 Explore 页面

**Files:**
- Create: `src/views/__tests__/HomeView.test.ts`
- Create: `src/views/__tests__/ExploreView.test.ts`
- Create: `src/components/music/MediaHeroCard.vue`
- Create: `src/components/music/MediaSectionTitle.vue`
- Create: `src/components/music/MediaShelfCard.vue`
- Modify: `src/views/HomeView.vue`
- Modify: `src/views/ExploreView.vue`
- Modify: `src/composables/use-gsap.ts`

- [ ] **Step 1: 先写失败测试**

新增页面测试：

- `HomeView.test.ts`
  - 首页展示中文 Hero、最近播放、推荐歌单和情绪入口
  - 点击首页内容卡能驱动播放器切歌或切上下文
- `ExploreView.test.ts`
  - 无输入时展示默认探索态
  - 仅 `Explore` 页显示输入框
  - 搜索按曲名 / 艺人 / 专辑 / 歌单名 / `tags` 过滤本地 mock 数据
  - debounce 固定为 `150ms`
  - 无结果时展示中文空状态
  - 点击歌单卡片会跳转到 `/playlist/:playlistId`

- [ ] **Step 2: 运行测试确认先红**

Run:

```bash
pnpm exec vitest run src/views/__tests__/HomeView.test.ts src/views/__tests__/ExploreView.test.ts
```

Expected: FAIL，因为页面仍是占位组件，没有新结构和搜索行为。

- [ ] **Step 3: 写最小实现**

实现内容：

- `HomeView.vue`：
  - 中文 Hero
  - 最近播放区
  - 推荐区
  - 氛围区
  - 歌单卡片支持进入 `/playlist/:playlistId`
- `ExploreView.vue`：
  - 搜索输入
  - `150ms` debounce 过滤
  - 分类卡
  - 结果分组
  - 中文空状态
  - 歌单卡片支持进入 `/playlist/:playlistId`
- 为主要区块挂上 GSAP reveal / hover 钩子
- 补齐页面切换进入时的 GSAP 统一过渡，与壳层路由动画保持同一节奏

- [ ] **Step 4: 再次运行测试确认转绿**

Run:

```bash
pnpm exec vitest run src/views/__tests__/HomeView.test.ts src/views/__tests__/ExploreView.test.ts
```

Expected: PASS，首页与探索页的中文结构和交互成立。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add src/views/HomeView.vue src/views/ExploreView.vue src/views/__tests__/HomeView.test.ts src/views/__tests__/ExploreView.test.ts src/components/music/MediaHeroCard.vue src/components/music/MediaSectionTitle.vue src/components/music/MediaShelfCard.vue src/composables/use-gsap.ts
git commit -m "feat: add aura home and explore views"
```

## Task 9: 实现 Playlist 与 Library 页面

**Files:**
- Create: `src/views/__tests__/PlaylistView.test.ts`
- Create: `src/views/__tests__/LibraryView.test.ts`
- Modify: `src/router/routes.ts`
- Modify: `src/views/PlaylistView.vue`
- Modify: `src/views/LibraryView.vue`
- Modify: `src/stores/player.ts`

- [ ] **Step 1: 先写失败测试**

新增页面测试：

- `PlaylistView.test.ts`
  - `/playlist` 渲染默认主打歌单
  - `/playlist/:playlistId` 渲染对应歌单
  - 曲目行点击后可切歌
  - 当前播放曲目行会与底部 Dock 联动高亮
  - 收藏状态切换后在当前会话内同步
- `LibraryView.test.ts`
  - 页面标题、主焦点卡、小卡区和艺人区均为中文
  - 收藏内容与播放器会话态联动
  - 大焦点卡可直接播放

- [ ] **Step 2: 运行测试确认先红**

Run:

```bash
pnpm exec vitest run src/views/__tests__/PlaylistView.test.ts src/views/__tests__/LibraryView.test.ts
```

Expected: FAIL，因为两页还没有内容结构与路由深链逻辑。

- [ ] **Step 3: 写最小实现**

实现内容：

- `PlaylistView.vue`：
  - 默认主打歌单与深链歌单渲染
  - 中文 Hero、操作区、曲目表
- `LibraryView.vue`：
  - 中文标题
  - `Liked Songs` 对应的中文焦点卡
  - 收藏歌单、小卡片、艺人区
- 在 `player store` 中补齐收藏会话态的跨页同步接口

- [ ] **Step 4: 再次运行测试确认转绿**

Run:

```bash
pnpm exec vitest run src/views/__tests__/PlaylistView.test.ts src/views/__tests__/LibraryView.test.ts
```

Expected: PASS，歌单页与资料库页的结构和会话态联动成立。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add src/views/PlaylistView.vue src/views/LibraryView.vue src/views/__tests__/PlaylistView.test.ts src/views/__tests__/LibraryView.test.ts src/stores/player.ts
git commit -m "feat: add aura playlist and library views"
```

## Task 10: 实现 Player 页面与歌词联动

**Files:**
- Create: `src/views/__tests__/PlayerView.test.ts`
- Create: `src/components/music/LyricsPanel.vue`
- Modify: `src/views/PlayerView.vue`
- Modify: `src/stores/lyrics.ts`
- Modify: `src/stores/player.ts`

- [ ] **Step 1: 先写失败测试**

在 `src/views/__tests__/PlayerView.test.ts` 中覆盖：

- 页面展示中文曲目信息与大封面
- 歌词面板在有歌词时高亮当前行
- 无歌词时显示中文空状态
- 页面保留侧栏、顶栏、Dock
- 页面中的播放控制与 Dock 共用同一播放器状态
- 页面切入时使用 GSAP 做统一路由过渡与区块 reveal

- [ ] **Step 2: 运行测试确认先红**

Run: `pnpm exec vitest run src/views/__tests__/PlayerView.test.ts`

Expected: FAIL，因为当前 `PlayerView` 仍是占位页，也没有歌词 UI。

- [ ] **Step 3: 写最小实现**

实现内容：

- 新建 `LyricsPanel.vue`
- 在 `PlayerView.vue` 中实现：
  - 中文标题信息区
  - 大封面
  - 歌词区
  - 大控制区
- 用 store 将 `PlayerView` 与 Dock 串到同一状态源
- 用 GSAP 为封面、背景光、歌词区提供入场与切歌过渡

- [ ] **Step 4: 再次运行测试确认转绿**

Run: `pnpm exec vitest run src/views/__tests__/PlayerView.test.ts`

Expected: PASS，沉浸页与歌词联动成立，且仍保留统一壳层。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add src/views/PlayerView.vue src/views/__tests__/PlayerView.test.ts src/components/music/LyricsPanel.vue src/stores/lyrics.ts src/stores/player.ts
git commit -m "feat: add aura player view with lyrics"
```

## Task 11: 清理旧页面、统一中文文案与视觉细节

**Files:**
- Delete: `src/views/DiscoverView.vue`
- Delete: `src/views/LikedView.vue`
- Delete: `src/views/ProfileView.vue`
- Delete: `src/views/__tests__/DiscoverView.test.ts`
- Delete: `src/views/__tests__/LikedView.test.ts`
- Delete: `src/views/__tests__/ProfileView.test.ts`
- Modify: 所有新页面与壳层相关文件

- [ ] **Step 1: 先写回归断言或补充现有测试**

补充已有测试，确保：

- UI 不再出现旧页面中文文案
- 用户可见文案中不出现设计稿英文标题
- 旧页面根节点 id 不再出现在路由切换结果中

- [ ] **Step 2: 运行测试确认先红**

Run:

```bash
pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts src/views/__tests__/HomeView.test.ts src/views/__tests__/ExploreView.test.ts src/views/__tests__/PlaylistView.test.ts src/views/__tests__/LibraryView.test.ts src/views/__tests__/PlayerView.test.ts
```

Expected: FAIL，因为旧文件和部分旧文案仍未完全清理。

- [ ] **Step 3: 写最小实现**

实现内容：

- 删除旧页面与旧测试文件
- 扫描并替换所有面向用户的英文文案
- 统一最终中文按钮文案、提示语、空状态、状态标签
- 统一 Dock 与页面的 hover / active / focus 细节

- [ ] **Step 4: 再次运行测试确认转绿**

Run:

```bash
pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts src/views/__tests__/HomeView.test.ts src/views/__tests__/ExploreView.test.ts src/views/__tests__/PlaylistView.test.ts src/views/__tests__/LibraryView.test.ts src/views/__tests__/PlayerView.test.ts
```

Expected: PASS，旧页面已退出，最终用户文案全部转为中文。

- [ ] **Step 5: 提交这一小步**

Run:

```bash
git add -A
git commit -m "refactor: remove legacy player pages"
```

## Task 12: 最终验证与资源可用性验收

**Files:**
- Modify: as needed from previous tasks

- [ ] **Step 1: 验证在线 mock 资源包**

Run:

```bash
pnpm exec vitest run src/data/__tests__/aura-content.test.ts
pnpm exec node scripts/validate-aura-resources.mjs
```

Expected: PASS，数据层契约、主资源与备用资源策略都可用。

- [ ] **Step 2: 跑播放器与歌词相关测试**

Run:

```bash
pnpm exec vitest run src/lib/player/__tests__/rules.test.ts src/lib/player/__tests__/queue.test.ts src/stores/__tests__/player.test.ts src/stores/__tests__/lyrics.test.ts src/components/dock/__tests__/PlayerDock.test.ts
```

Expected: PASS，播放状态机、队列、歌词、Dock 全部稳定。

- [ ] **Step 3: 跑壳层与页面测试**

Run:

```bash
pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts src/views/__tests__/HomeView.test.ts src/views/__tests__/ExploreView.test.ts src/views/__tests__/PlaylistView.test.ts src/views/__tests__/LibraryView.test.ts src/views/__tests__/PlayerView.test.ts
```

Expected: PASS，5 页面、壳层与中文文案行为全部正常。

- [ ] **Step 4: 回归检查全站图标来源**

人工检查或补充断言，确认以下区域的图标统一来自 Iconify：

- 左侧导航
- 顶部状态按钮
- Dock 控制按钮
- Player 页控制区

Expected: PASS，无混用旧图标来源。

- [ ] **Step 5: 跑全量测试**

Run: `pnpm test`

Expected: PASS。

- [ ] **Step 6: 跑类型检查**

Run: `pnpm typecheck`

Expected: PASS。

- [ ] **Step 7: 跑生产构建检查**

Run: `pnpm build:web`

Expected: PASS，Vite 构建成功，无类型错误。

- [ ] **Step 8: 最终提交**

Run:

```bash
git add -A
git commit -m "feat: rebuild aura hi-fi desktop player"
```
