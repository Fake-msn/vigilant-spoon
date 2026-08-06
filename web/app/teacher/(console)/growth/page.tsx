import { growthRows, students } from '@/lib/data';
import { Icon } from '@/components/Icon';
import { PixelArt } from '@/components/art/PixelArt';
import { petMap, petPalette, petPaletteCalm, petPaletteSad } from '@/components/art/pixelData';

const moodConf = {
  开心: { palette: petPalette, tag: 'bg-mint-soft text-mint', label: '心情很好' },
  平静: { palette: petPaletteCalm, tag: 'bg-brand-soft text-brand', label: '心情平静' },
  低落: { palette: petPaletteSad, tag: 'bg-slate-100 text-ink-faint', label: '有点低落' },
} as const;

function ScoreBars({ scores }: { scores: number[] }) {
  return (
    <span className="flex h-9 items-end gap-1" aria-label={`历次得分：${scores.join('、')}`}>
      {scores.map((v, i) => (
        <span
          key={i}
          className={`w-2 rounded-t-sm ${i === scores.length - 1 ? 'bg-brand' : 'bg-brand-soft'}`}
          style={{ height: `${Math.max(18, ((v - 50) / 50) * 100)}%` }}
          title={`第 ${i + 1} 次：${v} 分`}
        />
      ))}
    </span>
  );
}

export default function GrowthPage() {
  const signals = growthRows.filter((g) => g.signal);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-wide text-ink md:text-3xl">成长档案</h1>
          <p className="mt-2 text-sm text-ink-soft">
            电子宠物状态、历次对话得分与评估、心理信号，一眼掌握每个孩子
          </p>
        </div>
        <span className="tag bg-warm-soft text-warm-deep">
          <Icon name="eye" size={13} />
          {signals.length} 位同学需要关注
        </span>
      </div>

      {/* 心理信号提醒 */}
      {signals.length > 0 && (
        <div className="card mt-6 border-warm/40 bg-warm-soft/50 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-warm-deep">
            <Icon name="heart" size={16} />
            本周心理信号
          </p>
          <ul className="mt-3 space-y-2">
            {signals.map((g) => {
              const s = students.find((x) => x.id === g.id)!;
              return (
                <li key={g.id} className="flex items-start gap-2.5 text-[13.5px] leading-6 text-ink">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warm" />
                  <span>
                    <b>{s.name}</b>：{g.signal}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 学生成长卡片 */}
      <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {growthRows.map((g, i) => {
          const s = students.find((x) => x.id === g.id)!;
          const mood = moodConf[g.petMood];
          const last = g.scores[g.scores.length - 1];
          const delta = g.scores.length > 1 ? last - g.scores[g.scores.length - 2] : 0;
          return (
            <div key={g.id} className="card card-hover p-5 animate-rise" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start gap-4">
                {/* 宠物 */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className={g.petMood === '低落' ? 'opacity-80' : 'animate-floaty'}>
                    {s.dream === '蛋糕师' ? (
                      <img src="/design/pet-baker.png" alt={`${s.name} 的电子宠物`} width={64} className="drop-shadow-sm" />
                    ) : (
                      <PixelArt map={petMap} palette={mood.palette} size={64} title={`${s.name} 的像素小宠物`} />
                    )}
                  </span>
                  <span className="tag !px-2 !py-0.5 !text-[10px] bg-slate-100 text-ink-soft">Lv.{g.petLevel}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-black text-ink">{s.name}</p>
                    <span className={`tag !text-[11px] ${mood.tag}`}>{mood.label}</span>
                    {g.signal && (
                      <span className="tag !text-[11px] bg-red-50 text-red-500">
                        <Icon name="eye" size={11} />
                        需关注
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    {s.grade} · 梦想：{s.dream ?? '还没说出来'}
                  </p>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-ink-faint">历次对话得分</p>
                      <div className="mt-1.5 flex items-end gap-2.5">
                        <ScoreBars scores={g.scores} />
                        <span className="text-lg font-black tabular-nums text-ink">
                          {last}
                          {delta !== 0 && (
                            <span className={`ml-1 text-xs font-bold ${delta > 0 ? 'text-mint' : 'text-red-500'}`}>
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-ink-faint">成长值</p>
                      <p className="mt-1 text-lg font-black tabular-nums text-brand">{g.growth}</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-brand-faint/70 px-3.5 py-2.5 text-[13px] leading-6 text-ink-soft">
                <b className="text-ink">AI 评估：</b>
                {g.evalSummary}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
