import { mockClient } from '@/mocks/client'
import { clearSession, getSession } from '@/stores/session'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export type ApiError = { code: string; message: string }

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

function handleUnauthorized(code: string) {
  clearSession()
  // 避免在测试/SSR 环境操作 location
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
  return new ApiClientError('会话已失效，请重新登录', 401, code)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`
  const headers = new Headers(init.headers)
  const { token } = getSession()
  // 平台网关会剥除 Authorization header，改用 X-Auth-Token 传递 token
  console.log('[api-debug] path:', path, 'token:', token)
  if (token) headers.set('X-Auth-Token', token)

  // FormData 需要浏览器自动设置带 boundary 的 Content-Type
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
  if (!isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const code = body.code || 'UNKNOWN'
    console.error('[api-debug] error:', res.status, code, body)
    if (res.status === 401) {
      throw handleUnauthorized(code)
    }
    throw new ApiClientError(body.message || res.statusText, res.status, code)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export type TeacherAccount = {
  teacher_id: string
  name: string
  school: string
  phone: string
  subject: string
  title: string
  has_password: boolean
  status: 'pending' | 'active' | 'rejected'
}

export type PendingTeacher = {
  teacher_id: string
  name: string
  school: string
  phone: string
  subject: string
  title: string
  created_at: string
}

export type ServiceConfig = {
  voice_provider: string
  dashscope_api_key: string
  dashscope_realtime_url: string
  voice_model: string
  text_provider: string
  text_model: string
  text_base_url: string
  text_api_key: string
  image_provider: string
  image_model: string
  image_base_url: string
  image_api_key: string
  embed_provider: string
  embed_model: string
  embed_base_url: string
  embed_api_key: string
}

export type KnowledgeDoc = {
  doc_id: string
  title: string
  category: string
  source: string
  chunk_count: number
  created_at: string
}

export type KnowledgeStatus = {
  embed_provider: string
  embed_model: string
  configured: boolean
  doc_count: number
  chunk_count: number
}

// 管理员会话独立存储（与学生/教师 token 互不影响）
const ADMIN_TOKEN_KEY = 'admin_token'
export function getAdminToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}
export function setAdminToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  else localStorage.removeItem(ADMIN_TOKEN_KEY)
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`
  const headers = new Headers(init.headers)
  const token = getAdminToken()
  // 平台网关会剥除 Authorization header，改用 X-Auth-Token 传递 token
  if (token) headers.set('X-Auth-Token', token)
  headers.set('Content-Type', 'application/json')

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const code = body.code || 'UNKNOWN'
    if (res.status === 401) {
      setAdminToken(null)
      throw new ApiClientError(body.message || '管理员登录已失效', res.status, code)
    }
    throw new ApiClientError(body.message || res.statusText, res.status, code)
  }
  return (await res.json()) as T
}

export const realClient = {
  createClass: (req: {
    class_name: string
    school: string
    region_key: string
    grade: string
    class_no: string
    students: { name: string; grade: string; avatar_seed: number; ideal?: string }[]
  }) =>
    request<{
      class_code: string
      class_name: string
      school: string
      region_key: string
      region_name: string
      grade: string
      class_no: string
      students: { id: string; name: string; student_no: string; grade: string; avatar_seed: number; role: string; region_key: string; region_name: string; ideal?: string }[]
    }>(`/classes`, { method: 'POST', body: JSON.stringify(req) }),
  getClass: (code: string) => request<{
    class_code: string
    class_name: string
    school: string
    region_key: string
    region_name: string
    grade: string
    class_no: string
    students: { id: string; name: string; student_no: string; grade: string; avatar_seed: number; role: string; region_key: string; region_name: string; ideal?: string }[]
  }>(`/classes/${encodeURIComponent(code)}`),
  enter: (code: string, studentName: string) => request<{ session_token: string; profile: Record<string, unknown> }>(`/session/enter`, { method: 'POST', body: JSON.stringify({ class_code: code, student_name: studentName }) }),
  teacherEnter: (code: string, teacherName: string, password?: string) => request<{ session_token: string; profile: Record<string, unknown>; expires_at: string }>(`/session/teacher/enter`, { method: 'POST', body: JSON.stringify({ class_code: code, teacher_name: teacherName, password }) }),
  getTeacherClasses: () => request<{
    teacher_id: string
    name: string
    school: string
    classes: { class_code: string; class_name: string; school: string; grade: string; class_no: string }[]
  }>(`/session/teacher/classes`),
  teacherSwitch: (classCode: string) => request<{ session_token: string; profile: Record<string, unknown>; expires_at: string }>(`/session/teacher/switch`, { method: 'POST', body: JSON.stringify({ class_code: classCode }) }),

  // 教师账号管理（注册 / 个人信息 / 密码）
  teacherRegister: (req: {
    name: string
    school?: string
    phone?: string
    subject?: string
    title?: string
    password?: string
  }) => request<TeacherAccount>(`/session/teacher/register`, {
    method: 'POST',
    body: JSON.stringify(req),
  }),
  getTeacherAccount: () => request<TeacherAccount>(`/session/teacher/account`),
  updateTeacherAccount: (req: {
    school?: string | null
    phone?: string | null
    subject?: string | null
    title?: string | null
  }) => request<TeacherAccount>(`/session/teacher/account`, {
    method: 'PUT',
    body: JSON.stringify(req),
  }),
  updateTeacherPassword: (req: { old_password?: string | null; new_password: string }) =>
    request<TeacherAccount>(`/session/teacher/password`, {
      method: 'PUT',
      body: JSON.stringify(req),
    }),
  startClass: (code: string) => request<{ session_id: string; state: 'idle' | 'active' | 'paused'; current_student: string | null; current_slot: string | null; turn_count: number; updated_at: string }>(`/classes/${encodeURIComponent(code)}/session/start`, { method: 'POST' }),
  controlClass: (code: string, action: string, clientCmdId: string, payload?: Record<string, unknown>) => request<{ session_id: string; state: 'idle' | 'active' | 'paused'; current_student: string | null; current_slot: string | null; turn_count: number; updated_at: string }>(`/classes/${encodeURIComponent(code)}/session/control`, { method: 'POST', body: JSON.stringify({ action, client_cmd_id: clientCmdId, payload }) }),
  getClassStatus: (code: string) => request<{ session_id: string; state: 'idle' | 'active' | 'paused'; current_student: string | null; current_slot: string | null; turn_count: number; updated_at: string }>(`/classes/${encodeURIComponent(code)}/session/status`),

  // F3 成长 / 宠物 / 任务
  getGrowth: (studentId: string) => request<{
    ideal: string | null
    commitments: { id: string; text: string; created_at: string; status: 'active' | 'fulfilled' | 'expired' }[]
    last_gist: string | null
    growth_value: number
    stage: string
    pet: {
      species: string
      stage: number
      state: 'daily' | 'gray' | 'cheer'
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
  }>(`/students/${encodeURIComponent(studentId)}/growth`),
  getPet: (studentId: string) => request<{
    species: string
    stage: number
    state: 'daily' | 'gray' | 'cheer'
    growth_value: number
    last_growth_at: string
    cheer_until: string | null
    needs_care: boolean
    portrait_url: string | null
    updated_at: string
  }>(`/students/${encodeURIComponent(studentId)}/pet`),
  createPortrait: (studentId: string, idempotencyKey?: string) => request<{ job_id: string }>(`/students/${encodeURIComponent(studentId)}/pet/portrait`, {
    method: 'POST',
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  }),
  getJob: (jobId: string) => request<{
    job_id: string
    status: 'pending' | 'running' | 'done' | 'failed'
    result_url: string | null
    error: { code: string; message: string } | null
  }>(`/jobs/${encodeURIComponent(jobId)}`),
  getClassPets: (code: string) => request<{
    student_id: string
    name: string
    avatar_seed: number
    pet: {
      species: string
      stage: number
      state: 'daily' | 'gray' | 'cheer'
      growth_value: number
      last_growth_at: string
      cheer_until: string | null
      needs_care: boolean
      portrait_url: string | null
      updated_at: string
    }
  }[]>(`/classes/${encodeURIComponent(code)}/pets`),

  // F4 备课 / 课程
  generateLesson: (topic: string, goals: string[], guidance?: string) => request<{
    lesson_id: string
    topic: string
    goals: string[]
    guidance_strategy: string
    materials: { title: string; content: string }[]
    created_at: string
  }>(`/lesson/generate`, {
    method: 'POST',
    body: JSON.stringify({ topic, goals, guidance }),
  }),
  getLesson: (lessonId: string) => request<{
    lesson_id: string
    topic: string
    goals: string[]
    guidance_strategy: string
    materials: { title: string; content: string }[]
    created_at: string
  }>(`/lessons/${encodeURIComponent(lessonId)}`),
  getClassLessons: (code: string) => request<{
    lesson_id: string
    topic: string
    date: string
    duration: string | null
    joined: number
    avg_score: number | null
    status: 'active' | 'done'
    goal: string
    traces: string[]
  }[]>(`/classes/${encodeURIComponent(code)}/lessons`),
  addLessonTrace: (lessonId: string, content: string) => request<{
    lesson_id: string
    topic: string
    date: string
    duration: string | null
    joined: number
    avg_score: number | null
    status: 'active' | 'done'
    goal: string
    traces: string[]
  }>(`/lessons/${encodeURIComponent(lessonId)}/traces`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),

  // F4 学情
  getAcademicSummary: (code: string) => request<{
    records: {
      student_id: string
      student_no: string
      name: string
      role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
      scores: { subject: string; score: number; trend: 'up' | 'down' | 'flat' }[]
      background: string
      teacher_note: string
      updated_at: string
    }[]
    summary: {
      count: number
      avg_score: number
      attention_count: number
    }
  }>(`/classes/${encodeURIComponent(code)}/academic`),
  importAcademicJson: (code: string, records: {
    student_no: string
    scores: { subject: string; score: number; trend?: 'up' | 'down' | 'flat' }[]
    role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
    background?: string
    teacher_note?: string
  }[]) => request<{
    records: {
      student_id: string
      student_no: string
      name: string
      role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
      scores: { subject: string; score: number; trend: 'up' | 'down' | 'flat' }[]
      background: string
      teacher_note: string
      updated_at: string
    }[]
    summary: {
      count: number
      avg_score: number
      attention_count: number
    }
  }>(`/classes/${encodeURIComponent(code)}/academic`, {
    method: 'POST',
    body: JSON.stringify({ records }),
  }),
  manualAddAcademic: (code: string, entry: {
    name: string
    student_no?: string
    scores: { subject: string; score: number }[]
    role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
    background?: string
    teacher_note?: string
  }) => request<{
    records: {
      student_id: string
      student_no: string
      name: string
      role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
      scores: { subject: string; score: number; trend: 'up' | 'down' | 'flat' }[]
      background: string
      teacher_note: string
      updated_at: string
    }[]
    summary: {
      count: number
      avg_score: number
      attention_count: number
    }
  }>(`/classes/${encodeURIComponent(code)}/academic/manual`, {
    method: 'POST',
    body: JSON.stringify(entry),
  }),
  importAcademicFile: (code: string, file: File) => request<{
    records: {
      student_id: string
      student_no: string
      name: string
      role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
      scores: { subject: string; score: number; trend: 'up' | 'down' | 'flat' }[]
      background: string
      teacher_note: string
      updated_at: string
    }[]
    summary: {
      count: number
      avg_score: number
      attention_count: number
    }
  }>(`/classes/${encodeURIComponent(code)}/academic`, {
    method: 'POST',
    body: (() => {
      const fd = new FormData()
      fd.append('file', file)
      return fd
    })(),
  }),

  // 班宠积分制度
  getPointRules: (code: string) => request<{
    rule_id: string
    name: string
    points: number
    category: string | null
    enabled: boolean
  }[]>(`/classes/${encodeURIComponent(code)}/points/rules`),
  updatePointRules: (code: string, rules: {
    rule_id?: string | null
    name: string
    points: number
    category?: string | null
    enabled?: boolean
  }[]) => request<{
    rule_id: string
    name: string
    points: number
    category: string | null
    enabled: boolean
  }[]>(`/classes/${encodeURIComponent(code)}/points/rules`, {
    method: 'PUT',
    body: JSON.stringify({ rules }),
  }),
  awardPoints: (code: string, req: {
    student_id: string
    rule_id?: string | null
    points?: number | null
    name?: string | null
    note?: string | null
  }) => request<{
    student_id: string
    points: number
    points_total: number
    level: number
    leveled_up: boolean
    hunger: number
    mood: number
    state: string
    ledger_id: number
  }>(`/classes/${encodeURIComponent(code)}/points/award`, {
    method: 'POST',
    body: JSON.stringify(req),
  }),
  getPointOverview: (code: string) => request<{
    rules: {
      rule_id: string
      name: string
      points: number
      category: string | null
      enabled: boolean
    }[]
    students: { id: string; name: string; group_id: string | null }[]
    groups: {
      group_id: string
      group_name: string
      color: string | null
      members: string[]
    }[]
  }>(`/classes/${encodeURIComponent(code)}/points/overview`),
  getGroups: (code: string) => request<{
    group_id: string
    group_name: string
    color: string | null
    members: string[]
  }[]>(`/classes/${encodeURIComponent(code)}/groups`),
  configGroups: (code: string, groups: {
    group_name: string
    color?: string | null
  }[], assignments: Record<string, string>) => request<{
    group_id: string
    group_name: string
    color: string | null
    members: string[]
  }[]>(`/classes/${encodeURIComponent(code)}/groups`, {
    method: 'PUT',
    body: JSON.stringify({ groups, assignments }),
  }),
  getLeaderboard: (code: string) => request<{
    items: {
      group_id: string
      group_name: string
      color: string | null
      total_points: number
      member_count: number
    }[]
  }>(`/classes/${encodeURIComponent(code)}/leaderboard`),
  getStudentPoints: (studentId: string) => request<{
    id: number
    name: string
    points: number
    note: string | null
    created_at: string
  }[]>(`/students/${encodeURIComponent(studentId)}/points`),

  // 方案 5.3 管理员后台
  adminLogin: async (password: string) => {
    const resp = await adminRequest<{ session_token: string; expires_at: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
    setAdminToken(resp.session_token)
    return resp
  },
  getAdminConfig: () => adminRequest<ServiceConfig>('/admin/config'),
  updateAdminConfig: (config: Partial<ServiceConfig>) =>
    adminRequest<ServiceConfig>('/admin/config', { method: 'PUT', body: JSON.stringify(config) }),
  getPendingTeachers: () =>
    adminRequest<{ items: PendingTeacher[] }>('/admin/teachers/pending'),
  reviewTeacher: (teacherId: string, req: { approve: boolean; reject_reason?: string }) =>
    adminRequest<{ items: PendingTeacher[] }>(`/admin/teachers/${encodeURIComponent(teacherId)}/review`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  getKnowledgeStatus: () => adminRequest<KnowledgeStatus>('/admin/knowledge/status'),
  getKnowledgeDocs: () => adminRequest<{ items: KnowledgeDoc[]; total: number }>('/admin/knowledge'),
  createKnowledgeDoc: (doc: { title: string; content: string; category: string }) =>
    adminRequest<{ items: KnowledgeDoc[]; total: number }>('/admin/knowledge', {
      method: 'POST',
      body: JSON.stringify({ ...doc, source: 'manual' }),
    }),
  seedKnowledge: () =>
    adminRequest<{ items: KnowledgeDoc[]; total: number }>('/admin/knowledge/seed', { method: 'POST' }),
  deleteKnowledgeDoc: (docId: string) =>
    adminRequest<{ items: KnowledgeDoc[]; total: number }>(
      `/admin/knowledge/${encodeURIComponent(docId)}`,
      { method: 'DELETE' },
    ),
}

export const api = USE_MOCK ? mockClient : realClient
