import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { growthRows, type PetState } from '@/mocks/data'
import { Icon } from '@/components/Icon'
import { PixelArt } from '@/components/art/PixelArt'
import {
  petMap,
  petPalette,
  petPaletteGray,
  petPaletteCheer,
  cakeMap,
  cakePalette,
} from '@/components/art/pixelData'
import { KidAvatar } from '@/components/art/KidAvatar'
import { TeacherAvatar } from '@/components/art/TeacherAvatar'
import { VoiceClient, type VoiceEvent, type VoicePhase } from '@/ws/voice'
import { getSession, isStudentProfile } from '@/stores/session'

type Msg =
  | { from: 'ai'; text: string; image?: 'cake' | 'dream' }
  | { from: 'me'; text: string }

function AiAvatar() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-white shadow-btn">
      <Icon name="sparkles" size={19} />
    </span>
  )
}

function Wave({ active }: { active: boolean }) {
  return (
    <div className="flex h-8 items-center justify-center gap-1.5" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full ${active ? 'animate-wave' : ''} ${active ? 'bg-brand' : 'bg-line'}`}
          style={{ height: 28, animationDelay: `${i * 0.09}s`, transform: active ? undefined : 'scaleY(0.35)' }}
        />
      ))}
    </div>
  )
}

function petPaletteFor(state: PetState) {
  if (state === 'gray') return petPaletteGray
  if (state === 'cheer') return petPaletteCheer
  return petPalette
}

export function VoicePage() {
  const navigate = useNavigate()
  const { profile } = getSession()

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [phase, setPhase] = useState<VoicePhase>('idle')
  const [dream, setDream] = useState<'none' | 'cake' | 'dream'>('none')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<VoiceClient | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aiDraftIndexRef = useRef<number | null>(null)

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
  }

  const handleEvent = (event: VoiceEvent) => {
    console.log('[voice] event:', event.type, event)
    switch (event.type) {
      case 'transcript': {
        if (event.from === 'me') {
          // 用户语音转录，作为一条独立消息
          setMsgs((prev) => [...prev, { from: 'me', text: event.text }])
          break
        }
        // AI 回复是 delta 片段流，累积到同一条消息中，避免刷屏
        setMsgs((prev) => {
          const idx = aiDraftIndexRef.current
          if (idx !== null && idx >= 0 && idx < prev.length && prev[idx].from === 'ai') {
            const next = [...prev]
            next[idx] = { ...next[idx], text: next[idx].text + event.text }
            return next
          }
          aiDraftIndexRef.current = prev.length
          return [...prev, { from: 'ai', text: event.text }]
        })
        break
      }
      case 'image':
        setDream(event.kind)
        break
      case 'vad_start':
        setPhase('listening')
        break
      case 'vad_end':
        setPhase('thinking')
        break
      case 'audio_chunk':
        setPhase('speaking')
        break
      case 'turn_end':
        clearStopTimer()
        aiDraftIndexRef.current = null
        setPhase('idle')
        break
      case 'session_started':
        setSessionReady(true)
        break
      case 'session_end':
        setSessionReady(false)
        break
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, phase])

  useEffect(() => {
    const { token, profile } = getSession()
    if (!token || !profile || !isStudentProfile(profile)) return

    const client = new VoiceClient({
      token,
      studentId: profile.id,
      mode: 'classroom',
      onEvent: handleEvent,
      onError: (err) => console.error('[voice]', err),
    })
    client.connect()
    clientRef.current = client
    return () => client.disconnect()
  }, [])

  const talk = async () => {
    if (phase !== 'idle') return
    // 本地立即进入聆听态，避免等服务端 vad_start 迟迟无反馈
    setPhase('listening')
    try {
      await clientRef.current?.startTurn()
    } catch (err) {
      // 麦克风权限被拒、服务未就绪或启动失败，回退到 idle
      console.error('[voice] startTurn failed:', err)
      setPhase('idle')
    }
  }

  const stopTalk = () => {
    // 本地立即退出聆听态，交还 AI 等待，避免卡在"正在输入"
    setPhase('thinking')
    clientRef.current?.stopTurn()
    // 兜底：若服务端迟迟不回 turn_end，强制回到 idle，避免 UI 卡死
    clearStopTimer()
    stopTimerRef.current = setTimeout(() => {
      setPhase('idle')
      stopTimerRef.current = null
    }, 8000)
  }

  const reset = () => {
    clientRef.current?.disconnect()
    const { token, profile } = getSession()
    if (!token || !profile || !isStudentProfile(profile)) return

    const client = new VoiceClient({
      token,
      studentId: profile.id,
      mode: 'classroom',
      onEvent: handleEvent,
      onError: (err) => console.error('[voice]', err),
    })
    client.connect()
    clientRef.current = client
    aiDraftIndexRef.current = null
    setSessionReady(false)
    setMsgs([])
    setPhase('idle')
    setDream('none')
    setSaved(false)
  }

  const savePet = async () => {
    setSaving(true)
    // mock: R5 触发 → R6 轮询
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setSaving(false)
    setSaved(true)
  }

  const allDone = msgs.length >= 5 && phase === 'idle' && dream === 'dream'

  if (!profile || !isStudentProfile(profile)) return <Navigate to="/" replace />
  const petState: PetState = growthRows.find((g) => g.id === profile.id)?.state ?? 'daily'

  return (
    <div className="mx-auto w-full max-w-[1760px] px-6 pb-10 pt-6 lg:px-10">
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand"
      >
        <Icon name="arrow-left" size={16} />
        返回主页
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[2.4fr_1fr]">
        {/* 左：对话区 */}
        <section className="card flex min-h-[70vh] flex-col overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-brand to-brand-deep px-6 py-4 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Icon name="sparkles" size={19} />
            </span>
            <div className="flex-1">
              <p className="font-cal text-2xl leading-none">小信</p>
              <p className="mt-1.5 text-xs text-white/80">
                {profile.region_name} · 李老师的「心愿课」进行中
              </p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
              <TeacherAvatar size={22} />
              李老师
            </span>
          </div>

          {/* 消息流 */}
          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-6 py-6" aria-live="polite">
            {msgs.map((m, i) =>
              m.from === 'ai' ? (
                <div key={i} className="flex items-start gap-3 animate-rise">
                  <AiAvatar />
                  <div className="max-w-[80%]">
                    <div
                      className="rounded-2xl rounded-tl-md bg-brand-faint px-4.5 py-3.5 text-[15px] leading-7 text-ink border border-brand-soft"
                      style={{ padding: '12px 18px' }}
                    >
                      {m.text}
                    </div>
                    {m.image && (
                      <div className="mt-3 inline-flex flex-col items-center rounded-2xl border border-grape-soft bg-grape-soft/50 p-4 animate-pop">
                        {m.image === 'cake' ? (
                          <PixelArt map={cakeMap} palette={cakePalette} size={110} title="像素蛋糕" />
                        ) : (
                          <img src="/design/pet-baker.png" alt="蛋糕师电子宠物" width={150} className="drop-shadow-sm" />
                        )}
                        <span className="mt-2 text-xs font-semibold text-grape">
                          {m.image === 'cake' ? '梦想小蛋糕' : '你的专属电子宠物'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start justify-end gap-3 animate-rise">
                  <div
                    className="max-w-[80%] rounded-2xl rounded-tr-md bg-brand px-4 py-3 text-[15px] leading-7 text-white shadow-btn"
                    style={{ padding: '12px 18px' }}
                  >
                    {m.text}
                  </div>
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-card">
                    <KidAvatar avatarSeed={profile.avatar_seed} size={40} />
                  </span>
                </div>
              ),
            )}

            {phase === 'listening' && (
              <div className="flex items-start justify-end gap-3 animate-rise">
                <div className="rounded-2xl rounded-tr-md bg-brand/80 px-5 py-3 text-sm text-white">正在聆听…</div>
              </div>
            )}
            {(phase === 'thinking' || phase === 'speaking') && (
              <div className="flex items-start gap-3 animate-rise">
                <AiAvatar />
                <div className="rounded-2xl rounded-tl-md bg-brand-faint border border-brand-soft px-5 py-3.5">
                  <span className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-2 w-2 rounded-full bg-brand animate-blink" style={{ animationDelay: `${i * 0.25}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 语音控制区 */}
          <div className="border-t border-line bg-white px-6 py-5">
            <Wave active={phase === 'listening'} />
            <div className="mt-3 flex flex-col items-center gap-2.5">
              {!allDone ? (
                <>
                  <button
                    onClick={phase === 'listening' ? stopTalk : talk}
                    disabled={phase === 'thinking' || phase === 'speaking' || !sessionReady}
                    aria-label={phase === 'listening' ? '点击结束说话' : '点击开始说话'}
                    className={`flex h-18 w-18 items-center justify-center rounded-full text-white transition-all ${
                      phase === 'listening'
                        ? 'bg-red-500 shadow-[0_0_0_10px_rgba(239,68,68,0.15)] animate-blink'
                        : 'bg-gradient-to-br from-brand to-brand-deep shadow-btn hover:scale-105'
                    } disabled:opacity-80`}
                    style={{ width: 72, height: 72 }}
                  >
                    <Icon name={phase === 'listening' ? 'square' : 'mic'} size={30} />
                  </button>
                  <p className="text-sm font-medium text-ink-soft">
                    {!sessionReady
                      ? '小信准备中…'
                      : phase === 'listening'
                        ? '我在听，说完点按钮…'
                        : phase === 'thinking'
                          ? '小信正在想…'
                          : phase === 'speaking'
                            ? '小信在说…'
                            : '点击麦克风，告诉小信你的梦想吧'}
                  </p>
                </>
              ) : (
                <div className="flex w-full flex-col items-center gap-3 animate-pop">
                  <p className="text-sm font-semibold text-mint">本次谈心完成啦，成长值 +10！</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button onClick={savePet} disabled={saving || saved} className="btn-brand !px-5 !py-2.5 text-sm">
                      <Icon name="download" size={16} />
                      {saving ? '生成中…' : saved ? '已存入成长档案 ✓' : '保存电子宠物'}
                    </button>
                    <button onClick={reset} className="btn-line !px-5 !py-2.5 text-sm">
                      <Icon name="refresh" size={16} />
                      再聊一次
                    </button>
                    <Link to="/student/growth" className="btn-line !px-5 !py-2.5 text-sm !border-brand !text-brand">
                      <Icon name="check" size={16} />
                      完成
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 右侧栏 */}
        <aside className="flex flex-col gap-5">
          {/* 学生卡 */}
          <div className="card flex items-center gap-4 p-5">
            <span className="overflow-hidden rounded-lg" style={{ width: 64, height: 64 }}>
              <KidAvatar avatarSeed={profile.avatar_seed} size={64} />
            </span>
            <div className="flex-1">
              <p className="text-lg font-bold text-ink">{profile.name}</p>
              <p className="mt-0.5 text-xs font-medium text-ink-faint">
                {profile.grade} · {profile.region_name}
              </p>
            </div>
            <span className="tag bg-mint-soft text-mint">在线</span>
          </div>

          {/* 电子宠物 */}
          <div className="card flex flex-col items-center gap-3 p-6 text-center">
            <p className="w-full text-left text-sm font-bold text-ink">
              {dream === 'dream' ? '你的电子宠物' : '你的小信伙伴'}
            </p>
            {dream === 'none' && (
              <>
                <span className="animate-floaty">
                  <PixelArt map={petMap} palette={petPaletteFor(petState)} size={110} title="小信伙伴" />
                </span>
                <p className="text-[13px] leading-6 text-ink-soft">
                  还没有电子宠物
                  <br />
                  和小信聊聊你的梦想，它会为你生成专属的电子宠物
                </p>
              </>
            )}
            {dream === 'cake' && (
              <>
                <span className="animate-pop">
                  <PixelArt map={cakeMap} palette={cakePalette} size={110} title="像素蛋糕" />
                </span>
                <p className="text-[13px] leading-6 text-ink-soft">电子宠物生成中…再聊两句就好啦</p>
              </>
            )}
            {dream === 'dream' && (
              <>
                <img src="/design/pet-baker.png" alt="蛋糕师电子宠物" width={150} className="animate-pop drop-shadow-md" />
                <p className="tag bg-grape-soft text-grape">
                  {profile.ideal ?? '蛋糕师'} · {profile.name}
                </p>
              </>
            )}
          </div>

          {/* 今日小目标 */}
          <div
            className={`rounded-[10px] p-5 text-white shadow-card transition-colors ${
              allDone ? 'bg-gradient-to-br from-mint to-emerald-600' : 'bg-gradient-to-br from-brand to-brand-deep'
            }`}
          >
            <p className="flex items-center gap-2 text-sm font-bold">
              <Icon name="target" size={16} />
              今日小目标
            </p>
            {allDone ? (
              <p className="mt-2.5 flex items-center gap-2 text-[15px] font-semibold">
                <Icon name="check" size={18} />
                已完成 · 获得 10 成长值
              </p>
            ) : (
              <>
                <p className="mt-2.5 text-[15px] font-semibold">和 AI 聊 5 分钟</p>
                <p className="mt-1 text-xs text-white/75">奖励：10 成长值</p>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/identity')}
            className="text-center text-xs font-medium text-ink-faint transition-colors hover:text-brand"
          >
            换个同学重新进入 →
          </button>
        </aside>
      </div>
    </div>
  )
}
