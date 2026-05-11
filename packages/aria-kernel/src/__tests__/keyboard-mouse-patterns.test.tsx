import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { fromList, fromTree } from '../state/fromTree'
import { reduceSingleSelect, reduceRadio } from '../state/defaults'
import type { NormalizedData, UiEvent } from '../types'
import {
  checkboxPattern,
  disclosurePattern,
  sliderPattern,
  spinbuttonPattern,
  splitterPattern,
  switchPattern,
  useCheckboxGroupPattern,
  useMenuButtonPattern,
  useRadioGroupPattern,
} from '../patterns'

afterEach(cleanup)

function SwitchHarness() {
  const [checked, setChecked] = useState(false)
  const { switchProps } = switchPattern(
    checked,
    (event) => setChecked(event.value),
    { label: 'Power' },
  )
  return <button {...switchProps}>Power</button>
}

function CheckboxHarness() {
  const [checked, setChecked] = useState<false | true | 'mixed'>('mixed')
  const { checkboxProps } = checkboxPattern(
    checked,
    (event) => setChecked(event.value),
    { label: 'Subscribe', required: true, invalid: checked === false },
  )
  return <button {...checkboxProps}>Subscribe</button>
}

function SliderHarness() {
  const [value, setValue] = useState(10)
  const { thumbProps } = sliderPattern(
    value,
    (event) => setValue(event.value),
    { min: 0, max: 20, step: 5, label: 'Volume', valueText: (v) => `${v} percent` },
  )
  return <div {...thumbProps} />
}

function SpinbuttonHarness() {
  const [value, setValue] = useState(2)
  const { spinbuttonProps } = spinbuttonPattern(
    value,
    (event) => setValue(event.value),
    { min: 0, max: 12, step: 2, label: 'Quantity' },
  )
  return <div {...spinbuttonProps} />
}

function SplitterHarness() {
  const [value, setValue] = useState(40)
  const { handleProps } = splitterPattern(
    value,
    (event) => setValue(event.value),
    { min: 20, max: 80, step: 10, label: 'Sidebar width' },
  )
  return <div {...handleProps} />
}

function DisclosureHarness() {
  const [data, setData] = useState<NormalizedData>(() => fromTree([{ id: 'faq', label: 'FAQ' }]))
  const dispatch = (event: UiEvent) => setData((prev) => reduceSingleSelect(prev, event))
  const { triggerProps, panelProps } = disclosurePattern(data, 'faq', dispatch, {
    idPrefix: 'test',
  })
  return (
    <>
      <button {...triggerProps}>FAQ</button>
      <section {...panelProps}>Answer</section>
    </>
  )
}

function CheckboxGroupHarness() {
  const [data, setData] = useState<NormalizedData>(() =>
    fromList([
      { id: 'alpha', label: 'Alpha', checked: true },
      { id: 'beta', label: 'Beta', checked: false },
      { id: 'gamma', label: 'Gamma', checked: true, disabled: true },
    ]),
  )
  const dispatch = (event: UiEvent) => setData((prev) => reduceSingleSelect(prev, event))
  const { groupProps, parentProps, childProps } = useCheckboxGroupPattern(data, dispatch, {
    label: 'Permissions',
    parentLabel: 'All permissions',
  })
  const ids = data.meta?.root ?? []
  return (
    <div {...groupProps}>
      <button {...parentProps}>All</button>
      {ids.map((id) => (
        <button key={id} {...childProps(id)}>
          {String(data.entities[id]?.label)}
        </button>
      ))}
    </div>
  )
}

function RadioGroupHarness() {
  const [data, setData] = useState<NormalizedData>(() =>
    fromList([
      { id: 'small', label: 'Small', checked: true },
      { id: 'medium', label: 'Medium' },
      { id: 'large', label: 'Large' },
    ]),
  )
  const dispatch = (event: UiEvent) => setData((prev) => reduceRadio(prev, event))
  const { rootProps, radioProps } = useRadioGroupPattern(data, dispatch, {
    label: 'Size',
    orientation: 'horizontal',
  })
  const ids = data.meta?.root ?? []
  return (
    <div {...rootProps}>
      {ids.map((id) => (
        <div key={id} {...radioProps(id)}>
          {String(data.entities[id]?.label)}
        </div>
      ))}
    </div>
  )
}

function MenuLevel({ level, getSubmenu }: ReturnType<typeof useMenuButtonPattern> extends infer T
  ? T extends { rootLevel: infer L; getSubmenu: infer G }
    ? { level: L; getSubmenu: G }
    : never
  : never) {
  return (
    <ul {...level.menuProps}>
      {level.items.map((item) => {
        const submenu = getSubmenu(item.id)
        return (
          <li key={item.id} {...level.itemProps(item.id)}>
            {item.label}
            {submenu ? <MenuLevel level={submenu} getSubmenu={getSubmenu} /> : null}
          </li>
        )
      })}
    </ul>
  )
}

function MenuButtonHarness() {
  const [data, setData] = useState<NormalizedData>(() =>
    fromTree([
      { id: 'new', label: 'New', kind: 'menuitem' },
      { id: 'show-ruler', label: 'Show ruler', kind: 'menuitemcheckbox', checked: 'mixed' },
      { id: 'theme-light', label: 'Light', kind: 'menuitemradio', checked: true },
      { id: 'theme-dark', label: 'Dark', kind: 'menuitemradio', checked: false },
      {
        id: 'recent',
        label: 'Recent',
        kind: 'menuitem',
        children: [
          { id: 'doc-1', label: 'Doc 1', kind: 'menuitem' },
          { id: 'doc-2', label: 'Doc 2', kind: 'menuitem' },
        ],
      },
    ]),
  )
  const dispatch = (event: UiEvent) => setData((prev) => reduceSingleSelect(prev, event))
  const pattern = useMenuButtonPattern(data, dispatch, { label: 'File', idPrefix: 'test-menu' })
  return (
    <>
      <button {...pattern.triggerProps}>File</button>
      {!pattern.menuProps.hidden ? (
        <MenuLevel level={pattern.rootLevel} getSubmenu={pattern.getSubmenu} />
      ) : null}
    </>
  )
}

const keyDown = (target: Element, key: string) => {
  fireEvent.keyDown(target, key === ' ' ? { key, code: 'Space' } : { key })
}

const attr = (el: Element, name: string) => el.getAttribute(name)
const hasAttr = (el: Element, name: string) => el.hasAttribute(name)
const expectFocus = (el: Element) => expect(document.activeElement).toBe(el)
const menuItems = () =>
  Array.from(document.querySelectorAll('[role^="menuitem"]')) as HTMLElement[]

describe('keyboard and mouse pattern coverage', () => {
  it('switch toggles through click, Space, and Enter', () => {
    render(<SwitchHarness />)
    const control = screen.getByRole('switch')

    expect(attr(control, 'aria-checked')).toBe('false')
    fireEvent.click(control)
    expect(attr(control, 'aria-checked')).toBe('true')
    keyDown(control, ' ')
    expect(attr(control, 'aria-checked')).toBe('false')
    keyDown(control, 'Enter')
    expect(attr(control, 'aria-checked')).toBe('true')
  })

  it('checkbox normalizes mixed state and toggles through mouse and keyboard', () => {
    render(<CheckboxHarness />)
    const control = screen.getByRole('checkbox', { name: 'Subscribe' })

    expect(attr(control, 'aria-checked')).toBe('mixed')
    fireEvent.click(control)
    expect(attr(control, 'aria-checked')).toBe('true')
    keyDown(control, ' ')
    expect(attr(control, 'aria-checked')).toBe('false')
    expect(attr(control, 'aria-invalid')).toBe('true')
  })

  it('numeric controls consume keyboard steps and clamp at boundaries', () => {
    render(
      <>
        <SliderHarness />
        <SpinbuttonHarness />
        <SplitterHarness />
      </>,
    )

    const slider = screen.getByRole('slider', { name: 'Volume' })
    keyDown(slider, 'ArrowRight')
    expect(attr(slider, 'aria-valuenow')).toBe('15')
    keyDown(slider, 'End')
    expect(attr(slider, 'aria-valuenow')).toBe('20')
    keyDown(slider, 'PageUp')
    expect(attr(slider, 'aria-valuenow')).toBe('20')
    expect(attr(slider, 'aria-valuetext')).toBe('20 percent')

    const spinbutton = screen.getByRole('spinbutton', { name: 'Quantity' })
    keyDown(spinbutton, 'ArrowLeft')
    expect(attr(spinbutton, 'aria-valuenow')).toBe('0')
    keyDown(spinbutton, 'PageUp')
    expect(attr(spinbutton, 'aria-valuenow')).toBe('12')

    const splitter = screen.getByRole('separator', { name: 'Sidebar width' })
    keyDown(splitter, 'ArrowRight')
    expect(attr(splitter, 'aria-valuenow')).toBe('50')
    keyDown(splitter, 'Home')
    expect(attr(splitter, 'aria-valuenow')).toBe('20')
  })

  it('disclosure maps click and Enter to expanded state and controlled panel visibility', () => {
    render(<DisclosureHarness />)
    const trigger = screen.getByRole('button', { name: 'FAQ' })
    const panel = screen.getByRole('region', { hidden: true })

    expect(attr(trigger, 'aria-expanded')).toBe('false')
    expect(hasAttr(panel, 'hidden')).toBe(true)
    fireEvent.click(trigger)
    expect(attr(trigger, 'aria-expanded')).toBe('true')
    expect(hasAttr(panel, 'hidden')).toBe(false)
    keyDown(trigger, 'Enter')
    expect(attr(trigger, 'aria-expanded')).toBe('false')
  })

  it('checkbox group derives mixed parent state and skips disabled children', () => {
    render(<CheckboxGroupHarness />)
    const parent = screen.getByRole('checkbox', { name: 'All permissions' })
    const beta = screen.getByRole('checkbox', { name: 'Beta' })
    const gamma = screen.getByRole('checkbox', { name: 'Gamma' })

    expect(attr(parent, 'aria-checked')).toBe('mixed')
    keyDown(beta, ' ')
    expect(attr(parent, 'aria-checked')).toBe('true')
    expect(attr(gamma, 'aria-disabled')).toBe('true')
    fireEvent.click(parent)
    expect(attr(parent, 'aria-checked')).toBe('false')
    expect(attr(gamma, 'aria-checked')).toBe('true')
  })

  it('radio group follows keyboard focus with single checked radio', () => {
    render(<RadioGroupHarness />)
    const small = screen.getByRole('radio', { name: 'Small' })
    const medium = screen.getByRole('radio', { name: 'Medium' })
    const large = screen.getByRole('radio', { name: 'Large' })

    expect(attr(small, 'aria-checked')).toBe('true')
    keyDown(small, 'ArrowRight')
    expect(attr(medium, 'aria-checked')).toBe('true')
    expect(attr(small, 'aria-checked')).toBe('false')
    keyDown(medium, 'End')
    expect(attr(large, 'aria-checked')).toBe('true')
  })

  it('menu button opens, navigates, toggles checkbox/radio items, and closes plain items', () => {
    render(<MenuButtonHarness />)
    const trigger = screen.getByRole('button', { name: 'File' })

    keyDown(trigger, 'ArrowDown')
    expect(attr(trigger, 'aria-expanded')).toBe('true')
    let items = menuItems()
    expectFocus(items[0])

    keyDown(items[0], 'ArrowDown')
    items = menuItems()
    expectFocus(items[1])
    expect(attr(items[1], 'aria-checked')).toBe('mixed')
    keyDown(items[1], ' ')
    items = menuItems()
    expect(attr(items[1], 'aria-checked')).toBe('true')
    expect(attr(trigger, 'aria-expanded')).toBe('true')

    keyDown(items[1], 'ArrowDown')
    items = menuItems()
    keyDown(items[2], 'ArrowDown')
    items = menuItems()
    expectFocus(items[3])
    keyDown(items[3], 'Enter')
    items = menuItems()
    expect(attr(items[2], 'aria-checked')).toBe('false')
    expect(attr(items[3], 'aria-checked')).toBe('true')

    const submenuParent = screen.getByRole('menuitem', { name: /Recent/ })
    submenuParent.focus()
    keyDown(submenuParent, 'ArrowRight')
    expect(attr(submenuParent, 'aria-expanded')).toBe('true')
    expectFocus(screen.getByRole('menuitem', { name: 'Doc 1' }))

    fireEvent.mouseDown(document.body)
    expect(attr(trigger, 'aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('menuitem', { name: 'New' }))
    expect(attr(trigger, 'aria-expanded')).toBe('false')
  })
})
