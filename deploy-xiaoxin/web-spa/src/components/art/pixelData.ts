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
