import { useLocalization } from '../../../localization/useLocalization'
export function LabHelp() {
  const { t } = useLocalization()
  return <details className="lab-help">
    <summary>{t('help.title')}</summary>
    <div className="lab-help-content">
      <section aria-labelledby="help-mix-title">
        <h3 id="help-mix-title">{t('help.mixTitle')}</h3>
        <ol>
          <li>{t('help.mixEquipment')}</li>
          <li>{t('help.mixChemicals')}</li>
          <li>{t('help.mixResult')}</li>
        </ol>
      </section>
      <section aria-labelledby="help-heat-title">
        <h3 id="help-heat-title">{t('help.heatTitle')}</h3>
        <ol>
          <li>{t('help.heatChemicals')}</li>
          <li>{t('help.heatLamp')}</li>
          <li>{t('help.heatPosition')}</li>
        </ol>
        <p>{t('help.heatStop')}</p>
      </section>
      <section aria-labelledby="help-controls-title">
        <h3 id="help-controls-title">{t('help.controlsTitle')}</h3>
        <p>{t('help.controls')}</p>
        <p>{t('help.quantities')}</p>
        <p>{t('help.reset')}</p>
      </section>
    </div>
    <p className="lab-help-limit">{t('help.limits')}</p>
  </details>
}
