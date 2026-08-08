import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { clearSession, getSession, isAuthenticated, isStudentProfile, setSession } from '@/stores/session'
import { SplashPage } from '@/pages/splash/SplashPage'
import { LoginPage } from '@/pages/login/LoginPage'
import { IdentityPage } from '@/pages/identity/IdentityPage'
import { StudentHomePage } from '@/pages/student/home/StudentHomePage'
import { VoicePage } from '@/pages/student/voice/VoicePage'
import { LetterListPage } from '@/pages/feedback/LetterListPage'
import { LetterDetailPage } from '@/pages/feedback/LetterDetailPage'
import { GrowthPage } from '@/pages/student/growth/GrowthPage'
import { TeacherConsoleLayout } from '@/layouts/TeacherConsoleLayout'
import { TeacherEntryPage } from '@/pages/teacher/entry/TeacherEntryPage'
import { TeacherSetupPage } from '@/pages/teacher/setup/TeacherSetupPage'
import { TeacherLessonPage } from '@/pages/teacher/lesson/TeacherLessonPage'
import { TeacherAcademicPage } from '@/pages/teacher/academic/TeacherAcademicPage'
import { TeacherGrowthPage } from '@/pages/teacher/growth/TeacherGrowthPage'
import { TeacherCoursesPage } from '@/pages/teacher/courses/TeacherCoursesPage'
import { TeacherClassroomPage } from '@/pages/teacher/classroom/TeacherClassroomPage'

const validToken = 'st_' + 'a'.repeat(48)

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

const teacherProfile = {
  id: 'teacher-001',
  name: '李老师',
  role: 'teacher' as const,
  class_code: 'LTZ2024',
  class_name: '三（1）班',
  school: '龙头山镇中心小学',
  region_key: 'yunnan' as const,
}

function ProtectedLayout() {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

function StudentGuard() {
  const { profile } = getSession()
  if (!profile || !isStudentProfile(profile)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

function TeacherGuard() {
  const { profile } = getSession()
  if (!profile || isStudentProfile(profile)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

function TestApp() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/identity" element={<IdentityPage />} />
      <Route element={<ProtectedLayout />}>
        <Route element={<StudentGuard />}>
          <Route path="/student" element={<StudentHomePage />} />
          <Route path="/student/voice" element={<VoicePage />} />
          <Route path="/student/letters" element={<LetterListPage />} />
          <Route path="/student/letters/:id" element={<LetterDetailPage />} />
          <Route path="/student/growth" element={<GrowthPage />} />
        </Route>
        <Route element={<TeacherGuard />}>
          <Route path="/teacher" element={<TeacherConsoleLayout />}>
            <Route index element={<TeacherEntryPage />} />
            <Route path="setup" element={<TeacherSetupPage />} />
            <Route path="lesson" element={<TeacherLessonPage />} />
            <Route path="academic" element={<TeacherAcademicPage />} />
            <Route path="growth" element={<TeacherGrowthPage />} />
            <Route path="courses" element={<TeacherCoursesPage />} />
            <Route path="classroom" element={<TeacherClassroomPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function PathSpy() {
  const { pathname } = useLocation()
  return <span data-testid="pathname">{pathname}</span>
}

function setup(initialEntry: string) {
  const view = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PathSpy />
      <TestApp />
    </MemoryRouter>,
  )
  return { view }
}

describe('A7 路由守卫集成', () => {
  beforeEach(() => {
    clearSession()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function expectPath(view: ReturnType<typeof render>, expected: string) {
    return waitFor(() => expect(view.getByTestId('pathname').textContent).toBe(expected))
  }

  describe('认证守卫', () => {
    it('未登录访问 /student 重定向到 /', async () => {
      const { view } = setup('/student')
      await expectPath(view, '/')
    })

    it('未登录访问 /teacher 重定向到 /', async () => {
      const { view } = setup('/teacher')
      await expectPath(view, '/')
    })
  })

  describe('角色隔离', () => {
    it('学生访问 /student 正常渲染', async () => {
      setSession({ token: validToken, profile: studentProfile })
      const { view } = setup('/student')
      await waitFor(() => expect(view.getByText(/王小雅，你来啦/)).toBeTruthy())
    })

    it('学生访问 /teacher 被拦截，看不到教师后台内容', async () => {
      setSession({ token: validToken, profile: studentProfile })
      const { view } = setup('/teacher')
      await waitFor(() => expect(view.queryByText(/新建课程/)).toBeFalsy())
    })

    it('教师访问 /teacher 正常渲染', async () => {
      setSession({ token: validToken, profile: teacherProfile })
      const { view } = setup('/teacher')
      await waitFor(() => expect(view.getByText(/新建课程/)).toBeTruthy())
    })

    it('教师访问 /student 被拦截，看不到学生主页内容', async () => {
      setSession({ token: validToken, profile: teacherProfile })
      const { view } = setup('/student')
      await waitFor(() => expect(view.queryByText(/王小雅/)).toBeFalsy())
    })

    it('token 有效但 profile 不完整时访问 /student 被拦截', async () => {
      sessionStorage.setItem('xx_session_token', validToken)
      sessionStorage.setItem('xx_session_profile', JSON.stringify({ id: 'x', name: 'x' }))
      const { view } = setup('/student')
      await expectPath(view, '/')
    })
  })

  describe('已登录用户访问公开页', () => {
    it('学生访问 / 重定向到 /student', async () => {
      setSession({ token: validToken, profile: studentProfile })
      const { view } = setup('/')
      await expectPath(view, '/student')
    })

    it('学生访问 /login 重定向到 /student', async () => {
      setSession({ token: validToken, profile: studentProfile })
      const { view } = setup('/login')
      await expectPath(view, '/student')
    })

    it('教师访问 / 重定向到 /teacher', async () => {
      setSession({ token: validToken, profile: teacherProfile })
      const { view } = setup('/')
      await expectPath(view, '/teacher')
    })

    it('教师访问 /login 重定向到 /teacher', async () => {
      setSession({ token: validToken, profile: teacherProfile })
      const { view } = setup('/login')
      await expectPath(view, '/teacher')
    })
  })
})
