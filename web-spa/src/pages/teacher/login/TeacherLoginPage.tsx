import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { getSession, isStudentProfile, setSession } from '@/stores/session'

export function TeacherLoginPage() {
  const navigate = useNavigate()
  const { profile } = getSession()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (profile) {
    const target = isStudentProfile(profile) ? '/student' : '/teacher'
    return <Navigate to={target} replace />
  }

  const submit = async () => {
    if (!name.trim() || !code.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await api.teacherEnter(code.trim(), name.trim())
      setSession({ token: res.session_token, profile: res.profile as never })
      navigate('/teacher', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败')
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[1760px] overflow-x-clip px-6 py-10 lg:px-10">
      <img src="/design/leaves.png" alt="" aria-hidden className="pointer-events-none absolute -right-10 -top-6 hidden w-72 opacity-70 lg:block" />
      <img src="/design/cloud.png" alt="" aria-hidden className="pointer-events-none absolute -left-24 bottom-0 hidden w-72 opacity-40 lg:block" />

      <div className="mx-auto max-w-md text-center">
        <span className="tag bg-brand-soft text-brand">教师端</span>
        <h1 className="font-cal mt-5 text-5xl tracking-[0.12em] text-brand-deep md:text-6xl">
          教师登录
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft">输入你的姓名和班级码，进入班级开始今天的思政课</p>

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
              onChange={(e) => setCode(e.target.value)}
              placeholder="班级码，例如 LTZ2024"
              aria-label="班级码"
              className="input-soft !pl-11 uppercase tracking-widest"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={submit}
            disabled={!name.trim() || !code.trim() || loading}
            className="btn-brand w-full"
          >
            {loading ? '登录中…' : '进入班级'}
            <Icon name="arrow-right" size={16} />
          </button>
        </div>

        <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
          <Icon name="arrow-left" size={16} />
          返回角色选择
        </Link>
      </div>
    </div>
  )
}