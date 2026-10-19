import { useId, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function EquipmentRemovalControls({ name, hasConnections, removesContents, disabled, onRemove }: {
  name: string
  hasConnections: boolean
  removesContents: boolean
  disabled: boolean
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [confirming, setConfirming] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const area = useRef<HTMLElement>(null)
  const wasConfirming = useRef(false)
  useLayoutEffect(() => {
    if (confirming) cancel.current?.focus()
    else if (wasConfirming.current) {
      if (opener.current?.disabled) area.current?.focus()
      else opener.current?.focus()
    }
    wasConfirming.current = confirming
  }, [confirming])

  return <section ref={area} tabIndex={-1} className={`equipment-removal${confirming ? ' is-confirming' : ''}`} aria-labelledby={`${id}-heading`}
    onKeyDown={(event) => {
      if (event.key === 'Escape' && confirming) {
        event.preventDefault()
        setConfirming(false)
      }
    }}>
    <div className="equipment-removal-row">
      <div className="equipment-removal-identity">
        <h3 id={`${id}-heading`}>{t('equipmentRemoval.manage')}</h3>
        <p id={`${id}-name`}>{name}</p>
      </div>
      {!confirming && <button ref={opener} type="button" className="equipment-removal-open" disabled={disabled} aria-describedby={`${id}-name`}
        onClick={() => setConfirming(true)}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7" /></svg>
        {t('action.removeEquipment')}
      </button>}
    </div>
    {confirming && <div className="equipment-removal-confirm" role="group" aria-label={t('equipmentRemoval.title')}
      aria-describedby={`${id}-question${hasConnections ? ` ${id}-connections` : ''}`}>
      <p id={`${id}-question`} className="equipment-removal-question">{t('equipmentRemoval.confirm', { equipment: name })}</p>
      {removesContents && <p className="equipment-removal-hint">{t('equipmentRemoval.contents')}</p>}
      {hasConnections && <p id={`${id}-connections`} className="equipment-removal-hint">{t('equipmentRemoval.connected')}</p>}
      <div className="equipment-removal-buttons">
        <button ref={cancel} type="button" className="action-button action-button--secondary" onClick={() => setConfirming(false)}>{t('action.cancelRemove')}</button>
        <button type="button" className="action-button equipment-removal-accept" disabled={disabled} onClick={onRemove}>{t('action.confirmRemoveEquipment')}</button>
      </div>
    </div>}
  </section>
}
