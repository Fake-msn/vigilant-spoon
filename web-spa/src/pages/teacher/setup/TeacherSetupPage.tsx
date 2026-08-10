import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { students, type Student } from '@/mocks/data'
import { Icon } from '@/components/Icon'
import { KidAvatar } from '@/components/art/KidAvatar'
import { api } from '@/api/client'
import { getSession, setSession } from '@/stores/session'
import {
  getCities,
  getCounties,
  getProvinces,
  getProvinceByKey,
  getRegionKey,
  getTowns,
} from '@/data/regions'

type Step = 1 | 2 | 3

const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
const classNos = ['1 班', '2 班', '3 班']

const gradeNumeral: Record<string, string> = {
  一年级: '一',
  二年级: '二',
  三年级: '三',
  四年级: '四',
  五年级: '五',
  六年级: '六',
}

function buildClassName(grade: string, classNo: string): string {
  const num = classNo.replace('班', '').trim()
  const numeral = gradeNumeral[grade] ?? grade
  return `${numeral}（${num}）班`
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      {children}
    </label>
  )
}

function Select({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  placeholder: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`input-soft flex items-center justify-between text-left ${value ? 'text-ink' : 'text-ink-faint'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lift">
          {options.length === 0 ? (
            <p className="px-4 py-2 text-sm text-ink-faint">暂无选项</p>
          ) : (
            options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o)
                  setOpen(false)
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-brand-faint ${o === value ? 'bg-brand-faint font-bold text-brand' : 'text-ink'}`}
              >
                {o}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function TeacherSetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)

  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [county, setCounty] = useState('')
  const [town, setTown] = useState('')
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('')
  const [classNo, setClassNo] = useState('')

  // 挂载时自动填入历史学校信息（来自已建班级 + localStorage 缓存的市/县/镇）
  const [prefilled, setPrefilled] = useState(false)
  useEffect(() => {
    let active = true
    ;(async () => {
      // 优先从 localStorage 读取上次建班时缓存的完整地址
      const cached = localStorage.getItem('xiaoxing:last_setup_region')
      if (cached) {
        try {
          const obj = JSON.parse(cached)
          if (active && obj.province) {
            setProvince(obj.province)
            setCity(obj.city || '')
            setCounty(obj.county || '')
            setTown(obj.town || '')
            setSchool(obj.school || '')
            setPrefilled(true)
            return
          }
        } catch {
          // JSON 解析失败，忽略
        }
      }

      // localStorage 没有缓存，从已建班级获取完整地区信息
      try {
        const res = await api.getTeacherClasses()
        if (!active || res.classes.length === 0) return
        const last = res.classes[0] // 已按 assigned_at DESC 排序
        if (last.region_key) {
          const p = getProvinceByKey(last.region_key)
          if (p) setProvince(p)
        }
        if (last.city) setCity(last.city)
        if (last.county) setCounty(last.county)
        if (last.town) setTown(last.town)
        if (last.school) setSchool(last.school)
        setPrefilled(true)
      } catch {
        // 静默失败，不影响建班流程
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const onProvince = (v: string) => {
    setProvince(v)
    setCity('')
    setCounty('')
    setTown('')
  }
  const onCity = (v: string) => {
    setCity(v)
    setCounty('')
    setTown('')
  }
  const onCounty = (v: string) => {
    setCounty(v)
    setTown('')
  }

  const step1Done = province && city && county && town && school.trim() && grade && classNo

  const [roster, setRoster] = useState<Student[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [imported, setImported] = useState(false)
  const [fileImporting, setFileImporting] = useState(false)
  const [fileImportError, setFileImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 建班提交状态
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [created, setCreated] = useState<{
    class_code: string
    class_name: string
    school: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const pickFile = () => {
    setFileImportError(null)
    fileInputRef.current?.click()
  }

  // 解析常见中文列名 → 字段名
  const _norm = (s: unknown): string => String(s ?? '').trim()
  const _mapHeader = (h: string): keyof Pick<Student, 'name' | 'grade' | 'student_no' | 'ideal'> | 'avatar_seed' | '' => {
    const key = _norm(h).toLowerCase().replace(/[\s_\-/（）()]/g, '')
    if (['姓名', '名字', 'name', '学生姓名', '学生'].includes(key)) return 'name'
    if (['年级', 'grade', '学年'].includes(key)) return 'grade'
    if (['学号', 'studentno', 'student_no', '编号', '序号'].includes(key)) return 'student_no'
    if (['理想', '梦想', 'ideal', '理想职业', '梦想职业'].includes(key)) return 'ideal'
    if (['头像', '头像种子', 'avatar', 'avatarseed', 'avatar_seed'].includes(key)) return 'avatar_seed'
    return ''
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileImporting(true)
    setFileImportError(null)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheetName = wb.SheetNames[0]
      if (!sheetName) throw new Error('Excel 中没有工作表')
      const sheet = wb.Sheets[sheetName]
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })

      if (rows.length === 0) throw new Error('文件为空，请先填写学生名单')

      // 检测表头映射：第一行的键 -> 标准字段
      const sampleKeys = Object.keys(rows[0])
      const mapping: Record<string, keyof Pick<Student, 'name' | 'grade' | 'student_no' | 'ideal'> | 'avatar_seed' | ''> = {}
      for (const k of sampleKeys) mapping[k] = _mapHeader(k)

      const hasNameCol = sampleKeys.some((k) => mapping[k] === 'name')
      if (!hasNameCol) {
        // 如果没识别到姓名列，尝试直接用第一列作为姓名
        const firstKey = sampleKeys[0]
        if (firstKey) mapping[firstKey] = 'name'
      }

      const parsed: Student[] = []
      const baseSeed = roster.length + 1000
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const obj: Record<string, unknown> = {}
        for (const k of Object.keys(row)) {
          const field = mapping[k]
          if (field) obj[field] = row[k]
        }
        const name = _norm(obj.name)
        if (!name) continue
        const student_no =
          _norm(obj.student_no) ||
          `${new Date().getFullYear()}${String(parsed.length + roster.length + 1).padStart(3, '0')}`
        const avatar_seed_val = obj.avatar_seed
        let avatar_seed: number
        if (typeof avatar_seed_val === 'number' && !Number.isNaN(avatar_seed_val)) {
          avatar_seed = avatar_seed_val
        } else {
          const s = _norm(avatar_seed_val)
          avatar_seed = s ? parseInt(s, 10) : baseSeed + i
          if (Number.isNaN(avatar_seed)) avatar_seed = baseSeed + i
        }
        parsed.push({
          id: `f${Date.now().toString(36)}-${i}`,
          name,
          grade: _norm(obj.grade) || grade || '三年级',
          student_no,
          ideal: _norm(obj.ideal) || undefined,
          avatar_seed,
        })
      }

      if (parsed.length === 0) throw new Error('没有识别到有效的学生姓名，请确认文件格式')

      // 与现有名单合并（保留手动添加的），以导入名单为主
      const byName = new Map<string, Student>()
      for (const s of roster) byName.set(s.name, s)
      for (const s of parsed) byName.set(s.name, s)
      setRoster(Array.from(byName.values()))
      setImported(true)
    } catch (err) {
      setFileImportError(err instanceof Error ? err.message : '导入文件失败，请检查格式')
    } finally {
      setFileImporting(false)
      // 清空 input，允许再次选同一个文件
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const importDemo = () => {
    setRoster(students)
    setImported(true)
  }

  const addManual = () => {
    const name = newName.trim()
    if (!name) return
    setRoster((r) => [
      ...r,
      {
        id: `m${r.length}`,
        name,
        grade: grade || '三年级',
        student_no: `2023${String(r.length + 1).padStart(3, '0')}`,
        avatar_seed: r.length + 100,
      },
    ])
    setNewName('')
  }

  const removeStudent = (id: string) => setRoster((r) => r.filter((s) => s.id !== id))

  const finish = async () => {
    if (roster.length === 0 || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      // 缓存本次建班的完整地址，下次新建班级时自动填入
      localStorage.setItem(
        'xiaoxing:last_setup_region',
        JSON.stringify({ province, city, county, town, school: school.trim() }),
      )

      const classNoNum = classNo.replace('班', '').trim()
      const className = buildClassName(grade, classNo)
      const res = await api.createClass({
        class_name: className,
        school: school.trim(),
        region_key: getRegionKey(province),
        city,
        county,
        town,
        grade,
        class_no: classNoNum,
        students: roster.map((s) => ({
          name: s.name,
          grade: s.grade || grade,
          avatar_seed: s.avatar_seed,
          ideal: s.ideal,
        })),
      })

      // 从当前会话读取教师姓名；无会话则回退默认值，保证新建班级后班级码一定可送达
      const { profile } = getSession()
      const teacherName =
        profile && 'name' in profile ? (profile.name as string) : '李老师'

      // 建立新班级的教师会话：即使该步骤失败，班级已经创建成功，班级码仍要展示给用户
      try {
        const t = await api.teacherEnter(res.class_code, teacherName)
        setSession({ token: t.session_token, profile: t.profile as never })
      } catch (switchErr) {
        console.warn('[setup] 切换到新班级会话失败，但班级已创建：', switchErr)
      }

      setCreated({ class_code: res.class_code, class_name: res.class_name, school: res.school })
      setStep(3)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '创建班级失败')
    } finally {
      setCreating(false)
    }
  }

  const copyCode = async () => {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.class_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
      <div className="relative text-center">
        <img
          src="/design/leaves.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-44 -top-10 hidden w-72 opacity-70 lg:block"
        />
        <div>
          <span className="tag bg-white text-ink-soft border border-line">
            建设新班级 · 第 {Math.min(step, 3)} 步 / 共 3 步
          </span>
        </div>
        <h1 className="title-pill mt-5 text-4xl md:text-5xl">
          {step === 1 ? '地区输入' : step === 2 ? '学生信息导入' : '班级创建成功'}
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft">
          {step === 1
            ? '地区会作为上下文喂给 AI，让提问更贴近孩子们的生活'
            : step === 2
              ? '分文件导入 / 手动添加，名单将用于课堂点选身份与梦想画像'
              : '把你的班级码发给同学们，他们就能找到自己的班级啦'}
        </p>
      </div>

      {step === 3 && created && (
        <div className="card mx-auto mt-10 max-w-2xl p-8 text-center animate-rise md:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint text-white shadow-btn">
            <Icon name="check" size={32} />
          </span>
          <h2 className="mt-5 text-2xl font-black text-ink">班级「{created.class_name}」已创建</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {created.school} · 已为 {roster.length} 位同学建立档案
          </p>

          <div className="mx-auto mt-7 max-w-sm rounded-2xl border border-brand/30 bg-brand-faint p-6">
            <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink-soft">
              <Icon name="location" size={14} className="text-brand" />
              学生端接入班级码
            </p>
            <p className="mt-3 text-center font-cal text-4xl tracking-[0.2em] text-brand-deep">
              {created.class_code}
            </p>
            <button
              onClick={copyCode}
              className="btn-brand mt-4 !px-6 !py-2.5 text-sm"
            >
              <Icon name="copy" size={15} />
              {copied ? '已复制 ✓' : '复制班级码'}
            </button>
          </div>

          <p className="mt-5 text-[13px] leading-6 text-ink-soft">
            把班级码发给学生，他们进入「我是学生」后输入该码即可找到本班。
            <br />
            电子宠物、学情档案与成长档案将随课堂逐步生成。
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/teacher/lesson')}
              className="btn-brand !px-7 !py-3 text-sm"
            >
              <Icon name="arrow-right" size={16} />
              进入备课，准备开课
            </button>
            <Link to="/teacher/courses" className="btn-line !px-7 !py-3 text-sm">
              查看我的课程
            </Link>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card mt-10 p-7 md:p-9 animate-rise">
          {prefilled && (province || school) && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-faint px-4 py-2.5 text-[13px] text-ink-soft">
              <Icon name="check" size={14} className="shrink-0 text-brand" />
              <span>已为你预填上次的学校信息，可直接修改</span>
            </div>
          )}
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Icon name="location" size={16} className="text-brand" />
            学校所在地区
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="省份">
              <Select options={getProvinces()} value={province} onChange={onProvince} placeholder="选择省份" />
            </Field>
            <Field label="市 / 州">
              <Select
                options={getCities(province)}
                value={city}
                onChange={onCity}
                placeholder="选择市州"
                disabled={!province}
              />
            </Field>
            <Field label="区 / 县">
              <Select
                options={getCounties(province, city)}
                value={county}
                onChange={onCounty}
                placeholder="选择区县"
                disabled={!city}
              />
            </Field>
            <Field label="乡 / 镇">
              <Select
                options={getTowns(province, city, county)}
                value={town}
                onChange={setTown}
                placeholder="选择乡镇"
                disabled={!county}
              />
            </Field>
          </div>

          <p className="mt-8 flex items-center gap-2 text-sm font-bold text-ink">
            <Icon name="book" size={16} className="text-brand" />
            学校与班级
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
            <Field label="学校名称">
              <input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="例如：龙头山镇中心小学"
                className="input-soft"
              />
            </Field>
            <Field label="年级">
              <Select options={grades} value={grade} onChange={setGrade} placeholder="选择年级" />
            </Field>
            <Field label="班级">
              <Select options={classNos} value={classNo} onChange={setClassNo} placeholder="选择班级" />
            </Field>
          </div>

          <div className="mt-9 flex items-center justify-between">
            <Link to="/teacher" className="btn-line !px-6 !py-2.5 text-sm">
              <Icon name="arrow-left" size={16} />
              返回
            </Link>
            <span className="hidden text-sm text-ink-faint sm:block">
              {step1Done ? `${province} · ${school} ${grade}${classNo}` : '完成所有信息后进入下一步'}
            </span>
            <button onClick={() => setStep(2)} disabled={!step1Done} className="btn-brand !px-6 !py-2.5 text-sm">
              下一步
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-10 flex flex-col gap-6 animate-rise">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card card-hover flex flex-col items-center gap-3 p-7 text-center transition-opacity">
              <span
                className="flex items-center justify-center rounded-lg bg-brand-soft text-brand"
                style={{ width: 52, height: 52 }}
              >
                <Icon name="upload" size={26} />
              </span>
              <span className="text-lg font-bold text-ink">
                {fileImporting ? '导入中…' : imported ? '名单已导入 ✓' : '文件导入'}
              </span>
              <span className="text-[13px] leading-6 text-ink-soft">
                支持 Excel（.xlsx / .xls）和 CSV 格式
                <br />
                识别列：姓名 / 年级 / 学号 / 理想
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={pickFile}
                  disabled={fileImporting}
                  className="btn-brand !px-5 !py-2 text-sm"
                >
                  <Icon name="upload" size={14} />
                  {fileImporting ? '解析中…' : '选择文件'}
                </button>
                <button
                  onClick={importDemo}
                  disabled={fileImporting}
                  className="btn-line !px-5 !py-2 text-sm"
                >
                  导入示例名单
                </button>
              </div>
              {fileImportError && (
                <p className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-xs text-red-600">
                  {fileImportError}
                </p>
              )}
            </div>
            <div className="card flex flex-col items-center gap-3 p-7 text-center">
              <span
                className="flex items-center justify-center rounded-lg bg-warm-soft text-warm-deep"
                style={{ width: 52, height: 52 }}
              >
                <Icon name="plus" size={26} />
              </span>
              <span className="text-lg font-bold text-ink">手动添加</span>
              {adding ? (
                <span className="flex w-full gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManual()}
                    placeholder="输入学生姓名"
                    autoFocus
                    className="input-soft flex-1 !py-2.5 text-sm"
                  />
                  <button onClick={addManual} className="btn-brand !px-4 !py-2 text-sm">
                    添加
                  </button>
                </span>
              ) : (
                <button onClick={() => setAdding(true)} className="btn-line !px-5 !py-2 text-sm">
                  逐个录入学生
                </button>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-brand-faint px-6 py-4">
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <Icon name="users" size={16} className="text-brand" />
                名单预览
              </p>
              <span className="tag bg-white text-ink-soft border border-line">共 {roster.length} 人</span>
            </div>
            {roster.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <Icon name="users" size={28} className="text-ink-faint" />
                <p className="font-bold text-ink">还没有学生</p>
                <p className="text-sm text-ink-soft">先通过左上方「文件导入」或「手动添加」录入名单</p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {roster.map((s, i) => (
                  <li
                    key={s.id}
                    className="group relative flex flex-col items-center gap-2 rounded-lg border border-line bg-white p-4 animate-pop"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <span className="overflow-hidden rounded-xl" style={{ width: 64, height: 64 }}>
                      <KidAvatar avatarSeed={s.avatar_seed + i} size={64} />
                    </span>
                    <span className="text-sm font-bold text-ink">{s.name}</span>
                    <span className="text-[11px] font-medium text-ink-faint">学号 {s.student_no}</span>
                    <button
                      onClick={() => removeStudent(s.id)}
                      aria-label={`移除 ${s.name}`}
                      className="absolute -right-1.5 -top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-card group-hover:flex"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(1)} className="btn-line !px-6 !py-2.5 text-sm">
              <Icon name="arrow-left" size={16} />
              上一步
            </button>
            <span className="hidden text-sm text-ink-faint sm:block">
              {roster.length > 0 ? `已录入 ${roster.length} 位学生` : '至少录入 1 位学生'}
            </span>
            <button
              onClick={finish}
              disabled={roster.length === 0 || creating}
              className="btn-brand !px-6 !py-2.5 text-sm"
            >
              <Icon name="check" size={16} />
              {creating ? '正在创建班级…' : '完成建班'}
            </button>
          </div>
          {createError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {createError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
