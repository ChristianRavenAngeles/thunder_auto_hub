import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { safeInsertAuditLog } from '@/lib/audit'
import { UserPlus, Phone, Calendar, MapPin, Save } from 'lucide-react'
import { formatDate, LEAD_STATUS_LABELS } from '@/lib/utils'

export const metadata = { title: 'Leads — Thunder Admin' }
export const dynamic = 'force-dynamic'

const STAFF_ROLES = ['admin', 'manager', 'staff', 'super_admin']
const PIPELINE_ORDER = ['new', 'contacted', 'nurture', 'booked', 'lost']

async function requireStaffUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!STAFF_ROLES.includes(profile?.role)) return null

  return user
}

async function updateLead(formData) {
  'use server'

  const user = await requireStaffUser()
  if (!user) return

  const id = String(formData.get('id') || '').trim()
  if (!id) return

  const admin = createAdminClient()
  const { data: existing } = await admin.from('leads').select('*').eq('id', id).single()
  if (!existing) return

  const payload = {
    status: String(formData.get('status') || existing.status),
    assigned_to: String(formData.get('assigned_to') || '').trim() || null,
    notes: String(formData.get('notes') || '').trim() || null,
    followed_up_at: String(formData.get('followed_up_at') || '').trim() || null,
    updated_at: new Date().toISOString(),
  }

  await admin.from('leads').update(payload).eq('id', id)
  await safeInsertAuditLog(admin, {
    user_id: user.id,
    action: 'lead_updated',
    table_name: 'leads',
    record_id: id,
    old_data: {
      status: existing.status,
      assigned_to: existing.assigned_to,
      notes: existing.notes,
      followed_up_at: existing.followed_up_at,
    },
    new_data: payload,
  })

  revalidatePath('/admin/leads')
}

function LeadCard({ lead, staffOptions }) {
  return (
    <form action={updateLead} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <input type="hidden" name="id" value={lead.id} />

      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-thunder-dark">{lead.name || 'Unnamed lead'}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
            {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
            {lead.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.location}</span>}
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(lead.created_at)}</span>
          </div>
        </div>
        <span className={`${LEAD_STATUS_LABELS[lead.status]?.color || 'badge-gray'} text-xs`}>
          {LEAD_STATUS_LABELS[lead.status]?.label || lead.status}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {lead.source && <span className="rounded-full bg-[var(--bg-2)] px-2 py-1 capitalize text-[var(--text-muted)]">{lead.source}</span>}
        {lead.service_interest && <span className="rounded-full bg-brand-50 px-2 py-1 text-brand-700">{lead.service_interest}</span>}
        {lead.vehicle_model && <span className="rounded-full bg-[var(--bg-2)] px-2 py-1 text-[var(--text-muted)]">{lead.vehicle_model}</span>}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <label>
            <span className="label">Stage</span>
            <select name="status" defaultValue={lead.status} className="input !py-2">
              {PIPELINE_ORDER.map(status => (
                <option key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]?.label || status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label">Assign To</span>
            <select name="assigned_to" defaultValue={lead.assigned_to || ''} className="input !py-2">
              <option value="">Unassigned</option>
              {staffOptions.map(person => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label">Follow Up</span>
            <input
              type="datetime-local"
              name="followed_up_at"
              defaultValue={lead.followed_up_at ? new Date(lead.followed_up_at).toISOString().slice(0, 16) : ''}
              className="input !py-2"
            />
          </label>

          <label>
            <span className="label">Notes</span>
            <textarea name="notes" rows={4} defaultValue={lead.notes || ''} className="input resize-y !py-2" />
          </label>
        </div>

        <button type="submit" className="btn-primary w-full !py-2 !text-sm flex items-center justify-center gap-2">
          <Save className="h-4 w-4" /> Save Lead
        </button>
      </div>
    </form>
  )
}

export default async function LeadsPage() {
  const admin = createAdminClient()
  const [{ data: leads }, { data: staff }] = await Promise.all([
    admin.from('leads').select('*').order('created_at', { ascending: false }).limit(200),
    admin.from('profiles').select('id, full_name, role').in('role', STAFF_ROLES).order('full_name'),
  ])

  const grouped = Object.fromEntries(PIPELINE_ORDER.map(status => [status, []]))
  for (const lead of leads || []) {
    if (!grouped[lead.status]) grouped[lead.status] = []
    grouped[lead.status].push(lead)
  }

  const assignedCount = (leads || []).filter(lead => lead.assigned_to).length
  const followUpCount = (leads || []).filter(lead => lead.followed_up_at).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">Lead Pipeline</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Move inquiries from first contact to booked or nurture, with ownership and follow-ups.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'All Leads', value: leads?.length || 0 },
          { label: 'Assigned', value: assignedCount },
          { label: 'With Follow-Up', value: followUpCount },
          { label: 'Booked', value: grouped.booked?.length || 0 },
        ].map(item => (
          <div key={item.label} className="card p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</div>
            <div className="mt-2 text-2xl font-display text-thunder-dark">{item.value}</div>
          </div>
        ))}
      </div>

      {!leads?.length && (
        <div className="card p-12 text-center text-[var(--text-muted)]">
          <UserPlus className="w-8 h-8 mx-auto mb-2" /> No leads found.
        </div>
      )}

      {leads?.length > 0 && (
        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-5 xl:grid-cols-3">
          {PIPELINE_ORDER.map(status => (
            <section key={status} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-2)]/40 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-thunder-dark">{LEAD_STATUS_LABELS[status]?.label || status}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{grouped[status]?.length || 0} lead(s)</p>
                </div>
                <span className={`${LEAD_STATUS_LABELS[status]?.color || 'badge-gray'} text-xs`}>
                  {LEAD_STATUS_LABELS[status]?.label || status}
                </span>
              </div>

              <div className="space-y-4">
                {(grouped[status] || []).map(lead => (
                  <LeadCard key={lead.id} lead={lead} staffOptions={staff || []} />
                ))}
                {(!grouped[status] || grouped[status].length === 0) && (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-muted)]">
                    No leads in this stage.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
