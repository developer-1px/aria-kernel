import { createFileRoute } from '@tanstack/react-router'
import { LabIndex } from '../lab/LabIndex'

export const Route = createFileRoute('/lab/')({
  component: LabIndex,
})
