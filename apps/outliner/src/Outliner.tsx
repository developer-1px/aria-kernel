import { useZodCrudResource } from '@p/resource/zod-crud'
import { outlinerSpec } from './outliner.spec'
import { crud, resource } from './resource'
import { normalize } from './normalize'
import { Tree } from './Tree'

const { schema, pattern, inputs } = outlinerSpec
const commands = inputs
  .filter((i): i is typeof i & { chord: string } => 'chord' in i && typeof i.chord === 'string')
  .map(({ chord, command, label, effect }) => ({ chord, command, description: label, effect }))

export function Outliner() {
  const [data, onEvent] = useZodCrudResource(resource, crud, normalize, { kind: pattern.aria, labelField: schema.labelField })
  return (
    <Tree
      data={data}
      onEvent={onEvent}
      options={{ ...pattern.options, commands }}
      className="font-mono text-sm p-6"
      itemClassName="py-0.5"
    />
  )
}
