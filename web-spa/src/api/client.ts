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
  if (token) headers.set('Authorization', `Bearer ${token}`)

  // FormData 需要浏览器自动设置带 boundary 的 Content-Type
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
  if (!isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const code = body.code || 'UNKNOWN'
    if (res.status === 401) {
      throw handleUnauthorized(code)
    }
    throw new ApiClientError(body.message || res.statusText, res.status, code)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
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
  if (token) headers.set('Authorization', `Bearer ${token}`)
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
  teacherEnter: (code: string, teacherName: string) => request<{ session_token: string; profile: Record<string, unknown> }>(`/session/teacher/enter`, { method: 'POST', body: JSON.stringify({ class_code: code, teacher_name: teacherName }) }),
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

  // F4 学情
  getAcademicSummary: (code: string) => request<{
    records: {
      student_id: string
      student_no: string
      name: string
      role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
      scores: { subject: string; score: number; trend: 'up' | 'down' | 'flat' }[]
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
    teacher_note?: string
  }[]) => request<{
    records: {
      student_id: string
      student_no: string
      name: string
      role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
      scores: { subject: string; score: number; trend: 'up' | 'down' | 'flat' }[]
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
  importAcademicFile: (code: string, file: File) => request<{
    records: {
      student_id: string
      student_no: string
      name: string
      role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
      scores: { subject: string; score: number; trend: 'up' | 'down' | 'flat' }[]
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
}

export const api = USE_MOCK ? mockClient : realClient
