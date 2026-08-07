import { Link, Outlet, useLocation } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { TeacherAvatar } from '@/components/art/TeacherAvatar'
import { getSession, isStudentProfile } from '@/stores/session'

const nav = [
  { href: '/teacher/lesson', icon: 'plus' as const, label: '新建课程', desc: '创设课堂语境' },
  { href: '/teacher/academic', icon: 'chart' as const, label: '学情档案', desc: '成绩与背景信息' },
  { href: '/teacher/growth', icon: 'heart' as const, label: '成长档案', desc: '宠物与心理信号' },
  { href: '/teacher/courses', icon: 'book' as const, label: '我的课程', desc: '往期记录与留痕' },
]

export function TeacherConsoleLayout() {
  const { pathname } = useLocation()
  const { profile } = getSession()

  if (!profile || isStudentProfile(profile)) {
    return null
  }

  const { name, school, class_name } = profile

  return (
    <div className="relative mx-auto flex w-full max-w-[1760px] flex-col gap-6 px-6 py-7 lg:flex-row lg:px-10">
      <img
        src="/design/leaves.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-2 hidden w-64 opacity-60 xl:block"
      />
      {/* 侧边栏 */}
      <aside className="shrink-0 lg:w-60">
        <div className="lg:sticky" style={{ top: 24 }}>
          <div className="card flex items-center gap-3 p-4">
            <TeacherAvatar size={44} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{name}</p>
              <p className="mt-0.5 truncate text-xs text-ink-faint">{school} · {class_name}</p>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="教师后台导航">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                    active
                      ? 'border-brand/30 bg-brand text-white shadow-btn'
                      : 'border-line bg-white text-ink hover:border-brand/30 hover:text-brand'
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                  <span className="leading-tight">
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className={`mt-0.5 hidden text-[11px] lg:block ${active ? 'text-white/75' : 'text-ink-faint'}`}>
                      {item.desc}
                    </span>
                  </span>
                </Link>
              )
            })}
          </nav>

          <Link
            to="/teacher"
            className="mt-4 hidden items-center gap-1.5 px-2 text-xs font-medium text-ink-faint transition-colors hover:text-brand lg:flex"
          >
            <Icon name="arrow-left" size={13} />
            返回班级选择
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
