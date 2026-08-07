import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { getSession } from '@/stores/session'

type CourseRecord = {
  lesson_id: string
  topic: string
  date: string
  duration: string | null
  joined: number
  status: 'active' | 'done'
  goal: string
  traces: string[]
}

export function TeacherCoursesPage() {
  const profile = getSession().profile
  const classCode = profile?.class_code ?? ''
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!classCode) return
    setLoading(true)
    api
      .getClassLessons(classCode)
      .then((data) => {
        setCourses(data)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [classCode])

  const doneCount = courses.filter((c) => c.status === 'done').length
  const totalJoined = courses.reduce((s, c) => s + c.joined, 0)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-soft">
        <Icon name="loader" size={20} className="mr-2 animate-spin" />
        加载课程列表…
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-ink md:text-3xl">我的课程</h1>
          <p className="mt-2 text-sm text-ink-soft">往次思政课记录都在这里，可随时复查、留痕</p>
        </div>
        <Link to="/teacher/lesson" className="btn-brand !px-5 !py-2.5 text-sm">
          <Icon name="plus" size={16} />
          新建课程
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: '累计课程', value: `${courses.length} 节`, icon: 'book' as const, color: 'bg-brand-soft text-brand' },
          { label: '已完成', value: `${doneCount} 节`, icon: 'check' as const, color: 'bg-mint-soft text-mint' },
          { label: '累计参与', value: `${totalJoined} 人次`, icon: 'users' as const, color: 'bg-grape-soft text-grape' },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3.5 p-5">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
              <Icon name={s.icon} size={22} />
            </span>
            <span>
              <span className="block text-xl font-black text-ink">{s.value}</span>
              <span className="mt-0.5 block text-xs font-medium text-ink-faint">{s.label}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {courses.map((c, i) => (
          <article key={c.lesson_id} className="card card-hover overflow-hidden animate-rise" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                  c.status === 'active' ? 'bg-brand text-white shadow-btn' : 'bg-brand-faint text-brand'
                }`}
              >
                <Icon name={c.status === 'active' ? 'play' : 'book'} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-black text-ink">{c.topic}</span>
                  <span
                    className={`tag !text-[11px] ${
                      c.status === 'active' ? 'bg-brand-soft text-brand' : 'bg-mint-soft text-mint'
                    }`}
                  >
                    {c.status === 'active' ? '进行中' : '已完成'}
                  </span>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="calendar" size={12} />
                    {c.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" size={12} />
                    {c.duration || '40 分钟'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="users" size={12} />
                    {c.joined} 人参与
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/teacher/classroom?course=${c.lesson_id}`}
                  className="btn-brand !px-4 !py-2 text-xs"
                >
                  <Icon name="play" size={14} />
                  {c.status === 'active' ? '进入课堂' : '回放'}
                </Link>
                <button className="btn-line !px-4 !py-2 text-xs">
                  <Icon name="eye" size={14} />
                  复查
                </button>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_1.2fr]">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-ink-faint">
                  <Icon name="target" size={13} className="text-brand" />
                  教学目标
                </p>
                <p className="mt-2 text-[13.5px] leading-6.5 text-ink" style={{ lineHeight: 1.7 }}>
                  {c.goal}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-ink-faint">
                  <Icon name="edit" size={13} className="text-brand" />
                  课堂留痕
                </p>
                <ul className="mt-2 space-y-1.5">
                  {c.traces.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-[13.5px] leading-6 text-ink-soft">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/60" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
