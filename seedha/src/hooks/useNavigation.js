import { useState, useEffect, useRef, useCallback } from 'react'

const EARTH_R = 6371000 // metres

function toRad(deg) { return (deg * Math.PI) / 180 }

/** Haversine distance in metres between two {lat,lng} points */
export function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
    Math.sin(dLng / 2) ** 2
  return EARTH_R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

/** Find the index of the route point closest to pos */
function nearestIndex(route, pos) {
  let best = 0, bestDist = Infinity
  route.forEach((pt, i) => {
    const d = haversine(pos, pt)
    if (d < bestDist) { bestDist = d; best = i }
  })
  return best
}

/** Bearing in degrees from point a → b */
function bearing(a, b) {
  const dLng = toRad(b.lng - a.lng)
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Convert bearing to compass direction */
function bearingToDir(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

/** Generate simple turn instructions from route points */
function buildInstructions(route) {
  if (!route || route.length < 2) return []
  const instructions = []
  const TURN_THRESHOLD = 25 // degrees change = a turn

  instructions.push({
    index:     0,
    text:      'Start navigation',
    direction: 'straight',
    distance:  0,
  })

  for (let i = 1; i < route.length - 1; i++) {
    const b1 = bearing(route[i - 1], route[i])
    const b2 = bearing(route[i],     route[i + 1])
    let diff = b2 - b1
    if (diff >  180) diff -= 360
    if (diff < -180) diff += 360

    if (Math.abs(diff) >= TURN_THRESHOLD) {
      const dir = diff > 0 ? 'right' : 'left'
      const deg = Math.abs(diff)
      const sharpness = deg > 120 ? 'Sharp ' : deg > 60 ? '' : 'Slight '
      const cap = dir.charAt(0).toUpperCase() + dir.slice(1)

      // Distance from this point to next instruction
      const distToNext = haversine(route[i], route[i + 1])

      instructions.push({
        index:     i,
        text:      `${sharpness}Turn ${cap}`,
        direction: dir,
        compass:   bearingToDir(b2),
        distance:  distToNext,
      })
    }
  }

  instructions.push({
    index:     route.length - 1,
    text:      'Arrive at destination',
    direction: 'destination',
    distance:  0,
  })

  return instructions
}

/** Total route length in metres */
function routeLength(route) {
  let total = 0
  for (let i = 1; i < route.length; i++) {
    total += haversine(route[i - 1], route[i])
  }
  return total
}

/** Remaining distance from index to end */
function remainingDist(route, fromIndex) {
  let total = 0
  for (let i = fromIndex; i < route.length - 1; i++) {
    total += haversine(route[i], route[i + 1])
  }
  return total
}

export function useNavigation(route) {
  const [active,       setActive]       = useState(false)
  const [position,     setPosition]     = useState(null)   // { lat, lng, heading }
  const [nearestIdx,   setNearestIdx]   = useState(0)
  const [instructions, setInstructions] = useState([])
  const [currentStep,  setCurrentStep]  = useState(0)
  const [remainingM,   setRemainingM]   = useState(0)
  const [remainingMin, setRemainingMin] = useState(0)
  const [arrived,      setArrived]      = useState(false)
  const [error,        setError]        = useState(null)

  const watchRef = useRef(null)

  // Build instructions whenever route changes
  useEffect(() => {
    if (!route?.length) return
    setInstructions(buildInstructions(route))
    setRemainingM(routeLength(route))
    setRemainingMin(routeLength(route) / 1000 / 40 * 60) // assume 40 km/h avg
  }, [route])

  const start = useCallback(() => {
    if (!route?.length) return
    setError(null)
    setArrived(false)
    setCurrentStep(0)
    setNearestIdx(0)
    setActive(true)

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser')
      setActive(false)
      return
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, heading } = pos.coords
        const userPos = { lat, lng }
        setPosition({ lat, lng, heading })

        // Find where on the route we are
        const idx = nearestIndex(route, userPos)
        setNearestIdx(idx)

        // Remaining distance & time
        const rem = remainingDist(route, idx)
        setRemainingM(rem)
        setRemainingMin(rem / 1000 / 40 * 60)

        // Check arrival (within 30m of destination)
        const destDist = haversine(userPos, route[route.length - 1])
        if (destDist < 30) {
          setArrived(true)
          stop()
          return
        }

        // Advance instruction step
        setInstructions(prev => {
          const nextStepIdx = prev.findIndex(
            (ins, i) => i > 0 && ins.index > idx
          )
          if (nextStepIdx > 0) {
            setCurrentStep(Math.max(0, nextStepIdx - 1))
          }
          return prev
        })
      },
      (err) => {
        setError(`GPS error: ${err.message}`)
        setActive(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge:         2000,
        timeout:            10000,
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  const stop = useCallback(() => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    setActive(false)
    setPosition(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop])

  const nextInstruction = instructions[currentStep + 1] ?? null
  const currentInstruction = instructions[currentStep] ?? null

  return {
    active, start, stop,
    position,
    nearestIdx,
    currentInstruction,
    nextInstruction,
    instructions,
    currentStep,
    remainingM,
    remainingMin,
    arrived,
    error,
  }
}