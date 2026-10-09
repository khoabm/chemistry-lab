import { LabHeader } from './LabHeader'
import { LabObservations } from './LabObservations'
import { LabPalette } from './LabPalette'
import { LabWorkspace } from './LabWorkspace'

export function LabPage() {
  return (
    <div className="lab-page">
      <a className="skip-link" href="#laboratory">Skip to laboratory</a>
      <LabHeader />
      <main id="laboratory" className="lab-layout" tabIndex={-1}>
        <LabPalette />
        <LabWorkspace />
        <LabObservations />
      </main>
      <footer className="lab-footer">
        <p>Explore chemistry, one observation at a time.</p>
        <p>Virtual demonstrations <span aria-hidden="true">·</span> Introductory chemistry</p>
      </footer>
    </div>
  )
}
