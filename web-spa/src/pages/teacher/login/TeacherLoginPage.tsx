import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { DemoModeToggle } from '@/components/DemoModeToggle'
import { getSession, isStudentProfile, setSession } from '@/stores/session'

export function TeacherLoginPage() {
  const navigate = useNavigate()
  const { profile } = getSession()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (profile) {
    const target = isStudentProfile(profile) ? '/student' : '/teacher'
    return <Navigate to={target} replace />
  }

  const submit = async () => {
    if (!name.trim()) return
    setError(null)
    setLoading(true)
    try {
      const normalizedCode = code.trim() ? code.trim().toUpperCase() : ''
      const res = normalizedCode
        ? await api.teacherEnter(normalizedCode, name.trim(), password || undefined)
        : await api.teacherLogin(name.trim(), password || undefined)
      setSession({ token: res.session_token, profile: res.profile as never })
      navigate('/teacher', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败')
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[1760px] overflow-x-clip px-6 py-10 lg:px-10">
      <DemoModeToggle variant="navigate-home" />
      <img src="/design/leaves.png" alt="" aria-hidden className="pointer-events-none absolute -right-10 -top-6 hidden w-72 opacity-70 lg:block" />
      <img src="/design/cloud.png" alt="" aria-hidden className="pointer-events-none absolute -left-24 bottom-0 hidden w-72 opacity-40 lg:block" />

      <div className="mx-auto max-w-md text-center">
        <span className="tag bg-brand-soft text-brand">教师端</span>
        <h1 className="font-cal mt-5 text-5xl tracking-[0.12em] text-brand-deep md:text-6xl">
          教师登录
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft">输入你的姓名即可登录，班级码可选（不填将默认进入你任教的班级）</p>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <Icon name="teacher" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的姓名，例如 李老师"
              aria-label="教师姓名"
              className="input-soft !pl-11"
            />
          </div>
          <div className="relative">
            <Icon name="book" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="班级码（选填，例如 LTZ2024）"
              aria-label="班级码（选填）"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="input-soft !pl-11 uppercase tracking-widest"
            />
          </div>
          <div className="relative">
            <Icon name="settings" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="登录密码（未设置可留空）"
              aria-label="登录密码"
              className="input-soft !pl-11"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={!name.trim() || loading}
            className="btn-brand w-full"
          >
            {loading ? '登录中…' : '进入班级'}
            <Icon name="arrow-right" size={16} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-5 text-sm">
          <Link to="/teacher/register" className="inline-flex items-center gap-1.5 text-brand hover:underline">
            <Icon name="plus" size={16} />
            还没有账号？去注册
          </Link>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-ink-soft hover:text-brand">
            <Icon name="arrow-left" size={16} />
            返回角色选择
          </Link>
        </div>
      </div>
    </div>
  )
}