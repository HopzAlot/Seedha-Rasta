import { useRouting }     from './hooks/useRouting'
import { useNavigation }  from './hooks/useNavigation'
import HeroCanvas         from './components/HeroCanvas'
import MapView            from './components/MapView'
import LocationInputs     from './components/LocationInputs'
import VehicleConfig      from './components/VehicleConfig'
import Results            from './components/Results'
import NavigationBar      from './components/NavigationBar'

export default function App() {
  const routing = useRouting()

  // Use the active mode's route for navigation
  const activeRoute =
    routing.activeMode === 'fuel'
      ? (routing.routeData?.fuel_optimized?.route ?? null)
      : (routing.routeData?.shortest?.route ?? null)

  const nav = useNavigation(activeRoute)

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
              locating={routing.locating}
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
            onLocateSrc={() => routing.fetchLiveLocation('source')}
            onLocateDst={() => routing.fetchLiveLocation('destination')}
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

  {/* Live OGRA petrol price */}
  <span style={{
    fontFamily: 'var(--fm)',
    fontSize:   '8.5px',
    color:      routing.fuelPriceLoading ? 'var(--mu)' : 'var(--orange)',
    display:    'flex',
    alignItems: 'center',
    gap:        '4px',
  }}>
    ⛽
    {routing.fuelPriceLoading
      ? 'fetching price…'
      : `₨${routing.fuelPrice.toFixed(2)}/L`}
  </span>

  <div className="api-pill">
    <div className={`api-dot${routing.apiOnline === false ? ' offline' : ''}`} />
    {routing.apiOnline === null ? 'Connecting…'
      : routing.apiOnline ? 'API Live' : 'API Offline'}
  </div>
</footer>
      </aside>

      <div className="map-shell">
        {/* Navigation bar — sits at top of map */}
        {routing.routeData && (
          <NavigationBar
            active={nav.active}
            currentInstruction={nav.currentInstruction}
            nextInstruction={nav.nextInstruction}
            remainingM={nav.remainingM}
            remainingMin={nav.remainingMin}
            arrived={nav.arrived}
            error={nav.error}
            onStart={nav.start}
            onStop={nav.stop}
            activeMode={routing.activeMode}
            route={activeRoute}
          />
        )}

        <MapView
          source={routing.source}
          dest={routing.dest}
          fuelRoute={routing.routeData?.fuel_optimized?.route ?? null}
          shortRoute={routing.routeData?.shortest?.route ?? null}
          activeMode={routing.activeMode}
          selectingFor={routing.selectingFor}
          hasResults={!!routing.routeData}
          onMapClick={routing.handleMapClick}
          userPosition={nav.position}
          navActive={nav.active}
        />

        {routing.routeData && !nav.active && (
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