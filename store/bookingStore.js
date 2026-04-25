import { create } from 'zustand'

export const useBookingStore = create((set, get) => ({
  step: 1,
  // Step 1 — Vehicle
  vehicleId:    null,
  make:         '',
  model:        '',
  tier:         '',
  plate:        '',
  isExisting:   false,
  // Step 2 — Services
  selectedServices: [], // array of service objects
  promoCode:    '',
  promoData:    null,
  usePoints:    false,
  pointsToUse:  0,
  // Step 3 — Schedule & Location
  scheduledDate: '',
  scheduledTime: '',
  barangay:     '',
  city:         '',
  address:      '',
  landmarks:    '',
  travelFee:    0,
  // Step 4 — Payment
  depositMethod: 'gcash',
  depositFile:   null,
  depositPreview: null,
  // Computed
  subtotal:     0,
  discount:     0,
  total:        0,

  setStep: (step) => set({ step }),

  setVehicle: (data) => set({ ...data }),

  setServices: (services) => {
    const { tier, travelFee } = get()
    const subtotal = services.reduce((sum, svc) => {
      const priceKey = `price_${tier.toLowerCase()}`
      return sum + (svc[priceKey] ?? 0)
    }, 0)
    set({ selectedServices: services, subtotal, total: subtotal + travelFee - get().discount })
  },

  setPromo: (promoData, discount) => {
    const { subtotal, travelFee } = get()
    set({ promoData, discount, total: subtotal - discount + travelFee })
  },

  setSchedule: (data) => {
    const { subtotal, discount } = get()
    const travelFee = data.travelFee ?? get().travelFee
    set({ ...data, travelFee, total: subtotal - discount + travelFee })
  },

  setPayment: (data) => set({ ...data }),

  reset: () => set({
    step: 1, vehicleId: null, make: '', model: '', tier: '', plate: '',
    isExisting: false, selectedServices: [], promoCode: '', promoData: null,
    usePoints: false, pointsToUse: 0, scheduledDate: '', scheduledTime: '',
    barangay: '', city: '', address: '', landmarks: '', travelFee: 0,
    depositMethod: 'gcash', depositFile: null, depositPreview: null,
    subtotal: 0, discount: 0, total: 0,
  }),
}))
