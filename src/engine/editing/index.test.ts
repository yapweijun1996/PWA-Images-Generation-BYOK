import { expect, it } from 'vitest'
import { frame } from './index'

it('keeps the complete source inside an expanded frame on the requested sides', () => {
  expect(frame(100, 80, 'left', .25)).toEqual({ x: 25, y: 0, width: 125, height: 80 })
  expect(frame(100, 80, 'right', .25)).toEqual({ x: 0, y: 0, width: 125, height: 80 })
  expect(frame(100, 80, 'all', .25)).toEqual({ x: 25, y: 20, width: 150, height: 120 })
  expect(frame(3, 1, 'bottom', .25)).toEqual({ x: 0, y: 0, width: 3, height: 2 })
})
