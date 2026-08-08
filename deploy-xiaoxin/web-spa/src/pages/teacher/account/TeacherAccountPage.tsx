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

type AccountInfo = {
  teacher_id: string
  name: string
  school: string
  phone: string
  subject: string
  title: string
  has_password: boolean
}

export function TeacherAccountPage() {
  const navigate = useNavigate()
  const { profile } = getSession()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 个人信息登记
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [info, setInfo] = useState({ school: '', phone: '', subject: '', title: '' })
  const [infoLoading, setInfoLoading] = useState(true)
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  // 密码设置
  const [oldPassword, setOldPassword] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)

  // 新建账号
  const [newName, setNewName] = useState('')
  const [newSchool, setNewSchool] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [regSaving, setRegSaving] = useState(false)
  const [regMsg, setRegMsg] = useState<string | null>(null)

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

  useEffect(() => {
    let active = true
    api
      .getTeacherAccount()
      .then((res) => {
        if (!active) return
        setAccount(res)
        setInfo({ school: res.school, phone: res.phone, subject: res.subject, title: res.title })
      })
      .catch((e) => {
        if (active) setInfoMsg(e instanceof Error ? e.message : '加载账号信息失败')
      })
      .finally(() => {
        if (active) setInfoLoading(false)
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

  const saveInfo = async () => {
    setInfoMsg(null)
    setInfoSaving(true)
    try {
      const res = await api.updateTeacherAccount({
        school: info.school,
        phone: info.phone,
        subject: info.subject,
        title: info.title,
      })
      setAccount(res)
      setInfoMsg('个人信息已保存')
    } catch (e) {
      setInfoMsg(e instanceof Error ? e.message : '保存失败')
    } finally {
      setInfoSaving(false)
    }
  }

  const changePassword = async () => {
    setPwdMsg(null)
    if (pwdNew.length < 4) {
      setPwdMsg('新密码至少 4 位')
      return
    }
    if (pwdNew !== confirmPassword) {
      setPwdMsg('两次输入的新密码不一致')
      return
    }
    setPwdSaving(true)
    try {
      await api.updateTeacherPassword({
        old_password: oldPassword || null,
        new_password: pwdNew,
      })
      setPwdMsg('密码已更新')
      setOldPassword('')
      setPwdNew('')
      setConfirmPassword('')
    } catch (e) {
      setPwdMsg(e instanceof Error ? e.message : '修改失败')
    } finally {
      setPwdSaving(false)
    }
  }

  const createTeacher = async () => {
    setRegMsg(null)
    if (!newName.trim()) {
      setRegMsg('请填写新教师姓名')
      return
    }
    setRegSaving(true)
    try {
      await api.teacherRegister({
        name: newName.trim(),
        school: newSchool.trim(),
        password: newPassword || undefined,
      })
      setRegMsg(`已成功注册新老师「${newName.trim()}」`)
      setNewName('')
      setNewSchool('')
      setNewPassword('')
    } catch (e) {
      setRegMsg(e instanceof Error ? e.message : '注册失败')
    } finally {
      setRegSaving(false)
    }
  }

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder: string) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-soft" />
    </label>
  )

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
          <button onClick={logout} className="btn-line !px-4 !py-2 text-sm">
            <Icon name="logout" size={16} />
            退出登录
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* 个人信息登记 */}
        <section className="card mt-8 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <Icon name="users" size={20} />
            个人信息登记
          </h2>
          <p className="mt-1 text-sm text-ink-soft">完善你的个人资料，均为选填</p>
          {infoLoading ? (
            <p className="mt-4 text-sm text-ink-faint">加载中…</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field('学校', info.school, (v) => setInfo({ ...info, school: v }), '学校名称')}
              {field('联系电话', info.phone, (v) => setInfo({ ...info, phone: v }), '联系电话')}
              {field('任教学科', info.subject, (v) => setInfo({ ...info, subject: v }), '例如 道德与法治')}
              {field('职称', info.title, (v) => setInfo({ ...info, title: v }), '例如 一级教师')}
            </div>
          )}
          {infoMsg && (
            <p className={`mt-3 text-sm ${infoMsg.includes('已保存') ? 'text-green-600' : 'text-red-500'}`}>{infoMsg}</p>
          )}
          <button onClick={saveInfo} disabled={infoLoading || infoSaving} className="btn-brand mt-4">
            {infoSaving ? '保存中…' : '保存个人信息'}
            <Icon name="check" size={16} />
          </button>
        </section>

        {/* 密码设置 */}
        <section className="card mt-6 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <Icon name="settings" size={20} />
            密码设置
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {account?.has_password ? '修改登录密码' : '当前未设置密码，可设置后用于登录校验'}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {field('原密码', oldPassword, setOldPassword, account?.has_password ? '请输入原密码' : '未设置可留空')}
            {field('新密码', pwdNew, setPwdNew, '至少 4 位')}
            {field('确认新密码', confirmPassword, setConfirmPassword, '再次输入新密码')}
          </div>
          {pwdMsg && (
            <p className={`mt-3 text-sm ${pwdMsg.includes('已更新') ? 'text-green-600' : 'text-red-500'}`}>{pwdMsg}</p>
          )}
          <button onClick={changePassword} disabled={pwdSaving} className="btn-brand mt-4">
            {pwdSaving ? '处理中…' : account?.has_password ? '更新密码' : '设置密码'}
            <Icon name="check" size={16} />
          </button>
        </section>

        {/* 新建账号 */}
        <section className="card mt-6 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <Icon name="plus" size={20} />
            新建教师账号
          </h2>
          <p className="mt-1 text-sm text-ink-soft">登记一位新老师，注册后即可用其姓名+班级码登录</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {field('教师姓名', newName, setNewName, '必填')}
            {field('学校', newSchool, setNewSchool, '可选')}
            {field('初始密码', newPassword, setNewPassword, '可选，至少 4 位')}
          </div>
          {regMsg && (
            <p className={`mt-3 text-sm ${regMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{regMsg}</p>
          )}
          <button onClick={createTeacher} disabled={regSaving} className="btn-brand mt-4">
            {regSaving ? '创建中…' : '创建新账号'}
            <Icon name="plus" size={16} />
          </button>
        </section>

        {/* 任教班级列表 */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <Icon name="book" size={20} />
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