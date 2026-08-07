import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { TeacherAvatar } from '@/components/art/TeacherAvatar'
import { clearSession, getSession, isStudentProfile, setSession } from '@/stores/session'

type TeacherClass = {
  class_code: string
  class_name: string
  school: string
  grade: string
  class_no: string
}

export function TeacherAccountPage() {
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

  if (!profile || isStudentProfile(profile)) {
    return <Navigate to="/" replace />
  }

  const switchClass = async (code: string) => {
    if (code === profile.class_code) return
    setSwitching(code)
    setError(null)
    try {
      const res = await api.teacherSwitch(code)
      setSession({ token: res.session_token, profile: res.profile as never })
      navigate('/teacher', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : '切换失败')
      setSwitching(null)
    }
  }

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  const currentCode = profile.class_code

  return (
    <div className="relative mx-auto w-full max-w-[1760px] overflow-x-clip px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <span className="tag bg-brand-soft text-brand">账号配置</span>
        <h1 className="font-cal mt-5 text-5xl tracking-[0.12em] text-brand-deep md:text-6xl">
          我的账号
        </h1>

        {/* 教师信息卡 */}
        <div className="card mt-8 flex items-center gap-4 p-6">
          <TeacherAvatar size={56} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-ink">{profile.name}</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              当前班级：{profile.class_name}（{profile.school}）
            </p>
          </div>
          <button
            onClick={logout}
            className="btn-line !px-4 !py-2 text-sm"
          >
            <Icon name="logout" size={16} />
            退出登录
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* 任教班级列表 */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <Icon name="users" size={20} />
            我任教的班级
          </h2>
          <p className="mt-1 text-sm text-ink-soft">点击切换当前班级，进入对应班级的工作台</p>

          {loading ? (
            <div className="card mt-4 p-8 text-center text-sm text-ink-faint">加载中…</div>
          ) : classes.length === 0 ? (
            <div className="card mt-4 flex flex-col items-center gap-2 p-10 text-center">
              <Icon name="book" size={26} className="text-ink-faint" />
              <p className="font-bold text-ink">还没有任教班级</p>
              <p className="text-sm text-ink-soft">去「我要建设新班级」创建一个吧</p>
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
                      <span className="text-sm font-semibold text-brand">使用中</span>
                    ) : (
                      <button
                        onClick={() => switchClass(c.class_code)}
                        disabled={switching !== null}
                        className="btn-brand !px-4 !py-2 text-sm"
                      >
                        {switching === c.class_code ? '切换中…' : '切换'}
                        <Icon name="arrow-right" size={15} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}