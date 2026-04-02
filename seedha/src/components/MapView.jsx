import { useEffect, useRef } from 'react'
import L from 'leaflet'

const LAHORE_CENTER = [31.5204, 74.3587]

function makeIcon(emoji) {
  return L.divIcon({
    html: `<div style="font-size:22px;filter:drop-shadow(0 2px 8px rgba(0,0,0,.7))">${emoji}</div>`,
    className:  '',
    iconSize:   [32, 32],
    iconAnchor: [16, 28],
  })
}

function makeUserIcon() {
  return L.divIcon({
    html: `
      <div style="position:relative;width:20px;height:20px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:rgba(91,168,255,0.25);
          animation:userPing 1.5s ease-out infinite;
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:12px;height:12px;border-radius:50%;
          background:#5ba8ff;
          border:2px solid white;
          box-shadow:0 0 8px rgba(91,168,255,0.8);
        "></div>
      </div>
    `,
    className:  '',
    iconSize:   [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function MapView({
  source, dest,
  fuelRoute, shortRoute,
  activeMode,
  selectingFor,
  hasResults,
  onMapClick,
  userPosition,
  navActive,
}) {
  const mapRef      = useRef(null)
  const srcMRef     = useRef(null)
  const dstMRef     = useRef(null)
  const fuelLRef    = useRef(null)
  const shortLRef   = useRef(null)
  const userMRef    = useRef(null)
  const boundsRef   = useRef(null)   // ← stores current src+dst bounds

  const onMapClickRef   = useRef(onMapClick)
  const selectingForRef = useRef(selectingFor)
  useEffect(() => { onMapClickRef.current   = onMapClick   }, [onMapClick])
  useEffect(() => { selectingForRef.current = selectingFor }, [selectingFor])

  /* ── Init map ONCE ── */
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map('leaflet-map', {
      center:      LAHORE_CENTER,
      zoom:        13,
      zoomControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.on('click', (e) => {
      if (!selectingForRef.current) return
      onMapClickRef.current(e.latlng.lat, e.latlng.lng)
    })
    map.on('mousemove', (e) => {
      const el = document.getElementById('coord-display')
      if (el) el.textContent = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`
    })
    mapRef.current = map
  }, [])

  /* ── Helper: update boundsRef and optionally fit ── */
  function refitBounds(srcMarker, dstMarker, fit = true) {
    const map = mapRef.current
    if (!map) return
    if (srcMarker && dstMarker) {
      const bounds = L.featureGroup([srcMarker, dstMarker]).getBounds()
      boundsRef.current = bounds
      if (fit) map.fitBounds(bounds, { padding: [80, 80], animate: true })
    }
  }

  /* ── Source marker ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    srcMRef.current?.remove(); srcMRef.current = null
    if (source) {
      srcMRef.current = L
        .marker([source.lat, source.lng], { icon: makeIcon('🟢'), zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip('Start', { direction: 'top' })

      if (dstMRef.current) {
        refitBounds(srcMRef.current, dstMRef.current)
      } else {
        map.flyTo([source.lat, source.lng], 15, { animate: true, duration: 1 })
        boundsRef.current = null
      }
    }
  }, [source])

  /* ── Destination marker ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    dstMRef.current?.remove(); dstMRef.current = null
    if (dest) {
      dstMRef.current = L
        .marker([dest.lat, dest.lng], { icon: makeIcon('🟠'), zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip('Destination', { direction: 'top' })

      if (srcMRef.current) {
        refitBounds(srcMRef.current, dstMRef.current)
      } else {
        map.flyTo([dest.lat, dest.lng], 15, { animate: true, duration: 1 })
        boundsRef.current = null
      }
    }
  }, [dest])

  /* ── User position marker ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!userPosition || !navActive) {
      userMRef.current?.remove(); userMRef.current = null
      return
    }
    if (!userMRef.current) {
      userMRef.current = L
        .marker([userPosition.lat, userPosition.lng], {
          icon: makeUserIcon(), zIndexOffset: 2000,
        })
        .addTo(map)
    } else {
      userMRef.current.setLatLng([userPosition.lat, userPosition.lng])
    }
    map.panTo([userPosition.lat, userPosition.lng], { animate: true, duration: 0.5 })
  }, [userPosition, navActive])

  /* ── Draw both routes ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    fuelLRef.current?.remove();  fuelLRef.current  = null
    shortLRef.current?.remove(); shortLRef.current = null

    const fuelActive  = activeMode === 'fuel'
    const shortActive = activeMode === 'shortest'

    if (shortRoute?.length > 1) {
      shortLRef.current = L.polyline(
        shortRoute.map(p => [p.lat, p.lng]),
        {
          color: '#5ba8ff', weight: shortActive ? 6 : 3,
          opacity: shortActive ? 0.95 : 0.4,
          dashArray: shortActive ? null : '8 6',
          lineJoin: 'round', lineCap: 'round',
        }
      ).addTo(map)
    }

    if (fuelRoute?.length > 1) {
      fuelLRef.current = L.polyline(
        fuelRoute.map(p => [p.lat, p.lng]),
        {
          color: '#a8ff3e', weight: fuelActive ? 6 : 3,
          opacity: fuelActive ? 0.95 : 0.4,
          dashArray: fuelActive ? null : '8 6',
          lineJoin: 'round', lineCap: 'round',
        }
      ).addTo(map)

      // Update bounds to full route extent
      const routeBounds = fuelLRef.current.getBounds()
      boundsRef.current = routeBounds
      map.fitBounds(routeBounds, { padding: [60, 60] })
    }
  }, [fuelRoute, shortRoute, activeMode])

  /* ── Cursor ── */
  useEffect(() => {
    const container = mapRef.current?.getContainer()
    if (!container) return
    container.style.cursor = selectingFor ? 'crosshair' : ''
  }, [selectingFor])

  /* ── Re-center handler ── */
  function handleReCenter() {
    const map = mapRef.current
    if (!map) return
    if (boundsRef.current) {
      map.fitBounds(boundsRef.current, { padding: [80, 80], animate: true })
    } else if (source) {
      map.flyTo([source.lat, source.lng], 15, { animate: true, duration: 1 })
    }
  }

  const modeColor = activeMode === 'fuel' ? '#a8ff3e' : '#5ba8ff'
  const modeLabel = activeMode === 'fuel' ? '⛽ Fuel-Optimized' : '📍 Shortest Route'
  const hasPoints = source || dest

  return (
    <div id="map-wrap">
      <div id="leaflet-map" />

      <style>{`
        @keyframes userPing {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0;   }
        }
      `}</style>

      {/* Coord HUD */}
      <div className="map-hud coords">
        <span id="coord-display">Hover map…</span>
      </div>

      {/* Mode badge */}
      {hasResults && !navActive && (
        <div className="map-hud mode-badge" style={{ borderColor: `${modeColor}33` }}>
          <div className="mode-pulse" style={{ background: modeColor }} />
          <span style={{ color: modeColor }}>{modeLabel} highlighted</span>
        </div>
      )}

      {/* Click hint */}
      {selectingFor && (
        <div className="map-hud hint">
          Click to set <strong>
            {selectingFor === 'source' ? 'start' : 'destination'}
          </strong>
        </div>
      )}

      {/* ── Re-center button ── */}
      {hasPoints && (
        <button
          className="recenter-btn"
          onClick={handleReCenter}
          title="Re-center map"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3"   stroke="currentColor" strokeWidth="1.6"/>
            <line x1="8" y1="1"  x2="8"  y2="4"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="8" y1="12" x2="8"  y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="1" y1="8"  x2="4"  y2="8"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="12" y1="8" x2="15" y2="8"  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* Legend */}
      {hasResults && (
        <div className="map-hud legend">
          <div className="legend-row">
            <div className="legend-line" style={{ background: '#a8ff3e' }} />
            <span>Fuel-Optimized</span>
          </div>
          <div className="legend-row">
            <div className="legend-line" style={{ background: '#5ba8ff', opacity: 0.7 }} />
            <span>Shortest</span>
          </div>
          {navActive && (
            <div className="legend-row">
              <div className="legend-line" style={{ background: '#5ba8ff', borderRadius: '50%', width: 10, height: 10 }} />
              <span>Your position</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}