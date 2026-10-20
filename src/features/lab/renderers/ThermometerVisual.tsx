// Shared glass-liquid SVG drawing; it never decides measurement validity.
export function ThermometerVisual({ reading, scaleLayout = 'inline' }: { reading: number | null; scaleLayout?: 'inline' | 'beside-vessel' }) {
  return <g className="glass-thermometer">
    <path d="M47 84V8a3 3 0 0 1 6 0v76a5 5 0 1 1-6 0Z" fill="#eef7f5" strokeWidth="1" />
    <path d="M50 86V12" stroke="#cbdad7" strokeWidth="2" />
    <circle className="thermometer-bulb" cx="50" cy="88" r="4" fill="#bd4941" strokeWidth="0.8" />
    {reading !== null && <path className="thermometer-column" d={`M50 88V${83 - Math.max(0, Math.min(100, reading)) * 0.66}`} stroke="#bd4941" strokeWidth="2" />}
    {/* Observation views keep graduations outside the vessel without moving the immersed bulb. */}
    <g className={`thermometer-scale thermometer-scale--${scaleLayout}`} transform={scaleLayout === 'beside-vessel' ? 'translate(28 0)' : undefined}>
      {scaleLayout === 'beside-vessel' && <path d="M54 17v66" strokeWidth="0.6" />}
      {Array.from({ length: 21 }, (_, i) => <path key={i} d={`M54 ${83 - i * 3.3}h${i % 2 ? 3 : 5}`} strokeWidth="0.6" />)}
      {[0, 20, 40, 60, 80, 100].map((temperature) => <text key={temperature} x="61" y={85 - temperature * 0.66}
        fill="currentColor" stroke="none" fontSize="4.5">{temperature}</text>)}
      <text x="62" y="11" fill="currentColor" stroke="none" fontSize="5">°C</text>
    </g>
  </g>
}
