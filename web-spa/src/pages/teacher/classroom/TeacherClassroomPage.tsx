import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { KidAvatar } from '@/components/art/KidAvatar'
import { getSession } from '@/stores/session'

type BackendStatus = {
  session_id: string
  state: 'idle' | 'active' | 'paused'
  current_student: string | null
  current_slot: string | null
  turn_count: number
  updated_at: string
}

type ListedStudent = {
  id: string
  name: string
  grade: string
  avatar_seed: number
}

const stateLabel: Record<BackendStatus['state'], string> = {
  idle: '待开始',
  active: '上课中',
  paused: '已暂停',
}

export function TeacherClassroomPage() {
  const { profile } = getSession()
  const classCode = profile?.class_code ?? 'LTZ2024'

  const [status, setStatus] = useState<BackendStatus | null>(null)
  const [students, setStudents] = useState<ListedStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const [cls, st] = await Promise.all([
        api.getClass(classCode),
        api.getClassStatus(classCode),
      ])
      setStudents(
        cls.students.map((s) => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
          avatar_seed: s.avatar_seed,
        })),
      )
      setStatus(st)
    } catch (e) {
      setError(e instanceof Error ? e.message : '刷新状态失败')
    }
  }

  useEffect(() => {
    let mounted = true
    setError(null)

    async function load() {
      try {
        const [cls, st] = await Promise.all([
          api.getClass(classCode),
          api.getClassStatus(classCode),
        ])
        if (!mounted) return
        setStudents(
          cls.students.map((s) => ({
            id: s.id,
            name: s.name,
            grade: s.grade,
            avatar_seed: s.avatar_seed,
          })),
        )
        setStatus(st)
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : '刷新状态失败')
        }
      }
    }

    load()
    const timer = setInterval(load, 2000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [classCode])

  const currentStudentName = useMemo(() => {
    if (!status?.current_student) return '-'
    return students.find((s) => s.id === status.current_student)?.name ?? status.current_student
  }, [status, students])

  const makeCmdId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const sendAction = async (action: string, payload?: Record<string, unknown>) => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const next = await api.controlClass(classCode, action, makeCmdId(), payload)
      setStatus(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const startClass = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const next = await api.startClass(classCode)
      setStatus(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : '开始课堂失败')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="card p-8 text-center">
        <p className="text-ink-soft">请先登录</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-ink md:text-3xl">课堂面板</h1>
          <p className="mt-2 text-sm text-ink-soft">
            班级：{classCode} · 状态：{status ? stateLabel[status.state] : '加载中…'}
          </p>
        </div>
        <Link to="/teacher/courses" className="btn-line !px-4 !py-2 text-xs">
          <Icon name="arrow-left" size={14} />
          返回课程列表
        </Link>
      </div>

      {error && (
        <div className="card mt-4 border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button onClick={refresh} className="ml-3 underline">
            重试
          </button>
        </div>
      )}

      <div className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                status?.state === 'active'
                  ? 'bg-mint text-white shadow-btn'
                  : status?.state === 'paused'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-brand-faint text-brand'
              }`}
            >
              <Icon name={status?.state === 'active' ? 'play' : 'users'} size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">当前状态</p>
              <p className="text-xs text-ink-faint">
                {status ? stateLabel[status.state] : '加载中…'}
                {status && status.state !== 'idle' && ` · 第 ${status.turn_count} 轮`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {status?.state === 'idle' && (
              <button onClick={startClass} disabled={loading} className="btn-brand !px-4 !py-2 text-sm">
                <Icon name="play" size={15} />
                开始课堂
              </button>
            )}
            {status?.state === 'active' && (
              <>
                <button
                  onClick={() => sendAction('pause')}
                  disabled={loading}
                  className="btn-line !px-4 !py-2 text-sm"
                >
                  <Icon name="pause" size={15} />
                  暂停
                </button>
                <button
                  onClick={() => sendAction('next_student')}
                  disabled={loading}
                  className="btn-brand !px-4 !py-2 text-sm"
                >
                  <Icon name="arrow-right" size={15} />
                  下一位
                </button>
                <button
                  onClick={() => sendAction('switch_content', { slot: '主题讨论' })}
                  disabled={loading}
                  className="btn-brand !px-4 !py-2 text-sm"
                >
                  <Icon name="refresh" size={15} />
                  切换内容
                </button>
              </>
            )}
            {status?.state === 'paused' && (
              <button
                onClick={() => sendAction('resume')}
                disabled={loading}
                className="btn-brand !px-4 !py-2 text-sm"
              >
                <Icon name="play" size={15} />
                继续
              </button>
            )}
          </div>
        </div>

        {status && status.state !== 'idle' && (
          <div className="mt-4 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
            <p>
              当前学生：
              <span className="font-medium text-ink">{currentStudentName}</span>
            </p>
            <p>
              当前内容：
              <span className="font-medium text-ink">{status.current_slot ?? '未设置'}</span>
            </p>
          </div>
        )}
      </div>

      <div className="card mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-ink">
            <Icon name="users" size={15} className="mr-1.5 inline-block align-[-2px] text-brand" />
            学生面板
          </p>
          <span className="tag bg-brand-soft text-brand">共 {students.length} 人</span>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {students.map((s) => {
            const active = status?.current_student === s.id
            return (
              <div
                key={s.id}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  active
                    ? 'border-brand bg-brand-soft/50 ring-2 ring-brand/20'
                    : 'border-line bg-white'
                }`}
              >
                <span className="overflow-hidden rounded-xl" style={{ width: 56, height: 56 }}>
                  <KidAvatar avatarSeed={s.avatar_seed} size={56} />
                </span>
                <span className="text-sm font-bold text-ink">{s.name}</span>
                {active && <span className="tag bg-brand text-white !px-2 !py-0.5 !text-[10px]">发言中</span>}
              </div>
            )
          })}
        </div>
      </div>

      {status?.state === 'active' && (
        <div className="card mt-6 border-mint/40 bg-mint-soft/30 p-5">
          <p className="text-sm font-bold text-ink">投屏提示</p>
          <p className="mt-1 text-xs text-ink-soft">当前为宽屏课堂面板，可全屏展示给学生查看当前轮到的同学。</p>
        </div>
      )}
    </div>
  )
}
