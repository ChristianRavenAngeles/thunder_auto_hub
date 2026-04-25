// Semaphore SMS wrapper — add SEMAPHORE_API_KEY to .env.local to activate

const SEMAPHORE_API = 'https://api.semaphore.co/api/v4/messages'
const SENDER = process.env.SEMAPHORE_SENDER_NAME || 'THUNDER'

export async function sendSMS(to, message) {
  const key = process.env.SEMAPHORE_API_KEY
  if (!key) {
    console.warn('[SMS] SEMAPHORE_API_KEY not set — skipping SMS to', to)
    return { ok: false, reason: 'no_api_key' }
  }

  const phone = normalizePhone(to)
  const res = await fetch(SEMAPHORE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: key, number: phone, message, sendername: SENDER }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[SMS] Failed:', body)
    return { ok: false, reason: body }
  }

  return { ok: true }
}

export function normalizePhone(phone) {
  let p = phone.replace(/\D/g, '')
  if (p.startsWith('0')) p = '63' + p.slice(1)
  if (!p.startsWith('63')) p = '63' + p
  return p
}

export function fillTemplate(template, vars = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

// Named SMS senders used across the app
export async function sendBookingConfirmation(phone, { refNo, date, time }) {
  const msg = `Kumusta! Naconfirm na ang inyong booking sa Thunder Auto Hub.\nReference: ${refNo}\nDate: ${date} ${time}\nSalamat po! 🚗✨`
  return sendSMS(phone, msg)
}

export async function sendRiderAssigned(phone, { riderName, refNo }) {
  const msg = `Assigned na ang inyong rider na si ${riderName} para sa booking ${refNo}. Abangan po siya! 🚚`
  return sendSMS(phone, msg)
}

export async function sendRiderOnTheWay(phone, { riderName, etaMinutes }) {
  const eta = etaMinutes ? ` ETA: ${etaMinutes} minuto.` : ''
  const msg = `Papunta na po ang inyong rider na si ${riderName}.${eta} 🚗`
  return sendSMS(phone, msg)
}

export async function sendServiceCompleted(phone, { refNo, reviewLink }) {
  const msg = `Tapos na po ang inyong sasakyan! Salamat sa pagpili ng Thunder Auto Hub. 🙏\nI-rate ang inyong experience: ${reviewLink}\nRef: ${refNo}`
  return sendSMS(phone, msg)
}

export async function sendPaymentConfirmed(phone, { amount, refNo }) {
  const msg = `Natanggap na po namin ang inyong payment na ₱${amount}. Ref: ${refNo}. Salamat! ✅`
  return sendSMS(phone, msg)
}

export async function sendReminder(phone, { refNo, date, time }) {
  const msg = `Reminder: Bukas po ang inyong appointment sa Thunder Auto Hub.\nDate: ${date} ${time}\nRef: ${refNo}\nAbangan po ang aming team! 🚿`
  return sendSMS(phone, msg)
}

export async function sendOTP(phone, otp) {
  const msg = `Your Thunder Auto Hub verification code is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`
  return sendSMS(phone, msg)
}
