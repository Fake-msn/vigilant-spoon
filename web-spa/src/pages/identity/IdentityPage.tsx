import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { DemoModeToggle } from '@/components/DemoModeToggle'
import { DEMO } from '@/constants/demo'
import { KidAvatar } from '@/components/art/KidAvatar'
import { getSession, isStudentProfile, setSession } from '@/stores/session'

type Step = 'code' | 'pick'

type ListedStudent = {
  id: string
  name: string
  grade: string
  avatar_seed: number
}

export function IdentityPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [keyword, setKeyword] = useState('')
  const [students, setStudents] = useState<ListedStudent[]>([])
  const [className, setClassName] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const locationState = (location.state as { presetClass?: string; preloadClass?: string; demoHighlight?: boolean; from?: string } | null) ?? null
  // 兼容旧字段 preloadClass（LoginPage 演示入口）与新统一字段 presetClass（换同学入口等），都进入同一自动加载流程
  const presetClass = (locationState?.presetClass ?? locationState?.preloadClass)?.trim() || undefined
  // 关键：是否默认高亮一位学生，仅看入口是否显式声明了 demoHighlight=true
  // 不能按"班级码等于 LTZ2024"判断——因为正式模式用户手工输入 LTZ2024 后再切换同班同学，也不应该替 TA 选中任何人
  const shouldHighlightDemo = locationState?.demoHighlight === true && presetClass === DEMO.CLASS

  // 挂载时如果带了 presetClass（已登录学生切换同班同学 / 演示入口），直接拉班级数据并进入 pick 步（仅首次）
  // 注意：演示模式才默认高亮王小雅；正式模式切换同班同学时不默认选，让用户自由挑选
  useEffect(() => {
    if (!presetClass) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const cls = await api.getClass(presetClass)
        if (cancelled) return
        setCode(presetClass)
        setClassName(cls.class_name)
        setStudents(cls.students)
        const defaultStudent = shouldHighlightDemo
          ? cls.students.find((s) => s.name === DEMO.STUDENT) ?? null
          : null
        setSelected(defaultStudent?.id ?? null)
        setStep('pick')
        setError(null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载班级失败，请重新输入班级码')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () => students.filter((s) => !keyword.trim() || s.name.includes(keyword.trim())),
    [keyword, students],
  )

  const { profile } = getSession()
  if (profile) {
    const target = isStudentProfile(profile) ? '/student' : '/teacher'
    return <Navigate to={target} replace />
  }

  const submitCode = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const cls = await api.getClass(code.trim())
      setClassName(cls.class_name)
      setStudents(cls.students)
      setStep('pick')
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询班级失败')
    } finally {
      setLoading(false)
    }
  }, [code])

  const enter = async () => {
    if (!selected) return
    const student = students.find((s) => s.id === selected)
    if (!student) return
    setError(null)
    setLoading(true)
    try {
      const res = await api.enter(code.trim(), student.name)
      setSession({ token: res.session_token, profile: res.profile as never })
      const from = (location.state as { from?: string } | null)?.from
      navigate(from || '/student', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : '进入失败')
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[1760px] overflow-x-clip px-6 py-10 lg:px-10">
      <DemoModeToggle variant="navigate-home" />
      <img src="/design/leaves.png" alt="" aria-hidden className="pointer-events-none absolute -right-10 -top-6 hidden w-72 opacity-70 lg:block" />
      <img src="/design/cloud.png" alt="" aria-hidden className="pointer-events-none absolute -left-24 bottom-0 hidden w-72 opacity-40 lg:block" />

      {step === 'code' ? (
        <div className="mx-auto max-w-md text-center">
          <span className="tag bg-brand-soft text-brand">欢迎加入小信</span>
          <h1 className="font-cal mt-5 text-5xl tracking-[0.12em] text-brand-deep md:text-6xl">
            输入班级码
          </h1>
          <p className="mt-4 text-[15px] text-ink-soft">输入老师给的班级码，找到你的班级</p>

          <div className="mt-8 space-y-4">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="例如 LTZ2024"
              aria-label="班级码"
              className="input-soft text-center uppercase tracking-widest"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={submitCode}
              disabled={!code.trim() || loading}
              className="btn-brand w-full"
            >
              {loading ? '查询中…' : '下一步'}
              <Icon name="arrow-right" size={16} />
            </button>
          </div>

          <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
            <Icon name="arrow-left" size={16} />
            返回角色选择
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center">
            <span className="tag bg-brand-soft text-brand">{className}</span>
            <h1 className="font-cal mt-5 text-5xl tracking-[0.12em] text-brand-deep md:text-6xl">
              你是谁呀？
            </h1>
            <p className="mt-4 text-[15px] text-ink-soft">
              找到你的名字和照片，点一下就能开始今天的谈心
            </p>
          </div>

          {/* 搜索 */}
          <div className="relative mx-auto mt-8 max-w-md">
            <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索你的名字…"
              aria-label="搜索你的名字"
              className="input-soft !rounded-full !pl-11"
            />
          </div>

          {filtered.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
              {filtered.map((s) => {
                const active = selected === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    aria-pressed={active}
                    className={`card group flex flex-col items-center gap-3 !bg-brand-soft/55 p-5 transition-all ${
                      active
                        ? '!border-brand !bg-brand-soft ring-4 ring-brand/15 shadow-lift -translate-y-1'
                        : 'card-hover'
                    }`}
                  >
                    <span className="relative overflow-hidden rounded-lg border-4 border-white shadow-card" style={{ width: 96, height: 96 }}>
                      <KidAvatar avatarSeed={s.avatar_seed} size={88} />
                      {active && (
                        <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white animate-pop">
                          <Icon name="check" size={14} />
                        </span>
                      )}
                    </span>
                    <span className="text-center">
                      <span className={`block text-lg font-bold ${active ? 'text-brand' : 'text-ink'}`}>
                        {s.name}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink-faint">
                        <Icon name="book" size={12} />
                        {s.grade}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="card mx-auto mt-10 flex max-w-sm flex-col items-center gap-2 p-10 text-center">
              <Icon name="search" size={26} className="text-ink-faint" />
              <p className="font-bold text-ink">没有找到这个名字</p>
              <p className="text-sm text-ink-soft">检查一下是不是写错了，或者问问老师哦</p>
            </div>
          )}

          {error && <p className="mx-auto mt-6 max-w-sm text-center text-sm text-red-500">{error}</p>}

          {/* 底部翻页 */}
          <div className="mt-12 flex items-center justify-between">
            <button onClick={() => setStep('code')} className="btn-line !px-6 !py-2.5 text-sm">
              <Icon name="arrow-left" size={16} />
              上一页
            </button>
            <span className="text-sm text-ink-faint">
              {selected ? `已选择：${students.find((s) => s.id === selected)?.name}` : '点一张卡片选择自己吧'}
            </span>
            <button onClick={enter} disabled={!selected || loading} className="btn-brand !px-6 !py-2.5 text-sm">
              进入课堂
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
