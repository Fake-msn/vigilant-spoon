import { useNavigate } from 'react-router-dom'
import { getLoginMode, toggleLoginMode, type LoginMode } from '@/constants/demo'
import { Icon } from '@/components/Icon'

type DemoModeToggleProps =
  | {
      /** switch-content: 仅写 localStorage + 触发回调，由父组件基于模式重新渲染内容。用于 LoginPage。 */
      variant: 'switch-content'
      /** 模式变更时的回调，父组件用它更新本地 state 触发重渲染 */
      onModeChange: (next: LoginMode) => void
    }
  | {
      /** navigate-home: 写 localStorage + 跳 /login（replace）。用于 IdentityPage、teacher 登录注册、admin 登录屏等子页。 */
      variant: 'navigate-home'
    }

export function DemoModeToggle(props: DemoModeToggleProps) {
  const navigate = useNavigate()
  const mode = getLoginMode()

  const handleClick = () => {
    const next = toggleLoginMode()
    if (props.variant === 'switch-content') {
      props.onModeChange(next)
    } else {
      navigate('/login', { replace: true })
    }
  }

  const formalLabel = (
    <>
      <Icon name="sparkles" size={14} />
      <span>演示模式</span>
    </>
  )
  const demoLabel = (
    <>
      <Icon name="home" size={14} />
      <span>正式模式</span>
    </>
  )

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={mode === 'formal' ? '切换到演示模式' : '切换到正式模式'}
      className="btn-line absolute top-5 right-5 z-20 !h-8 !px-3.5 text-xs font-medium tracking-wide rounded-full inline-flex items-center gap-1.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      {mode === 'formal' ? formalLabel : demoLabel}
    </button>
  )
}
