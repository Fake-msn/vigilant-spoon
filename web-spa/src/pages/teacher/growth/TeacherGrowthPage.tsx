import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSession, isStudentProfile } from '@/stores/session'
import { api } from '@/api/client'
import type { PetState } from '@/mocks/data'
import { Icon } from '@/components/Icon'
import { PetSprite } from '@/components/art/PetSprite'
import { KidAvatar } from '@/components/art/KidAvatar'
import type { PetSpecies } from '@/components/art'

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

type PointRule = {
  rule_id: string
  name: string
  points: number
  category: string | null
  enabled: boolean
}

type GroupItem = {
  group_id: string
  group_name: string
  color: string | null
  members: string[]
}

type LeaderboardItem = {
  group_id: string
  group_name: string
  color: string | null
  total_points: number
  member_count: number
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

  // 设置与帮助弹窗
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'rules' | 'groups' | 'leaderboard'>('rules')
  const [rules, setRules] = useState<PointRule[]>([])
  const [draftRules, setDraftRules] = useState<PointRule[]>([])
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [groupInput, setGroupInput] = useState('')
  const [groupAssignments, setGroupAssignments] = useState<Record<string, string>>({})
  const [newRuleName, setNewRuleName] = useState('')
  const [newRulePoints, setNewRulePoints] = useState('')
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!showSettings || !classCode) return
    let mounted = true
    setSettingsMsg(null)
    Promise.all([api.getPointRules(classCode), api.getGroups(classCode), api.getLeaderboard(classCode)])
      .then(([r, g, lb]) => {
        if (!mounted) return
        setRules(r)
        setDraftRules(r)
        setGroups(g)
        setLeaderboard(lb.items)
        const assignments: Record<string, string> = {}
        for (const group of g) {
          for (const sid of group.members) assignments[sid] = group.group_id
        }
        setGroupAssignments(assignments)
      })
      .catch((err) => {
        if (mounted) setSettingsMsg(err instanceof Error ? err.message : '加载失败')
      })
    return () => {
      mounted = false
    }
  }, [showSettings, classCode])

  const saveRules = async () => {
    if (!classCode) return
    setSaving(true)
    setSettingsMsg(null)
    try {
      const updated = await api.updatePointRules(
        classCode,
        draftRules.map((r) => ({ rule_id: r.rule_id, name: r.name, points: r.points, category: r.category, enabled: r.enabled })),
      )
      setRules(updated)
      setDraftRules(updated)
      setSettingsMsg('规则已保存')
    } catch (err) {
      setSettingsMsg(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const addRule = () => {
    const name = newRuleName.trim()
    const points = Number(newRulePoints)
    if (!name || !Number.isFinite(points) || points <= 0) {
      setSettingsMsg('请输入有效的规则名与积分')
      return
    }
    setDraftRules((prev) => [...prev, { rule_id: `temp-${Date.now()}`, name, points, category: null, enabled: true }])
    setNewRuleName('')
    setNewRulePoints('')
    setSettingsMsg(null)
  }

  const removeRule = (ruleId: string) => {
    setDraftRules((prev) => prev.filter((r) => r.rule_id !== ruleId))
  }

  const addGroup = () => {
    const name = groupInput.trim()
    if (!name) {
      setSettingsMsg('请输入小组名')
      return
    }
    setGroups((prev) => [...prev, { group_id: `temp-${Date.now()}`, group_name: name, color: null, members: [] }])
    setGroupInput('')
    setSettingsMsg(null)
  }

  const saveGroups = async () => {
    if (!classCode) return
    setSaving(true)
    setSettingsMsg(null)
    try {
      const updated = await api.configGroups(classCode, groups, groupAssignments)
      setGroups(updated)
      setSettingsMsg('小组已保存')
    } catch (err) {
      setSettingsMsg(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

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
        <button onClick={() => setShowSettings(true)} className="btn-line !px-4 !py-2 text-xs">
          <Icon name="settings" size={14} />
          设置与帮助
        </button>
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
            <Link
              key={g.student_id}
              to={`/teacher/growth/${g.student_id}`}
              className="card card-hover p-5 animate-rise block no-underline text-ink"
              style={{ animationDelay: `${i * 0.05}s` }}
              title={`查看 ${g.name} 的成长档案`}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5">
                  <span className={g.pet.state === 'gray' ? 'opacity-80' : conf.animate}>
                    <PetSprite species={(g.pet.species as PetSpecies) ?? 'sprout'} state={g.pet.state} size={64} title={`${g.name} 的电子宠物`} />
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
            </Link>
          )
        })}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setShowSettings(false)}>
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-black text-ink">
                <Icon name="settings" size={18} />
                设置与帮助
              </h2>
              <button onClick={() => setShowSettings(false)} className="btn-line !px-3 !py-1.5 text-xs" aria-label="关闭">
                <Icon name="arrow-left" size={14} />
                关闭
              </button>
            </div>

            <div className="flex gap-2 border-b border-ink/10 px-5 pt-4">
              {(
                [
                  ['rules', '规则'],
                  ['groups', '小组'],
                  ['leaderboard', '排行榜'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSettingsTab(key)}
                  className={`rounded-t-lg px-4 py-2 text-sm font-bold ${
                    settingsTab === key ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:bg-ink/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-sm">
              {settingsMsg && <p className="mb-3 rounded-lg bg-warm-soft/60 px-3 py-2 text-[13px] text-warm-deep">{settingsMsg}</p>}

              {settingsTab === 'rules' && (
                <div className="space-y-3">
                  <p className="text-xs text-ink-soft">已保存规则 {rules.length} 条，编辑后请点击保存生效</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="规则名称"
                      className="input-soft flex-1 min-w-[140px]"
                    />
                    <input
                      value={newRulePoints}
                      onChange={(e) => setNewRulePoints(e.target.value)}
                      placeholder="积分"
                      type="number"
                      className="input-soft w-24"
                    />
                    <button onClick={addRule} className="btn-brand !px-4 !py-2 text-xs">
                      <Icon name="plus" size={14} />
                      新增
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {draftRules.map((r) => (
                      <li key={r.rule_id} className="flex items-center gap-3 rounded-xl bg-ink/5 px-4 py-2.5">
                        <span className="min-w-0 flex-1 truncate font-bold text-ink">{r.name}</span>
                        <span className="tag !text-[11px] bg-brand-soft text-brand">{r.points} 分</span>
                        <span className={`tag !text-[11px] ${r.enabled ? 'bg-mint-soft text-mint' : 'bg-slate-100 text-ink-faint'}`}>
                          {r.enabled ? '启用' : '停用'}
                        </span>
                        <button
                          onClick={() => removeRule(r.rule_id)}
                          className="btn-line !px-2.5 !py-1.5 text-xs text-red-500"
                          aria-label="删除规则"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </li>
                    ))}
                    {draftRules.length === 0 && <p className="py-6 text-center text-ink-faint">暂无规则</p>}
                  </ul>
                  <button onClick={saveRules} disabled={saving} className="btn-brand w-full !py-2.5 text-sm">
                    {saving ? '保存中…' : '保存规则'}
                  </button>
                </div>
              )}

              {settingsTab === 'groups' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={groupInput}
                      onChange={(e) => setGroupInput(e.target.value)}
                      placeholder="新小组名"
                      className="input-soft flex-1 min-w-[140px]"
                    />
                    <button onClick={addGroup} className="btn-brand !px-4 !py-2 text-xs">
                      <Icon name="plus" size={14} />
                      添加小组
                    </button>
                  </div>

                  {groups.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {groups.map((g) => (
                        <span key={g.group_id} className="tag bg-brand-soft text-brand">
                          {g.group_name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-bold text-ink-soft">为每位同学分配小组</p>
                    <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {pets.map((p) => (
                        <li key={p.student_id} className="flex items-center justify-between gap-3 rounded-lg bg-ink/5 px-3 py-2">
                          <span className="truncate text-[13px] font-bold text-ink">{p.name}</span>
                          <select
                            value={groupAssignments[p.student_id] ?? ''}
                            onChange={(e) =>
                              setGroupAssignments((prev) => ({ ...prev, [p.student_id]: e.target.value }))
                            }
                            className="input-soft w-36 text-xs"
                          >
                            <option value="">未分组</option>
                            {groups.map((g) => (
                              <option key={g.group_id} value={g.group_id}>
                                {g.group_name}
                              </option>
                            ))}
                          </select>
                        </li>
                      ))}
                      {pets.length === 0 && <p className="py-4 text-center text-ink-faint">暂无可分配的同学</p>}
                    </ul>
                  </div>

                  <button onClick={saveGroups} disabled={saving} className="btn-brand w-full !py-2.5 text-sm">
                    {saving ? '保存中…' : '保存小组'}
                  </button>
                </div>
              )}

              {settingsTab === 'leaderboard' && (
                <div>
                  <p className="mb-3 text-xs text-ink-soft">按小组总积分降序排列</p>
                  <ul className="space-y-2">
                    {[...leaderboard]
                      .sort((a, b) => b.total_points - a.total_points)
                      .map((item, i) => (
                        <li key={item.group_id} className="flex items-center gap-3 rounded-xl bg-ink/5 px-4 py-3">
                          <span className="w-6 text-center text-sm font-black text-brand">{i + 1}</span>
                          <span className="min-w-0 flex-1 truncate font-bold text-ink">{item.group_name}</span>
                          <span className="text-xs text-ink-soft">{item.member_count} 人</span>
                          <span className="tag !text-[11px] bg-brand-soft text-brand">{item.total_points} 分</span>
                        </li>
                      ))}
                    {leaderboard.length === 0 && <p className="py-6 text-center text-ink-faint">暂无排行榜数据</p>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
