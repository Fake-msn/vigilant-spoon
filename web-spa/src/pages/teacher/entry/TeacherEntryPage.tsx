import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { TeacherAvatar } from '@/components/art/TeacherAvatar'
import { getSession, setSession } from '@/stores/session'

type TeacherClass = {
  class_code: string
  class_name: string
  school: string
  region_key?: string
  city?: string
  county?: string
  town?: string
  grade: string
  class_no: string
}

const options = [
  {
    to: '/teacher/setup',
    title: '我要建设新班级',
    desc: '录入地区与学校信息，导入学生名单、照片和学情数据，从零建立班级档案。',
    action: '开始建班',
  },
]

export function TeacherEntryPage() {
  const navigate = useNavigate()
  const { profile } = getSession()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .getTeacherClasses()
      .then((res) => {
        if (active) setClasses(res.classes)
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : '加载班级列表失败')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const switchClass = async (code: string, thenEnter = false) => {
    if (profile && code === profile.class_code) {
      // 已是当前班级：若指定 thenEnter 直接跳课程页
      if (thenEnter) navigate('/teacher/courses')
      return
    }
    setSwitching(code)
    setError(null)
    try {
      const res = await api.teacherSwitch(code)
      setSession({ token: res.session_token, profile: res.profile as never })
      // 不做同路由 navigate（否则组件不卸载，switching 状态永远残留导致按钮全局卡死）。
      // 直接 setSwitching(null) 触发重渲染，组件重新执行 getSession() 即可读到新 profile。
      setSwitching(null)
      if (thenEnter) navigate('/teacher/courses')
    } catch (e) {
      setError(e instanceof Error ? e.message : '切换失败')
      setSwitching(null)
    }
  }

  const currentCode = profile?.class_code ?? ''
  const currentName = profile?.name ?? '老师'

  return (
    <div className="relative mx-auto max-w-4xl px-5 py-10">
      <img
        src="/design/leaves.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-4 hidden w-80 opacity-70 lg:block"
      />
      <div className="text-center">
        <span className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 shadow-card">
          <TeacherAvatar size={28} />
          <span className="text-sm font-semibold text-ink">{currentName}，欢迎回来</span>
        </span>
        <h1 className="font-cal mt-7 text-5xl tracking-[0.12em] text-brand-deep md:text-6xl">
          今天从哪里开始？
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft">
          建设一个新班级，或回到熟悉的班级继续陪孩子们聊梦想
        </p>
      </div>

      <div className="mt-14 flex flex-col items-center gap-7">
        {options.map((o, i) => (
          <Link
            key={o.to}
            to={o.to}
            className="group block w-full max-w-xl rounded-xl bg-brand-soft px-10 py-7 text-center shadow-card transition-all hover:-translate-y-1.5 hover:shadow-lift animate-rise"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <span className="font-cal text-4xl tracking-[0.18em] text-brand-deep md:text-[40px]">{o.title}</span>
            <span className="mt-2.5 block text-[13px] leading-6 text-ink-soft">{o.desc}</span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
              {o.action}
              <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      {/* 我任教的班级 —— 让「返回班级选择」入口真正支持多班级切换 */}
      <section className="mx-auto mt-16 w-full max-w-xl">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-black tracking-wide text-ink md:text-xl">我任教的班级</h2>
            <p className="mt-1 text-xs text-ink-soft">点击切换当前班级，侧栏头像与班级数据将同步更新</p>
          </div>
          <span className="text-xs text-ink-faint">共 {classes.length} 个班级</span>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="card mt-4 p-8 text-center text-sm text-ink-faint">
            <Icon name="loader" size={18} className="mr-2 inline animate-spin" />
            加载班级列表…
          </div>
        ) : classes.length === 0 ? (
          <div className="card mt-4 flex flex-col items-center gap-2 p-10 text-center">
            <Icon name="book" size={26} className="text-ink-faint" />
            <p className="font-bold text-ink">还没有任教班级</p>
            <p className="text-sm text-ink-soft">点击上方「我要建设新班级」创建第一个班级吧</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {classes.map((c) => {
              const active = c.class_code === currentCode
              return (
                <div
                  key={c.class_code}
                  className={`card flex items-center gap-4 p-5 transition-all ${
                    active ? '!border-brand !bg-brand-soft' : ''
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                      active ? 'bg-brand text-white' : 'bg-brand-soft text-brand'
                    }`}
                  >
                    <Icon name="book" size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-bold text-ink">
                      {c.class_name}
                      {active && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                          当前
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-faint">
                      {c.school} · {c.grade}（{c.class_no}班）· 班级码 {c.class_code}
                    </p>
                  </div>
                  {active ? (
                    <Link
                      to="/teacher/courses"
                      className="btn-brand inline-flex items-center gap-1.5 !px-4 !py-2 text-sm"
                    >
                      进入班级
                      <Icon name="arrow-right" size={15} />
                    </Link>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => switchClass(c.class_code)}
                        disabled={switching === c.class_code}
                        className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {switching === c.class_code ? '切换中…' : '切换'}
                      </button>
                      <button
                        type="button"
                        onClick={() => switchClass(c.class_code, true)}
                        disabled={switching !== null}
                        className="btn-brand inline-flex items-center gap-1.5 !px-4 !py-2 text-sm"
                      >
                        {switching === c.class_code ? '切换中…' : '进入班级'}
                        <Icon name="arrow-right" size={15} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <p className="mt-10 text-center text-xs leading-6 text-ink-faint">
        演示环境：班级数据为示例数据，操作不会影响真实学生信息
      </p>
    </div>
  )
}
