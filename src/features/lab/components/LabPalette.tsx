export function LabPalette() {
  return (
    <aside className="lab-palette" aria-labelledby="palette-title">
      <div className="panel-heading">
        <p className="eyebrow">Your lab essentials</p>
        <h2 id="palette-title">Lab materials</h2>
      </div>
      <section className="palette-section" aria-labelledby="equipment-title">
        <h3 id="equipment-title">Equipment</h3>
        <div className="palette-placeholder" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="empty-caption">No equipment available yet.</p>
      </section>
      <section className="palette-section" aria-labelledby="chemicals-title">
        <h3 id="chemicals-title">Chemicals</h3>
        <div className="palette-placeholder" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="empty-caption">No chemicals available yet.</p>
      </section>
      <p className="palette-note">A small collection. A world of possibilities.</p>
    </aside>
  )
}
