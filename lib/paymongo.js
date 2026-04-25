// PayMongo integration — set PAYMONGO_SECRET_KEY in .env to activate

const BASE = 'https://api.paymongo.com/v1'

function headers() {
  const key = process.env.PAYMONGO_SECRET_KEY
  if (!key) throw new Error('PAYMONGO_SECRET_KEY not set')
  return {
    'Content-Type': 'application/json',
    Authorization: 'Basic ' + Buffer.from(key + ':').toString('base64'),
  }
}

export async function createPaymentLink({ amount, description, refNo }) {
  const res = await fetch(`${BASE}/links`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // in centavos
          description,
          remarks: refNo,
        },
      },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.detail ?? 'PayMongo error')
  return data.data
}

export async function createPaymentIntent({ amount, currency = 'PHP', description }) {
  const res = await fetch(`${BASE}/payment_intents`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          payment_method_allowed: ['gcash', 'paymaya', 'card', 'grab_pay'],
          payment_method_options: { card: { request_three_d_secure: 'any' } },
          currency,
          description,
        },
      },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.detail ?? 'PayMongo error')
  return data.data
}

export async function retrievePaymentIntent(id) {
  const res = await fetch(`${BASE}/payment_intents/${id}`, { headers: headers() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.detail ?? 'PayMongo error')
  return data.data
}

export function verifyWebhookSignature(payload, sigHeader, secret) {
  const crypto = require('crypto')
  const [timestamp, sig] = sigHeader.split(',').map(s => s.split('=')[1])
  const computed = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  return computed === sig
}
