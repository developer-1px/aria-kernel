import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { fromList } from '../view-state/fromTree'
import { fromTree } from '../view-state/fromTree'
import { useListboxPattern } from './listbox'
import { useTreeviewPattern } from './treeview'

// Issue #164 — imperative focusItem(id) on listbox/tree.
// 패턴이 이미 추적 중인 focus map 을 setter 로 노출. mutation 후 새 id 로 focus 이동.

function ListboxHarness({ ids, focusTarget }: { ids: string[]; focusTarget: string | null }) {
  const data = fromList(ids.map((id) => ({ id, label: id })))
  const { rootProps, optionProps, focusItem } = useListboxPattern(data, undefined, { label: 'l' })
  const fired = useRef(false)
  if (focusTarget && !fired.current) {
    // 마운트 직후 effect 에서 호출 — ref 가 채워진 뒤
    queueMicrotask(() => {
      fired.current = true
      focusItem(focusTarget)
    })
  }
  return (
    <ul {...(rootProps as object)}>
      {ids.map((id) => (
        <li key={id} {...(optionProps(id) as object)}>{id}</li>
      ))}
    </ul>
  )
}

describe('useListboxPattern — focusItem(id) (#164)', () => {
  it('focusItem(id) 가 해당 option element 로 DOM focus 이동', async () => {
    const { container } = render(<ListboxHarness ids={['a', 'b', 'c']} focusTarget="c" />)
    // queueMicrotask 한 사이클 + effect 끝나기까지 대기
    await new Promise((r) => setTimeout(r, 0))
    const c = container.querySelector('[data-id="c"]') as HTMLElement
    expect(document.activeElement).toBe(c)
  })

  it('focusItem(존재하지 않는 id) → no-op (throw 없음)', () => {
    const data = fromList([{ id: 'a', label: 'A' }])
    let focusItem!: (id: string) => void
    function Capture() {
      const r = useListboxPattern(data, undefined, { label: 'l' })
      focusItem = r.focusItem
      return <ul {...(r.rootProps as object)}><li {...(r.optionProps('a') as object)}>A</li></ul>
    }
    render(<Capture />)
    expect(() => focusItem('does-not-exist')).not.toThrow()
  })
})

function TreeHarness({ focusTarget }: { focusTarget: string }) {
  const data = fromTree([
    { id: 'root1', label: 'r1', children: [{ id: 'child1', label: 'c1' }] },
    { id: 'root2', label: 'r2' },
  ])
  const { rootProps, itemProps, items, focusItem } = useTreeviewPattern(data, undefined, { label: 't' })
  const fired = useRef(false)
  if (!fired.current) {
    queueMicrotask(() => {
      fired.current = true
      focusItem(focusTarget)
    })
  }
  return (
    <ul {...(rootProps as object)}>
      {items.map((it) => (
        <li key={it.id} {...(itemProps(it.id) as object)}>{it.label}</li>
      ))}
    </ul>
  )
}

describe('useTreeviewPattern — focusItem(id) (#164)', () => {
  it('focusItem(id) — pointer-like id 로 treeitem 에 DOM focus 이동', async () => {
    const { container } = render(<TreeHarness focusTarget="root2" />)
    await new Promise((r) => setTimeout(r, 0))
    const target = container.querySelector('[data-id="root2"]') as HTMLElement
    expect(document.activeElement).toBe(target)
  })
})
