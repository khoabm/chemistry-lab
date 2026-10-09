export function LabHeader() {
  return (
    <header className="lab-header">
      <div className="lab-brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M12 5h8M14 5v10L7 25a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3l-7-10V5" />
            <path d="M11 21h10M14 24h4" />
          </svg>
        </span>
        <div>
          <p className="eyebrow">A space for discovery</p>
          <h1>Web Chemistry Lab</h1>
        </div>
      </div>
      <div className="header-actions">
        <span className="preview-label">Laboratory preview</span>
        <button
          className="reset-button"
          type="button"
          disabled
          title="Reset is unavailable in this preview."
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 8a6 6 0 1 1 0 5M4 3v5h5" />
          </svg>
          Reset lab
        </button>
      </div>
    </header>
  )
}
