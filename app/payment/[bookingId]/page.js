'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const DEPOSIT      = 100
const GCASH_NUMBER = '0976 082 9432'
const GCASH_NAME   = 'Thunder Auto Hub'
const BANK_NAME    = 'BDO'
const BANK_ACCOUNT = '1234 5678 9012'
const BANK_HOLDER  = 'Thunder Auto Hub'

const PAYMENT_METHODS = [
  {
    id: 'gcash',
    label: 'GCash',
    icon: '📱',
    description: 'Send via GCash mobile wallet',
    color: '#007AFF',
  },
  {
    id: 'qrph',
    label: 'QR Ph',
    icon: '⬛',
    description: 'Scan QR code with any banking app',
    color: '#22C55E',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    icon: '🏦',
    description: 'Online banking or over-the-counter',
    color: '#A78BFA',
  },
  {
    id: 'maya',
    label: 'Maya',
    icon: '💳',
    description: 'Send via Maya (PayMaya)',
    color: '#FFD200',
  },
]

function Arrow({ size = 18, dir = 'right' }) {
  const paths = { right: 'M5 12h14M12 5l7 7-7 7', left: 'M19 12H5M12 5l-7 7 7 7' }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d={paths[dir]} />
    </svg>
  )
}

function CopyButton({ text, label = 'COPY' }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button type="button" onClick={copy} style={{
      padding: '6px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap',
      border: `1px solid ${copied ? 'rgba(34,197,94,.4)' : 'rgba(255,255,255,.15)'}`,
      background: copied ? 'rgba(34,197,94,.1)' : 'rgba(255,255,255,.06)',
      color: copied ? '#22C55E' : '#CFCFCF',
      fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
    }}>
      {copied ? '✓ COPIED' : label}
    </button>
  )
}

function GCashInstructions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, padding: 18 }}>
        <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: '#777', marginBottom: 10 }}>GCASH DETAILS</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#FFD200', letterSpacing: '.04em' }}>{GCASH_NUMBER}</div>
            <div style={{ fontSize: 12, color: '#CFCFCF', marginTop: 2 }}>{GCASH_NAME}</div>
          </div>
          <CopyButton text={GCASH_NUMBER} />
        </div>
      </div>
      <ol style={{ margin: 0, paddingLeft: 20, color: '#CFCFCF', fontSize: 13, lineHeight: 2.2 }}>
        <li>Buksan ang GCash app → <strong style={{ color: '#FFF' }}>Send Money</strong></li>
        <li>I-enter ang number: <strong style={{ color: '#FFD200' }}>{GCASH_NUMBER}</strong></li>
        <li>Ipadala ang <strong style={{ color: '#FFD200' }}>₱{DEPOSIT}</strong></li>
        <li>I-screenshot ang confirmation at i-upload sa ibaba</li>
      </ol>
    </div>
  )
}

function QRPhInstructions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, padding: 18, textAlign: 'center' }}>
        {/* Placeholder QR — replace src with real QR image */}
        <div style={{ width: 160, height: 160, background: '#1A1A1A', border: '2px dashed #3A3A3A', borderRadius: 12, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 11, fontFamily: 'var(--font-cond)', letterSpacing: '.08em' }}>
          QR CODE<br />COMING SOON
        </div>
        <div style={{ fontSize: 12, color: '#CFCFCF' }}>Scan using BPI, BDO, UnionBank, or any QR Ph-compatible app</div>
      </div>
      <p style={{ fontSize: 13, color: '#CFCFCF', lineHeight: 1.8, margin: 0 }}>
        I-screenshot ang payment confirmation at i-upload sa ibaba para ma-verify ng aming team.
      </p>
    </div>
  )
}

function BankInstructions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, padding: 18 }}>
        <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: '#777', marginBottom: 12 }}>BANK DETAILS</div>
        {[
          { label: 'Bank', value: BANK_NAME },
          { label: 'Account Name', value: BANK_HOLDER },
          { label: 'Account Number', value: BANK_ACCOUNT },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#777', fontFamily: 'var(--font-cond)', letterSpacing: '.1em' }}>{row.label.toUpperCase()}</div>
              <div style={{ fontFamily: row.label === 'Account Number' ? 'var(--font-display)' : 'var(--font-cond)', fontSize: row.label === 'Account Number' ? 20 : 14, color: '#FFF', fontWeight: 700, marginTop: 2 }}>{row.value}</div>
            </div>
            {row.label === 'Account Number' && <CopyButton text={row.value} />}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: '#CFCFCF', lineHeight: 1.8, margin: 0 }}>
        Mag-transfer ng <strong style={{ color: '#FFD200' }}>₱{DEPOSIT}</strong> at i-screenshot ang confirmation. I-upload ang proof of payment sa ibaba.
      </p>
    </div>
  )
}

function MayaInstructions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, padding: 18 }}>
        <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: '#777', marginBottom: 10 }}>MAYA DETAILS</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#FFD200', letterSpacing: '.04em' }}>{GCASH_NUMBER}</div>
            <div style={{ fontSize: 12, color: '#CFCFCF', marginTop: 2 }}>{GCASH_NAME}</div>
          </div>
          <CopyButton text={GCASH_NUMBER} />
        </div>
      </div>
      <ol style={{ margin: 0, paddingLeft: 20, color: '#CFCFCF', fontSize: 13, lineHeight: 2.2 }}>
        <li>Buksan ang Maya app → <strong style={{ color: '#FFF' }}>Send Money</strong></li>
        <li>I-enter ang number: <strong style={{ color: '#FFD200' }}>{GCASH_NUMBER}</strong></li>
        <li>Ipadala ang <strong style={{ color: '#FFD200' }}>₱{DEPOSIT}</strong></li>
        <li>I-screenshot ang confirmation at i-upload sa ibaba</li>
      </ol>
    </div>
  )
}

const METHOD_INSTRUCTIONS = {
  gcash: <GCashInstructions />,
  qrph: <QRPhInstructions />,
  bank_transfer: <BankInstructions />,
  maya: <MayaInstructions />,
}

export default function PaymentPage() {
  const { bookingId } = useParams()
  const router        = useRouter()

  const [booking,        setBooking]        = useState(null)
  const [loadingBooking, setLoadingBooking] = useState(true)
  const [method,         setMethod]         = useState('gcash')
  const [phone,          setPhone]          = useState('')
  const [screenshot,     setScreenshot]     = useState('')
  const [uploading,      setUploading]      = useState(false)
  const [submitting,     setSubmitting]     = useState(false)
  const [done,           setDone]           = useState(false)
  const [error,          setError]          = useState('')
  const [uploadError,    setUploadError]    = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (!bookingId) return
    const supabase = createClient()
    supabase
      .from('bookings')
      .select('id, reference_no, total_price, deposit_amount, scheduled_date, scheduled_time, payment_status, profiles(full_name, phone), vehicles(make, model)')
      .eq('id', bookingId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBooking(data)
          if (data.profiles?.phone) setPhone(data.profiles.phone)
          if (data.payment_status === 'paid') setDone(true)
        }
        setLoadingBooking(false)
      })
  }, [bookingId])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('bucket', 'deposits')
      const res  = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed.')
      setScreenshot(data.url)
    } catch (err) {
      setUploadError(err.message)
    }
    setUploading(false)
  }

  async function handleSubmit() {
    setError('')
    if (!phone.trim()) { setError('Ilagay ang inyong mobile number na ginamit sa pagbabayad.'); return }
    if (!screenshot)   { setError('I-upload muna ang screenshot ng payment confirmation.'); return }
    setSubmitting(true)
    try {
      const res  = await fetch('/api/bookings/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, phone: phone.trim(), screenshot_url: screenshot, method }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed.')
      setDone(true)
    } catch (err) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  const depositAmount = booking?.deposit_amount || DEPOSIT
  const fmtDate = booking?.scheduled_date
    ? new Date(booking.scheduled_date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  const s = {
    page:  { minHeight: '100vh', background: '#0B0B0B', backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,.012) 2px,rgba(255,255,255,.012) 4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 16px 60px' },
    card:  { width: '100%', maxWidth: 580, background: '#141414', border: '1px solid #2A2A2A', borderRadius: 20, padding: 'clamp(24px,6vw,44px)', boxShadow: '0 24px 80px rgba(0,0,0,.6)' },
    label: { fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: '#777', marginBottom: 6, display: 'block' },
    input: { width: '100%', height: 52, background: '#1A1A1A', border: '1.5px solid #3A3A3A', borderRadius: 10, color: '#FFF', padding: '0 16px', fontSize: 15, fontFamily: 'var(--font-barlow)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' },
  }

  if (loadingBooking) return (
    <div style={{ ...s.page, alignItems: 'center' }}>
      <div style={{ color: '#555', fontFamily: 'var(--font-cond)', letterSpacing: '.1em', fontSize: 13 }}>Loading…</div>
    </div>
  )

  if (!booking) return (
    <div style={{ ...s.page, alignItems: 'center' }}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', color: '#F87171', fontFamily: 'var(--font-cond)', letterSpacing: '.08em' }}>Booking not found.</div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ color: '#FFD200', fontFamily: 'var(--font-cond)', fontSize: 13 }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div style={{ ...s.page, alignItems: 'center' }}>
      <style>{`@keyframes pay-pop { from { opacity:0; transform:scale(.93) } to { opacity:1; transform:none } }`}</style>
      <div style={{ ...s.card, textAlign: 'center', animation: 'pay-pop .5s ease both' }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(34,197,94,.1)', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 48px rgba(34,197,94,.15)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1, color: '#FFF', marginBottom: 12 }}>SUBMITTED!</h2>
        <p style={{ fontSize: 14, color: '#CFCFCF', lineHeight: 1.8, maxWidth: 380, margin: '0 auto 28px' }}>
          Natanggap na namin ang inyong proof of payment. Ive-verify namin at mag-co-confirm sa inyo shortly.
        </p>
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, color: '#777', letterSpacing: '.14em', marginBottom: 4 }}>BOOKING REFERENCE</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#FFD200', letterSpacing: '.08em' }}>{booking.reference_no}</div>
          {booking.vehicles && (
            <div style={{ fontSize: 13, color: '#CFCFCF', marginTop: 6 }}>
              {booking.vehicles.make} {booking.vehicles.model}{fmtDate ? ` · ${fmtDate}` : ''}
            </div>
          )}
        </div>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFD200', color: '#0B0B0B', fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: '.1em', padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}>
          View My Bookings <Arrow size={16} />
        </Link>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <style>{`@keyframes pay-pop { from { opacity:0; transform:scale(.93) } to { opacity:1; transform:none } } @keyframes slide-in { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }`}</style>
      <div style={{ ...s.card, animation: 'pay-pop .4s ease both' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,210,0,.25)', borderRadius: 40, padding: '4px 14px', marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD200', boxShadow: '0 0 8px #FFD200' }} />
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, letterSpacing: '.2em', color: '#FFD200' }}>DEPOSIT PAYMENT</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,7vw,52px)', lineHeight: .95, color: '#FFF', marginBottom: 8 }}>
            PAY<br /><span style={{ color: '#FFD200' }}>DEPOSIT</span>
          </h1>
          <p style={{ fontSize: 13, color: '#777', lineHeight: 1.7 }}>
            Mag-bayad ng ₱{depositAmount} deposit para ma-secure ang inyong booking slot.
          </p>
        </div>

        {/* Booking summary */}
        <div style={{ background: 'rgba(255,210,0,.04)', border: '1px solid rgba(255,210,0,.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, color: '#777', letterSpacing: '.12em', marginBottom: 4 }}>BOOKING</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#FFD200', letterSpacing: '.06em' }}>{booking.reference_no}</div>
            {booking.vehicles && <div style={{ fontSize: 12, color: '#CFCFCF', marginTop: 2 }}>{booking.vehicles.make} {booking.vehicles.model}</div>}
            {fmtDate && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{fmtDate}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, color: '#777', letterSpacing: '.12em', marginBottom: 4 }}>DEPOSIT DUE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: '#FFD200', lineHeight: 1 }}>₱{depositAmount}</div>
          </div>
        </div>

        {/* Step 1 — choose payment method */}
        <div style={{ marginBottom: 24 }}>
          <label style={s.label}>STEP 1 — CHOOSE PAYMENT METHOD</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {PAYMENT_METHODS.map(pm => {
              const active = method === pm.id
              return (
                <button key={pm.id} type="button" onClick={() => setMethod(pm.id)} style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                  border: `1.5px solid ${active ? pm.color : '#2A2A2A'}`,
                  background: active ? `${pm.color}12` : '#1A1A1A',
                  boxShadow: active ? `0 0 20px ${pm.color}20` : 'none',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{pm.icon}</div>
                  <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 14, letterSpacing: '.04em', color: active ? '#FFF' : '#CFCFCF', marginBottom: 2 }}>{pm.label}</div>
                  <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{pm.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2 — payment instructions */}
        <div style={{ marginBottom: 24 }}>
          <label style={s.label}>STEP 2 — SEND PAYMENT</label>
          <div style={{ animation: 'slide-in .25s ease both' }} key={method}>
            {METHOD_INSTRUCTIONS[method]}
          </div>
        </div>

        {/* Step 3 — upload proof */}
        <div style={{ marginBottom: 24 }}>
          <label style={s.label}>STEP 3 — UPLOAD PROOF OF PAYMENT</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Phone number */}
            <div>
              <label style={{ ...s.label, marginBottom: 8 }}>
                {method === 'bank_transfer' ? 'SENDER NAME / REFERENCE NUMBER' : 'MOBILE NUMBER NA GINAMIT'} <span style={{ color: '#F87171' }}>*</span>
              </label>
              <input
                style={s.input}
                type={method === 'bank_transfer' ? 'text' : 'tel'}
                placeholder={method === 'bank_transfer' ? 'Reference number o pangalan ng sender...' : '09XX XXX XXXX'}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'rgba(255,210,0,.5)'}
                onBlur={e => e.target.style.borderColor = '#3A3A3A'}
              />
            </div>

            {/* Screenshot upload */}
            <div>
              <label style={{ ...s.label, marginBottom: 8 }}>SCREENSHOT NG PAYMENT CONFIRMATION <span style={{ color: '#F87171' }}>*</span></label>
              {screenshot ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 10 }}>
                  <img src={screenshot} alt="Payment proof" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #3A3A3A', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 13, color: '#22C55E', letterSpacing: '.06em' }}>✓ Screenshot uploaded</div>
                    <button type="button" onClick={() => { setScreenshot(''); if (fileRef.current) fileRef.current.value = '' }} style={{ fontSize: 11, color: '#F87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4, fontFamily: 'var(--font-cond)' }}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: `2px dashed ${uploadError ? '#F87171' : '#2A2A2A'}`, borderRadius: 10,
                  padding: '28px 0', cursor: uploading ? 'not-allowed' : 'pointer',
                  color: '#555', fontSize: 13, fontFamily: 'var(--font-cond)', letterSpacing: '.06em',
                  transition: 'border-color .15s, color .15s',
                }}
                  onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = '#FFD200'; e.currentTarget.style.color = '#FFD200' } }}
                  onMouseLeave={e => { if (!uploading) { e.currentTarget.style.borderColor = uploadError ? '#F87171' : '#2A2A2A'; e.currentTarget.style.color = '#555' } }}
                >
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} disabled={uploading} />
                  {uploading ? (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                      Nag-u-upload…
                    </>
                  ) : (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      I-upload ang Screenshot
                    </>
                  )}
                </label>
              )}
              {uploadError && <p style={{ fontSize: 12, color: '#F87171', marginTop: 6 }}>{uploadError}</p>}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 10, color: '#F87171', fontSize: 13, fontFamily: 'var(--font-cond)', letterSpacing: '.04em', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button type="button" onClick={handleSubmit} disabled={submitting} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: submitting ? '#2A2A2A' : '#FFD200', color: submitting ? '#555' : '#0B0B0B',
          border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '.1em',
          padding: '18px 0', borderRadius: 10,
          boxShadow: submitting ? 'none' : '0 0 32px rgba(255,210,0,.2)',
          transition: 'background .15s',
        }}>
          {submitting ? 'Nagpapadala…' : <> CONFIRM PAYMENT <Arrow size={16} /></>}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#444', lineHeight: 1.6, marginTop: 14 }}>
          Ang inyong booking ay iko-confirm pagkatapos ma-verify ng aming team ang inyong payment.
        </p>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link href="/account" style={{ fontSize: 12, color: '#555', fontFamily: 'var(--font-cond)', letterSpacing: '.08em', textDecoration: 'none' }}>
            ← Back to My Account
          </Link>
        </div>
      </div>
    </div>
  )
}
