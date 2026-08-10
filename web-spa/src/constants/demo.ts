/**
 * 演示模式预置常量。
 * 所有演示账号/班级码/密码等硬编码值集中到此文件，禁止在组件内散落书写。
 */
export const DEMO = {
  /** localStorage key: 'formal' | 'demo' */
  LOGIN_MODE_KEY: 'xx_login_mode' as const,
  /** 默认演示班级码 */
  CLASS: 'LTZ2024',
  /** 演示教师姓名 */
  TEACHER: '李老师',
  /** 演示学生姓名（IdentityPage 默认高亮的选中） */
  STUDENT: '王小雅',
  /** 管理员面板演示快速登录密码 */
  ADMIN_PASSWORD: 'admin123',
} as const

export type LoginMode = 'formal' | 'demo'

/** 从 localStorage 读当前模式，不存在或非法值都返回 'formal' */
export function getLoginMode(): LoginMode {
  try {
    const raw = localStorage.getItem(DEMO.LOGIN_MODE_KEY)
    return raw === 'demo' ? 'demo' : 'formal'
  } catch {
    return 'formal'
  }
}

/** 写 localStorage，返回写入后的新值 */
export function setLoginMode(next: LoginMode): LoginMode {
  try {
    localStorage.setItem(DEMO.LOGIN_MODE_KEY, next)
  } catch {
    /* ignore storage errors (private mode etc.) */
  }
  return next
}

/** 翻转模式，formal → demo，demo → formal，返回新值 */
export function toggleLoginMode(): LoginMode {
  const cur = getLoginMode()
  const next: LoginMode = cur === 'formal' ? 'demo' : 'formal'
  return setLoginMode(next)
}
