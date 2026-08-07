import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
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
    to: '/teacher',
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

  if (profile) {
    const target = isStudentProfile(profile) ? '/student' : '/teacher'
    return <Navigate to={target} replace />
  }

  const enterAsTeacher = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const res = await api.teacherEnter('LTZ2024', '李老师')
      setSession({ token: res.session_token, profile: res.profile as never })
      const from = (location.state as { from?: string } | null)?.from
      navigate(from || '/teacher', { replace: true })
    } catch (err) {
      alert(err instanceof Error ? err.message : '教师登录失败')
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
          {roles.map((r, i) =>
            r.to === '/teacher' ? (
              <a
                key={r.to}
                href={r.to}
                onClick={enterAsTeacher}
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
              </a>
            ) : (
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
            )
          )}
        </div>

        <p className="mt-10 text-center text-xs tracking-wide text-ink-faint">
          演示环境 · 点选身份即可进入，无需注册账号
        </p>
      </div>
    </div>
  )
}
