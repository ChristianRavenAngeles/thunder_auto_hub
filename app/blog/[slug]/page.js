import { createAdminClient } from '@/lib/supabase/admin'
import PublicNav from '@/components/layout/PublicNav'
import PublicFooter from '@/components/layout/PublicFooter'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, Tag, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const admin = createAdminClient()
  const { data: post } = await admin
    .from('blog_posts')
    .select('title, excerpt')
    .or(`slug.eq.${params.slug},id.eq.${params.slug}`)
    .eq('is_published', true)
    .single()

  if (!post) return { title: 'Blog — Thunder Auto Hub' }
  return {
    title: `${post.title} — Thunder Auto Hub`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }) {
  const admin = createAdminClient()
  const { data: post } = await admin
    .from('blog_posts')
    .select('*')
    .or(`slug.eq.${params.slug},id.eq.${params.slug}`)
    .eq('is_published', true)
    .single()

  if (!post) notFound()

  const { data: related } = await admin
    .from('blog_posts')
    .select('id, title, slug, excerpt, published_at, category')
    .eq('is_published', true)
    .contains('tags', post.tags?.slice(0, 1) || [])
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(2)

  return (
    <>
      <PublicNav />
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="page-container max-w-3xl py-12">
          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-brand-600 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 text-xs text-[var(--text-muted)]">
              {post.tags?.[0] && (
                <span className="badge-teal flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {post.tags[0]}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {formatDate(post.published_at || post.created_at)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-thunder-dark leading-tight mb-4">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg text-[var(--text-muted)] leading-relaxed border-l-4 border-brand-400 pl-4">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Cover image */}
          {post.cover_url && (
            <div className="rounded-2xl overflow-hidden mb-8 aspect-video bg-gray-100">
              <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content */}
          <article
            className="prose prose-gray max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />

          {/* CTA */}
          <div className="card p-6 text-center bg-gradient-thunder mb-10">
            <h3 className="font-bold font-display text-thunder-dark text-xl mb-2">
              Handa na kayong mag-book?
            </h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">
              I-experience ang premium home-service car care — pumupunta kami sa inyo.
            </p>
            <Link href="/book" className="btn-primary inline-flex">
              Book a Service →
            </Link>
          </div>

          {/* Related posts */}
          {related && related.length > 0 && (
            <div>
              <h2 className="font-bold font-display text-thunder-dark text-xl mb-4">Related Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map(r => (
                  <Link key={r.id} href={`/blog/${r.slug || r.id}`} className="card p-4 hover:shadow-thunder transition-shadow group">
                    <div className="text-xs text-[var(--text-muted)] mb-2">{formatDate(r.published_at)}</div>
                    <h3 className="font-semibold text-thunder-dark group-hover:text-brand-600 transition-colors text-sm leading-snug">
                      {r.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  )
}
