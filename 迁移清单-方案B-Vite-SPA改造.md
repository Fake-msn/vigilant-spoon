# 小信 · 方案 B 迁移执行清单（Next.js → Vite SPA）+ 任务定义补充 v1.2

> 版本：v1.2 · 2026-08-06（新增 §9 后端对接专项方案）
> 基线：`小信-开发任务清单.md` v3.0（下称"原清单"）
> 上游分析：`docs/系统架构设计文档.md`
> 本文档地位：原清单的**前端修订补丁 + 逐文件迁移映射表**，与原清单配合使用；冲突处以本文档为准。

---

## 0. 决策记录（本次定案）

| # | 决策 | 结论 |
|---|------|------|
| D1 | 前端框架 | **方案 B：全新 Vite + React 18 + TS SPA**，逐页搬迁 UI，符合原清单 FE-M0-01 |
| D2 | eslint 门禁 | 现有项目 `eslint.ignoreDuringBuilds` 的写法废弃；新工程 lint + typecheck 为硬门禁，任何人不得关闭 |
| D3 | 教师端"学情档案 / 成长档案 / 我的课程" | **不是加分项，是正式验收项**。原清单 FE-M5 范围不全，按 §1 补充任务定义扩展（见 §2 修订项） |
| D4 | 宠物状态模型 | 弃用原"心情（开心/平静/低落）+ vitality"模型，改为**三态状态机：日常 / 灰色 / 欢呼**（见 §1.4） |
| D5 | 成长档案（教师端） | 只展示电子宠物形象与状态，**不展示任何评分**（成绩归学情档案，评分归服务端 ScoreCard，不进该页 UI） |

---

## 1. 任务定义补充（契约级修订）

### 1.1 教师端四功能（全部为一等验收项）

| 功能 | 路由 | 数据来源 | 说明 |
|------|------|----------|------|
| 备课（新建课程） | `/teacher/lesson` | R9 生成 / R10 查看 | 原 FE-M5-01 不变 |
| 学情档案 | `/teacher/academic` | **新增 R14 导入 / R15 汇总** | 见 §1.2 |
| 成长档案 | `/teacher/growth` | R4 宠物状态（批量） | 见 §1.3，**无评分** |
| 我的课程 | `/teacher/courses` | R10 列表 | 往次课程留痕，含主题/目标/参与/留痕摘要 |

> 教师端沿用现有 `(console)` 侧边栏四导航结构，导航项更新为：备课 / 学情档案 / 成长档案 / 我的课程。

### 1.2 学情档案 · 详细定义

**录入内容（每生一条）**：

| 字段 | 类型 | 说明 |
|------|------|------|
| 各科成绩 | `{subject, score}[]` | 支持文件导入（Excel/CSV）与手动录入 |
| 校内角色 | `role: '组员' \| '小组长' \| '班委' \| '课代表'` | 即原"师生关系"字段的具体化：孩子在班级里的职务/身份 |
| 教师评语 | `note: string` | 老师对该生的观察与评价（自由文本） |

**用途（写入契约注释，防止后续走样）**：
- 成绩 + 评语 + 校内角色 → 进入小信的 **pre-stream 注入字段**（`injection_fields`），小信与学生对话时调阅，用于"讲一讲下一步发展规划"；
- 注入仍受原清单 ≤500 token 约束，成绩以摘要形式注入（非原始表格）；
- 教师端汇总视图：每生一行（各科成绩 + 角色 + 评语），顶部班级概览（在册人数 / 平均分 / 待关注人数）。

**新增接口（建议编号，需落入后端 `app/schemas/`）**：
- `R14  POST /api/classes/{code}/academic` —— 学情导入（批量 upsert，幂等）
- `R15  GET  /api/classes/{code}/academic` —— 学情汇总（教师端表格）

### 1.3 成长档案（教师端）· 详细定义

- 内容：全班每个学生的**电子宠物形象墙**——宠物形象 + 当前状态（日常/灰色/欢呼）+ needs_care 提醒。
- **明确移除**：现有 UI 中的 `ScoreBars` 历次得分柱状图、成长值数字、评估摘要文本，一律不进该页。
- 灰色宠物置顶或标记，老师一眼看到"谁一周没有成长了"。

### 1.4 宠物三态状态机（替换原清单 BE-B4-04 相关定义）

**状态集**：`daily`（日常）/ `gray`（灰色日常）/ `cheer`（欢呼）

**转移规则（纯函数，零 LLM，与原"宠物状态铁律"一致）**：

| 当前态 | 触发条件 | 目标态 | 触发源 |
|--------|----------|--------|--------|
| daily | 连续 7 天成长值增量 = 0 | gray | 定时任务 / 惰性计算 |
| gray | 获得任意成长值 | daily | 结算链（BE-B4-02） |
| daily | 老师话术被**正向话术闸门**认定为激励 | cheer | 评分服务输出的布尔信号（认定本身可用规则/关键词，状态转移不用 LLM） |
| gray | 同上（灰色学生被激励） | cheer | 同上 |
| cheer | cheer 持续满 72h（且期间无新激励） | daily 或 gray（回落时重判 7 天规则） | 惰性计算 |
| 任意 | 非法迁移（如 daily→daily 的重复置位） | 拒绝 + 断言 | 单测穷举 |

**联动**：进入 `gray` 时置 `needs_care = true`（写信必含关怀段 + 前端即时文案），恢复 `daily/cheer` 时清除。

**视觉映射**（复用现有 PixelArt 换肤机制，零新美术成本）：
- `daily` → `petPalette`（原"开心"配色）
- `gray` → `petPaletteSad` 改造为去饱和灰色版（重命名 `petPaletteGray`）
- `cheer` → 新增 `petPaletteCheer`（高饱和 + 宠物图片加 `animate-pop`/彩带元素）

---

## 2. 对原任务清单的修订项汇总

| 原条目 | 修订 | 说明 |
|--------|------|------|
| FE-M5 教师工作台（3 项） | 扩展为 5 项：备课表单 / **学情档案（R14/R15）** / **成长档案宠物墙（无评分）** / **我的课程（R10 列表）** / 课堂控制面板 | 对应 §1.1 |
| 契约 R1-R13 | 增补 **R14/R15**（学情导入与汇总）；`StudentProfile` 增加 `role` 字段；`GrowthView` 教师端视图**移除 score 字段** | 改 pydantic → gen:types → 双端测试 |
| BE-B4-04 宠物状态机 | 状态集与转移表按 §1.4 整体替换（原 vitality/心情模型废弃）；`needs_care` 改由 gray 态触发 | 铁律不变：纯函数零 LLM |
| BE-B3-03 注入字段 | `injection_fields` 增补：各科成绩摘要、校内角色、教师评语 | 仍受 ≤500 token 约束 |
| 验收指标表 | 增补 3 条（见 §6） | — |
| 砍单顺序 R6 | 学情档案/成长档案/我的课程**不在可砍范围**；可砍项更新为：RAG → 课堂面板 → 写信模板 | 教师端四功能是演示主线 |

---

## 3. 目标工程结构（Vite SPA）

```
web-spa/
├── index.html                  # 字体 @font-face + <title>小信</title>
├── vite.config.ts              # @tailwindcss/vite 插件 + @/ 别名
├── tsconfig.json               # strict，paths: @/* → src/*
├── eslint.config.js            # flat config，门禁不可关闭
├── vitest.config.ts            # jsdom + @/ 别名
├── public/design/              # 原样复制现有 8 个素材
└── src/
    ├── main.tsx / router.tsx   # react-router v6 路由表（§5.2）
    ├── index.css               # 原 globals.css 平移（@theme 不动）
    ├── types/generated.ts      # gen:types 产物（禁手改）
    ├── api/client.ts           # R1-R15 REST client
    ├── ws/voice.ts             # WS 二进制协议层（FE-M2）
    ├── stores/session.ts       # session_token/profile（sessionStorage）
    ├── pages/
    │   ├── splash/             # /          闪屏
    │   ├── login/              # /login     角色选择
    │   ├── identity/           # /identity  班级码 + 姓名点选（R1/R2）
    │   ├── student/
    │   │   ├── home/           # /student
    │   │   ├── voice/          # /student/voice   AI 谈心（mode=classroom）
    │   │   ├── feedback/       # /student/letters[/:id]  信箱
    │   │   └── growth/         # /student/growth  我的成长档案
    │   └── teacher/
    │       ├── entry/          # /teacher   入口（建班/管班）
    │       ├── setup/          # /teacher/setup   建班向导（保留，见 §5.3）
    │       ├── lesson/         # /teacher/lesson  备课
    │       ├── academic/       # /teacher/academic 学情档案
    │       ├── growth/         # /teacher/growth   成长档案（宠物墙）
    │       ├── courses/        # /teacher/courses  我的课程
    │       └── classroom/      # /teacher/classroom 课堂控制面板
    ├── layouts/TeacherConsoleLayout.tsx   # (console) 侧边栏壳 → Outlet
    ├── components/Icon.tsx / art/*        # 原样平移（pixelData 改三态配色）
    ├── features/voice-session/            # audio.ts / player.ts / VoiceSession.tsx
    ├── mocks/data.ts           # 原 lib/data.ts 演示数据（仅供 mock/单测）
    └── __tests__/m1..m7/
```

---

## 4. 逐文件迁移映射表（现有文件 → 目标位置 + 改动点）

### 4.1 基建层（7 项）

| 现有文件 | 目标位置 | 改动点 |
|----------|----------|--------|
| `package.json` | `web-spa/package.json` | 删 next；加 `react-router-dom`、`openapi-typescript`、`vitest`、`@testing-library/react`、`jsdom`、`@tailwindcss/vite`、`eslint` flat 系列；scripts：`dev/build/preview/lint/typecheck/test/gen:types` |
| `next.config.ts` | —（废弃） | 由 `vite.config.ts` 替代；**`eslint.ignoreDuringBuilds` 不得带入新工程**（决策 D2） |
| `tsconfig.json` | `tsconfig.json` + `tsconfig.node.json` | Vite 标准双文件；保留 `@/*` 别名指向 `src/*`；`strict: true` |
| `postcss.config.mjs` | —（废弃） | Tailwind v4 改走 `@tailwindcss/vite` 插件，无需 postcss 配置 |
| `app/layout.tsx` | `index.html` + `src/main.tsx` | metadata → `<title>`/`<meta>`；`next/font` 马善政体 → **下载 woff2 自托管** + `@font-face`（变量名 `--font-ma-shan-zheng` 保持不变，CSS 零改动）；回退链 `Xingkai SC/楷体` 已在 `--font-cal` 中 |
| `app/globals.css` | `src/index.css` | **原样平移**（@theme 令牌、组件类、动画全部保留）；仅确认 `@import "tailwindcss"` 写法适配 vite 插件 |
| `next-env.d.ts` / `tsconfig.tsbuildinfo` | —（废弃） | 由 `vite/client` 类型替代 |

### 4.2 学生侧页面（6 项）

| 现有文件 | 目标位置 | 改动点 |
|----------|----------|--------|
| `app/page.tsx`（闪屏） | `src/pages/splash/SplashPage.tsx` | `next/link`→`Link`；`next/image fill`→`<img className="absolute inset-0 h-full w-full object-cover">`；其余零改动 |
| `app/login/page.tsx` | `src/pages/login/LoginPage.tsx` | 同上机械替换；学生卡 href 改 `/identity` |
| `app/onboarding/identity/page.tsx` | `src/pages/identity/IdentityPage.tsx` | **逻辑重写**（FE-M1-02/03）：① 先输班级码 → 调 R1 拿名单渲染卡片（现有卡片 UI 保留）；② 点选姓名 → 调 R2 → `sessionStorage` 存 `session_token` + profile；③ 错误分支：班级码 404 提示、姓名不在名单显示可选列表；④ 不再用 `?s=` 透传（决策见 §5.1） |
| `app/home/page.tsx` | `src/pages/student/home/StudentHomePage.tsx` | `useSearchParams` 移除，学生信息改从 `stores/session.ts` 读；去掉 `<Suspense>` 包装；地区改从 profile 读（不再取 `regions[0]` 硬编码） |
| `app/chat/page.tsx` | `src/pages/student/voice/VoicePage.tsx` + `src/features/voice-session/*` | **交互内核替换，UI 保留**：① `chatScript` + `setTimeout` 状态机删除；② `idle/listening/thinking` 三态映射到 WS 事件——listening=录音上行中、thinking=`vad_end`→首个 `audio_chunk`、AI 说话态新增；③ 消息流改由 `transcript` 事件渲染；④ 宠物三态卡改接 R4 轮询（daily/gray/cheer，见 §1.4）；⑤ "保存电子宠物"改走 R5→R6 生图 job 轮询；⑥ `Wave`/麦克风按钮/右侧栏 JSX 全部保留 |
| `app/mailbox/page.tsx` + `app/mailbox/[id]/page.tsx` | `src/pages/feedback/LetterListPage.tsx` + `LetterDetailPage.tsx` | ① 数据源 `letters` 常量 → R7 列表 + 空态；② 详情页弃 SSG（`generateStaticParams` 删除），改 `:id` 参数客户端渲染；③ 新增 R8"触发生成"按钮 + JobRef 状态显示（FE-M6-02）；④ 信纸视觉（邮票/邮戳/装饰条）原样保留 |

### 4.3 教师侧页面（8 项）

| 现有文件 | 目标位置 | 改动点 |
|----------|----------|--------|
| `app/teacher/page.tsx` | `src/pages/teacher/entry/TeacherEntryPage.tsx` | 机械替换；入口卡"管理老班级"指向 `/teacher/courses` |
| `app/teacher/(console)/layout.tsx` | `src/layouts/TeacherConsoleLayout.tsx` | `usePathname`→`useLocation`；children→`<Outlet/>`；导航四项更新为：备课 `/teacher/lesson`、学情档案、成长档案、我的课程（课堂面板入口加在课程详情内） |
| `app/teacher/setup/page.tsx` | `src/pages/teacher/setup/TeacherSetupPage.tsx` | **保留**（建班是学情导入的前置）；`importDemo` 改真实文件解析（xlsx/csv → R14 名单部分）；完成后跳转 `/teacher/lesson` |
| `app/teacher/(console)/new-course/page.tsx` | `src/pages/teacher/lesson/LessonPage.tsx` | ① 备课小助手对话接 R9（lesson 角色模式，真实流式）；② 三个快捷话题按钮保留为开场建议；③ "保存并开课"→ R10 落库；④ `subject/goal` 校验逻辑保留 |
| `app/teacher/(console)/academic/page.tsx` | `src/pages/teacher/academic/AcademicPage.tsx` | **按 §1.2 改造**：① "师生关系"列改为"校内角色"（组员/小组长/班委/课代表下拉）；② 新增"教师评语"列编辑（现有 `note` 字段承接）；③ 顶部"文件导入/手动录入"按钮接 R14；④ 表格数据源 `academicRows` 常量 → R15；⑤ 页头说明文案改为"成绩与评语会喂给小信，对话时用于聊发展规划" |
| `app/teacher/(console)/growth/page.tsx` | `src/pages/teacher/growth/TeacherGrowthPage.tsx` | **按 §1.3 改造（删评分）**：① 删除 `ScoreBars` 组件、成长值数字、评估摘要列；② 改为宠物形象墙卡片：PetView + 三态标签（日常/灰色/欢呼）+ needs_care 提醒；③ 顶部"本周心理信号"卡保留，数据源改 gray 态名单；④ `moodConf` 替换为 §1.4 三态配色映射 |
| `app/teacher/(console)/courses/page.tsx` | `src/pages/teacher/courses/CoursesPage.tsx` | 数据源 `courseRecords` 常量 → R10 列表；卡片进入课堂面板 `/teacher/classroom?course=:id`（R11-R13，FE-M5-02 课堂控制为新增页，现有无对应文件） |
| —（新增） | `src/pages/teacher/classroom/ClassroomPage.tsx` | 全新页：R11 发起 / R12 控制（pause/resume/next_student/switch_content）/ R13 轮询；按钮状态随 ClassroomStatus 切换 + 乐观更新回滚；投屏布局 |

### 4.4 组件层（6 项）

| 现有文件 | 目标位置 | 改动点 |
|----------|----------|--------|
| `components/Icon.tsx` | `src/components/Icon.tsx` | 原样平移 |
| `components/art/PixelArt.tsx` | `src/components/art/PixelArt.tsx` | 原样平移 |
| `components/art/pixelData.ts` | `src/components/art/pixelData.ts` | 配色语义按 §1.4 改造：`petPalette`（日常）保留；`petPaletteSad`→`petPaletteGray`（去饱和灰）；新增 `petPaletteCheer`；`petPaletteCalm` 删除（三态无"平静"）；`cakeMap/dreamMap/starMap` 保留 |
| `components/art/KidAvatar.tsx` | `src/components/art/KidAvatar.tsx` | 原样平移；头像分配键由"students 数组下标取模"改为 profile 中的 `avatar_seed`（服务端下发，保证跨端一致） |
| `components/art/TeacherAvatar.tsx` | `src/components/art/TeacherAvatar.tsx` | 原样平移 |
| `components/art/RegionIcon.tsx` | `src/components/art/RegionIcon.tsx` | 原样平移；`RegionKey` 类型移入 `types/`（与后端契约对齐，地区枚举以后端为准） |

### 4.5 数据与资源层（3 项）

| 现有文件 | 目标位置 | 改动点 |
|----------|----------|--------|
| `lib/data.ts` | `src/mocks/data.ts` | **降级为 mock**：9 组常量保留供 vitest 与本地开发 mock 后端；页面一律改走 `api/client.ts`；类型 import 改自 `types/generated.ts`（字段名以契约为准映射，详见下表） |
| `public/design/*`（8 个素材） | `web-spa/public/design/` | 原样复制；引用路径不变 |
| 演示脚本数据（chatScript 等） | `src/mocks/` + 后端 `scripts/seed.py` | 谈心脚本的确定性字段（理想/承诺）迁到后端 seed，前端不持有业务话术 |

#### 4.5.1 字段映射对照表（契约 v2.1）

| 旧字段（`web/lib/data.ts`） | 契约字段（`app/schemas/`） | 落点 | 备注 |
|---------------------------|---------------------------|------|------|
| `Student.no` | `Student.student_no` | `mocks/data.ts`、`seed.py` | 学号，字符串 |
| `Student.dream` | `Student.ideal` | `mocks/data.ts`、`seed.py` | 理想职业，可选 |
| `AcademicRow.relation` | `AcademicRow.role` | `mocks/data.ts`、`seed.py` | 枚举映射：亲近→`member`/`group_leader`/`subject_rep`（语义就近，不得为 `class_committee`）；一般→`member`；疏远→`member` |
| `GrowthRow.petMood` | `GrowthRow.state` | `mocks/data.ts`、`seed.py` | `开心/平静/低落` → `daily`/`daily`/`gray`；`cheer` 由后端状态机根据正向信号触发 |
| `GrowthRow.growth` | — | 已删除 | 成长值不再作为展示字段，禁 score |
| `GrowthRow.scores` | — | 已删除 | 历次对话得分不再展示 |
| `GrowthRow.evalSummary` | — | 已删除 | AI 评估摘要不再展示 |
| `GrowthRow.signal` | `GrowthRow.signal` | `mocks/data.ts`、`seed.py` | 心理信号文案，仅 `gray` 态学生可含 |
| `CourseRecord.avgScore` | — | 已删除 | 课程平均分不再展示 |
| `Letter.unread` | `Letter.is_read` | `mocks/data.ts` | 语义取反：`unread=true` → `is_read=false` |

---

## 5. 全局替换规则（适用于所有页面）

### 5.1 框架 API 对照

| Next.js | Vite + react-router v6 | 备注 |
|---------|------------------------|------|
| `next/link` `<Link href>` | `<Link to>` | 机械替换 |
| `next/navigation useRouter().push` | `useNavigate()` | 机械替换 |
| `useSearchParams`（+ Suspense） | `useSearchParams`（react-router，无需 Suspense） | 仅详情页保留 query 用法 |
| `?s=` 身份透传 | **废弃**，改 `stores/session.ts`（sessionStorage） | 决策：顺手还债，mailbox/profile 回退默认学生的问题随之消失 |
| `next/image fill` | `<img>` + `absolute inset-0 h-full w-full object-cover` | 共 4 处（splash/login 背景、角色卡） |
| `next/font/google` | 自托管 woff2 + `@font-face` | CSS 变量名不变 |
| `'use client'` 指令 | 删除（SPA 全是客户端） | 机械删除 |
| `generateStaticParams` / 服务端组件 | 全部客户端渲染 | 仅 mailbox/[id] 涉及 |

### 5.2 路由表（router.tsx 一览）

```
/                  → Splash        /identity        → Identity（R1/R2）
/login             → Login         /student         → Home（守卫）
/student/voice     → Voice（守卫）  /student/letters → LetterList（守卫）
/student/letters/:id → LetterDetail /student/growth  → Growth（守卫）
/teacher           → Entry（守卫）  /teacher/setup   → Setup
/teacher           → TeacherConsoleLayout（守卫）
   ├─ lesson / academic / growth / courses / classroom
无 token → 一律重定向 /
```

### 5.3 门禁设置（决策 D2 落地）

- `eslint.config.js`：flat config，react/react-hooks/typescript-eslint 推荐集，**CI 与本地 lint 同源**；
- `npm run lint && npm run typecheck && npx vitest run` 作为每模块门禁命令，任何人不得添加 ignore 类配置；
- 旧工程的 `tsconfig.tsbuildinfo` 等缓存文件不进新仓库。

---

## 6. 验收指标增补（并入原清单 §8 总表）

| 指标 | 目标 | 测量 | 责任 |
|------|------|------|------|
| 学情导入可用 | 文件 + 手动双通道，导入后 R15 汇总一致 | 导入 8 人核对 | FE-M5 / BE（R14/R15） |
| 宠物三态转移 | 转移表单测穷举全过，0 非法迁移 | vitest/pytest | FE-M4 / BE-B4-04 |
| 成长档案无评分 | 页面渲染树中断言不含 score/growth 数字 | vitest 组件测试 | FE-M5 |
| lint/typecheck | 全量 0 error（门禁不可关闭） | CI | FE-M7-04 |

---

## 7. 执行顺序（对接原清单 Phase，仅列前端线）

```
P0  FE-M0  脚手架（§4.1 全部）+ gen:types 跑通            —— 门禁后进入 P1
P1  FE-M1  router.tsx + splash/login/identity（§4.2 前3行）
P2  FE-M2  ws/voice.ts + api/client.ts  →  FE-M3 语音页（chat 改造，§4.2 第5行）
P3  FE-M4  student/growth + PetView 三态 + feedback 信件页（§4.2 后2行）
P4  FE-M5  TeacherConsoleLayout + lesson + academic（R14/R15）
           + growth 宠物墙 + courses + classroom（§4.3 全部）
P5  FE-M7  联调 + 视觉对照（@theme 令牌逐页走查）+ 全量回归
```

每一 Phase 结束：lint+typecheck → vitest → 人工审核 → 下一 Phase（与原清单 §0.2 门禁一致）。

---

## 8. 风险与备注

1. **字体自托管**：马善政体需确认授权范围允许本地打包；若不可用，直接走回退链（行楷/楷体），视觉损失可接受。
2. **R14/R15 是新增契约**：需先落后端 pydantic（原清单 §0.3 契约变更流程），前端禁止手写这两个类型。
3. **setup 页定位**：不在教师端四功能内，但它是学情导入与班级码的前置，保留为初始化向导；若工期紧，可降级为"仅演示 seed 一个固定班级"，setup 页最后做。
4. **chatScript 话术归属**：演示铁律要求确定性字段（理想/承诺）来自后端 seed；现有 `chatScript` 仅作 mock 与演示脚本参考（FE-M7 演示脚本编写时的台词底稿）。
5. **avatar_seed**：现有"数组下标取模"的头像分配在真实名单下不稳定，需后端在 profile 中下发 `avatar_seed`，KidAvatar 逻辑不变。

---

## 9. 后端对接专项方案

> 本章回应六项检查：接口适配计划 / 新旧映射 / 兼容与联调 / 影响评估 / 测试验证 / 回滚预案。
> 前置事实：**旧系统是纯前端 Demo，没有后端、没有数据库、没有存量调用方**。因此"后端对接"的实质不是"迁旧接口"，而是"**新建 FastAPI 后端 + 前端从本地常量/mocks 切换为真实接口**"。以下按此实质展开。

### 9.1 接口落地与前端适配计划

接口分四批就绪，节奏与原清单 Phase 对齐（"接口就绪线"不变）：

| 批次 | 接口 | 后端模块 | 前端消费方 | 前端适配动作 |
|------|------|----------|------------|--------------|
| 第一批 | R1 班级名单 / R2 身份进入 | BE-B2 | FE-M1 identity 页 + session store | `api/client.ts` 首发两个方法；`stores/session.ts` 落 token |
| 第二批 | WS `/ws/voice`（上行 PCM16 二进制 / 下行 JSON 事件） | BE-B1/B3 | FE-M2/M3 语音页 | `ws/voice.ts` 协议层；`useMock` 开关先接 mock 事件流 |
| 第三批 | R3 档案（full/light）/ R4 宠物 / R5 生图 / R6 job 轮询 | BE-B4 | FE-M4 档案+宠物页 | PetView 轮询（退避）接 R4；生图走 R5→R6 |
| 第四批 | R7 信件列表 / R8 触发生成 / R9 备课 / R10 课程 / R11-R13 课堂 / **R14/R15 学情** | BE-B5/B6 | FE-M5/M6 教师端+信件页 | 逐页替换 `mocks/data.ts` 引用 |

**契约同步（唯一合法路径，原清单 §0.3 不变）**：

```
改 pydantic → 重启后端 → 前端 npm run gen:types → 双端跑该模块测试
```

- 前端**禁止手写** `src/types/generated.ts` 中已有类型；字段名映射（`dream→ideal` 等）在 gen 产物落地时一次性核对并登记到 `src/api/mappers.ts`（如需）。
- `api/client.ts` 统一封装：baseURL 走环境变量（`VITE_API_BASE`）、超时、错误规范化（业务码 → UI 文案）、token 注入；页面不直接 fetch。
- **mock 开关**：`VITE_USE_MOCK=true` 时 client/ws 全部路由到 `src/mocks/`，保证后端未就绪时前端可独立开发与演示。

### 9.2 新旧系统"接口"映射关系

旧系统没有 HTTP 接口，映射对象是**旧本地数据源与本地行为**：

| 旧数据源 / 行为（Next.js Demo） | 目标接口 / 通道 | 差异说明 |
|--------------------------------|----------------|----------|
| `students` 常量 | R1（名单）+ R2（进入返回 light 档案） | 增加 `avatar_seed`、`role` 字段 |
| `?s=` URL 透传身份 | R2 签发 `session_token`（sessionStorage） | 旧方式废弃，路由守卫接管 |
| `chatScript` + `setTimeout` 假对话 | WS `/ws/voice`（mode=classroom） | 台词底稿移交后端 seed；前端只渲染 transcript 事件 |
| `letters` 常量 + SSG 详情页 | R7 列表 / R8 触发生成（JobRef） | 详情页弃 SSG 改客户端渲染 |
| `academicRows` 常量 | R14 导入 / R15 汇总 | `relation` 字段具体化为 `role`；新增 `note` 评语 |
| `growthRows` 常量（含评分） | R4 宠物状态（批量）| **score/growth 数字不下发教师端成长档案视图**（契约层保证，见 §6 断言） |
| `courseRecords` 常量 | R10 课程列表 | traces 摘要保留 |
| `promises` / `chatHistory` 常量 | R3 full 视图 | 学生端档案页数据源 |
| 静态 `pet-baker.png` + PixelArt 三态 | R4 状态驱动 PixelArt 换肤 + R5/R6 异步生图 | PixelArt 降级为占位/兜底方案 |
| `regions` 常量 | R1 ClassInfo 内含地区 | `RegionKey` 枚举以后端契约为准 |

**映射核对动作**：第一批接口就绪时，按上表逐行开 PR 替换，PR 描述中必须注明"替换前数据源 → 接口"，评审逐行勾销。

### 9.3 接口兼容与联调安排

**兼容规则（契约演进纪律）**：

1. **只增不改不删**：新增字段可选、旧字段不删不改语义；确需 breaking change → 双端同一窗口发布，且走 §0.3 契约变更流程 + 在 `docs/api-changelog.md` 登记。
2. **OpenAPI diff 门禁**：CI 对 `/api/openapi.json` 做 diff，出现删除/改型 → 构建失败，强制人工确认。
3. **版本留痕**：契约在响应头带 `X-Contract-Rev`（git short hash），联调排障时一眼定位双端版本。

**联调三阶段**：

| 阶段 | 内容 | 环境 | 出口条件 |
|------|------|------|----------|
| ① mock 并行期 | 前端 `VITE_USE_MOCK=true` 独立开发；后端独立起服务 | 各自本地 | 双端模块测试各自全绿 |
| ② 分模块联调 | 按四批就绪线逐批接入：vite dev proxy 转发 `/api`、`/ws` 到本地后端，免 CORS | 本地后端（uvicorn）+ 前端 dev | 该批接口的正常/异常/超时用例全过 |
| ③ 全链路联调 | FE-M7：学生线（进入→对话→档案/宠物）+ 教师线（备课→课堂→写信）跑通 | 演示环境（见 9.6） | 原清单 §8 + 本文档 §6 指标全过 |

### 9.4 接口变更对现有调用方的影响评估

| 评估项 | 结论 |
|--------|------|
| 存量调用方 | **无**。旧系统是单机 Demo，无 App、无第三方、无其他前端消费其"数据" |
| 旧 Demo 本身 | 双轨期内保留可运行（不改动 `web_src/` 源码），作为视觉兜底与新功能参照系 |
| 受影响的真实对象 | 仅新前端自身 + 演示脚本；契约变更的影响面 = `gen:types` 重新生成后 typecheck 报错面，编译期即可全部暴露，无运行期隐性影响 |
| 数据库"迁移" | 无历史数据；`scripts/seed.py` 即全部初始数据。唯一要求：迁移脚本幂等（原清单 BE-B0-03 已含），且**补充 down 迁移**（见 9.6 回滚） |
| 灰度/分阶段放量 | 不适用（单班级演示场景）；用"双轨演示开关"替代灰度 |

### 9.5 对接测试验证方案（分层）

| 层 | 内容 | 工具 | 通过标准 |
|----|------|------|----------|
| 契约层 | OpenAPI diff；schema 示例请求/响应 round-trip | openapi-diff + pytest（BE-B0-06 扩展） | 无未登记 breaking；R1-R15 示例全过 |
| 后端层 | 原清单 tests/b0-b7 模块测试 | pytest | 全绿（各模块门禁已有） |
| 前端层 | 原清单 __tests__/m1-m7（mock 数据） | vitest | 全绿 |
| 联调层 | **接口测试矩阵**：每接口覆盖 正常 / 参数错 / 404 / 超时 / 重试幂等 五列 | vitest + 真实后端（stage ②） | 15 接口 × 5 列全过；R2 重复进入、R14 重复导入的幂等用例必须含 |
| WS 专项 | 帧封装字节数 / 乱序播放 / 断线重连不丢 token / error 冒泡 / 首响 P50<2s（10 轮） | vitest + ws probe | 原清单 FE-M2/M3/M6 用例 + P50 达标 |
| 验收层 | 原清单 §8 + 本文档 §6 增补指标 | acceptance.py + 人工 | 全过方可演示 |

### 9.6 上线切换与回滚预案

**部署形态**：前端静态构建产物（`dist/`）托管于任意静态服务；后端 uvicorn 单实例 + SQLite 文件库；演示现场可用一台机器全包。

**切换策略（双轨 → 软切 → 全量）**：

```
T0 双轨期：旧 Next.js demo 保持可访问；新 SPA 部署在内侧路径 /v2
T1 软切：演示前 3 天，验收指标全过 → 新 SPA 切到主路径，旧 demo 退到 /legacy 保留
T2 全量：演示当天，现场先开离线兜底（见 R3），网络正常则走真实链路
```

**回滚分级预案**：

| 级别 | 触发条件 | 动作 | 恢复时间 |
|------|----------|------|----------|
| R0 前端回滚 | 新 SPA 出现阻断性 UI 缺陷 | 静态服务指回上一版 `dist/`（保留最近 2 版构建产物）；极端情况指回 `/legacy` 旧 demo | < 5 分钟 |
| R1 后端回滚 | 接口 5xx 率异常 / 结算链出错 | 切换 uvicorn 到上一版镜像/代码；**SQLite 切换前定时备份**（每小时 `cp` 快照），回滚后按需还原快照；迁移脚本必须提供 down 迁移 | < 15 分钟 |
| R2 语音降级 | WS 二进制链路失败 / 首响 P50 持续 >2s | 按原清单 BE-B1-04 预案降级官方 JSON 示例；再不行降级为文本对话模式（语音页隐藏麦克风，走文字输入） | 即时（配置开关） |
| R3 演示离线兜底 | 现场无网 / 后端整体不可用 | 前端构建时 `VITE_USE_MOCK=true` 出一份**全 mock 离线包**随身携带；mock 数据 = 演示 seed，评委体验不断流 | 即时（预置） |

**预案纪律**：
- 演示前至少做一次 **R0+R3 回滚演练**并记录耗时，写入 `docs/acceptance.md`；
- R3 离线包是演示的最后一道保险，**每次演示前必须重新构建一次**（保证 mock 数据与最新演示脚本一致）；
- 回滚决策人：现场由演示负责人一键决定，无需逐级请示。
