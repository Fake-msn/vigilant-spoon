import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { api } from '@/api/client'
import { TeacherClassroomPage } from '@/pages/teacher/classroom/TeacherClassroomPage'
import { clearSession, setSession } from '@/stores/session'

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

const students = [
  { id: 'wxy', name: '王小雅', grade: '三年级', avatar_seed: 0 },
  { id: 'lxj', name: '李小军', grade: '四年级', avatar_seed: 1 },
]

const classResponse = {
  class_code: 'LTZ2024',
  class_name: '三（1）班',
  school: '龙头山镇中心小学',
  region_key: 'yunnan',
  region_name: '云南山区',
  grade: '三年级',
  class_no: '1',
  students,
}

type Status = {
  session_id: string
  state: 'idle' | 'active' | 'paused'
  current_student: string | null
  current_slot: string | null
  turn_count: number
  updated_at: string
}

let history: Omit<Status, 'session_id' | 'updated_at'>[] = [
  { state: 'idle', current_student: null, current_slot: null, turn_count: 0 },
]

function currentStatus(overrides?: Partial<typeof history[0]>): Status {
  const next = { ...history[history.length - 1], ...overrides }
  history.push(next)
  return {
    session_id: 'cls-LTZ2024',
    ...next,
    updated_at: new Date().toISOString(),
  }
}

function setup() {
  return render(
    <MemoryRouter>
      <TeacherClassroomPage />
    </MemoryRouter>,
  )
}

describe('F2 教师课堂面板', () => {
  beforeEach(() => {
    clearSession()
    setSession({ token: validToken, profile: teacherProfile })
    history = [{ state: 'idle', current_student: null, current_slot: null, turn_count: 0 }]

    vi.spyOn(api, 'getClass').mockResolvedValue(classResponse as never)
    vi.spyOn(api, 'getClassStatus').mockImplementation(() => Promise.resolve(currentStatus() as never))
    vi.spyOn(api, 'startClass').mockImplementation(() =>
      Promise.resolve(currentStatus({ state: 'active', current_student: 'wxy', turn_count: 1 }) as never),
    )
    vi.spyOn(api, 'controlClass').mockImplementation(async (_code: string, action: string, _clientCmdId: string, _payload?: Record<string, unknown>) => {
      const current = history[history.length - 1]
      if (action === 'pause') {
        return currentStatus({ ...current, state: 'paused' }) as never
      }
      if (action === 'resume') {
        return currentStatus({ ...current, state: 'active' }) as never
      }
      if (action === 'next_student') {
        const next = current.current_student === 'wxy' ? 'lxj' : 'wxy'
        return currentStatus({
          ...current,
          state: 'active',
          current_student: next,
          turn_count: current.turn_count + 1,
        }) as never
      }
      if (action === 'switch_content') {
        return currentStatus({ ...current, state: 'active', current_slot: '主题讨论' }) as never
      }
      return currentStatus() as never
    })
  })

  afterEach(() => {
    cleanup()
    clearSession()
    vi.restoreAllMocks()
  })

  it('初始加载显示班级、学生列表与 idle 状态', async () => {
    setup()

    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：待开始/)).toBeTruthy(),
    )
    expect(screen.getByText(/LTZ2024/)).toBeTruthy()
    expect(screen.getByText('王小雅')).toBeTruthy()
    expect(screen.getByText('李小军')).toBeTruthy()
    expect(screen.getByText('开始课堂')).toBeTruthy()
  })

  it('点击“开始课堂”后进入 active 状态并高亮当前学生', async () => {
    setup()

    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：待开始/)).toBeTruthy(),
    )
    fireEvent.click(screen.getByText('开始课堂'))

    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：上课中/)).toBeTruthy(),
    )
    expect(screen.getByText('发言中')).toBeTruthy()
    expect(screen.getByText('暂停')).toBeTruthy()
    expect(screen.getByText('下一位')).toBeTruthy()
    expect(api.startClass).toHaveBeenCalledWith('LTZ2024')
  })

  it('点击“暂停 / 继续”切换课堂状态', async () => {
    setup()

    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：待开始/)).toBeTruthy(),
    )
    fireEvent.click(screen.getByText('开始课堂'))
    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：上课中/)).toBeTruthy(),
    )

    fireEvent.click(screen.getByText('暂停'))
    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：已暂停/)).toBeTruthy(),
    )
    expect(api.controlClass).toHaveBeenCalledWith('LTZ2024', 'pause', expect.any(String), undefined)

    fireEvent.click(screen.getByText('继续'))
    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：上课中/)).toBeTruthy(),
    )
    expect(api.controlClass).toHaveBeenCalledWith('LTZ2024', 'resume', expect.any(String), undefined)
  })

  it('点击“下一位”切换当前学生', async () => {
    setup()

    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：待开始/)).toBeTruthy(),
    )
    fireEvent.click(screen.getByText('开始课堂'))
    await waitFor(() => expect(screen.getByText('发言中')).toBeTruthy())

    fireEvent.click(screen.getByText('下一位'))
    await waitFor(() => expect(screen.getByText(/第 2 轮/)).toBeTruthy())
    expect(api.controlClass).toHaveBeenCalledWith('LTZ2024', 'next_student', expect.any(String), undefined)
  })

  it('点击“切换内容”更新当前 slot', async () => {
    setup()

    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：待开始/)).toBeTruthy(),
    )
    fireEvent.click(screen.getByText('开始课堂'))
    await waitFor(() =>
      expect(screen.getByText(/班级：LTZ2024 · 状态：上课中/)).toBeTruthy(),
    )

    fireEvent.click(screen.getByText('切换内容'))
    await waitFor(() => expect(screen.getByText('主题讨论')).toBeTruthy())
    expect(api.controlClass).toHaveBeenCalledWith(
      'LTZ2024',
      'switch_content',
      expect.any(String),
      { slot: '主题讨论' },
    )
  })

  it('API 报错时显示错误信息', async () => {
    vi.spyOn(api, 'getClassStatus').mockRejectedValueOnce(new Error('网络错误'))
    setup()

    await waitFor(() => expect(screen.getByText(/网络错误/)).toBeTruthy())
  })

  it('未登录时提示先登录', () => {
    clearSession()
    setup()

    expect(screen.getByText(/请先登录/)).toBeTruthy()
  })
})
