# @interactive-os/aria-kernel

**ARIA-correct headless behavior infra** — axes composition, roving tabindex,
gesture/intent split, reducer-backed state, APG pattern recipes, focus and
shortcut helpers.

This repo is only the published package workspace. Consumer harness apps live in
the sibling workspace `../aria-kernel-apps`.

## Layout

```
.
├── packages/
│   └── aria-kernel/        published ARIA behavior package
│
└── docs/
    ├── adr/                package architecture decisions
    ├── agents/             local agent context
    └── refactor/           package refactor notes
```

## Stack

- **Behavior**: `@interactive-os/aria-kernel` ARIA pattern recipes (`useListboxPattern`,
  `useToolbarPattern`, `useTreegridPattern`, `useRovingTabIndex`,
  `useShortcut`, etc.).
- **Boundary**: no app routes, no Tailwind site, no resource adapters in this repo.
- **Harnesses**: `../aria-kernel-apps` consumes this package through the public
  `@interactive-os/aria-kernel` package name.

## Commands

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Working agreement

1. New reusable behavior → `packages/aria-kernel`.
2. New visual decision → outside this repo.
3. New harness app → `../aria-kernel-apps`.
4. Naming follows W3C / WHATWG (ARIA roles, semantic HTML). Library name
   borrowing forbidden.
5. See `AGENTS.md` for repo working rules and `packages/aria-kernel/INVARIANTS.md`
   for behavior-layer contracts.
