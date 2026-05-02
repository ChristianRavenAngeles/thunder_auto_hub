import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// POST /api/admin/vehicle-models
// Body: { model_name, brand? }
// DB-only lookup — no AI. Returns { tier, source } or { tier: null, source: 'unknown' }
export async function POST(request) {
  try {
    const { model_name, brand } = await request.json()
    if (!model_name?.trim()) return NextResponse.json({ error: 'model_name required' }, { status: 400 })

    const key = model_name.trim().toLowerCase()
    const admin = createAdminClient()

    // 1. Exact match
    const { data: exact } = await admin
      .from('vehicle_models')
      .select('tier')
      .eq('model_name', key)
      .single()

    if (exact) return NextResponse.json({ tier: exact.tier, source: 'db' })

    // 2. Partial match — typed text is contained in a known entry or vice versa
    const { data: allModels } = await admin
      .from('vehicle_models')
      .select('model_name, tier')

    const partial = (allModels || []).find(row =>
      key.includes(row.model_name) || row.model_name.includes(key)
    )
    if (partial) return NextResponse.json({ tier: partial.tier, source: 'db_partial' })

    // 3. Not found — log it so admin can identify and add it
    // Increment request_count if already logged
    await admin.rpc('log_unknown_vehicle', {
      p_model_name: key,
      p_brand: brand?.trim().toLowerCase() || null,
    }).catch(() => {
      // Fallback plain upsert if the function doesn't exist yet
      admin.from('unknown_vehicle_requests').upsert({
        model_name: key,
        brand: brand?.trim().toLowerCase() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'model_name' })
    })

    return NextResponse.json({ tier: null, source: 'unknown' })
  } catch (err) {
    console.error('[POST /api/admin/vehicle-models]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/admin/vehicle-models — admin list with full rows
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin', 'manager'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q')?.toLowerCase()

    let query = admin.from('vehicle_models').select('*').order('model_name')
    if (search) query = query.ilike('model_name', `%${search}%`)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ models: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/admin/vehicle-models — update or add a model
export async function PATCH(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin', 'manager'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, model_name, brand, tier } = await request.json()
    if (!model_name || !tier) return NextResponse.json({ error: 'model_name and tier required' }, { status: 400 })
    if (!['S', 'M', 'L', 'XL'].includes(tier)) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

    const admin = createAdminClient()
    const payload = {
      model_name: model_name.trim().toLowerCase(),
      brand: brand?.trim().toLowerCase() || null,
      tier,
      source: 'manual',
      updated_at: new Date().toISOString(),
    }

    if (id) {
      await admin.from('vehicle_models').update(payload).eq('id', id)
    } else {
      await admin.from('vehicle_models').upsert(payload, { onConflict: 'model_name' })
    }

    // Remove from unknown requests if it was pending
    await admin.from('unknown_vehicle_requests').delete().eq('model_name', payload.model_name)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/admin/vehicle-models
export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin', 'manager'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const admin = createAdminClient()
    await admin.from('vehicle_models').delete().eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
