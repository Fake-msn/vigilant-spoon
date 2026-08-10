# 演示模式切换 & 全功能演示入口 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现演示/正式模式一键切换（登录页右上方按钮），演示模式学生端自动预填 LTZ2024 身份选择页（全班学生可选，王小雅默认高亮）、教师端一键进入李老师/LTZ2024、管理员面板演示快速进入（admin123），同时修复 `/admin` 路由被 `ProtectedLayout` st_ token 守卫拦截的 bug。

**Architecture:** 集中化常量文件 + 可复用 `<DemoModeToggle>` 组件；模式状态通过 `localStorage.xx_login_mode` 持久化；LoginPage 按模式切换条件渲染两种内容布局（正式：两张大卡，演示：两张虚线快捷卡）；IdentityPage 通过 `location.state.preloadClass` 跳过班级码输入直接进入 pick 步骤；AdminConfigPage 的 LoginPanel 内嵌"演示快速进入"按钮，并把 `/admin` 路由从 ProtectedLayout 内移到外避免守卫错判。

**Tech Stack:** React 18 + TypeScript + Vite + react-router-dom v6 + Tailwind CSS（项目既有栈）

---

## 文件总览

| 操作 | 路径 | 职责 |
|---|---|---|
| Create | `web-spa/src/constants/demo.ts` | 集中化预置常量：DEMO 键、班级码、姓名、管理员密码 |
| Create | `web-spa/src/components/DemoModeToggle.tsx` | 模式切换按钮组件（两种 variant） |
| Modify | `web-spa/src/router.tsx` | 把 `/admin` 从 ProtectedLayout 移到公开路由层 |
| Modify | `web-spa/src/pages/login/LoginPage.tsx` | 删底部 demoEntries 段；顶部加 toggle；按 mode 渲染两张大卡 / 两张演示快捷卡 |
| Modify | `web-spa/src/pages/identity/IdentityPage.tsx` | 加右上角 toggle；支持 location.state.preloadClass 跳 pick 步 |
| Modify | `web-spa/src/pages/teacher/login/TeacherLoginPage.tsx` | 加右上角 toggle |
| Modify | `web-spa/src/pages/teacher/register/TeacherRegisterPage.tsx` | 加右上角 toggle |
| Modify | `web-spa/src/pages/admin/AdminConfigPage.tsx` | LoginPanel 加「演示快速进入管理员」按钮；未登录容器加右上角 toggle |

---

## Task 1: 新增集中化常量文件 `constants/demo.ts`

**Files:**
- Create: `web-spa/src/constants/demo.ts`

- [ ] **Step 1: 新建常量文件**

```ts
/**
 * 演示模式预置常量。
 * 所有演示账号/班级码/密码等硬编码值集中到此文件，禁止在组件内散落书写。
 */
export const DEMO = {
  /** localStorage key: 'formal' | 'demo' */
  LOGIN_MODE_KEY: 'xx_login_mode' as const,
  /** 默认演示班级码 */
  CLASS: 'LTZ2024',
  /** 演示教师姓名 */
  TEACHER: '李老师',
  /** 演示学生姓名（IdentityPage 默认高亮的选中） */
  STUDENT: '王小雅',
  /** 管理员面板演示快速登录密码 */
  ADMIN_PASSWORD: 'admin123',
} as const

export type LoginMode = 'formal' | 'demo'

/** 从 localStorage 读当前模式，不存在或非法值都返回 'formal' */
export function getLoginMode(): LoginMode {
  try {
    const raw = localStorage.getItem(DEMO.LOGIN_MODE_KEY)
    return raw === 'demo' ? 'demo' : 'formal'
  } catch {
    return 'formal'
  }
}

/** 写 localStorage，返回写入后的新值 */
export function setLoginMode(next: LoginMode): LoginMode {
  try {
    localStorage.setItem(DEMO.LOGIN_MODE_KEY, next)
  } catch {
    /* ignore storage errors (private mode etc.) */
  }
  return next
}

/** 翻转模式，formal → demo，demo → formal，返回新值 */
export function toggleLoginMode(): LoginMode {
  const cur = getLoginMode()
  const next: LoginMode = cur === 'formal' ? 'demo' : 'formal'
  return setLoginMode(next)
}
```

- [ ] **Step 2: 做一次 TS 检查（单文件，快速）**

Run: `cd web-spa && npx tsc --noEmit --pretty src/constants/demo.ts`
Expected: `error TS18003` 之类的 tsconfig warning 是正常的，只要不是这个文件自己报具体行错就 OK；或者直接跳过，到 Task 8 统一 `tsc`。

- [ ] **Step 3: Commit**

```bash
git add web-spa/src/constants/demo.ts
git commit -m "feat(demo): add centralized DEMO constants + login mode helpers"
```

---

## Task 2: 新增公共组件 `<DemoModeToggle />`

**Files:**
- Create: `web-spa/src/components/DemoModeToggle.tsx`
- Ref (read only): `web-spa/src/components/Icon.tsx`（确认已有 sparkle/类似图标；若无，则用纯文字不带小图标即可，不必新增 icon）

- [ ] **Step 1: 读取 Icon.tsx 确认图标名（防止引入不存在的 name）**

打开 `web-spa/src/components/Icon.tsx`，查找：
- 是否有 `sparkle` 或 `star`、`sparkles`、`magic` 这类发光图标（给 "演示模式" 按钮前置）
- 是否有 `home` 图标（给 "正式模式" 按钮前置）

如果都**没有**，两个按钮都不要前置图标，只保留文案 + emoji 字符 `✨` / `🏠` 直接放在文字前（用 span），避免运行时报错。

- [ ] **Step 2: 写组件文件**

```tsx
import { useNavigate } from 'react-router-dom'
import { getLoginMode, toggleLoginMode, type LoginMode } from '@/constants/demo'
import { Icon } from '@/components/Icon'

type DemoModeToggleProps =
  | {
      /** switch-content: 仅写 localStorage + 触发回调，由父组件基于模式重新渲染内容。用于 LoginPage。 */
      variant: 'switch-content'
      /** 模式变更时的回调，父组件用它更新本地 state 触发重渲染 */
      onModeChange: (next: LoginMode) => void
    }
  | {
      /** navigate-home: 写 localStorage + 跳 /login（replace）。用于 IdentityPage、teacher 登录注册、admin 登录屏等子页。 */
      variant: 'navigate-home'
    }

export function DemoModeToggle(props: DemoModeToggleProps) {
  const navigate = useNavigate()
  // 实时读当前值，保证按钮文字与状态一致（状态变化会来自父组件 setState → 重渲染）
  const mode = getLoginMode()

  const handleClick = () => {
    const next = toggleLoginMode()
    if (props.variant === 'switch-content') {
      props.onModeChange(next)
    } else {
      navigate('/login', { replace: true })
    }
  }

  // 根据 Step 1 的检查结果，选择合适的图标或 emoji
  // 如果有 sparkle/home 图标，使用 Icon；否则直接用 emoji 字符
  const formalLabel = (
    <>
      {/* ✅ 如果 Icon 有 sparkle，使用：<Icon name="sparkle" size={14} />；否则：<span aria-hidden>✨</span> */}
      <span aria-hidden>✨</span>
      <span>演示模式</span>
    </>
  )
  const demoLabel = (
    <>
      {/* ✅ 如果 Icon 有 home，使用：<Icon name="home" size={14} />；否则：<span aria-hidden>🏠</span> */}
      <span aria-hidden>🏠</span>
      <span>正式模式</span>
    </>
  )

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={mode === 'formal' ? '切换到演示模式' : '切换到正式模式'}
      className="btn-line absolute top-5 right-5 z-20 !h-8 !px-3.5 text-xs font-medium tracking-wide rounded-full inline-flex items-center gap-1.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      {mode === 'formal' ? formalLabel : demoLabel}
    </button>
  )
}
```

注意：
- 上面 emoji 是默认安全写法；若 Task 2 Step 1 确认 Icon 有对应图标，把 emoji span 替换成 Icon 组件即可。
- `absolute top-5 right-5 z-20` 保证放在页面容器的右上方；要求父级容器（LoginPage 等）要有 `relative` 或已经包含定位的元素。查看 LoginPage 根 div class 目前是 `relative mx-auto w-full ...`，已具备定位上下文。

- [ ] **Step 3: Commit**

```bash
git add web-spa/src/components/DemoModeToggle.tsx
git commit -m "feat(demo): add DemoModeToggle component (switch-content & navigate-home variants)"
```

---

## Task 3: 修复 router.tsx — `/admin` 从 ProtectedLayout 移出

**Files:**
- Modify: `web-spa/src/router.tsx`，重点是 `/admin` 路由那一段。

- [ ] **Step 1: 确认当前 router.tsx 结构**

当前结构（基于项目既有文件）：

```
createBrowserRouter([
  { path: '/', element: <SplashPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/identity', element: <IdentityPage /> },
  { path: '/teacher/login', element: <TeacherLoginPage /> },
  { path: '/teacher/register', element: <TeacherRegisterPage /> },
  { path: '/reset', element: <ResetPage /> },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        path: 'student',
        element: <StudentGuard><StudentLayout /></StudentGuard>,
        children: [ ... ],
      },
      {
        path: 'teacher',
        element: <TeacherGuard><TeacherConsoleLayout /></TeacherGuard>,
        children: [ ... ],
      },
      // ↓ 当前 bug：/admin 被放在 ProtectedLayout 内
      { path: 'admin', element: <AdminConfigPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
```

- [ ] **Step 2: 修改 router.tsx — 把 `/admin` 移到公开路由，与 `/login` 同层**

目标结构：

```ts
// ... import（AdminConfigPage import 要从深层调到顶层 import，不变；只需要移动路由对象）

export const router = createBrowserRouter([
  { path: '/', element: <SplashPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/identity', element: <IdentityPage /> },
  { path: '/teacher/login', element: <TeacherLoginPage /> },
  { path: '/teacher/register', element: <TeacherRegisterPage /> },
  { path: '/reset', element: <ResetPage /> },
  // ↓ 修复：admin 作为公开路由，自包含 LoginPanel 守卫
  { path: '/admin', element: <AdminConfigPage /> },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        path: 'student',
        element: <StudentGuard element={<StudentLayout />} />,
        children: [ ... ],
      },
      {
        path: 'teacher',
        element: <TeacherGuard element={<TeacherConsoleLayout />} />,
        children: [ ... ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
```

**精确改动片段（Edit old/new 参考）：**

old（在 ProtectedLayout children 内部）：
```tsx
      {
        path: 'teacher',
        element: <TeacherGuard element={<TeacherConsoleLayout />} />,
        children: [ ... ],
      },
      { path: 'admin', element: <AdminConfigPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
```

new（ProtectedLayout 内移除 admin；顶层加一条公开路由）：
```tsx
  { path: '/reset', element: <ResetPage /> },
  { path: '/admin', element: <AdminConfigPage /> },
  {
    path: '/',
    element: <ProtectedLayout />,
    ...
    // children 里不再有 'admin'
```

- [ ] **Step 3: 快速浏览 build/render（任选其一）**

方式 A（有 dev 服务运行时）：打开浏览器访问 `http://localhost:5173/admin`，确认不再被 301 弹回 `/`，能看到管理员登录 panel（无 token 时）。
方式 B：执行 `cd web-spa && npx tsc --noEmit`，确保路由相关类型无报错（AdminConfigPage 没有在 import 里丢掉）。

- [ ] **Step 4: Commit**

```bash
git add web-spa/src/router.tsx
git commit -m "fix(router): move /admin outside ProtectedLayout

- ProtectedLayout isAuthenticated checks st_ token prefix only
- AdminConfigPage has its own LoginPanel guard (ad_ token in admin_token)
- Direct visit /admin now correctly shows admin login screen"
```

---

## Task 4: 改造 LoginPage — 模式切换 & 两种内容布局

**Files:**
- Modify: `web-spa/src/pages/login/LoginPage.tsx`

现有 LoginPage 结构（节选关键段）：
- 根 div: `relative mx-auto w-full ...` ✅ 定位上下文有了
- 顶部：两张大角色卡 `roleCards`（学生 / 教师，正式入口）
- 中部：分割线 `<div className="my-10 border-t ...">`
- 底部：`demoEntries` 数组（演示·教师端 / 演示·学生端 两张虚线卡）→ **整段删除**
- 最底部小字：仍需要保留

- [ ] **Step 1: 在 LoginPage.tsx 顶部加入 imports + useState**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DemoModeToggle } from '@/components/DemoModeToggle'
import { DEMO, type LoginMode } from '@/constants/demo'
import { getLoginMode } from '@/constants/demo'
// 已有：api, setSession, Icon, Link, roleCards import 保持不动
```

在组件函数开头：
```tsx
export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<LoginMode>(() => getLoginMode())
  // 原有 const [demoLoading, setDemoLoading]... 保留；但我们新增的演示快捷卡点击
  // 将会用 navigate + teacherEnter 新流程，不再走 demoEntries 里那个硬编码王小雅。
```

- [ ] **Step 2: 在最外层 div 闭合标签前（第一行 children 位置）插入 `<DemoModeToggle />`**

位置：在 `<img src="/design/leaves.png">` 之上（即 children 数组的第一项）：

```tsx
return (
  <div className="relative mx-auto w-full max-w-[1760px] overflow-x-clip px-6 py-10 lg:px-10">
    <DemoModeToggle variant="switch-content" onModeChange={setMode} />
    <img src="/design/leaves.png" alt="" aria-hidden className="..." />
    ...
```

- [ ] **Step 3: 条件化内容区**

现有 render（节选）：

```tsx
    <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
      {roleCards.map((card, i) => (
        <Link key={card.to} to={card.to} className={`card-link ... animate-rise`} style={{ animationDelay: `${0.12 + 0.1 * i}s` }}>
          <div className="flex ...">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl ...">
              <Icon name={card.icon} size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink md:text-2xl">{card.title}</h2>
              <p className="mt-2 text-[14px] text-ink-soft md:text-sm">{card.desc}</p>
            </div>
          </div>
          <img src={card.img} ... />
          <span className="tag ...">进入 <Icon name="arrow-right" size={14} /></span>
        </Link>
      ))}
    </div>

    {/* 分割线 + demoEntries 段 —— 删除 */}
    <div className="my-10 border-t border-dashed border-line" />
    <div className="text-center">
      <span className="tag ...">免登录预览演示</span>
    </div>
    <div className="mt-8 grid gap-5 md:grid-cols-2 md:gap-6">
      {demoEntries.map((entry) => (
        ...
      ))}
    </div>
```

替换为：

```tsx
    {mode === 'formal' ? (
      <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
        {roleCards.map((card, i) => (
          <Link key={card.to} to={card.to} className={`card-link overflow-hidden rounded-[28px] bg-white shadow-card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 ... animate-rise`} style={{ animationDelay: `${0.12 + 0.1 * i}s` }}>
            {/* 内部完全沿用 roleCards 原结构，不动 */}
            <div className="flex items-start gap-4 p-6 pb-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl ...">
                <Icon name={card.icon} size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-ink md:text-2xl">{card.title}</h2>
                <p className="mt-2 text-[14px] text-ink-soft md:text-sm">{card.desc}</p>
              </div>
            </div>
            <img src={card.img} ... />
            <span className="tag absolute bottom-6 left-6 right-6 ...">进入 <Icon name="arrow-right" size={14} /></span>
          </Link>
        ))}
      </div>
    ) : (
      <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
        {/* 左：学生演示 */}
        <button
          type="button"
          onClick={() => navigate('/identity', { state: { preloadClass: DEMO.CLASS } })}
          className="card-link overflow-hidden rounded-[28px] border border-dashed border-line bg-white/70 hover:border-brand/40 hover:bg-white hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 text-left animate-rise"
          style={{ animationDelay: '0.12s' }}
        >
          <div className="flex items-start gap-4 p-6 pb-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Icon name="users" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink md:text-2xl">学生演示</h2>
              <p className="mt-2 text-[14px] text-ink-soft md:text-sm">进入 LTZ2024 班级自由选择你的身份，小信语音、书信、成长档案全功能</p>
            </div>
          </div>
          <img src={roleCards[0].img} alt="" aria-hidden className="mt-2 aspect-[16/10] w-full object-cover opacity-90" />
          <span className="tag absolute bottom-6 left-6 right-6 inline-flex items-center justify-between gap-2 rounded-full bg-black/80 px-4 py-2.5 text-sm text-white">
            班级码 LTZ2024 · 自由选择学生身份 <Icon name="arrow-right" size={14} />
          </span>
        </button>

        {/* 右：教师演示 */}
        <button
          type="button"
          disabled={demoLoading === 'teacher'}
          onClick={async () => {
            try {
              setDemoLoading('teacher')
              const res = await api.teacherEnter(DEMO.CLASS, DEMO.TEACHER)
              setSession({ type: 'teacher', token: res.token, profile: res.profile })
              navigate('/teacher', { replace: true })
            } catch (e) {
              alert(e instanceof Error ? e.message : '演示教师进入失败')
            } finally {
              setDemoLoading(null)
            }
          }}
          className="card-link overflow-hidden rounded-[28px] border border-dashed border-line bg-white/70 hover:border-brand/40 hover:bg-white hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 text-left animate-rise disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          style={{ animationDelay: '0.22s' }}
        >
          <div className="flex items-start gap-4 p-6 pb-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Icon name="teacher" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink md:text-2xl">教师演示</h2>
              <p className="mt-2 text-[14px] text-ink-soft md:text-sm">以李老师身份进入 LTZ2024 班级，班级管理、备课、学情全功能</p>
            </div>
          </div>
          <img src={roleCards[1].img} alt="" aria-hidden className="mt-2 aspect-[16/10] w-full object-cover opacity-90" />
          <span className="tag absolute bottom-6 left-6 right-6 inline-flex items-center justify-between gap-2 rounded-full bg-black/80 px-4 py-2.5 text-sm text-white">
            李老师 · LTZ2024 一键进入 <Icon name="arrow-right" size={14} />
          </span>
        </button>
      </div>
    )}
```

- [ ] **Step 4: 删除底部"分割线 + 免登录预览演示 tag + demoEntries 网格"整块代码**

即删除：
- `<div className="my-10 border-t border-dashed border-line" />`
- `<div className="text-center"><span className="tag bg-white text-ink-soft border border-line">免登录预览演示</span></div>`
- `<div className="mt-8 grid gap-5 md:grid-cols-2 md:gap-6">{demoEntries.map(...)}</div>`
- 文件顶部 `const demoEntries: DemoEntry[] = [...]` 整个数组常量（它的唯一职责被演示模式条件块取代）。

保留：
- 最底部小字：`<p className="mt-10 text-center text-[13px] text-ink-faint">创建自定义班级或输入真实教师账号仍需要登录</p>` —— 保持在两种模式下都显示。

- [ ] **Step 5: 检查 TS 类型 & 构建检查**

Run: `cd web-spa && npx tsc --noEmit`
Expected: 0 error。如果报 `setDemoLoading` 不存在或 `demoLoading` 类型不匹配，按实际变量名调整：LoginPage 里如果原本就叫 `demoEntryLoading` 之类的，统一即可。

- [ ] **Step 6: Commit**

```bash
git add web-spa/src/pages/login/LoginPage.tsx
git commit -m "feat(login): demo/formal mode conditional rendering + top-right toggle

- formal mode: 保持两张大角色卡（学生 / 教师），删除旧底部 demo 段
- demo mode: 两张虚线快捷卡（学生跳 IdentityPage 带 preloadClass=LTZ2024，教师直接 teacherEnter 李老师 LTZ2024）
- 右上角 DemoModeToggle（switch-content variant）驱动 mode state 重渲染"
```

---

## Task 5: IdentityPage — 加右上角 toggle + 支持 preloadClass

**Files:**
- Modify: `web-spa/src/pages/identity/IdentityPage.tsx`

- [ ] **Step 1: 加入 imports**

在文件顶部的现有 import 里插入：
```tsx
import { useLocation } from 'react-router-dom'
import { DemoModeToggle } from '@/components/DemoModeToggle'
import { DEMO } from '@/constants/demo'
```

- [ ] **Step 2: 组件内拿 location + 处理 preloadClass 自动进入 pick 步**

现有组件体开头（从 memory 的代码）：
```tsx
export function IdentityPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [step, setStep] = useState<Step>('search') // 'search' | 'pick'
  const [selected, setSelected] = useState<string | null>(null)
  const [className, setClassName] = useState('')
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [entering, setEntering] = useState(false)
  const [error, setError] = useState('')
```

紧随其后加：
```tsx
  const location = useLocation()
  const preloadClass = (location.state as { preloadClass?: string } | null)?.preloadClass

  // 挂载时如果带了 preloadClass，直接拉班级数据并进入 pick 步
  useEffect(() => {
    if (!preloadClass) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const cls = await api.getClass(preloadClass)
        if (cancelled) return
        setCode(preloadClass)
        setClassName(cls.class_name)
        setStudents(cls.students)
        // 默认高亮王小雅（DEMO.STUDENT），找不到时不选，用户自由选
        const defaultStudent = cls.students.find((s) => s.name === DEMO.STUDENT) ?? null
        setSelected(defaultStudent?.student_id ?? null)
        setStep('pick')
        setError('')
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载演示班级失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // 只在首次挂载时处理一次，不随 location.state 变化重跑（用户可以在页面内手动改）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

注意：要保证 `useEffect` 已经 import（如果 IdentityPage 之前没用到 useEffect，则在首行 `import { useEffect } from 'react'`）。

- [ ] **Step 3: 加右上角 DemoModeToggle**

找根 div（它已经是 relative 吗？看现有 IdentityPage 最外层 class：现有是 `className="relative mx-auto w-full max-w-[1760px] overflow-x-clip px-6 py-10 lg:px-10"`——有 relative ✅）。

在最外层 div 的第一个 children 位置（目前是 `<img src="/design/leaves.png">`）之前插入：

```tsx
<DemoModeToggle variant="navigate-home" />
```

- [ ] **Step 4: 检查"enter"进入流程仍然正常**

现有 pick 步的确认按钮 `enter` 函数：调 `api.enter(code, student_id)`、`setSession({ type: 'student', token: res.token, profile: res.profile })`、`navigate('/student', { replace: true })` —— **不动**。演示/正式进入后续流程完全一致。

- [ ] **Step 5: tsc 检查**

Run: `cd web-spa && npx tsc --noEmit`
Expected: 0 error。如果 location.state 类型警告，加 `|| null` 即可（已经加了）。

- [ ] **Step 6: Commit**

```bash
git add web-spa/src/pages/identity/IdentityPage.tsx
git commit -m "feat(identity): add demo toggle + support preloadClass via location.state

- top-right DemoModeToggle (navigate-home variant)
- when navigate from LoginPage demo card, auto-load class LTZ2024 and jump to pick step
- 王小雅 default highlight but user can select any student in class"
```

---

## Task 6: TeacherLoginPage & TeacherRegisterPage 加右上角 toggle

**Files:**
- Modify: `web-spa/src/pages/teacher/login/TeacherLoginPage.tsx`
- Modify: `web-spa/src/pages/teacher/register/TeacherRegisterPage.tsx`

### 6a. TeacherLoginPage

- [ ] **Step 1: 加 import**

```tsx
import { DemoModeToggle } from '@/components/DemoModeToggle'
```

- [ ] **Step 2: 外层 div 加 toggle**

现有 TeacherLoginPage 根 div（前几行已有）：
```tsx
<div className="relative mx-auto w-full max-w-[1760px] overflow-x-clip px-6 py-10 lg:px-10">
  <img src="/design/leaves.png" ... />
  <img src="/design/cloud.png" ... />
```
在 `<img ... leaves>` 之前插入：
```tsx
<DemoModeToggle variant="navigate-home" />
```

### 6b. TeacherRegisterPage

- [ ] **Step 1: 加 import**

```tsx
import { DemoModeToggle } from '@/components/DemoModeToggle'
```

- [ ] **Step 2: 外层 div 加 toggle（与上面一模一样）**

- [ ] **Step 3: tsc 检查 + commit**

Run: `cd web-spa && npx tsc --noEmit`
Expected: 0 error。

```bash
git add web-spa/src/pages/teacher/login/TeacherLoginPage.tsx web-spa/src/pages/teacher/register/TeacherRegisterPage.tsx
git commit -m "feat(teacher): add DemoModeToggle to login & register pages"
```

---

## Task 7: AdminConfigPage — 演示快速进入按钮 + 右上角 toggle

**Files:**
- Modify: `web-spa/src/pages/admin/AdminConfigPage.tsx`

### 7a. 未登录容器 — 加右上角 DemoModeToggle

- [ ] **Step 1: 加 imports**

```tsx
import { DemoModeToggle } from '@/components/DemoModeToggle'
import { DEMO } from '@/constants/demo'
```

- [ ] **Step 2: 未登录容器包 relative 并插入 toggle**

未登录态当前结构（第 436-453 行附近）：
```tsx
  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
        <div className="mb-6">
          <Link to="/teacher" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-brand">
            <Icon name="arrow-left" size={13} />
            返回教师后台
          </Link>
        </div>
        ...
```

修改最外层 div 加 `relative`，并在 Link 之前插入 toggle：

```tsx
  if (!authed) {
    return (
      <div className="relative mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
        <DemoModeToggle variant="navigate-home" />
        <div className="mb-6">
          <Link ... >
```

注意：已登录容器（有「退出管理员」按钮的那个页面）**不需要**加模式切换按钮——按 spec §7 不在本次范围，保持现状。

### 7b. LoginPanel 密码框上方加「⚡ 演示快速进入管理员」按钮

- [ ] **Step 1: 修改 LoginPanel — 支持调用 api.adminLogin(DEMO.ADMIN_PASSWORD)**

LoginPanel 当前结构（第 82-112 行附近）：
```tsx
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card p-8 animate-rise">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="settings" size={28} />
          </span>
          <h1 className="text-2xl font-bold text-ink">管理员登录</h1>
          <p className="text-sm text-ink-soft">输入管理员密码以配置模型服务</p>
        </div>
        <div className="mt-6">
          <Field label="管理员密码">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="请输入密码"
              autoFocus
              className="input-soft"
            />
          </Field>
          {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
          <button onClick={submit} disabled={!password || loading} className="btn-brand mt-5 w-full !py-3">
            {loading ? '登录中…' : '登 录'}
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
```

改成（在 Field 密码输入框之前插入「⚡ 演示快速进入」按钮 + 分隔线）：

```tsx
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card p-8 animate-rise">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="settings" size={28} />
          </span>
          <h1 className="text-2xl font-bold text-ink">管理员登录</h1>
          <p className="text-sm text-ink-soft">输入管理员密码以配置模型服务</p>
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={async () => {
              try {
                setLoading(true)
                setError('')
                await api.adminLogin(DEMO.ADMIN_PASSWORD)
                onSuccess()
              } catch (e) {
                setError(e instanceof Error ? e.message : '演示快速进入失败')
                setLoading(false)
              }
            }}
            disabled={loading}
            className="btn-line w-full !py-2.5 text-sm inline-flex items-center justify-center gap-1.5"
          >
            <span aria-hidden>⚡</span>
            演示快速进入管理员
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] uppercase tracking-wider text-ink-faint">正式登录</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <Field label="管理员密码">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="请输入密码"
              className="input-soft"
            />
          </Field>
          {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
          <button onClick={submit} disabled={!password || loading} className="btn-brand mt-5 w-full !py-3">
            {loading ? '登录中…' : '登 录'}
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
```

注意两点：
1. 原 `autoFocus` 在密码框上移除了（因为演示按钮才是演示场景下的主操作，不希望自动 focus 到密码框；如果你更希望保留密码框 autoFocus，保留也行，行为都是 OK 的）。
2. 提交失败时要 `setLoading(false)`，否则演示按钮失败后 loading 不会重置。

- [ ] **Step 2: tsc 检查**

Run: `cd web-spa && npx tsc --noEmit`
Expected: 0 error。确认 `adminLogin` 在 `api` 对象上存在（AdminConfigPage 已经在 `submit()` 里调用它，所以存在 ✅）。

- [ ] **Step 3: Commit**

```bash
git add web-spa/src/pages/admin/AdminConfigPage.tsx
git commit -m "feat(admin): demo quick-enter button + top-right toggle on login screen

- LoginPanel add ⚡演示快速进入管理员 (uses DEMO.ADMIN_PASSWORD=admin123)
- unauthed container wrap relative + DemoModeToggle (navigate-home variant)
- always shown regardless of demo/formal mode switch"
```

---

## Task 8: 启动前后端 + 浏览器端到端验证 spec 第 6 节 8 项

**Files:**
- 全部已改文件的端到端验证

- [ ] **Step 1: 启动后端（如果没在跑）**

打开终端：
```bash
cd server
# 检查 8010 是否被监听
netstat -ano | findstr ":8010"
# 如果没起来：（根据项目脚本，可能是 python -m app 或 run_server.py 之类）
```
具体启动命令沿用项目既有脚本（从 acceptance.md 或 package.json / pyproject.toml 确认）。

- [ ] **Step 2: 启动前端 dev server（如果没在跑）**

打开终端：
```bash
cd web-spa
npm run dev
```
等待 Vite 输出 `Local: http://localhost:5173/` 提示。

- [ ] **Step 3: 浏览器自动化端到端验证 — 第 1 部分**

使用 Playwright 或浏览器工具，访问 `http://localhost:5173/login`，依次验证：
1. ✅ 右上角看到 tag 按钮，默认显示 `✨演示模式`（或 home icon 版）——切一下 → 文字变 `🏠正式模式`，再切回来 → 文字复原；F5 刷新 → 状态保留。
2. ✅ 正式模式（按钮显示 ✨演示模式 时的内容区）：只看到"我是学生/我是老师"两张大卡，没有任何底部"免登录预览演示"段落；学生卡 Link → `/identity`，教师卡 Link → `/teacher/login`。
3. ✅ 右上角点切换到演示模式 → 内容区变为两张虚线卡（左学生演示 / 右教师演示）。点击**学生演示**卡片 → 跳 `/identity`，URL 不变但 pick 步直接显示班级码 LTZ2024 被填好，王小雅默认高亮；点击另一学生卡 → 高亮切换正常；点击「确认进入」→ 进入学生端 `/student`，导航正常显示。
4. ✅ 返回 `/login`，演示模式下点**教师演示**卡片 → 加载后直接进 `/teacher`，左上角/面包屑显示李老师和 LTZ2024 班级。

- [ ] **Step 4: 浏览器自动化端到端验证 — 第 2 部分**

5. ✅ IdentityPage 右上角 toggle → 点「🏠正式模式」→ 跳 `/login` 且页面显示两张大角色卡（模式切换生效）。
6. ✅ 直接打开新标签 `http://localhost:5173/admin`，**没有**被 301 弹回 `/`，看到管理员登录面板；面板中有「⚡ 演示快速进入管理员」按钮，点击后加载片刻 → 显示系统配置页面（语音、LLM、文生图、Embedding、知识库、教师审批 6 个区块可见）。
7. ✅ 演示进入学生端后：语音页面（/student/voice）、书信页面（/student/letters）、成长档案（/student/growth）均可访问，无灰掉按钮，无「演示模式功能被锁定」样式。
8. ✅ 回归：退出登录后正式登录仍正常。学生端手动返回 `/identity`，清空班级码输入框重填 LTZ2024 → search → pick → enter 正常走；教师端 `/teacher/login` 手填李老师 + LTZ2024 + 密码 登录成功，不受演示按钮影响。

- [ ] **Step 5: 汇总验证结果，如失败对应修复 + 再验证**

如果所有 8 项通过，执行：

```bash
git status
# 应该只有干净的 commits，没有未提交改动
```

- [ ] **Step 6: 收尾 commit（如有验证阶段修修补补）**

```bash
git add -A
git commit -m "fix(demo): validation fixes for end-to-end flow"
```

（仅当验证阶段有修改才需要；如果验证通过且没有额外改动则跳过这一步。）

---

## 计划自查（已完成）

**Spec 覆盖率映射表：**

| Spec § | 实现任务 | 状态 |
|---|---|---|
| §0 定义 | 全部 Task 共同体现 | ✅ |
| §1 模式存储 + 常量 | Task 1 `constants/demo.ts` | ✅ |
| §2 `<DemoModeToggle />` 组件 | Task 2 | ✅ |
| §3.1 LoginPage 正式/演示内容区 | Task 4 | ✅ |
| §3.2 IdentityPage preloadClass | Task 5 | ✅ |
| §3.3 TeacherLoginPage toggle | Task 6a | ✅ |
| §3.4 TeacherRegisterPage toggle | Task 6b | ✅ |
| §3.5 Admin 未登录屏 toggle | Task 7a | ✅ |
| §4.1 管理员演示快速进入按钮 | Task 7b | ✅ |
| §4.2 /admin 路由修复 | Task 3 | ✅ |
| §5 受影响文件清单 | 全部 Tasks | ✅ |
| §6 验收 1-8 | Task 8 | ✅ |
| §7 不在范围 | Task 边界内均未越界 | ✅ |

**占位符扫描：** Plan 中无 TBD/TODO/占位（图标选择在 Task 2 Step 1 给出具体 fallback 策略，不含占位符）。
**类型一致性：** Task 1 定义的 `DEMO` / `LoginMode` / `getLoginMode` / `setLoginMode` / `toggleLoginMode` 在 Tasks 2–7 中使用名完全一致，无漂移。
