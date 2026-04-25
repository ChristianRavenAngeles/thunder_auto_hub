import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOTP, normalizePhone } from '@/lib/sms'

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request) {
  try {
    const { phone } = await request.json()
    if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

    const normalized = normalizePhone(phone)
    const otp = generateOTP()
    const supabase = createAdminClient()

    // Invalidate any existing OTPs for this phone
    await supabase.from('otp_tokens').update({ used: true }).eq('phone', normalized).eq('used', false)

    // Insert new OTP
    const { error } = await supabase.from('otp_tokens').insert({
      phone: normalized,
      token: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    if (error) throw error

    await sendOTP(normalized, otp)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-otp]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
