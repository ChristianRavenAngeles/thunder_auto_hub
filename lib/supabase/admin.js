import { createClient } from '@supabase/supabase-js'

// Singleton — reuse the same client across requests in the same Node.js process
// so the underlying HTTP connection pool is shared and stays warm.
let _admin = null

export function createAdminClient() {
  if (_admin) return _admin
  _admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  return _admin
}
