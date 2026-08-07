import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { KidAvatar } from '@/components/art/KidAvatar'
import { getSession } from '@/stores/session'

const roleOptions = [
  { value: 'member', label: '普通成员' },
  { value: 'group_leader', label: '小组长' },
  { value: 'class_committee', label: '班委' },
  { value: 'subject_rep', label: '课代表' },
]

const roleStyle: Record<string, string> = {
  member: 'bg-brand-soft text-brand',
  group_leader: 'bg-mint-soft text-mint',
  class_committee: 'bg-warm-soft text-warm-deep',
  subject_rep: 'bg-grape-soft text-grape',
}

function Trend({ t }: { t: 'up' | 'down' | 'flat' }) {
  if (t === 'up') return <span className="text-mint" title="上升">▲</span>
  if (t === 'down') return <span className="text-red-500" title="下滑">▼</span>
  return <span className="text-ink-faint" title="平稳">—</span>
}

type AcademicRecord = {
  student_id: string
  student_no: string
  name: string
  role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
  scores: { subject: string; score: number; trend: 'up' | 'down' | 'flat' }[]
  teacher_note: string
}

export function TeacherAcademicPage() {
  const profile = getSession().profile
  const classCode = profile?.class_code ?? ''
  const [records, setRecords] = useState<AcademicRecord[]>([])
  const [summary, setSummary] = useState({ count: 0, avg_score: 0, attention_count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [roles, setRoles] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})

  console.log('[academic] render loading=', loading, 'records=', records.length)

  const load = useCallback(async () => {
    console.log('[academic] load start classCode=', classCode)
    if (!classCode) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.getAcademicSummary(classCode)
      console.log('[academic] data', data)
      setRecords(data.records)
      setSummary(data.summary)
      setRoles(Object.fromEntries(data.records.map((r) => [r.student_id, r.role])))
      setComments(Object.fromEntries(data.records.map((r) => [r.student_id, r.teacher_note])))
    } catch (err) {
      console.log('[academic] error', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [classCode])

  useEffect(() => {
    load()
  }, [load])

  const avg = useMemo(
    () =>
      summary.avg_score ||
      (records.length
        ? Math.round(
            records.reduce((sum, r) => sum + r.scores.reduce((s, x) => s + x.score, 0) / r.scores.length, 0) /
              records.length,
          )
        : 0),
    [records, summary.avg_score],
  )
  const attention = useMemo(
    () =>
      summary.attention_count ||
      records.reduce((sum, r) => sum + r.scores.filter((s) => s.trend === 'down').length, 0),
    [records, summary.attention_count],
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !classCode) return
    setImporting(true)
    try {
      await api.importAcademicFile(classCode, file)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-soft">
        <Icon name="loader" size={20} className="mr-2 animate-spin" />
        加载学情档案…
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-ink md:text-3xl">学情档案</h1>
          <p className="mt-2 text-sm text-ink-soft">
            成绩与背景信息会喂给 AI，让它在对话中讲清楚「你现在需要怎么努力」
          </p>
        </div>
        <div className="flex gap-2.5">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="btn-line !px-4 !py-2 text-xs"
          >
            <Icon name="upload" size={14} />
            {importing ? '导入中…' : '文件导入'}
          </button>
          <button className="btn-brand !px-4 !py-2 text-xs">
            <Icon name="plus" size={14} />
            手动录入
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: '在册学生', value: `${records.length} 人`, icon: 'users' as const, color: 'bg-brand-soft text-brand' },
          { label: '班级平均分', value: `${avg} 分`, icon: 'chart' as const, color: 'bg-mint-soft text-mint' },
          { label: '成绩波动关注', value: `${attention} 人`, icon: 'eye' as const, color: 'bg-warm-soft text-warm-deep' },
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

      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-brand-faint text-xs font-bold text-ink-soft">
                <th className="px-5 py-3.5">学生</th>
                <th className="px-4 py-3.5">语文</th>
                <th className="px-4 py-3.5">数学</th>
                <th className="px-4 py-3.5">英语</th>
                <th className="px-4 py-3.5">校内角色</th>
                <th className="px-5 py-3.5">背景信息（AI 对话上下文）</th>
                <th className="px-5 py-3.5">教师评语</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const scoreMap = Object.fromEntries(r.scores.map((s) => [s.subject, s]))
                return (
                  <tr key={r.student_id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-brand-faint/50">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3">
                        <span className="overflow-hidden rounded-xl" style={{ width: 38, height: 38 }}>
                          <KidAvatar avatarSeed={0} size={38} />
                        </span>
                        <span>
                          <span className="block font-bold text-ink">{r.name}</span>
                          <span className="block text-[11px] text-ink-faint">
                            学号 {r.student_no}
                          </span>
                        </span>
                      </span>
                    </td>
                    {['语文', '数学', '英语'].map((subject) => {
                      const sc = scoreMap[subject]
                      return (
                        <td key={subject} className="px-4 py-3.5">
                          {sc ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-ink">
                              {sc.score}
                              <Trend t={sc.trend} />
                            </span>
                          ) : (
                            <span className="text-ink-faint">-</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3.5">
                      <select
                        value={roles[r.student_id] ?? r.role}
                        onChange={(e) => setRoles((prev) => ({ ...prev, [r.student_id]: e.target.value }))}
                        className={`tag !text-[11px] ${roleStyle[roles[r.student_id] ?? r.role]} cursor-pointer border-0`}
                      >
                        {roleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="max-w-[260px] px-5 py-3.5 text-[13px] leading-6 text-ink-soft">
                      {r.teacher_note || '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        value={comments[r.student_id] ?? ''}
                        onChange={(e) => setComments((prev) => ({ ...prev, [r.student_id]: e.target.value }))}
                        placeholder="添加评语…"
                        className="input-soft !py-2 text-xs"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line bg-brand-faint/60 px-5 py-3.5 text-xs leading-6 text-ink-soft">
          <Icon name="info" size={13} className="mr-1.5 inline-block align-[-2px] text-brand" />
          示例：王小雅想当蛋糕师而数学在下滑，AI 会自然聊到「做蛋糕要算配料，数学可不能落下哦」。
        </div>
      </div>
    </div>
  )
}
