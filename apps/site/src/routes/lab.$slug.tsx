import type { ComponentType } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { DialogBackdropDemo } from '../lab/DialogBackdropDemo'

const DEMOS: Record<string, ComponentType> = {
  'dialog-backdrop': DialogBackdropDemo,
}

export const Route = createFileRoute('/lab/$slug')({
  component: function LabDemo() {
    const { slug } = Route.useParams()
    const Demo = DEMOS[slug]
    if (!Demo) throw notFound()
    return <Demo />
  },
})
