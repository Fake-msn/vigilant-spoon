// 扁平插画风儿童头像（参数化，8 个变体）
export type KidVariant = {
  bg: string;
  hair: string;
  shirt: string;
  style: 'bob' | 'short' | 'pigtails' | 'bun' | 'curly' | 'bangs';
  skin?: string;
};

export const kidVariants: KidVariant[] = [
  { bg: '#dbeafe', hair: '#3b2f2f', shirt: '#f472b6', style: 'bob' },
  { bg: '#fef3c7', hair: '#1f2937', shirt: '#60a5fa', style: 'short' },
  { bg: '#fce7f3', hair: '#4a3226', shirt: '#fbbf24', style: 'pigtails' },
  { bg: '#dcfce7', hair: '#111827', shirt: '#34d399', style: 'bun' },
  { bg: '#ede9fe', hair: '#292524', shirt: '#a78bfa', style: 'curly' },
  { bg: '#ffedd5', hair: '#44403c', shirt: '#fb923c', style: 'bangs' },
  { bg: '#cffafe', hair: '#1c1917', shirt: '#22d3ee', style: 'short' },
  { bg: '#fee2e2', hair: '#3f3f46', shirt: '#f87171', style: 'pigtails' },
];

export function KidAvatar({ avatarSeed, size = 96 }: { avatarSeed: number; size?: number }) {
  const v = kidVariants[Math.abs(avatarSeed) % kidVariants.length];
  const skin = v.skin ?? '#ffd9b3';
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-label="学生头像">
      <rect width="96" height="96" fill={v.bg} />
      {/* 身体 */}
      <path d="M24 96c0-14 10-22 24-22s24 8 24 22Z" fill={v.shirt} />
      <path d="M42 76h12l-6 7Z" fill="#fff" opacity="0.85" />
      {/* 脖子 */}
      <rect x="43" y="64" width="10" height="10" rx="4" fill={skin} />
      {/* 脸 */}
      <circle cx="48" cy="48" r="20" fill={skin} />
      {/* 发型 */}
      {v.style === 'bob' && (
        <path d="M28 52c-2-18 8-28 20-28s22 10 20 28c-1-4-3-6-4-10-2 3-8 5-16 5s-14-2-16-5c-1 4-3 6-4 10Z" fill={v.hair} />
      )}
      {v.style === 'short' && (
        <path d="M29 46c-1-14 8-22 19-22s20 8 19 22c-2-6-5-9-8-10-1 2-6 4-11 4s-10-2-11-4c-3 1-6 4-8 10Z" fill={v.hair} />
      )}
      {v.style === 'pigtails' && (
        <>
          <path d="M29 48c-1-15 8-23 19-23s20 8 19 23c-2-6-4-9-7-10-2 2-6 3-12 3s-10-1-12-3c-3 1-5 4-7 10Z" fill={v.hair} />
          <circle cx="24" cy="56" r="7" fill={v.hair} />
          <circle cx="72" cy="56" r="7" fill={v.hair} />
          <circle cx="24" cy="50" r="2.5" fill="#f472b6" />
          <circle cx="72" cy="50" r="2.5" fill="#f472b6" />
        </>
      )}
      {v.style === 'bun' && (
        <>
          <path d="M29 46c-1-14 8-22 19-22s20 8 19 22c-2-6-5-9-8-10-1 2-6 4-11 4s-10-2-11-4c-3 1-6 4-8 10Z" fill={v.hair} />
          <circle cx="48" cy="24" r="7" fill={v.hair} />
          <circle cx="48" cy="24" r="3" fill="#fbbf24" />
        </>
      )}
      {v.style === 'curly' && (
        <>
          <circle cx="34" cy="34" r="8" fill={v.hair} />
          <circle cx="48" cy="29" r="9" fill={v.hair} />
          <circle cx="62" cy="34" r="8" fill={v.hair} />
          <circle cx="30" cy="44" r="6" fill={v.hair} />
          <circle cx="66" cy="44" r="6" fill={v.hair} />
        </>
      )}
      {v.style === 'bangs' && (
        <path d="M28 48c-1-15 8-23 20-23s21 8 20 23c-1-3-2-5-3-7-1 3-3 5-5 5s-2-3-4-5c-2 2-4 4-8 4s-6-2-8-4c-2 2-2 4-4 5s-4-2-5-5c-1 2-2 4-3 7Z" fill={v.hair} />
      )}
      {/* 五官 */}
      <circle cx="41" cy="50" r="2.2" fill="#1e293b" />
      <circle cx="55" cy="50" r="2.2" fill="#1e293b" />
      <circle cx="37" cy="56" r="2.6" fill="#fda4af" opacity="0.7" />
      <circle cx="59" cy="56" r="2.6" fill="#fda4af" opacity="0.7" />
      <path d="M44 57c1.5 1.6 6.5 1.6 8 0" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
