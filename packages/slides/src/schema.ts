import { z } from 'zod'

export type SlideNode = {
  title: string
  body: string
  children: SlideNode[]
}

export const SlideNodeSchema: z.ZodType<SlideNode> = z.object({
  title: z.string(),
  body: z.string(),
  get children() {
    return z.array(SlideNodeSchema)
  },
})

export const DeckDocSchema = z.object({
  title: z.string(),
  slides: z.array(SlideNodeSchema).min(1),
})

export type DeckDoc = z.infer<typeof DeckDocSchema>

export const emptySlide = (): SlideNode => ({
  title: 'Untitled slide',
  body: '',
  children: [],
})

export const SAMPLE_DECK: DeckDoc = {
  title: 'zod-crud x aria-kernel deck',
  slides: [
    {
      title: 'PPT service as an outliner',
      body: 'Slides are tree items. The canvas edits the focused slide in a fixed layout.',
      children: [
        {
          title: 'Keyboard first',
          body: 'Arrow keys, multi-select, Tab, Shift+Tab, copy, cut, paste, delete, undo, redo.',
          children: [],
        },
      ],
    },
    {
      title: 'Schema-gated edits',
      body: 'Every slide mutation goes through zod-crud and DeckDocSchema.',
      children: [],
    },
    {
      title: 'Harness, not product UI',
      body: 'apps/slides consumes @p/slides and @p/aria-kernel to expose integration gaps.',
      children: [],
    },
  ],
}
