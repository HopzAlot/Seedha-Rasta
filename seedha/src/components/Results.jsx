const fmt = (n, d = 2) => (n != null ? Number(n).toFixed(d) : '—')

function StatPill({ label, value, unit, color }) {
  return (
    <div className="stat-pill">
      <span className="stat-value" style={{ color }}>{value}</span>
      <span className="stat-unit">{unit}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export default function Results({ data, activeMode, onModeChange }) {
  if (!data) return null

  const { fuel_optimized: fo, shortest: sh, comparison: cmp } = data
  const fuelSaved = cmp?.fuel_saved     ?? 0
  const pkrSaved  = cmp?.cost_saved_pkr ?? 0
  const timeDiff  = cmp?.time_diff      ?? 0

  return (
    <div className="results-wrap">

      {/* ── Savings summary strip ── */}
      <div className="savings-strip">
        <span className="savings-ico">⚡</span>
        <span className="savings-copy">
          Fuel route saves{' '}
          <b>₨{Math.abs(pkrSaved).toFixed(0)}</b>
          {' & '}
          <b>{Math.abs(fuelSaved).toFixed(3)}L</b>
          {timeDiff < 0
            ? <span className="savings-trade"> · +{Math.abs(timeDiff).toFixed(1)} min</span>
            : null}
        </span>
      </div>

      {/* ── Route selector tabs ── */}
      <div className="route-tabs">
        <button
          className={`route-tab fuel${activeMode === 'fuel' ? ' active' : ''}`}
          onClick={() => onModeChange('fuel')}
        >
          <span className="tab-dot fuel-dot" />
          Fuel-Optimized
        </button>
        <button
          className={`route-tab short${activeMode === 'shortest' ? ' active' : ''}`}
          onClick={() => onModeChange('shortest')}
        >
          <span className="tab-dot short-dot" />
          Shortest
        </button>
      </div>

      {/* ── Active route stats ── */}
      {activeMode === 'fuel' ? (
        <div className="stats-row">
          <StatPill
            label="Fuel"
            value={fmt(fo.fuel_cost, 3)}
            unit="L"
            color="var(--lime)"
          />
          <div className="stats-divider" />
          <StatPill
            label="Distance"
            value={fmt(fo.distance_km, 1)}
            unit="km"
            color="var(--txt)"
          />
          <div className="stats-divider" />
          <StatPill
            label="Time"
            value={fo.time_min != null ? Math.round(fo.time_min) : '—'}
            unit="min"
            color="var(--txt)"
          />
          <div className="stats-divider" />
          <StatPill
            label="Cost"
            value={fo.cost_pkr_fuel != null ? `₨${Math.round(fo.cost_pkr_fuel)}` : '—'}
            unit=""
            color="var(--orange)"
          />
        </div>
      ) : (
        <div className="stats-row">
          <StatPill
            label="Fuel"
            value={fmt(sh.fuel_cost, 3)}
            unit="L"
            color="var(--blue)"
          />
          <div className="stats-divider" />
          <StatPill
            label="Distance"
            value={fmt(sh.distance_km, 1)}
            unit="km"
            color="var(--txt)"
          />
          <div className="stats-divider" />
          <StatPill
            label="Time"
            value={sh.time_min != null ? Math.round(sh.time_min) : '—'}
            unit="min"
            color="var(--txt)"
          />
          <div className="stats-divider" />
          <StatPill
            label="Cost"
            value={sh.cost_pkr_short != null ? `₨${Math.round(sh.cost_pkr_short)}` : '—'}
            unit=""
            color="var(--orange)"
          />
        </div>
      )}

      {/* ── Comparison mini-table ── */}
      <div className="cmp-table">
        <div className="cmp-row header">
          <span />
          <span>Fuel</span>
          <span>Shortest</span>
        </div>
        <div className="cmp-row">
          <span className="cmp-field">Litres</span>
          <span className="cmp-val lime">{fmt(fo.fuel_cost, 3)}</span>
          <span className="cmp-val blue">{fmt(sh.fuel_cost, 3)}</span>
        </div>
        <div className="cmp-row">
          <span className="cmp-field">Km</span>
          <span className="cmp-val lime">{fmt(fo.distance_km, 1)}</span>
          <span className="cmp-val blue">{fmt(sh.distance_km, 1)}</span>
        </div>
        <div className="cmp-row">
          <span className="cmp-field">Minutes</span>
          <span className="cmp-val lime">{fo.time_min != null ? Math.round(fo.time_min) : '—'}</span>
          <span className="cmp-val blue">{sh.time_min != null ? Math.round(sh.time_min) : '—'}</span>
        </div>
        <div className="cmp-row">
          <span className="cmp-field">PKR</span>
          <span className="cmp-val lime">₨{fo.cost_pkr_fuel != null ? Math.round(fo.cost_pkr_fuel) : '—'}</span>
          <span className="cmp-val blue">₨{sh.cost_pkr_short != null ? Math.round(sh.cost_pkr_short) : '—'}</span>
        </div>
      </div>

    </div>
  )
}