# @p/aria-kernel

**ARIA-correct headless behavior infra** — axes composition, roving tabindex,
gesture/intent split, declarative page tree (FlatLayout), single resource
interface, feature spec.

The repo is one product (`@p/aria-kernel`) plus a single integrated showcase site
that proves it can ship real apps without ds layer.

## Layout

```
.
├── packages/
│   ├── headless/           ⭐ THE PRODUCT — published, MIT
│   ├── fs/                 internal — markdown / file-tree / shiki helpers
│   └── devtools/           internal — repro recorder · spacing overlay
│
├── site/                   ⭐ THE SITE — single deployable
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── router.tsx
│       ├── routes/         TanStack file-based routing
│       │   ├── index.tsx           landing (hero + showcase grid)
│       │   ├── patterns.tsx        absorbs old apps/headless-site
│       │   ├── apps.finder.$.tsx   → @apps/finder (Mac Finder)
│       │   ├── apps.slides.$.tsx   → @apps/slides (markdown deck)
│       │   ├── apps.admin.*.tsx    → @apps/edu-portal-admin (CRUD admin)
│       │   └── apps.markdown.$.tsx → @apps/markdown (markdown viewer)
│       └── headless-site/  patterns catalog source (lifted from old apps/headless-site)
│
├── apps/                   workspace packages, consumed by site/
│   ├── finder/             keyboard-first file browser
│   ├── slides/             markdown → 16:9 deck
│   ├── edu-portal-admin/   admin shell + 6 pages
│   └── markdown/           markdown viewer
│
└── docs/                   markdown content (slides samples, READMEs)
```

## Stack

- **Behavior**: `@p/aria-kernel` ARIA pattern recipes (`useListboxPattern`,
  `useToolbarPattern`, `useTreeGridPattern`, `useRovingTabIndex`,
  `useShortcut`, etc.).
- **Visuals**: Tailwind v3 utility classes inline. No design tokens,
  no CSS-in-JS, no classless cascade — visual decisions live where they
  render.
- **Routing**: TanStack file-based routing, single Vite app.

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
| `/apps/admin/dashboard` | Admin dashboard (KPI cards) |
| `/apps/admin/videos` | Admin videos table |
| `/apps/markdown/README.md` | Markdown viewer |

## Working agreement

1. New reusable behavior → `packages/aria-kernel`.
2. New visual decision → Tailwind utility class inline. No new token wrappers.
3. New showcase app → `apps/<name>` workspace package, route added under
   `site/src/routes/apps.<name>.*.tsx`.
4. Naming follows W3C / WHATWG (ARIA roles, semantic HTML). Library name
   borrowing forbidden.
5. See `CLAUDE.md` for the full invariant set and `packages/aria-kernel/INVARIANTS.md`
   for behavior-layer contracts.
