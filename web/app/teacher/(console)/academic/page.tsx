import { academicRows, students } from '@/lib/data';
import { Icon } from '@/components/Icon';
import { KidAvatar, kidVariants } from '@/components/art/KidAvatar';

const relationStyle: Record<string, string> = {
  亲近: 'bg-mint-soft text-mint',
  一般: 'bg-warm-soft text-warm-deep',
  疏远: 'bg-red-50 text-red-500',
};

function Trend({ t }: { t: 'up' | 'down' | 'flat' }) {
  if (t === 'up') return <span className="text-mint" title="上升">▲</span>;
  if (t === 'down') return <span className="text-red-500" title="下滑">▼</span>;
  return <span className="text-ink-faint" title="平稳">—</span>;
}

export default function AcademicPage() {
  const avg = Math.round(
    academicRows.reduce((sum, r) => sum + r.scores.reduce((s, x) => s + x.score, 0) / r.scores.length, 0) /
      academicRows.length
  );
  const attention = academicRows.filter((r) => r.scores.some((s) => s.trend === 'down')).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-ink md:text-3xl">学情档案</h1>
          <p className="mt-2 text-sm text-ink-soft">
            成绩与背景信息会喂给 AI，让它在对话中讲清楚「你现在需要怎么努力」
          </p>
        </div>
        <div className="flex gap-2.5">
          <button className="btn-line !px-4 !py-2 text-xs">
            <Icon name="upload" size={14} />
            文件导入
          </button>
          <button className="btn-brand !px-4 !py-2 text-xs">
            <Icon name="plus" size={14} />
            手动录入
          </button>
        </div>
      </div>

      {/* 概览 */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: '在册学生', value: `${academicRows.length} 人`, icon: 'users' as const, color: 'bg-brand-soft text-brand' },
          { label: '班级平均分', value: `${avg} 分`, icon: 'chart' as const, color: 'bg-mint-soft text-mint' },
          { label: '成绩波动关注', value: `${attention} 人`, icon: 'eye' as const, color: 'bg-warm-soft text-warm-deep' },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3.5 p-5">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
              <Icon name={s.icon} size={22} />
            </span>
            <span>
              <span className="block text-xl font-black text-ink">{s.value}</span>
              <span className="mt-0.5 block text-xs font-medium text-ink-faint">{s.label}</span>
            </span>
          </div>
        ))}
      </div>

      {/* 学生学情表 */}
      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-brand-faint text-xs font-bold text-ink-soft">
                <th className="px-5 py-3.5">学生</th>
                <th className="px-4 py-3.5">语文</th>
                <th className="px-4 py-3.5">数学</th>
                <th className="px-4 py-3.5">英语</th>
                <th className="px-4 py-3.5">师生关系</th>
                <th className="px-5 py-3.5">背景信息（AI 对话上下文）</th>
              </tr>
            </thead>
            <tbody>
              {academicRows.map((r) => {
                const s = students.find((x) => x.id === r.id)!;
                const idx = students.indexOf(s);
                return (
                  <tr key={r.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-brand-faint/50">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3">
                        <span className="overflow-hidden rounded-xl" style={{ width: 38, height: 38 }}>
                          <KidAvatar v={kidVariants[idx % kidVariants.length]} size={38} />
                        </span>
                        <span>
                          <span className="block font-bold text-ink">{s.name}</span>
                          <span className="block text-[11px] text-ink-faint">
                            {s.grade} · {s.no}
                          </span>
                        </span>
                      </span>
                    </td>
                    {r.scores.map((sc) => (
                      <td key={sc.subject} className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-ink">
                          {sc.score}
                          <Trend t={sc.trend} />
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3.5">
                      <span className={`tag !text-[11px] ${relationStyle[r.relation]}`}>{r.relation}</span>
                    </td>
                    <td className="max-w-[300px] px-5 py-3.5 text-[13px] leading-6 text-ink-soft">{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line bg-brand-faint/60 px-5 py-3.5 text-xs leading-6 text-ink-soft">
          <Icon name="info" size={13} className="mr-1.5 inline-block align-[-2px] text-brand" />
          示例：王小雅想当蛋糕师而数学在下滑，AI 会自然聊到「做蛋糕要算配料，数学可不能落下哦」。
        </div>
      </div>
    </div>
  );
}
