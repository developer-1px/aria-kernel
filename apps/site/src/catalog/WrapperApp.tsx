import { CatalogSidebar } from './CatalogSidebar'
import { Intro } from './Intro'
import { WrapperScreen } from './WrapperScreen'
import { WRAPPER_ENTRIES } from './registry.wrappers'
import { SnapPage, useActiveHash } from '../layout/SnapPage'

export function WrapperApp() {
  const activeHash = useActiveHash()

  return (
    <div className="md:flex md:h-screen">
      <CatalogSidebar
        ariaLabel="Wrapper index"
        buttonLabel="Wrappers"
        groups={[{ label: 'Wrappers', items: WRAPPER_ENTRIES }]}
        activeSlug={activeHash}
      />
      <SnapPage className="md:flex-1">
        <Intro />
        {WRAPPER_ENTRIES.map((entry, index) => (
          <WrapperScreen
            key={entry.slug}
            entry={entry}
            index={index}
            total={WRAPPER_ENTRIES.length}
          />
        ))}
      </SnapPage>
    </div>
  )
}
