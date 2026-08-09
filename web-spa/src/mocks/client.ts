import { ApiClientError } from '@/api/client'
import { academicRows, courseRecords, regions, students } from '@/mocks/data'
import type { Profile } from '@/stores/session'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
    return {
      ideal: student.ideal ?? null,
      commitments: [
        { id: 'c1', text: '我要每天帮妈妈做一次家务', created_at: '2026-07-20T10:00:00+00:00', status: 'fulfilled' as const },
        { id: 'c2', text: '我要学会做一个纸杯蛋糕', created_at: '2026-07-21T10:00:00+00:00', status: 'active' as const },
      ],
      last_gist: '这周揉了面团，离蛋糕师更近一步',
      growth_value: 35,
      stage: 'egg',
      pet: {
        species: 'cat',
        stage: 2,
        state: 'daily' as const,
        growth_value: 35,
        last_growth_at: new Date().toISOString(),
        cheer_until: null,
        needs_care: false,
        portrait_url: null,
        updated_at: new Date().toISOString(),
        points_total: 120,
        level: 2,
        hunger: 45,
        mood: 65,
      },
      actions: null,
      history: null,
    }
  },

  async getPet(studentId: string) {
    await delay(150)
    const student = students.find((s) => s.id === studentId)
    if (!student) {
      throw new ApiClientError('学生不存在', 404, 'STUDENT_NOT_FOUND')
    }
    return {
      species: 'cat',
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
    return students.map((s) => ({
      student_id: s.id,
      name: s.name,
      avatar_seed: s.avatar_seed,
      pet: {
        species: 'cat',
        stage: 2,
        state: (s.id === 'cxy' || s.id === 'wxx' ? 'gray' : 'daily') as 'daily' | 'gray' | 'cheer',
        growth_value: 35,
        last_growth_at: new Date().toISOString(),
        cheer_until: null,
        needs_care: s.id === 'cxy' || s.id === 'wxx',
        portrait_url: null,
        updated_at: new Date().toISOString(),
      },
    }))
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
  async getStudentPoints() { await delay(200); return [] },
}
