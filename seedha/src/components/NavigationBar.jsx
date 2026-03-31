import { useEffect, useRef } from 'react'
import L from 'leaflet'

function DirectionArrow({ direction }) {
  const arrows = {
    straight:    '↑',
    right:       '↱',
    left:        '↰',
    destination: '⬛',
  }
  const colors = {
    straight:    'var(--lime)',
    right:       'var(--orange)',
    left:        'var(--blue)',
    destination: 'var(--lime)',
  }
  return (
    <span
      className="nav-arrow"
      style={{ color: colors[direction] ?? 'var(--lime)' }}
    >
      {arrows[direction] ?? '↑'}
    </span>
  )
}

function formatDist(metres) {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`
  return `${Math.round(metres)} m`
}

function formatTime(minutes) {
  if (minutes < 1)  return '< 1 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}h ${m}m`
}

export default function NavigationBar({
  active,
  currentInstruction,
  nextInstruction,
  remainingM,
  remainingMin,
  arrived,
  error,
  onStart,
  onStop,
  activeMode,
  route,
}) {
  if (!route?.length) return null

  const modeColor = activeMode === 'fuel' ? 'var(--lime)' : 'var(--blue)'
  const modeLabel = activeMode === 'fuel' ? '⛽ Fuel-Optimized' : '📍 Shortest'

  /* ── Arrived state ── */
  if (arrived) {
    return (
      <div className="nav-bar arrived">
        <div className="nav-arrived-inner">
          <span className="nav-arrived-icon">🏁</span>
          <div>
            <div className="nav-arrived-title">You have arrived!</div>
            <div className="nav-arrived-sub">{modeLabel} route complete</div>
          </div>
          <button className="nav-stop-btn" onClick={onStop}>Done</button>
        </div>
      </div>
    )
  }

  /* ── Inactive — just a start button ── */
  if (!active) {
    return (
      <div className="nav-bar idle">
        <div className="nav-idle-inner">
          <div className="nav-idle-left">
            <span className="nav-idle-icon">🧭</span>
            <div>
              <div className="nav-idle-title">Navigate this route</div>
              <div className="nav-idle-sub">{modeLabel} · {formatDist(remainingM)}</div>
            </div>
          </div>
          <button
            className="nav-start-btn"
            onClick={onStart}
            style={{ background: modeColor }}
          >
            Start
          </button>
        </div>
        {error && <div className="nav-error">{error}</div>}
      </div>
    )
  }

  /* ── Active navigation ── */
  return (
    <div className="nav-bar active">
      {/* Current instruction */}
      <div className="nav-current">
        {currentInstruction && (
          <>
            <DirectionArrow direction={currentInstruction.direction} />
            <div className="nav-instruction-text">
              <div className="nav-instr-main">{currentInstruction.text}</div>
              {nextInstruction && (
                <div className="nav-instr-next">
                  Then: {nextInstruction.text}
                  {nextInstruction.distance > 0 &&
                    ` in ${formatDist(nextInstruction.distance)}`}
                </div>
              )}
            </div>
          </>
        )}

        {/* Remaining */}
        <div className="nav-remaining">
          <div className="nav-rem-dist">{formatDist(remainingM)}</div>
          <div className="nav-rem-time">{formatTime(remainingMin)}</div>
        </div>

        {/* Stop */}
        <button className="nav-stop-btn" onClick={onStop}>✕</button>
      </div>

      {/* Progress bar */}
      <div className="nav-progress-track">
        <div
          className="nav-progress-fill"
          style={{
            width: `${Math.max(2, 100 - (remainingM / (remainingM + 1)) * 100)}%`,
            background: modeColor,
          }}
        />
      </div>
    </div>
  )
}