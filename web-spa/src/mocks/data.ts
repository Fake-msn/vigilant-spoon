export type RegionKey = 'yunnan' | 'guizhou' | 'sichuan' | 'gansu' | 'shaanxi' | 'guangxi'

export type Student = {
  id: string
  name: string
  grade: string
  student_no: string
  ideal?: string
  avatar_seed: number
  role?: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
}

export const students: Student[] = [
  { id: 'wxy', name: '王小雅', grade: '三年级', student_no: '2023001', ideal: '蛋糕师', avatar_seed: 0 },
  { id: 'lxj', name: '李小军', grade: '四年级', student_no: '2023002', ideal: '军人', avatar_seed: 1 },
  { id: 'zxh', name: '张小花', grade: '三年级', student_no: '2023003', ideal: undefined, avatar_seed: 2 },
  { id: 'lxh', name: '刘小虎', grade: '五年级', student_no: '2023004', ideal: '科学家', avatar_seed: 3 },
  { id: 'cxy', name: '陈小雨', grade: '四年级', student_no: '2023005', ideal: undefined, avatar_seed: 4 },
  { id: 'zxj', name: '周小杰', grade: '五年级', student_no: '2023006', ideal: '教师', avatar_seed: 5 },
  { id: 'wxx', name: '吴小雪', grade: '三年级', student_no: '2023007', ideal: undefined, avatar_seed: 6 },
  { id: 'zxy2', name: '郑小阳', grade: '四年级', student_no: '2023008', ideal: '医生', avatar_seed: 7 },
]

export type Region = {
  key: RegionKey
  name: string
  desc: string
}

export const regions: Region[] = [
  { key: 'yunnan', name: '云南山区', desc: '群山环绕的乡村学校' },
  { key: 'guizhou', name: '贵州梯田', desc: '层层叠叠的梯田风光' },
  { key: 'sichuan', name: '四川盆地', desc: '盆地边缘的小城镇' },
  { key: 'gansu', name: '甘肃戈壁', desc: '戈壁滩上的绿洲村庄' },
  { key: 'shaanxi', name: '陕西黄土', desc: '黄土高原的窑洞村落' },
  { key: 'guangxi', name: '广西丘陵', desc: '丘陵地带的稻田村庄' },
]

export type ChatMsg =
  | { from: 'ai'; text: string }
  | { from: 'me'; text: string }
  | { from: 'ai'; image: 'cake' | 'dream'; text: string }

export const chatScript: ChatMsg[] = [
  { from: 'ai', text: '你好呀！我是小信 ✨ 今天想和你聊聊你的梦想。你长大以后想做什么呀？' },
  { from: 'me', text: '小信，我长大了想卖蛋糕！我最喜欢吃甜甜的蛋糕了' },
  { from: 'ai', text: '长大以后想卖甜甜的蛋糕也太美好啦～那你最喜欢什么口味的蛋糕呀？你有没有试着做过蛋糕呢？哪怕帮妈妈打打下手也算哦～' },
  { from: 'me', text: '有！我上周帮妈妈揉了面团，虽然弄得满脸都是面粉……' },
  { from: 'ai', text: '哈哈哈太可爱了！满脸面粉也是蛋糕师的勋章呢 👏 你看，我已经能想象出你当蛋糕师的样子了——' },
  { from: 'ai', image: 'cake', text: '先送你一个梦想小蛋糕！再聊两句，我就把你的专属电子宠物画出来～' },
  { from: 'me', text: '好呀！我还想学会做草莓味的纸杯蛋糕，带给班里的同学吃' },
  { from: 'ai', image: 'dream', text: '叮咚——你的专属电子宠物生成啦！戴着厨师帽、拿着打蛋器的小蛋糕师，以后它会陪着你一起长大。记得我们的约定：这周再帮妈妈做一次小点心哦！' },
]

export type Letter = {
  id: string
  week: string
  date: string
  is_read: boolean
  preview: string
  body: string[]
}

export const letters: Letter[] = [
  {
    id: 'w3',
    week: '第 3 周的来信',
    date: '07-28',
    is_read: false,
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
    is_read: true,
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
    is_read: true,
    preview: '这是我们写给你的第一封信。从今天起，你有了一只……',
    body: [
      '致龙头山镇中心小学三年级的王小雅同学：',
      '这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。',
      '你说过，你的梦想是成为一名蛋糕师。记住这个甜甜的心愿，以后的每一周，我都想听听你为它做了什么。',
      '慢慢来，梦想不怕小，就怕不去靠近它。',
    ],
  },
]

export type SubjectScore = { subject: string; score: number; trend: 'up' | 'down' | 'flat' }

export type AcademicRow = {
  id: string
  scores: SubjectScore[]
  role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
  note: string
}

export const academicRows: AcademicRow[] = [
  {
    id: 'wxy',
    scores: [
      { subject: '语文', score: 88, trend: 'up' },
      { subject: '数学', score: 76, trend: 'down' },
      { subject: '英语', score: 82, trend: 'flat' },
    ],
    role: 'member',
    note: '课余常帮妈妈做家务，动手能力强，提到做蛋糕时眼睛发亮',
  },
  {
    id: 'lxj',
    scores: [
      { subject: '语文', score: 79, trend: 'flat' },
      { subject: '数学', score: 85, trend: 'up' },
      { subject: '英语', score: 71, trend: 'up' },
    ],
    role: 'group_leader',
    note: '体育课表现突出，纪律性强，爷爷曾是退伍军人',
  },
  {
    id: 'zxh',
    scores: [
      { subject: '语文', score: 92, trend: 'up' },
      { subject: '数学', score: 68, trend: 'down' },
      { subject: '英语', score: 75, trend: 'flat' },
    ],
    role: 'member',
    note: '喜欢画画，作文常写到山外面的世界，性格偏内向',
  },
  {
    id: 'lxh',
    scores: [
      { subject: '语文', score: 74, trend: 'flat' },
      { subject: '数学', score: 95, trend: 'up' },
      { subject: '英语', score: 80, trend: 'up' },
    ],
    role: 'subject_rep',
    note: '对自然科学兴趣浓厚，常问"为什么"，家里支持读书',
  },
  {
    id: 'cxy',
    scores: [
      { subject: '语文', score: 66, trend: 'down' },
      { subject: '数学', score: 62, trend: 'down' },
      { subject: '英语', score: 58, trend: 'down' },
    ],
    role: 'member',
    note: '父母外出务工，由奶奶照顾，近期上课注意力下降，需要更多关注',
  },
  {
    id: 'zxj',
    scores: [
      { subject: '语文', score: 86, trend: 'up' },
      { subject: '数学', score: 78, trend: 'flat' },
      { subject: '英语', score: 84, trend: 'up' },
    ],
    role: 'subject_rep',
    note: '乐于帮助同学讲题，说想像老师一样站上讲台',
  },
  {
    id: 'wxx',
    scores: [
      { subject: '语文', score: 71, trend: 'flat' },
      { subject: '数学', score: 65, trend: 'down' },
      { subject: '英语', score: 69, trend: 'flat' },
    ],
    role: 'member',
    note: '刚转学过来一学期，还在适应新环境，课堂发言较少',
  },
  {
    id: 'zxy2',
    scores: [
      { subject: '语文', score: 83, trend: 'up' },
      { subject: '数学', score: 88, trend: 'up' },
      { subject: '英语', score: 79, trend: 'flat' },
    ],
    role: 'member',
    note: '奶奶生病后开始说想当医生，责任感强，成绩稳步上升',
  },
]

export type PetState = 'daily' | 'gray' | 'cheer'

export type GrowthRow = {
  id: string
  state: PetState
  needs_care: boolean
  signal?: string
}

export const growthRows: GrowthRow[] = [
  { id: 'wxy', state: 'daily', needs_care: false },
  { id: 'lxj', state: 'cheer', needs_care: false },
  { id: 'zxh', state: 'daily', needs_care: false },
  { id: 'lxh', state: 'cheer', needs_care: false },
  { id: 'cxy', state: 'gray', needs_care: true, signal: '连续两次提到"想爸爸妈妈"，建议本周安排一次线下谈心' },
  { id: 'zxj', state: 'daily', needs_care: false },
  { id: 'wxx', state: 'gray', needs_care: true, signal: '转学适应期，情绪偏紧张，建议先从兴趣话题切入' },
  { id: 'zxy2', state: 'daily', needs_care: false },
]

export type CourseRecord = {
  id: string
  title: string
  date: string
  duration: string
  joined: number
  status: '已完成' | '进行中'
  goal: string
  traces: string[]
}

export const courseRecords: CourseRecord[] = [
  {
    id: 'c4',
    title: '我的梦想清单',
    date: '08-01',
    duration: '40 分钟',
    joined: 5,
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
    status: '已完成',
    goal: '建立信任：让每位同学和 AI 打招呼，说一件开心的事',
    traces: ['全班建立成长档案', '每人领到专属像素小宠物'],
  },
]

export const promises = [
  { text: '我要每天帮妈妈做一次家务', done: true },
  { text: '我要学会做一个纸杯蛋糕', done: false },
]

export const chatHistory = [
  { date: '今天', topic: '蛋糕师的梦想', state: 'cheer' as PetState, mins: 6 },
  { date: '昨天', topic: '帮妈妈揉面团', state: 'daily' as PetState, mins: 5 },
  { date: '3 天前', topic: '甜甜的纸杯蛋糕', state: 'daily' as PetState, mins: 8 },
  { date: '上周', topic: '第一次说出梦想', state: 'daily' as PetState, mins: 4 },
]
