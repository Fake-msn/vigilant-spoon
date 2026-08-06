import Link from 'next/link';
import { notFound } from 'next/navigation';
import { letters } from '@/lib/data';
import { Icon } from '@/components/Icon';
import { PixelArt } from '@/components/art/PixelArt';
import { petMap, petPalette } from '@/components/art/pixelData';

export function generateStaticParams() {
  return letters.map((l) => ({ id: l.id }));
}

export default async function LetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idx = letters.findIndex((l) => l.id === id);
  if (idx === -1) notFound();
  const letter = letters[idx];
  const prev = letters[idx + 1];
  const next = letters[idx - 1];

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link href="/mailbox" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-brand">
        <Icon name="arrow-left" size={16} />
        返回信箱
      </Link>

      {/* 信纸 */}
      <article className="relative mt-6 overflow-hidden rounded-xl border border-warm/25 bg-[#fffdf7] shadow-card animate-rise">
        {/* 信封口装饰条 */}
        <div
          className="h-3 w-full"
          style={{
            background:
              'repeating-linear-gradient(135deg, #f59e0b 0 14px, #fffdf7 14px 28px, #3e8e41 28px 42px, #fffdf7 42px 56px)',
          }}
          aria-hidden
        />

        <div className="px-7 py-8 md:px-12 md:py-10">
          {/* 邮票 + 邮戳 */}
          <div className="flex items-start justify-between">
            <div>
              <span className="tag bg-warm-soft text-warm-deep">
                <Icon name="letter" size={13} />
                {letter.week}
              </span>
              <p className="mt-3 text-xs font-medium tracking-wide text-ink-faint">
                {letter.date} · 由「小信」寄出
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-lg border-2 border-dashed border-warm/40 bg-white p-2 rotate-3">
                <PixelArt map={petMap} palette={petPalette} size={44} title="梦想小宠物邮票" />
              </span>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-ink-faint">梦想邮政</span>
            </div>
          </div>

          {/* 正文 */}
          <div className="mt-8 space-y-5">
            {letter.body.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? 'text-[17px] font-bold leading-8 text-ink'
                    : 'indent-8 text-[15.5px] leading-8 text-ink'
                }
              >
                {p}
              </p>
            ))}
          </div>

          {/* 落款 */}
          <div className="mt-10 flex flex-col items-end gap-1 text-right">
            <p className="text-[15px] font-semibold text-ink">一直陪着你的</p>
            <p className="font-cal text-4xl tracking-wide text-brand-deep">小信</p>
            <p className="text-xs text-ink-faint">{letter.date}</p>
          </div>
        </div>

        {/* 信纸底部横线装饰 */}
        <div className="border-t border-dashed border-warm/25 bg-warm-soft/40 px-7 py-4 text-center text-xs font-medium text-warm-deep md:px-12">
          读完这封信，去和小信聊聊本周的新故事吧
        </div>
      </article>

      {/* 上一封 / 下一封 */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {prev ? (
          <Link href={`/mailbox/${prev.id}`} className="btn-line !px-5 !py-2.5 text-sm">
            <Icon name="arrow-left" size={16} />
            {prev.week}
          </Link>
        ) : (
          <span />
        )}
        <Link href="/chat" className="btn-brand !px-6 !py-2.5 text-sm">
          <Icon name="mic" size={16} />
          去和小信聊聊
        </Link>
        {next ? (
          <Link href={`/mailbox/${next.id}`} className="btn-line !px-5 !py-2.5 text-sm">
            {next.week}
            <Icon name="arrow-right" size={16} />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
