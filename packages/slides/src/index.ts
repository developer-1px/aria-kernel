export {
  DeckDocSchema,
  SAMPLE_DECK,
  SlideNodeSchema,
  emptySlide,
  type DeckDoc,
  type SlideNode,
} from './schema'
export { createDeckCrud, isSlideObject } from './crud'
export { normalizeDeck, propNode, rootSlides, slideText, type DeckData } from './normalize'
export { deckFromMarkdown } from './markdown'
export {
  dispatchSlideEvent,
  slideTreeCommands,
  slideTreeEventFromKeyboard,
  updateSlideText,
  type SlideEventContext,
} from './commands'
export { parentOf, previousSibling, selectedEventIds, siblingBatch, visibleOrder } from './structure'
export { exportDeckToPptx } from './pptx'
