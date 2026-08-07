import { useEffect, useState } from 'react'
import { getSession, isStudentProfile } from '@/stores/session'
import { api } from '@/api/client'
import type { PetState } from '@/mocks/data'
import { Icon } from '@/components/Icon'
import { PixelArt } from '@/components/art/PixelArt'
import { petMap, petPalette, petPaletteGray, petPaletteCheer } from '@/components/art/pixelData'
import { KidAvatar } from '@/components/art/KidAvatar'

const statePalette: Record<PetState, Record<string, string>> = {
  daily: petPalette,
  gray: petPaletteGray,
  cheer: petPaletteCheer,
}

const stateConf: Record<PetState, { tag: string; label: string; animate: string }> = {
  daily: { tag: 'bg-brand-soft text-brand', label: '日常', animate: 'animate-floaty' },
  gray: { tag: 'bg-slate-100 text-ink-faint', label: '需要关心', animate: '' },
  cheer: { tag: 'bg-mint-soft text-mint', label: '开心', animate: 'animate-floaty' },
}

type ClassPetItem = {
  student_id: string
  name: string
  avatar_seed: number
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
  }
}

export function TeacherGrowthPage() {
  const { profile } = getSession()
  const classCode = profile && !isStudentProfile(profile) ? profile.class_code : null

  const [pets, setPets] = useState<ClassPetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!classCode) {
      setLoading(false)
      setError('未登录教师账号')
      return
    }
    let mounted = true
    setLoading(true)
    api.getClassPets(classCode)
      .then((data) => {
        if (!mounted) return
        setPets(data)
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
  }, [classCode])

  const signals = pets.filter((g) => g.pet.needs_care)
  const sorted = [...pets].sort((a, b) => (a.pet.state === 'gray' ? -1 : 1) - (b.pet.state === 'gray' ? -1 : 1))

  if (loading) {
    return <div className="py-20 text-center text-ink-soft">成长档案加载中…</div>
  }

  if (error) {
    return <div className="py-20 text-center text-red-500">{error}</div>
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-ink md:text-3xl">成长档案</h1>
          <p className="mt-2 text-sm text-ink-soft">电子宠物状态与心理信号，一眼掌握每个孩子</p>
        </div>
        <span className="tag bg-warm-soft text-warm-deep">
          <Icon name="eye" size={13} />
          {signals.length} 位同学需要关注
        </span>
      </div>

      {signals.length > 0 && (
        <div className="card mt-6 border-warm/40 bg-warm-soft/50 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-warm-deep">
            <Icon name="heart" size={16} />
            本周心理信号
          </p>
          <ul className="mt-3 space-y-2">
            {signals.map((g) => (
              <li key={g.student_id} className="flex items-start gap-2.5 text-[13.5px] leading-6 text-ink">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warm" />
                <span>
                  <b>{g.name}</b>：近期状态需要老师多留意
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {sorted.map((g, i) => {
          const conf = stateConf[g.pet.state]
          return (
            <div key={g.student_id} className="card card-hover p-5 animate-rise" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={g.pet.state === 'gray' ? 'opacity-80' : conf.animate}>
                    <PixelArt map={petMap} palette={statePalette[g.pet.state]} size={64} title={`${g.name} 的像素小宠物`} />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-black text-ink">{g.name}</p>
                    <span className={`tag !text-[11px] ${conf.tag}`}>{conf.label}</span>
                    {g.pet.needs_care && (
                      <span className="tag !text-[11px] bg-red-50 text-red-500">
                        <Icon name="eye" size={11} />
                        需关注
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    成长值：{g.pet.growth_value} · 阶段：Lv.{g.pet.stage}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="overflow-hidden rounded-xl" style={{ width: 28, height: 28 }}>
                      <KidAvatar avatarSeed={g.avatar_seed} size={28} />
                    </span>
                    <span className="text-xs text-ink-soft">最近谈心：{g.name} 状态为 {conf.label}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
