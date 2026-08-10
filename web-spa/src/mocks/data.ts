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
  { id: 'zxh', name: '张小花', grade: '三年级', student_no: '2023003', ideal: '画家', avatar_seed: 2 },
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

/** 根据学生梦想生成个性化语音对话脚本 */
export function getChatScript(ideal: string | null | undefined): ChatMsg[] {
  const text = (ideal ?? '').trim()
  // 关键词匹配梦想 → 返回对应职业对话脚本
  if (text.includes('蛋糕') || text.includes('烘焙') || text.includes('面包') || text.includes('甜点')) {
    return chatScript // 蛋糕师脚本（原始脚本）
  }
  if (text.includes('军人') || text.includes('解放') || text.includes('当兵') || text.includes('部队') || text.includes('站岗')) {
    return [
      { from: 'ai', text: '你好呀！我是小信 ✨ 今天想和你聊聊你的梦想。你长大以后想做什么呀？' },
      { from: 'me', text: '小信，我长大了想当军人！像我爷爷一样保家卫国' },
      { from: 'ai', text: '像爷爷一样保家卫国，真了不起！那你平时有没有在锻炼身体呀？当军人可需要很好的体力哦～' },
      { from: 'me', text: '有！我每天早起跑步，还学着把被子叠成豆腐块呢' },
      { from: 'ai', text: '太棒了！叠豆腐块可是军人的基本功 👏 你看，我已经能想象出你穿军装的样子了——' },
      { from: 'ai', image: 'dream', text: '叮咚——你的专属电子宠物生成啦！穿着迷彩服、站得笔直的小军人，以后它会陪着你一起长大。记得我们的约定：这周继续坚持早起锻炼哦！' },
    ]
  }
  if (text.includes('画') || text.includes('美术') || text.includes('艺术')) {
    return [
      { from: 'ai', text: '你好呀！我是小信 ✨ 今天想和你聊聊你的梦想。你长大以后想做什么呀？' },
      { from: 'me', text: '小信，我长大了想当画家！我要把家门口的大山和梯田都画下来' },
      { from: 'ai', text: '把大山和梯田画下来，太美啦～那你平时有没有在画画呀？用什么画的呢？蜡笔、水彩都算哦～' },
      { from: 'me', text: '有！我昨天画了山外面的城市，用了好多颜色，虽然画得歪歪扭扭的……' },
      { from: 'ai', text: '歪歪扭扭也是一种风格呀！每一笔都是你眼中的世界 👏 你看，我已经能想象出你当画家的样子了——' },
      { from: 'ai', image: 'dream', text: '叮咚——你的专属电子宠物生成啦！拿着画笔、戴着调色盘的小画家，以后它会陪着你一起长大。记得我们的约定：这周再画一幅你最喜欢的风景哦！' },
    ]
  }
  if (text.includes('科学') || text.includes('天文') || text.includes('实验') || text.includes('发明') || text.includes('研究') || text.includes('星')) {
    return [
      { from: 'ai', text: '你好呀！我是小信 ✨ 今天想和你聊聊你的梦想。你长大以后想做什么呀？' },
      { from: 'me', text: '小信，我长大了想当科学家！我想知道星星为什么会眨眼' },
      { from: 'ai', text: '想知道星星为什么眨眼，这个问题太棒啦～那你平时有没有做过什么小实验或者观察呢？' },
      { from: 'me', text: '有！我用小苏打和醋做了实验，泡泡像火山一样喷出来了！' },
      { from: 'ai', text: '哇，火山喷发！你简直是个小小科学家 👏 你看，我已经能想象出你穿白大褂做实验的样子了——' },
      { from: 'ai', image: 'dream', text: '叮咚——你的专属电子宠物生成啦！穿着白大褂、拿着放大镜的小科学家，以后它会陪着你一起长大。记得我们的约定：这周再观察一个有趣的自然现象哦！' },
    ]
  }
  if (text.includes('老师') || text.includes('教师') || text.includes('教书')) {
    return [
      { from: 'ai', text: '你好呀！我是小信 ✨ 今天想和你聊聊你的梦想。你长大以后想做什么呀？' },
      { from: 'me', text: '小信，我长大了想当老师！我想像我们老师一样站上讲台' },
      { from: 'ai', text: '想站上讲台当老师，真有志气～那你平时有没有试着像小老师一样帮助同学呢？' },
      { from: 'me', text: '有！我昨天帮同桌讲了一道数学题，他听懂了可开心了' },
      { from: 'ai', text: '帮同桌讲题，这就是老师做的事呀！👏 你看，我已经能想象出你站上讲台的样子了——' },
      { from: 'ai', image: 'dream', text: '叮咚——你的专属电子宠物生成啦！拿着课本、戴着眼镜的小老师，以后它会陪着你一起长大。记得我们的约定：这周再帮一位同学讲一道题哦！' },
    ]
  }
  if (text.includes('医生') || text.includes('护士') || text.includes('治病') || text.includes('救人')) {
    return [
      { from: 'ai', text: '你好呀！我是小信 ✨ 今天想和你聊聊你的梦想。你长大以后想做什么呀？' },
      { from: 'me', text: '小信，我长大了想当医生！我奶奶生病了，我想治病救人' },
      { from: 'ai', text: '想治病救人，真是一个温暖的梦想～那你平时有没有学着照顾身边的人呢？' },
      { from: 'me', text: '有！我学会了帮奶奶量体温，还提醒她按时吃药呢' },
      { from: 'ai', text: '会量体温、会提醒吃药，你已经是奶奶的小护士啦 👏 你看，我已经能想象出你穿白大褂的样子了——' },
      { from: 'ai', image: 'dream', text: '叮咚——你的专属电子宠物生成啦！穿着白大褂、拿着听诊器的小医生，以后它会陪着你一起长大。记得我们的约定：这周继续照顾好奶奶哦！' },
    ]
  }
  // sprout（梦想尚未说出口）—— 通用引导脚本
  return [
    { from: 'ai', text: '你好呀！我是小信 ✨ 今天想和你聊聊天。你最近有没有什么开心的事想告诉我呀？' },
    { from: 'me', text: '小信，我今天上课回答了一个问题，老师夸我了' },
    { from: 'ai', text: '被老师夸了好棒呀！那你长大以后想做什么呢？不着急，慢慢想～哪怕是一个小小的愿望也可以告诉我哦～' },
    { from: 'me', text: '我……我还没想好，但我想变得更勇敢一点' },
    { from: 'ai', text: '想变得更勇敢，这本身就是一个很棒的心愿呀！👏 你看，我给你准备了一个小伙伴——' },
    { from: 'ai', image: 'dream', text: '叮咚——你的专属电子宠物生成啦！一颗正在发芽的小种子，它和你一样，正在慢慢长大。以后它会陪着你，等你想清楚了梦想，它也会一起开花结果哦！' },
  ]
}

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

/** 根据学生 id 返回个性化信件（梦想 / 宠物 / 成长进度匹配） */
export function getLettersForStudent(studentId: string): Letter[] {
  const student = students.find((s) => s.id === studentId)
  if (!student) return letters
  const ideal = student.ideal?.trim() ?? ''
  const name = student.name
  const grade = student.grade
  const school = '龙头山镇中心小学'

  // 信件模板：按梦想职业生成 3 封信（w3 未读 / w2 已读 / w1 已读）
  const templates: Record<string, { preview: string; body: string[] }[]> = {
    baker: [
      {
        preview: `我一直记得你的梦想是成为蛋糕师，这周你的小宠物……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `我一直记得你的梦想是成为蛋糕师。这周你的蛋糕师小宠物看起来有点没精神——它告诉我，你已经好几天没和它分享新消息了。`,
          `你平时会在课余帮妈妈进厨房打下手吗？哪怕只是搅一搅面糊、摆一摆盘子，都是在为梦想积攒力气呀。要不要和班主任老师聊聊，一起为你的小宠物赚取成长值？`,
          `期待下周听到你的新故事。`,
        ],
      },
      {
        preview: `上次你说想学会做纸杯蛋糕，不知道这周有没有……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `上次你说想学会做草莓味的纸杯蛋糕，不知道这周有没有离它近一点？`,
          `听说你帮妈妈揉了面团，还弄得满脸面粉——在我看来，那可是蛋糕师的第一枚勋章。你的小宠物这周开心极了，因为它感受到了你的努力。`,
          `继续加油，下周也要记得来和我聊聊哦。`,
        ],
      },
      {
        preview: `这是我们写给你的第一封信。从今天起，你有了一只……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。`,
          `你说过，你的梦想是成为一名蛋糕师。记住这个甜甜的心愿，以后的每一周，我都想听听你为它做了什么。`,
          `慢慢来，梦想不怕小，就怕不去靠近它。`,
        ],
      },
    ],
    soldier: [
      {
        preview: `我一直记得你的梦想是成为军人，这周你的小宠物……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `我一直记得你的梦想是成为军人。这周你的小军人宠物精神抖擞——它告诉我，你每天早起跑步的样子很帅气。`,
          `你说想像爷爷一样保家卫国，这可不只是说说而已哦。被子叠成豆腐块、操场上多跑两圈，都是在为穿军装的那一天做准备。你的小宠物这周又长大了一点。`,
          `期待下周听到你的新故事。`,
        ],
      },
      {
        preview: `上次你说要把被子叠成豆腐块，不知道这周有没有……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `上次你说要学把被子叠成豆腐块，不知道这周学会了没有？`,
          `听说你体育课带领同学热身，动作有板有眼——在我看来，那可是军人的第一堂课。你的小宠物这周开心极了，因为它感受到了你的坚持。`,
          `继续加油，下周也要记得来和我聊聊哦。`,
        ],
      },
      {
        preview: `这是我们写给你的第一封信。从今天起，你有了一只……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。`,
          `你说过，你的梦想是成为一名军人，像爷爷一样保家卫国。记住这个勇敢的心愿，以后的每一周，我都想听听你为它做了什么。`,
          `慢慢来，梦想不怕小，就怕不去靠近它。`,
        ],
      },
    ],
    painter: [
      {
        preview: `我一直记得你的梦想是成为画家，这周你的小宠物……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `我一直记得你的梦想是成为画家。这周你的小画家宠物拿着画笔到处看——它告诉我，你想画出山外面城市的样子。`,
          `你平时喜欢用蜡笔还是水彩呢？把家门口的梯田画下来也是一种练习呀。你的小宠物这周又长大了一点，因为你在美术课上分享了自己的画。`,
          `期待下周看到你的新作品。`,
        ],
      },
      {
        preview: `上次你说要把家门口的大山画下来，不知道这周有没有……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `上次你说要把家门口的大山画下来，不知道这周画了没有？`,
          `听说你画了山外面的城市，用了好多颜色——在我看来，那些颜色就是你眼中的世界。你的小画家宠物这周开心极了，因为它感受到了你的想象力。`,
          `继续加油，下周也要记得来和我聊聊哦。`,
        ],
      },
      {
        preview: `这是我们写给你的第一封信。从今天起，你有了一只……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。`,
          `你说过，你的梦想是成为一名画家。记住这个彩色的心愿，以后的每一周，我都想听听你为它做了什么。`,
          `慢慢来，梦想不怕小，就怕不去靠近它。`,
        ],
      },
    ],
    scientist: [
      {
        preview: `我一直记得你的梦想是成为科学家，这周你的小宠物……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `我一直记得你的梦想是成为科学家。这周你的小科学家宠物兴奋极了——它告诉我，你又在问"为什么"了。`,
          `星星为什么会眨眼？蚂蚁为什么要搬家？每一个为什么都是通往科学的一扇门。你做的小苏打火山实验太精彩了，你的小宠物这周又长大了一点。`,
          `期待下周听到你的新发现。`,
        ],
      },
      {
        preview: `上次你说想知道星星为什么眨眼，不知道这周有没有……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `上次你说想知道星星为什么眨眼，不知道这周有没有找到答案？`,
          `听说你做了小苏打和醋的实验，泡泡像火山一样喷出来——在我看来，那可是科学家的第一个实验报告。你的小宠物这周开心极了，因为它感受到了你的好奇心。`,
          `继续加油，下周也要记得来和我聊聊哦。`,
        ],
      },
      {
        preview: `这是我们写给你的第一封信。从今天起，你有了一只……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。`,
          `你说过，你的梦想是成为一名科学家。记住这个充满好奇的心愿，以后的每一周，我都想听听你为它做了什么。`,
          `慢慢来，梦想不怕小，就怕不去靠近它。`,
        ],
      },
    ],
    teacher: [
      {
        preview: `我一直记得你的梦想是成为教师，这周你的小宠物……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `我一直记得你的梦想是成为教师。这周你的小老师宠物站在讲台上——它告诉我，你又帮同桌讲了一道题。`,
          `帮同学讲题就是老师在做的事呀。你带读课文时声音洪亮，同学们都跟着你一起读，你的小宠物这周又长大了一点。`,
          `期待下周听到你的新故事。`,
        ],
      },
      {
        preview: `上次你说想站上讲台，不知道这周有没有……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `上次你说想像老师一样站上讲台，不知道这周有没有勇敢一步？`,
          `听说你帮同桌讲了一道数学题，他听懂了——在我看来，那可是老师的第一堂课。你的小宠物这周开心极了，因为它感受到了你的耐心。`,
          `继续加油，下周也要记得来和我聊聊哦。`,
        ],
      },
      {
        preview: `这是我们写给你的第一封信。从今天起，你有了一只……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。`,
          `你说过，你的梦想是成为一名教师。记住这个温暖的心愿，以后的每一周，我都想听听你为它做了什么。`,
          `慢慢来，梦想不怕小，就怕不去靠近它。`,
        ],
      },
    ],
    doctor: [
      {
        preview: `我一直记得你的梦想是成为医生，这周你的小宠物……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `我一直记得你的梦想是成为医生。这周你的小医生宠物精神很好——它告诉我，奶奶今天精神好多了。`,
          `你学会帮奶奶量体温、提醒她按时吃药，这些都是医生在做的事呀。你的小宠物这周又长大了一点，因为你在用心照顾身边的人。`,
          `期待下周听到你的新故事。`,
        ],
      },
      {
        preview: `上次你说想学会量体温，不知道这周有没有……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `上次你说想学会帮奶奶量体温，不知道这周学会了没有？`,
          `听说你提醒奶奶按时吃药，还帮她量了体温——在我看来，那可是医生的第一课。你的小宠物这周开心极了，因为它感受到了你的责任感。`,
          `继续加油，下周也要记得来和我聊聊哦。`,
        ],
      },
      {
        preview: `这是我们写给你的第一封信。从今天起，你有了一只……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。`,
          `你说过，你的梦想是成为一名医生，想治病救人。记住这个温暖的心愿，以后的每一周，我都想听听你为它做了什么。`,
          `慢慢来，梦想不怕小，就怕不去靠近它。`,
        ],
      },
    ],
    sprout: [
      {
        preview: `这周你的小种子宠物还在悄悄发芽，它等着你……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `你的小种子宠物这周还在悄悄发芽——它告诉我，你在试着适应新的节奏，已经迈出了勇敢的一步。`,
          `梦想不需要马上说出口，慢慢来就好。先告诉我这周最开心的一件事吧，你的小宠物会因为你的分享而长大。`,
          `期待下周听到你的声音。`,
        ],
      },
      {
        preview: `上次我们说好要试着和新同学说一句话……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `上次我们说好，要试着和新同学说一句话，不知道这周有没有开口？`,
          `哪怕只是借一块橡皮、说一声早上好，都是变勇敢的一大步。你的小种子宠物这周开心极了，因为它感受到了你的努力。`,
          `继续加油，下周也要记得来和我聊聊哦。`,
        ],
      },
      {
        preview: `这是我们写给你的第一封信。从今天起，你有了一只……`,
        body: [
          `致${school}${grade}的${name}同学：`,
          `这是我们写给你的第一封信。从今天起，你有了一只专属的梦想小宠物，它会陪着你一起长大。`,
          `梦想还在悄悄发芽，不着急。以后的每一周，我都想听听你遇到了什么开心的事，等你准备好了，再告诉我你的梦想。`,
          `慢慢来，梦想不怕小，就怕不去靠近它。`,
        ],
      },
    ],
  }

  // 根据梦想关键词选择模板
  let key = 'sprout'
  if (text_hasAny(ideal, ['蛋糕', '烘焙', '面包', '甜点'])) key = 'baker'
  else if (text_hasAny(ideal, ['军人', '解放', '当兵', '部队', '站岗', '保卫'])) key = 'soldier'
  else if (text_hasAny(ideal, ['画', '美术', '艺术'])) key = 'painter'
  else if (text_hasAny(ideal, ['科学', '天文', '实验', '发明', '研究', '星'])) key = 'scientist'
  else if (text_hasAny(ideal, ['老师', '教师', '教书'])) key = 'teacher'
  else if (text_hasAny(ideal, ['医生', '护士', '治病', '救人'])) key = 'doctor'

  const tpls = templates[key] ?? templates.sprout
  const weeks = [
    { id: 'w3', week: '第 3 周的来信', date: '07-28', is_read: false },
    { id: 'w2', week: '第 2 周的来信', date: '07-21', is_read: true },
    { id: 'w1', week: '第 1 周的来信', date: '07-14', is_read: true },
  ]
  return tpls.map((tpl, i) => ({
    id: weeks[i].id,
    week: weeks[i].week,
    date: weeks[i].date,
    is_read: weeks[i].is_read,
    preview: tpl.preview,
    body: tpl.body,
  }))
}

function text_hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw))
}

export type SubjectScore = { subject: string; score: number; trend: 'up' | 'down' | 'flat' }

export type AcademicRow = {
  id: string
  scores: SubjectScore[]
  role: 'member' | 'group_leader' | 'class_committee' | 'subject_rep'
  background: string
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
    background: '课余常帮妈妈做家务，动手能力强，提到做蛋糕时眼睛发亮',
    note: '',
  },
  {
    id: 'lxj',
    scores: [
      { subject: '语文', score: 79, trend: 'flat' },
      { subject: '数学', score: 85, trend: 'up' },
      { subject: '英语', score: 71, trend: 'up' },
    ],
    role: 'group_leader',
    background: '体育课表现突出，纪律性强，爷爷曾是退伍军人',
    note: '',
  },
  {
    id: 'zxh',
    scores: [
      { subject: '语文', score: 92, trend: 'up' },
      { subject: '数学', score: 68, trend: 'down' },
      { subject: '英语', score: 75, trend: 'flat' },
    ],
    role: 'member',
    background: '喜欢画画，作文常写到山外面的世界，性格偏内向',
    note: '',
  },
  {
    id: 'lxh',
    scores: [
      { subject: '语文', score: 74, trend: 'flat' },
      { subject: '数学', score: 95, trend: 'up' },
      { subject: '英语', score: 80, trend: 'up' },
    ],
    role: 'subject_rep',
    background: '对自然科学兴趣浓厚，常问"为什么"，家里支持读书',
    note: '',
  },
  {
    id: 'cxy',
    scores: [
      { subject: '语文', score: 66, trend: 'down' },
      { subject: '数学', score: 62, trend: 'down' },
      { subject: '英语', score: 58, trend: 'down' },
    ],
    role: 'member',
    background: '父母外出务工，由奶奶照顾，近期上课注意力下降，需要更多关注',
    note: '',
  },
  {
    id: 'zxj',
    scores: [
      { subject: '语文', score: 86, trend: 'up' },
      { subject: '数学', score: 78, trend: 'flat' },
      { subject: '英语', score: 84, trend: 'up' },
    ],
    role: 'subject_rep',
    background: '乐于帮助同学讲题，说想像老师一样站上讲台',
    note: '',
  },
  {
    id: 'wxx',
    scores: [
      { subject: '语文', score: 71, trend: 'flat' },
      { subject: '数学', score: 65, trend: 'down' },
      { subject: '英语', score: 69, trend: 'flat' },
    ],
    role: 'member',
    background: '刚转学过来一学期，还在适应新环境，课堂发言较少',
    note: '',
  },
  {
    id: 'zxy2',
    scores: [
      { subject: '语文', score: 83, trend: 'up' },
      { subject: '数学', score: 88, trend: 'up' },
      { subject: '英语', score: 79, trend: 'flat' },
    ],
    role: 'member',
    background: '奶奶生病后开始说想当医生，责任感强，成绩稳步上升',
    note: '',
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
