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
  const [locating,     setLocating]     = useState(null) // 'source' | 'dest' | null
  const [error,        setError]        = useState(null)
  const [apiOnline,    setApiOnline]    = useState(null)

  const selectingForRef = useRef(selectingFor)
  useEffect(() => { selectingForRef.current = selectingFor }, [selectingFor])

  useEffect(() => { checkApiHealth().then(setApiOnline) }, [])

  // ── Text geocoding ────────────────────────────────────
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

  // ── Live GPS location ─────────────────────────────────
  const fetchLiveLocation = useCallback((target) => {
    // target = 'source' | 'destination'
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    setLocating(target)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const label = await reverseGeocode(lat, lng)
          if (target === 'source') {
            setSource({ lat, lng })
            setSourceText(label)
          } else {
            setDest({ lat, lng })
            setDestText(label)
          }
        } catch {
          // Even if reverse geocode fails, still set the coordinates
          const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          if (target === 'source') {
            setSource({ lat, lng })
            setSourceText(fallback)
          } else {
            setDest({ lat, lng })
            setDestText(fallback)
          }
        } finally {
          setLocating(null)
        }
      },
      (err) => {
        setLocating(null)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please allow access in your browser settings.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Location unavailable. Check your device GPS.')
            break
          case err.TIMEOUT:
            setError('Location request timed out. Try again.')
            break
          default:
            setError('Could not get your location.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout:            10000,
        maximumAge:         30000,
      }
    )
  }, [])

  // ── Map click ─────────────────────────────────────────
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

  // ── Vehicle ───────────────────────────────────────────
  const applyPreset = useCallback((preset) => {
    setPresetId(preset.id)
    setMileageState(preset.mileage)
    setIdleRateState(preset.idle)
  }, [])

  const setMileage  = useCallback((v) => { setMileageState(v);  setPresetId(null) }, [])
  const setIdleRate = useCallback((v) => { setIdleRateState(v); setPresetId(null) }, [])

  // ── Submit ────────────────────────────────────────────
  const submitRoute = useCallback(async () => {
    if (!source || !dest) {
      setError('Please set both source and destination.')
      return
    }
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
    fetchLiveLocation,    // ← new
    locating,             // ← new — which field is currently locating
    handleMapClick, geocoding,
    presetId,
    mileage,  setMileage,
    idleRate, setIdleRate,
    applyPreset,
    routeData, setRouteData,
    activeMode, setActiveMode,
    loading, error, apiOnline,
    canSubmit: !!source && !!dest && !loading,
    submitRoute,
  }
}