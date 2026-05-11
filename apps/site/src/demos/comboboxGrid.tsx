import { useReducer } from 'react'
import { axisKeys, fromTree, reduceSingleSelect } from '@p/aria-kernel'
import { comboboxGridAxis, useComboboxGridPattern } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Combobox · Grid Popup',
  apg: 'combobox',
  kind: 'collection' as const,
  blurb: 'Editable combobox whose popup is a grid — 2D arrows navigate cells, Enter commits the row.',
  keys: () => axisKeys(comboboxGridAxis()),
}

interface Node { id: string; label: string; children?: Node[] }

const row = (id: string, label: string, c: [string, string, string]): Node => ({
  id, label,
  children: [
    { id: `${id}c1`, label: c[0] },
    { id: `${id}c2`, label: c[1] },
    { id: `${id}c3`, label: c[2] },
  ],
})

const ROWS: Node[] = [
  row('r1', 'Argentina · ARS · Buenos Aires', ['Argentina', 'ARS', 'Buenos Aires']),
  row('r2', 'Australia · AUD · Canberra', ['Australia', 'AUD', 'Canberra']),
  row('r3', 'Brazil · BRL · Brasília', ['Brazil', 'BRL', 'Brasília']),
  row('r4', 'Canada · CAD · Ottawa', ['Canada', 'CAD', 'Ottawa']),
  row('r5', 'Denmark · DKK · Copenhagen', ['Denmark', 'DKK', 'Copenhagen']),
  row('r6', 'Japan · JPY · Tokyo', ['Japan', 'JPY', 'Tokyo']),
]

export default function ComboboxGridDemo() {
  const [data, dispatch] = useReducer(reduceSingleSelect, ROWS, fromTree)
  const { comboboxProps, gridProps, rowProps, cellProps, rows, expanded } = useComboboxGridPattern(
    data,
    dispatch,
    { label: 'Country', popupLabel: 'Country options' },
  )

  return (
    <div className="relative w-96">
      <input
        {...comboboxProps}
        placeholder="Search country, currency, or capital…"
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm"
      />
      {expanded && rows.length > 0 && (
        <div
          {...gridProps}
          className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
        >
          {rows.map((row) => (
            <div
              key={row.id}
              {...rowProps(row.id)}
              className="grid grid-cols-[1fr_4rem_1fr] gap-2 rounded px-2 py-1"
            >
              {row.cells.map((cell) => (
                <span
                  key={cell.id}
                  {...cellProps(cell.id)}
                  className="cursor-pointer truncate data-[active]:bg-stone-200"
                >
                  {cell.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
