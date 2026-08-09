import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { DemoModeToggle } from '@/components/DemoModeToggle'
import { DEMO, getLoginMode, type LoginMode } from '@/constants/demo'
import { getSession, isStudentProfile, setSession } from '@/stores/session'

const roles = [
  {
    to: '/identity',
    title: '我是学生',
    img: '/design/card-students.jpg',
    alt: '教室里读书的孩子们',
    lines: ['画下你的话，写下我的信', '我一直在这里'],
  },
  {
    to: '/teacher/login',
    title: '我是老师',
    img: '/design/card-teacher.jpg',
    alt: '带孩子们远望群山的老师',
    lines: ['呵护每颗心灵，共担每份班务', '我一直在这里'],
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = getSession()
  const [mode, setMode] = useState<LoginMode>(() => getLoginMode())
  const [demoLoading, setDemoLoading] = useState<'teacher' | null>(null)

  if (profile) {
    const target = isStudentProfile(profile) ? '/student' : '/teacher'
    return <Navigate to={target} replace />
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden">
      <DemoModeToggle variant="switch-content" onModeChange={setMode} />

      {/* 虚化梯田背景（设计稿②原图） */}
      <img
        src="/design/login-terrace.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-white/76" aria-hidden />

      {/* 飘落绿叶（设计稿素材） */}
      <img src="/design/leaves.png" alt="" aria-hidden className="absolute -right-10 -top-6 w-72 opacity-90 md:w-96" />
      <img
        src="/design/leaves.png"
        alt=""
        aria-hidden
        className="absolute -left-16 top-1/3 w-64 -scale-x-100 opacity-55 md:w-80"
      />
      <img src="/design/cloud.png" alt="" aria-hidden className="absolute -left-10 bottom-0 w-80 opacity-50" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-14 md:py-16">
        <h1 className="font-cal text-center text-6xl tracking-[0.25em] text-brand-deep drop-shadow-[0_2px_0_rgba(255,255,255,0.9)] animate-rise md:text-7xl">
          登录
        </h1>

        {mode === 'formal' ? (
          <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-2 md:gap-12">
            {roles.map((r, i) => (
              <Link
                key={r.to}
                to={r.to}
                state={location.state}
                className="group rounded-xl bg-white p-7 text-center shadow-card transition-all hover:-translate-y-2 hover:shadow-lift md:p-9 animate-rise"
                style={{ animationDelay: `${0.12 + i * 0.1}s` }}
              >
                <h2 className="font-cal text-4xl tracking-[0.15em] text-brand md:text-[42px]">{r.title}</h2>
                <span className="relative mt-6 block overflow-hidden rounded-xl" style={{ aspectRatio: '3 / 2' }}>
                  <img
                    src={r.img}
                    alt={r.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </span>
                <p className="font-cal mt-7 text-xl leading-9 tracking-[0.12em] text-brand-deep md:text-[22px]">
                  {r.lines[0]}
                  <br />
                  {r.lines[1]}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-2 md:gap-12">
            {/* 左：学生演示 */}
            <button
              type="button"
              onClick={() =>
                navigate('/identity', {
                  state: { ...(location.state as object), presetClass: DEMO.CLASS, demoHighlight: true },
                })
              }
              className="group relative overflow-hidden rounded-xl border border-dashed border-line bg-white/80 text-center shadow-card transition-all hover:-translate-y-2 hover:border-brand/40 hover:bg-white hover:shadow-lift animate-rise"
              style={{ animationDelay: '0.12s' }}
            >
              <div className="p-7 md:p-9">
                <h2 className="font-cal text-4xl tracking-[0.15em] text-brand md:text-[42px]">学生演示</h2>
                <p className="mt-3 text-sm text-ink-soft md:text-base">
                  进入 LTZ2024 班级自由选择你的身份，小信语音、书信、成长档案全功能
                </p>
                <span className="relative mt-6 block overflow-hidden rounded-xl" style={{ aspectRatio: '3 / 2' }}>
                  <img
                    src={roles[0].img}
                    alt={roles[0].alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </span>
                <p className="font-cal mt-5 text-lg leading-8 tracking-[0.1em] text-brand-deep">
                  班级码 LTZ2024
                  <br />
                  自由选择学生身份
                </p>
              </div>
              <span className="tag absolute bottom-5 right-5 inline-flex items-center gap-1.5 bg-black/80 text-white text-xs">
                进入 <Icon name="arrow-right" size={14} />
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
                  setSession({ token: res.session_token, profile: res.profile as never })
                  navigate('/teacher', { replace: true })
                } catch (e) {
                  alert(e instanceof Error ? e.message : '演示教师进入失败')
                } finally {
                  setDemoLoading(null)
                }
              }}
              className="group relative overflow-hidden rounded-xl border border-dashed border-line bg-white/80 text-center shadow-card transition-all hover:-translate-y-2 hover:border-brand/40 hover:bg-white hover:shadow-lift animate-rise disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              style={{ animationDelay: '0.22s' }}
            >
              <div className="p-7 md:p-9">
                <h2 className="font-cal text-4xl tracking-[0.15em] text-brand md:text-[42px]">教师演示</h2>
                <p className="mt-3 text-sm text-ink-soft md:text-base">
                  以李老师身份进入 LTZ2024 班级，班级管理、备课、学情全功能
                </p>
                <span className="relative mt-6 block overflow-hidden rounded-xl" style={{ aspectRatio: '3 / 2' }}>
                  <img
                    src={roles[1].img}
                    alt={roles[1].alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </span>
                <p className="font-cal mt-5 text-lg leading-8 tracking-[0.1em] text-brand-deep">
                  李老师 · LTZ2024
                  <br />
                  一键进入
                </p>
              </div>
              <span className="tag absolute bottom-5 right-5 inline-flex items-center gap-1.5 bg-black/80 text-white text-xs">
                {demoLoading === 'teacher' ? '进入中…' : <>进入 <Icon name="arrow-right" size={14} /></>}
              </span>
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-xs tracking-wide text-ink-faint">
          创建自定义班级或输入真实教师账号仍需要登录
        </p>
      </div>
    </div>
  )
}
