import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { DemoModeToggle } from '@/components/DemoModeToggle'

export function TeacherRegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      setError('请填写教师姓名')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await api.teacherRegister({
        name: name.trim(),
        school: school.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        title: title.trim(),
        password: password || undefined,
      })
      // 注册成功即进入待审核状态，需管理员通过后方可登录
      setError('注册申请已提交，等待管理员审核通过后即可登录')
      setLoading(false)
      // 预填返回信息，稍后引导到登录页
      setTimeout(() => navigate('/teacher/login', { replace: true }), 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败')
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[1760px] overflow-x-clip px-6 py-10 lg:px-10">
      <DemoModeToggle variant="navigate-home" />
      <img src="/design/leaves.png" alt="" aria-hidden className="pointer-events-none absolute -right-10 -top-6 hidden w-72 opacity-70 lg:block" />
      <img src="/design/cloud.png" alt="" aria-hidden className="pointer-events-none absolute -left-24 bottom-0 hidden w-72 opacity-40 lg:block" />

      <div className="mx-auto max-w-md">
        <span className="tag bg-brand-soft text-brand">教师端</span>
        <h1 className="font-cal mt-5 text-5xl tracking-[0.12em] text-brand-deep md:text-6xl">
          教师注册
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft">创建你的教师账号，仅需填写姓名，其余信息可选</p>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <Icon name="teacher" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="教师姓名（必填）"
              aria-label="教师姓名"
              className="input-soft !pl-11"
            />
          </div>
          <div className="relative">
            <Icon name="book" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="学校（可选）"
              aria-label="学校"
              className="input-soft !pl-11"
            />
          </div>
          <div className="relative">
            <Icon name="settings" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="任教学科（可选）"
              aria-label="任教学科"
              className="input-soft !pl-11"
            />
          </div>
          <div className="relative">
            <Icon name="users" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="职称（可选）"
              aria-label="职称"
              className="input-soft !pl-11"
            />
          </div>
          <div className="relative">
            <Icon name="chat" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="联系电话（可选）"
              aria-label="联系电话"
              className="input-soft !pl-11"
            />
          </div>
          <div className="relative">
            <Icon name="settings" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="设置登录密码（可选，至少 4 位）"
              aria-label="设置密码"
              className="input-soft !pl-11"
            />
          </div>
          {error && (
            <p className={`text-sm ${error.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{error}</p>
          )}
          <button
            onClick={submit}
            disabled={loading}
            className="btn-brand w-full"
          >
            {loading ? '注册中…' : '创建账号'}
            <Icon name="check" size={16} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-5 text-sm">
          <Link to="/teacher/login" className="inline-flex items-center gap-1.5 text-brand hover:underline">
            <Icon name="arrow-right" size={16} />
            已有账号？去登录
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