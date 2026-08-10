// 像素风品牌资产（手绘点阵）

// 小信伙伴 · 绿色小精灵
export const petMap = [
  '.......BB.......',
  '........B.......',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBBBBBBBB....',
  '...BBBbBbBBB....',
  '...BBBBBBBBB....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
];

// 日常态（保留原开心配色）
export const petPalette: Record<string, string> = {
  B: '#4c9a50',
  W: '#ffffff',
  b: '#356f38',
};

// 灰色态：去饱和灰（原 sad 改造）
export const petPaletteGray: Record<string, string> = {
  B: '#94a3b8',
  W: '#e2e8f0',
  b: '#64748b',
};

// 欢呼态：高饱和亮色
export const petPaletteCheer: Record<string, string> = {
  B: '#22c55e',
  W: '#fffbeb',
  b: '#16a34a',
};

// 梦想蛋糕（过程图）
export const cakeMap = [
  '.......RR.......',
  '......RRRR......',
  '.......YY.......',
  '.......YY.......',
  '....PPPPPPPP....',
  '..PPPPPPPPPPPP..',
  '..PwwPwwPwwPwwP.',
  '..PPPPPPPPPPPP..',
  '..CCCCCCCCCCCC..',
  '..CCCCCCCCCCCC..',
  '..CCCCCCCCCCCC..',
  '.DDDDDDDDDDDDDD.',
];

export const cakePalette: Record<string, string> = {
  R: '#ef4444',
  Y: '#fbbf24',
  P: '#fce7f3',
  w: '#ffffff',
  C: '#f472b6',
  D: '#cbd5e1',
};

// 梦想画像 · 蛋糕师女孩（结果图）
export const dreamMap = [
  '.....WWWWWW.....',
  '....WWWWWWWW....',
  '....WWWWWWWW....',
  '.....WWWWWW.....',
  '....HHHHHHHH....',
  '....HFFFFFFH....',
  '....HFkFFkFH....',
  '....HFFFFFFH....',
  '.....FFmmFF.....',
  '....AAAAAAAA....',
  '...HAAAAAAAAH...',
  '...HAAbbbbAAH...',
  '...HAAAAAAAAH...',
  '....AAAAAAAA....',
  '.....LL..LL.....',
  '....SSS..SSS....',
];

export const dreamPalette: Record<string, string> = {
  W: '#ffffff',
  H: '#4a3226',
  F: '#ffd9b3',
  k: '#1e293b',
  m: '#e11d48',
  A: '#f9a8d4',
  b: '#ffffff',
  L: '#fda4af',
  S: '#7c2d12',
};

// 像素星星（装饰）
export const starMap = [
  '...Y...',
  '..YYY..',
  '.YYYYY.',
  '..YYY..',
  '...Y...',
];

export const starPalette: Record<string, string> = { Y: '#fbbf24' };

// ========== 职业宠物精灵系统 ==========
// 画布统一 16 列 × 14 行；色键约定：
//   B=主体主色 b=主体阴影 W=白 k=黑/瞳孔 m=红/腮红 其余为各职业特色色
// 每个职业都有 daily / gray / cheer 三套 palette

export type PetSpecies =
  | 'sprout' // 未说出口·嫩芽态
  | 'baker'
  | 'soldier'
  | 'scientist'
  | 'teacher'
  | 'doctor'
  | 'painter'
  | 'police'
  | 'firefighter'
  | 'pilot'
  | 'astronaut'
  | 'engineer'
  | 'musician'
  | 'athlete'
  | 'writer'
  | 'cat'; // 保留原通用精灵兜底

// ---- 通用：基础小信伙伴（16x14，扩展版，兼容原 petMap）----
const commonPetMap = [
  '................',
  '.......BB.......',
  '........B.......',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBbBbBBB....',
  '...BBBBBBBBB....',
  '....BBBBBBB.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- sprout 嫩芽态（还在悄悄发芽）----
const sproutMap = [
  '................',
  '.......Gg.......',
  '......GggG......',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBbbBBB....',
  '....BBBmmBB.....',
  '....BBBBBBB.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- baker 蛋糕师（粉色+厨师帽+小蛋糕）----
const bakerMap = [
  '................',
  '.....WWWWWW.....',
  '....WwwwwwwW....',
  '....WWrrrrWW....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BBBYBBB.....',
  '....BBYCYYB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- soldier 军人（军绿+军帽+红星+敬礼）----
const soldierMap = [
  '................',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '....HkRRRkH.....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BSBBBBS.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- scientist 科学家（靛蓝+乱发+护目镜+烧瓶）----
const scientistMap = [
  '.......HH.......',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....gWggggWg....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBkBBBkBB....',
  '...BBBBBBBBBB...',
  '...BBBBmmBBB....',
  '....BBfCfBB.....',
  '....BBfCfBB.....',
  '.....B.f.B......',
  '....BB...BB.....',
  '................',
];

// ---- teacher 教师（天蓝+眼镜+书本）----
const teacherMap = [
  '................',
  '................',
  '.....BBBBBB.....',
  '....BkBBBBkB....',
  '....BWBBBBWB....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBBmmmmBB....',
  '....BBBBBBB.....',
  '....BBWWWWB.....',
  '....BWwKWwB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- doctor 医生（白大褂+医帽+红十字）----
const doctorMap = [
  '................',
  '.....WWWWWW.....',
  '....WWRRRWW.....',
  '....WWRWRWW.....',
  '.....WBBBBW.....',
  '....WBBBBBBW....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BBRRRBB.....',
  '....BRRWRRB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- painter 画家（橙黄+贝雷帽+调色板）----
const painterMap = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '.....HHHHHH.....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BPrpYBB.....',
  '....BBBBcBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- police 警察（藏蓝+警帽+银徽+肩章）----
const policeMap = [
  '................',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '....HkYRRYkH....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BSBBBBS.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- firefighter 消防员（红色+头盔+反光条）----
const firefighterMap = [
  '................',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '....HYYYYYYH....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BBYBYBB.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- pilot 飞行员（棕色+飞行帽+护目镜+耳机）----
const pilotMap = [
  '................',
  '....HHHHHHHH....',
  '...HHggggggHH...',
  '....HHHHHHHH....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BBhBBBh.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- astronaut 宇航员（白色+太空头盔+面罩+国旗）----
const astronautMap = [
  '................',
  '.....WWWWWW.....',
  '....WWggggWW....',
  '.....WWWWWW.....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BBRYRBB.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- engineer 工程师（橙色+安全帽+扳手+螺丝）----
const engineerMap = [
  '................',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '....HHHHHHHH....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BBwYwBB.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- musician 音乐家（紫色+礼帽+音符）----
const musicianMap = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BBYnYBB.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- athlete 运动员（青色+头带+奖牌）----
const athleteMap = [
  '................',
  '................',
  '....HHHHHHHH....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BBBBBBB.....',
  '....BBYRYBB.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- writer 作家（棕色+圆框眼镜+书+羽毛笔）----
const writerMap = [
  '................',
  '................',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBWBBBWBB....',
  '...BBkBBBkBB....',
  '...BBBBmmBBB....',
  '....BBBBBBB.....',
  '....BBWWWBB.....',
  '....BBWqWBB.....',
  '....BBBBBBB.....',
  '.....B...B......',
  '....BB...BB.....',
  '................',
];

// ---- palette 生成器：同一身体不同主题色 ----
function petPaletteFor(main: string, dark: string, extras: Record<string, string> = {}) {
  return {
    B: main,
    b: dark,
    W: '#ffffff',
    k: '#1e293b',
    m: '#fb7185',
    ...extras,
  } as Record<string, string>;
}
function grayFrom(p: Record<string, string>): Record<string, string> {
  // 简单去饱和：主体色变灰
  return { ...p, B: '#94a3b8', b: '#64748b', W: '#e2e8f0' };
}
function cheerFrom(p: Record<string, string>, bright: string, brightDark: string): Record<string, string> {
  return { ...p, B: bright, b: brightDark, W: '#fffbeb' };
}

// 各职业三套 palette：daily / gray / cheer
export const petSpriteData: Record<
  PetSpecies,
  { map: string[]; daily: Record<string, string>; gray: Record<string, string>; cheer: Record<string, string>; label: string }
> = {
  sprout: {
    map: sproutMap,
    label: '嫩芽',
    daily: petPaletteFor('#84cc16', '#65a30d', { G: '#65a30d', g: '#a3e635' }),
    gray: grayFrom(petPaletteFor('#84cc16', '#65a30d', { G: '#64748b', g: '#94a3b8' })),
    cheer: cheerFrom(petPaletteFor('#84cc16', '#65a30d', { G: '#4d7c0f', g: '#bef264' }), '#a3e635', '#65a30d'),
  },
  baker: {
    map: bakerMap,
    label: '蛋糕师',
    daily: petPaletteFor('#f472b6', '#db2777', {
      W: '#ffffff', w: '#fce7f3', r: '#ef4444',
      Y: '#fbbf24', C: '#fef3c7',
    }),
    gray: grayFrom(petPaletteFor('#f472b6', '#db2777', {
      W: '#f1f5f9', w: '#e2e8f0', r: '#94a3b8',
      Y: '#cbd5e1', C: '#e2e8f0',
    })),
    cheer: cheerFrom(petPaletteFor('#ec4899', '#be185d', {
      W: '#ffffff', w: '#fbcfe8', r: '#f87171',
      Y: '#fde047', C: '#fff7ed',
    }), '#f472b6', '#db2777'),
  },
  soldier: {
    map: soldierMap,
    label: '军人',
    daily: petPaletteFor('#16a34a', '#15803d', {
      H: '#1e3a2f', R: '#dc2626', S: '#fde047',
    }),
    gray: grayFrom(petPaletteFor('#16a34a', '#15803d', {
      H: '#334155', R: '#94a3b8', S: '#cbd5e1',
    })),
    cheer: cheerFrom(petPaletteFor('#22c55e', '#16a34a', {
      H: '#14532d', R: '#ef4444', S: '#facc15',
    }), '#4ade80', '#16a34a'),
  },
  scientist: {
    map: scientistMap,
    label: '科学家',
    daily: petPaletteFor('#6366f1', '#4338ca', {
      H: '#312e81', g: '#94a3b8', f: '#22d3ee', C: '#a7f3d0',
    }),
    gray: grayFrom(petPaletteFor('#6366f1', '#4338ca', {
      H: '#334155', g: '#cbd5e1', f: '#94a3b8', C: '#cbd5e1',
    })),
    cheer: cheerFrom(petPaletteFor('#818cf8', '#4f46e5', {
      H: '#3730a3', g: '#e0e7ff', f: '#67e8f9', C: '#d1fae5',
    }), '#a5b4fc', '#6366f1'),
  },
  teacher: {
    map: teacherMap,
    label: '教师',
    daily: petPaletteFor('#0ea5e9', '#0284c7', {
      W: '#ffffff', w: '#fef3c7', K: '#fbbf24',
    }),
    gray: grayFrom(petPaletteFor('#0ea5e9', '#0284c7', {
      W: '#f1f5f9', w: '#e2e8f0', K: '#cbd5e1',
    })),
    cheer: cheerFrom(petPaletteFor('#38bdf8', '#0284c7', {
      W: '#ffffff', w: '#fef9c3', K: '#facc15',
    }), '#7dd3fc', '#0ea5e9'),
  },
  doctor: {
    map: doctorMap,
    label: '医生',
    daily: petPaletteFor('#ffffff', '#e2e8f0', {
      W: '#ffffff', R: '#ef4444', k: '#1e293b',
    }),
    gray: petPaletteFor('#e2e8f0', '#94a3b8', {
      W: '#f1f5f9', R: '#94a3b8', k: '#334155',
    }),
    cheer: petPaletteFor('#ffffff', '#fce7f3', {
      W: '#ffffff', R: '#f87171', k: '#be123c', B: '#fecaca',
    }),
  },
  painter: {
    map: painterMap,
    label: '画家',
    daily: petPaletteFor('#f59e0b', '#d97706', {
      H: '#dc2626', P: '#ec4899', r: '#ef4444', p: '#a855f7',
      Y: '#fbbf24', c: '#06b6d4',
    }),
    gray: grayFrom(petPaletteFor('#f59e0b', '#d97706', {
      H: '#64748b', P: '#94a3b8', r: '#94a3b8', p: '#94a3b8',
      Y: '#cbd5e1', c: '#94a3b8',
    })),
    cheer: cheerFrom(petPaletteFor('#fbbf24', '#d97706', {
      H: '#ef4444', P: '#f472b6', r: '#fb7185', p: '#c084fc',
      Y: '#fde047', c: '#22d3ee',
    }), '#fcd34d', '#f59e0b'),
  },
  police: {
    map: policeMap,
    label: '警察',
    daily: petPaletteFor('#1e3a5f', '#0f172a', {
      H: '#0f172a', Y: '#fbbf24', R: '#dc2626', S: '#facc15',
    }),
    gray: grayFrom(petPaletteFor('#1e3a5f', '#0f172a', {
      H: '#1e293b', Y: '#cbd5e1', R: '#94a3b8', S: '#cbd5e1',
    })),
    cheer: cheerFrom(petPaletteFor('#2563eb', '#1e3a5f', {
      H: '#1e293b', Y: '#fde047', R: '#ef4444', S: '#fde047',
    }), '#3b82f6', '#1e3a5f'),
  },
  firefighter: {
    map: firefighterMap,
    label: '消防员',
    daily: petPaletteFor('#dc2626', '#991b1b', {
      H: '#b91c1c', Y: '#fbbf24',
    }),
    gray: grayFrom(petPaletteFor('#dc2626', '#991b1b', {
      H: '#7f1d1d', Y: '#cbd5e1',
    })),
    cheer: cheerFrom(petPaletteFor('#ef4444', '#b91c1c', {
      H: '#dc2626', Y: '#fde047',
    }), '#f87171', '#dc2626'),
  },
  pilot: {
    map: pilotMap,
    label: '飞行员',
    daily: petPaletteFor('#92400e', '#78350f', {
      H: '#78350f', g: '#1e293b', h: '#475569',
    }),
    gray: grayFrom(petPaletteFor('#92400e', '#78350f', {
      H: '#451a03', g: '#334155', h: '#64748b',
    })),
    cheer: cheerFrom(petPaletteFor('#b45309', '#78350f', {
      H: '#92400e', g: '#0f172a', h: '#64748b',
    }), '#d97706', '#92400e'),
  },
  astronaut: {
    map: astronautMap,
    label: '宇航员',
    daily: petPaletteFor('#cbd5e1', '#94a3b8', {
      W: '#f1f5f9', g: '#1e293b', R: '#dc2626', Y: '#fbbf24',
    }),
    gray: petPaletteFor('#94a3b8', '#64748b', {
      W: '#cbd5e1', g: '#334155', R: '#64748b', Y: '#94a3b8',
    }),
    cheer: petPaletteFor('#e2e8f0', '#cbd5e1', {
      W: '#ffffff', g: '#0f172a', R: '#f87171', Y: '#fde047',
    }),
  },
  engineer: {
    map: engineerMap,
    label: '工程师',
    daily: petPaletteFor('#ea580c', '#c2410c', {
      H: '#fbbf24', w: '#64748b', Y: '#facc15',
    }),
    gray: grayFrom(petPaletteFor('#ea580c', '#c2410c', {
      H: '#cbd5e1', w: '#94a3b8', Y: '#cbd5e1',
    })),
    cheer: cheerFrom(petPaletteFor('#f97316', '#c2410c', {
      H: '#fde047', w: '#64748b', Y: '#fde047',
    }), '#fb923c', '#ea580c'),
  },
  musician: {
    map: musicianMap,
    label: '音乐家',
    daily: petPaletteFor('#7c3aed', '#5b21b6', {
      H: '#1e293b', Y: '#fbbf24', n: '#f472b6',
    }),
    gray: grayFrom(petPaletteFor('#7c3aed', '#5b21b6', {
      H: '#334155', Y: '#cbd5e1', n: '#94a3b8',
    })),
    cheer: cheerFrom(petPaletteFor('#8b5cf6', '#6d28d9', {
      H: '#1e293b', Y: '#fde047', n: '#f9a8d4',
    }), '#a78bfa', '#7c3aed'),
  },
  athlete: {
    map: athleteMap,
    label: '运动员',
    daily: petPaletteFor('#0891b2', '#155e75', {
      H: '#ef4444', Y: '#fbbf24', R: '#dc2626',
    }),
    gray: grayFrom(petPaletteFor('#0891b2', '#155e75', {
      H: '#64748b', Y: '#cbd5e1', R: '#94a3b8',
    })),
    cheer: cheerFrom(petPaletteFor('#06b6d4', '#0891b2', {
      H: '#f87171', Y: '#fde047', R: '#ef4444',
    }), '#22d3ee', '#0891b2'),
  },
  writer: {
    map: writerMap,
    label: '作家',
    daily: petPaletteFor('#78350f', '#451a03', {
      W: '#fef3c7', q: '#f59e0b', k: '#1e293b',
    }),
    gray: grayFrom(petPaletteFor('#78350f', '#451a03', {
      W: '#e2e8f0', q: '#94a3b8', k: '#334155',
    })),
    cheer: cheerFrom(petPaletteFor('#92400e', '#78350f', {
      W: '#fffbeb', q: '#fbbf24', k: '#1e293b',
    }), '#b45309', '#78350f'),
  },
  cat: {
    map: commonPetMap,
    label: '伙伴',
    daily: petPaletteFor('#4c9a50', '#356f38'),
    gray: petPaletteFor('#94a3b8', '#64748b', { W: '#e2e8f0' }),
    cheer: petPaletteFor('#22c55e', '#16a34a', { W: '#fffbeb' }),
  },
};

// 从中文职业/理想 映射到 PetSpecies
export function speciesFromIdeal(ideal: string | null | undefined): PetSpecies {
  if (!ideal) return 'sprout';
  const rules: Array<[string[], PetSpecies]> = [
    [['蛋糕', '烘焙', '甜点', '面包', '点心'], 'baker'],
    [['警察', '警官', '民警', '公安'], 'police'],
    [['消防', '灭火'], 'firefighter'],
    [['飞行员', '机长', '开飞机', '驾驶飞机'], 'pilot'],
    [['宇航', '太空', '航天', '火箭', '航天员'], 'astronaut'],
    [['工程师', '建筑', '修路', '造桥', '机械', '建造'], 'engineer'],
    [['音乐', '歌手', '钢琴', '小提琴', '作曲', '唱歌', '演奏'], 'musician'],
    [['运动员', '跑步', '足球', '篮球', '奥运', '冠军', '体育'], 'athlete'],
    [['作家', '写作', '作者', '小说', '诗人', '写书', '写故事'], 'writer'],
    [['军人', '当兵', '参军', '解放', '部队'], 'soldier'],
    [['科学', '发明', '实验', '研究', '天文', '化学', '物理', '生物'], 'scientist'],
    [['老师', '教师', '教书', '讲台'], 'teacher'],
    [['医生', '大夫', '护士', '治病'], 'doctor'],
    [['画家', '画画', '美术', '画笔', '绘画'], 'painter'],
  ];
  for (const [keywords, sp] of rules) {
    if (keywords.some((k) => ideal.includes(k))) return sp;
  }
  return 'cat';
}
