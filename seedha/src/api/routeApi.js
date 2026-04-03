import axios from 'axios'

// This will use the Render Environment Variable if it exists, 
// otherwise it falls back to '/api' for your local Vite proxy.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  // If VITE_API_URL is "https://seedha-rasta-backend.onrender.com", 
  // baseURL becomes "https://seedha-rasta-backend.onrender.com/api"
  baseURL: `${API_BASE_URL}/api`, 
  headers: { 'Content-Type': 'application/json' },
  timeout: 500000,
})

export async function fetchBothRoutes({ source, destination, vehicle }) {
  try {
    const { data } = await client.post('/route/optimize/', {
      start: {
        lat: source.lat,
        lng: source.lng,
      },
      end: {
        lat: destination.lat,
        lng: destination.lng,
      },
      vehicle: {
        mileage:          vehicle.mileage,
        idle_consumption: vehicle.idle_consumption,
      },
    })
    return data
  } catch (err) {
    const detail =
      err.response?.data?.detail ||
      err.response?.data?.non_field_errors?.[0] ||
      JSON.stringify(err.response?.data) ||
      err.message
    throw new Error(detail)
  }
}


export async function geocodeAddress(query) {
  const res = await axios.get(
    'https://nominatim.openstreetmap.org/search',
    {
      params:  { format: 'json', q: query, limit: 1 },
      headers: { 'Accept-Language': 'en' },
    }
  )
  if (!res.data.length) throw new Error('Location not found')
  const r = res.data[0]
  return {
    lat:   parseFloat(r.lat),
    lng:   parseFloat(r.lon),
    label: r.display_name,
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await axios.get(
      'https://nominatim.openstreetmap.org/reverse',
      {
        params:  { format: 'json', lat, lon: lng },
        headers: { 'Accept-Language': 'en' },
      }
    )
    return (res.data.display_name || '').split(',').slice(0, 2).join(', ')
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

export async function checkApiHealth() {
  try {
    await client.options('/route/optimize/')
    return true
  } catch {
    return false
  }
}