import { PetSprite, petSpriteData, type PetSpecies, type PetState } from '@/components/art';

const SPECIES: PetSpecies[] = [
  'sprout', 'baker', 'soldier', 'scientist', 'teacher', 'doctor', 'painter',
  'police', 'firefighter', 'pilot', 'astronaut', 'engineer', 'musician', 'athlete', 'writer', 'cat',
];
const STATES: { key: PetState; label: string }[] = [
  { key: 'daily', label: '日常' },
  { key: 'cheer', label: '欢呼' },
  { key: 'gray', label: '低落' },
];

export function PetPreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">🐾 小信伙伴 · 职业宠物预览</h1>
        <p className="text-slate-500 mb-8">用于 LTZ2024 班级学生梦想·宠物匹配审核</p>

        {/* 第一行：7 个职业的日常态 */}
        <section className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">① 各职业日常态</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {SPECIES.map((sp) => (
              <div key={sp} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/80 shadow-sm">
                <PetSprite species={sp} state="daily" size={110} />
                <div className="text-sm font-medium text-slate-700">{petSpriteData[sp].label}</div>
                <div className="text-xs text-slate-400 font-mono">{sp}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 第二行：三态对比 */}
        <section className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">② 三态对比（日常 / 欢呼 / 低落）</h2>
          <div className="space-y-4">
            {SPECIES.map((sp) => (
              <div key={sp} className="flex items-center gap-6 p-3 rounded-xl bg-white/80">
                <div className="w-24 text-sm font-semibold text-slate-700">
                  {petSpriteData[sp].label}
                  <div className="text-xs text-slate-400 font-mono">{sp}</div>
                </div>
                {STATES.map((s) => (
                  <div key={s.key} className="flex flex-col items-center gap-1">
                    <PetSprite species={sp} state={s.key} size={80} />
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 第三行：8 名学生实际分配 */}
        <section className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">③ LTZ2024 班级学生宠物分配</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '王小雅', ideal: '蛋糕师', sp: 'baker' as PetSpecies, note: '帮妈妈做蛋糕，眼睛发亮' },
              { name: '李小军', ideal: '军人', sp: 'soldier' as PetSpecies, note: '爷爷是退伍军人' },
              { name: '张小花', ideal: '画家', sp: 'painter' as PetSpecies, note: '喜欢画画' },
              { name: '刘小虎', ideal: '科学家', sp: 'scientist' as PetSpecies, note: '自然科学兴趣浓' },
              { name: '陈小雨', ideal: null, sp: 'sprout' as PetSpecies, note: '梦想还在悄悄发芽…' },
              { name: '周小杰', ideal: '教师', sp: 'teacher' as PetSpecies, note: '想像老师一样站讲台' },
              { name: '吴小雪', ideal: null, sp: 'sprout' as PetSpecies, note: '梦想还在悄悄发芽…' },
              { name: '郑小阳', ideal: '医生', sp: 'doctor' as PetSpecies, note: '奶奶生病后想当医生' },
            ].map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/90 shadow-sm">
                <PetSprite species={s.sp} state="daily" size={110} />
                <div className="text-base font-semibold text-slate-800">{s.name}</div>
                <div className="text-sm text-pink-600">
                  {s.ideal ? `梦想：${s.ideal}` : '梦想：还在悄悄发芽…'}
                </div>
                <div className="text-xs text-slate-400 text-center">{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 第四行：8 种扩展职业三态审核 */}
        <section className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-sm mt-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">④ 扩展职业审核（8 种新增）</h2>
          <p className="text-sm text-slate-400 mb-4">police / firefighter / pilot / astronaut / engineer / musician / athlete / writer — 三态配色请逐一审核</p>
          <div className="space-y-4">
            {(['police', 'firefighter', 'pilot', 'astronaut', 'engineer', 'musician', 'athlete', 'writer'] as PetSpecies[]).map((sp) => (
              <div key={sp} className="flex items-center gap-6 p-3 rounded-xl bg-white/80">
                <div className="w-24 text-sm font-semibold text-slate-700">
                  {petSpriteData[sp].label}
                  <div className="text-xs text-slate-400 font-mono">{sp}</div>
                </div>
                {STATES.map((s) => (
                  <div key={s.key} className="flex flex-col items-center gap-1">
                    <PetSprite species={sp} state={s.key} size={80} />
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
