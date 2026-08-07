import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { TeacherAvatar } from '@/components/art/TeacherAvatar'

type Msg = { from: 'agent' | 'teacher'; text: string }

const topics = [
  {
    label: '聊职业理想',
    teacher: '这周想围绕"职业理想"聊，孩子们最近老问山外面的工作是什么样的。',
    agent:
      '好主意！我建议主题定为「我的梦想清单」：先让每个孩子说一个想做的职业，我会追问"你有没有为它努力过"，再结合他们的成绩数据自然引导。要不要我把主题和目标填到右边？',
    subject: '我的梦想清单',
    goal: '引导每位同学说出一个具体职业理想，并想一件本周能做的小事；对话中自然融入"唯有读书高?"的多元价值讨论。',
  },
  {
    label: '结合本地生活',
    teacher: '想从家乡生活入手，很多孩子没出过县城，先聊聊身边熟悉的事。',
    agent:
      '很贴心的切入点。主题可以叫「家乡与远方」：从梯田、赶集、家里的手艺聊起，再引到"山外面还有哪些工作"。地区上下文我会自动带上，要我填入右侧吗？',
    subject: '家乡与远方',
    goal: '从家乡熟悉的生活场景出发，拓宽职业想象；鼓励内向的孩子先描述身边的事，再说出向往。',
  },
  {
    label: '关注成绩波动',
    teacher: '陈小雨最近各科都在下滑，想在课上多给她一些鼓励。',
    agent:
      '我注意到她的学情档案了：父母外出务工，近期注意力下降。我会在她的对话里放慢节奏、先聊情绪再聊理想，并把心理信号同步给你。课程主题建议温和一些，比如「小小的进步也算数」？',
    subject: '小小的进步也算数',
    goal: '弱化成绩比较，聚焦"这周比上周好一点点"；重点关注陈小雨、吴小雪的情绪信号并生成报告。',
  },
]

export function TeacherLessonPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: 'agent',
      text: '李老师好！我是备课小助手。和我聊聊这周思政课想带孩子们聊什么，我来帮你创设课堂语境、定好对话细节。',
    },
  ])
  const [subject, setSubject] = useState('')
  const [goal, setGoal] = useState('')
  const [pending, setPending] = useState<(typeof topics)[number] | null>(null)
  const [thinking, setThinking] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, thinking])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const pick = (t: (typeof topics)[number]) => {
    if (thinking) return
    setMsgs((m) => [...m, { from: 'teacher', text: t.teacher }])
    setThinking(true)
    timers.current.push(
      setTimeout(() => {
        setMsgs((m) => [...m, { from: 'agent', text: t.agent }])
        setPending(t)
        setThinking(false)
      }, 1200),
    )
  }

  const adopt = () => {
    if (!pending) return
    setSubject(pending.subject)
    setGoal(pending.goal)
    setMsgs((m) => [
      ...m,
      { from: 'agent', text: '已经帮你填到右侧啦，你可以再修改。确认后点「保存并开课」就能让孩子们进入课堂了。' },
    ])
    setPending(null)
  }

  const save = async () => {
    if (!subject.trim() || !goal.trim() || saving) return
    setSaving(true)
    try {
      const res = await api.generateLesson(subject.trim(), [goal.trim()], goal.trim())
      setSaved(true)
      setMsgs((m) => [
        ...m,
        { from: 'agent', text: `课程「${res.topic}」已保存成功，课程 ID：${res.lesson_id}。` },
      ])
    } catch (err) {
      setMsgs((m) => [
        ...m,
        { from: 'agent', text: `保存失败：${err instanceof Error ? err.message : '未知错误'}` },
      ])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-ink md:text-3xl">新建课程</h1>
          <p className="mt-2 text-sm text-ink-soft">和小助手一起定课堂细节，AI 会以课程语境向孩子们开场</p>
        </div>
        <span className="tag bg-brand-soft text-brand">
          <Icon name="sparkles" size={13} />
          备课小助手在线
        </span>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.9fr_1fr]">
        <section className="card flex min-h-[480px] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line bg-brand-faint px-5 py-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-white">
              <Icon name="sparkles" size={17} />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">备课小助手</p>
              <p className="text-xs text-ink-faint">和老师定细节、创设课堂语境</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
            {msgs.map((m, i) =>
              m.from === 'agent' ? (
                <div key={i} className="flex items-start gap-2.5 animate-rise">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-white">
                    <Icon name="sparkles" size={14} />
                  </span>
                  <div
                    className="max-w-[85%] rounded-2xl rounded-tl-md border border-brand-soft bg-brand-faint px-4 py-3 text-sm leading-6.5 text-ink"
                    style={{ lineHeight: 1.7 }}
                  >
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start justify-end gap-2.5 animate-rise">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand px-4 py-3 text-sm text-white"
                    style={{ lineHeight: 1.7 }}
                  >
                    {m.text}
                  </div>
                  <span className="shrink-0">
                    <TeacherAvatar size={32} />
                  </span>
                </div>
              ),
            )}
            {thinking && (
              <div className="flex items-start gap-2.5 animate-rise">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-white">
                  <Icon name="sparkles" size={14} />
                </span>
                <div className="rounded-2xl rounded-tl-md border border-brand-soft bg-brand-faint px-5 py-3">
                  <span className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-brand animate-blink"
                        style={{ animationDelay: `${i * 0.25}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            {pending && !thinking && (
              <div className="flex justify-start pl-10 animate-pop">
                <button onClick={adopt} className="btn-brand !px-4 !py-2 text-xs">
                  <Icon name="check" size={14} />
                  采纳建议，填入右侧
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-line bg-white px-5 py-4">
            <p className="text-xs font-semibold text-ink-faint">试着对小助手说：</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t.label}
                  onClick={() => pick(t)}
                  disabled={thinking}
                  className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="card p-6">
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-bold text-ink">
                <Icon name="edit" size={15} className="text-brand" />
                课程主题
              </span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="待老师输入，或采纳小助手建议"
                className="input-soft mt-3"
              />
            </label>
            <label className="mt-5 block">
              <span className="flex items-center gap-2 text-sm font-bold text-ink">
                <Icon name="target" size={15} className="text-brand" />
                教学目标
              </span>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="待老师输入，AI 将按此目标引导对话"
                rows={4}
                className="input-soft mt-3 resize-none"
              />
            </label>
          </div>

          <div className="card p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Icon name="camera" size={15} className="text-brand" />
              课堂配图 / 老师大头照
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-lg border-2 border-dashed border-line p-2">
                <TeacherAvatar size={56} />
              </span>
              <button className="btn-line !px-4 !py-2 text-xs">
                <Icon name="upload" size={14} />
                上传图片
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink-faint">
              大头照会出现在学生对话页，强化「这是我们老师的课」的真实感
            </p>
          </div>

          {saved ? (
            <div className="card flex flex-col items-center gap-3 border-mint/40 bg-mint-soft/50 p-6 text-center animate-pop">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-white">
                <Icon name="check" size={22} />
              </span>
              <p className="text-sm font-bold text-ink">课程「{subject}」已就绪！</p>
              <Link to="/teacher/classroom" className="btn-brand !px-5 !py-2.5 text-sm">
                <Icon name="play" size={15} />
                让学生进入课堂
              </Link>
            </div>
          ) : (
            <button
              onClick={save}
              disabled={!subject.trim() || !goal.trim() || saving}
              className="btn-brand !py-3.5"
            >
              <Icon name="check" size={17} />
              {saving ? '保存中…' : '保存并开课'}
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
