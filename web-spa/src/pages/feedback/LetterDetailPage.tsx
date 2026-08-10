import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { StudentLogoutButton } from '@/components/StudentLogoutButton'
import { PixelArt } from '@/components/art/PixelArt'
import { petMap, petPalette } from '@/components/art/pixelData'
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

export function LetterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [letters, setLetters] = useState<ApiLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [jobRef, setJobRef] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

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
      })
      .catch(() => {
        // 加载失败时保持空列表
      })
      .finally(() => setLoading(false))
  }, [])

  const idx = letters.findIndex((l) => l.letter_id === id)
  const letter = idx >= 0 ? letters[idx] : null
  const prev = letters[idx + 1]
  const next = letters[idx - 1]

  const generate = async () => {
    const { profile } = getSession()
    const studentId = profile && isStudentProfile(profile) ? profile.id : null
    if (!studentId) return
    setGenerating(true)
    try {
      const resp = await api.generateLetter(studentId)
      setJobRef(resp.job_id)
    } catch {
      // 忽略错误
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10 text-center text-ink-soft">
        信件加载中…
      </div>
    )
  }

  if (!letter) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10 text-center">
        <p className="text-ink-soft">这封信不存在</p>
        <Link to="/student/letters" className="btn-line mt-4 inline-flex">
          返回信箱
        </Link>
      </div>
    )
  }

  // 将 body 字符串按换行拆分成段落
  const paragraphs = letter.body.split('\n').filter((line) => line.trim())

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      {/* 顶部操作栏：返回信箱 + 左上角退出登录 */}
      <div className="flex items-center justify-between">
        <Link to="/student/letters" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand">
          <Icon name="arrow-left" size={16} />
          返回信箱
        </Link>
        <StudentLogoutButton />
      </div>

      {/* 信纸 */}
      <article className="relative mt-6 overflow-hidden rounded-xl border border-warm/25 bg-[#fffdf7] shadow-card animate-rise">
        {/* 信封口装饰条 */}
        <div
          className="h-3 w-full"
          style={{
            background:
              'repeating-linear-gradient(135deg, #f59e0b 0 14px, #fffdf7 14px 28px, #3e8e41 28px 42px, #fffdf7 42px 56px)',
          }}
          aria-hidden
        />

        <div className="px-7 py-8 md:px-12 md:py-10">
          {/* 邮票 + 邮戳 */}
          <div className="flex items-start justify-between">
            <div>
              <span className="tag bg-warm-soft text-warm-deep">
                <Icon name="letter" size={13} />
                {letter.title}
              </span>
              <p className="mt-3 text-xs font-medium tracking-wide text-ink-faint">
                {new Date(letter.generated_at).toLocaleDateString('zh-CN')} · 由「小信」寄出
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-lg border-2 border-dashed border-warm/40 bg-white p-2 rotate-3">
                <PixelArt map={petMap} palette={petPalette} size={44} title="梦想小宠物邮票" />
              </span>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-ink-faint">梦想邮政</span>
            </div>
          </div>

          {/* 正文 */}
          <div className="mt-8 space-y-5">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? 'text-[17px] font-bold leading-8 text-ink'
                    : 'indent-8 text-[15.5px] leading-8 text-ink'
                }
              >
                {p}
              </p>
            ))}
          </div>

          {/* 落款 */}
          <div className="mt-10 flex flex-col items-end gap-1 text-right">
            <p className="text-[15px] font-semibold text-ink">一直陪着你的</p>
            <p className="font-cal text-4xl tracking-wide text-brand-deep">小信</p>
            <p className="text-xs text-ink-faint">{new Date(letter.generated_at).toLocaleDateString('zh-CN')}</p>
          </div>
        </div>

        {/* 信纸底部横线装饰 */}
        <div className="border-t border-dashed border-warm/25 bg-warm-soft/40 px-7 py-4 text-center text-xs font-medium text-warm-deep md:px-12">
          读完这封信，去和小信聊聊本周的新故事吧
        </div>
      </article>

      {/* 底部 CTA：让小信写一封信 / 去和小信聊聊 — 两按钮同一水平线（视觉规范对齐） */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={generate}
          disabled={generating || !!jobRef}
          className="btn-brand !px-5 !py-2.5 text-sm"
        >
          <Icon name="sparkles" size={16} />
          {generating ? '正在生成…' : jobRef ? '已触发' : '让小信写一封新信'}
        </button>
        <button onClick={() => navigate('/student/voice')} className="btn-brand !px-6 !py-2.5 text-sm">
          <Icon name="mic" size={16} />
          去和小信聊聊
        </button>
        {jobRef && <span className="w-full text-center text-xs text-ink-faint">Job: {jobRef}</span>}
      </div>

      {/* 上一封 / 下一封 */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {prev ? (
          <Link to={`/student/letters/${prev.letter_id}`} className="btn-line !px-5 !py-2.5 text-sm">
            <Icon name="arrow-left" size={16} />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/student/letters/${next.letter_id}`} className="btn-line !px-5 !py-2.5 text-sm">
            {next.title}
            <Icon name="arrow-right" size={16} />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
