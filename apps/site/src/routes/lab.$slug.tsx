import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { DialogBackdropDemo } from '../lab/DialogBackdropDemo'
import { TabsControlledDemo } from '../lab/TabsControlledDemo'
import { MenuOutsideCloseDemo } from '../lab/MenuOutsideCloseDemo'
import { GridEditStartDemo } from '../lab/GridEditStartDemo'
import { DialogOnKeymapDemo } from '../lab/DialogOnKeymapDemo'
import { TooltipDelayDemo } from '../lab/TooltipDelayDemo'
import { CarouselAutoplayDemo } from '../lab/CarouselAutoplayDemo'
import { AccordionSingleDemo } from '../lab/AccordionSingleDemo'
import { ListboxMultiSelectDemo } from '../lab/ListboxMultiSelectDemo'

const DEMOS: Record<string, ComponentType> = {
  'dialog-backdrop': DialogBackdropDemo,
  'tabs-controlled': TabsControlledDemo,
  'menu-outside-close': MenuOutsideCloseDemo,
  'grid-edit-start': GridEditStartDemo,
  'dialog-on-keymap': DialogOnKeymapDemo,
  'tooltip-delay': TooltipDelayDemo,
  'carousel-autoplay': CarouselAutoplayDemo,
  'accordion-single': AccordionSingleDemo,
  'listbox-multiselect': ListboxMultiSelectDemo,
}

class LabErr extends Component<{ children: ReactNode }, { e?: Error; info?: ErrorInfo }> {
  state = {}
  static getDerivedStateFromError(e: Error) { return { e } }
  componentDidCatch(e: Error, info: ErrorInfo) { this.setState({ e, info }) }
  render() {
    const { e, info } = this.state as { e?: Error; info?: ErrorInfo }
    if (!e) return this.props.children
    return (
      <pre className="p-6 text-xs whitespace-pre-wrap text-red-600">
        {e.message}{'\n\n'}{e.stack}{'\n\n'}{info?.componentStack}
      </pre>
    )
  }
}

export const Route = createFileRoute('/lab/$slug')({
  component: function LabDemo() {
    const { slug } = Route.useParams()
    const Demo = DEMOS[slug]
    if (!Demo) throw notFound()
    return <LabErr><Demo /></LabErr>
  },
})
