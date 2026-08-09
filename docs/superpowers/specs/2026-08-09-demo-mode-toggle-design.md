# 演示模式切换 & 全功能演示入口 设计规格

- 日期：2026-08-09
- 状态：已批准，待实现
- 范围：web-spa 前端（登录页、子页、路由）+ 管理员面板
- 背景：
  - 现有演示入口为 LoginPage 底部两张虚线卡片（演示·教师端 / 演示·学生端），与正式入口混放，位置不符合视觉层级。
  - 管理员面板演示入口缺失。
  - 学生演示被锁死在单一示例学生（王小雅），无法体验班级内其他学生的完整流程。
  - `/admin` 路由存在结构性 bug：被学生/教师 token 的 `ProtectedLayout` 守卫拦截，管理员的 `ad_` token 无法通过。

---

## 0. 演示 vs 正式 的定义

两种模式**共享同一后端与同一套数据**。区别仅在于**登录流程的快捷程度**：

| 维度 | 正式模式 | 演示模式 |
|---|---|---|
| 学生进入 | `/identity` 手动输入班级码 → 选学生卡 | `/identity` 自动预填 LTZ2024 → 选学生卡（全班可选，不锁死王小雅） |
| 教师进入 | `/teacher/login` 输入姓名+班级码+密码 | 一键调用 `api.teacherEnter('LTZ2024','李老师')` 直达班级管理 |
| 管理员进入 | `/admin` 手动输入管理员密码 | `/admin` 面板 LoginPanel 内提供「演示快速进入」按钮，使用 `admin123` 一键登录 |
| 登录后功能 | 全功能 | 全功能（与正式完全一致） |

---

## 1. 模式状态存储

### 1.1 存储位置

`localStorage`，键名 `xx_login_mode`，值枚举：

```
'formal'  —— 正式模式（默认；键不存在时按 formal 处理）
'demo'    —— 演示模式
```

持久化：刷新后保留；用户不主动切换则保持当前选择。

### 1.2 预置常量（集中化）

在 `web-spa/src/demo.ts`（或 `constants.ts`）导出：

```ts
export const DEMO = {
  LOGIN_MODE_KEY: 'xx_login_mode' as const,
  CLASS: 'LTZ2024',
  TEACHER: '李老师',
  STUDENT: '王小雅',
  ADMIN_PASSWORD: 'admin123',
} as const
```

所有组件引用该常量文件，禁止在文件内硬编码。

---

## 2. 切换按钮组件 `<DemoModeToggle />`

抽公共组件：`web-spa/src/components/DemoModeToggle.tsx`，被 5 个登录相关页面引用。

### 2.1 Props

```ts
type DemoModeToggleProps = {
  /** 'switch-content': 修改状态，父组件基于当前模式重渲染内容。用于 LoginPage。
   *  'navigate-home': 修改状态后 navigate('/login', { replace: true })。用于子页。 */
  variant: 'switch-content' | 'navigate-home'
  /** (variant='switch-content' 时) 模式变更时的回调，供父组件重新渲染或更新自己的 state。 */
  onModeChange?: (next: 'formal' | 'demo') => void
}
```

### 2.2 视觉

- 位置：各页面容器内 `absolute top-5 right-5 z-20`。
- 尺寸：tag 级小型次级按钮（`h-8 px-3.5 rounded-full`），不抢主视觉。
- 图标 + 文案：
  - 当前为 `formal` → 显示 `✨ 演示模式`，提示切到演示
  - 当前为 `demo` → 显示 `🏠 正式模式`，提示切回正式
- hover：阴影 + 轻微上移。

### 2.3 点击逻辑

1. 读 `localStorage.xx_login_mode` → 计算 next。
2. 写回 `localStorage.xx_login_mode = next`。
3. 若 `variant === 'switch-content'`：调 `onModeChange?.(next)`，父组件（LoginPage）重渲染卡片内容。
4. 若 `variant === 'navigate-home'`：`navigate('/login', { replace: true })`，LoginPage 加载时会从 localStorage 读新值渲染。

---

## 3. 登录相关 5 个页面的改造

### 3.1 `/login` — LoginPage（主改造页）

**放置**：`variant="switch-content"` + 右上角绝对定位。
**状态**：组件内部 `useState<'formal' | 'demo'>`，初始值读 localStorage；`onModeChange` 设置本地 state 触发重渲染。

#### 正式模式（formal）内容区

- 顶部两张大角色卡（**完全保留现有样式、图片、文案、动画**）：
  - 「我是学生」 → Link 到 `/identity`
  - 「我是老师」 → Link 到 `/teacher/login`
- **删除** 现有的底部"免登录预览演示"一整段（分割线 + 两张虚线卡片 + 对应常量 `demoEntries`）。
- 保留最底部小字："创建自定义班级或输入真实教师账号仍需要登录"。

#### 演示模式（demo）内容区

移除原两张大角色卡 + 底部演示段，改为：居中栅格放两张虚线边框快捷卡片，**左：学生演示 / 右：教师演示**（与正式左学生右教师对齐，视觉不跳动）。

沿用现有 `demoEntries` 的卡片样式（`border-dashed border-line bg-white/70 hover:border-brand/40 hover:bg-white hover:shadow-card`）。

| 卡片 | 主标题 | 副文案 | 图标 | 点击行为 |
|---|---|---|---|---|
| 学生演示（左） | **学生演示** | 进入 LTZ2024 班级自由选择你的身份，小信语音、书信、成长档案全功能 | `users`（或现有的学生相关图标） | `navigate('/identity', { state: { preloadClass: DEMO.CLASS } })` |
| 教师演示（右） | **教师演示** | 以李老师身份进入 LTZ2024 班级，班级管理、备课、学情全功能 | `teacher` | 调 `api.teacherEnter(DEMO.CLASS, DEMO.TEACHER)` → 成功后 `setSession` → `navigate('/teacher', { replace: true })`，失败 `alert(e.message)` |

动画：两张卡片 `animate-rise` 延迟 0.12s、0.22s 依次出现。

### 3.2 `/identity` — IdentityPage（学生选班级码/身份）

**放置**：右上角 `DemoModeToggle variant="navigate-home"`。

**新增支持：通过 location.state 预载班级码**

```ts
const location = useLocation()
const preloadClass = (location.state as { preloadClass?: string } | null)?.preloadClass
```

挂载时：

- 若 `preloadClass` 存在（从 LoginPage 演示卡过来）：
  1. 调 `api.getClass(preloadClass)` 拉班级数据
  2. 设置 `code = preloadClass`
  3. 设置 `className = cls.class_name`，`students = cls.students`
  4. `setStep('pick')` —— 直接跳到选学生卡步骤
  5. 默认高亮：把王小雅（`DEMO.STUDENT`）作为初始选中项（`setSelected(王小雅 student.id)`），用户可自由改选
- 否则按当前流程正常跑。

其余所有逻辑（搜索、选卡、`enter` 调用 `api.enter` + `setSession` 跳转等）**完全不动**，保证演示与正式登录后行为一致。

### 3.3 `/teacher/login` — TeacherLoginPage

**放置**：右上角 `DemoModeToggle variant="navigate-home"`。其他逻辑（表单、`api.teacherEnter`、跳转）**不动**。

### 3.4 `/teacher/register` — TeacherRegisterPage

**放置**：右上角 `DemoModeToggle variant="navigate-home"`。其他逻辑不动。

### 3.5 `/admin` — AdminConfigPage

**放置**：LoginPanel 所在容器的右上角（或 LoginPanel 外框之上，保持 tag 按钮可见）。使用 `variant="navigate-home"`（点了跳回 `/login` 并切换模式）。

---

## 4. 管理员面板演示快速进入

### 4.1 LoginPanel 加演示按钮

在 `LoginPanel` 组件的密码输入框上方、错误信息区域上方，插入：

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [ ⚡ 演示快速进入管理员 ]            ← 新按钮       │
│  ──────────────────────────────                      │
│  管理员密码：[ ••••••••••        ]                   │
│  [错误提示区]                                         │
│  [登 录]                                              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- 按钮样式：`btn-line` 次级、全宽，前置 sparkle 图标。
- 点击行为：
  1. 设置 `loading = true`，`setError('')`
  2. 调 `await api.adminLogin(DEMO.ADMIN_PASSWORD)`
  3. 成功 → 直接调用面板内已有的 `onSuccess()`（进入控制面板内容）
  4. 失败 → `setError(e.message)`，`setLoading(false)`
- 按钮**无论当前模式开关是否为演示，始终显示**（方便正式入口进入的用户也可一键尝鲜演示账号）。

### 4.2 路由修复（必做，结构性 bug）

**现状问题**：`router.tsx` 中 `/admin` 放在 `ProtectedLayout` 包裹内部，但 `ProtectedLayout.isAuthenticated()` 用的是学生/教师的 `st_` token 正则（`isValidToken` 只认 `st_` 前缀），管理员 token 前缀 `ad_` 存在 `localStorage.admin_token` 里，完全走不通 `ProtectedLayout`，会被 301 回 `/`。

**修复**：把 `/admin` 路由从 `ProtectedLayout` 内移到外，作为公开路由（与 `/login`、`/identity` 同层）。

修复后的路由结构：

```
/                → SplashPage
/login           → LoginPage（含模式切换）
/identity        → IdentityPage（含模式切换）
/teacher/login   → TeacherLoginPage（含模式切换）
/teacher/register → TeacherRegisterPage（含模式切换）
/admin           → AdminConfigPage（公开路由，自身内置 LoginPanel 守卫 + 演示按钮）
[ProtectedLayout]
  ├ [StudentGuard]
  │   ├ /student /student/voice /student/letters /student/growth
  ├ [TeacherGuard]
  │   └ /teacher/**（TeacherConsoleLayout children）
* → Navigate to /
```

`AdminConfigPage` 的自包含守卫逻辑不变（`useEffect` 或首渲染时 `if (!!getAdminToken()) setLoggedIn(true)` → 显示配置面板 / 否则显示 LoginPanel），所以无需外层 Guard。

---

## 5. 受影响文件清单

| 文件 | 改动类型 | 说明 |
|---|---|---|
| `web-spa/src/components/DemoModeToggle.tsx` | **新增** | 模式切换按钮组件 |
| `web-spa/src/demo.ts`（或 `constants/demo.ts`） | **新增** | 预置常量集中存放 |
| `web-spa/src/pages/login/LoginPage.tsx` | 大改 | 删底部演示段，按模式动态渲染两张大卡 / 两张演示快捷卡，加右上角 toggle |
| `web-spa/src/pages/identity/IdentityPage.tsx` | 中改 | 支持 `location.state.preloadClass` 自动进入 pick 步，加右上角 toggle |
| `web-spa/src/pages/teacher/login/TeacherLoginPage.tsx` | 小改 | 加右上角 toggle |
| `web-spa/src/pages/teacher/register/TeacherRegisterPage.tsx` | 小改 | 加右上角 toggle |
| `web-spa/src/pages/admin/AdminConfigPage.tsx` | 中改 | LoginPanel 加"演示快速进入管理员"按钮，加右上角 toggle |
| `web-spa/src/router.tsx` | 小改 | `/admin` 从 ProtectedLayout 移出为公开路由 |

---

## 6. 验收要点（自测 checklist）

1. **右上角切换按钮**：5 个页面右上角都能看到，点击文字在 `✨演示模式` 和 `🏠正式模式` 间切换；刷新后状态保留。
2. **LoginPage 正式模式**：只有"我是学生/我是老师"两张大卡，没有任何底部演示入口；学生卡→/identity、教师卡→/teacher/login。
3. **LoginPage 演示模式**：两张虚线卡（左学生演示 / 右教师演示），学生卡点击后进入 IdentityPage pick 步，LTZ2024 已填好，王小雅默认选中但可改其他学生；教师卡点击后直接进入 `/teacher` 并显示李老师 / LTZ2024 班级界面。
4. **IdentityPage 子页切换**：在身份选择页右上角点切换，跳回 `/login` 并应用新模式。
5. **/admin 路由可达性**：直接访问 `http://localhost:5173/admin` 能看到管理员登录面板（不会被弹回 `/`）；LoginPanel 密码框上方有「⚡ 演示快速进入管理员」按钮，点击后无需输入密码即可进入控制面板内容。
6. **全功能访问**：演示模式登录后的学生端、教师端、管理员端 UI 与功能与正式完全一致（无隐藏/禁用/灰掉的按钮或菜单）。
7. **token 与鉴权**：学生/教师 token 仍走 `X-Auth-Token`；管理员 token 仍走独立 `localStorage` + adminRequest 的 `X-Auth-Token`，互不冲突。
8. **回归**：正式登录流程（/identity 手动输班级码 /teacher/login 手填账号）完全不受影响。

---

## 7. 不在本次范围

- 后端任何改动（所有功能通过现有 API 实现）。
- 登录后页面（`/student/**`、`/teacher/**`）加切换按钮（如需在登录后演示模式切换，另开后续 spec）。
- 数据库预置数据变更（LTZ2024 / 李老师 / 王小雅 / admin123 已在 demo 数据中存在）。
