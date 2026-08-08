import { describe, expect, it } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GrowthPage } from '@/pages/student/growth/GrowthPage'

function renderGrowthPage() {
  return render(
    <MemoryRouter>
      <GrowthPage />
    </MemoryRouter>,
  )
}

describe('班宠积分制度', () => {
  it('学生成长页未登录态可渲染（重定向，不抛错）', () => {
    expect(() => renderGrowthPage()).not.toThrow()
    cleanup()
  })

  it('未登录态不会渲染成长档案正向内容', () => {
    renderGrowthPage()
    // 未登录时 GrowthPage 返回 <Navigate to="/" replace />，应无成长档案内容
    expect(screen.queryByText(/我的成长档案/)).toBeNull()
    cleanup()
  })
})