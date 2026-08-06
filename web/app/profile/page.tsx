import Link from 'next/link';
import { chatHistory, promises, students } from '@/lib/data';
import { Icon } from '@/components/Icon';
import { PixelArt } from '@/components/art/PixelArt';
import { petMap, petPalette } from '@/components/art/pixelData';
import { KidAvatar, kidVariants } from '@/components/art/KidAvatar';

const stats = [
  { icon: 'chat' as const, value: '5 次', label: '谈心次数', color: 'text-brand bg-brand-soft' },
  { icon: 'star' as const, value: '128', label: '成长值', color: 'text-warm-deep bg-warm-soft' },
  { icon: 'flame' as const, value: '3 天', label: '连续打卡', color: 'text-grape bg-grape-soft' },
];

export default function ProfilePage() {
  const me = students[0];
  const avatar = kidVariants[0];

  return (
    <div className="relative mx-auto w-full max-w-[1760px] px-6 py-8 lg:px-10">
      <img src="/design/leaves.png" alt="" aria-hidden className="pointer-events-none absolute -right-6 -top-2 hidden w-64 opacity-60 xl:block" />
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand">
        <Icon name="arrow-left" size={16} />
        返回主页
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cal text-5xl tracking-[0.1em] text-brand-deep">我的成长档案</h1>
          <p className="mt-3 text-[15px] text-ink-soft">每一次谈心、每一个承诺，都在这里好好保存着。</p>
        </div>
        <Link href="/mailbox" className="btn-line !px-5 !py-2.5 text-sm">
          <Icon name="letter" size={16} />
          我的信箱
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">1</span>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
        {/* 学生卡 + 统计 */}
        <div className="flex flex-col gap-5">
          <div className="card flex flex-col items-center gap-3 p-6 text-center">
            <span className="overflow-hidden rounded-xl border-4 border-brand-soft" style={{ width: 104, height: 104 }}>
              <KidAvatar v={avatar} size={104} />
            </span>
            <div>
              <p className="text-xl font-black text-ink">{me.name}</p>
              <p className="mt-1 text-sm text-ink-soft">{me.grade} · 龙头山镇中心小学</p>
            </div>
            <span className="tag bg-grape-soft text-grape">
              <Icon name="sparkles" size={13} />
              梦想：{me.dream}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="card flex flex-col items-center gap-2 p-4">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                  <Icon name={s.icon} size={18} />
                </span>
                <span className="text-lg font-black text-ink">{s.value}</span>
                <span className="text-[11px] font-medium text-ink-faint">{s.label}</span>
              </div>
            ))}
          </div>
          {/* 成长值进度 */}
          <div className="card p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-ink">成长值进度</span>
              <span className="font-semibold text-brand">128 / 150</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-brand-soft">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-brand to-grape" />
            </div>
            <p className="mt-2.5 text-xs leading-5 text-ink-faint">再得 22 成长值，小宠物就能升级啦</p>
          </div>
        </div>

        {/* 电子宠物（设计稿⑬） */}
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-b from-grape-soft/60 to-white p-7 text-center">
          <p className="w-full text-left text-sm font-bold text-ink">我的电子宠物</p>
          <span className="rounded-xl border-2 border-dashed border-grape/30 bg-white/70 px-6 py-4 animate-floaty">
            <img src="/design/pet-baker.png" alt="蛋糕师电子宠物" width={185} className="drop-shadow-md" />
          </span>
          <span className="tag bg-grape-soft text-grape">{me.dream} · {me.name}</span>
          <div className="mt-1 flex w-full items-center justify-between rounded-lg bg-white/80 border border-line px-4 py-3">
            <span className="flex items-center gap-2.5">
              <PixelArt map={petMap} palette={petPalette} size={40} title="小信伙伴" />
              <span className="text-left">
                <span className="block text-sm font-bold text-ink">蛋糕师小宠物</span>
                <span className="block text-xs text-mint font-medium">心情不错 · Lv.2</span>
              </span>
            </span>
            <Icon name="heart" size={18} className="text-red-400" fill="currentColor" />
          </div>
        </div>

        {/* 承诺 + 谈心记录 */}
        <div className="flex flex-col gap-5">
          <div className="card p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Icon name="target" size={16} className="text-brand" />
              我的承诺
            </p>
            <ul className="mt-4 space-y-3">
              {promises.map((p) => (
                <li key={p.text} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      p.done ? 'border-mint bg-mint text-white' : 'border-line bg-white text-transparent'
                    }`}
                  >
                    <Icon name="check" size={13} />
                  </span>
                  <span className={`text-sm leading-6 ${p.done ? 'text-ink-faint line-through' : 'text-ink'}`}>
                    {p.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card flex-1 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <Icon name="clock" size={16} className="text-brand" />
              谈心记录
            </p>
            <ol className="mt-4 space-y-0">
              {chatHistory.map((c, i) => (
                <li key={c.date + c.topic} className="relative flex gap-3.5 pb-4 last:pb-0">
                  {i < chatHistory.length - 1 && (
                    <span className="absolute left-[7px] top-5 h-full w-px bg-line" aria-hidden />
                  )}
                  <span className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] ${i === 0 ? 'border-brand bg-brand-soft' : 'border-line bg-white'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{c.topic}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {c.date} · {c.mins} 分钟 · 心情{c.mood}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
