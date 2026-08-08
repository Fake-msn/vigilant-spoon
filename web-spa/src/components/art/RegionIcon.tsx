// 六个地区的插画小图标
export type RegionKey = 'yunnan' | 'guizhou' | 'sichuan' | 'gansu' | 'shaanxi' | 'guangxi';

const themes: Record<RegionKey, { sky: string; land: string; sun: string }> = {
  yunnan: { sky: '#dbeafe', land: '#2b6cf0', sun: '#fbbf24' },
  guizhou: { sky: '#dcfce7', land: '#16a34a', sun: '#fbbf24' },
  sichuan: { sky: '#ede9fe', land: '#8b5cf6', sun: '#fb923c' },
  gansu: { sky: '#fef3c7', land: '#d97706', sun: '#f59e0b' },
  shaanxi: { sky: '#ffedd5', land: '#b45309', sun: '#fbbf24' },
  guangxi: { sky: '#cffafe', land: '#0d9488', sun: '#fb923c' },
};

export function RegionIcon({ k, size = 56 }: { k: RegionKey; size?: number }) {
  const t = themes[k];
  return (
    <svg viewBox="0 0 56 56" width={size} height={size} role="img" aria-label="地区图标">
      <rect width="56" height="56" rx="14" fill={t.sky} />
      <circle cx="42" cy="16" r="5" fill={t.sun} />
      {k === 'yunnan' && (
        <>
          <path d="M6 44 18 24l8 12 6-8 18 16Z" fill={t.land} />
          <path d="M18 24l4 6h-8Z" fill="#fff" opacity="0.7" />
        </>
      )}
      {k === 'guizhou' && (
        <>
          <path d="M8 30c8-4 32-4 40 0" stroke={t.land} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M10 37c7-3.5 29-3.5 36 0" stroke={t.land} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.75" />
          <path d="M13 44c6-3 24-3 30 0" stroke={t.land} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.5" />
        </>
      )}
      {k === 'sichuan' && (
        <>
          <path d="M10 26c6 4 30 4 36 0-2 12-8 20-18 20S12 38 10 26Z" fill={t.land} />
          <path d="M20 30c2 2 14 2 16 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        </>
      )}
      {k === 'gansu' && (
        <>
          <path d="M6 44c8-10 14-12 22-6s14 4 22-2v8Z" fill={t.land} />
          <path d="M14 40c4-4 8-5 12-2" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
        </>
      )}
      {k === 'shaanxi' && (
        <>
          <path d="M8 44V32c10-6 30-6 40 0v12Z" fill={t.land} />
          <path d="M22 44v-8a6 6 0 0 1 12 0v8Z" fill={t.sky} />
          <circle cx="28" cy="34" r="1.6" fill={t.land} />
        </>
      )}
      {k === 'guangxi' && (
        <>
          <path d="M4 44c6-8 12-10 16-4s10 6 16 0 10-6 16 2v2Z" fill={t.land} />
          <path d="M12 36v-6M18 34v-6M24 36v-6" stroke={t.land} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </>
      )}
    </svg>
  );
}
