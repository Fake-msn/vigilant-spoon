import { describe, expect, it } from 'vitest'
import { academicRows, courseRecords, growthRows, letters, students } from '@/mocks/data'

describe('A6 数据映射校验（mocks/data.ts）', () => {
  it('学生字段映射：no → student_no，dream → ideal', () => {
    const nos = students.map((s) => s.student_no)
    expect(new Set(nos).size).toBe(nos.length)

    for (const s of students) {
      expect(s.student_no).toBeTruthy()
      expect('ideal' in s).toBe(true)
      expect('no' in s).toBe(false)
      expect('dream' in s).toBe(false)
    }
  })

  it('学情字段映射：relation → role，亲近关系不得映射为 class_committee', () => {
    const roleSet = new Set(['member', 'group_leader', 'class_committee', 'subject_rep'])

    for (const r of academicRows) {
      expect(roleSet.has(r.role)).toBe(true)
      expect(r).not.toHaveProperty('relation')
    }
  })

  it('成长字段映射：petMood 废弃为 state，gray 态必须携带心理信号', () => {
    for (const g of growthRows) {
      expect(['daily', 'gray', 'cheer']).toContain(g.state)
      expect(g).not.toHaveProperty('petMood')
      expect(g).not.toHaveProperty('growth')
      expect(g).not.toHaveProperty('scores')
      expect(g).not.toHaveProperty('evalSummary')

      if (g.state === 'gray') {
        expect(g.needs_care).toBe(true)
        expect(g.signal).toBeTruthy()
      } else {
        expect(g.needs_care).toBe(false)
        expect(g.signal).toBeUndefined()
      }
    }
  })

  it('课程字段映射：已移除 avgScore', () => {
    for (const c of courseRecords) {
      expect(c).not.toHaveProperty('avgScore')
      expect(['已完成', '进行中']).toContain(c.status)
    }
  })

  it('信件字段映射：unread → is_read 语义取反', () => {
    for (const letter of letters) {
      expect('is_read' in letter).toBe(true)
      expect('unread' in letter).toBe(false)
    }
  })
})
