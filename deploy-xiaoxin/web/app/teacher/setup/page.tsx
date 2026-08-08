'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { students, type Student } from '@/lib/data';
import { Icon } from '@/components/Icon';
import { KidAvatar, kidVariants } from '@/components/art/KidAvatar';

type Step = 1 | 2;

const provinces = ['云南省', '贵州省', '四川省', '甘肃省', '陕西省', '广西壮族自治区'];
const cities = ['昭通市', '曲靖市', '大理州', '文山州'];
const counties = ['鲁甸县', '巧家县', '永善县', '彝良县'];
const towns = ['龙头山镇', '水磨镇', '乐红镇', '小寨镇'];
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
const classNos = ['1 班', '2 班', '3 班'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function Select({ options, value, onChange, placeholder }: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input-soft cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22/%3E%3C/svg%3E')] bg-[right_1rem_center] bg-no-repeat ${value ? '' : 'text-ink-faint'}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o} className="text-ink">
          {o}
        </option>
      ))}
    </select>
  );
}

export default function TeacherSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // 步骤 1：地区与班级信息（设计稿④）
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [town, setTown] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [classNo, setClassNo] = useState('');

  const step1Done = province && city && county && town && school.trim() && grade && classNo;

  // 步骤 2：学生信息导入（设计稿⑤）
  const [roster, setRoster] = useState<Student[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [imported, setImported] = useState(false);

  const importDemo = () => {
    setRoster(students);
    setImported(true);
  };

  const addManual = () => {
    const name = newName.trim();
    if (!name) return;
    setRoster((r) => [
      ...r,
      { id: `m${r.length}`, name, grade: grade || '三年级', no: `2023${String(r.length + 1).padStart(3, '0')}` },
    ]);
    setNewName('');
  };

  const removeStudent = (id: string) => setRoster((r) => r.filter((s) => s.id !== id));

  const finish = () => {
    if (roster.length === 0) return;
    router.push('/teacher/new-course');
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
      {/* 步骤指示（设计稿④⑤书法标题药丸） */}
      <div className="relative text-center">
        <img
          src="/design/leaves.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-44 -top-10 hidden w-72 opacity-70 lg:block"
        />
        <div>
          <span className="tag bg-white text-ink-soft border border-line">建设新班级 · 第 {step} 步 / 共 2 步</span>
        </div>
        <h1 className="title-pill mt-5 text-4xl md:text-5xl">
          {step === 1 ? '地区输入' : '学生信息导入'}
        </h1>
        <p className="mt-4 text-[15px] text-ink-soft">
          {step === 1
            ? '地区会作为上下文喂给 AI，让提问更贴近孩子们的生活'
            : '分文件导入 / 手动添加，名单将用于课堂点选身份与梦想画像'}
        </p>
      </div>

      {step === 1 && (
        <div className="card mt-10 p-7 md:p-9 animate-rise">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <Icon name="location" size={16} className="text-brand" />
            学校所在地区
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="省份">
              <Select options={provinces} value={province} onChange={setProvince} placeholder="选择省份" />
            </Field>
            <Field label="市 / 州">
              <Select options={cities} value={city} onChange={setCity} placeholder="选择市州" />
            </Field>
            <Field label="区 / 县">
              <Select options={counties} value={county} onChange={setCounty} placeholder="选择区县" />
            </Field>
            <Field label="乡 / 镇">
              <Select options={towns} value={town} onChange={setTown} placeholder="选择乡镇" />
            </Field>
          </div>

          <p className="mt-8 flex items-center gap-2 text-sm font-bold text-ink">
            <Icon name="book" size={16} className="text-brand" />
            学校与班级
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
            <Field label="学校名称">
              <input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="例如：龙头山镇中心小学"
                className="input-soft"
              />
            </Field>
            <Field label="年级">
              <Select options={grades} value={grade} onChange={setGrade} placeholder="选择年级" />
            </Field>
            <Field label="班级">
              <Select options={classNos} value={classNo} onChange={setClassNo} placeholder="选择班级" />
            </Field>
          </div>

          <div className="mt-9 flex items-center justify-between">
            <Link href="/teacher" className="btn-line !px-6 !py-2.5 text-sm">
              <Icon name="arrow-left" size={16} />
              返回
            </Link>
            <span className="hidden text-sm text-ink-faint sm:block">
              {step1Done ? `${province} · ${school} ${grade}${classNo}` : '完成所有信息后进入下一步'}
            </span>
            <button onClick={() => setStep(2)} disabled={!step1Done} className="btn-brand !px-6 !py-2.5 text-sm">
              下一步
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-10 flex flex-col gap-6 animate-rise">
          {/* 导入方式 */}
          <div className="grid gap-5 md:grid-cols-2">
            <button
              onClick={importDemo}
              disabled={imported}
              className={`card card-hover flex flex-col items-center gap-3 p-7 text-center transition-opacity ${
                imported ? 'opacity-60' : ''
              }`}
            >
              <span className="flex h-13 w-13 items-center justify-center rounded-lg bg-brand-soft text-brand" style={{ width: 52, height: 52 }}>
                <Icon name="upload" size={26} />
              </span>
              <span className="text-lg font-bold text-ink">{imported ? '名单已导入 ✓' : '文件导入'}</span>
              <span className="text-[13px] leading-6 text-ink-soft">
                支持 Excel / CSV 名单，含姓名、学号、照片
                <br />
                （演示环境：点击导入示例名单）
              </span>
            </button>
            <div className="card flex flex-col items-center gap-3 p-7 text-center">
              <span className="flex items-center justify-center rounded-lg bg-warm-soft text-warm-deep" style={{ width: 52, height: 52 }}>
                <Icon name="plus" size={26} />
              </span>
              <span className="text-lg font-bold text-ink">手动添加</span>
              {adding ? (
                <span className="flex w-full gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addManual()}
                    placeholder="输入学生姓名"
                    autoFocus
                    className="input-soft flex-1 !py-2.5 text-sm"
                  />
                  <button onClick={addManual} className="btn-brand !px-4 !py-2 text-sm">
                    添加
                  </button>
                </span>
              ) : (
                <button onClick={() => setAdding(true)} className="btn-line !px-5 !py-2 text-sm">
                  逐个录入学生
                </button>
              )}
            </div>
          </div>

          {/* 名单预览：姓名 + 学号 + 照片（设计稿⑤） */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-brand-faint px-6 py-4">
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <Icon name="users" size={16} className="text-brand" />
                名单预览
              </p>
              <span className="tag bg-white text-ink-soft border border-line">共 {roster.length} 人</span>
            </div>
            {roster.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <Icon name="users" size={28} className="text-ink-faint" />
                <p className="font-bold text-ink">还没有学生</p>
                <p className="text-sm text-ink-soft">先通过左上方「文件导入」或「手动添加」录入名单</p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {roster.map((s, i) => (
                  <li key={s.id} className="group relative flex flex-col items-center gap-2 rounded-lg border border-line bg-white p-4 animate-pop" style={{ animationDelay: `${i * 0.04}s` }}>
                    <span className="overflow-hidden rounded-xl" style={{ width: 64, height: 64 }}>
                      <KidAvatar v={kidVariants[i % kidVariants.length]} size={64} />
                    </span>
                    <span className="text-sm font-bold text-ink">{s.name}</span>
                    <span className="text-[11px] font-medium text-ink-faint">学号 {s.no}</span>
                    <button
                      onClick={() => removeStudent(s.id)}
                      aria-label={`移除 ${s.name}`}
                      className="absolute -right-1.5 -top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-card group-hover:flex"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(1)} className="btn-line !px-6 !py-2.5 text-sm">
              <Icon name="arrow-left" size={16} />
              上一步
            </button>
            <span className="hidden text-sm text-ink-faint sm:block">
              {roster.length > 0 ? `已录入 ${roster.length} 位学生` : '至少录入 1 位学生'}
            </span>
            <button onClick={finish} disabled={roster.length === 0} className="btn-brand !px-6 !py-2.5 text-sm">
              <Icon name="check" size={16} />
              完成建班，去备课
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
