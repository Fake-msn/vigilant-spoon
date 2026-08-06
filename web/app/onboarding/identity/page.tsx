'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { students } from '@/lib/data';
import { Icon } from '@/components/Icon';
import { KidAvatar, kidVariants } from '@/components/art/KidAvatar';

export default function IdentityPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(
    () => students.filter((s) => !keyword.trim() || s.name.includes(keyword.trim())),
    [keyword]
  );

  const go = () => {
    if (!selected) return;
    router.push(`/home?s=${selected}`);
  };

  return (
    <div className="relative mx-auto w-full max-w-[1760px] overflow-x-clip px-6 py-10 lg:px-10">
      <img src="/design/leaves.png" alt="" aria-hidden className="pointer-events-none absolute -right-10 -top-6 hidden w-72 opacity-70 lg:block" />
      <img src="/design/cloud.png" alt="" aria-hidden className="pointer-events-none absolute -left-24 bottom-0 hidden w-72 opacity-40 lg:block" />
      <div className="text-center">
        <span className="tag bg-brand-soft text-brand">龙头山镇中心小学 · 李老师的班级</span>
        <h1 className="font-cal mt-5 text-5xl tracking-[0.12em] text-brand-deep md:text-6xl">
          你是谁呀？
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft">
          找到你的名字和照片，点一下就能开始今天的谈心
        </p>
      </div>

      {/* 搜索 */}
      <div className="relative mx-auto mt-8 max-w-md">
        <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索你的名字…"
          aria-label="搜索你的名字"
          className="input-soft !rounded-full !pl-11"
        />
      </div>

      {/* 学生卡片 */}
      {filtered.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
          {filtered.map((s, i) => {
            const v = kidVariants[students.indexOf(s) % kidVariants.length];
            const active = selected === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                aria-pressed={active}
                className={`card group flex flex-col items-center gap-3 !bg-brand-soft/55 p-5 transition-all ${
                  active
                    ? '!border-brand !bg-brand-soft ring-4 ring-brand/15 shadow-lift -translate-y-1'
                    : 'card-hover'
                }`}
              >
                <span className="relative overflow-hidden rounded-lg border-4 border-white shadow-card" style={{ width: 96, height: 96 }}>
                  <KidAvatar v={v} size={88} />
                  {active && (
                    <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white animate-pop">
                      <Icon name="check" size={14} />
                    </span>
                  )}
                </span>
                <span className="text-center">
                  <span className={`block text-lg font-bold ${active ? 'text-brand' : 'text-ink'}`}>
                    {s.name}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink-faint">
                    <Icon name="book" size={12} />
                    {s.grade}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card mx-auto mt-10 flex max-w-sm flex-col items-center gap-2 p-10 text-center">
          <Icon name="search" size={26} className="text-ink-faint" />
          <p className="font-bold text-ink">没有找到这个名字</p>
          <p className="text-sm text-ink-soft">检查一下是不是写错了，或者问问老师哦</p>
        </div>
      )}

      {/* 底部翻页 */}
      <div className="mt-12 flex items-center justify-between">
        <Link href="/login" className="btn-line !px-6 !py-2.5 text-sm">
          <Icon name="arrow-left" size={16} />
          上一页
        </Link>
        <span className="text-sm text-ink-faint">
          {selected ? `已选择：${students.find((s) => s.id === selected)?.name}` : '点一张卡片选择自己吧'}
        </span>
        <button onClick={go} disabled={!selected} className="btn-brand !px-6 !py-2.5 text-sm">
          进入课堂
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}
