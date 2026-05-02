import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('vehicle_models')
      .select('model_name, brand, tier')
      .order('model_name')

    if (error) throw error

    // Return as a flat map: { "montero sport": "L", ... }
    const map = {}
    for (const row of data || []) {
      map[row.model_name.toLowerCase()] = row.tier
    }

    return NextResponse.json({ models: map }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
