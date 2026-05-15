# CANONICAL

Code is SSOT. This file records only active architectural contracts visible in the current source tree.

## Product

`packages/aria-kernel` is the product: React + reducer based ARIA behavior infrastructure.

It owns:

- `axes/`: keyboard/pointer intent composition.
- `state/`: `UiEvent` -> `NormalizedData` reducers and state helpers.
- `patterns/`: WAI-ARIA/APG recipe hooks and pure pattern helpers.
- `roving/`: roving tabindex, active descendant, spatial navigation.
- `gesture/`: DOM gesture hooks that translate user actions into behavior events.
- `key/`: shortcut and keymap helpers.
- `focus/`: focus lifecycle helpers.
- `spec/`: APG/spec coverage fixtures and checks.

It does not own reusable visual components, design tokens, brand themes, or app-specific screens.

## Harnesses

Consumer harnesses live in the sibling workspace `../aria-kernel-apps`. They may
contain app-specific UI, sample data, presentation, resource adapters, source
viewers, and devtools. Reusable ARIA behavior discovered there should move to
`packages/aria-kernel`.

## Data And Event Contracts

- `UiEvent` in `packages/aria-kernel/src/types.ts` is the public UI event vocabulary.
- `NormalizedData` is the shared collection state shape.
- External data boundaries should parse with zod.
- State that crosses package/app boundaries should be serializable.
- Package code should prefer public workspace exports over app internals.

## Naming

Use stable standards as vocabulary sources:

1. WAI-ARIA + APG.
2. WHATWG HTML.
3. WCAG.
4. UI Events and Pointer Events when behavior requires them.

Do not add library-specific taxonomy as public vocabulary.

## Active Verification

Use targeted verification based on the changed boundary:

```bash
pnpm build
pnpm test
pnpm typecheck
```

Docs must not describe packages, routes, or APIs that are absent from the current source tree.
