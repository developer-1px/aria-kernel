import { axisKeys, fromTree } from '@p/aria-kernel'
import { menubarAxis, useMenubarPattern, type MenuLevel, useMenubarReducer } from '@p/aria-kernel/patterns'

export const meta = {
  title: 'Menubar · Navigation',
  apg: 'menubar',
  kind: 'collection' as const,
  blurb: 'APG menubar-navigation example reproduction — site nav with aria-current="page" and nested submenus.',
  keys: () => axisKeys(menubarAxis()),
}

// APG menubar-navigation 예제 구조 (요약)
const TREE = [
  { id: 'about', label: 'About', current: 'page' },
  {
    id: 'admissions',
    label: 'Admissions',
    children: [
      { id: 'apply', label: 'Apply' },
      { id: 'tuition', label: 'Tuition' },
      { id: 'sign-up', label: 'Sign Up' },
      { id: 'visit', label: 'Visit' },
      { id: 'photo-tour', label: 'Photo Tour' },
    ],
  },
  {
    id: 'academics',
    label: 'Academics',
    children: [
      { id: 'colleges', label: 'Colleges & Schools', children: [
        { id: 'engineering', label: 'Engineering', children: [
          { id: 'cs', label: 'Computer Science' },
          { id: 'ee', label: 'Electrical' },
        ] },
        { id: 'arts-sci', label: 'Arts & Sciences' },
        { id: 'business', label: 'Business' },
      ] },
      { id: 'depts', label: 'Departments' },
      { id: 'grad', label: 'Graduate' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    children: [
      { id: 'opportunities', label: 'Opportunities' },
      { id: 'centers', label: 'Centers & Institutes' },
    ],
  },
]

function SubmenuView({
  level,
  getSubmenu,
}: {
  level: MenuLevel
  getSubmenu: (id: string) => MenuLevel | null
}) {
  return (
    <ul
      {...level.menuProps}
      className="absolute left-full top-0 z-10 ml-1 min-w-[12rem] rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
    >
      {level.items.map((item) => {
        const sub = item.submenuOpen ? getSubmenu(item.id) : null
        return (
          <li
            key={item.id}
            {...level.itemProps(item.id)}
            className="relative flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-stone-200 focus:bg-stone-900 focus:text-white focus:outline-none"
          >
            <span className="flex-1">{item.label}</span>
            {item.hasSubmenu && <span aria-hidden>▸</span>}
            {sub && <SubmenuView level={sub} getSubmenu={getSubmenu} />}
          </li>
        )
      })}
    </ul>
  )
}

export default function MenubarNavigationDemo() {
  const [data, dispatch] = useMenubarReducer(TREE as Parameters<typeof fromTree>[0])
  const { rootProps, menubarItemProps, topItems, getSubmenu } = useMenubarPattern(data, dispatch, {
    label: 'Mythical University',
  })

  return (
    <div className="relative inline-block">
      <div
        {...rootProps}
        className="inline-flex rounded-md border border-stone-200 bg-white text-sm"
      >
        {topItems.map((item) => (
          <button
            key={item.id}
            {...menubarItemProps(item.id)}
            className="px-3 py-1.5 [&:not([aria-expanded=true])]:hover:bg-stone-200 aria-expanded:bg-stone-900 aria-expanded:text-white aria-[current=page]:underline first:rounded-l-md last:rounded-r-md"
          >
            {item.label}
          </button>
        ))}
      </div>
      {topItems.map((top) => {
        const sub = top.submenuOpen ? getSubmenu(top.id) : null
        if (!sub) return null
        return (
          <ul
            key={top.id}
            {...sub.menuProps}
            className="absolute left-0 top-full z-10 mt-1 min-w-[12rem] rounded-md border border-stone-200 bg-white p-1 text-sm shadow-lg"
          >
            {sub.items.map((item) => {
              const grand = item.submenuOpen ? getSubmenu(item.id) : null
              return (
                <li
                  key={item.id}
                  {...sub.itemProps(item.id)}
                  className="relative flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-stone-200 focus:bg-stone-900 focus:text-white focus:outline-none"
                >
                  <span className="flex-1">{item.label}</span>
                  {item.hasSubmenu && <span aria-hidden>▸</span>}
                  {grand && <SubmenuView level={grand} getSubmenu={getSubmenu} />}
                </li>
              )
            })}
          </ul>
        )
      })}
    </div>
  )
}
