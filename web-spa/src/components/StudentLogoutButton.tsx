import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { clearSession } from '@/stores/session'

/**
 * 学生端页面左上角统一使用的「退出登录」按钮。
 * 点击后清空会话并跳转回登录首页（Splash/Login），便于快速切换同学/模式。
 */
export function StudentLogoutButton({ className = '' }: { className?: string }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand ${className}`}
      title="退出登录，返回首页"
    >
      <Icon name="logout" size={13} />
      退出登录
    </button>
  )
}
