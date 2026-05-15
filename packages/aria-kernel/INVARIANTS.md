# `@interactive-os/aria-kernel` invariants

> Naming dictionary: [NAMING.md](./NAMING.md) · Recipe signatures: [PATTERNS.md](./PATTERNS.md)

This document describes active behavior contracts in `packages/aria-kernel/src`.
If this file conflicts with source, source wins and this file should be fixed.

## APG Contracts

1. A roving group has one Tab stop.
2. The Tab stop is derived from the focused item.
3. Activate means `Enter`, `Space`, or click when the role supports activation.
4. Home/End move to scope boundaries when the APG pattern defines them.
5. Disabled items skip focus and ignore activation.
6. Arrow keys move focus unless a role-specific pattern defines another behavior.
7. Role determines keyboard contract. Library taxonomy does not.

## Kernel Contracts

1. `UiEvent` in `src/types.ts` is the public UI event vocabulary.
2. `NormalizedData` is the shared collection state shape.
3. Axes translate chords into intent/event candidates; reducers own state changes.
4. Focus is represented once in `NormalizedData` metadata.
5. `aria-activedescendant` is an explicit pattern choice, not the default roving model.
6. Editable contexts must not be hijacked by modifier-less global shortcuts.
7. Local handlers that call `preventDefault` must be able to override global shortcuts.
8. Gesture hooks translate DOM gestures into semantic events; consumers should not duplicate key/pointer routing for the same pattern.

## Lab Contracts

The lab absorbs behavior that specs leave implementation-defined. These are active contracts while the corresponding package source and sibling harness tests exist.

- Dialog backdrop close only when `event.target === event.currentTarget`.
- Controlled tabs derive selected state from the controlled active id.
- Outside-interaction listeners attach only while the popup is open.
- Grid edit start keeps click activation, F2 edit, and Enter combined behavior distinct.
- Dialog keymaps attach only while open and respect editable-context guards.
- Range slider thumbs clamp to neighboring thumb bounds.
- Feed articles are programmatically focusable and expose busy/position metadata.
- Menubar top-level Left/Right and submenu Down/Escape behavior follows the lab contract.
- Navigation list uses navigation/current semantics, not listbox selection semantics.
- Disclosure open state lives in `NormalizedData.meta.expanded`.
- Menu button initial focus depends on the opening trigger.
- Tree Right/Left separates focus from expand/collapse.
- Toolbar separators are skipped by roving navigation and positional counts.
- Alert dialog defaults initial focus to the cancel action.
- Combobox list autocomplete has a default case-insensitive prefix/includes filter behavior.
- Checkbox group mixed state derives from enabled children.
- Typeahead uses a bounded buffer window and label matching.
- Radio group selection follows focus.
- Switch toggles on Space, Enter, and click.
- Slider keyboard input clamps to min/max.
- Multiselect listbox supports Space, Ctrl/Cmd+Click, Shift+Click, and Shift+Arrow semantics.
- Single accordion mode collapses siblings.
- Carousel autoplay pauses for hover/focus and explicit pause.
- Tooltip show/hide delays are centralized in the pattern.

## Drift Checklist

- A reusable ARIA behavior appears only in an app widget.
- A package imports from `apps/*`.
- A pattern implements keyboard behavior that is not traceable to APG, a lab contract, or a named de facto convergence.
- A global shortcut ignores editable-context or `defaultPrevented` guards.
- A new public event bypasses `UiEvent`.
- A markdown rule references packages, folders, or routes absent from source.
