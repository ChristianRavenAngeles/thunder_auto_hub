import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAX_BYTES  = 5 * 1024 * 1024 // 5 MB
const ALLOWED    = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file     = formData.get('file')
    const bucket   = String(formData.get('bucket') || 'deposits')
    const folder   = String(formData.get('folder') || user.id)

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File must be smaller than 5 MB.' }, { status: 400 })
    }

    const ext      = file.name.split('.').pop() || 'jpg'
    const filename = `${folder}/${Date.now()}.${ext}`
    const bytes    = await file.arrayBuffer()

    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from(bucket)
      .upload(filename, bytes, { contentType: file.type, upsert: false })

    if (error) throw error

    const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl, path: data.path })
  } catch (err) {
    console.error('[POST /api/upload]', err)
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 })
  }
}
