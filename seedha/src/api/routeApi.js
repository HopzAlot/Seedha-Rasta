import axios from 'axios'

// This will use the Render Environment Variable if it exists, 
// otherwise it falls back to '/api' for your local Vite proxy.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
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

// ... rest of your geocoding functions stay the same ...