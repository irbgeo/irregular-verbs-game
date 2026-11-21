import { describe, expect, it } from 'vitest'
import { isVK } from '../src/platform/detect'

describe('isVK', () => {
  it('is true when VK launch params are in the query', () => {
    expect(isVK('?vk_app_id=123&vk_user_id=1&sign=abc')).toBe(true)
  })

  it('is false for a plain page', () => {
    expect(isVK('')).toBe(false)
    expect(isVK('?debug=1')).toBe(false)
  })
})
