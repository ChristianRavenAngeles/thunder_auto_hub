'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Camera, CheckCircle2, ClipboardCheck, Clock3, Droplets, MapPin, Package, Sparkles, TriangleAlert, Upload, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buildBookingTimeline } from '@/lib/bookingTimeline'
import { countdownFromEta } from '@/lib/riderWorkflow'
import { BOOKING_STATUS_LABELS, formatDate } from '@/lib/utils'
import { formatPrice } from '@/lib/pricing'

const NOTE_SEVERITIES = ['info', 'warning', 'critical']

export default function RiderJobsClient() {
  const supabase = useMemo(() => createClient(), [])
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [etaMinutes, setEtaMinutes] = useState('30')
  const [statusNote, setStatusNote] = useState('')
  const [noteText, setNoteText] = useState('')
  const [noteSeverity, setNoteSeverity] = useState('info')
  const [supplyId, setSupplyId] = useState('')
  const [supplyQty, setSupplyQty] = useState('1')
  const [supplyNotes, setSupplyNotes] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoType, setPhotoType] = useState('before')
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoPublic, setPhotoPublic] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    if (selectedJobId) loadDetail(selectedJobId)
  }, [selectedJobId])

  async function loadJobs(nextSelectedId) {
    setLoadingJobs(true)
    const response = await fetch('/api/rider/jobs', { cache: 'no-store' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      toast.error(payload.error || 'Could not load jobs.')
      setLoadingJobs(false)
      return
    }

    const rows = payload.jobs || []
    setJobs(rows)
    const preferredId = nextSelectedId || selectedJobId
    const resolvedId = rows.some(job => job.id === preferredId) ? preferredId : rows[0]?.id || null
    setSelectedJobId(resolvedId)
    setLoadingJobs(false)
  }

  async function loadDetail(id) {
    setLoadingDetail(true)
    const response = await fetch(`/api/rider/bookings/${id}`, { cache: 'no-store' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      toast.error(payload.error || 'Could not load job details.')
      setLoadingDetail(false)
      return
    }

    setDetail(payload)
    setEtaMinutes(payload.booking?.eta_minutes ? String(payload.booking.eta_minutes) : '30')
    setSupplyId(payload.supplies?.[0]?.id || '')
    setLoadingDetail(false)
  }

  async function runAction(body, successMessage) {
    if (!selectedJobId) return
    const response = await fetch(`/api/rider/bookings/${selectedJobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || 'Action failed.')
    if (successMessage) toast.success(successMessage)
    await Promise.all([loadJobs(selectedJobId), loadDetail(selectedJobId)])
  }

  async function updateStatus(nextStatus) {
    setStatusLoading(true)
    try {
      await runAction({
        action: 'update_status',
        status: nextStatus,
        eta_minutes: nextStatus === 'on_the_way' ? Number(etaMinutes || 0) : null,
        note: statusNote,
      }, 'Job status updated.')
      setStatusNote('')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setStatusLoading(false)
    }
  }

  async function toggleChecklist(item, checked) {
    try {
      await runAction({
        action: 'toggle_checklist',
        item_id: item.id,
        is_done: checked,
      })
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function saveNote() {
    if (!noteText.trim()) return
    try {
      await runAction({
        action: 'add_note',
        note: noteText,
        severity: noteSeverity,
      }, 'Field note saved.')
      setNoteText('')
      setNoteSeverity('info')
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function logSupply() {
    if (!supplyId || !(Number(supplyQty) > 0)) return
    try {
      await runAction({
        action: 'log_supply',
        supply_id: supplyId,
        quantity: Number(supplyQty),
        notes: supplyNotes,
      }, 'Supply usage logged.')
      setSupplyQty('1')
      setSupplyNotes('')
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function uploadPhoto() {
    if (!selectedJobId || !photoFile) return
    setUploadingPhoto(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = photoFile.name.split('.').pop()
      const path = `job-photos/${selectedJobId}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, photoFile)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
      const { error: insertError } = await supabase.from('photos').insert({
        booking_id: selectedJobId,
        type: photoType,
        url: urlData.publicUrl,
        caption: photoCaption || null,
        is_public: photoPublic,
        uploaded_by: user?.id || null,
      })
      if (insertError) throw insertError

      toast.success('Photo uploaded.')
      setPhotoFile(null)
      setPhotoCaption('')
      setPhotoType('before')
      setPhotoPublic(true)
      await Promise.all([loadJobs(selectedJobId), loadDetail(selectedJobId)])
    } catch (error) {
      toast.error(error.message || 'Upload failed.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const booking = detail?.booking
  const timeline = buildBookingTimeline(booking?.status, { hasReview: false })
  const etaCountdown = booking ? countdownFromEta(booking) : null
  const checklistDone = detail?.checklist?.filter(item => item.is_done).length || 0
  const checklistTotal = detail?.checklist?.length || 0

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-thunder-dark">Technician Workflow</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Manage assigned jobs, field checklist, before/after proof, and supply usage from a mobile-friendly screen.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-thunder-dark">Assigned Jobs</h2>
              <span className="text-xs text-[var(--text-muted)]">{jobs.length} active</span>
            </div>
          </div>

          {loadingJobs && <div className="card p-6 text-sm text-[var(--text-muted)]">Loading jobs...</div>}
          {!loadingJobs && jobs.length === 0 && (
            <div className="card p-8 text-center text-[var(--text-muted)]">
              <ClipboardCheck className="mx-auto mb-2 h-8 w-8 text-brand-500" />
              No assigned jobs right now.
            </div>
          )}

          {jobs.map(job => {
            const active = job.id === selectedJobId
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => setSelectedJobId(job.id)}
                className={`card w-full p-4 text-left transition-all ${active ? 'ring-2 ring-brand-300 border-brand-200' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-thunder-dark">{job.reference_no}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(job.scheduled_date)} • {job.scheduled_time}</div>
                  </div>
                  <span className={`text-xs ${BOOKING_STATUS_LABELS[job.status]?.color || 'badge-gray'}`}>
                    {BOOKING_STATUS_LABELS[job.status]?.label || job.status}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-2)]">
                    <UserRound className="h-4 w-4 text-brand-500" /> {job.profiles?.full_name || 'Customer'}
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-2)]">
                    <MapPin className="h-4 w-4 text-brand-500" /> {job.barangay}, {job.city}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{job.checklist_done}/{job.checklist_total} checklist done</span>
                    <span>{job.photo_count} photo{job.photo_count === 1 ? '' : 's'}</span>
                  </div>
                </div>

                {job.sla_alerts?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.sla_alerts.map(alert => (
                      <span key={alert.key} className={`text-xs ${alert.severity === 'high' ? 'badge-red' : 'badge-gold'}`}>
                        {alert.label}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </section>

        <section className="space-y-5">
          {loadingDetail && <div className="card p-6 text-sm text-[var(--text-muted)]">Loading job details...</div>}
          {!loadingDetail && !booking && (
            <div className="card p-10 text-center text-[var(--text-muted)]">Select a job to start the workflow.</div>
          )}

          {booking && (
            <>
              <div className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Current Job</div>
                    <h2 className="mt-1 text-xl font-bold font-display text-thunder-dark">{booking.reference_no}</h2>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--text-2)]">
                      <span>{booking.vehicles?.make} {booking.vehicles?.model}</span>
                      <span>{formatDate(booking.scheduled_date)} {booking.scheduled_time}</span>
                      <span>{booking.profiles?.full_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs ${BOOKING_STATUS_LABELS[booking.status]?.color || 'badge-gray'}`}>
                      {BOOKING_STATUS_LABELS[booking.status]?.label || booking.status}
                    </div>
                    {etaCountdown !== null && (
                      <div className="mt-2 text-sm font-semibold text-amber-600">ETA countdown: {etaCountdown} min</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoTile icon={MapPin} label="Location" value={`${booking.barangay}, ${booking.city}`} />
                  <InfoTile icon={Sparkles} label="Services" value={(booking.booking_services || []).map(item => item.service_name).join(', ') || 'Service pending'} />
                  <InfoTile icon={Package} label="Value" value={formatPrice(booking.total_price || 0)} />
                  <InfoTile icon={Clock3} label="Checklist" value={`${checklistDone}/${checklistTotal} done`} />
                </div>

                {!!booking.service_flags?.length && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.service_flags.map(flag => (
                      <span key={flag} className="badge-gold text-xs">{flag}</span>
                    ))}
                  </div>
                )}
                {booking.admin_notes && <p className="mt-3 text-sm text-[var(--text-muted)]">Admin notes: {booking.admin_notes}</p>}
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-thunder-dark">Field Actions</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Move the booking through arrival, service start, and completion in order.</p>

                <div className="mt-4 space-y-3">
                  {detail?.next_statuses?.map(nextStatus => (
                    <div key={nextStatus} className="rounded-2xl border border-[var(--border)] p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-thunder-dark">{BOOKING_STATUS_LABELS[nextStatus]?.label || nextStatus}</div>
                          <div className="text-xs text-[var(--text-muted)]">Customer notification and timeline update happen automatically.</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateStatus(nextStatus)}
                          disabled={statusLoading}
                          className="btn-primary !py-2 !px-4"
                        >
                          {statusLoading ? 'Saving...' : `Mark ${BOOKING_STATUS_LABELS[nextStatus]?.label || nextStatus}`}
                        </button>
                      </div>
                      {nextStatus === 'on_the_way' && (
                        <div className="mt-3">
                          <label className="label">ETA Minutes</label>
                          <input value={etaMinutes} onChange={e => setEtaMinutes(e.target.value)} className="input max-w-[180px]" />
                        </div>
                      )}
                    </div>
                  ))}
                  {!detail?.next_statuses?.length && (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
                      No next action available from the current status.
                    </div>
                  )}
                  <div>
                    <label className="label">Status Note</label>
                    <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} rows={3} className="input resize-y" placeholder="Optional handoff note for the timeline" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-thunder-dark">Job Checklist</h3>
                    <span className="text-xs text-[var(--text-muted)]">{checklistDone}/{checklistTotal}</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(detail?.checklist || []).map(item => (
                      <label key={item.id} className="flex items-start gap-3 rounded-xl border border-[var(--border)] px-3 py-3">
                        <input type="checkbox" checked={item.is_done} onChange={e => toggleChecklist(item, e.target.checked)} className="mt-1" />
                        <span className={`text-sm ${item.is_done ? 'text-green-700 line-through' : 'text-thunder-dark'}`}>{item.item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-semibold text-thunder-dark">Upload Proof Photos</h3>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="label">Photo File</label>
                      <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="input file:mr-3 file:border-0 file:bg-brand-50 file:px-3 file:py-2" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Type</label>
                        <select value={photoType} onChange={e => setPhotoType(e.target.value)} className="input">
                          {['before', 'after', 'other'].map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 pt-7 text-sm text-[var(--text-2)]">
                        <input type="checkbox" checked={photoPublic} onChange={e => setPhotoPublic(e.target.checked)} />
                        Visible to customer
                      </label>
                    </div>
                    <div>
                      <label className="label">Caption</label>
                      <input value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} className="input" placeholder="Front bumper before wash" />
                    </div>
                    <button type="button" onClick={uploadPhoto} disabled={uploadingPhoto || !photoFile} className="btn-primary flex items-center gap-2">
                      <Upload className="h-4 w-4" /> {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {((booking.photos || []).slice(0, 6)).map(photo => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-[var(--border)]">
                        <img src={photo.url} alt={photo.caption || photo.type} className="h-24 w-full object-cover" />
                      </a>
                    ))}
                    {!booking.photos?.length && (
                      <div className="col-span-3 rounded-xl border border-dashed border-[var(--border)] px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                        No proof photos uploaded yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-semibold text-thunder-dark">Field Notes</h3>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="label">Severity</label>
                      <select value={noteSeverity} onChange={e => setNoteSeverity(e.target.value)} className="input">
                        {NOTE_SEVERITIES.map(level => <option key={level} value={level}>{level}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Note</label>
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} className="input resize-y" placeholder="Customer requested extra attention on the hood." />
                    </div>
                    <button type="button" onClick={saveNote} disabled={!noteText.trim()} className="btn-secondary">Save Note</button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {(detail?.notes || []).map(item => (
                      <div key={item.id} className="rounded-xl border border-[var(--border)] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-xs ${item.severity === 'critical' ? 'badge-red' : item.severity === 'warning' ? 'badge-gold' : 'badge-teal'}`}>{item.severity}</span>
                          <span className="text-xs text-[var(--text-muted)]">{formatDate(item.created_at)}</span>
                        </div>
                        <p className="mt-2 text-sm text-[var(--text-2)]">{item.note}</p>
                      </div>
                    ))}
                    {!detail?.notes?.length && <div className="text-sm text-[var(--text-muted)]">No field notes yet.</div>}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-semibold text-thunder-dark">Supplies Used</h3>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="label">Supply</label>
                      <select value={supplyId} onChange={e => setSupplyId(e.target.value)} className="input">
                        {(detail?.supplies || []).map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({Number(item.quantity || 0).toLocaleString()} {item.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Quantity</label>
                        <input value={supplyQty} onChange={e => setSupplyQty(e.target.value)} type="number" min="0.1" step="0.1" className="input" />
                      </div>
                      <div>
                        <label className="label">Notes</label>
                        <input value={supplyNotes} onChange={e => setSupplyNotes(e.target.value)} className="input" placeholder="Foam cannon refill" />
                      </div>
                    </div>
                    <button type="button" onClick={logSupply} disabled={!supplyId} className="btn-secondary flex items-center gap-2">
                      <Droplets className="h-4 w-4" /> Log Usage
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {(detail?.usage || []).map(item => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3 text-sm">
                        <div>
                          <div className="font-medium text-thunder-dark">{item.supply?.name || 'Supply'}</div>
                          <div className="text-xs text-[var(--text-muted)]">{item.notes || 'Used on booking'} • {formatDate(item.created_at)}</div>
                        </div>
                        <div className="font-semibold text-brand-600">{item.quantity} {item.supply?.unit}</div>
                      </div>
                    ))}
                    {!detail?.usage?.length && <div className="text-sm text-[var(--text-muted)]">No supply usage logged yet.</div>}
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-thunder-dark">Customer Live Status Preview</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] p-4">
                    <div className="text-sm font-semibold text-thunder-dark">Timeline</div>
                    <div className="mt-3 space-y-3">
                      {timeline.map(step => (
                        <div key={step.key} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                          <span className="text-sm text-thunder-dark">{step.label}</span>
                          <span className={`text-xs ${step.state === 'done' ? 'badge-green' : step.state === 'current' ? 'badge-teal' : 'badge-gray'}`}>
                            {step.state}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] p-4">
                    <div className="text-sm font-semibold text-thunder-dark">Customer-facing details</div>
                    <div className="mt-3 space-y-2 text-sm text-[var(--text-2)]">
                      <div>Assigned team: {detail?.rider?.full_name || 'Unassigned'}</div>
                      <div>ETA: {etaCountdown !== null ? `${etaCountdown} minutes remaining` : booking.eta_minutes ? `~${booking.eta_minutes} minutes` : 'Not set'}</div>
                      <div>Visible photos: {(booking.photos || []).filter(photo => photo.is_public).length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
        <Icon className="h-4 w-4 text-brand-500" /> {label}
      </div>
      <div className="mt-2 text-sm text-thunder-dark">{value || '-'}</div>
    </div>
  )
}
