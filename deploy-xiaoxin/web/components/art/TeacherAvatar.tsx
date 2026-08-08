export function TeacherAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-label="老师头像">
      <rect width="96" height="96" rx="48" fill="#e0e7ff" />
      <path d="M24 96c0-14 10-22 24-22s24 8 24 22Z" fill="#4f46e5" />
      <rect x="43" y="64" width="10" height="10" rx="4" fill="#f5c9a0" />
      <circle cx="48" cy="48" r="20" fill="#f5c9a0" />
      <path d="M29 44c-1-13 8-21 19-21s20 8 19 21c-2-5-4-8-7-9-2 2-7 3-12 3s-10-1-12-3c-3 1-5 4-7 9Z" fill="#44403c" />
      <circle cx="40" cy="50" r="5.5" fill="none" stroke="#1e293b" strokeWidth="2" />
      <circle cx="56" cy="50" r="5.5" fill="none" stroke="#1e293b" strokeWidth="2" />
      <path d="M45.5 50h5" stroke="#1e293b" strokeWidth="2" />
      <circle cx="40" cy="50" r="1.8" fill="#1e293b" />
      <circle cx="56" cy="50" r="1.8" fill="#1e293b" />
      <path d="M43 59c2 2 8 2 10 0" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
