function IconCrosshair() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="7" cy="7" r="2" fill="currentColor"/>
      <line x1="7" y1="1"    x2="7"   y2="3.5" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="7" y1="10.5" x2="7"   y2="13"  stroke="currentColor" strokeWidth="1.3"/>
      <line x1="1" y1="7"    x2="3.5" y2="7"   stroke="currentColor" strokeWidth="1.3"/>
      <line x1="10.5" y1="7" x2="13"  y2="7"   stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

const fmt5 = v => (v != null ? Number(v).toFixed(5) : '—')

export default function LocationInputs({
  sourceText, destText,
  source,     dest,
  selectingFor,
  geocoding,
  onSourceTextChange, onDestTextChange,
  onGeocodeSrc,       onGeocodeDst,      // ← fixed name
  onToggleSelectSrc,  onToggleSelectDst,
}) {
  return (
    <div className="location-section">
      <div className="section-label">Route Points</div>

      <div className="location-stack">
        {/* Source */}
        <div className={`loc-card${selectingFor === 'source' ? ' selecting' : ''}`}>
          <div className="loc-row">
            <div className="loc-marker">
              <div className="pin pin-src" />
            </div>
            <input
              className="loc-input"
              placeholder="From — type address or click map"
              value={geocoding === 'source' ? 'Searching…' : sourceText}
              disabled={geocoding === 'source'}
              onChange={e => onSourceTextChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onGeocodeSrc()}
            />
            <div className="loc-actions">
              <button className="loc-action-btn" title="Pick on map" onClick={onToggleSelectSrc}>
                <IconCrosshair />
              </button>
              <button className="loc-action-btn" title="Search" onClick={onGeocodeSrc}>
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

        {/* Destination */}
        <div className={`loc-card${selectingFor === 'destination' ? ' selecting' : ''}`}>
          <div className="loc-row">
            <div className="loc-marker">
              <div className="pin pin-dst" />
            </div>
            <input
              className="loc-input"
              placeholder="To — type address or click map"
              value={geocoding === 'dest' ? 'Searching…' : destText}
              disabled={geocoding === 'dest'}
              onChange={e => onDestTextChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onGeocodeDst()}  // ← fixed
            />
            <div className="loc-actions">
              <button className="loc-action-btn" title="Pick on map" onClick={onToggleSelectDst}>
                <IconCrosshair />
              </button>
              <button className="loc-action-btn" title="Search" onClick={onGeocodeDst}>  {/* ← fixed */}
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