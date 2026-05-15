/**
 * usePatternClipboard — built-in serialize / toClipboard / fromClipboard slots.
 * Demo 렌더 + fireEvent clipboard 이벤트만으로 검증. 내부 단위 테스트 0건.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { useListboxPattern } from '../../patterns/listbox'
import { fromList } from '../../state/fromTree'
import { reduceSingleSelect } from '../../state/defaults'
import type { NormalizedData, UiEvent } from '../../intent/events'

afterEach(cleanup)

const mkClipboard = () => {
  const store: Record<string, string> = {}
  return {
    setData: (mime: string, val: string) => { store[mime] = val },
    getData: (mime: string) => store[mime] ?? '',
    clearData: () => Object.keys(store).forEach((k) => delete store[k]),
    types: [] as readonly string[],
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    dropEffect: 'none',
    effectAllowed: 'all',
    __store: store,
  } as unknown as DataTransfer & { __store: Record<string, string> }
}

interface Item { id: string; label: string; payload?: unknown }

function ListboxHarness(props: {
  items: Item[]
  onEvent?: (e: UiEvent) => void
  serialize?: (id: string) => unknown
  toClipboard?: (payload: unknown) => Record<string, string>
  fromClipboard?: (data: DataTransfer) => unknown
}) {
  const [data, setData] = useState<NormalizedData>(() =>
    fromList(props.items.map((it) => ({ id: it.id, label: it.label }))),
  )
  const dispatch = (e: UiEvent) => {
    props.onEvent?.(e)
    setData((prev) => reduceSingleSelect(prev, e))
  }
  const { rootProps, optionProps, items } = useListboxPattern(data, dispatch, {
    autoFocus: true,
    serialize: props.serialize,
    toClipboard: props.toClipboard,
    fromClipboard: props.fromClipboard,
  })
  return (
    <ul {...rootProps} data-testid="lb">
      {items.map((it) => (
        <li key={it.id} {...optionProps(it.id)}>{it.label}</li>
      ))}
    </ul>
  )
}

describe('usePatternClipboard — built-in serializer slot', () => {
  it('serialize 미지정 시 DataTransfer 를 만지지 않고 emit-only', () => {
    const events: UiEvent[] = []
    render(<ListboxHarness items={[{ id: 'a', label: 'A' }]} onEvent={(e) => events.push(e)} />)
    const root = screen.getByTestId('lb')
    const clipboardData = mkClipboard()
    fireEvent.copy(root, { clipboardData })
    expect(clipboardData.getData('application/json')).toBe('')
    expect(events.some((e) => e.type === 'copy' && e.id === 'a')).toBe(true)
  })

  it('serialize 지정 시 default toClipboard 가 application/json + text/plain 둘 다 write', () => {
    const itemsArr = [{ id: 'a', label: 'A', payload: { hello: 'world' } }]
    render(
      <ListboxHarness
        items={itemsArr}
        serialize={(id) => itemsArr.find((it) => it.id === id)?.payload}
      />,
    )
    const root = screen.getByTestId('lb')
    const clipboardData = mkClipboard()
    fireEvent.copy(root, { clipboardData })
    expect(JSON.parse(clipboardData.getData('application/json'))).toEqual({ hello: 'world' })
    expect(JSON.parse(clipboardData.getData('text/plain'))).toEqual({ hello: 'world' })
  })

  it('toClipboard override — TSV 같은 custom mime 매핑 가능', () => {
    const itemsArr = [{ id: 'a', label: 'A' }]
    render(
      <ListboxHarness
        items={itemsArr}
        serialize={(id) => id}
        toClipboard={(p) => ({ 'text/tab-separated-values': String(p) })}
      />,
    )
    const root = screen.getByTestId('lb')
    const clipboardData = mkClipboard()
    fireEvent.copy(root, { clipboardData })
    expect(clipboardData.getData('text/tab-separated-values')).toBe('a')
    expect(clipboardData.getData('application/json')).toBe('')
  })

  it('cut 도 동일하게 setData 호출', () => {
    const itemsArr = [{ id: 'a', label: 'A' }]
    render(
      <ListboxHarness
        items={itemsArr}
        serialize={() => ({ cut: true })}
      />,
    )
    const root = screen.getByTestId('lb')
    const clipboardData = mkClipboard()
    fireEvent.cut(root, { clipboardData })
    expect(JSON.parse(clipboardData.getData('application/json'))).toEqual({ cut: true })
  })

  it('paste — default fromClipboard 가 JSON parse 결과를 UiEvent.payload 로 전달', () => {
    const events: UiEvent[] = []
    render(
      <ListboxHarness
        items={[{ id: 'a', label: 'A' }]}
        onEvent={(e) => events.push(e)}
      />,
    )
    const root = screen.getByTestId('lb')
    const clipboardData = mkClipboard()
    clipboardData.setData('application/json', JSON.stringify({ pasted: 42 }))
    fireEvent.paste(root, { clipboardData })
    const pasteEv = events.find((e) => e.type === 'paste')
    expect(pasteEv).toBeDefined()
    expect((pasteEv as Extract<UiEvent, { type: 'paste' }>).payload).toEqual({ pasted: 42 })
  })

  it('paste — JSON 실패 시 text/plain 그대로 payload 로 전달', () => {
    const events: UiEvent[] = []
    render(<ListboxHarness items={[{ id: 'a', label: 'A' }]} onEvent={(e) => events.push(e)} />)
    const root = screen.getByTestId('lb')
    const clipboardData = mkClipboard()
    clipboardData.setData('text/plain', 'hello world')
    fireEvent.paste(root, { clipboardData })
    const pasteEv = events.find((e) => e.type === 'paste') as Extract<UiEvent, { type: 'paste' }>
    expect(pasteEv.payload).toBe('hello world')
  })

  it('fromClipboard override — 호출자가 임의 파서 주입 가능', () => {
    const events: UiEvent[] = []
    const parser = vi.fn((d: DataTransfer) => ({ custom: d.getData('text/x-custom') }))
    render(
      <ListboxHarness
        items={[{ id: 'a', label: 'A' }]}
        onEvent={(e) => events.push(e)}
        fromClipboard={parser}
      />,
    )
    const root = screen.getByTestId('lb')
    const clipboardData = mkClipboard()
    clipboardData.setData('text/x-custom', 'XX')
    fireEvent.paste(root, { clipboardData })
    expect(parser).toHaveBeenCalledOnce()
    const pasteEv = events.find((e) => e.type === 'paste') as Extract<UiEvent, { type: 'paste' }>
    expect(pasteEv.payload).toEqual({ custom: 'XX' })
  })
})
