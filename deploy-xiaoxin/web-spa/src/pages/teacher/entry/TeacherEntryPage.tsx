import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { TeacherAvatar } from '@/components/art/TeacherAvatar'
import { clearSession } from '@/stores/session'

const options = [
  {
    to: '/teacher/setup',
    title: '我要建设新班级',
    desc: '录入地区与学校信息，导入学生名单、照片和学情数据，从零建立班级档案。',
    action: '开始建班',
  },
  {
    to: '/teacher/courses',
    title: '我要管理老班级',
    desc: '进入已有班级，查看学情档案、成长档案与往期课程，继续本周的思政课。',
    action: '进入班级',
  },
]

export function TeacherEntryPage() {
  const navigate = useNavigate()

  const backToLogin = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative mx-auto max-w-4xl px-5 py-10">
      <img
        src="/design/leaves.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-4 hidden w-80 opacity-70 lg:block"
      />
      <button
        onClick={backToLogin}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand"
      >
        <Icon name="arrow-left" size={16} />
        返回登录
      </button>
      <div className="mt-4 text-center">
        <span className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 shadow-card">
          <TeacherAvatar size={28} />
          <span className="text-sm font-semibold text-ink">李老师，欢迎回来</span>
        </span>
        <h1 className="font-cal mt-7 text-5xl tracking-[0.12em] text-brand-deep md:text-6xl">
          今天从哪里开始？
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft">
          建设一个新班级，或回到熟悉的班级继续陪孩子们聊梦想
        </p>
      </div>

      <div className="mt-14 flex flex-col items-center gap-7">
        {options.map((o, i) => (
          <Link
            key={o.to}
            to={o.to}
            className="group block w-full max-w-xl rounded-xl bg-brand-soft px-10 py-7 text-center shadow-card transition-all hover:-translate-y-1.5 hover:shadow-lift animate-rise"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <span className="font-cal text-4xl tracking-[0.18em] text-brand-deep md:text-[40px]">{o.title}</span>
            <span className="mt-2.5 block text-[13px] leading-6 text-ink-soft">{o.desc}</span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
              {o.action}
              <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-center text-xs leading-6 text-ink-faint">
        演示环境：班级数据为示例数据，操作不会影响真实学生信息
      </p>
    </div>
  )
}
