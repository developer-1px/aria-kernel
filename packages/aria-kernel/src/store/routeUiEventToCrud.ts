import type { UiEvent } from '../types'

/**
 * CrudPort — UiEvent 편집 어휘를 받을 수 있는 minimal interface.
 * 시그니처는 zod-crud `JsonCrud` 와 1:1 — 추상화 0, opinionated.
 * 구현은 무엇이든 OK (FS, in-memory, server proxy).
 * @p/aria-kernel 본체에 zod-crud import 0 — interface duck-typing.
 */
export interface CrudPort<Snap = unknown, Val = unknown> {
  snapshot(): Snap
  read?(id: string): unknown
  insertAfter(siblingId: string, value?: Val): unknown
  insertBefore?(siblingId: string, value?: Val): unknown
  appendChild(parentId: string, value?: Val): unknown
  update(id: string, value: Val): unknown
  delete(id: string): unknown
  copy(id: string): unknown
  cut(id: string): unknown
  paste(targetId: string, opts?: { mode?: 'auto' | 'child' | 'overwrite'; index?: number }): unknown
  undo(): unknown
  redo(): unknown
}

/**
 * routeUiEventToCrud — UiEvent 편집 어휘 9종 → CrudPort op 1:1 라우팅.
 * 매 resource 가 같은 switch 를 짜지 않도록.
 *
 * 반환: CrudPort op 호출 시 다음 snapshot. edit 외 이벤트는 undefined.
 *
 * @example
 * defineResource({
 *   key: () => 'doc',
 *   initial: () => crud.snapshot(),
 *   onEvent: (e) => routeUiEventToCrud(crud, e),
 * })
 */
export function routeUiEventToCrud<S, V = unknown>(
  crud: CrudPort<S, V>,
  e: UiEvent,
): S | undefined {
  switch (e.type) {
    case 'insertAfter': crud.insertAfter(e.siblingId, e.value as V | undefined); return crud.snapshot()
    case 'appendChild': crud.appendChild(e.parentId, e.value as V | undefined);  return crud.snapshot()
    case 'update':      crud.update(e.id, e.value as V);                         return crud.snapshot()
    case 'remove':      crud.delete(e.id);                                       return crud.snapshot()
    case 'copy':        crud.copy(e.id);                                         return crud.snapshot()
    case 'cut':         crud.cut(e.id);                                          return crud.snapshot()
    case 'paste':       crud.paste(e.targetId, { mode: e.mode, index: e.index }); return crud.snapshot()
    case 'undo':        crud.undo();                                             return crud.snapshot()
    case 'redo':        crud.redo();                                             return crud.snapshot()
    default:            return undefined
  }
}
