import { z } from 'zod'

const APG_PATTERNS_BASE = 'https://www.w3.org/WAI/ARIA/apg/patterns/' as const

const ApgKernelPatternSchema = z.string().min(1)

export const ApgExampleSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  axisRecipeKeys: z.array(ApgKernelPatternSchema),
})

export const ApgPatternExampleSchema = z.object({
  patternSlug: z.string().min(1),
  patternUrl: z.string().url(),
  axisRecipeKeys: z.array(ApgKernelPatternSchema),
  examples: z.array(ApgExampleSchema),
})

export const ApgPatternExampleSpecSchema = z.array(ApgPatternExampleSchema)

export type ApgExample = z.infer<typeof ApgExampleSchema>
export type ApgPatternExample = z.infer<typeof ApgPatternExampleSchema>

/**
 * APG_PATTERN_EXAMPLE_SPEC — W3C APG `/patterns/` example inventory.
 *
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/ and each pattern page's
 * "Examples" links, verified 2026-05-09.
 *
 * `axisRecipeKeys` uses this package's recipe/spec keys, not APG URL slugs, so
 * APG examples can converge onto aria-kernel's axis assembly surface. Static
 * semantic patterns still get explicit empty-keyboard entries in
 * `apgKeyboardSpec.ts`; no example disappears just because it has no custom
 * keyboard axis.
 */
export const APG_PATTERN_EXAMPLE_SPEC: readonly ApgPatternExample[] =
  ApgPatternExampleSpecSchema.parse([
    pattern('accordion', ['accordion'], [
      example('accordion', 'Accordion Example'),
    ]),
    pattern('alert', ['alert'], [
      example('alert', 'Alert Example'),
    ]),
    pattern('alertdialog', ['alertdialog'], [
      example('alertdialog', 'Alert Dialog Example'),
    ]),
    pattern('breadcrumb', ['breadcrumb'], [
      example('breadcrumb', 'Breadcrumb design pattern example'),
    ]),
    pattern('button', ['button'], [
      example('button', 'Button Examples'),
      example('button_idl', 'Button Examples (IDL)'),
    ]),
    pattern('carousel', ['carousel'], [
      example('carousel-1-prev-next', 'Auto-Rotating Image Carousel with Buttons for Slide Control'),
      example('carousel-2-tablist', 'Auto-Rotating Image Carousel with Tabs for Slide Control', ['carousel', 'tabs']),
    ]),
    pattern('checkbox', ['checkbox'], [
      example('checkbox', 'Checkbox (Two-State) Example'),
      example('checkbox-mixed', 'Checkbox (Mixed-State) Example'),
    ]),
    pattern('combobox', ['combobox'], [
      example('combobox-select-only', 'Select-Only Combobox'),
      example('combobox-autocomplete-both', 'Editable Combobox with Both List and Inline Autocomplete'),
      example('combobox-autocomplete-list', 'Editable Combobox with List Autocomplete'),
      example('combobox-autocomplete-none', 'Editable Combobox Without Autocomplete'),
      example('grid-combo', 'Editable Combobox with Grid Popup', ['combobox', 'comboboxGrid', 'grid']),
      example('combobox-datepicker', 'Date Picker Combobox', ['combobox', 'dialogModal', 'grid', 'button']),
    ]),
    pattern('dialog-modal', ['dialogModal'], [
      example('dialog', 'Modal Dialog Example'),
      example('datepicker-dialog', 'Date Picker Dialog Example', ['dialogModal', 'grid', 'button']),
    ]),
    pattern('disclosure', ['disclosure'], [
      example('disclosure-image-description', 'Disclosure (Show/Hide) of Image Description'),
      example('disclosure-faq', 'Disclosure (Show/Hide) of Answers to Frequently Asked Questions'),
      example('disclosure-navigation', 'Disclosure (Show/Hide) Navigation Menu', ['disclosure', 'navigationList']),
      example('disclosure-navigation-hybrid', 'Disclosure (Show/Hide) Navigation Menu with Top-Level Links', ['disclosure', 'navigationList']),
      example('disclosure-card', 'Disclosure (Show/Hide) Card'),
    ]),
    pattern('feed', ['feed'], [
      example('feed', 'Infinite Scrolling Feed Example'),
    ]),
    pattern('grid', ['grid'], [
      example('layout-grids', 'Layout Grid Examples'),
      example('data-grids', 'Data Grid Examples'),
      example('advanced-data-grid', 'Advanced Data Grid Example'),
    ]),
    pattern('landmarks', ['landmarks'], []),
    pattern('link', ['link'], [
      example('link', 'Link Examples'),
    ]),
    pattern('listbox', ['listbox'], [
      example('listbox-scrollable', 'Scrollable Listbox Example'),
      example('listbox-rearrangeable', 'Example Listboxes with Rearrangeable Options'),
      example('listbox-grouped', 'Listbox Example with Grouped Options'),
    ]),
    pattern('menubar', ['menubar', 'menu'], [
      example('menubar-editor', 'Editor Menubar Example'),
      example('menubar-navigation', 'Navigation Menubar Example'),
    ]),
    pattern('menu-button', ['menuButton', 'menu'], [
      example('menu-button-actions-active-descendant', 'Action Menu Button Example Using aria-activedescendant'),
      example('menu-button-actions', 'Action Menu Button Example Using element.focus()'),
      example('menu-button-links', 'Navigation Menu Button', ['menuButton', 'menu', 'navigationList']),
    ]),
    pattern('meter', ['meter'], [
      example('meter', 'Meter Example'),
    ]),
    pattern('radio', ['radio'], [
      example('radio', 'Radio Group Example Using Roving tabindex'),
      example('radio-activedescendant', 'Radio Group Example Using aria-activedescendant'),
      example('radio-rating', 'Rating Radio Group Example'),
    ]),
    pattern('slider', ['slider'], [
      example('slider-color-viewer', 'Color Viewer Slider Example'),
      example('slider-temperature', 'Vertical Temperature Slider Example'),
      example('slider-rating', 'Rating Slider Example'),
      example('slider-seek', 'Media Seek Slider Example'),
    ]),
    pattern('slider-multithumb', ['sliderMultithumb'], [
      example('slider-multithumb', 'Horizontal Multi-Thumb Slider Example'),
    ]),
    pattern('spinbutton', ['spinbutton'], [
      example('quantity-spinbutton', 'Quantity Spin Button Example'),
    ]),
    pattern('switch', ['switch'], [
      example('switch', 'Switch Example'),
      example('switch-button', 'Switch Example Using HTML Button'),
      example('switch-checkbox', 'Switch Example Using HTML Checkbox Input'),
    ]),
    pattern('table', ['table'], [
      example('table', 'Table Example'),
      example('sortable-table', 'Sortable Table Example', ['table', 'button']),
    ]),
    pattern('tabs', ['tabs'], [
      example('tabs-automatic', 'Tabs With Automatic Activation'),
      example('tabs-manual', 'Tabs With Manual Activation'),
    ]),
    pattern('toolbar', ['toolbar'], [
      example('toolbar', 'Toolbar Example', [
        'toolbar',
        'button',
        'radio',
        'menuButton',
        'menu',
        'spinbutton',
        'checkbox',
        'link',
        'tooltip',
      ]),
    ]),
    pattern('tooltip', ['tooltip'], []),
    pattern('treeview', ['treeview'], [
      example('treeview-1a', 'File Directory Treeview Example Using Computed Properties'),
      example('treeview-1b', 'File Directory Treeview Example Using Declared Properties'),
      example('treeview-navigation', 'Navigation Treeview Example', ['treeview', 'navigationList']),
    ]),
    pattern('treegrid', ['treegrid'], [
      example('treegrid-1', 'E-mail Inbox'),
    ]),
    pattern('windowsplitter', ['windowsplitter'], []),
  ])

export const allApgExamples = (): readonly (ApgExample & { patternSlug: string })[] =>
  APG_PATTERN_EXAMPLE_SPEC.flatMap((patternSpec) =>
    patternSpec.examples.map((item) => ({ ...item, patternSlug: patternSpec.patternSlug })),
  )

type ApgExampleInput = readonly [
  slug: string,
  title: string,
  axisRecipeKeys?: readonly string[],
]

function pattern(
  patternSlug: string,
  axisRecipeKeys: readonly string[],
  examples: readonly ApgExampleInput[],
): ApgPatternExample {
  return {
    patternSlug,
    patternUrl: `${APG_PATTERNS_BASE}${patternSlug}/`,
    axisRecipeKeys: [...axisRecipeKeys],
    examples: examples.map(([slug, title, exampleAxisRecipeKeys]) => ({
      slug,
      title,
      url: `${APG_PATTERNS_BASE}${patternSlug}/examples/${slug}/`,
      axisRecipeKeys: [...(exampleAxisRecipeKeys ?? axisRecipeKeys)],
    })),
  }
}

function example(
  slug: string,
  title: string,
  axisRecipeKeys?: readonly string[],
): ApgExampleInput {
  return axisRecipeKeys == null ? [slug, title] : [slug, title, axisRecipeKeys]
}
