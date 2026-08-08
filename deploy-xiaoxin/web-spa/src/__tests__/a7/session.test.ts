import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  clearSession,
  getSession,
  isAuthenticated,
  isStudentProfile,
  isValidToken,
  setSession,
} from '@/stores/session'

const validToken = 'st_' + 'a'.repeat(48)
const teacherProfile = {
  id: 'teacher-001',
  name: '李老师',
  role: 'teacher' as const,
  class_code: 'LTZ2024',
  class_name: '三（1）班',
  school: '龙头山镇中心小学',
  region_key: 'yunnan' as const,
}

const studentProfile = {
  id: 'wxy',
  name: '王小雅',
  grade: '三年级',
  student_no: '2023001',
  avatar_seed: 0,
  ideal: '蛋糕师',
  class_code: 'LTZ2024',
  region_key: 'yunnan' as const,
  region_name: '云南山区',
}

describe('A7 会话层', () => {
  beforeEach(() => {
    clearSession()
  })

  it('token 格式校验：合法 st_ token 通过', () => {
    expect(isValidToken(validToken)).toBe(true)
  })

  it('token 格式校验：非法 token 被拒绝', () => {
    expect(isValidToken('jwt_xxxx')).toBe(false)
    expect(isValidToken('st_tooshort')).toBe(false)
    expect(isValidToken('st_' + 'a'.repeat(47))).toBe(false)
    expect(isValidToken('st_' + 'a'.repeat(49))).toBe(false)
    expect(isValidToken(null)).toBe(false)
    expect(isValidToken('')).toBe(false)
  })

  it('setSession 拒绝非法 token', () => {
    expect(() => setSession({ token: 'bad-token', profile: studentProfile })).toThrow()
  })

  it('setSession / getSession / clearSession 读写 sessionStorage', () => {
    setSession({ token: validToken, profile: studentProfile })
    const s = getSession()
    expect(s.token).toBe(validToken)
    expect(s.profile).toEqual(studentProfile)
    expect(isAuthenticated()).toBe(true)

    clearSession()
    expect(getSession().token).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })

  it('isStudentProfile 区分学生和教师 profile', () => {
    expect(isStudentProfile(studentProfile)).toBe(true)
    expect(isStudentProfile(teacherProfile)).toBe(false)
    expect(isStudentProfile(null)).toBe(false)
  })

  it('setSession 拒绝字段不完整的学生 profile', () => {
    const bad = { ...studentProfile, region_name: undefined }
    expect(() => setSession({ token: validToken, profile: bad as unknown as typeof studentProfile })).toThrow(
      'session profile 字段不完整',
    )
  })

  it('setSession 拒绝字段不完整的教师 profile', () => {
    const bad = { ...teacherProfile, school: undefined }
    expect(() => setSession({ token: validToken, profile: bad as unknown as typeof teacherProfile })).toThrow(
      'session profile 字段不完整',
    )
  })

  it('getSession 遇到字段不完整的 profile 时自动清空 session', () => {
    // 手动写入不完整 profile，模拟历史脏数据
    sessionStorage.setItem('xx_session_token', validToken)
    sessionStorage.setItem('xx_session_profile', JSON.stringify({ id: 'x', name: 'x' }))

    const s = getSession()
    expect(s.token).toBeNull()
    expect(s.profile).toBeNull()
    expect(sessionStorage.getItem('xx_session_token')).toBeNull()
  })

  it('sessionStorage 不可用时回退到内存存储', () => {
    const original = globalThis.sessionStorage
    vi.stubGlobal('sessionStorage', undefined)

    setSession({ token: validToken, profile: studentProfile })
    expect(getSession().token).toBe(validToken)
    expect(getSession().profile).toEqual(studentProfile)

    clearSession()
    expect(getSession().token).toBeNull()

    vi.stubGlobal('sessionStorage', original)
  })
})

describe('A7 API 401 处理', () => {
  beforeEach(() => {
    clearSession()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    { code: 'TOKEN_INVALID', label: 'TOKEN_INVALID' },
    { code: 'TOKEN_EXPIRED', label: 'TOKEN_EXPIRED' },
    { code: 'UNKNOWN', label: '任意 401' },
  ])('收到 $label 时清 session 并跳转 /', async ({ code }) => {
    vi.stubGlobal('location', { href: '' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ code, message: 'token 异常' }),
      }),
    )

    const { realClient } = await import('@/api/client')
    setSession({ token: validToken, profile: studentProfile })

    await expect(realClient.getClass('LTZ2024')).rejects.toThrow('会话已失效')
    expect(getSession().token).toBeNull()
    expect(window.location.href).toBe('/')
  })
})
