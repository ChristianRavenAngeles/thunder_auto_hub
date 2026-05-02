export function normalizeServiceArea(area = {}) {
  const travelFee = Number(area.travel_fee || 0)
  const distanceKm = Number(area.distance_km || 0)

  return {
    ...area,
    travel_fee: Number.isFinite(travelFee) ? travelFee : 0,
    distance_km: Number.isFinite(distanceKm) ? distanceKm : 0,
  }
}

export function findServiceAreaMatch(serviceAreas = [], barangay = '', city = '') {
  const normalizedBarangay = String(barangay || '').trim().toLowerCase()
  const normalizedCity = String(city || '').trim().toLowerCase()
  if (!normalizedCity) return null

  const areas = serviceAreas.map(normalizeServiceArea)
  const exactMatch = normalizedBarangay
    ? areas.find(area =>
        String(area.barangay || '').trim().toLowerCase() === normalizedBarangay &&
        String(area.city || '').trim().toLowerCase() === normalizedCity
      )
    : null

  if (exactMatch) return exactMatch

  return areas.find(area => String(area.city || '').trim().toLowerCase() === normalizedCity) || null
}

export function getTravelFeeForLocation({
  serviceAreas = [],
  barangay = '',
  city = '',
  hasTravelFee = false,
}) {
  const area = findServiceAreaMatch(serviceAreas, barangay, city)
  if (!area || area.is_serviceable === false) {
    return {
      area,
      travelFee: null,
      serviceable: false,
    }
  }

  return {
    area,
    travelFee: hasTravelFee ? Number(area.travel_fee || 0) : 0,
    serviceable: true,
  }
}

export function formatTravelFeeLabel(amount) {
  const value = Number(amount || 0)
  return value > 0 ? `PHP ${value.toLocaleString()}` : 'FREE'
}

export function formatDistanceLabel(distanceKm) {
  const value = Number(distanceKm || 0)
  return `${value.toLocaleString()} km`
}
