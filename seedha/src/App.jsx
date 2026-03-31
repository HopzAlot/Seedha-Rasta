import { useRouting } from './hooks/useRouting'
import HeroCanvas     from './components/HeroCanvas'
import MapView        from './components/MapView'
import LocationInputs from './components/LocationInputs'
import VehicleConfig  from './components/VehicleConfig'
import Results        from './components/Results'

export default function App() {
  const routing = useRouting()

  return (
    <div className="shell">
      <aside className="panel">
        <HeroCanvas />

        <div className="panel-body">
          <LocationInputs
            sourceText={routing.sourceText}
            destText={routing.destText}
            source={routing.source}
            dest={routing.dest}
            selectingFor={routing.selectingFor}
            geocoding={routing.geocoding}
            onSourceTextChange={(v) => routing.setSourceText(v)}
            onDestTextChange={(v) => routing.setDestText(v)}
            onGeocodeSrc={routing.geocodeSrc}
            onGeocodeDst={routing.geocodeDst}
            onToggleSelectSrc={() =>
              routing.setSelectingFor(
                routing.selectingFor === 'source' ? null : 'source'
              )
            }
            onToggleSelectDst={() =>
              routing.setSelectingFor(
                routing.selectingFor === 'destination' ? null : 'destination'
              )
            }
          />

          <VehicleConfig
            presetId={routing.presetId}
            mileage={routing.mileage}
            idleRate={routing.idleRate}
            onApplyPreset={routing.applyPreset}
            onMileageChange={routing.setMileage}
            onIdleRateChange={routing.setIdleRate}
          />

          {routing.error && (
            <div className="status-bar error">⚠ {routing.error}</div>
          )}

          <button
            className={`go-btn${routing.loading ? ' loading' : ''}`}
            onClick={routing.submitRoute}
            disabled={!routing.canSubmit}
          >
            {routing.loading ? (
              <span className="go-btn__inner">
                <span className="spinner" />
                Loading graph, please wait…
              </span>
            ) : (
              'Find Routes →'
            )}
          </button>
        </div>

        <footer className="panel-footer">
          <span>Seedha Rasta · v2.0</span>
          <div className="api-pill">
            <div className={`api-dot${routing.apiOnline === false ? ' offline' : ''}`} />
            {routing.apiOnline === null
              ? 'Connecting…'
              : routing.apiOnline
              ? 'API Live'
              : 'API Offline'}
          </div>
        </footer>
      </aside>

      {/* ── Map + bottom results overlay ── */}
      <div className="map-shell">
        <MapView
          source={routing.source}
          dest={routing.dest}
          fuelRoute={routing.routeData?.fuel_optimized?.route ?? null}
          shortRoute={routing.routeData?.shortest?.route ?? null}
          activeMode={routing.activeMode}
          selectingFor={routing.selectingFor}
          hasResults={!!routing.routeData}
          onMapClick={routing.handleMapClick}
        />

        {/* Bottom results drawer */}
        {routing.routeData && (
          <Results
            data={routing.routeData}
            activeMode={routing.activeMode}
            onModeChange={routing.setActiveMode}
            onClose={() => routing.setRouteData(null)}
          />
        )}
      </div>
    </div>
  )
}