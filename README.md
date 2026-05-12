# @p/aria-kernel

**ARIA-correct headless behavior infra** — axes composition, roving tabindex,
gesture/intent split, reducer-backed state, APG pattern recipes, focus and
shortcut helpers.

The repo is one product (`@p/aria-kernel`) plus consumer harness apps that prove
the package behavior in realistic screens.

## Layout

```
.
├── packages/
│   ├── aria-kernel/        ⭐ THE PRODUCT — published, MIT
│   ├── resource/           optional — external store / zod-crud bridge
│   ├── slides/             internal — markdown deck domain helpers
│   ├── fs/                 internal — markdown / file-tree / shiki helpers
│   ├── source-viewer/      internal — code tabs for docs/site
│   └── devtools/           internal — repro recorder · spacing overlay
│
├── apps/
│   ├── site/               ⭐ integrated docs + showcase Vite app
│   ├── finder/             keyboard-first file browser
│   ├── outliner/           editable tree + zod-crud harness
│   ├── kanban/             board/resource harness
│   ├── slides/             markdown → 16:9 deck
│   └── markdown/           markdown viewer
│
└── docs/
    └── site/               official docs, grouped by frontmatter IA
```

## Stack

- **Behavior**: `@p/aria-kernel` ARIA pattern recipes (`useListboxPattern`,
  `useToolbarPattern`, `useTreegridPattern`, `useRovingTabIndex`,
  `useShortcut`, etc.).
- **Visuals**: Tailwind v3 utility classes inline. No design tokens,
  no CSS-in-JS, no classless cascade — visual decisions live where they
  render.
- **Routing**: TanStack file-based routing in `apps/site`.

## Commands

```bash
pnpm install
pnpm dev          # vite dev — http://localhost:5173
pnpm build        # tsc -b && vite build (outputs dist/)
pnpm preview      # serve dist/
```

## URLs (dev)

| Path | What |
|---|---|
| `/` | Landing — product blurb + showcase cards |
| `/patterns` | APG recipe catalog (snap-y scroll, hash anchors per pattern) |
| `/lab` | ARIA-punt 흡수 PoC — 5 demo (dialog backdrop · tabs controlled · menu outside-close · grid editStart · dialog on keymap) + 25 black-box test |
| `/apps/finder/` | Mac Finder column view |
| `/apps/slides/docs/slides-sample.md` | Slides deck |
| `/apps/markdown/README.md` | Markdown viewer |

## Working agreement

1. New reusable behavior → `packages/aria-kernel`.
2. New visual decision → Tailwind utility class inline. No new token wrappers.
3. New harness app → `apps/<name>` workspace package, route added under
   `apps/site/src/routes/apps.<name>.*.tsx`.
4. Naming follows W3C / WHATWG (ARIA roles, semantic HTML). Library name
   borrowing forbidden.
5. See `AGENTS.md` for repo working rules and `packages/aria-kernel/INVARIANTS.md`
   for behavior-layer contracts.
