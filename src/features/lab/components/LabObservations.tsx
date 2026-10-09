export function LabObservations() {
  return (
    <aside className="lab-observations" aria-labelledby="observations-title">
      <div className="panel-heading">
        <p className="eyebrow">Notice what changes</p>
        <h2 id="observations-title">Observations</h2>
      </div>
      <div className="observation-empty">
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M14 8h20a3 3 0 0 1 3 3v29H11V11a3 3 0 0 1 3-3Z" />
          <path d="M18 8V5h12v3M18 19h12M18 25h12M18 31h7" />
        </svg>
        <h3>Every discovery starts<br />with an observation.</h3>
        <p>No observations yet. Results and explanations will appear here once experiments are available.</p>
      </div>
      <div className="observation-note">
        <span className="note-rule" aria-hidden="true" />
        <p>Look closely.<br />Stay curious.</p>
      </div>
    </aside>
  )
}
