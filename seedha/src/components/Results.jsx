const fmt = (n, d = 2) => (n != null ? Number(n).toFixed(d) : '—')

export default function Results({ data, activeMode, onModeChange }) {
  if (!data) return null

  const { fuel_optimized: fo, shortest: sh, comparison: cmp } = data

  const fuelSaved  = cmp?.fuel_saved    ?? 0
  const pkrSaved   = cmp?.cost_saved_pkr ?? 0
  const timeDiff   = cmp?.time_diff      ?? 0   // negative = fuel takes longer
  const distDiff   = cmp?.distance_diff  ?? 0

  return (
    <div className="results-section">
      <div className="section-label">Route Results</div>

      {/* Winner summary */}
      <div className="winner-banner">
        <span className="winner-icon">⚡</span>
        <div className="winner-text">
          Fuel route saves{' '}
          <strong>₨{Math.abs(pkrSaved).toFixed(0)}</strong> &amp;{' '}
          <strong>{Math.abs(fuelSaved).toFixed(3)}L</strong>
          {timeDiff < 0 && (
            <span className="winner-tradeoff">
              {' '}· +{Math.abs(timeDiff).toFixed(1)} min longer
            </span>
          )}
        </div>
      </div>

      {/* ── Route cards (clickable to highlight on map) ── */}
      <div className="route-cards">

        {/* FUEL OPTIMIZED */}
        <div
          className={`route-card fuel${activeMode === 'fuel' ? ' active' : ''}`}
          onClick={() => onModeChange('fuel')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onModeChange('fuel')}
        >
          <div className="rc-header">
            <span className="rc-label">⛽ Fuel-Optimized</span>
            <span className="rc-badge">RECOMMENDED</span>
          </div>
          <div className="rc-metrics">
            <div className="rc-metric">
              <span className="rc-value">{fmt(fo.fuel_cost, 3)}</span>
              <span className="rc-unit">Litres</span>
            </div>
            <div className="rc-metric">
              <span className="rc-value">{fmt(fo.distance_km, 1)}</span>
              <span className="rc-unit">km</span>
            </div>
            <div className="rc-metric">
              <span className="rc-value">
                {fo.time_min != null ? Math.round(fo.time_min) : '—'}
              </span>
              <span className="rc-unit">min</span>
            </div>
          </div>
        </div>

        {/* SHORTEST */}
        <div
          className={`route-card shortest${activeMode === 'shortest' ? ' active' : ''}`}
          onClick={() => onModeChange('shortest')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onModeChange('shortest')}
        >
          <div className="rc-header">
            <span className="rc-label">📍 Shortest</span>
            <span className="rc-badge">DISTANCE</span>
          </div>
          <div className="rc-metrics">
            <div className="rc-metric">
              <span className="rc-value">{fmt(sh.fuel_cost, 3)}</span>
              <span className="rc-unit">Litres</span>
            </div>
            <div className="rc-metric">
              <span className="rc-value">{fmt(sh.distance_km, 1)}</span>
              <span className="rc-unit">km</span>
            </div>
            <div className="rc-metric">
              <span className="rc-value">
                {sh.time_min != null ? Math.round(sh.time_min) : '—'}
              </span>
              <span className="rc-unit">min</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delta comparison row ── */}
      <div className="delta-row">
        <div className="delta">
          <span className={`delta-value ${fuelSaved > 0 ? 'positive' : 'negative'}`}>
            {fuelSaved > 0 ? '-' : '+'}{Math.abs(fuelSaved).toFixed(3)}L
          </span>
          <span className="delta-unit">Fuel saved</span>
        </div>
        <div className="delta">
          <span className={`delta-value ${pkrSaved > 0 ? 'positive' : 'negative'}`}>
            ₨{Math.abs(pkrSaved).toFixed(0)}
          </span>
          <span className="delta-unit">PKR saved</span>
        </div>
        <div className="delta">
          <span className={`delta-value ${timeDiff < 0 ? 'negative' : 'positive'}`}>
            {timeDiff < 0 ? '+' : '-'}{Math.abs(timeDiff).toFixed(1)}m
          </span>
          <span className="delta-unit">Time diff</span>
        </div>
      </div>

      {/* ── PKR cost cards ── */}
      <div className="pkr-cards">
        <div className="pkr-card fuel">
          <span className="pkr-label">⛽ Fuel cost</span>
          <span className="pkr-value">
            ₨{fo.cost_pkr_fuel != null ? Math.round(fo.cost_pkr_fuel) : '—'}
          </span>
        </div>
        <div className="pkr-card shortest">
          <span className="pkr-label">📍 Short cost</span>
          <span className="pkr-value">
            ₨{sh.cost_pkr_short != null ? Math.round(sh.cost_pkr_short) : '—'}
          </span>
        </div>
      </div>

      <p className="results-hint">
        Tap a card to highlight that route on the map
      </p>
    </div>
  )
}