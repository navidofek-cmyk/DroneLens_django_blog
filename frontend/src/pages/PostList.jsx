import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'

/* ── helpers ─────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/* ── Skeleton placeholders ───────────────────────────── */
function CardSkeleton() {
  return (
    <div className="col">
      <div className="post-card h-100">
        <div className="skeleton" style={{ height: 200 }} />
        <div className="card-body">
          <div className="skeleton mb-2" style={{ height: 20, width: '75%' }} />
          <div className="skeleton mb-1" style={{ height: 14 }} />
          <div className="skeleton" style={{ height: 14, width: '60%' }} />
        </div>
      </div>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <div className="skeleton mb-4" style={{ borderRadius: 16, height: 460 }} />
  )
}

/* ── Hero (featured first post) ──────────────────────── */
function HeroCard({ post }) {
  return (
    <Link to={`/post/${post.slug}`} className="hero-card d-block mb-4" style={{ minHeight: 460 }}>
      {post.cover_image
        ? <img src={post.cover_image} alt={post.title} className="hero-card-img" />
        : (
          <div className="hero-placeholder">
            <i className="bi bi-send-fill"></i>
          </div>
        )
      }
      <div className="hero-overlay" />
      <div className="hero-content">
        {post.category && (
          <span className="badge-cat me-2">{post.category?.name}</span>
        )}
        {post.drone_model && (
          <span className="badge-drone me-2">
            <i className="bi bi-gpu-card me-1"></i>{post.drone_model}
          </span>
        )}
        <h2 className="hero-title mt-2">{post.title}</h2>
        {post.excerpt && <p className="hero-excerpt">{post.excerpt}</p>}
        <div className="d-flex align-items-center gap-3 mt-2" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
          {post.location && (
            <span><i className="bi bi-geo-alt me-1"></i>{post.location}</span>
          )}
          {post.altitude && (
            <span><i className="bi bi-arrow-up me-1"></i>{post.altitude} m</span>
          )}
          <span><i className="bi bi-person me-1"></i>{post.author?.username || post.author}</span>
          <span><i className="bi bi-calendar3 me-1"></i>{formatDate(post.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}

/* ── Post grid card ───────────────────────────────────── */
function PostCard({ post }) {
  return (
    <div className="col">
      <Link to={`/post/${post.slug}`} className="post-card d-block h-100" style={{ color: 'inherit' }}>
        {post.cover_image
          ? <img src={post.cover_image} alt={post.title} className="post-card-img" />
          : (
            <div className="card-img-placeholder">
              <i className="bi bi-send-fill"></i>
            </div>
          )
        }
        <div className="card-body d-flex flex-column gap-1">
          <div className="d-flex flex-wrap gap-1 mb-1">
            {post.category?.name && (
              <span className="badge-cat">{post.category.name}</span>
            )}
            {post.drone_model && (
              <span className="badge-drone">{post.drone_model}</span>
            )}
          </div>
          <div className="card-title mb-0">{post.title}</div>
          {post.excerpt && <p className="card-text">{post.excerpt}</p>}
          <div className="card-meta d-flex flex-wrap gap-2 mt-auto pt-2">
            {post.location && (
              <span><i className="bi bi-geo-alt me-1"></i>{post.location}</span>
            )}
            {post.altitude && (
              <span><i className="bi bi-arrow-up me-1"></i>{post.altitude} m</span>
            )}
            <span><i className="bi bi-person me-1"></i>{post.author?.username}</span>
            <span className="ms-auto"><i className="bi bi-calendar3 me-1"></i>{formatDate(post.created_at)}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────── */
export default function PostList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  const search   = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const tag      = searchParams.get('tag') || ''
  const page     = parseInt(searchParams.get('page') || '1', 10)

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    // reset to page 1 on filter change
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  // Posts query
  const postsQuery = useQuery({
    queryKey: ['posts', { search, category, tag, page }],
    queryFn: async () => {
      const params = {}
      if (search)   params.search   = search
      if (category) params.category = category
      if (tag)      params.tag      = tag
      if (page > 1) params.page     = page
      const { data } = await api.get('/posts/', { params })
      return data
    },
  })

  // Categories sidebar
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories/')
      return data
    },
  })

  // Tags sidebar
  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await api.get('/tags/')
      return data
    },
  })

  const posts    = postsQuery.data?.results ?? []
  const count    = postsQuery.data?.count ?? 0
  const hasNext  = !!postsQuery.data?.next
  const hasPrev  = !!postsQuery.data?.previous
  const pageSize = 10
  const totalPages = Math.ceil(count / pageSize)

  const [hero, ...rest] = posts

  function handleSearchSubmit(e) {
    e.preventDefault()
    setParam('search', searchInput.trim())
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="row g-4">

          {/* ── Main column ── */}
          <div className="col-lg-8">

            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search posts…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  style={{ borderRadius: '8px 0 0 8px', borderColor: '#cbd5e1' }}
                />
                <button className="btn btn-accent px-4" type="submit">
                  <i className="bi bi-search"></i>
                </button>
                {search && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => { setSearchInput(''); setParam('search', '') }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </form>

            {/* Active filters */}
            {(search || category || tag) && (
              <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <span className="text-muted small">Filters:</span>
                {search && (
                  <span className="badge bg-secondary d-flex align-items-center gap-1">
                    search: {search}
                    <button className="btn-close btn-close-white ms-1" style={{ fontSize: '0.6rem' }}
                      onClick={() => { setSearchInput(''); setParam('search', '') }} />
                  </span>
                )}
                {category && (
                  <span className="badge d-flex align-items-center gap-1" style={{ background: 'var(--accent2)', color: '#fff' }}>
                    category: {category}
                    <button className="btn-close btn-close-white ms-1" style={{ fontSize: '0.6rem' }}
                      onClick={() => setParam('category', '')} />
                  </span>
                )}
                {tag && (
                  <span className="badge bg-info text-dark d-flex align-items-center gap-1">
                    tag: {tag}
                    <button className="btn-close ms-1" style={{ fontSize: '0.6rem' }}
                      onClick={() => setParam('tag', '')} />
                  </span>
                )}
              </div>
            )}

            {/* Loading state */}
            {postsQuery.isLoading && (
              <>
                <HeroSkeleton />
                <div className="row row-cols-1 row-cols-md-2 g-4">
                  {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
                </div>
              </>
            )}

            {/* Error state */}
            {postsQuery.isError && (
              <div className="alert alert-danger d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                Failed to load posts. Please try again.
              </div>
            )}

            {/* Empty state */}
            {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 && (
              <div className="text-center py-5">
                <i className="bi bi-send-fill" style={{ fontSize: '4rem', color: 'var(--sky-blue)', opacity: 0.2 }}></i>
                <p className="text-muted mt-3">No posts found.</p>
              </div>
            )}

            {/* Hero post */}
            {!postsQuery.isLoading && hero && <HeroCard post={hero} />}

            {/* Posts grid */}
            {!postsQuery.isLoading && rest.length > 0 && (
              <div className="row row-cols-1 row-cols-md-2 g-4 mb-4">
                {rest.map(post => <PostCard key={post.slug} post={post} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Posts pagination">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${!hasPrev ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setParam('page', String(page - 1))}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1
                    if (Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                      if (p === 2 || p === totalPages - 1) return <li key={p} className="page-item disabled"><span className="page-link">…</span></li>
                      return null
                    }
                    return (
                      <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setParam('page', String(p))}>{p}</button>
                      </li>
                    )
                  })}
                  <li className={`page-item ${!hasNext ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setParam('page', String(page + 1))}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4">

              {/* Categories */}
              <div className="sidebar-card">
                <div className="sidebar-header">
                  <i className="bi bi-tag me-2"></i>Categories
                </div>
                <div className="p-3">
                  {categoriesQuery.isLoading && (
                    <div className="d-flex flex-column gap-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 32 }} />
                      ))}
                    </div>
                  )}
                  {!categoriesQuery.isLoading && (
                    <div className="d-flex flex-column gap-1">
                      <button
                        className={`sidebar-tag text-start w-100 ${!category ? 'active' : ''}`}
                        onClick={() => setParam('category', '')}
                      >
                        <i className="bi bi-grid me-1"></i>All categories
                      </button>
                      {(categoriesQuery.data?.results ?? categoriesQuery.data ?? []).map(cat => (
                        <button
                          key={cat.id || cat.slug}
                          className={`sidebar-tag text-start w-100 ${category === String(cat.id || cat.slug) ? 'active' : ''}`}
                          onClick={() => setParam('category', String(cat.id || cat.slug))}
                        >
                          {cat.name}
                          {cat.post_count != null && (
                            <span className="float-end text-muted" style={{ fontSize: '0.75rem' }}>{cat.post_count}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="sidebar-card">
                <div className="sidebar-header">
                  <i className="bi bi-hash me-2"></i>Tags
                </div>
                <div className="p-3">
                  {tagsQuery.isLoading && (
                    <div className="skeleton" style={{ height: 60 }} />
                  )}
                  {!tagsQuery.isLoading && (
                    <div className="d-flex flex-wrap gap-2">
                      {(tagsQuery.data?.results ?? tagsQuery.data ?? []).map(t => (
                        <button
                          key={t.id || t.slug}
                          className={`sidebar-tag ${tag === (t.slug || t.name) ? 'active' : ''}`}
                          onClick={() => setParam('tag', tag === (t.slug || t.name) ? '' : (t.slug || t.name))}
                        >
                          #{t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
