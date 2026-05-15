/**
 * #171 — useFocusOnRemove / useFocusOnInsert via listbox Demo + user-event.
 * black-box: render real listbox, drive keyboard, assert document.activeElement.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { render, cleanup, act, fireEvent } from '@testing-library/react'

afterEach(() => cleanup())
import { useRef, useState } from 'react'
import { fromList } from '../state/fromTree'
import { useListboxPattern } from '../patterns/listbox'
import { useFocusOnRemove } from './useFocusOnRemove'
import { useFocusOnInsert } from './useFocusOnInsert'

type Row = { id: string; label: string }

function RemoveHarness({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial)
  const containerRef = useRef<HTMLUListElement | null>(null)
  const data = fromList(rows)
  const { rootProps, optionProps, focusItem } = useListboxPattern(data, undefined, { label: 'l' })
  const focusOnRemove = useFocusOnRemove({ items: rows, focusItem, containerRef })

  return (
    <div>
      <button
        type="button"
        data-testid="rm-b"
        onClick={() => {
          focusOnRemove.plan('b')
          setRows((r) => r.filter((x) => x.id !== 'b'))
        }}
      >
        remove b
      </button>
      <button
        type="button"
        data-testid="rm-c"
        onClick={() => {
          focusOnRemove.plan('c')
          setRows((r) => r.filter((x) => x.id !== 'c'))
        }}
      >
        remove c
      </button>
      <button
        type="button"
        data-testid="rm-all"
        onClick={() => {
          focusOnRemove.plan('a')
          setRows([])
        }}
      >
        remove all
      </button>
      <ul
        {...(rootProps as object)}
        ref={(el) => {
          containerRef.current = el
          // also forward to rootProps' ref if present
          const r = (rootProps as { ref?: (el: HTMLUListElement | null) => void }).ref
          if (typeof r === 'function') r(el)
        }}
        tabIndex={-1}
      >
        {rows.map((row) => (
          <li key={row.id} {...(optionProps(row.id) as object)}>{row.label}</li>
        ))}
      </ul>
    </div>
  )
}

describe('useFocusOnRemove (#171)', () => {
  it('next-by-index: removing middle item focuses the following item', async () => {
    const { container, getByTestId } = render(
      <RemoveHarness initial={[
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ]} />,
    )
    await act(async () => { fireEvent.click(getByTestId('rm-b')) })
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    const c = container.querySelector('[data-id="c"]') as HTMLElement
    expect(document.activeElement).toBe(c)
  })

  it('prev fallback: removing last item focuses previous', async () => {
    const { container, getByTestId } = render(
      <RemoveHarness initial={[
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ]} />,
    )
    await act(async () => { fireEvent.click(getByTestId('rm-c')) })
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    const b = container.querySelector('[data-id="b"]') as HTMLElement
    expect(document.activeElement).toBe(b)
  })

  it('container fallback: removing only item focuses container', async () => {
    const { container, getByTestId } = render(
      <RemoveHarness initial={[{ id: 'a', label: 'A' }]} />,
    )
    await act(async () => { fireEvent.click(getByTestId('rm-all')) })
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    const ul = container.querySelector('ul') as HTMLElement
    expect(document.activeElement).toBe(ul)
  })
})

function InsertHarness() {
  const [rows, setRows] = useState<Row[]>([
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ])
  const data = fromList(rows)
  const { rootProps, optionProps, focusItem } = useListboxPattern(data, undefined, { label: 'l' })
  const focusOnInsert = useFocusOnInsert({ items: rows, focusItem })
  return (
    <div>
      <button
        type="button"
        data-testid="add"
        onClick={() => {
          focusOnInsert.plan('z')
          setRows((r) => [...r, { id: 'z', label: 'Z' }])
        }}
      >
        add z
      </button>
      <ul {...(rootProps as object)}>
        {rows.map((row) => (
          <li key={row.id} {...(optionProps(row.id) as object)}>{row.label}</li>
        ))}
      </ul>
    </div>
  )
}

describe('useFocusOnInsert (#171)', () => {
  it('focuses newly-inserted item after re-render', async () => {
    const { container, getByTestId } = render(<InsertHarness />)
    await act(async () => { fireEvent.click(getByTestId('add')) })
    await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
    const z = container.querySelector('[data-id="z"]') as HTMLElement
    expect(document.activeElement).toBe(z)
  })
})
