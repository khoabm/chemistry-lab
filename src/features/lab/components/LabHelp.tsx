export function LabHelp() {
  return <details className="lab-help">
    <summary>How to use this lab</summary>
    <div className="lab-help-content">
      <section aria-labelledby="help-mix-title">
        <h3 id="help-mix-title">Mix a sample</h3>
        <ol>
          <li>Add a beaker or test tube from Equipment, then select it on the bench.</li>
          <li>Click chemicals to add them to that container.</li>
          <li>Press Mix, then read the observation and equation. Click the sample close-up to enlarge it.</li>
        </ol>
      </section>
      <section aria-labelledby="help-heat-title">
        <h3 id="help-heat-title">Heat a sample</h3>
        <ol>
          <li>Add chemicals to a beaker or test tube.</li>
          <li>Add an alcohol lamp, select it and press Ignite lamp.</li>
          <li>Move the container center into the marked zone above the lit lamp. Wait for the heat result.</li>
        </ol>
        <p>Move the sample away or extinguish the lamp to stop heating. The dropper can be placed and moved; reagent delivery is not available.</p>
      </section>
      <section aria-labelledby="help-controls-title">
        <h3 id="help-controls-title">Controls and sample labels</h3>
        <p>Click or tap equipment to add/select it; drag on the bench to move. Arrow keys move focused equipment, Shift moves farther and Escape cancels a drag.</p>
        <p>Solution means a liquid sample; Solid means a solid sample. Each click adds one simplified unit, not a measured mL or mole.</p>
        <p>Empty container clears only the selected sample. Reset lab removes all equipment, contents, lamps and results.</p>
      </section>
    </div>
    <p className="lab-help-limit">Only registered Mix and Heat demonstrations are supported. Concentration and exact temperature are not modeled. This virtual lab does not replace real laboratory instructions or safety procedures.</p>
  </details>
}
