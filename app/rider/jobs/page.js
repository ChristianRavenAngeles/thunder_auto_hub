'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MapPin, Phone, Check, Clock, Camera, ChevronRight } from 'lucide-react'
import { formatDate, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

const STATUS_FLOW = [
  { key: 'assigned',    label: 'Accept Job',      next: 'on_the_way'   },
  { key: 'on_the_way',  label: 'Start Service',   next: 'in_progress'  },
  { key: 'in_progress', label: 'Mark Complete',   next: 'completed'    },
]

export default function RiderJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [eta, setEta]         = useState('')
  const [photos, setPhotos]   = useState({ before: [], after: [] })
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId]   = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
      loadJobs(data.user?.id)
    })
  }, [])

  async function loadJobs(uid) {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles(full_name, phone), vehicles(make, model, tier, plate), booking_services(service_name, services(inclusions))')
      .eq('rider_id', uid || userId)
      .in('status', ['assigned', 'on_the_way', 'in_progress', 'completed'])
      .order('scheduled_date', { ascending: false })
    setJobs(data || [])
    setLoading(false)
  }

  async function advanceStatus(job) {
    const flow = STATUS_FLOW.find(s => s.key === job.status)
    if (!flow) return
    const updates = { status: flow.next, updated_at: new Date().toISOString() }
    if (flow.next === 'on_the_way' && eta) updates.eta_minutes = parseInt(eta)

    await supabase.from('bookings').update(updates).eq('id', job.id)

    // Notify customer
    const msg = {
      on_the_way:  { title: 'Rider On the Way!', body: `${eta ? `ETA: ${eta} minutes. ` : ''}Papunta na ang inyong rider.` },
      in_progress: { title: 'Service Started!',  body: 'Nagsimula na ang inyong sasakyan. Stay tuned!' },
      completed:   { title: 'Service Complete!', body: 'Tapos na po! Salamat sa pagpili ng Thunder Auto Hub. 🙏' },
    }[flow.next]
    if (msg) {
      await supabase.from('notifications').insert({ user_id: job.user_id, type: 'service_started', channel: 'in_app', ...msg, data: { booking_id: job.id } })
    }

    // Update rider stats
    if (flow.next === 'completed') {
      await supabase.from('staff').update({ jobs_completed: supabase.rpc('increment', { row_id: userId }) }).eq('user_id', userId)
    }

    toast.success(`Status updated to ${flow.next.replace(/_/g, ' ')}!`)
    setSelected(null)
    loadJobs()
  }

  const { getRootProps: getBefore, getInputProps: getBeforeInput } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: files => setPhotos(p => ({ ...p, before: [...p.before, ...files] })),
  })
  const { getRootProps: getAfter, getInputProps: getAfterInput } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: files => setPhotos(p => ({ ...p, after: [...p.after, ...files] })),
  })

  async function uploadPhotos(job) {
    setUploading(true)
    try {
      for (const [type, files] of Object.entries(photos)) {
        for (const file of files) {
          const ext = file.name.split('.').pop()
          const path = `job-photos/${job.id}/${type}-${Date.now()}.${ext}`
          await supabase.storage.from('photos').upload(path, file)
          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
          await supabase.from('photos').insert({
            booking_id:  job.id,
            type,
            url:         urlData.publicUrl,
            uploaded_by: userId,
            is_public:   true,
          })
        }
      }
      toast.success('Photos uploaded!')
      setPhotos({ before: [], after: [] })
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="text-center py-10 text-[var(--text-muted)]">Loading jobs…</div>

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold font-display text-thunder-dark">My Jobs</h1>

      {!jobs.length ? (
        <div className="card p-8 text-center">
          <p className="text-[var(--text-muted)]">Wala pang assigned na jobs.</p>
        </div>
      ) : (
        jobs.map(job => (
          <div key={job.id} className="card overflow-hidden">
            {/* Job header */}
            <div
              className="p-4 cursor-pointer flex items-start justify-between gap-3 hover:bg-[var(--bg-2)]"
              onClick={() => setSelected(selected?.id === job.id ? null : job)}
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-brand-600">{job.reference_no}</span>
                  <span className={BOOKING_STATUS_LABELS[job.status]?.color}>{BOOKING_STATUS_LABELS[job.status]?.label}</span>
                </div>
                <p className="font-semibold text-thunder-dark text-sm">{job.profiles?.full_name}</p>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {job.address}, {job.barangay}, {job.city}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(job.scheduled_date)} {job.scheduled_time}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-brand-600 text-sm">{formatPrice(job.total_price)}</p>
                <ChevronRight className={cn('w-4 h-4 text-[var(--text-muted)] mt-2 transition-transform', selected?.id === job.id && 'rotate-90')} />
              </div>
            </div>

            {/* Expanded job details */}
            {selected?.id === job.id && (
              <div className="border-t border-[var(--border)] p-4 space-y-4 bg-[var(--bg-2)]/50">
                {/* Customer contact */}
                <div className="flex flex-wrap items-center gap-3">
                  <a href={`tel:${job.profiles?.phone}`} className="flex items-center gap-2 btn-secondary !py-2 !px-3 !text-xs">
                    <Phone className="w-3 h-3" /> Call Customer
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.address}, ${job.barangay}, ${job.city}`)}`}
                    target="_blank"
                    className="flex items-center gap-2 btn-secondary !py-2 !px-3 !text-xs"
                  >
                    <MapPin className="w-3 h-3" /> Navigate
                  </a>
                </div>

                {/* Vehicle */}
                {job.vehicles && (
                  <div className="bg-[var(--surface)] rounded-xl p-3 text-sm">
                    <p className="font-semibold text-thunder-dark">{job.vehicles.make} {job.vehicles.model}</p>
                    <p className="text-xs text-[var(--text-muted)]">Tier: {job.vehicles.tier} {job.vehicles.plate ? `• ${job.vehicles.plate}` : ''}</p>
                  </div>
                )}

                {/* Services */}
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Services</p>
                  <div className="flex flex-wrap gap-1">
                    {job.booking_services?.map(s => <span key={s.service_name} className="badge-teal">{s.service_name}</span>)}
                  </div>
                </div>

                {/* ETA input (for on_the_way step) */}
                {job.status === 'assigned' && (
                  <div>
                    <label className="label text-xs">ETA (minutes)</label>
                    <input className="input !py-2" placeholder="e.g. 30" value={eta} onChange={e => setEta(e.target.value)} />
                  </div>
                )}

                {/* Photo upload */}
                {['on_the_way', 'in_progress'].includes(job.status) && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">Upload Photos</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[var(--text-muted)] mb-1">Before</p>
                        <div {...getBefore()} className="border-2 border-dashed border-[var(--border)] rounded-xl p-3 text-center cursor-pointer hover:border-brand-300">
                          <input {...getBeforeInput()} />
                          <Camera className="w-5 h-5 text-[var(--text-muted)] mx-auto mb-1" />
                          <p className="text-xs text-[var(--text-muted)]">{photos.before.length ? `${photos.before.length} file(s)` : 'Add before'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] mb-1">After</p>
                        <div {...getAfter()} className="border-2 border-dashed border-[var(--border)] rounded-xl p-3 text-center cursor-pointer hover:border-brand-300">
                          <input {...getAfterInput()} />
                          <Camera className="w-5 h-5 text-[var(--text-muted)] mx-auto mb-1" />
                          <p className="text-xs text-[var(--text-muted)]">{photos.after.length ? `${photos.after.length} file(s)` : 'Add after'}</p>
                        </div>
                      </div>
                    </div>
                    {(photos.before.length > 0 || photos.after.length > 0) && (
                      <button onClick={() => uploadPhotos(job)} disabled={uploading} className="btn-secondary w-full !py-2 !text-xs">
                        {uploading ? 'Uploading…' : 'Upload Photos'}
                      </button>
                    )}
                  </div>
                )}

                {/* Action button */}
                {STATUS_FLOW.find(s => s.key === job.status) && (
                  <button
                    onClick={() => advanceStatus(job)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {STATUS_FLOW.find(s => s.key === job.status)?.label}
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
