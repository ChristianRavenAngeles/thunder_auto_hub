function normalize(value) {
  return String(value || '').toLowerCase()
}

export function inferRecommendedService(services = []) {
  const names = services.map(service => normalize(service.service_name || service.name))
  const categories = services.map(service => normalize(service.category))

  if (names.some(name => name.includes('ceramic') || name.includes('graphene')) || categories.includes('coating')) {
    return {
      slug: 'car-care-deluxe',
      title: 'Coating maintenance',
      description: 'Keep your protective coating performing at its best with a maintenance visit.',
    }
  }

  if (names.some(name => name.includes('detail')) || categories.includes('detailing')) {
    return {
      slug: 'premium-wash',
      title: 'Premium wash refresh',
      description: 'A lighter refresh is a good follow-up after a major detailing service.',
    }
  }

  return {
    slug: 'interior-detailing',
    title: 'Interior detailing',
    description: 'A deeper interior service is a strong next step after routine wash visits.',
  }
}
