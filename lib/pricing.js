// Smart Pricing Engine — Thunder Auto Hub

export const VEHICLE_TIERS = {
  S:  { label: 'Small',       description: 'Subcompact sedan / hatchback' },
  M:  { label: 'Medium',      description: 'Compact sedan / small SUV / MPV' },
  L:  { label: 'Large',       description: 'Mid-size SUV / pickup truck' },
  XL: { label: 'Extra Large', description: 'Full-size SUV / van' },
}

// Vehicle model → tier mapping (expandable)
const MODEL_TIER_MAP = {
  // Small
  'toyota wigo': 'S', 'honda brio': 'S', 'suzuki celerio': 'S', 'mitsubishi mirage': 'S',
  'toyota yaris': 'S', 'honda jazz': 'S', 'suzuki swift': 'S', 'kia picanto': 'S',
  'hyundai eon': 'S', 'nissan almera': 'S',
  // Medium
  'toyota vios': 'M', 'honda city': 'M', 'toyota altis': 'M', 'honda civic': 'M',
  'toyota raize': 'M', 'toyota veloz': 'M', 'mitsubishi xpander': 'M', 'toyota avanza': 'M',
  'honda mobilio': 'M', 'nissan terra': 'M', 'suzuki ertiga': 'M', 'toyota rush': 'M',
  'hyundai accent': 'M', 'ford ecosport': 'M', 'kia sonet': 'M',
  // Large
  'toyota hilux': 'L', 'toyota conquest': 'L', 'mitsubishi triton': 'L', 'ford ranger': 'L',
  'isuzu dmax': 'L', 'toyota fortuner': 'L', 'mitsubishi montero sport': 'L',
  'honda cr-v': 'L', 'mazda cx-5': 'L', 'hyundai tucson': 'L', 'kia sportage': 'L',
  'nissan navara': 'L', 'chevrolet trailblazer': 'L',
  // XL
  'toyota land cruiser': 'XL', 'ford expedition': 'XL', 'chevrolet suburban': 'XL',
  'toyota alphard': 'XL', 'toyota hiace': 'XL', 'mitsubishi pajero': 'XL',
  'nissan patrol': 'XL', 'isuzu crosswind': 'XL', 'toyota previa': 'XL',
}

export function detectTierFromModel(model = '') {
  const key = model.toLowerCase().trim()
  for (const [pattern, tier] of Object.entries(MODEL_TIER_MAP)) {
    if (key.includes(pattern)) return tier
  }
  return null
}

export function getPriceForTier(service, tier) {
  const map = { S: service.price_s, M: service.price_m, L: service.price_l, XL: service.price_xl }
  return map[tier] ?? 0
}

export function computePrice({ services = [], tier, travelFee = 0, promoDiscount = 0 }) {
  const subtotal = services.reduce((sum, svc) => sum + getPriceForTier(svc, tier), 0)
  const discount = Math.min(promoDiscount, subtotal)
  const total = subtotal - discount + travelFee
  return { subtotal, discount, travelFee, total }
}

export function computePackagePrice({ items = [], tier, travelFee = 0, promoDiscount = 0 }) {
  // items: [{ service, quantity }]
  const subtotal = items.reduce((sum, { service, quantity = 1 }) =>
    sum + getPriceForTier(service, tier) * quantity, 0)
  const discount = Math.min(promoDiscount, subtotal)
  const total = subtotal - discount + travelFee
  return { subtotal, discount, travelFee, total }
}

export function applyPromo(promo, subtotal, serviceIds = []) {
  if (!promo || !promo.is_active) return 0
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return 0
  if (promo.min_amount && subtotal < promo.min_amount) return 0

  // Check if promo is restricted to specific services
  if (promo.service_ids?.length > 0) {
    const hasMatch = serviceIds.some(id => promo.service_ids.includes(id))
    if (!hasMatch) return 0
  }

  if (promo.discount_type === 'percentage') {
    return Math.round((subtotal * promo.discount_value) / 100)
  }
  return Math.min(promo.discount_value, subtotal)
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getLoyaltyPointsEarned(totalAmount, rate = 1) {
  return Math.floor(totalAmount * rate)
}

export function getPointsDiscount(points, rate = 100) {
  return Math.floor(points / rate)
}
