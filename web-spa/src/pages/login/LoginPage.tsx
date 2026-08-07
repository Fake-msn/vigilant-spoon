import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { getSession, isStudentProfile, setSession } from '@/stores/session'

const DEMO_CLASS = 'LTZ2024'
const DEMO_TEACHER = '李老师'
const DEMO_STUDENT = '王小雅'

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

const demoEntries = [
  {
    role: 'teacher' as const,
    icon: 'teacher' as const,
    label: '演示 · 教师端',
    desc: '进入默认示例班级（李老师 / LTZ2024）',
  },
  {
    role: 'student' as const,
    icon: 'users' as const,
    label: '演示 · 学生端',
    desc: '以示例学生（王小雅）进入课堂',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = getSession()

  if (profile) {
    const target = isStudentProfile(profile) ? '/student' : '/teacher'
    return <Navigate to={target} replace />
  }

  const enterDemo = async (role: 'teacher' | 'student') => {
    try {
      if (role === 'teacher') {
        const res = await api.teacherEnter(DEMO_CLASS, DEMO_TEACHER)
        setSession({ token: res.session_token, profile: res.profile as never })
        navigate('/teacher', { replace: true })
      } else {
        const res = await api.enter(DEMO_CLASS, DEMO_STUDENT)
        setSession({ token: res.session_token, profile: res.profile as never })
        navigate('/student', { replace: true })
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '进入演示失败')
    }
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden">
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

        {/* 一键演示入口：免登录预览默认示例内容 */}
        <div className="mx-auto mt-12 max-w-2xl animate-rise" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <Icon name="sparkles" size={15} />
              免登录预览演示
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {demoEntries.map((d) => (
              <button
                key={d.role}
                onClick={() => enterDemo(d.role)}
                className="group flex items-center gap-3 rounded-xl border border-dashed border-line bg-white/70 px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-white hover:shadow-card"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon name={d.icon} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{d.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-faint">{d.desc}</span>
                </span>
                <Icon name="arrow-right" size={16} className="text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" />
              </button>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-xs tracking-wide text-ink-faint">
          创建自定义班级或输入真实教师账号仍需要登录
        </p>
      </div>
    </div>
  )
}
