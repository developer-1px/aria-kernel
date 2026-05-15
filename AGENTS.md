# Coding rules — code is SSOT

This repo's source tree is the source of truth. If a markdown rule conflicts with code, package exports, or current tests, trust the code and fix or delete the markdown noise.

## Product Boundary

- The product is `packages/aria-kernel`.
- `apps/*` are consumer harnesses that prove package behavior in realistic screens.
- Supporting packages stay small and explicit:
  - `packages/resource`: optional external store and CRUD routing adapters.
  - `packages/fs`: file tree, markdown, frontmatter, highlighting helpers.
  - `packages/slides`: markdown deck domain helpers.
  - `packages/source-viewer`: docs/site source viewer.
  - `packages/devtools`: debugging aids only.
- Reusable ARIA behavior belongs in `packages/aria-kernel`, not inside an app.
- App-only presentation and sample data may stay in `apps/*`.

## Naming And Scope

- Naming follows stable specs first: WAI-ARIA/APG, WHATWG HTML, WCAG, UI Events, Pointer Events.
- Borrow behavior from de facto libraries only after checking at least two convergent implementations. Do not borrow their component taxonomy.
- Do not introduce design-system, token, brand, theme, or visual component product direction in this repo.
- Tailwind utility classes in apps/site demos are presentation for harnesses, not reusable product API.

## Data And Events

- New external data shapes get a zod schema before use.
- State crossing a package/app boundary should be serializable plain data.
- Keep the flow one-way: data -> UI props -> `UiEvent` -> reducer/resource -> data.
- `UiEvent` in `packages/aria-kernel/src/types.ts` is the public event vocabulary.
- `@interactive-os/resource` may adapt `UiEvent` to CRUD backends. Keep backend-specific details out of `@interactive-os/aria-kernel` imports.

## Search Before Create

Before adding files or concepts, search the current source:

```bash
rg "<name-or-concept>" packages apps
rg --files packages/aria-kernel/src
```

Prefer existing patterns, exports, and test shapes. Add a new abstraction only when it removes real duplication or clarifies a public boundary.

## Apps And Routes

- New reusable behavior: add it under `packages/aria-kernel/src`.
- New route in the site: add a TanStack file route under `apps/site/src/routes/`.
- New harness app: add an `apps/<name>` package and consume public/workspace package exports.
- Do not hide reusable contracts in route files or app widgets.

## Verification

Use the smallest verification that covers the changed boundary:

```bash
pnpm build
pnpm --filter @interactive-os/aria-kernel test
pnpm --filter @interactive-os/site test
```

For docs-only cleanup, run targeted text checks for stale names from removed code:

```bash
rg "removed-package-or-route-name" AGENTS.md README.md CANONICAL.md CONTEXT-MAP.md packages
```

## Removal Rule

Delete or shrink markdown that describes missing code, removed packages, stale routes, or future architecture not represented in source. Historical notes belong in dated docs, not active root instructions.
