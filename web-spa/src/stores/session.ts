import type { RegionKey } from '@/mocks/data'

export type Profile = {
  id: string
  name: string
  grade: string
  student_no: string
  avatar_seed: number
  ideal?: string
  class_code: string
  region_key: RegionKey
  region_name: string
}

export type TeacherProfile = {
  id: string
  name: string
  role: 'teacher'
  class_code: string
  class_name: string
  school: string
  region_key: RegionKey
}

export type Session = {
  token: string
  profile: Profile | TeacherProfile
}

const TOKEN_KEY = 'xx_session_token'
const PROFILE_KEY = 'xx_session_profile'
export const SESSION_CHANGE_EVENT = 'xx-session-change'

function emitSessionChange(): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return
  try {
    window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT))
  } catch {
    // CustomEvent 在某些旧环境不可用，降级为 Event
    try {
      window.dispatchEvent(new Event(SESSION_CHANGE_EVENT))
    } catch {
      /* noop */
    }
  }
}

// 契约 v2.1：st_ 前缀 + opaque token（非 JWT），固定 48 字符随机段
const TOKEN_RE = /^st_[A-Za-z0-9_-]{48}$/

// 当 sessionStorage 不可用时退回到内存存储（例如隐私模式或 SSR）
let memoryToken: string | null = null
let memoryProfile: string | null = null

function storageAvailable(): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && typeof sessionStorage.getItem === 'function'
  } catch {
    return false
  }
}

function getRawToken(): string | null {
  if (!storageAvailable()) return memoryToken
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return memoryToken
  }
}

function setRawToken(value: string | null): void {
  if (!storageAvailable()) {
    memoryToken = value
    return
  }
  try {
    if (value === null) {
      sessionStorage.removeItem(TOKEN_KEY)
    } else {
      sessionStorage.setItem(TOKEN_KEY, value)
    }
  } catch {
    memoryToken = value
  }
}

function getRawProfile(): string | null {
  if (!storageAvailable()) return memoryProfile
  try {
    return sessionStorage.getItem(PROFILE_KEY)
  } catch {
    return memoryProfile
  }
}

function setRawProfile(value: string | null): void {
  if (!storageAvailable()) {
    memoryProfile = value
    return
  }
  try {
    if (value === null) {
      sessionStorage.removeItem(PROFILE_KEY)
    } else {
      sessionStorage.setItem(PROFILE_KEY, value)
    }
  } catch {
    memoryProfile = value
  }
}

const STUDENT_FIELDS: (keyof Profile)[] = [
  'id',
  'name',
  'grade',
  'student_no',
  'avatar_seed',
  'class_code',
  'region_key',
  'region_name',
]
const TEACHER_FIELDS: (keyof TeacherProfile)[] = [
  'id',
  'name',
  'role',
  'class_code',
  'class_name',
  'school',
  'region_key',
]

function isProfileValid(profile: unknown): profile is Profile | TeacherProfile {
  if (!profile || typeof profile !== 'object') return false
  const p = profile as Record<string, unknown>
  const fields = 'student_no' in p ? STUDENT_FIELDS : TEACHER_FIELDS
  return fields.every((k) => k in p && p[k as string] !== undefined && p[k as string] !== null)
}

export function isValidToken(token: string | null): token is string {
  return typeof token === 'string' && TOKEN_RE.test(token)
}

export function getSession(): { token: string | null; profile: Profile | TeacherProfile | null } {
  const token = getRawToken()
  const raw = getRawProfile()

  let profile: Profile | TeacherProfile | null = null
  if (raw) {
    try {
      profile = JSON.parse(raw) as Profile | TeacherProfile
    } catch {
      console.warn('[session] profile JSON 解析失败，清空会话')
      clearSession()
      return { token: null, profile: null }
    }
  }

  if (profile && !isProfileValid(profile)) {
    console.warn('[session] profile 字段不完整，清空会话')
    clearSession()
    return { token: null, profile: null }
  }

  return { token: isValidToken(token) ? token : null, profile }
}

export function setSession(session: Session): void {
  if (!isValidToken(session.token)) {
    throw new Error(`非法 session token 格式：${session.token}`)
  }
  if (!isProfileValid(session.profile)) {
    throw new Error('session profile 字段不完整')
  }
  setRawToken(session.token)
  setRawProfile(JSON.stringify(session.profile))
  emitSessionChange()
}

export function clearSession(): void {
  setRawToken(null)
  setRawProfile(null)
  emitSessionChange()
}

export function isAuthenticated(): boolean {
  return isValidToken(getSession().token)
}

export function isStudentProfile(profile: Profile | TeacherProfile | null): profile is Profile {
  return profile !== null && 'student_no' in profile
}
