import type { RouteObject } from 'react-router-dom'
import { Navigate, createBrowserRouter, Outlet, useLocation } from 'react-router-dom'
import { getSession, isAuthenticated, isStudentProfile } from '@/stores/session'
import { SplashPage } from '@/pages/splash/SplashPage'
import { LoginPage } from '@/pages/login/LoginPage'
import { IdentityPage } from '@/pages/identity/IdentityPage'
import { TeacherLoginPage } from '@/pages/teacher/login/TeacherLoginPage'
import { TeacherRegisterPage } from '@/pages/teacher/register/TeacherRegisterPage'
import { StudentHomePage } from '@/pages/student/home/StudentHomePage'
import { VoicePage } from '@/pages/student/voice/VoicePage'
import { LetterListPage } from '@/pages/feedback/LetterListPage'
import { LetterDetailPage } from '@/pages/feedback/LetterDetailPage'
import { GrowthPage } from '@/pages/student/growth/GrowthPage'
import { TeacherConsoleLayout } from '@/layouts/TeacherConsoleLayout'
import { TeacherEntryPage } from '@/pages/teacher/entry/TeacherEntryPage'
import { TeacherSetupPage } from '@/pages/teacher/setup/TeacherSetupPage'
import { TeacherAccountPage } from '@/pages/teacher/account/TeacherAccountPage'
import { TeacherLessonPage } from '@/pages/teacher/lesson/TeacherLessonPage'
import { TeacherAcademicPage } from '@/pages/teacher/academic/TeacherAcademicPage'
import { TeacherGrowthPage } from '@/pages/teacher/growth/TeacherGrowthPage'
import { TeacherCoursesPage } from '@/pages/teacher/courses/TeacherCoursesPage'
import { TeacherClassroomPage } from '@/pages/teacher/classroom/TeacherClassroomPage'
import { AdminConfigPage } from '@/pages/admin/AdminConfigPage'

function ProtectedLayout() {
  const location = useLocation()
  const pathname = location.pathname

  console.log(`[ProtectedLayout] 挂载 · 目标路径: ${pathname}`)

  const { token, profile } = getSession()
  const hasToken = !!token
  const hasProfile = !!profile
  const profileRole = !profile ? 'none' : isStudentProfile(profile) ? 'student' : profile.role

  console.log(
    `[ProtectedLayout] 会话状态 · token存在: ${hasToken} · profile存在: ${hasProfile} · role: ${profileRole}`,
  )

  const authenticated = isAuthenticated()
  console.log(`[ProtectedLayout] token 校验结果: ${authenticated}`)

  if (!authenticated) {
    console.warn(`[ProtectedLayout] 未认证，拦截并跳转 / · 来源: ${pathname}`)
    return <Navigate to="/" replace state={{ from: pathname }} />
  }

  console.log(`[ProtectedLayout] 认证通过，渲染子路由 · 目标路径: ${pathname}`)
  return <Outlet />
}

function StudentGuard() {
  const { profile } = getSession()
  if (!profile || !isStudentProfile(profile)) {
    console.warn('[StudentGuard] 非学生角色，拦截并跳转 /')
    return <Navigate to="/" replace />
  }
  console.log('[StudentGuard] 学生角色通过')
  return <Outlet />
}

function TeacherGuard() {
  const { profile } = getSession()
  if (!profile || isStudentProfile(profile)) {
    console.warn('[TeacherGuard] 非教师角色，拦截并跳转 /')
    return <Navigate to="/" replace />
  }
  console.log('[TeacherGuard] 教师角色通过')
  return <Outlet />
}

export const routes: RouteObject[] = [
  { path: '/', element: <SplashPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/identity', element: <IdentityPage /> },
  { path: '/teacher/login', element: <TeacherLoginPage /> },
  { path: '/teacher/register', element: <TeacherRegisterPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <StudentGuard />,
        children: [
          { path: '/student', element: <StudentHomePage /> },
          { path: '/student/voice', element: <VoicePage /> },
          { path: '/student/letters', element: <LetterListPage /> },
          { path: '/student/letters/:id', element: <LetterDetailPage /> },
          { path: '/student/growth', element: <GrowthPage /> },
        ],
      },
      {
        element: <TeacherGuard />,
        children: [
          {
            path: '/teacher',
            element: <TeacherConsoleLayout />,
            children: [
              { index: true, element: <TeacherEntryPage /> },
              { path: 'setup', element: <TeacherSetupPage /> },
              { path: 'account', element: <TeacherAccountPage /> },
              { path: 'lesson', element: <TeacherLessonPage /> },
              { path: 'academic', element: <TeacherAcademicPage /> },
              { path: 'growth', element: <TeacherGrowthPage /> },
              { path: 'courses', element: <TeacherCoursesPage /> },
              { path: 'classroom', element: <TeacherClassroomPage /> },
            ],
          },
        ],
      },
      { path: '/admin', element: <AdminConfigPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter(routes)
