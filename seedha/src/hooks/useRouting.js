import { useState, useCallback, useEffect, useRef } from 'react'
import {
  fetchBothRoutes,
  geocodeAddress,
  reverseGeocode,
  checkApiHealth,
} from '../api/routeApi'

export function useRouting() {
  const [sourceText,   setSourceText]   = useState('')
  const [destText,     setDestText]     = useState('')
  const [source,       setSource]       = useState(null)
  const [dest,         setDest]         = useState(null)
  const [selectingFor, setSelectingFor] = useState(null)
  const [presetId,     setPresetId]     = useState('car')
  const [mileage,      setMileageState] = useState(12)
  const [idleRate,     setIdleRateState]= useState(0.6)
  const [routeData,    setRouteData]    = useState(null)
  const [activeMode,   setActiveMode]   = useState('fuel')
  const [loading,      setLoading]      = useState(false)
  const [geocoding,    setGeocoding]    = useState(null)
  const [error,        setError]        = useState(null)
  const [apiOnline,    setApiOnline]    = useState(null)

  const selectingForRef = useRef(selectingFor)
  useEffect(() => { selectingForRef.current = selectingFor }, [selectingFor])

  useEffect(() => { checkApiHealth().then(setApiOnline) }, [])

  const geocodeSrc = useCallback(async () => {
    if (!sourceText.trim()) return
    setGeocoding('source'); setError(null)
    try {
      const loc = await geocodeAddress(sourceText)
      setSource({ lat: loc.lat, lng: loc.lng })
      setSourceText(loc.label.split(',').slice(0, 2).join(', '))
    } catch (e) { setError(e.message) }
    finally { setGeocoding(null) }
  }, [sourceText])

  const geocodeDst = useCallback(async () => {
    if (!destText.trim()) return
    setGeocoding('dest'); setError(null)
    try {
      const loc = await geocodeAddress(destText)
      setDest({ lat: loc.lat, lng: loc.lng })
      setDestText(loc.label.split(',').slice(0, 2).join(', '))
    } catch (e) { setError(e.message) }
    finally { setGeocoding(null) }
  }, [destText])

  const handleMapClick = useCallback(async (lat, lng) => {
    const current = selectingForRef.current
    if (!current) return
    setSelectingFor(null)
    const label = await reverseGeocode(lat, lng)
    if (current === 'source') {
      setSource({ lat, lng }); setSourceText(label)
    } else {
      setDest({ lat, lng }); setDestText(label)
    }
  }, [])

  const applyPreset = useCallback((preset) => {
    setPresetId(preset.id)
    setMileageState(preset.mileage)
    setIdleRateState(preset.idle)
  }, [])

  const setMileage  = useCallback((v) => { setMileageState(v);  setPresetId(null) }, [])
  const setIdleRate = useCallback((v) => { setIdleRateState(v); setPresetId(null) }, [])

  const submitRoute = useCallback(async () => {
    if (!source || !dest) { setError('Please set both source and destination.'); return }
    setError(null); setLoading(true); setRouteData(null)
    try {
      const data = await fetchBothRoutes({
        source,
        destination: dest,
        vehicle: { mileage, idle_consumption: idleRate },
      })
      setRouteData(data)
      setActiveMode('fuel')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [source, dest, mileage, idleRate])

  return {
    sourceText, setSourceText,
    destText,   setDestText,
    source,     dest,
    selectingFor, setSelectingFor,
    geocodeSrc, geocodeDst,
    handleMapClick, geocoding,
    presetId,
    mileage,  setMileage,
    idleRate, setIdleRate,
    applyPreset,
    routeData, setRouteData,   // ← exposed for close button
    activeMode, setActiveMode,
    loading, error, apiOnline,
    canSubmit: !!source && !!dest && !loading,
    submitRoute,
  }
}