'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { regions, students } from '@/lib/data';
import { Icon } from '@/components/Icon';
import { KidAvatar, kidVariants } from '@/components/art/KidAvatar';

function HomeInner() {
  const sp = useSearchParams();
  const student = useMemo(
    () => students.find((s) => s.id === sp.get('s')) ?? students[0],
    [sp]
  );
  // 地区由老师建班时录入（班级统一）
  const region = regions[0];
  const avatar = kidVariants[students.indexOf(student) % kidVariants.length];
  const qs = `?s=${student.id}`;

  const entries = [
    {
      href: '/mailbox',
      icon: 'letter' as const,
      iconBox: 'bg-sky-100 text-sky-600',
      text: `${student.name}，想看看给你的信吗？我已经写好啦～`,
      action: '去信箱查收',
      badge: '1 封未读',
    },
    {
      href: `/chat${qs}`,
      icon: 'chat' as const,
      iconBox: 'bg-sky-100 text-sky-600',
      text: `${student.name}，想分享最近的见闻吗？我很乐意倾听～`,
      action: '和小信聊聊',
    },
  ];

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-page">
      <img src="/design/leaves.png" alt="" aria-hidden className="absolute -right-14 -top-8 w-80 opacity-80 md:w-96" />
      <img src="/design/cloud.png" alt="" aria-hidden className="absolute -left-14 bottom-6 w-80 opacity-45" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-14 md:py-20 lg:px-10">
        {/* 学生问候 */}
        <div className="flex items-center gap-5">
          <span className="shrink-0 overflow-hidden rounded-xl border-4 border-white shadow-card" style={{ width: 84, height: 84 }}>
            <KidAvatar v={avatar} size={76} />
          </span>
          <div>
            <h1 className="font-cal text-4xl tracking-[0.08em] text-brand-deep md:text-5xl">
              {student.name}，你来啦
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              {student.grade} · {region.name} · 小信一直在这里等你
            </p>
          </div>
        </div>

        {/* 两个入口（设计稿⑪） */}
        <div className="mt-12 flex flex-col gap-6">
          {entries.map((e, i) => (
            <Link
              key={e.href}
              href={e.href}
              className="group flex items-center gap-5 rounded-xl border border-line bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift md:p-7 animate-rise"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg ${e.iconBox}`}>
                <Icon name={e.icon} size={32} />
                {e.badge && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {e.badge}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold leading-8 text-ink md:text-xl">{e.text}</span>
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  {e.action}
                  <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          ))}
        </div>

        {/* 次级入口 */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand"
          >
            <Icon name="archive" size={15} />
            我的成长档案
          </Link>
          <Link
            href="/onboarding/identity"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-faint transition-colors hover:text-brand"
          >
            <Icon name="refresh" size={14} />
            换个同学进入
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StudentHomePage() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
