import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  PixelArt,
  KidAvatar,
  TeacherAvatar,
  RegionIcon,
  petPalette,
  petPaletteGray,
  petPaletteCheer,
  kidVariants,
} from '@/components/art'

describe('A3 art components', () => {
  it('PixelArt renders rects from map', () => {
    const { container } = render(
      <PixelArt map={['.B.', 'B.B']} palette={{ B: '#000' }} size={32} />
    )
    expect(container.querySelectorAll('rect').length).toBe(3)
  })

  it('KidAvatar uses avatarSeed deterministically', () => {
    const { container: a } = render(<KidAvatar avatarSeed={3} />)
    const { container: b } = render(<KidAvatar avatarSeed={3} />)
    expect(a.innerHTML).toBe(b.innerHTML)
    expect(a.querySelector('rect')?.getAttribute('fill')).toBe(
      kidVariants[3 % kidVariants.length].bg
    )
  })

  it('TeacherAvatar renders', () => {
    const { container } = render(<TeacherAvatar size={40} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('RegionIcon renders all six regions', () => {
    const regions = ['yunnan', 'guizhou', 'sichuan', 'gansu', 'shaanxi', 'guangxi'] as const
    regions.forEach((k) => {
      const { container } = render(<RegionIcon k={k} />)
      expect(container.querySelector('svg')).toBeTruthy()
    })
  })

  it('pet palettes have distinct daily/gray/cheer colors', () => {
    expect(petPalette.B).not.toBe(petPaletteGray.B)
    expect(petPalette.B).not.toBe(petPaletteCheer.B)
    expect(petPaletteGray.B).not.toBe(petPaletteCheer.B)
  })
})
