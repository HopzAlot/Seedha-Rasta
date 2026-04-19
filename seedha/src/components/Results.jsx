import { useState } from 'react'

const fmt = (n, d = 2) => (n != null ? Number(n).toFixed(d) : '—')

// ₨ rendered in Outfit (display font) instead of Space Mono
function Rs({ children }) {
  return (
    <span style={{ fontFamily: 'var(--ff)', fontWeight: 700 }}>
      ₨{children}
    </span>
  )
}

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
  const [collapsed, setCollapsed] = useState(false)

  if (!data) return null

  const { fuel_optimized: fo, shortest: sh, comparison: cmp } = data
  const fuelSaved = cmp?.fuel_saved     ?? 0
  const pkrSaved  = cmp?.cost_saved_pkr ?? 0
  const timeDiff  = cmp?.time_diff      ?? 0

  const isFuel = activeMode === 'fuel'
  const active = isFuel ? fo : sh

  return (
    <div className={`results-drawer${collapsed ? ' collapsed' : ''}`}>

      {/* Handle */}
      <div
        className="drawer-handle"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Show results' : 'Hide results'}
      >
        <div className="drawer-handle-bar" />
        <span className="drawer-handle-hint">
          {collapsed ? '▲ Show results' : '▼ Hide'}
        </span>
      </div>

      <div className="drawer-collapsible">

        {/* Tabs + close */}
        <div className="drawer-toprow">
          <div className="route-tabs">
            <button
              className={`rtab${isFuel ? ' active fuel' : ''}`}
              onClick={() => onModeChange('fuel')}
            >
              <span className="rtab-dot" style={{ background: 'var(--lime)' }} />
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
              <line x1="1" y1="1" x2="13" y2="13"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="13" y1="1" x2="1"  y2="13"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">

          {/* Stats */}
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
              label="Fuel expense"
              value={
                isFuel
                  ? (fo.cost_pkr_fuel  != null
                      ? <Rs>{Math.round(fo.cost_pkr_fuel)}</Rs>
                      : '—')
                  : (sh.cost_pkr_short != null
                      ? <Rs>{Math.round(sh.cost_pkr_short)}</Rs>
                      : '—')
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
              <CmpCell
                value={fmt(fo.fuel_cost, 3)}
                highlight={fo.fuel_cost <= sh.fuel_cost}
              />
              <CmpCell
                value={fmt(sh.fuel_cost, 3)}
                highlight={sh.fuel_cost < fo.fuel_cost}
              />
              <span className="cmp-saved">
                {fuelSaved > 0
                  ? <span className="saved-pos">−{fmt(fuelSaved, 3)}L</span>
                  : <span className="saved-neu">—</span>}
              </span>
            </div>

            <div className="cmp-data-row">
              <span className="cmp-field-lbl">Km</span>
              <CmpCell
                value={fmt(fo.distance_km, 1)}
                highlight={fo.distance_km <= sh.distance_km}
              />
              <CmpCell
                value={fmt(sh.distance_km, 1)}
                highlight={sh.distance_km < fo.distance_km}
              />
              <span className="cmp-saved">
                {/* Logic: If fo is larger than sh, the difference is an "increase" (+) 
                  from the shortest path perspective.
                */}
                {cmp.distance_diff !== 0 ? (
                  <span className={cmp.distance_diff < 0 ? 'saved-neg' : 'saved-pos'}>
                    {/* Force it to show + if the fuel route is longer than shortest */}
                    {cmp.distance_diff > 0 ? '−' : '+'}
                    {fmt(Math.abs(cmp.distance_diff), 2)}km
                  </span>
                ) : (
                  <span className="saved-neu">—</span>
                )}
              </span>
            </div>

            <div className="cmp-data-row">
              <span className="cmp-field-lbl">Minutes</span>
              <CmpCell
                value={fo.time_min != null ? Math.round(fo.time_min) : '—'}
                highlight={(fo.time_min ?? Infinity) <= (sh.time_min ?? Infinity)}
              />
              <CmpCell
                value={sh.time_min != null ? Math.round(sh.time_min) : '—'}
                highlight={(sh.time_min ?? Infinity) < (fo.time_min ?? Infinity)}
              />
              <span className="cmp-saved">
                {timeDiff !== 0
                  ? <span className={timeDiff > 0 ? 'saved-pos' : 'saved-neg'}>
                      {timeDiff > 0 ? '+' : ''}
                      {fmt(Math.abs(timeDiff), 1)}m
                    </span>
                  : <span className="saved-neu">—</span>}
              </span>
            </div>

            <div className="cmp-data-row">
              <span className="cmp-field-lbl">PKR</span>
              <CmpCell
                value={fo.cost_pkr_fuel  != null
                  ? <Rs>{Math.round(fo.cost_pkr_fuel)}</Rs>
                  : '—'}
                highlight={(fo.cost_pkr_fuel ?? Infinity) <= (sh.cost_pkr_short ?? Infinity)}
              />
              <CmpCell
                value={sh.cost_pkr_short != null
                  ? <Rs>{Math.round(sh.cost_pkr_short)}</Rs>
                  : '—'}
                highlight={(sh.cost_pkr_short ?? Infinity) < (fo.cost_pkr_fuel ?? Infinity)}
              />
              <span className="cmp-saved">
                {pkrSaved > 0
                  ? <span className="saved-pos">
                      −<Rs>{Math.round(pkrSaved)}</Rs>
                    </span>
                  : <span className="saved-neu">—</span>}
              </span>
            </div>

            <div className="cmp-data-row">
              <span className="cmp-field-lbl">Ride fare est.</span>
              <CmpCell
                value={fo.est_fare_pkr != null
                  ? <Rs>{Math.round(fo.est_fare_pkr)}</Rs>
                  : '—'}
                highlight={(fo.est_fare_pkr ?? Infinity) <= (sh.est_fare_pkr ?? Infinity)}
              />
              <CmpCell
                value={sh.est_fare_pkr != null
                  ? <Rs>{Math.round(sh.est_fare_pkr)}</Rs>
                  : '—'}
                highlight={(sh.est_fare_pkr ?? Infinity) < (fo.est_fare_pkr ?? Infinity)}
              />
              <span className="cmp-saved">
                {(cmp.fare_saved_pkr ?? 0) > 0
                  ? <span className="saved-pos">−<Rs>{Math.round(cmp.fare_saved_pkr)}</Rs></span>
                  : <span className="saved-neu">—</span>}
              </span>
            </div>
          </div>

          {/* Savings pill */}
          {fuelSaved > 0 && (
            <div className="savings-pill">
              <span>⚡</span>
              <span>
                Fuel-optimized saves{' '}
                <strong><Rs>{Math.round(pkrSaved)}</Rs></strong>
                {' & '}
                <strong>{fmt(fuelSaved, 3)}L</strong>
                {timeDiff < 0 && (
                  <span className="pill-trade">
                    {' '}· +{Math.abs(timeDiff).toFixed(1)} min longer
                  </span>
                )}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}