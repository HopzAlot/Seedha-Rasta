export default function Slider({ label, value, onChange, min, max, step, unit }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="slider-row">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {value}
          <span className="slider-unit">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--lime) ${pct}%, var(--mu2) ${pct}%)`,
        }}
      />
    </div>
  )
}