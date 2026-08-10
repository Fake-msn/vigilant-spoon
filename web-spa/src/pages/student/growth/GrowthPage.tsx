import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getSession, isStudentProfile, setSession } from '@/stores/session'

import { api } from '@/api/client'
import { Icon } from '@/components/Icon'
import { StudentLogoutButton } from '@/components/StudentLogoutButton'
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

type PortraitStyle = 'cartoon' | 'realistic'

/** 根据梦想职业生成提示词（支持漫画风格和写实风格） */
function buildCareerPrompt(ideal: string, gender: Gender, name: string, style: PortraitStyle, hasCustomAvatar: boolean): string {
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

  if (style === 'realistic') {
    const avatarHint = hasCustomAvatar
      ? '，依据用户上传的真实头像照片，生成具有匹配面容的写实人像'
      : ''
    return `写实摄影风格，${genderText}形象，名字叫${name}，梦想成为${text}：${scene}。真实人像，专业摄影，自然光影，高细节，8K画质，正面构图${avatarHint}`
  }

  return `可爱版漫画风格，${genderText}形象，名字叫${name}，梦想成为${text}：${scene}。明亮温暖色调，简洁卡通线条，柔和光影，治愈系插画，适合儿童读物，正面构图，高画质`
}

/** 职业照展示板：AI 生成职业照 + 漫画/写实风格切换 + 性别切换 */
function CareerPortraitBoard({ studentName, ideal, customAvatarUrl }: { studentName: string; ideal: string | null; customAvatarUrl?: string | null }) {
  const idealText = ideal?.trim() ?? ''
  const [gender, setGender] = useState<Gender>(() => inferGender(studentName))
  const [portraitStyle, setPortraitStyle] = useState<PortraitStyle>('cartoon')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const hasCustomAvatar = !!customAvatarUrl

  const prompt = useMemo(
    () => (idealText ? buildCareerPrompt(idealText, gender, studentName, portraitStyle, hasCustomAvatar) : ''),
    [idealText, gender, studentName, portraitStyle, hasCustomAvatar],
  )

  const imageUrl = useMemo(() => {
    if (!prompt) return ''
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_4_3`
  }, [prompt])

  // 切换性别/风格或梦想变化时重置加载状态
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [imageUrl])

  const hasIdeal = idealText.length > 0
  const genderLabel = gender === 'boy' ? '男孩' : '女孩'
  const styleLabel = portraitStyle === 'cartoon' ? '漫画' : '写实'

  return (
    <div className="card flex flex-col gap-3 p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <Icon name="sparkles" size={16} className="text-brand" />
        梦想职业照
        <span className="ml-auto text-xs font-normal text-ink-faint">AI {styleLabel}风格</span>
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
                  正在为你画{styleLabel}风{genderLabel}版{idealText}形象…
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

      {/* 切换按钮：性别切换 + 写实/漫画风格切换，同一行 */}
      <div className="flex w-full flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setGender((g) => (g === 'boy' ? 'girl' : 'boy'))}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm transition-colors hover:border-brand hover:text-brand"
          title="性别不匹配？点击切换男孩/女孩形象"
        >
          <Icon name="sparkles" size={12} />
          切换为{gender === 'boy' ? '女孩' : '男孩'}形象
        </button>
        <button
          type="button"
          onClick={() => setPortraitStyle((s) => (s === 'cartoon' ? 'realistic' : 'cartoon'))}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
            portraitStyle === 'realistic'
              ? 'border-brand bg-brand-soft text-brand-deep'
              : 'border-line bg-white/90 text-ink-soft hover:border-brand hover:text-brand'
          }`}
          title="切换写实/漫画风格"
        >
          <Icon name="sparkles" size={12} />
          {portraitStyle === 'cartoon' ? '写实风格' : '漫画风格'}
        </button>
        {hasCustomAvatar && portraitStyle === 'realistic' && (
          <span className="text-[11px] font-medium text-brand-deep">已根据上传头像生成</span>
        )}
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
  custom_avatar_url?: string | null
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

type CommitmentRow = { id: string; text: string; created_at: string; status: 'active' | 'fulfilled' | 'expired' }

/* ---------- 完成承诺时的正向激励动画（烟花 + 字幕放大 2 秒） ---------- */

type Spark = {
  id: number
  x: number // 0~1 相对屏幕中心的偏移基准
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number // ms 剩余生命
}

const FIREWORK_COLORS = ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF', '#C86BFF', '#FF9F43', '#00D9C0', '#FF4D6D']

function CelebrationOverlay({ pulse }: { pulse: number }) {
  const [sparks, setSparks] = useState<Spark[]>([])
  const [phase, setPhase] = useState<0 | 1 | 2>(0) // 0=idle 1=字幕放大 2=淡出
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const last = useRef(0)

  // pulse: 每次增加触发一次
  useEffect(() => {
    if (pulse === 0 || pulse === last.current) return
    last.current = pulse
    setPhase(1)

    // 放 2 组烟花：屏幕中心偏左上 & 偏右下
    const bursts: { cx: number; cy: number }[] = [
      { cx: 0.35, cy: 0.42 },
      { cx: 0.68, cy: 0.52 },
      { cx: 0.5, cy: 0.3 },
    ]
    const created: Spark[] = []
    let nextId = 0
    for (const burst of bursts) {
      const count = 32
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2
        const speed = 0.55 + Math.random() * 0.65
        created.push({
          id: nextId++,
          x: burst.cx,
          y: burst.cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
          size: 5 + Math.floor(Math.random() * 5),
          life: 1300 + Math.floor(Math.random() * 500),
        })
      }
    }
    setSparks(created)

    // 2 秒正片结束 → 淡出 300ms
    const t1 = window.setTimeout(() => setPhase(2), 2000)
    const t2 = window.setTimeout(() => {
      setPhase(0)
      setSparks([])
    }, 2400)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [pulse])

  // 烟花粒子帧驱动：用 ref 持有 sparks 避免每帧触发 re-render 的 effect 重启
  const sparksRef = useRef<Spark[]>([])
  sparksRef.current = sparks
  useEffect(() => {
    if (sparks.length === 0) return
    let raf = 0
    let lastFrame = performance.now()
    const step = (now: number) => {
      const dt = Math.min(64, now - lastFrame)
      lastFrame = now
      const updated = sparksRef.current
        .map((s) => ({
          ...s,
          x: s.x + s.vx * dt * 0.0008,
          y: s.y + s.vy * dt * 0.0008 + 0.00035 * (dt / 16), // 重力
          vy: s.vy + 0.00008 * dt,
          life: s.life - dt,
        }))
        .filter((s) => s.life > 0)
      sparksRef.current = updated
      setSparks(updated)
      if (updated.length > 0) {
        raf = requestAnimationFrame(step)
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // 仅依赖 sparks 是否为空（boolean），避免每帧重启
  }, [sparks.length > 0])

  if (phase === 0) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      ref={canvasRef}
      style={{ opacity: phase === 2 ? 0 : 1, transition: 'opacity 300ms ease-out' }}
    >
      {/* 烟花粒子 */}
      {sparks.map((s) => {
        const opacity = Math.max(0, Math.min(1, s.life / 1200))
        return (
          <span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              width: s.size,
              height: s.size,
              background: s.color,
              boxShadow: `0 0 ${s.size * 1.6}px ${s.color}`,
              opacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )
      })}

      {/* 字幕："你真的做到了，太棒啦！"，2 秒内从中心放大到屏幕 1/4 宽 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="select-none rounded-3xl bg-gradient-to-br from-white/95 via-amber-50/95 to-rose-50/95 px-10 py-6 text-center shadow-2xl ring-1 ring-amber-200/60 backdrop-blur"
          style={{
            animation: 'commit-celebrate 2000ms cubic-bezier(0.2, 0.9, 0.25, 1.05) both',
            maxWidth: 'min(90vw, 900px)',
          }}
        >
          <p
            className="font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 drop-shadow-sm"
            style={{
              animation: 'commit-celebrate-inner 2000ms cubic-bezier(0.2, 0.9, 0.25, 1.05) both',
              // 以 25vw 作为最终大小，保证约为屏幕 1/4 宽度（横向）
              fontSize: 'clamp(20px, 25vw, 96px)',
              lineHeight: 1.1,
            }}
          >
            你真的做到了，太棒啦！
          </p>
          <p className="mt-3 text-sm font-semibold text-amber-700/80">
            ✨ 坚持的每一步，都是小信成长的养分
          </p>
        </div>
      </div>

      <style>{`
        @keyframes commit-celebrate {
          0%   { transform: scale(0.1); opacity: 0; filter: blur(8px); }
          25%  { opacity: 1; filter: blur(0); }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes commit-celebrate-inner {
          0%   { letter-spacing: -0.08em; filter: saturate(0.2); }
          40%  { filter: saturate(1.3); }
          100% { letter-spacing: 0.02em; filter: saturate(1.1); }
        }
      `}</style>
    </div>
  )
}

/* ---------- 教师端承诺编辑组件 ---------- */

function CommitmentsEditor({
  studentId,
  initial,
  onSaved,
}: {
  studentId: string
  initial: CommitmentRow[]
  onSaved: (next: CommitmentRow[]) => void
}) {
  const [rows, setRows] = useState<CommitmentRow[]>(() => initial.map((c) => ({ ...c })))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [celebratePulse, setCelebratePulse] = useState(0)

  // 父级拉取了新数据时，同步刷新本地 rows（仅当用户未编辑时）
  useEffect(() => {
    if (!dirty) {
      setRows(initial.map((c) => ({ ...c })))
    }
  }, [initial, dirty])

  const toggleStatus = (id: string) => {
    // 先从当前 rows 判断是否是 active → fulfilled（触发庆祝动画）
    const target = rows.find((r) => r.id === id)
    const willFulfill = target ? target.status !== 'fulfilled' : false

    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'fulfilled' ? 'active' : 'fulfilled' } : r,
      ),
    )
    setDirty(true)
    if (willFulfill) {
      // 每次从 active → fulfilled 时 pulse++，让 CelebrationOverlay 重新触发
      setCelebratePulse((n) => n + 1)
    }
  }

  const startEdit = (row: CommitmentRow) => {
    setEditingId(row.id)
    setDraftText(row.text)
  }
  const cancelEdit = () => {
    setEditingId(null)
    setDraftText('')
  }
  const commitEdit = () => {
    if (!editingId || !draftText.trim()) return
    setRows((prev) => prev.map((r) => (r.id === editingId ? { ...r, text: draftText.trim() } : r)))
    setDirty(true)
    setEditingId(null)
    setDraftText('')
  }

  const addRow = () => {
    const newId = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    setRows((prev) => [...prev, { id: newId, text: '', created_at: new Date().toISOString(), status: 'active' }])
    setEditingId(newId)
    setDraftText('')
    setDirty(true)
  }

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
    if (editingId === id) cancelEdit()
    setDirty(true)
  }

  const save = async () => {
    // 先把当前正在编辑的（若有）确认提交
    if (editingId && draftText.trim()) {
      setRows((prev) => prev.map((r) => (r.id === editingId ? { ...r, text: draftText.trim() } : r)))
      setEditingId(null)
    }
    // 过滤掉空文本项（新添加但没填内容的直接丢弃）
    const payload = rows.filter((r) => r.text.trim().length > 0)
    setSaving(true)
    try {
      const saved = await api.updateCommitments(studentId, payload)
      setRows(saved.map((r) => ({ ...r })))
      onSaved(saved)
      setDirty(false)
      setToast('承诺已保存，学生端将同步看到更新 ✨')
      setTimeout(() => setToast(null), 2500)
    } catch (err) {
      const detail =
        err && typeof err === 'object' && 'status' in err && 'code' in err
          ? `（HTTP ${(err as any).status} · ${(err as any).code || 'UNKNOWN'}）`
          : ''
      setToast(`保存失败：${err instanceof Error ? err.message : String(err)}${detail}，请刷新后重试`)
      setTimeout(() => setToast(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <ul className="mt-4 space-y-3">
        {rows.map((p) => {
          const isEditing = editingId === p.id
          return (
            <li key={p.id} className="group flex items-start gap-3 rounded-lg p-1 transition-colors hover:bg-brand-faint/30">
              <button
                type="button"
                onClick={() => toggleStatus(p.id)}
                aria-label={p.status === 'fulfilled' ? '取消完成' : '标记完成'}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  p.status === 'fulfilled'
                    ? 'border-mint bg-mint text-white shadow-sm'
                    : 'border-line bg-white text-transparent hover:border-brand hover:text-brand/20'
                }`}
              >
                <Icon name="check" size={13} />
              </button>
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      autoFocus
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="input-soft !py-1.5 text-sm"
                      placeholder="写下这条承诺的内容…"
                      aria-label="承诺内容编辑"
                    />
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={commitEdit}
                        className="btn-brand !px-3 !py-1.5 text-xs"
                        disabled={!draftText.trim()}
                      >
                        <Icon name="check" size={12} />
                        确定
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="btn-line !px-3 !py-1.5 text-xs"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-1">
                    <span
                      className={`flex-1 text-sm leading-6 ${
                        p.status === 'fulfilled' ? 'text-ink-faint line-through' : 'text-ink'
                      }`}
                    >
                      {p.text || <span className="italic text-ink-faint">（未填写，点击右侧铅笔编辑）</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="invisible ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-white hover:text-brand group-hover:visible"
                      title="编辑承诺内容"
                    >
                      <Icon name="pencil" size={13} />
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeRow(p.id)}
                className="invisible ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-white hover:text-red-500 group-hover:visible"
                title="删除这条承诺"
              >
                <Icon name="trash" size={13} />
              </button>
            </li>
          )
        })}
      </ul>

      {/* 操作行：新增 / 保存 / dirty 状态提示 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={addRow} className="btn-line !px-3.5 !py-1.5 text-xs">
          <Icon name="plus" size={13} />
          添加承诺
        </button>
        <button type="button" onClick={save} disabled={saving || !dirty} className="btn-brand !px-4 !py-1.5 text-xs">
          <Icon name={saving ? 'loading' : 'check'} size={13} className={saving ? 'animate-spin' : ''} />
          {saving ? '保存中…' : dirty ? '保存修改' : '已同步'}
        </button>
        {dirty && <span className="text-xs text-ink-faint">有未保存的修改</span>}
        {toast && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-brand-soft/50 px-3 py-1 text-xs font-medium text-brand-deep">
            <Icon name="sparkles" size={12} />
            {toast}
          </span>
        )}
      </div>

      {/* 完成承诺时的激励动画 */}
      <CelebrationOverlay pulse={celebratePulse} />
    </div>
  )
}

export function GrowthView({ student, growth, ledger, backLink, heading, hideStudentCTA, showLogout }: GrowthViewProps & { showLogout?: boolean }) {
  const state = growth.pet.state
  const chatHistory = (growth.history as ChatItem[] | undefined) ?? []
  const isTeacherView = !!hideStudentCTA // 教师端才有编辑权限
  const studentId = student.id
  // 当教师端保存后，更新页面上 growth.commitments 显示
  const [commitments, setCommitments] = useState<CommitmentRow[]>(() => growth.commitments.map((c) => ({ ...c })))
  useEffect(() => {
    setCommitments(growth.commitments.map((c) => ({ ...c })))
  }, [growth.commitments])

  // 自定义头像状态：初始化为学生已有的 custom_avatar_url，上传后实时更新
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(student.custom_avatar_url ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // 前端格式校验
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('仅支持 JPG、PNG、JPEG 格式')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('头像文件不能超过 2MB')
      return
    }
    setAvatarUploading(true)
    setAvatarError(null)
    try {
      const resp = await api.uploadAvatar(studentId, file)
      setCustomAvatarUrl(resp.avatar_url)
      // 同步更新 session 中的 profile（以便其他页面也能看到新头像）
      const { profile, token } = getSession()
      if (profile && isStudentProfile(profile)) {
        setSession({ token: token!, profile: { ...profile, custom_avatar_url: resp.avatar_url } })
      }
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setAvatarUploading(false)
      // 重置 input 以便再次选择同一文件
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[1760px] px-6 py-8 lg:px-10">
      <img
        src="/design/leaves.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-2 hidden w-64 opacity-60 xl:block"
      />
      {/* 顶部操作栏：返回链接 + 学生端显示退出登录按钮（教师端不显示） */}
      <div className="flex items-center justify-between">
        <Link
          to={backLink.to}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand"
        >
          <Icon name="arrow-left" size={16} />
          {backLink.label}
        </Link>
        {showLogout && <StudentLogoutButton />}
      </div>
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
            {/* 学生端：头像可点击上传自定义头像；教师端：仅展示 */}
            <input
              ref={avatarInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <div
              className={`group relative ${!isTeacherView ? 'cursor-pointer' : ''}`}
              onClick={() => !isTeacherView && !avatarUploading && avatarInputRef.current?.click()}
              title={!isTeacherView ? '点击头像，上传新自定义头像' : undefined}
            >
              <span
                className="block overflow-hidden rounded-xl border-4 border-brand-soft transition-shadow"
                style={{ width: 104, height: 104 }}
              >
                <KidAvatar avatarSeed={student.avatar_seed} size={104} customAvatarUrl={customAvatarUrl} />
              </span>
              {/* 悬停提示（仅学生端） */}
              {!isTeacherView && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 text-center text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {avatarUploading ? '上传中…' : '点击上传头像'}
                </span>
              )}
              {/* 上传中遮罩 */}
              {avatarUploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                </span>
              )}
            </div>
            {avatarError && (
              <p className="text-xs text-red-500">{avatarError}</p>
            )}
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
          <CareerPortraitBoard studentName={student.name} ideal={growth.ideal} customAvatarUrl={customAvatarUrl} />
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
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
              <Icon name="target" size={16} className="text-brand" />
              我的承诺
              {isTeacherView && (
                <span className="inline-flex items-center gap-1 rounded-full border border-brand-soft bg-brand-soft/40 px-2.5 py-0.5 text-[10px] font-medium text-brand-deep">
                  <Icon name="pencil" size={11} />
                  教师编辑模式
                </span>
              )}
            </p>
            {isTeacherView ? (
              <CommitmentsEditor
                studentId={studentId}
                initial={commitments}
                onSaved={(next) => setCommitments(next)}
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {commitments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        p.status === 'fulfilled'
                          ? 'border-mint bg-mint text-white'
                          : 'border-line bg-white text-transparent'
                      }`}
                    >
                      <Icon name="check" size={13} />
                    </span>
                    <span
                      className={`text-sm leading-6 ${
                        p.status === 'fulfilled' ? 'text-ink-faint line-through' : 'text-ink'
                      }`}
                    >
                      {p.text}
                    </span>
                  </li>
                ))}
                {commitments.length === 0 && (
                  <p className="mt-4 text-sm text-ink-faint">还没有承诺内容</p>
                )}
              </ul>
            )}
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
      showLogout
    />
  )
}

/** 教师端查看的某个学生成长档案详情页 */
export function TeacherStudentGrowthPage() {
  const params = useParams<{ studentId?: string }>()
  const studentId = params.studentId ?? null
  const { growth, loading, error, ledger } = useGrowthFetcher(studentId)
  // 优先从 mockStudents 取学生完整信息；找不到时用 studentId 推断一个最小可用 brief，避免真实班级学生被错误拦在"未找到该学生"
  const matchedStudent = studentId ? mockStudents.find((s) => s.id === studentId) ?? null : null
  const displayName = matchedStudent?.name ?? studentId ? (() => {
    // 兜底显示：用 session profile 中的该学生信息 或 class pets 列表；这里简单显示带 studentId 的友好名
    const { profile } = getSession()
    return profile?.role === 'teacher' && profile?.class_code
      ? `学生 ${studentId}`
      : `学生 ${studentId}`
  })() : null

  const brief: StudentBrief | null =
    matchedStudent
      ? {
          id: matchedStudent.id,
          name: matchedStudent.name,
          grade: matchedStudent.grade,
          region_name: matchedStudent.region_name ?? '龙头山镇中心小学',
          avatar_seed: matchedStudent.avatar_seed,
        }
      : studentId && growth
        ? {
            id: studentId,
            name: displayName || `学生 ${studentId}`,
            grade: '',
            region_name: '龙头山镇中心小学',
            avatar_seed: `student_${studentId}`,
          }
        : null

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1760px] px-6 py-20 text-center text-ink-soft lg:px-10">
        成长档案加载中…
      </div>
    )
  }

  if (error || !growth || !brief) {
    return (
      <div className="mx-auto w-full max-w-[1760px] px-6 py-20 text-center text-red-500 lg:px-10">
        {error ?? '未找到该学生'}
      </div>
    )
  }

  return (
    <GrowthView
      student={brief}
      growth={growth}
      ledger={ledger}
      backLink={{ to: '/teacher/growth', label: '返回班级成长档案' }}
      heading={{
        title: `${brief.name} · 成长档案`,
        subtitle: '站在老师的视角，看看这颗心在悄悄长大。',
      }}
      hideStudentCTA
    />
  )
}
