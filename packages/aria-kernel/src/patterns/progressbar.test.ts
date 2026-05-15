import { describe, it, expect } from 'vitest'
import { progressbarPattern } from './progressbar'

describe('progressbarPattern (W3C APG /patterns/meter/ + progressbar role)', () => {
  it('determinate: emits role + aria-valuenow/min/max', () => {
    const { rootProps } = progressbarPattern({ value: 50 })
    expect(rootProps.role).toBe('progressbar')
    expect(rootProps['aria-valuenow']).toBe(50)
    expect(rootProps['aria-valuemin']).toBe(0)
    expect(rootProps['aria-valuemax']).toBe(100)
  })

  it('indeterminate: value=null omits aria-valuenow entirely', () => {
    const { rootProps } = progressbarPattern({ value: null })
    expect(rootProps.role).toBe('progressbar')
    expect('aria-valuenow' in rootProps).toBe(false)
    expect(rootProps['aria-valuemin']).toBe(0)
    expect(rootProps['aria-valuemax']).toBe(100)
  })

  it('custom min/max', () => {
    const { rootProps } = progressbarPattern({ value: 7, min: 1, max: 10 })
    expect(rootProps['aria-valuenow']).toBe(7)
    expect(rootProps['aria-valuemin']).toBe(1)
    expect(rootProps['aria-valuemax']).toBe(10)
  })

  it('valueText pass-through', () => {
    const { rootProps } = progressbarPattern({ value: 3, max: 5, valueText: 'step 3 of 5' })
    expect(rootProps['aria-valuetext']).toBe('step 3 of 5')
  })

  it('label → aria-label, omitted otherwise', () => {
    const labeled = progressbarPattern({ value: 0, label: 'Upload' })
    expect(labeled.rootProps['aria-label']).toBe('Upload')
    const unlabeled = progressbarPattern({ value: 0 })
    expect('aria-label' in unlabeled.rootProps).toBe(false)
  })

  it('omits aria-valuetext when not provided', () => {
    const { rootProps } = progressbarPattern({ value: 10 })
    expect('aria-valuetext' in rootProps).toBe(false)
  })
})
