const fmt = (n, d = 2) => (n != null ? Number(n).toFixed(d) : '—')

function Stat({ label, value, unit, color }) {
  return (
    <div className="res-stat">
      <span className="res-stat-value" style={{ color }}>{value}</span>
      <span className="res-stat-unit">{unit}</span>
      <span className="res-stat-label">{label}</span>
    </div>
  )
}

function CmpCell({ value, highlight }) {
  return (
    <span className={`cmp-cell${highlight ? ' win' : ''}`}>
      {highlight && <span className="cmp-win-dot" />}
      {value}
    </span>
  )
}

export default function Results({ data, activeMode, onModeChange, onClose }) {
  if (!data) return null

  const { fuel_optimized: fo, shortest: sh, comparison: cmp } = data
  const fuelSaved = cmp?.fuel_saved     ?? 0
  const pkrSaved  = cmp?.cost_saved_pkr ?? 0
  const timeDiff  = cmp?.time_diff      ?? 0

  const isFuel = activeMode === 'fuel'
  const active = isFuel ? fo : sh

  return (
    <div className="results-drawer">

      {/* ── Drag handle ── */}
      <div className="drawer-handle" />

      {/* ── Top row: tabs + close ── */}
      <div className="drawer-toprow">
        <div className="route-tabs">
          <button
            className={`rtab${isFuel ? ' active fuel' : ''}`}
            onClick={() => onModeChange('fuel')}
          >
            <span className="rtab-dot" style={{ background: isFuel && activeMode === 'fuel' ? 'var(--lime)' : 'var(--lime)' }} />
            ⛽ Fuel-Optimized
          </button>
          <button
            className={`rtab${!isFuel ? ' active short' : ''}`}
            onClick={() => onModeChange('shortest')}
          >
            <span className="rtab-dot" style={{ background: 'var(--blue)' }} />
            📍 Shortest
          </button>
        </div>

        <button className="drawer-close" onClick={onClose} title="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="13" y1="1" x2="1"  y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="drawer-body">

        {/* Active route stats */}
        <div className="res-stats-row">
          <Stat
            label="Fuel used"
            value={fmt(active.fuel_cost, 3)}
            unit="L"
            color={isFuel ? 'var(--lime)' : 'var(--blue)'}
          />
          <div className="res-divider" />
          <Stat
            label="Distance"
            value={fmt(active.distance_km, 1)}
            unit="km"
            color="var(--txt)"
          />
          <div className="res-divider" />
          <Stat
            label="Est. time"
            value={active.time_min != null ? Math.round(active.time_min) : '—'}
            unit="min"
            color="var(--txt)"
          />
          <div className="res-divider" />
          <Stat
            label="Fuel cost"
            value={
              isFuel
                ? (fo.cost_pkr_fuel   != null ? `₨${Math.round(fo.cost_pkr_fuel)}`   : '—')
                : (sh.cost_pkr_short  != null ? `₨${Math.round(sh.cost_pkr_short)}`  : '—')
            }
            unit=""
            color="var(--orange)"
          />
        </div>

        {/* Comparison table */}
        <div className="cmp-block">
          <div className="cmp-header-row">
            <span className="cmp-h-field" />
            <span className="cmp-h-col lime-txt">⛽ Fuel</span>
            <span className="cmp-h-col blue-txt">📍 Shortest</span>
            <span className="cmp-h-col">Saved</span>
          </div>

          <div className="cmp-data-row">
            <span className="cmp-field-lbl">Litres</span>
            <CmpCell value={fmt(fo.fuel_cost, 3)} highlight={fo.fuel_cost <= sh.fuel_cost} />
            <CmpCell value={fmt(sh.fuel_cost, 3)} highlight={sh.fuel_cost < fo.fuel_cost} />
            <span className="cmp-saved">
              {fuelSaved > 0
                ? <span className="saved-pos">−{fmt(fuelSaved, 3)}L</span>
                : <span className="saved-neu">—</span>}
            </span>
          </div>

          <div className="cmp-data-row">
            <span className="cmp-field-lbl">Km</span>
            <CmpCell value={fmt(fo.distance_km, 1)} highlight={fo.distance_km <= sh.distance_km} />
            <CmpCell value={fmt(sh.distance_km, 1)} highlight={sh.distance_km < fo.distance_km} />
            <span className="cmp-saved">
              {(cmp?.distance_diff ?? 0) !== 0
                ? <span className={cmp.distance_diff < 0 ? 'saved-pos' : 'saved-neg'}>
                    {cmp.distance_diff > 0 ? '+' : ''}{fmt(cmp.distance_diff, 2)}km
                  </span>
                : <span className="saved-neu">—</span>}
            </span>
          </div>

          <div className="cmp-data-row">
            <span className="cmp-field-lbl">Minutes</span>
            <CmpCell
              value={fo.time_min != null ? Math.round(fo.time_min) : '—'}
              highlight={fo.time_min <= sh.time_min}
            />
            <CmpCell
              value={sh.time_min != null ? Math.round(sh.time_min) : '—'}
              highlight={sh.time_min < fo.time_min}
            />
            <span className="cmp-saved">
              {timeDiff !== 0
                ? <span className={timeDiff > 0 ? 'saved-pos' : 'saved-neg'}>
                    {timeDiff > 0 ? '+' : ''}{fmt(Math.abs(timeDiff), 1)}m
                  </span>
                : <span className="saved-neu">—</span>}
            </span>
          </div>

          <div className="cmp-data-row">
            <span className="cmp-field-lbl">PKR</span>
            <CmpCell
              value={fo.cost_pkr_fuel  != null ? `₨${Math.round(fo.cost_pkr_fuel)}`  : '—'}
              highlight={fo.cost_pkr_fuel <= sh.cost_pkr_short}
            />
            <CmpCell
              value={sh.cost_pkr_short != null ? `₨${Math.round(sh.cost_pkr_short)}` : '—'}
              highlight={sh.cost_pkr_short < fo.cost_pkr_fuel}
            />
            <span className="cmp-saved">
              {pkrSaved > 0
                ? <span className="saved-pos">−₨{Math.round(pkrSaved)}</span>
                : <span className="saved-neu">—</span>}
            </span>
          </div>
        </div>

        {/* Savings pill */}
        {fuelSaved > 0 && (
          <div className="savings-pill">
            <span>⚡</span>
            <span>
              Fuel-optimized saves <strong>₨{Math.round(pkrSaved)}</strong> &amp; <strong>{fmt(fuelSaved, 3)}L</strong>
              {timeDiff < 0 && <span className="pill-trade"> · +{Math.abs(timeDiff).toFixed(1)} min longer</span>}
            </span>
          </div>
        )}

      </div>
    </div>
  )
}