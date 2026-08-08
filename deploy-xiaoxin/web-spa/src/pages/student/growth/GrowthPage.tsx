import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getSession, isStudentProfile } from '@/stores/session'

import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { PixelArt } from '@/components/art/PixelArt'
import { petMap, petPalette, petPaletteGray, petPaletteCheer } from '@/components/art/pixelData'
import { KidAvatar } from '@/components/art/KidAvatar'
import { chatHistory as fallbackChatHistory } from '@/mocks/data'
import type { PetState } from '@/mocks/data'

const statePalette: Record<PetState, Record<string, string>> = {
  daily: petPalette,
  gray: petPaletteGray,
  cheer: petPaletteCheer,
}

const stateLabel: Record<PetState, string> = {
  daily: '日常',
  gray: '需要关心',
  cheer: '开心',
}

type GrowthData = {
  ideal: string | null
  commitments: { id: string; text: string; created_at: string; status: 'active' | 'fulfilled' | 'expired' }[]
  last_gist: string | null
  growth_value: number
  stage: string
  pet: {
    species: string
    stage: number
    state: PetState
    growth_value: number
    last_growth_at: string
    cheer_until: string | null
    needs_care: boolean
    portrait_url: string | null
    updated_at: string
    points_total: number
    level: number
    hunger: number
    mood: number
  }
  actions: unknown[] | null
  history: unknown[] | null
}

type ChatItem = { date: string; topic: string; state: PetState; mins: number }

type LedgerItem = { id: number; name: string; points: number; note: string | null; created_at: string }

export function GrowthPage() {
  const [growth, setGrowth] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ledger, setLedger] = useState<LedgerItem[]>([])

  const { profile } = getSession()
  const studentId = profile && isStudentProfile(profile) ? profile.id : null

  useEffect(() => {
    if (!studentId) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    api.getGrowth(studentId)
      .then((data) => {
        if (!mounted) return
        setGrowth(data)
        setError(null)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [studentId])

  useEffect(() => {
    if (!studentId) return
    let mounted = true
    api
      .getStudentPoints(studentId)
      .then((items) => {
        if (mounted) setLedger(items)
      })
      .catch(() => {
        // 积分流水加载失败时仅忽略，不影响页面展示
      })
    return () => {
      mounted = false
    }
  }, [studentId])

  if (!profile || !isStudentProfile(profile)) return <Navigate to="/" replace />

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1760px] px-6 py-20 text-center text-ink-soft lg:px-10">
        成长档案加载中…
      </div>
    )
  }

  if (error || !growth) {
    return (
      <div className="mx-auto w-full max-w-[1760px] px-6 py-20 text-center text-red-500 lg:px-10">
        {error ?? '加载失败'}
      </div>
    )
  }

  const state = growth.pet.state
  const palette = statePalette[state]
  const chatHistory = (growth.history as ChatItem[] | undefined) ?? fallbackChatHistory

  return (
    <div className="relative mx-auto w-full max-w-[1760px] px-6 py-8 lg:px-10">
      <img
        src="/design/leaves.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-2 hidden w-64 opacity-60 xl:block"
      />
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand"
      >
        <Icon name="arrow-left" size={16} />
        返回主页
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cal text-5xl tracking-[0.1em] text-brand-deep">我的成长档案</h1>
          <p className="mt-3 text-[15px] text-ink-soft">每一次谈心、每一个承诺，都在这里好好保存着。</p>
        </div>
        <Link to="/student/letters" className="btn-line !px-5 !py-2.5 text-sm">
          <Icon name="letter" size={16} />
          我的信箱
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
            1
          </span>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
        {/* 学生卡 + 统计 */}
        <div className="flex flex-col gap-5">
          <div className="card flex flex-col items-center gap-3 p-6 text-center">
            <span
              className="overflow-hidden rounded-xl border-4 border-brand-soft"
              style={{ width: 104, height: 104 }}
            >
              <KidAvatar avatarSeed={profile.avatar_seed} size={104} />
            </span>
            <div>
              <p className="text-xl font-black text-ink">{profile.name}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {profile.grade} · {profile.region_name}
              </p>
            </div>
            <span className="tag bg-grape-soft text-grape">
              <Icon name="sparkles" size={13} />
              梦想：{growth.ideal ?? '暂未填写'}
            </span>
            <div className="w-full rounded-lg border border-line bg-white/80 px-4 py-3 text-left">
              <p className="text-xs text-ink-faint">成长值</p>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(100, growth.growth_value)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-ink">{growth.growth_value}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 电子宠物 */}
        <div className="flex flex-col gap-5">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-b from-grape-soft/60 to-white p-7 text-center">
          <p className="w-full text-left text-sm font-bold text-ink">我的电子宠物</p>
          <span className="rounded-xl border-2 border-dashed border-grape/30 bg-white/70 px-6 py-4 animate-floaty">
            <img
              src="/design/pet-baker.png"
              alt={`${profile.ideal ?? '小信'}电子宠物`}
              width={185}
              className="drop-shadow-md"
            />
          </span>
          <span className="tag bg-grape-soft text-grape">
            {growth.ideal ?? '梦想'} · {profile.name}
          </span>
          <div className="mt-1 flex w-full items-center justify-between rounded-lg border border-line bg-white/80 px-4 py-3">
            <span className="flex items-center gap-2.5">
              <PixelArt map={petMap} palette={palette} size={40} title="小信伙伴" />
              <span className="text-left">
                <span className="block text-sm font-bold text-ink">{growth.ideal ?? '小信'}小宠物</span>
                <span className="block text-xs font-medium text-mint">
                  {stateLabel[state]} · Lv.{growth.pet.stage}
                </span>
              </span>
            </span>
            <Icon name="heart" size={18} className="text-red-400" fill="currentColor" />
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-lg border border-line bg-white/80 px-4 py-3 text-left">
              <p className="text-xs text-ink-faint">累计积分</p>
              <p className="mt-1 text-sm font-bold text-ink">{growth.pet.points_total ?? 0}</p>
            </div>
            <div className="rounded-lg border border-line bg-white/80 px-4 py-3 text-left">
              <p className="text-xs text-ink-faint">等级</p>
              <p className="mt-1 text-sm font-bold text-ink">Lv.{growth.pet.level ?? 1}</p>
            </div>
            <div className="rounded-lg border border-line bg-white/80 px-4 py-3 text-left">
              <p className="text-xs text-ink-faint">饥饿度</p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.max(0, Math.min(100, growth.pet.hunger ?? 0))}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-ink">{growth.pet.hunger ?? 0}%</span>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-white/80 px-4 py-3 text-left">
              <p className="text-xs text-ink-faint">心情</p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-mint"
                    style={{ width: `${Math.max(0, Math.min(100, growth.pet.mood ?? 0))}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-ink">{growth.pet.mood ?? 0}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Icon name="sparkles" size={16} className="text-brand" />
            积分流水
          </p>
          {ledger.length === 0 ? (
            <p className="mt-4 text-sm text-ink-faint">暂无积分流水</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {ledger.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{item.created_at}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-brand">
                    {item.points > 0 ? '+' : ''}
                    {item.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>

        {/* 承诺 + 谈心记录 */}
        <div className="flex flex-col gap-5">
          <div className="card p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Icon name="target" size={16} className="text-brand" />
              我的承诺
            </p>
            <ul className="mt-4 space-y-3">
              {growth.commitments.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      p.status === 'fulfilled' ? 'border-mint bg-mint text-white' : 'border-line bg-white text-transparent'
                    }`}
                  >
                    <Icon name="check" size={13} />
                  </span>
                  <span className={`text-sm leading-6 ${p.status === 'fulfilled' ? 'text-ink-faint line-through' : 'text-ink'}`}>
                    {p.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card flex-1 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Icon name="clock" size={16} className="text-brand" />
              谈心记录
            </p>
            <ol className="mt-4 space-y-0">
              {chatHistory.map((c, i) => (
                <li key={c.date + c.topic} className="relative flex gap-3.5 pb-4 last:pb-0">
                  {i < chatHistory.length - 1 && (
                    <span className="absolute left-[7px] top-5 h-full w-px bg-line" aria-hidden />
                  )}
                  <span
                    className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] ${
                      i === 0 ? 'border-brand bg-brand-soft' : 'border-line bg-white'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{c.topic}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {c.date} · {c.mins} 分钟 · 心情{stateLabel[c.state]}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
