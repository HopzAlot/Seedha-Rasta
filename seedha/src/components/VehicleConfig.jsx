import Slider from './Slider'

const PRESETS = [
  { id: 'car',   icon: '🚗', name: 'Sedan', mileage: 12, idle: 0.6 },
  { id: 'suv',   icon: '🚙', name: 'SUV',   mileage: 9,  idle: 0.8 },
  { id: 'bike',  icon: '🏍️', name: 'Bike',  mileage: 35, idle: 0.3 },
  { id: 'truck', icon: '🚛', name: 'Truck', mileage: 6,  idle: 1.2 },
]

export default function VehicleConfig({
  presetId,
  mileage,
  idleRate,
  onApplyPreset,
  onMileageChange,
  onIdleRateChange,
}) {
  return (
    <div className="vehicle-section">
      <div className="section-label">Vehicle</div>

      {/* Presets */}
      <div className="preset-grid">
        {PRESETS.map(p => (
          <button
            key={p.id}
            className={`preset-btn${presetId === p.id ? ' active' : ''}`}
            onClick={() => onApplyPreset(p)}
          >
            <span className="preset-icon">{p.icon}</span>
            <span className="preset-name">{p.name}</span>
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="sliders-stack">
        <Slider
          label="Mileage"
          value={mileage}
          min={4}
          max={60}
          step={1}
          unit="km/L"
          onChange={onMileageChange}
        />
        <Slider
          label="Idle Consumption"
          value={idleRate}
          min={0.1}
          max={2.0}
          step={0.05}
          unit="L/hr"
          onChange={onIdleRateChange}
        />
      </div>
    </div>
  )
}