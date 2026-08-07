import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { getAdminToken, setAdminToken, type KnowledgeDoc, type PendingTeacher, type ServiceConfig } from '@/api/client'
import { Icon } from '@/components/Icon'

const EMPTY_CONFIG: ServiceConfig = {
  voice_provider: 'local',
  dashscope_api_key: '',
  dashscope_realtime_url: '',
  voice_model: '',
  text_provider: 'template',
  text_model: '',
  text_base_url: '',
  text_api_key: '',
  image_provider: 'placeholder',
  image_model: '',
  image_base_url: '',
  image_api_key: '',
  embed_provider: 'disabled',
  embed_model: '',
  embed_base_url: '',
  embed_api_key: '',
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-4 text-ink-faint">{hint}</span> : null}
    </label>
  )
}

function Section({
  index,
  title,
  desc,
  children,
}: {
  index: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <section className="card p-6 md:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-sm font-bold">
          {index}
        </span>
        <div>
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <p className="text-[12px] text-ink-soft">{desc}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function LoginPanel({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!password) return
    setLoading(true)
    setError('')
    try {
      await api.adminLogin(password)
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card p-8 animate-rise">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="settings" size={28} />
          </span>
          <h1 className="text-2xl font-bold text-ink">管理员登录</h1>
          <p className="text-sm text-ink-soft">输入管理员密码以配置模型服务</p>
        </div>
        <div className="mt-6">
          <Field label="管理员密码">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="请输入密码"
              autoFocus
              className="input-soft"
            />
          </Field>
          {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
          <button onClick={submit} disabled={!password || loading} className="btn-brand mt-5 w-full !py-3">
            {loading ? '登录中…' : '登 录'}
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function TeacherReviewSection() {
  const [pending, setPending] = useState<PendingTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await api.getPendingTeachers()
      setPending(resp.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载待审教师失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const approve = async (item: PendingTeacher) => {
    setError('')
    try {
      const resp = await api.reviewTeacher(item.teacher_id, { approve: true })
      setPending(resp.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败')
    }
  }

  const reject = async (item: PendingTeacher) => {
    setError('')
    setRejecting(item.teacher_id)
    try {
      const resp = await api.reviewTeacher(item.teacher_id, {
        approve: false,
        reject_reason: rejectReason.trim() || undefined,
      })
      setPending(resp.items)
      setRejectReason('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setRejecting(null)
    }
  }

  return (
    <section className="card p-6 md:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-sm font-bold">★</span>
        <div>
          <h2 className="text-base font-bold text-ink">教师注册审批</h2>
          <p className="text-[12px] text-ink-soft">新注册的教师账号需通过审核后方可登录班级</p>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-ink-soft">加载待审教师中…</p>
        ) : pending.length === 0 ? (
          <p className="rounded-xl bg-brand-soft/50 px-4 py-6 text-center text-sm text-ink-soft">
            暂无待审核的教师注册
          </p>
        ) : (
          <div className="space-y-3">
            {pending.map((item) => (
              <div key={item.teacher_id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-ink">{item.name}</p>
                    <p className="mt-0.5 text-[12px] text-ink-soft">
                      {[item.school, item.subject, item.title, item.phone].filter(Boolean).join(' · ') || '未填写其他信息'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">注册时间：{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approve(item)}
                      className="btn-brand !px-4 !py-2 text-sm"
                    >
                      <Icon name="check" size={14} />
                      通过
                    </button>
                    <button
                      onClick={() => reject(item)}
                      disabled={rejecting === item.teacher_id}
                      className="btn-line !px-4 !py-2 text-sm text-red-600"
                    >
                      <Icon name="logout" size={14} />
                      驳回
                    </button>
                  </div>
                </div>
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="驳回原因（可选）"
                  className="input-soft mt-3 !py-2 text-sm"
                  aria-label="驳回原因"
                />
              </div>
            ))}
          </div>
        )}
        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </section>
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  lesson: '备课素材',
  comment: '评语范例',
  classroom: '班级规范',
  general: '通用',
}

function KnowledgeSection() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [status, setStatus] = useState<{ configured: boolean; doc_count: number; chunk_count: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'lesson' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [docResp, statusResp] = await Promise.all([api.getKnowledgeDocs(), api.getKnowledgeStatus()])
      setDocs(docResp.items)
      setStatus(statusResp)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载知识库失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const seed = async () => {
    setBusy(true)
    setError('')
    try {
      const resp = await api.seedKnowledge()
      setDocs(resp.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '写入种子语料失败')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (docId: string) => {
    setBusy(true)
    setError('')
    try {
      const resp = await api.deleteKnowledgeDoc(docId)
      setDocs(resp.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  const create = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setCreating(true)
    setError('')
    try {
      const resp = await api.createKnowledgeDoc({
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
      })
      setDocs(resp.items)
      setForm({ title: '', content: '', category: 'lesson' })
    } catch (e) {
      setError(e instanceof Error ? e.message : '新增失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="card p-6 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-sm font-bold">4</span>
          <div>
            <h2 className="text-base font-bold text-ink">RAG 知识库</h2>
            <p className="text-[12px] text-ink-soft">为备课素材 / 评语生成提供检索增强（仅限开场素材 / 备课 / 评语）</p>
          </div>
        </div>
        {status ? (
          <span className={`tag ${status.configured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {status.configured ? '已配置' : '未配置 embedding'} · {status.doc_count} 文档 / {status.chunk_count} 分块
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-ink">新增文档</h3>
          <div className="mt-3 space-y-3">
            <Field label="标题">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="文档标题" className="input-soft" />
            </Field>
            <Field label="分类">
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-soft">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="正文" hint="保存时将自动分块并向量化；embedding 未配置时无法入库">
              <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} placeholder="请输入知识正文" className="input-soft resize-none" />
            </Field>
            <button onClick={create} disabled={creating || !form.title.trim() || !form.content.trim()} className="btn-brand w-full !py-2.5">
              <Icon name="check" size={14} />
              {creating ? '向量化中…' : '新增入库'}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">已有文档（{docs.length}）</h3>
            <button onClick={seed} disabled={busy} className="btn-line !px-3 !py-1.5 text-xs">
              <Icon name="refresh" size={13} />
              写入种子语料
            </button>
          </div>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-ink-soft">加载中…</p>
            ) : docs.length === 0 ? (
              <p className="rounded-xl bg-brand-soft/40 px-4 py-6 text-center text-sm text-ink-soft">知识库暂无文档</p>
            ) : (
              docs.map((doc) => (
                <div key={doc.doc_id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{doc.title}</p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">
                      {CATEGORY_LABELS[doc.category] ?? doc.category} · {doc.chunk_count} 块
                      {doc.source === 'seed' ? ' · 内置' : ''}
                    </p>
                  </div>
                  <button onClick={() => remove(doc.doc_id)} disabled={busy} className="shrink-0 text-xs font-medium text-ink-faint transition-colors hover:text-red-600">
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
    </section>
  )
}

export function AdminConfigPage() {
  const [authed, setAuthed] = useState(() => !!getAdminToken())
  const [config, setConfig] = useState<ServiceConfig>(EMPTY_CONFIG)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof ServiceConfig>(key: K, value: ServiceConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }))

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setConfig(await api.getAdminConfig())
    } catch (e) {
      setAuthed(false)
      setAdminToken(null)
      setError(e instanceof Error ? e.message : '加载配置失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) void load()
  }, [authed, load])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const updated = await api.updateAdminConfig(config)
      setConfig(updated)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const logout = () => {
    setAdminToken(null)
    setAuthed(false)
  }

  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
        <div className="mb-6">
          <Link to="/teacher" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-brand">
            <Icon name="arrow-left" size={13} />
            返回教师后台
          </Link>
        </div>
        <div className="text-center">
          <span className="tag bg-white text-ink-soft border border-line">模型服务配置 · 管理员后台</span>
          <h1 className="title-pill mt-5 text-4xl md:text-5xl">系统配置</h1>
        </div>
        <div className="mt-10">
          <LoginPanel onSuccess={() => setAuthed(true)} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/teacher" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-brand">
          <Icon name="arrow-left" size={13} />
          返回教师后台
        </Link>
        <button onClick={logout} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-red-600">
          <Icon name="logout" size={13} />
          退出管理员
        </button>
      </div>

      <div className="relative text-center">
        <img
          src="/design/leaves.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-44 -top-10 hidden w-72 opacity-70 lg:block"
        />
        <div>
          <span className="tag bg-white text-ink-soft border border-line">模型服务配置 · 管理员后台</span>
        </div>
        <h1 className="title-pill mt-5 text-4xl md:text-5xl">系统配置</h1>
        <p className="mt-4 text-[15px] text-ink-soft">配置语音、文本生成与文生图所用模型，保存后即时生效</p>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center py-16 text-ink-soft">加载配置中…</div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-5 animate-rise">
            <Section index="1" title="语音对话（Realtime）" desc="课堂 / 成长日记语音会话所用模型">
              <Field label="Provider">
                <select value={config.voice_provider} onChange={(e) => set('voice_provider', e.target.value)} className="input-soft">
                  <option value="local">local（本地脚本回放，零额度）</option>
                  <option value="dashscope">dashscope（实时语音）</option>
                </select>
              </Field>
              <Field label="Voice Model">
                <input value={config.voice_model} onChange={(e) => set('voice_model', e.target.value)} placeholder="qwen3.5-omni-flash-realtime" className="input-soft" />
              </Field>
              <Field label="Realtime URL" hint="DashScope realtime WebSocket 端点">
                <input value={config.dashscope_realtime_url} onChange={(e) => set('dashscope_realtime_url', e.target.value)} className="input-soft" />
              </Field>
              <Field label="API Key" hint="DashScope 语音 API Key">
                <input type="password" value={config.dashscope_api_key} onChange={(e) => set('dashscope_api_key', e.target.value)} placeholder="留空则回退本地脚本" className="input-soft" />
              </Field>
            </Section>

            <Section index="2" title="文本生成 LLM" desc="书信 / 备课 / 评分所用文本模型（方案 5.1）">
              <Field label="Provider">
                <select value={config.text_provider} onChange={(e) => set('text_provider', e.target.value)} className="input-soft">
                  <option value="template">template（确定性模板，零额度）</option>
                  <option value="dashscope">dashscope（OpenAI 兼容）</option>
                  <option value="openai">openai</option>
                </select>
              </Field>
              <Field label="Text Model">
                <input value={config.text_model} onChange={(e) => set('text_model', e.target.value)} placeholder="qwen-plus" className="input-soft" />
              </Field>
              <Field label="Base URL">
                <input value={config.text_base_url} onChange={(e) => set('text_base_url', e.target.value)} className="input-soft" />
              </Field>
              <Field label="API Key">
                <input type="password" value={config.text_api_key} onChange={(e) => set('text_api_key', e.target.value)} placeholder="留空则回退模板" className="input-soft" />
              </Field>
            </Section>

            <Section index="3" title="文生图" desc="班宠画像生成所用模型（方案 5.2）">
              <Field label="Provider">
                <select value={config.image_provider} onChange={(e) => set('image_provider', e.target.value)} className="input-soft">
                  <option value="placeholder">placeholder（本地占位图，零额度）</option>
                  <option value="dashscope">dashscope（文生图）</option>
                </select>
              </Field>
              <Field label="Image Model">
                <input value={config.image_model} onChange={(e) => set('image_model', e.target.value)} placeholder="wanx2.1-t2i-turbo" className="input-soft" />
              </Field>
              <Field label="Base URL">
                <input value={config.image_base_url} onChange={(e) => set('image_base_url', e.target.value)} className="input-soft" />
              </Field>
              <Field label="API Key">
                <input type="password" value={config.image_api_key} onChange={(e) => set('image_api_key', e.target.value)} placeholder="留空则回退占位图" className="input-soft" />
              </Field>
            </Section>
          <Section index="4" title="RAG Embedding" desc="知识库向量化所用模型（方案 5.4）">
              <Field label="Provider">
                <select value={config.embed_provider} onChange={(e) => set('embed_provider', e.target.value)} className="input-soft">
                  <option value="disabled">disabled（关闭检索，零额度）</option>
                  <option value="dashscope">dashscope（text-embedding）</option>
                </select>
              </Field>
              <Field label="Embedding Model">
                <input value={config.embed_model} onChange={(e) => set('embed_model', e.target.value)} placeholder="text-embedding-v3" className="input-soft" />
              </Field>
              <Field label="Base URL">
                <input value={config.embed_base_url} onChange={(e) => set('embed_base_url', e.target.value)} className="input-soft" />
              </Field>
              <Field label="API Key">
                <input type="password" value={config.embed_api_key} onChange={(e) => set('embed_api_key', e.target.value)} placeholder="留空则关闭检索" className="input-soft" />
              </Field>
            </Section>
          </div>

          <div className="mt-5 animate-rise">
            <KnowledgeSection />
          </div>

          <div className="mt-5 animate-rise">
            <TeacherReviewSection />
          </div>

          <div className="mt-6 flex flex-col items-end gap-2">
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            {saved ? <p className="text-sm font-medium text-green-600">已保存 ✓</p> : null}
            <button onClick={save} disabled={saving} className="btn-brand !px-8 !py-3">
              {saving ? '保存中…' : '保存配置'}
              <Icon name="check" size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}