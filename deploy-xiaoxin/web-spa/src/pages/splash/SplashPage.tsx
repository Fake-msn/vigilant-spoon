import { Link, Navigate } from 'react-router-dom'
import { getSession, isStudentProfile } from '@/stores/session'

export function SplashPage() {
  const { profile } = getSession()

  if (profile) {
    const target = isStudentProfile(profile) ? '/student' : '/teacher'
    return <Navigate to={target} replace />
  }

  return (
    <Link
      to="/login"
      aria-label="点击进入登录流程"
      className="relative block h-[100svh] cursor-pointer select-none overflow-hidden bg-white"
    >
      {/* 梯田实拍背景（设计稿①原图） */}
      <img
        src="/design/hero-terrace.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[center_62%]"
      />

      {/* 顶部白雾过渡 */}
      <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-white via-white/82 to-transparent" aria-hidden />
      {/* 左右云雾 */}
      <img
        src="/design/cloud.png"
        alt=""
        aria-hidden
        className="absolute -left-16 top-[30%] w-72 opacity-80 md:w-96"
      />
      <img
        src="/design/cloud.png"
        alt=""
        aria-hidden
        className="absolute -right-20 top-[14%] w-80 opacity-70 md:w-[430px]"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* 纸飞机（设计稿①素材） */}
      <img
        src="/design/paper-planes.png"
        alt=""
        aria-hidden
        className="absolute right-[4%] top-[4%] w-40 animate-floaty md:w-64"
      />
      <img
        src="/design/paper-planes.png"
        alt=""
        aria-hidden
        className="absolute left-[2%] top-[10%] w-32 -scale-x-100 animate-floaty md:w-52"
        style={{ animationDelay: '1.4s' }}
      />

      {/* 主文案 */}
      <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="relative">
          <p className="font-cal text-7xl leading-none text-brand drop-shadow-[0_2px_0_rgba(255,255,255,0.8)] animate-rise md:text-[120px]">
            你好
            <span className="ml-3 inline-block align-top text-3xl text-brand/80 md:text-5xl" aria-hidden>
              ✦
            </span>
          </p>
          <p
            className="font-cal absolute -left-24 top-[46%] hidden rotate-[-10deg] text-4xl text-warm md:block md:text-5xl animate-pop"
            style={{ animationDelay: '0.5s' }}
            aria-hidden
          >
            Hello
          </p>
          <p
            className="font-cal mt-4 text-6xl leading-none tracking-wide text-brand drop-shadow-[0_2px_0_rgba(255,255,255,0.8)] animate-rise md:mt-6 md:text-[100px]"
            style={{ animationDelay: '0.18s' }}
          >
            我是<span className="text-brand-deep">小信</span>
            <span className="ml-2 inline-block align-top text-2xl text-brand/70 md:text-4xl" aria-hidden>
              ✦
            </span>
          </p>
        </div>

        <p
          className="mt-10 rounded-full bg-brand/85 px-6 py-2.5 text-sm font-semibold tracking-[0.2em] text-white shadow-btn backdrop-blur-sm animate-rise md:text-base"
          style={{ animationDelay: '0.4s' }}
        >
          点击页面任意区域，即可进入登录流程
        </p>
      </div>
    </Link>
  )
}
