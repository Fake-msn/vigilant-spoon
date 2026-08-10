import { ApiClientError } from '@/api/client'
import { academicRows, courseRecords, regions, students } from '@/mocks/data'
import { speciesFromIdeal, type PetSpecies } from '@/components/art'
import type { Profile } from '@/stores/session'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type ChatItem = { date: string; topic: string; state: 'daily' | 'gray' | 'cheer'; mins: number }
type LedgerItem = { id: number; name: string; points: number; note: string | null; created_at: string }

/** 每个学生的宠物数值（growth_value / stage / state / hunger / mood / points_total / level）—— getGrowth 和 getClassPets 共享 */
const petExtras: Record<string, {
  stage: number; growth_value: number; state: 'daily' | 'gray' | 'cheer'
  needs_care: boolean; last_topic: string; hunger: number; mood: number
  points_total: number; level: number
}> = {
  wxy:  { stage: 1, growth_value: 35, state: 'daily', needs_care: false, last_topic: '蛋糕师的梦想', hunger: 40, mood: 65, points_total: 35, level: 1 },
  lxj:  { stage: 2, growth_value: 62, state: 'cheer', needs_care: false, last_topic: '爷爷的军装',   hunger: 25, mood: 85, points_total: 62, level: 2 },
  zxh:  { stage: 1, growth_value: 28, state: 'daily', needs_care: false, last_topic: '画梯田的颜色', hunger: 45, mood: 55, points_total: 28, level: 1 },
  lxh:  { stage: 2, growth_value: 75, state: 'cheer', needs_care: false, last_topic: '星星为什么眨眼', hunger: 20, mood: 90, points_total: 75, level: 2 },
  cxy:  { stage: 0, growth_value: 12, state: 'gray',  needs_care: true,  last_topic: '想爸爸妈妈',   hunger: 70, mood: 30, points_total: 12, level: 0 },
  zxj:  { stage: 1, growth_value: 48, state: 'daily', needs_care: false, last_topic: '帮同桌讲题',    hunger: 35, mood: 70, points_total: 48, level: 1 },
  wxx:  { stage: 0, growth_value: 18, state: 'gray',  needs_care: true,  last_topic: '新学校的第一天', hunger: 65, mood: 35, points_total: 18, level: 0 },
  zxy2: { stage: 2, growth_value: 55, state: 'daily', needs_care: false, last_topic: '奶奶今天精神好多了', hunger: 30, mood: 75, points_total: 55, level: 2 },
}

/** 每个学生的积分流水 —— getStudentPoints 使用 */
const studentLedgers: Record<string, LedgerItem[]> = {
  wxy: [
    { id: 1, name: '主动举手发言', points: 5,  note: '分享做蛋糕的心得', created_at: '2026-07-28T10:00:00+00:00' },
    { id: 2, name: '作业优秀',     points: 15, note: '作文《我的蛋糕梦》', created_at: '2026-07-24T10:00:00+00:00' },
    { id: 3, name: '回答正确',     points: 10, note: '数学课分数运算',   created_at: '2026-07-22T10:00:00+00:00' },
  ],
  lxj: [
    { id: 1, name: '主动举手发言', points: 5,  note: '讲爷爷当兵的故事', created_at: '2026-07-28T10:00:00+00:00' },
    { id: 2, name: '作业按时提交', points: 8,  note: null,               created_at: '2026-07-25T10:00:00+00:00' },
    { id: 3, name: '回答正确',     points: 10, note: '体育课队列指令',   created_at: '2026-07-23T10:00:00+00:00' },
  ],
  zxh: [
    { id: 1, name: '作业优秀',     points: 15, note: '作文《山外面的城市》获优星', created_at: '2026-07-28T10:00:00+00:00' },
    { id: 2, name: '主动举手发言', points: 5,  note: '美术课分享梯田画作',         created_at: '2026-07-26T10:00:00+00:00' },
  ],
  lxh: [
    { id: 1, name: '回答正确',     points: 10, note: '科学课解释星星眨眼', created_at: '2026-07-28T10:00:00+00:00' },
    { id: 2, name: '作业优秀',     points: 15, note: '自然观察日记',       created_at: '2026-07-27T10:00:00+00:00' },
    { id: 3, name: '主动举手发言', points: 5,  note: '提问小苏打实验',     created_at: '2026-07-24T10:00:00+00:00' },
  ],
  cxy: [
    { id: 1, name: '作业按时提交', points: 8, note: null, created_at: '2026-07-28T10:00:00+00:00' },
  ],
  zxj: [
    { id: 1, name: '主动举手发言', points: 5,  note: '带读课文',           created_at: '2026-07-28T10:00:00+00:00' },
    { id: 2, name: '回答正确',     points: 10, note: '帮同桌讲数学题',     created_at: '2026-07-25T10:00:00+00:00' },
    { id: 3, name: '作业优秀',     points: 15, note: '读书笔记《给奶奶的故事》', created_at: '2026-07-22T10:00:00+00:00' },
  ],
  wxx: [
    { id: 1, name: '主动举手发言', points: 5, note: '第一次在新班级发言', created_at: '2026-07-28T10:00:00+00:00' },
    { id: 2, name: '作业按时提交', points: 8, note: null,                created_at: '2026-07-26T10:00:00+00:00' },
  ],
  zxy2: [
    { id: 1, name: '回答正确',     points: 10, note: '健康课讲量体温',     created_at: '2026-07-28T10:00:00+00:00' },
    { id: 2, name: '作业优秀',     points: 15, note: '作文《我想当医生》', created_at: '2026-07-25T10:00:00+00:00' },
    { id: 3, name: '主动举手发言', points: 5,  note: '分享奶奶康复的故事', created_at: '2026-07-23T10:00:00+00:00' },
  ],
}

/** 根据宠物种类返回个性化的成长承诺、周记文案和谈心记录 */
function growthFlavor(species: PetSpecies, _ideal: string | null) {
  const flavors: Record<PetSpecies, {
    commitments: { id: string; text: string; created_at: string; status: 'fulfilled' | 'active' }[]
    last_gist: string
    history: ChatItem[]
  }> = {
    baker: {
      commitments: [
        { id: 'c1', text: '我要每天帮妈妈做一次家务', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要学会做一个纸杯蛋糕', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '这周揉了面团，离蛋糕师更近一步',
      history: [
        { date: '今天',    topic: '蛋糕师的梦想',   state: 'cheer', mins: 6 },
        { date: '昨天',    topic: '帮妈妈揉面团',   state: 'daily', mins: 5 },
        { date: '3 天前', topic: '甜甜的纸杯蛋糕', state: 'daily', mins: 8 },
        { date: '上周',    topic: '第一次说出梦想', state: 'daily', mins: 4 },
      ],
    },
    soldier: {
      commitments: [
        { id: 'c1', text: '我要每天早起跑步锻炼身体', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要学会把被子叠成豆腐块', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '听爷爷讲了站岗的故事，我要像他一样勇敢',
      history: [
        { date: '今天',    topic: '爷爷的军装',     state: 'cheer', mins: 7 },
        { date: '昨天',    topic: '学站军姿',       state: 'daily', mins: 5 },
        { date: '3 天前', topic: '被子叠豆腐块',   state: 'daily', mins: 6 },
        { date: '上周',    topic: '长大要参军',     state: 'daily', mins: 4 },
      ],
    },
    painter: {
      commitments: [
        { id: 'c1', text: '我要把家门口的大山画下来', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要每天画一幅小画送给同学', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '这周画了山外面的城市，用了好多颜色',
      history: [
        { date: '今天',    topic: '画梯田的颜色',     state: 'daily', mins: 6 },
        { date: '昨天',    topic: '山外面的城市',     state: 'daily', mins: 8 },
        { date: '3 天前', topic: '送给同学的小画',   state: 'cheer', mins: 5 },
        { date: '上周',    topic: '第一次画梦想',     state: 'daily', mins: 4 },
      ],
    },
    police: {
      commitments: [
        { id: 'c1', text: '我要每天按时到校不迟到', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要帮老师维持课间秩序', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '帮老师整理了路队，大家都说我像小警察',
      history: [
        { date: '今天',    topic: '整理路队',         state: 'cheer', mins: 5 },
        { date: '昨天',    topic: '课间秩序小助手',   state: 'daily', mins: 6 },
        { date: '3 天前', topic: '不迟到打卡',       state: 'daily', mins: 4 },
        { date: '上周',    topic: '我想当警察',       state: 'daily', mins: 5 },
      ],
    },
    firefighter: {
      commitments: [
        { id: 'c1', text: '我要记住家里的逃生路线', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要提醒奶奶注意用火安全', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '学会了灭火器的用法，消防员叔叔夸我认真',
      history: [
        { date: '今天',    topic: '学用灭火器',       state: 'cheer', mins: 7 },
        { date: '昨天',    topic: '家里的逃生路线',   state: 'daily', mins: 5 },
        { date: '3 天前', topic: '提醒奶奶用火安全', state: 'daily', mins: 4 },
        { date: '上周',    topic: '消防员叔叔真勇敢', state: 'daily', mins: 6 },
      ],
    },
    pilot: {
      commitments: [
        { id: 'c1', text: '我要保护好眼睛不近视', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要每次坐飞机都记下看到的风景', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '折了一架纸飞机飞得好远，以后要开真的飞机',
      history: [
        { date: '今天',    topic: '折纸飞机大赛',     state: 'cheer', mins: 6 },
        { date: '昨天',    topic: '保护眼睛的好习惯', state: 'daily', mins: 5 },
        { date: '3 天前', topic: '云朵的形状',       state: 'daily', mins: 4 },
        { date: '上周',    topic: '我想开飞机',       state: 'daily', mins: 5 },
      ],
    },
    astronaut: {
      commitments: [
        { id: 'c1', text: '我要每天认识一颗新的星星', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要坚持锻炼身体变强壮', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '今晚看到了北斗七星，离太空又近了一点',
      history: [
        { date: '今天',    topic: '认识北斗七星',     state: 'cheer', mins: 7 },
        { date: '昨天',    topic: '锻炼身体变强壮',   state: 'daily', mins: 5 },
        { date: '3 天前', topic: '火箭怎么飞上天',   state: 'daily', mins: 6 },
        { date: '上周',    topic: '我想去太空',       state: 'daily', mins: 4 },
      ],
    },
    engineer: {
      commitments: [
        { id: 'c1', text: '我要用积木搭一座结实的桥', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要学好数学画图', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '用树枝搭了小水渠，引水浇了菜地',
      history: [
        { date: '今天',    topic: '搭小水渠引水',     state: 'cheer', mins: 8 },
        { date: '昨天',    topic: '积木桥承重测试',   state: 'daily', mins: 6 },
        { date: '3 天前', topic: '数学画图练习',     state: 'daily', mins: 5 },
        { date: '上周',    topic: '我想造大桥',       state: 'daily', mins: 4 },
      ],
    },
    musician: {
      commitments: [
        { id: 'c1', text: '我要每天练习唱一首歌', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要学会认五个音符', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '在音乐课上领唱了，同学们都跟着我一起唱',
      history: [
        { date: '今天',    topic: '音乐课领唱',       state: 'cheer', mins: 6 },
        { date: '昨天',    topic: '认五个音符',       state: 'daily', mins: 5 },
        { date: '3 天前', topic: '练习新歌',         state: 'daily', mins: 7 },
        { date: '上周',    topic: '我想当音乐家',     state: 'daily', mins: 4 },
      ],
    },
    athlete: {
      commitments: [
        { id: 'c1', text: '我要每天绕操场跑两圈', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要学会正确的拉伸动作', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '运动会100米跑了第三名，下次要更快',
      history: [
        { date: '今天',    topic: '运动会100米',     state: 'cheer', mins: 7 },
        { date: '昨天',    topic: '练习拉伸动作',     state: 'daily', mins: 5 },
        { date: '3 天前', topic: '绕操场跑两圈',     state: 'daily', mins: 6 },
        { date: '上周',    topic: '我想当运动员',     state: 'daily', mins: 4 },
      ],
    },
    writer: {
      commitments: [
        { id: 'c1', text: '我要每天写一篇小日记', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要读完一本故事书并讲给别人听', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '写了一篇关于梯田的作文，老师给了优星',
      history: [
        { date: '今天',    topic: '梯田作文获优星',   state: 'cheer', mins: 6 },
        { date: '昨天',    topic: '读故事书',         state: 'daily', mins: 8 },
        { date: '3 天前', topic: '写小日记',         state: 'daily', mins: 5 },
        { date: '上周',    topic: '我想当作家',       state: 'daily', mins: 4 },
      ],
    },
    scientist: {
      commitments: [
        { id: 'c1', text: '我要每天观察一颗星星并记录', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要读完《十万个为什么》第一册', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '做了小苏打和醋的实验，泡泡像火山喷发！',
      history: [
        { date: '今天',    topic: '星星为什么眨眼',   state: 'cheer', mins: 7 },
        { date: '昨天',    topic: '小苏打火山实验',   state: 'cheer', mins: 8 },
        { date: '3 天前', topic: '十万个为什么',     state: 'daily', mins: 6 },
        { date: '上周',    topic: '观察蚂蚁搬家',     state: 'daily', mins: 5 },
      ],
    },
    teacher: {
      commitments: [
        { id: 'c1', text: '我要帮同桌讲会一道数学题', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要把今天学到的故事讲给奶奶听', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '今天带读了课文，老师说我声音很洪亮',
      history: [
        { date: '今天',    topic: '帮同桌讲题',       state: 'daily', mins: 6 },
        { date: '昨天',    topic: '带读课文',         state: 'cheer', mins: 5 },
        { date: '3 天前', topic: '给奶奶讲故事',     state: 'daily', mins: 7 },
        { date: '上周',    topic: '站上讲台的梦',     state: 'daily', mins: 4 },
      ],
    },
    doctor: {
      commitments: [
        { id: 'c1', text: '我要提醒奶奶按时吃药', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要学会三种伤口的简单处理', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '奶奶今天精神好多了，我帮她量了体温',
      history: [
        { date: '今天',    topic: '奶奶今天精神好了',   state: 'daily', mins: 6 },
        { date: '昨天',    topic: '学量体温',           state: 'daily', mins: 5 },
        { date: '3 天前', topic: '提醒奶奶吃药',       state: 'daily', mins: 4 },
        { date: '上周',    topic: '想治病救人',         state: 'daily', mins: 5 },
      ],
    },
    sprout: {
      commitments: [
        { id: 'c1', text: '我要认真写下今天最开心的一件事', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要试着和新同学说一句话', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '梦想还在悄悄发芽，我会慢慢找到它',
      history: [
        { date: '今天',    topic: '今天开心的事',     state: 'daily', mins: 5 },
        { date: '昨天',    topic: '和新同学说话',     state: 'daily', mins: 4 },
        { date: '3 天前', topic: '悄悄发芽的梦想',   state: 'gray',  mins: 6 },
        { date: '上周',    topic: '第一次见面',       state: 'daily', mins: 4 },
      ],
    },
    cat: {
      commitments: [
        { id: 'c1', text: '我要每天认真完成作业', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' },
        { id: 'c2', text: '我要帮家里做一件力所能及的事', created_at: '2026-07-21T10:00:00+00:00', status: 'active' },
      ],
      last_gist: '每天都在慢慢长大',
      history: [
        { date: '今天',    topic: '认真完成作业',     state: 'daily', mins: 5 },
        { date: '昨天',    topic: '帮家里做事',       state: 'daily', mins: 4 },
        { date: '3 天前', topic: '慢慢长大',         state: 'daily', mins: 5 },
        { date: '上周',    topic: '第一次见面',       state: 'daily', mins: 4 },
      ],
    },
  }
  return flavors[species]
}

/** 统一清洗班级码：去首尾空白 + 强制大写，与 realClient 保持一致 */
function normalizeClassCode(code: string): string {
  return code.trim().toUpperCase()
}

const ADMIN_PASSWORD = 'admin123'

// 已注册教师账号（演示：李老师默认已通过审核且未设密码；新注册账号待管理员审核）
// status: pending（待审核）/ active（已通过）/ rejected（已驳回）
const mockTeachers: { name: string; school: string; phone: string; subject: string; title: string; password_hash: string | null; status: 'pending' | 'active' | 'rejected' }[] = [
  { name: '李老师', school: '龙头山镇中心小学', phone: '', subject: '道德与法治', title: '一级教师', password_hash: null, status: 'active' },
]

export const mockClient = {
  async createClass(req: {
    class_name: string
    school: string
    region_key: string
    city?: string
    county?: string
    town?: string
    grade: string
    class_no: string
    students: { name: string; grade: string; avatar_seed: number; ideal?: string }[]
  }) {
    await delay(400)
    const class_code = `S${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    const region = regions.find((r) => r.key === req.region_key) ?? regions[0]
    return {
      class_code,
      class_name: req.class_name,
      school: req.school,
      region_key: region.key,
      region_name: region.name,
      grade: req.grade,
      class_no: req.class_no,
      students: req.students.map((s, i) => ({
        id: `${class_code}-${i + 1}`,
        name: s.name,
        student_no: `${class_code}-${i + 1}`,
        grade: s.grade || req.grade,
        avatar_seed: s.avatar_seed,
        role: 'member',
        region_key: region.key,
        region_name: region.name,
        ideal: s.ideal,
      })),
    }
  },

  async getClass(code: string) {
    await delay(300)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    const region = regions[0]
    return {
      class_code: $code,
      class_name: '三（1）班',
      school: '龙头山镇中心小学',
      region_key: region.key,
      region_name: region.name,
      grade: '三年级',
      class_no: '1',
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        student_no: s.student_no,
        grade: s.grade,
        avatar_seed: s.avatar_seed,
        role: s.role ?? 'member',
        region_key: region.key,
        region_name: region.name,
        ideal: s.ideal,
      })),
    }
  },

  async enter(code: string, studentName: string) {
    await delay(300)
    const $code = normalizeClassCode(code)
    const student = students.find((s) => s.name === studentName)
    if (!student) {
      throw new ApiClientError('姓名不在班级名单中', 404, 'STUDENT_NOT_FOUND')
    }
    const region = regions[0]
    const profile: Profile = {
      id: student.id,
      name: student.name,
      grade: student.grade,
      student_no: student.student_no,
      avatar_seed: student.avatar_seed,
      ideal: student.ideal,
      class_code: $code,
      region_key: region.key,
      region_name: region.name,
    }
    return {
      session_token: `st_${student.id.padEnd(48, '0').slice(0, 48)}`,
      profile,
    }
  },

  async teacherEnter(code: string, teacherName: string, password?: string) {
    await delay(300)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    const account = mockTeachers.find((t) => t.name === teacherName)
    if (!account) {
      throw new ApiClientError('该教师尚未注册，请先完成账号注册', 404, 'TEACHER_NOT_REGISTERED')
    }
    if (account.status === 'pending') {
      throw new ApiClientError('该教师账号正在等待管理员审核，暂无法登录', 403, 'TEACHER_PENDING_REVIEW')
    }
    if (account.status === 'rejected') {
      throw new ApiClientError('该教师账号已被驳回', 403, 'TEACHER_REJECTED')
    }
    if (account.password_hash && account.password_hash !== password) {
      throw new ApiClientError('密码不正确', 401, 'WRONG_PASSWORD')
    }
    const region = regions[0]
    return {
      session_token: `st_${teacherName.padEnd(48, '0').slice(0, 48)}`,
      profile: {
        id: `teacher-${teacherName}`,
        name: teacherName,
        role: 'teacher' as const,
        class_code: $code,
        class_name: '三（1）班',
        school: account.school || '龙头山镇中心小学',
        region_key: region.key,
        region_name: region.name,
      },
      expires_at: new Date().toISOString(),
    }
  },

  // 不指定班级码的教师登录：校验姓名+密码，默认分配首个任教班级生成会话（与 getTeacherClasses 返回的首个班级保持一致）
  async teacherLogin(teacherName: string, password?: string) {
    await delay(300)
    const account = mockTeachers.find((t) => t.name === teacherName)
    if (!account) {
      throw new ApiClientError('该教师尚未注册，请先完成账号注册', 404, 'TEACHER_NOT_REGISTERED')
    }
    if (account.status === 'pending') {
      throw new ApiClientError('该教师账号正在等待管理员审核，暂无法登录', 403, 'TEACHER_PENDING_REVIEW')
    }
    if (account.status === 'rejected') {
      throw new ApiClientError('该教师账号已被驳回', 403, 'TEACHER_REJECTED')
    }
    if (account.password_hash && account.password_hash !== password) {
      throw new ApiClientError('密码不正确', 401, 'WRONG_PASSWORD')
    }
    // 取默认任教班级（首个），确保后续课堂相关页面可直接读取 class_code/class_name
    const defaultClass = (await this.getTeacherClasses()).classes[0]
    const region = regions.find((r) => r.key === 'yunnan') ?? regions[0]
    const classCode = defaultClass ? normalizeClassCode(defaultClass.class_code) : 'LTZ2024'
    const className = defaultClass?.class_name ?? '三（1）班'
    const school = (account.school || defaultClass?.school || '龙头山镇中心小学').trim() || '龙头山镇中心小学'
    return {
      session_token: `st_${teacherName.padEnd(48, '0').slice(0, 48)}`,
      profile: {
        id: `teacher-${teacherName}`,
        name: teacherName,
        role: 'teacher' as const,
        class_code: classCode,
        class_name: className,
        school,
        region_key: region.key,
        region_name: region.name,
      },
      expires_at: new Date().toISOString(),
    }
  },

  async teacherRegister(req: {
    name: string
    school?: string
    phone?: string
    subject?: string
    title?: string
    password?: string
  }) {
    await delay(300)
    const name = req.name.trim()
    if (mockTeachers.some((t) => t.name === name)) {
      throw new ApiClientError('该教师姓名已被注册', 409, 'TEACHER_EXISTS')
    }
    const account = {
      name,
      school: (req.school || '').trim(),
      phone: (req.phone || '').trim(),
      subject: (req.subject || '').trim(),
      title: (req.title || '').trim(),
      password_hash: req.password || null,
      status: 'pending' as const,
    }
    mockTeachers.push(account)
    return {
      teacher_id: `teacher-${name}`,
      name,
      school: account.school,
      phone: account.phone,
      subject: account.subject,
      title: account.title,
      has_password: !!account.password_hash,
      status: account.status,
    }
  },

  async getTeacherAccount() {
    await delay(200)
    const name = '李老师'
    const account = mockTeachers.find((t) => t.name === name)
    return {
      teacher_id: `teacher-${name}`,
      name,
      school: account?.school || '',
      phone: account?.phone || '',
      subject: account?.subject || '',
      title: account?.title || '',
      has_password: !!account?.password_hash,
      status: account?.status || 'active',
    }
  },

  async updateTeacherAccount(req: {
    school?: string | null
    phone?: string | null
    subject?: string | null
    title?: string | null
  }) {
    await delay(200)
    const name = '李老师'
    const account = mockTeachers.find((t) => t.name === name)
    if (account) {
      if (req.school !== undefined) account.school = req.school || ''
      if (req.phone !== undefined) account.phone = req.phone || ''
      if (req.subject !== undefined) account.subject = req.subject || ''
      if (req.title !== undefined) account.title = req.title || ''
    }
    return {
      teacher_id: `teacher-${name}`,
      name,
      school: account?.school || req.school || '',
      phone: account?.phone || req.phone || '',
      subject: account?.subject || req.subject || '',
      title: account?.title || req.title || '',
      has_password: !!account?.password_hash,
      status: account?.status || 'active',
    }
  },

  async updateTeacherPassword(req: { old_password?: string | null; new_password: string }) {
    await delay(200)
    const name = '李老师'
    const account = mockTeachers.find((t) => t.name === name)
    if (account?.password_hash && account.password_hash !== req.old_password) {
      throw new ApiClientError('密码不正确', 401, 'WRONG_PASSWORD')
    }
    if (account) account.password_hash = req.new_password
    return {
      teacher_id: `teacher-${name}`,
      name,
      school: account?.school || '',
      phone: account?.phone || '',
      subject: account?.subject || '',
      title: account?.title || '',
      has_password: true,
    }
  },

  async getTeacherClasses() {
    await delay(300)
    return {
      teacher_id: 'teacher-李老师',
      name: '李老师',
      school: '龙头山镇中心小学',
      classes: [
        {
          class_code: 'LTZ2024',
          class_name: '三（1）班',
          school: '龙头山镇中心小学',
          region_key: 'yunnan',
          city: '昭通市',
          county: '鲁甸县',
          town: '龙头山镇',
          grade: '三年级',
          class_no: '1',
        },
      ],
    }
  },

  async teacherSwitch(classCode: string) {
    await delay(300)
    const $code = normalizeClassCode(classCode)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    const region = regions[0]
    return {
      session_token: `st_${$code.padEnd(48, '0').slice(0, 48)}`,
      profile: {
        id: `teacher-李老师`,
        name: '李老师',
        role: 'teacher' as const,
        class_code: $code,
        class_name: '三（1）班',
        school: '龙头山镇中心小学',
        region_key: region.key,
        region_name: region.name,
      },
      expires_at: new Date().toISOString(),
    }
  },

  async startClass(code: string) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    return {
      session_id: `cls-${$code}`,
      state: 'active' as const,
      current_student: students[0]?.id ?? null,
      current_slot: null,
      turn_count: 1,
      updated_at: new Date().toISOString(),
    }
  },

  async controlClass(
    code: string,
    action: string,
    _clientCmdId: string,
    payload?: Record<string, unknown>,
  ) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    const slot = typeof payload?.slot === 'string' ? payload.slot : null
    const selected = typeof payload?.student_id === 'string' ? payload.student_id : null
    return {
      session_id: `cls-${$code}`,
      state: action === 'pause' ? ('paused' as const) : ('active' as const),
      current_student: selected ?? students[0]?.id ?? null,
      current_slot: slot,
      turn_count: 1,
      updated_at: new Date().toISOString(),
    }
  },

  async getClassStatus(code: string) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    return {
      session_id: `cls-${$code}`,
      state: 'idle' as const,
      current_student: null,
      current_slot: null,
      turn_count: 0,
      updated_at: new Date().toISOString(),
    }
  },

  async getGrowth(studentId: string) {
    await delay(200)
    const student = students.find((s) => s.id === studentId)
    if (!student) {
      throw new ApiClientError('学生不存在', 404, 'STUDENT_NOT_FOUND')
    }
    const ideal = student.ideal ?? null
    const species = speciesFromIdeal(ideal)
    const flavor = growthFlavor(species, ideal)
    const extra = petExtras[studentId] ?? petExtras.wxy
    const stageLabel = extra.stage >= 3 ? 'bloom' : extra.stage === 2 ? 'bud' : extra.stage === 1 ? 'sprout' : 'egg'
    return {
      ideal,
      commitments: flavor.commitments,
      last_gist: flavor.last_gist,
      growth_value: extra.growth_value,
      stage: stageLabel,
      pet: {
        species,
        stage: extra.stage,
        state: extra.state,
        growth_value: extra.growth_value,
        last_growth_at: new Date().toISOString(),
        cheer_until: extra.state === 'cheer' ? new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString() : null,
        needs_care: extra.needs_care,
        portrait_url: null,
        updated_at: new Date().toISOString(),
        points_total: extra.points_total,
        level: extra.level,
        hunger: extra.hunger,
        mood: extra.mood,
      },
      actions: null,
      history: flavor.history,
    }
  },

  async updateCommitments(
    _studentId: string,
    commitments: { id: string; text: string; created_at?: string | null; status: 'active' | 'fulfilled' | 'expired' }[],
  ) {
    await delay(200)
    const now = new Date().toISOString()
    return commitments
      .filter((c) => c && c.text && c.text.trim().length > 0)
      .map((c, _idx, arr) => {
        // 基于 id 去重（只保留最后一个）
        const lastIdx = arr.findIndex((x) => x.id === c.id)
        if (lastIdx !== arr.indexOf(c)) return null
        return {
          id: c.id,
          text: c.text.trim(),
          created_at: c.created_at || now,
          status: c.status as 'active' | 'fulfilled' | 'expired',
        }
      })
      .filter(Boolean) as { id: string; text: string; created_at: string; status: 'active' | 'fulfilled' | 'expired' }[]
  },

  async getPet(studentId: string) {
    await delay(150)
    const student = students.find((s) => s.id === studentId)
    if (!student) {
      throw new ApiClientError('学生不存在', 404, 'STUDENT_NOT_FOUND')
    }
    const species = speciesFromIdeal(student.ideal ?? null)
    return {
      species,
      stage: 2,
      state: 'daily' as const,
      growth_value: 35,
      last_growth_at: new Date().toISOString(),
      cheer_until: null,
      needs_care: false,
      portrait_url: null,
      updated_at: new Date().toISOString(),
    }
  },

  async createPortrait(studentId: string, idempotencyKey?: string) {
    await delay(200)
    const jobId = idempotencyKey ? `portrait-${studentId}-${idempotencyKey.slice(0, 16)}` : `portrait-${studentId}`
    return { job_id: jobId }
  },

  async getJob(jobId: string) {
    await delay(150)
    return {
      job_id: jobId,
      status: 'done' as const,
      result_url: `/static/portraits/${jobId}.png`,
      error: null,
    }
  },

  async generateLesson(topic: string, goals: string[], guidance?: string) {
    await delay(400)
    return {
      lesson_id: `les-${Date.now().toString(36)}`,
      topic,
      goals,
      guidance_strategy: guidance || '',
      materials: [
        { title: '开场素材', content: `围绕「${topic}」创设语境，引导学生说出具体理想。` },
        ...(guidance ? [{ title: '引导策略', content: guidance }] : []),
        ...goals.map((g) => ({ title: '教学目标', content: g })),
      ],
      created_at: new Date().toISOString(),
    }
  },

  async getLesson(lessonId: string) {
    await delay(200)
    return {
      lesson_id: lessonId,
      topic: '示例课程',
      goals: ['引导每位同学说出一个具体理想'],
      guidance_strategy: '温和追问，鼓励内向学生先描述身边事。',
      materials: [{ title: '开场素材', content: '围绕主题创设语境。' }],
      created_at: new Date().toISOString(),
    }
  },

  async getClassLessons(code: string) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    return courseRecords.map((c) => ({
      lesson_id: c.id,
      topic: c.title,
      date: c.date,
      duration: c.duration,
      joined: c.joined,
      avg_score: null,
      status: c.status === '已完成' ? ('done' as const) : ('active' as const),
      goal: c.goal,
      traces: c.traces,
    }))
  },

  async addLessonTrace(lessonId: string, content: string) {
    await delay(200)
    const course = courseRecords.find((c) => c.id === lessonId)
    if (!course) {
      throw new ApiClientError('课程不存在', 404, 'LESSON_NOT_FOUND')
    }
    course.traces = [...course.traces, content]
    return {
      lesson_id: course.id,
      topic: course.title,
      date: course.date,
      duration: course.duration,
      joined: course.joined,
      avg_score: null,
      status: course.status === '已完成' ? ('done' as const) : ('active' as const),
      goal: course.goal,
      traces: course.traces,
    }
  },

  async getAcademicSummary(code: string) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    const records = academicRows.map((r) => {
      const s = students.find((x) => x.id === r.id)!
      return {
        student_id: r.id,
        student_no: s.student_no,
        name: s.name,
        role: r.role,
        scores: r.scores,
        background: r.background,
        teacher_note: r.note,
        updated_at: new Date().toISOString(),
      }
    })
    const allScores = records.flatMap((r) => r.scores.map((s) => s.score))
    const avg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
    const attention = records.reduce((sum, r) => sum + r.scores.filter((s) => s.trend === 'down').length, 0)
    return {
      records,
      summary: { count: records.length, avg_score: avg, attention_count: attention },
    }
  },

  async importAcademicJson(code: string, records: { student_no: string; scores: { subject: string; score: number }[]; role: string; background?: string; teacher_note?: string }[]) {
    await delay(300)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    const mapped = records.map((r) => {
      const s = students.find((x) => x.student_no === r.student_no)!
      return {
        student_id: s.id,
        student_no: r.student_no,
        name: s.name,
        role: r.role as 'member' | 'group_leader' | 'class_committee' | 'subject_rep',
        scores: r.scores.map((sc) => ({ ...sc, trend: 'flat' as const })),
        background: r.background || '',
        teacher_note: r.teacher_note || '',
        updated_at: new Date().toISOString(),
      }
    })
    return {
      records: mapped,
      summary: {
        count: mapped.length,
        avg_score: 0,
        attention_count: 0,
      },
    }
  },

  async manualAddAcademic(code: string, entry: { name: string; student_no?: string; scores: { subject: string; score: number }[]; role: string; background?: string; teacher_note?: string }) {
    await delay(300)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    const existing = academicRows.find((r) => {
      const s = students.find((x) => x.id === r.id)!
      return s.name === entry.name
    })
    if (!existing) {
      academicRows.push({
        id: `stu-${Date.now().toString(36)}`,
        scores: entry.scores.map((sc) => ({ ...sc, trend: 'flat' as const })),
        role: entry.role as 'member' | 'group_leader' | 'class_committee' | 'subject_rep',
        background: entry.background || '',
        note: entry.teacher_note || '',
      })
    }
    return this.getAcademicSummary($code)
  },

  async importAcademicFile(code: string, _file: File) {
    await delay(500)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    return this.getAcademicSummary($code)
  },

  async getClassPets(code: string) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') {
      throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    }
    return students.map((s) => {
      const extra = petExtras[s.id] ?? petExtras.wxy
      return {
        student_id: s.id,
        name: s.name,
        avatar_seed: s.avatar_seed,
        pet: {
          species: speciesFromIdeal(s.ideal),
          stage: extra.stage,
          state: extra.state,
          growth_value: extra.growth_value,
          last_growth_at: new Date().toISOString(),
          cheer_until: extra.state === 'cheer' ? new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() : null,
          needs_care: extra.needs_care,
          portrait_url: null,
          updated_at: new Date().toISOString(),
        },
      }
    })
  },

  // 方案 5.3 管理员后台（mock：内存态）
  async adminLogin(password: string) {
    await delay(300)
    if (password !== ADMIN_PASSWORD) {
      throw new ApiClientError('管理员密码错误', 401, 'INVALID_PASSWORD')
    }
    return { session_token: `ad_mock${Date.now().toString(36)}`, expires_at: new Date().toISOString() }
  },
  async getAdminConfig() {
    await delay(300)
    return {
      voice_provider: 'local',
      dashscope_api_key: '',
      dashscope_realtime_url: 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime',
      voice_model: 'qwen3.5-omni-flash-realtime',
      text_provider: 'template',
      text_model: 'qwen-plus',
      text_base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      text_api_key: '',
      image_provider: 'placeholder',
      image_model: 'wanx2.1-t2i-turbo',
      image_base_url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image',
      image_api_key: '',
      embed_provider: 'disabled',
      embed_model: 'text-embedding-v3',
      embed_base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      embed_api_key: '',
    }
  },
  async updateAdminConfig() {
    await delay(300)
    return this.getAdminConfig()
  },
  async getPendingTeachers() {
    await delay(300)
    return {
      items: mockTeachers
        .filter((t) => t.status === 'pending')
        .map((t) => ({
          teacher_id: `teacher-${t.name}`,
          name: t.name,
          school: t.school,
          phone: t.phone,
          subject: t.subject,
          title: t.title,
          created_at: new Date().toISOString(),
        })),
    }
  },
  async reviewTeacher(teacherId: string, req: { approve: boolean; reject_reason?: string }) {
    await delay(300)
    const name = teacherId.replace(/^teacher-/, '')
    const account = mockTeachers.find((t) => t.name === name)
    if (account) {
      account.status = req.approve ? 'active' : 'rejected'
    }
    return this.getPendingTeachers()
  },

  // RAG 知识库（mock：静态演示数据）
  async getKnowledgeStatus() {
    await delay(200)
    return {
      embed_provider: 'dashscope',
      embed_model: 'text-embedding-v3',
      configured: true,
      doc_count: 6,
      chunk_count: 6,
    }
  },
  async getKnowledgeDocs() {
    await delay(200)
    const items = [
      { doc_id: 'kd-seed-1', title: '思政课：我的梦想与理想教育', category: 'lesson', source: 'seed', chunk_count: 1, created_at: new Date().toISOString() },
      { doc_id: 'kd-seed-2', title: '思政课：家乡与远方', category: 'lesson', source: 'seed', chunk_count: 1, created_at: new Date().toISOString() },
      { doc_id: 'kd-seed-3', title: '评语范例：鼓励内向学生', category: 'comment', source: 'seed', chunk_count: 1, created_at: new Date().toISOString() },
      { doc_id: 'kd-seed-4', title: '评语范例：留守儿童关怀', category: 'comment', source: 'seed', chunk_count: 1, created_at: new Date().toISOString() },
      { doc_id: 'kd-seed-5', title: '班级规范：课堂发言', category: 'classroom', source: 'seed', chunk_count: 1, created_at: new Date().toISOString() },
      { doc_id: 'kd-seed-6', title: '班级规范：作业与小组合作', category: 'classroom', source: 'seed', chunk_count: 1, created_at: new Date().toISOString() },
    ]
    return { items, total: items.length }
  },
  async createKnowledgeDoc() {
    await delay(200)
    return this.getKnowledgeDocs()
  },
  async seedKnowledge() {
    await delay(200)
    return this.getKnowledgeDocs()
  },
  async deleteKnowledgeDoc() {
    await delay(200)
    return this.getKnowledgeDocs()
  },

  // 班宠积分制度（mock：内存态）
  async getPointRules(code: string) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    return [
      { rule_id: 'LTZ2024-hand-raise', name: '主动举手发言', points: 5, category: 'hand-raise', enabled: true },
      { rule_id: 'LTZ2024-answer', name: '回答正确', points: 10, category: 'answer', enabled: true },
      { rule_id: 'LTZ2024-homework-on-time', name: '作业按时提交', points: 8, category: 'homework-on-time', enabled: true },
      { rule_id: 'LTZ2024-homework-excellent', name: '作业优秀', points: 15, category: 'homework-excellent', enabled: true },
    ]
  },
  async updatePointRules(code: string, rules: { name: string; points: number }[]) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    return rules.map((r, i) => ({ rule_id: `LTZ2024-custom-${i}`, name: r.name, points: r.points, category: null, enabled: true }))
  },
  async awardPoints(code: string, req: { student_id: string; points?: number | null; name?: string | null }) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    const points = req.points ?? 5
    return { student_id: req.student_id, points, points_total: points, level: 1, leveled_up: false, hunger: 45, mood: 65, state: 'daily', ledger_id: Date.now() }
  },
  async getPointOverview(code: string) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    return {
      rules: [
        { rule_id: 'LTZ2024-hand-raise', name: '主动举手发言', points: 5, category: 'hand-raise', enabled: true },
        { rule_id: 'LTZ2024-answer', name: '回答正确', points: 10, category: 'answer', enabled: true },
        { rule_id: 'LTZ2024-homework-on-time', name: '作业按时提交', points: 8, category: 'homework-on-time', enabled: true },
        { rule_id: 'LTZ2024-homework-excellent', name: '作业优秀', points: 15, category: 'homework-excellent', enabled: true },
      ],
      students: students.map((s) => ({ id: s.id, name: s.name, group_id: null })),
      groups: [],
    }
  },
  async getGroups() { await delay(200); return [] },
  async configGroups(code: string, groups: { group_name: string }[]) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    return groups.map((g, i) => ({ group_id: `LTZ2024-g0${i + 1}`, group_name: g.group_name, color: null, members: [] }))
  },
  async getLeaderboard(code: string) {
    await delay(200)
    const $code = normalizeClassCode(code)
    if ($code !== 'LTZ2024') throw new ApiClientError('班级码不存在', 404, 'CLASS_NOT_FOUND')
    return { items: [] }
  },
  async getStudentPoints(studentId?: string) {
    await delay(200)
    if (!studentId) return []
    return studentLedgers[studentId] ?? []
  },

  // 信箱（mock：空列表，演示态不生成真实信件）
  async getLetters(_studentId: string) {
    await delay(200)
    return [] as {
      letter_id: string
      student_id: string
      title: string
      body: string
      generated_at: string
      source: 'template' | 'llm'
      is_read: boolean
    }[]
  },
  async generateLetter(_studentId: string) {
    await delay(200)
    return { job_id: `letter-${Date.now().toString(36)}` }
  },

  // 学生自定义头像上传（mock：不落盘，返回空 URL，前端会回退到默认 SVG）
  async uploadAvatar(_studentId: string, _file: File) {
    await delay(200)
    return { avatar_url: '' }
  },
}
