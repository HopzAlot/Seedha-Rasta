function IconCrosshair() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="7" cy="7" r="2"   fill="currentColor"/>
      <line x1="7"    y1="1"    x2="7"   y2="3.5" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="7"    y1="10.5" x2="7"   y2="13"  stroke="currentColor" strokeWidth="1.3"/>
      <line x1="1"    y1="7"    x2="3.5" y2="7"   stroke="currentColor" strokeWidth="1.3"/>
      <line x1="10.5" y1="7"    x2="13"  y2="7"   stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="9.5" y1="9.5" x2="13" y2="13"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// GPS signal icon
function IconGPS({ spinning }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 14 14" fill="none"
      style={spinning ? { animation: 'gpsSpin 1s linear infinite' } : {}}
    >
      <circle cx="7" cy="7" r="2.5" fill="currentColor"/>
      <path d="M7 1 L7 3"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M7 11 L7 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M1 7 L3 7"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M11 7 L13 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2"/>
    </svg>
  )
}

const fmt5 = v => (v != null ? Number(v).toFixed(5) : '—')

export default function LocationInputs({
  sourceText, destText,
  source,     dest,
  selectingFor,
  geocoding,
  locating,             // ← new
  onSourceTextChange, onDestTextChange,
  onGeocodeSrc,       onGeocodeDst,
  onToggleSelectSrc,  onToggleSelectDst,
  onLocateSrc,        onLocateDst,   // ← new
}) {
  return (
    <div className="location-section">
      <div className="section-label">Route Points</div>

      <div className="location-stack">

        {/* ── Source ── */}
        <div className={`loc-card${selectingFor === 'source' ? ' selecting' : ''}`}>
          <div className="loc-row">
            <div className="loc-marker">
              <div className="pin pin-src" />
            </div>

            <input
              className="loc-input"
              placeholder="From — type, pin or use GPS"
              value={
                geocoding === 'source' ? 'Searching…'
                : locating === 'source' ? 'Getting location…'
                : sourceText
              }
              disabled={geocoding === 'source' || locating === 'source'}
              onChange={e => onSourceTextChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onGeocodeSrc()}
            />

            <div className="loc-actions">
              {/* GPS button */}
              <button
                className={`loc-action-btn gps-btn${locating === 'source' ? ' locating' : ''}`}
                title="Use my current location"
                onClick={onLocateSrc}
                disabled={!!locating}
              >
                <IconGPS spinning={locating === 'source'} />
              </button>
              {/* Map pin button */}
              <button
                className="loc-action-btn"
                title="Pick on map"
                onClick={onToggleSelectSrc}
              >
                <IconCrosshair />
              </button>
              {/* Search button */}
              <button
                className="loc-action-btn"
                title="Search address"
                onClick={onGeocodeSrc}
              >
                <IconSearch />
              </button>
            </div>
          </div>

          {source && (
            <div className="coord-tag">
              {fmt5(source.lat)}, {fmt5(source.lng)}
            </div>
          )}
        </div>

        <div className="loc-connector" />

        {/* ── Destination ── */}
        <div className={`loc-card${selectingFor === 'destination' ? ' selecting' : ''}`}>
          <div className="loc-row">
            <div className="loc-marker">
              <div className="pin pin-dst" />
            </div>

            <input
              className="loc-input"
              placeholder="To — type, pin or use GPS"
              value={
                geocoding === 'dest'        ? 'Searching…'
                : locating === 'destination' ? 'Getting location…'
                : destText
              }
              disabled={geocoding === 'dest' || locating === 'destination'}
              onChange={e => onDestTextChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onGeocodeDst()}
            />

            <div className="loc-actions">
              {/* GPS button */}
              <button
                className={`loc-action-btn gps-btn${locating === 'destination' ? ' locating' : ''}`}
                title="Use my current location"
                onClick={onLocateDst}
                disabled={!!locating}
              >
                <IconGPS spinning={locating === 'destination'} />
              </button>
              {/* Map pin button */}
              <button
                className="loc-action-btn"
                title="Pick on map"
                onClick={onToggleSelectDst}
              >
                <IconCrosshair />
              </button>
              {/* Search button */}
              <button
                className="loc-action-btn"
                title="Search address"
                onClick={onGeocodeDst}
              >
                <IconSearch />
              </button>
            </div>
          </div>

          {dest && (
            <div className="coord-tag">
              {fmt5(dest.lat)}, {fmt5(dest.lng)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}