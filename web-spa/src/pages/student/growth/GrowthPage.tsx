import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getSession, isStudentProfile } from '@/stores/session'

import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { PetSprite } from '@/components/art/PetSprite'
import { KidAvatar } from '@/components/art/KidAvatar'
import { students as mockStudents } from '@/mocks/data'
import type { PetState } from '@/mocks/data'
import type { PetSpecies } from '@/components/art'

const stateLabel: Record<PetState, string> = {
  daily: '日常',
  gray: '需要关心',
  cheer: '开心',
}

/** 理想为空时的展示文案 */
const IDEAL_PLACEHOLDER = '还在悄悄发芽…'
function displayIdeal(ideal: string | null): string {
  return ideal && ideal.trim() ? ideal : IDEAL_PLACEHOLDER
}

/* ---------- 职业照展示板 ---------- */

type Gender = 'boy' | 'girl'

/** 按学生姓名末字推断性别（中文常见男女用字规则） */
function inferGender(name: string): Gender {
  // 取名字最后一个汉字作为判断依据
  const last = name.trim().slice(-1)
  const boyChars = ['军', '虎', '杰', '阳', '龙', '强', '伟', '明', '豪', '刚', '健', '帅', '峰', '宇', '晨', '浩', '博', '轩', '涛', '磊', '鹏', '辉', '凯']
  const girlChars = ['雅', '花', '雨', '雪', '美', '娟', '丽', '芳', '娜', '敏', '婷', '静', '洁', '梦', '欣', '悦', '颖', '瑶', '倩', '莹', '蕾', '嘉', '蕊']
  if (boyChars.includes(last)) return 'boy'
  if (girlChars.includes(last)) return 'girl'
  // 含"小"且倒数第二字可判断时，用倒数第二字
  if (name.length >= 2 && name.slice(-2, -1) === '小') {
    const prev = name.slice(-2, -1)
    if (boyChars.includes(prev)) return 'boy'
    if (girlChars.includes(prev)) return 'girl'
  }
  return 'girl' // 默认按女孩处理，若不符用户可通过切换按钮调整
}

/** 根据梦想职业生成漫画风格提示词（中文场景 + 可爱卡通风） */
function buildCareerPrompt(ideal: string, gender: Gender, name: string): string {
  const text = ideal.trim()
  const genderText = gender === 'boy' ? '小男孩' : '小女孩'

  // 职业形象描述
  const careerScenes: { keywords: string[]; desc: string }[] = [
    { keywords: ['蛋糕', '烘焙', '面包', '甜点'], desc: '穿着白色厨师服和厨师帽，手拿打蛋器，面前摆着彩色纸杯蛋糕' },
    { keywords: ['军人', '解放', '当兵', '部队', '站岗'], desc: '穿着迷彩服，敬礼姿势，背景是飘扬的红旗' },
    { keywords: ['警察', '警官', '民警', '公安'], desc: '穿着警察制服，戴警帽，微笑挥手' },
    { keywords: ['消防', '灭火'], desc: '穿着橙色消防服，戴头盔，手持水管' },
    { keywords: ['飞行员', '机长', '开飞机'], desc: '穿着飞行员制服，戴墨镜，背景是蓝天和飞机' },
    { keywords: ['宇航', '太空', '航天', '火箭'], desc: '穿着白色宇航服，背景是星空和火箭' },
    { keywords: ['工程师', '建筑', '修路', '造桥', '机械', '建造'], desc: '戴着黄色安全帽，手拿图纸，背景是桥梁' },
    { keywords: ['音乐', '歌手', '钢琴', '小提琴', '作曲', '唱歌', '演奏'], desc: '手持麦克风或乐器，舞台灯光' },
    { keywords: ['运动员', '跑步', '足球', '篮球', '奥运', '冠军', '体育'], desc: '穿着运动服，胸前挂着金牌，跑步姿势' },
    { keywords: ['作家', '写作', '作者', '小说', '诗人', '写书', '写故事'], desc: '坐在书桌前，手拿钢笔，旁边堆满书本' },
    { keywords: ['科学', '天文', '实验', '发明', '研究', '星'], desc: '穿着白大褂戴眼镜，手持试管，背景是星空' },
    { keywords: ['老师', '教师', '教书'], desc: '站在讲台前，手拿课本和粉笔' },
    { keywords: ['医生', '护士', '治病', '救人'], desc: '穿着白大褂，挂着听诊器，微笑' },
    { keywords: ['画', '美术', '艺术'], desc: '戴着贝雷帽，手拿画笔和调色盘，背景是彩色画作' },
  ]

  let scene = '穿着职业服装，自信微笑' // 兜底描述
  for (const c of careerScenes) {
    if (c.keywords.some((kw) => text.includes(kw))) {
      scene = c.desc
      break
    }
  }

  return `可爱版漫画风格，${genderText}形象，名字叫${name}，梦想成为${text}：${scene}。明亮温暖色调，简洁卡通线条，柔和光影，治愈系插画，适合儿童读物，正面构图，高画质`
}

/** 职业照展示板：AI 生成可爱漫画风格职业照 + 性别切换 + 宣传标语 */
function CareerPortraitBoard({ studentName, ideal }: { studentName: string; ideal: string | null }) {
  const idealText = ideal?.trim() ?? ''
  const [gender, setGender] = useState<Gender>(() => inferGender(studentName))
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const prompt = useMemo(
    () => (idealText ? buildCareerPrompt(idealText, gender, studentName) : ''),
    [idealText, gender, studentName],
  )

  const imageUrl = useMemo(() => {
    if (!prompt) return ''
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3`
  }, [prompt])

  // 切换性别或梦想变化时重置加载状态
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [imageUrl])

  const hasIdeal = idealText.length > 0
  const genderLabel = gender === 'boy' ? '男孩' : '女孩'

  return (
    <div className="card flex flex-col gap-3 p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <Icon name="sparkles" size={16} className="text-brand" />
        梦想职业照
        <span className="ml-auto text-xs font-normal text-ink-faint">AI 漫画风格</span>
      </p>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line bg-grape-soft/30">
        {!hasIdeal ? (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-ink-faint">
            梦想还在悄悄发芽，等你说出来再画给你看 ✨
          </div>
        ) : imageError ? (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-ink-faint">
            职业照生成失败，请稍后再试
          </div>
        ) : (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-faint">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  正在为你画{genderLabel}版{idealText}形象…
                </span>
              </div>
            )}
            {imageUrl && (
              <img
                src={imageUrl}
                alt={`${studentName}的${idealText}梦想职业照`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={`h-full w-full object-cover transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            )}
          </>
        )}
      </div>

      {/* 切换按钮：左下角对齐，性别不匹配时可手动切换 */}
      <div className="flex w-full">
        <button
          type="button"
          onClick={() => setGender((g) => (g === 'boy' ? 'girl' : 'boy'))}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm transition-colors hover:border-brand hover:text-brand"
          title="性别不匹配？点击切换男孩/女孩形象"
        >
          <Icon name="sparkles" size={12} />
          切换为{gender === 'boy' ? '女孩' : '男孩'}形象
        </button>
      </div>

      {/* 底部宣传标语（灰色字体） */}
      <p className="text-center text-xs text-ink-faint">小小的梦想，大大的希望</p>
    </div>
  )
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

type StudentBrief = {
  id: string
  name: string
  grade: string
  region_name?: string
  avatar_seed: number
}

type GrowthViewProps = {
  student: StudentBrief
  growth: GrowthData
  ledger: LedgerItem[]
  backLink: { to: string; label: string }
  heading?: { title: string; subtitle: string }
  /** 教师端隐藏学生专属入口 */
  hideStudentCTA?: boolean
}

export function GrowthView({ student, growth, ledger, backLink, heading, hideStudentCTA }: GrowthViewProps) {
  const state = growth.pet.state
  const chatHistory = (growth.history as ChatItem[] | undefined) ?? []

  return (
    <div className="relative mx-auto w-full max-w-[1760px] px-6 py-8 lg:px-10">
      <img
        src="/design/leaves.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-2 hidden w-64 opacity-60 xl:block"
      />
      <Link
        to={backLink.to}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand"
      >
        <Icon name="arrow-left" size={16} />
        {backLink.label}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cal text-5xl tracking-[0.1em] text-brand-deep">
            {heading?.title ?? '我的成长档案'}
          </h1>
          <p className="mt-3 text-[15px] text-ink-soft">
            {heading?.subtitle ?? '每一次谈心、每一个承诺，都在这里好好保存着。'}
          </p>
        </div>
        {!hideStudentCTA && (
          <Link to="/student/letters" className="btn-line !px-5 !py-2.5 text-sm">
            <Icon name="letter" size={16} />
            我的信箱
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
              1
            </span>
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
        {/* 学生卡 + 统计 */}
        <div className="flex flex-col gap-5">
          <div className="card flex flex-col items-center gap-3 p-6 text-center">
            <span
              className="overflow-hidden rounded-xl border-4 border-brand-soft"
              style={{ width: 104, height: 104 }}
            >
              <KidAvatar avatarSeed={student.avatar_seed} size={104} />
            </span>
            <div>
              <p className="text-xl font-black text-ink">{student.name}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {student.grade} · {student.region_name ?? '龙头山镇中心小学'}
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

          {/* 梦想职业照展示板（成长值下方预占位） */}
          <CareerPortraitBoard studentName={student.name} ideal={growth.ideal} />
        </div>

        {/* 电子宠物 */}
        <div className="flex flex-col gap-5">
          <div className="card flex flex-col items-center gap-4 bg-gradient-to-b from-grape-soft/60 to-white p-7 text-center">
            <p className="w-full text-left text-sm font-bold text-ink">我的电子宠物</p>
            <span className="rounded-xl border-2 border-dashed border-grape/30 bg-white/70 px-6 py-4 animate-floaty">
              <PetSprite
                species={(growth.pet.species as PetSpecies) ?? 'sprout'}
                state={state}
                size={185}
                title={`${displayIdeal(growth.ideal)} · 小信伙伴`}
              />
            </span>
            <span className="tag bg-grape-soft text-grape">
              {displayIdeal(growth.ideal)} · {student.name}
            </span>
            <div className="mt-1 flex w-full items-center justify-between rounded-lg border border-line bg-white/80 px-4 py-3">
              <span className="flex items-center gap-2.5">
                <PetSprite species={(growth.pet.species as PetSpecies) ?? 'sprout'} state={state} size={40} title="小信伙伴" />
                <span className="text-left">
                  <span className="block text-sm font-bold text-ink">{displayIdeal(growth.ideal)}小宠物</span>
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
            {chatHistory.length === 0 ? (
              <p className="mt-4 text-sm text-ink-faint">暂无谈心记录</p>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function useGrowthFetcher(studentId: string | null | undefined) {
  const [growth, setGrowth] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ledger, setLedger] = useState<LedgerItem[]>([])

  useEffect(() => {
    if (!studentId) {
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    api
      .getGrowth(studentId)
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

  return { growth, loading, error, ledger }
}

export function GrowthPage() {
  const { profile } = getSession()
  const studentId = profile && isStudentProfile(profile) ? profile.id : null
  const { growth, loading, error, ledger } = useGrowthFetcher(studentId)

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

  return (
    <GrowthView
      student={profile}
      growth={growth}
      ledger={ledger}
      backLink={{ to: '/student', label: '返回主页' }}
    />
  )
}

/** 教师端查看的某个学生成长档案详情页 */
export function TeacherStudentGrowthPage() {
  const params = useParams<{ studentId?: string }>()
  const studentId = params.studentId ?? null
  const { growth, loading, error, ledger } = useGrowthFetcher(studentId)
  const student = studentId ? (mockStudents.find((s) => s.id === studentId) ?? null) : null

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1760px] px-6 py-20 text-center text-ink-soft lg:px-10">
        成长档案加载中…
      </div>
    )
  }

  if (error || !growth || !student) {
    return (
      <div className="mx-auto w-full max-w-[1760px] px-6 py-20 text-center text-red-500 lg:px-10">
        {error ?? '未找到该学生'}
      </div>
    )
  }

  const brief: StudentBrief = {
    id: student.id,
    name: student.name,
    grade: student.grade,
    region_name: '龙头山镇中心小学',
    avatar_seed: student.avatar_seed,
  }

  return (
    <GrowthView
      student={brief}
      growth={growth}
      ledger={ledger}
      backLink={{ to: '/teacher/growth', label: '返回班级成长档案' }}
      heading={{
        title: `${student.name} · 成长档案`,
        subtitle: '站在老师的视角，看看这颗心在悄悄长大。',
      }}
      hideStudentCTA
    />
  )
}
