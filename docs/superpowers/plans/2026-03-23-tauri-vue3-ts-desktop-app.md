# Tauri Vue3 Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前仓库中搭建一个可运行的 `Tauri + Vue 3 + TypeScript` 桌面应用基础工程，并接入 `Vue Router`、`Pinia`、`UnoCSS`、`Less`、`ESLint` 和 `Prettier`。

**Architecture:** 先使用官方 `create-tauri-app` 生成 `vue-ts` 模板，确保 Tauri 2、Vite 和 Vue 3 的基础结构与上游保持一致。随后分层补齐工程化能力、前端应用骨架和一个最小原生命令回环示例，让仓库在不引入重型模板的前提下具备业务开发起点。

**Tech Stack:** Tauri 2, Rust, Vue 3, TypeScript, Vite, pnpm, Vue Router, Pinia, UnoCSS, Less, ESLint, Prettier

---

## 实施说明

- 本计划基于当前官方模板实测结构编写，默认生成的关键文件包括 `package.json`、`vite.config.ts`、`src/main.ts`、`src/App.vue`、`src-tauri/src/lib.rs`、`src-tauri/src/main.rs`、`src-tauri/tauri.conf.json`。
- 为保持范围收敛，本轮不新增 `Vitest` 或端到端测试框架；验证方式以 `lint`、`typecheck/build`、`tauri dev`、`tauri build` 为主。
- 如果官方模板在执行当天与当前计划出现少量差异，执行时优先保留上游生成结果，再按本计划的职责边界落地。

## 文件结构映射

### 生成器产出后保留并修改的文件

- `package.json`: 脚本、依赖、工程命令入口
- `vite.config.ts`: Vue 插件、UnoCSS 插件、路径别名、Tauri dev server 配置
- `tsconfig.json`: TS 编译选项与路径别名
- `src/main.ts`: 应用引导，注册 Router、Pinia、UnoCSS/Less 样式
- `src/App.vue`: 最外层路由承载组件
- `src-tauri/src/lib.rs`: 原生命令注册与 Tauri builder 配置
- `src-tauri/src/main.rs`: 桌面入口
- `src-tauri/tauri.conf.json`: 应用名、窗口和打包配置
- `README.md`: 更新启动和构建命令说明

### 新增文件

- `uno.config.ts`: UnoCSS 配置
- `eslint.config.mjs`: ESLint flat config
- `.prettierrc.json`: Prettier 配置
- `.prettierignore`: Prettier 忽略文件
- `src/app/setup-app.ts`: Vue 应用统一注册入口
- `src/router/index.ts`: 路由实例
- `src/router/routes.ts`: 路由表
- `src/stores/counter.ts`: 示例 Pinia store
- `src/views/HomeView.vue`: 桌面端首页
- `src/views/AboutView.vue`: About 页面
- `src/components/AppShell.vue`: 页面骨架与导航
- `src/components/RuntimeStatusCard.vue`: 运行时状态展示
- `src/components/GreetPanel.vue`: Tauri 原生命令演示
- `src/lib/tauri.ts`: 前端对原生命令的调用封装
- `src/styles/index.less`: 全局样式入口
- `src/styles/theme.less`: Less 变量和主题 token
- `src/styles/utilities.less`: 补充全局工具样式

### 可能保留但不重点改动的生成文件

- `.gitignore`
- `index.html`
- `src/vite-env.d.ts`
- `src-tauri/build.rs`
- `src-tauri/capabilities/default.json`
- `src-tauri/icons/*`

## 任务拆解

### Task 1: 使用官方模板初始化基础工程

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `index.html`
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/vite-env.d.ts`
- Create: `src/assets/vue.svg`
- Create: `public/tauri.svg`
- Create: `public/vite.svg`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`
- Create: `src-tauri/capabilities/default.json`

- [ ] **Step 1: 运行官方生成器初始化当前仓库**

Run: `pnpm create tauri-app@latest . --manager pnpm --template vue-ts --force`

Expected: 命令输出包含 `Template created!`，根目录生成 `src/`、`src-tauri/`、`package.json` 等官方模板文件。

- [ ] **Step 2: 安装初始依赖**

Run: `pnpm install`

Expected: 成功生成 `pnpm-lock.yaml`，没有依赖解析错误。

- [ ] **Step 3: 记录模板当前默认脚本与原生命令入口**

Run: `sed -n '1,220p' package.json`

Expected: 能看到默认脚本 `dev`、`build`、`preview`、`tauri`，为后续增量改造提供基线。

- [ ] **Step 4: 提交初始化基线**

```bash
git add .gitignore README.md index.html package.json pnpm-lock.yaml public src src-tauri tsconfig.json tsconfig.node.json vite.config.ts
git commit -m "chore: bootstrap tauri vue desktop app"
```

### Task 2: 补齐工程化配置与依赖

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Modify: `README.md`
- Create: `uno.config.ts`
- Create: `eslint.config.mjs`
- Create: `.prettierrc.json`
- Create: `.prettierignore`

- [ ] **Step 1: 安装路由、状态管理、样式和代码规范依赖**

Run: `pnpm add vue-router pinia`

Expected: `package.json` 的 `dependencies` 新增 `vue-router` 和 `pinia`。

- [ ] **Step 2: 安装 UnoCSS、Less 与代码规范开发依赖**

Run: `pnpm add -D unocss @unocss/preset-uno @unocss/preset-attributify less eslint @eslint/js typescript-eslint eslint-plugin-vue vue-eslint-parser globals prettier eslint-config-prettier`

Expected: `package.json` 的 `devDependencies` 新增上述工具链依赖且安装成功。

- [ ] **Step 3: 改写 `vite.config.ts`，加入 UnoCSS 插件与 `@` 路径别名**

```ts
import { fileURLToPath, URL } from "node:url";
import UnoCSS from "unocss/vite";
```

Expected: `vite.config.ts` 同时保留 Tauri dev server 配置，并在 `plugins` 中包含 `vue()` 和 `UnoCSS()`，`resolve.alias["@"]` 指向 `src`。

- [ ] **Step 4: 改写 `tsconfig.json`，补充 `baseUrl` 和 `paths`**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Expected: TypeScript 支持 `@/` 导入，且不破坏原有 bundler 模式配置。

- [ ] **Step 5: 新建 `uno.config.ts`**

```ts
import { defineConfig, presetAttributify, presetUno } from "unocss";

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
});
```

Expected: UnoCSS 配置可被 `vite.config.ts` 正常引用。

- [ ] **Step 6: 新建 ESLint 与 Prettier 配置**

Expected:
- `eslint.config.mjs` 使用 flat config，覆盖 `ts`、`vue` 文件
- `.prettierrc.json` 指定统一格式规则
- `.prettierignore` 忽略 `dist`、`src-tauri/target` 等构建产物

- [ ] **Step 7: 调整脚本命名以匹配规格**

Expected: `package.json` 至少包含以下脚本：
- `dev`: `vite`
- `tauri:dev`: `tauri dev`
- `build`: 生产桌面包构建入口，形如 `tauri build`
- `lint`: ESLint 检查入口
- `format`: Prettier 格式化入口

- [ ] **Step 8: 运行代码规范命令做首轮校验**

Run: `pnpm lint`

Expected: 若配置完整，命令可以执行；如有模板默认代码不符合新规则，此时应暴露出待修复问题。

- [ ] **Step 9: 提交工程化配置**

```bash
git add package.json pnpm-lock.yaml vite.config.ts tsconfig.json README.md uno.config.ts eslint.config.mjs .prettierrc.json .prettierignore
git commit -m "chore: add frontend tooling and quality config"
```

### Task 3: 建立应用骨架并接入 Router、Pinia、UnoCSS、Less

**Files:**
- Modify: `src/main.ts`
- Modify: `src/App.vue`
- Create: `src/app/setup-app.ts`
- Create: `src/router/index.ts`
- Create: `src/router/routes.ts`
- Create: `src/stores/counter.ts`
- Create: `src/components/AppShell.vue`
- Create: `src/styles/index.less`
- Create: `src/styles/theme.less`
- Create: `src/styles/utilities.less`

- [ ] **Step 1: 新建路由表和路由实例**

```ts
import { createRouter, createWebHistory } from "vue-router";
```

Expected: `src/router/routes.ts` 导出 `Home` 和 `About` 两条路由，`src/router/index.ts` 创建并导出路由实例。

- [ ] **Step 2: 新建示例 Pinia store**

```ts
import { defineStore } from "pinia";
```

Expected: `src/stores/counter.ts` 提供一个简单的计数状态和派生值，用于页面演示。

- [ ] **Step 3: 新建应用统一注册入口**

Expected: `src/app/setup-app.ts` 接收 `App<Element>` 实例并集中注册 `Pinia`、`Router` 和全局样式依赖。

- [ ] **Step 4: 新建全局 Less 样式文件**

Expected:
- `src/styles/theme.less` 定义颜色、圆角、阴影、间距等主题变量
- `src/styles/utilities.less` 放少量全局辅助类
- `src/styles/index.less` 统一引入主题和工具样式

- [ ] **Step 5: 改写 `src/main.ts` 与 `src/App.vue`**

Expected:
- `src/main.ts` 使用 `createApp(App)` 并调用 `setupApp`
- `src/App.vue` 只负责挂载 `AppShell`
- `src/components/AppShell.vue` 内部负责导航区、页面容器和 `RouterView`
- 引入 `virtual:uno.css` 和 `@/styles/index.less`

- [ ] **Step 6: 运行 Lint，确认骨架接入没有语法问题**

Run: `pnpm lint`

Expected: 通过或仅剩页面尚未创建导致的导入错误，确保问题集中在下一任务可解决范围内。

- [ ] **Step 7: 提交应用骨架**

```bash
git add src/main.ts src/App.vue src/app src/router src/stores src/styles
git commit -m "feat: add app shell routing and state bootstrap"
```

### Task 4: 实现桌面端默认页面与 Tauri 原生命令示例

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/tauri.conf.json`
- Create: `src/views/HomeView.vue`
- Create: `src/views/AboutView.vue`
- Create: `src/components/RuntimeStatusCard.vue`
- Create: `src/components/GreetPanel.vue`
- Create: `src/lib/tauri.ts`
- Modify: `src/components/AppShell.vue`

- [ ] **Step 1: 新建前端 Tauri 调用封装**

```ts
import { invoke } from "@tauri-apps/api/core";
```

Expected: `src/lib/tauri.ts` 暴露如 `getGreeting(name: string)` 之类的函数，避免页面直接散落 `invoke` 调用。

- [ ] **Step 2: 改写 `src-tauri/src/lib.rs` 的命令示例**

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! Desktop shell is ready.")
}
```

Expected: Rust 侧保留最小命令回环，`invoke_handler` 注册 `greet`，不额外引入复杂插件或状态。

- [ ] **Step 3: 创建桌面端首页与 About 页面**

Expected:
- `src/views/HomeView.vue` 显示应用标题、简短说明、运行时状态、问候命令演示区，以及一个用于后续业务模块扩展的内容占位区
- `src/views/AboutView.vue` 说明技术栈与项目目标

- [ ] **Step 4: 创建页面组件并完善导航骨架**

Expected:
- `src/components/AppShell.vue` 提供顶部导航和内容区
- `src/components/RuntimeStatusCard.vue` 展示当前环境、路由或桌面状态
- `src/components/GreetPanel.vue` 提供输入框、按钮和原生命令返回值展示

- [ ] **Step 5: 在首页消费并展示 Pinia 示例状态**

Expected: `src/views/HomeView.vue` 或其子组件中实际使用 `src/stores/counter.ts`，至少展示一个可交互的计数值或派生值，证明 `Pinia` 已经真实接入页面而不是仅创建未使用的 store。

- [ ] **Step 6: 根据桌面端场景调整窗口基础配置**

Expected: `src-tauri/tauri.conf.json` 至少明确窗口标题、最小尺寸或默认尺寸中的一项，使启动界面更像桌面应用而不是网页演示页。

- [ ] **Step 7: 运行桌面开发命令验证首页与命令交互**

Run: `pnpm tauri:dev`

Expected: 桌面窗口正常打开，导航可切换，首页点击按钮后能展示 Rust 侧返回的问候语，同时能看到并操作 Pinia 示例状态和业务内容占位区。

- [ ] **Step 8: 提交默认产品界面**

```bash
git add src-tauri/src/lib.rs src-tauri/tauri.conf.json src/views src/components src/lib
git commit -m "feat: add desktop starter pages and tauri greet flow"
```

### Task 5: 收尾验证并更新使用说明

**Files:**
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1: 更新 `README.md` 的启动、构建和目录说明**

Expected: 文档至少覆盖 `pnpm install`、`pnpm dev`、`pnpm tauri:dev`、`pnpm build`、`pnpm lint`、`pnpm format` 的用途。

- [ ] **Step 2: 运行前端开发命令做独立验证**

Run: `pnpm dev`

Expected: Vite 在 `http://localhost:1420` 或模板默认端口成功启动，无致命报错。

- [ ] **Step 3: 运行生产构建验证**

Run: `pnpm build`

Expected: 命令成功完成，生成 Tauri 桌面构建产物；如果环境缺少某些系统依赖，需要记录在 README 或执行备注中。

- [ ] **Step 4: 运行格式化命令**

Run: `pnpm format`

Expected: 项目文件按 Prettier 规则格式化完成。

- [ ] **Step 5: 再次运行 lint，确认最终状态**

Run: `pnpm lint`

Expected: 通过，无未处理的 ESLint 错误。

- [ ] **Step 6: 提交最终可用脚手架**

```bash
git add README.md package.json pnpm-lock.yaml .
git commit -m "feat: finalize tauri vue desktop starter"
```

## 完成定义

当以下条件全部满足时，本计划可视为完成：

- 当前仓库可直接作为 `pnpm` 项目使用
- `pnpm tauri:dev` 能启动桌面应用
- `pnpm build` 能产出生产桌面包
- 页面具备首页、About、导航、Pinia 示例、Tauri 原生命令示例
- 首页包含可扩展的业务内容占位区
- 样式体系同时具备 `UnoCSS` 和 `Less`
- 代码规范命令和基础文档可用
