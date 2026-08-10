import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { StudentLogoutButton } from '@/components/StudentLogoutButton'
import { getSession, isStudentProfile } from '@/stores/session'

type ApiLetter = {
  letter_id: string
  student_id: string
  title: string
  body: string
  generated_at: string
  source: 'template' | 'llm'
  is_read: boolean
}

export function LetterListPage() {
  const [keyword, setKeyword] = useState('')
  const [letters, setLetters] = useState<ApiLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { profile } = getSession()
    const studentId = profile && isStudentProfile(profile) ? profile.id : null
    if (!studentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .getLetters(studentId)
      .then((data) => {
        setLetters(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载信件失败')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () =>
      letters.filter(
        (l) =>
          !keyword.trim() ||
          l.title.includes(keyword.trim()) ||
          l.body.includes(keyword.trim()),
      ),
    [keyword, letters],
  )

  return (
    <div className="relative mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
      <img src="/design/leaves.png" alt="" aria-hidden className="pointer-events-none absolute -right-40 -top-2 hidden w-72 opacity-60 xl:block" />
      {/* 顶部操作栏：返回主页 + 左上角退出登录 */}
      <div className="flex items-center justify-between">
        <Link to="/student" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand">
          <Icon name="arrow-left" size={16} />
          返回主页
        </Link>
        <StudentLogoutButton />
      </div>
      <div className="mt-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-warm-soft text-warm-deep">
          <Icon name="letter" size={30} />
        </span>
        <h1 className="font-cal mt-5 text-5xl tracking-[0.12em] text-brand-deep">我的信箱</h1>
        <p className="mt-3 text-[15px] text-ink-soft">小信每周都会给你写一封信，记得来查收哦</p>
      </div>

      <div className="relative mx-auto mt-8 max-w-md">
        <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索信件…"
          aria-label="搜索信件"
          className="input-soft !rounded-full !pl-11"
        />
      </div>

      {loading ? (
        <div className="mt-9 text-center text-ink-soft">信件加载中…</div>
      ) : error ? (
        <div className="mt-9 text-center text-red-500">{error}</div>
      ) : (
        <div className="mt-9 flex flex-col gap-4">
          {filtered.map((l, i) => (
            <Link
              key={l.letter_id}
              to={`/student/letters/${l.letter_id}`}
              className="card card-hover group flex items-center gap-4 p-5 animate-rise"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* 信封 */}
              <span
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${
                  l.is_read ? 'bg-brand-faint text-brand' : 'bg-brand text-white shadow-btn'
                }`}
              >
                <Icon name="letter" size={26} />
                {!l.is_read && (
                  <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-bold text-ink group-hover:text-brand transition-colors">{l.title}</span>
                  {!l.is_read ? (
                    <span className="tag bg-red-50 text-red-500 !text-[11px]">未读</span>
                  ) : (
                    <span className="tag bg-slate-100 text-ink-faint !text-[11px]">已读</span>
                  )}
                </span>
                <span className="mt-1 block truncate text-sm text-ink-soft">
                  {l.body.split('\n').find((line) => line.trim() && !line.startsWith('亲爱的')) || l.title}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-xs font-medium text-ink-faint">
                  {new Date(l.generated_at).toLocaleDateString('zh-CN')}
                </span>
                <Icon name="arrow-right" size={16} className="text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" />
              </span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="card flex flex-col items-center gap-2 p-10 text-center">
              <Icon name="letter" size={26} className="text-ink-faint" />
              <p className="font-bold text-ink">没有找到相关信件</p>
              <p className="text-sm text-ink-soft">换个关键词试试看</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
