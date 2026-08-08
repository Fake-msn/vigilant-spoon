import type { RegionKey } from '@/components/art/RegionIcon';

export type Student = {
  id: string;
  name: string;
  grade: string;
  no: string;
  dream?: string;
};

export const students: Student[] = [
  { id: 'wxy', name: '王小雅', grade: '三年级', no: '2023001', dream: '蛋糕师' },
  { id: 'lxj', name: '李小军', grade: '四年级', no: '2023002', dream: '军人' },
  { id: 'zxh', name: '张小花', grade: '三年级', no: '2023003' },
  { id: 'lxh', name: '刘小虎', grade: '五年级', no: '2023004', dream: '科学家' },
  { id: 'cxy', name: '陈小雨', grade: '四年级', no: '2023005' },
  { id: 'zxj', name: '周小杰', grade: '五年级', no: '2023006', dream: '教师' },
  { id: 'wxx', name: '吴小雪', grade: '三年级', no: '2023007' },
  { id: 'zxy2', name: '郑小阳', grade: '四年级', no: '2023008', dream: '医生' },
];

export type Region = {
  key: RegionKey;
  name: string;
  desc: string;
};

export const regions: Region[] = [
  { key: 'yunnan', name: '云南山区', desc: '群山环绕的乡村学校' },
  { key: 'guizhou', name: '贵州梯田', desc: '层层叠叠的梯田风光' },
  { key: 'sichuan', name: '四川盆地', desc: '盆地边缘的小城镇' },
  { key: 'gansu', name: '甘肃戈壁', desc: '戈壁滩上的绿洲村庄' },
  { key: 'shaanxi', name: '陕西黄土', desc: '黄土高原的窑洞村落' },
  { key: 'guangxi', name: '广西丘陵', desc: '丘陵地带的稻田村庄' },
];

// 谈心对话脚本（演示）
export type ChatMsg =
  | { from: 'ai'; text: string }
  | { from: 'me'; text: string }
  | { from: 'ai'; image: 'cake' | 'dream'; text: string };

export const chatScript: ChatMsg[] = [
  { from: 'ai', text: '你好呀！我是小信 ✨ 今天想和你聊聊你的梦想。你长大以后想做什么呀？' },
  { from: 'me', text: '小信，我长大了想卖蛋糕！我最喜欢吃甜甜的蛋糕了' },
  { from: 'ai', text: '长大以后想卖甜甜的蛋糕也太美好啦～那你最喜欢什么口味的蛋糕呀？你有没有试着做过蛋糕呢？哪怕帮妈妈打打下手也算哦～' },
  { from: 'me', text: '有！我上周帮妈妈揉了面团，虽然弄得满脸都是面粉……' },
  { from: 'ai', text: '哈哈哈太可爱了！满脸面粉也是蛋糕师的勋章呢 👏 你看，我已经能想象出你当蛋糕师的样子了——' },
  { from: 'ai', image: 'cake', text: '先送你一个梦想小蛋糕！再聊两句，我就把你的专属电子宠物画出来～' },
  { from: 'me', text: '好呀！我还想学会做草莓味的纸杯蛋糕，带给班里的同学吃' },
  { from: 'ai', image: 'dream', text: '叮咚——你的专属电子宠物生成啦！戴着厨师帽、拿着打蛋器的小蛋糕师，以后它会陪着你一起长大。记得我们的约定：这周再帮妈妈做一次小点心哦！' },
];

export type Letter = {
  id: string;
  week: string;
  date: string;
  unread: boolean;
  preview: string;
  body: string[];
};

export const letters: Letter[] = [
  {
    id: 'w3',
    week: '第 3 周的来信',
    date: '07-28',
    unread: true,
    preview: '我一直记得你的梦想是成为蛋糕师，这周你的小宠物……',
    body: [
      '致龙头山镇中心小学三年级的王小雅同学：',
      '我一直记得你的梦想是成为蛋糕师。这周你的蛋糕师小宠物看起来有点没精神——它告诉我，你已经好几天没和它分享新消息了。',
      '你平时会在课余帮妈妈进厨房打下手吗？哪怕只是搅一搅面糊、摆一摆盘子，都是在为梦想积攒力气呀。要不要和班主任老师聊聊，一起为你的小宠物赚取成长值？',
      '期待下周听到你的新故事。',
    ],
  },
  {
    id: 'w2',
    week: '第 2 周的来信',
    date: '07-21',
    unread: false,
    preview: '上次你说想学会做纸杯蛋糕，不知道这周有没有……',
    body: [
      '致龙头山镇中心小学三年级的王小雅同学：',
      '上次你说想学会做草莓味的纸杯蛋糕，不知道这周有没有离它近一点？',
      '听说你帮妈妈揉了面团，还弄得满脸面粉——在我看来，那可是蛋糕师的第一枚勋章。你的小宠物这周开心极了，因为它感受到了你的努力。',
      '继续加油，下周也要记得来和我聊聊哦。',
    ],
  },
  {
    id: 'w1',
    week: '第 1 周的来信',
    date: '07-14',
    unread: false,
    preview: '这是我们写给你的第一封信。从今天起，你有了一只……',
    body: [
      '致龙头山镇中心小学三年级的王小雅同学：',
      '这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。',
      '你说过，你的梦想是成为一名蛋糕师。记住这个甜甜的心愿，以后的每一周，我都想听听你为它做了什么。',
      '慢慢来，梦想不怕小，就怕不去靠近它。',
    ],
  },
];

export type ReportStudent = {
  id: string;
  name: string;
  grade: string;
  lastChat: string;
  score: number;
  status: '积极' | '良好' | '需关注';
  dream: string;
};

export const reportStudents: ReportStudent[] = [
  { id: 'wxy', name: '王小雅', grade: '三年级', lastChat: '今天 10:24', score: 92, status: '积极', dream: '蛋糕师' },
  { id: 'lxj', name: '李小军', grade: '四年级', lastChat: '今天 09:51', score: 85, status: '积极', dream: '军人' },
  { id: 'zxh', name: '张小花', grade: '三年级', lastChat: '昨天 16:08', score: 78, status: '良好', dream: '画家' },
  { id: 'lxh', name: '刘小虎', grade: '五年级', lastChat: '昨天 15:32', score: 88, status: '积极', dream: '科学家' },
  { id: 'cxy', name: '陈小雨', grade: '四年级', lastChat: '3 天前', score: 64, status: '需关注', dream: '暂无' },
  { id: 'zxj', name: '周小杰', grade: '五年级', lastChat: '3 天前', score: 81, status: '良好', dream: '教师' },
  { id: 'wxx', name: '吴小雪', grade: '三年级', lastChat: '上周', score: 58, status: '需关注', dream: '暂无' },
  { id: 'zxy2', name: '郑小阳', grade: '四年级', lastChat: '上周', score: 76, status: '良好', dream: '医生' },
];

export const promises = [
  { text: '我要每天帮妈妈做一次家务', done: true },
  { text: '我要学会做一个纸杯蛋糕', done: false },
];

// 学情档案（老师导入的成绩与背景信息，设计稿⑦）
export type SubjectScore = { subject: string; score: number; trend: 'up' | 'down' | 'flat' };

export type AcademicRow = {
  id: string;
  scores: SubjectScore[];
  relation: '亲近' | '一般' | '疏远';
  note: string;
};

export const academicRows: AcademicRow[] = [
  {
    id: 'wxy',
    scores: [
      { subject: '语文', score: 88, trend: 'up' },
      { subject: '数学', score: 76, trend: 'down' },
      { subject: '英语', score: 82, trend: 'flat' },
    ],
    relation: '亲近',
    note: '课余常帮妈妈做家务，动手能力强，提到做蛋糕时眼睛发亮',
  },
  {
    id: 'lxj',
    scores: [
      { subject: '语文', score: 79, trend: 'flat' },
      { subject: '数学', score: 85, trend: 'up' },
      { subject: '英语', score: 71, trend: 'up' },
    ],
    relation: '亲近',
    note: '体育课表现突出，纪律性强，爷爷曾是退伍军人',
  },
  {
    id: 'zxh',
    scores: [
      { subject: '语文', score: 92, trend: 'up' },
      { subject: '数学', score: 68, trend: 'down' },
      { subject: '英语', score: 75, trend: 'flat' },
    ],
    relation: '一般',
    note: '喜欢画画，作文常写到山外面的世界，性格偏内向',
  },
  {
    id: 'lxh',
    scores: [
      { subject: '语文', score: 74, trend: 'flat' },
      { subject: '数学', score: 95, trend: 'up' },
      { subject: '英语', score: 80, trend: 'up' },
    ],
    relation: '亲近',
    note: '对自然科学兴趣浓厚，常问"为什么"，家里支持读书',
  },
  {
    id: 'cxy',
    scores: [
      { subject: '语文', score: 66, trend: 'down' },
      { subject: '数学', score: 62, trend: 'down' },
      { subject: '英语', score: 58, trend: 'down' },
    ],
    relation: '疏远',
    note: '父母外出务工，由奶奶照顾，近期上课注意力下降，需要更多关注',
  },
  {
    id: 'zxj',
    scores: [
      { subject: '语文', score: 86, trend: 'up' },
      { subject: '数学', score: 78, trend: 'flat' },
      { subject: '英语', score: 84, trend: 'up' },
    ],
    relation: '亲近',
    note: '乐于帮助同学讲题，说想像老师一样站上讲台',
  },
  {
    id: 'wxx',
    scores: [
      { subject: '语文', score: 71, trend: 'flat' },
      { subject: '数学', score: 65, trend: 'down' },
      { subject: '英语', score: 69, trend: 'flat' },
    ],
    relation: '一般',
    note: '刚转学过来一学期，还在适应新环境，课堂发言较少',
  },
  {
    id: 'zxy2',
    scores: [
      { subject: '语文', score: 83, trend: 'up' },
      { subject: '数学', score: 88, trend: 'up' },
      { subject: '英语', score: 79, trend: 'flat' },
    ],
    relation: '亲近',
    note: '奶奶生病后开始说想当医生，责任感强，成绩稳步上升',
  },
];

// 班级成长档案（宠物状态 + 历次得分 + 心理信号，设计稿⑧）
export type GrowthRow = {
  id: string;
  petLevel: number;
  petMood: '开心' | '平静' | '低落';
  growth: number;
  scores: number[];
  evalSummary: string;
  signal?: string;
};

export const growthRows: GrowthRow[] = [
  {
    id: 'wxy',
    petLevel: 2,
    petMood: '开心',
    growth: 128,
    scores: [76, 82, 85, 92],
    evalSummary: '理想清晰度高，已开始为梦想付出行动（帮妈妈做点心），表达完整、情绪积极。',
  },
  {
    id: 'lxj',
    petLevel: 2,
    petMood: '开心',
    growth: 115,
    scores: [70, 78, 81, 85],
    evalSummary: '参与度高，把"当军人"与每天锻炼联系起来，行动力强。',
  },
  {
    id: 'zxh',
    petLevel: 1,
    petMood: '平静',
    growth: 86,
    scores: [72, 75, 78],
    evalSummary: '表达含蓄但作画意愿强，建议在对话中多给她描述画面的机会。',
  },
  {
    id: 'lxh',
    petLevel: 3,
    petMood: '开心',
    growth: 142,
    scores: [80, 84, 88, 88],
    evalSummary: '提问频率全班最高，对"科学家怎么工作"有持续好奇心。',
  },
  {
    id: 'cxy',
    petLevel: 1,
    petMood: '低落',
    growth: 42,
    scores: [70, 66, 64],
    evalSummary: '近三次对话时长逐次变短，主动表达减少。',
    signal: '连续两次提到"想爸爸妈妈"，建议本周安排一次线下谈心',
  },
  {
    id: 'zxj',
    petLevel: 2,
    petMood: '开心',
    growth: 108,
    scores: [75, 79, 81],
    evalSummary: '把"当老师"落实为帮同学讲题，行动与理想高度一致。',
  },
  {
    id: 'wxx',
    petLevel: 1,
    petMood: '低落',
    growth: 51,
    scores: [62, 60, 58],
    evalSummary: '对话中较多沉默，还没说出自己的理想。',
    signal: '转学适应期，情绪偏紧张，建议先从兴趣话题切入',
  },
  {
    id: 'zxy2',
    petLevel: 2,
    petMood: '平静',
    growth: 96,
    scores: [72, 76, 76, 79],
    evalSummary: '理想动机真挚（奶奶生病），可引导了解医生的日常学习路径。',
  },
];

// 我的课程（往次思政课记录，设计稿⑨）
export type CourseRecord = {
  id: string;
  title: string;
  date: string;
  duration: string;
  joined: number;
  avgScore: number;
  status: '已完成' | '进行中';
  goal: string;
  traces: string[];
};

export const courseRecords: CourseRecord[] = [
  {
    id: 'c4',
    title: '我的梦想清单',
    date: '08-01',
    duration: '40 分钟',
    joined: 5,
    avgScore: 84,
    status: '进行中',
    goal: '引导每位同学说出一个具体理想，并想一件本周能做的小事',
    traces: ['5 位同学完成对话并生成梦想画像', '陈小雨触发心理信号，已提醒关注'],
  },
  {
    id: 'c3',
    title: '长大后的我',
    date: '07-25',
    duration: '45 分钟',
    joined: 8,
    avgScore: 81,
    status: '已完成',
    goal: '结合"唯有读书高?"讨论多元职业价值，人人参与不评判',
    traces: ['8 位同学全部完成对话', '新增 3 个理想：画家、医生、教师', '平均成长值 +12'],
  },
  {
    id: 'c2',
    title: '家乡与远方',
    date: '07-18',
    duration: '40 分钟',
    joined: 7,
    avgScore: 78,
    status: '已完成',
    goal: '从家乡生活出发，聊聊"山外面的世界"，拓宽职业想象',
    traces: ['地区上下文首次接入对话', '张小花第一次主动发言并画了梯田'],
  },
  {
    id: 'c1',
    title: '第一次和小信见面',
    date: '07-11',
    duration: '35 分钟',
    joined: 8,
    avgScore: 74,
    status: '已完成',
    goal: '建立信任：让每位同学和 AI 打招呼，说一件开心的事',
    traces: ['全班建立成长档案', '每人领到专属像素小宠物'],
  },
];

export const chatHistory = [
  { date: '今天', topic: '蛋糕师的梦想', mood: '开心', mins: 6 },
  { date: '昨天', topic: '帮妈妈揉面团', mood: '兴奋', mins: 5 },
  { date: '3 天前', topic: '甜甜的纸杯蛋糕', mood: '平静', mins: 8 },
  { date: '上周', topic: '第一次说出梦想', mood: '害羞', mins: 4 },
];
