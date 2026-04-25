import { createAdminClient } from '@/lib/supabase/admin'
import { FileText, Plus, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Blog — Thunder Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  const admin = createAdminClient()
  const { data: posts } = await admin.from('blog_posts').select('*').order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-thunder-dark">Blog Posts</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Car care tips and announcements.</p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </div>

      <div className="space-y-3">
        {(posts || []).map(p => (
          <div key={p.id} className="card p-4 flex items-center gap-4">
            {p.cover_url && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bg-2)]">
                <img src={p.cover_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-thunder-dark">{p.title}</p>
                {p.is_published
                  ? <span className="badge-green text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Published</span>
                  : <span className="badge-gray text-xs flex items-center gap-1"><EyeOff className="w-3 h-3" /> Draft</span>
                }
              </div>
              <p className="text-sm text-[var(--text-muted)] line-clamp-1">{p.excerpt || p.content?.substring(0, 100) || '—'}</p>
              <p className="text-xs text-[var(--text-2)] mt-1">{formatDate(p.created_at)} · {p.category || 'Uncategorized'}</p>
            </div>
            <Link href={`/admin/blog/${p.id}`} className="btn-secondary !py-1.5 !px-3 !text-xs">Edit</Link>
          </div>
        ))}
        {(!posts || posts.length === 0) && (
          <div className="card p-12 text-center text-[var(--text-muted)]">
            <FileText className="w-8 h-8 mx-auto mb-2" /> No blog posts yet.
          </div>
        )}
      </div>
    </div>
  )
}
