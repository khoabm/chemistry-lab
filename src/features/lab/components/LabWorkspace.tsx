export function LabWorkspace() {
  return (
    <section className="lab-workspace" aria-labelledby="workspace-title">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Explore &amp; observe</p>
          <h2 id="workspace-title">Laboratory workspace</h2>
        </div>
        <span className="workspace-status">Empty workspace</span>
      </div>
      <div className="workbench">
        <div className="bench-wall" aria-hidden="true" />
        <div className="bench-surface" aria-hidden="true" />
        <div className="workspace-empty">
          <div className="workspace-emblem" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h3>Room for discovery.</h3>
          <p>Your virtual lab starts with a clear bench.</p>
          <p className="empty-detail">
            Equipment and experiments will be available here soon.
          </p>
        </div>
        <span className="bench-caption" aria-hidden="true">VIRTUAL LABORATORY</span>
      </div>
      <p className="workspace-footnote">A place to explore, notice, and understand.</p>
    </section>
  )
}
