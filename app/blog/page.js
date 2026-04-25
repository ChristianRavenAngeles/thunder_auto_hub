import { createAdminClient } from '@/lib/supabase/admin'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'
import Link from 'next/link'
import { Calendar, Tag } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Car Care Tips — Thunder Auto Hub' }
export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const admin = createAdminClient()
  const { data: posts } = await admin
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_url, category, published_at, created_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="page-container py-12">
          <div className="text-center mb-10">
            <div className="badge-teal mb-3">Car Care Tips</div>
            <h1 className="section-title">Thunder Blog</h1>
            <p className="section-subtitle">Expert tips para sa inyong sasakyan.</p>
          </div>

          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="card overflow-hidden group hover:shadow-thunder transition-shadow">
                  {post.cover_url && (
                    <div className="h-48 bg-gray-100 overflow-hidden">
                      <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(post.published_at || post.created_at)}</span>
                      {post.category && <span className="flex items-center gap-1 badge-teal"><Tag className="w-3 h-3" /> {post.category}</span>}
                    </div>
                    <h2 className="font-bold text-thunder-dark group-hover:text-brand-600 transition-colors mb-2">{post.title}</h2>
                    {post.excerpt && <p className="text-sm text-[var(--text-muted)] line-clamp-3">{post.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[var(--text-muted)]">
              <p className="text-lg font-medium mb-2">Coming Soon!</p>
              <p className="text-sm">Malapit na kaming mag-post ng mga kapaki-pakinabang na car care tips.</p>
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
