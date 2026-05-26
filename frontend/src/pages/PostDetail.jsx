import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

/* ── helpers ─────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/* ── Skeleton ─────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="skeleton mb-4" style={{ height: 460, borderRadius: 16 }} />
        <div className="skeleton mb-3" style={{ height: 36, width: '70%' }} />
        <div className="skeleton mb-2" style={{ height: 18 }} />
        <div className="skeleton mb-2" style={{ height: 18, width: '85%' }} />
        <div className="skeleton" style={{ height: 18, width: '60%' }} />
      </div>
    </div>
  )
}

/* ── Lightbox modal ───────────────────────────────────── */
function Lightbox({ photo, onClose }) {
  if (!photo) return null
  return (
    <div
      className="modal d-block lightbox-modal"
      tabIndex="-1"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-xl modal-dialog-centered"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <button
              type="button"
              className="btn-close btn-close-white ms-auto"
              onClick={onClose}
              aria-label="Close"
            />
          </div>
          <div className="modal-body text-center pb-4 px-4">
            <img
              src={photo.image}
              alt={photo.caption || 'Gallery photo'}
              className="lightbox-img"
            />
            {photo.caption && (
              <p className="text-white-50 small mt-2 mb-0">{photo.caption}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Comment form ─────────────────────────────────────── */
function CommentForm({ slug, onSuccess }) {
  const [body, setBody]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.post(`/posts/${slug}/comments/`, { body })
      setBody('')
      onSuccess()
    } catch {
      setError('Could not post comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      {error && (
        <div className="alert alert-danger py-2 small">{error}</div>
      )}
      <textarea
        className="form-control mb-2"
        rows={3}
        placeholder="Write a comment…"
        value={body}
        onChange={e => setBody(e.target.value)}
        style={{ borderRadius: 8, resize: 'vertical', borderColor: '#cbd5e1' }}
        required
      />
      <button className="btn btn-accent px-4" disabled={loading} type="submit">
        {loading
          ? <span className="spinner-border spinner-border-sm me-2" role="status" />
          : <i className="bi bi-send me-2"></i>
        }
        Post comment
      </button>
    </form>
  )
}

/* ── Main component ───────────────────────────────────── */
export default function PostDetail() {
  const { slug }       = useParams()
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const queryClient    = useQueryClient()
  const [lightbox, setLightbox] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  // Fetch post
  const postQuery = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${slug}/`)
      return data
    },
  })

  // Fetch comments
  const commentsQuery = useQuery({
    queryKey: ['comments', slug],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${slug}/comments/`)
      return data
    },
  })

  if (postQuery.isLoading) return <DetailSkeleton />

  if (postQuery.isError) {
    return (
      <div className="page-wrapper">
        <div className="container text-center py-5">
          <i className="bi bi-exclamation-circle" style={{ fontSize: '3rem', color: '#dc2626' }}></i>
          <p className="text-danger mt-3">Post not found or failed to load.</p>
          <Link to="/" className="btn btn-accent px-4">Back to Home</Link>
        </div>
      </div>
    )
  }

  const post     = postQuery.data
  const comments = commentsQuery.data?.results ?? commentsQuery.data ?? []
  const gallery  = post.photos ?? post.gallery ?? []
  const isAuthor = user && (user.id === post.author?.id || user.username === post.author?.username)

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    setDeleteError('')
    try {
      await api.delete(`/posts/${slug}/`)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['my-posts'] })
      navigate('/')
    } catch {
      setDeleteError('Failed to delete the post.')
    }
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 860 }}>

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb" style={{ fontSize: '0.82rem' }}>
            <li className="breadcrumb-item"><Link to="/" style={{ color: 'var(--sky-blue)' }}>Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{post.title}</li>
          </ol>
        </nav>

        {deleteError && (
          <div className="alert alert-danger mb-3">{deleteError}</div>
        )}

        {/* Cover image */}
        {post.cover_image
          ? <img src={post.cover_image} alt={post.title} className="post-cover mb-4" />
          : (
            <div className="post-cover-placeholder mb-4">
              <i className="bi bi-send-fill"></i>
            </div>
          )
        }

        {/* Title + badges + actions */}
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
          <div className="flex-grow-1">
            <div className="d-flex flex-wrap gap-2 mb-2">
              {post.category?.name && <span className="badge-cat">{post.category.name}</span>}
              {post.status === 'draft' && (
                <span className="badge-status-draft">Draft</span>
              )}
            </div>
            <h1 className="h2 fw-bold mb-0" style={{ color: 'var(--sky-dark)', lineHeight: 1.25 }}>
              {post.title}
            </h1>
          </div>

          {isAuthor && (
            <div className="d-flex gap-2 flex-shrink-0">
              <Link to={`/edit/${slug}`} className="btn btn-sm btn-outline-secondary">
                <i className="bi bi-pencil me-1"></i>Upravit
              </Link>
              <Link to={`/post/${slug}/photos`} className="btn btn-sm btn-outline-primary">
                <i className="bi bi-camera me-1"></i>Přidat fotky
              </Link>
              <button className="btn btn-sm btn-outline-danger" onClick={handleDelete}>
                <i className="bi bi-trash me-1"></i>Smazat
              </button>
            </div>
          )}
        </div>

        {/* Author + date */}
        <div className="d-flex flex-wrap align-items-center gap-3 mb-4" style={{ color: '#64748b', fontSize: '0.85rem' }}>
          <span>
            <i className="bi bi-person-circle me-1"></i>
            <strong>{post.author?.username}</strong>
          </span>
          <span><i className="bi bi-calendar3 me-1"></i>{formatDate(post.created_at)}</span>
          {post.tags && post.tags.length > 0 && (
            <div className="d-flex flex-wrap gap-1">
              {post.tags.map((t, i) => (
                <span key={i} className="tag-pill">#{typeof t === 'string' ? t : t.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* Drone meta box */}
        {(post.location || post.altitude || post.drone_model) && (
          <div className="drone-meta mb-4">
            <div className="d-flex flex-wrap gap-4">
              {post.location && (
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-geo-alt-fill meta-icon"></i>
                  <div>
                    <div className="meta-label">Location</div>
                    <div className="meta-value">{post.location}</div>
                  </div>
                </div>
              )}
              {post.altitude && (
                <>
                  <hr className="my-0 d-none d-sm-block" style={{ borderColor: 'rgba(0,212,255,0.12)', width: 1, height: 'auto', opacity: 1, border: 'none', borderLeft: '1px solid rgba(0,212,255,0.18)' }} />
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-arrow-up-circle-fill meta-icon"></i>
                    <div>
                      <div className="meta-label">Altitude</div>
                      <div className="meta-value">{post.altitude} m</div>
                    </div>
                  </div>
                </>
              )}
              {post.drone_model && (
                <>
                  <hr className="my-0 d-none d-sm-block" style={{ borderColor: 'rgba(0,212,255,0.12)', width: 1, height: 'auto', opacity: 1, border: 'none', borderLeft: '1px solid rgba(0,212,255,0.18)' }} />
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-cpu-fill meta-icon"></i>
                    <div>
                      <div className="meta-label">Drone</div>
                      <div className="meta-value">{post.drone_model}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p className="lead mb-4" style={{ color: '#475569', fontStyle: 'italic', borderLeft: '3px solid var(--accent)', paddingLeft: '1rem' }}>
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        {post.content && (
          <div className="content-body mb-5">{post.content}</div>
        )}

        {/* Photo gallery */}
        {gallery.length > 0 && (
          <section className="mb-5">
            <h2 className="section-title">
              <i className="bi bi-images me-2" style={{ color: 'var(--accent)' }}></i>
              Photo Gallery
            </h2>
            <div className="gallery-grid">
              {gallery.map((photo, i) => (
                <img
                  key={i}
                  src={photo.image || photo}
                  alt={photo.caption || `Photo ${i + 1}`}
                  className="gallery-img"
                  onClick={() => setLightbox(typeof photo === 'string' ? { image: photo } : photo)}
                />
              ))}
            </div>
          </section>
        )}

        <hr style={{ borderColor: '#e2e8f0' }} />

        {/* Comments section */}
        <section className="mt-4 mb-2">
          <h2 className="section-title">
            <i className="bi bi-chat-dots me-2" style={{ color: 'var(--accent)' }}></i>
            Comments
            {comments.length > 0 && (
              <span className="ms-2 badge bg-light text-secondary" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {comments.length}
              </span>
            )}
          </h2>

          {commentsQuery.isLoading && (
            <div className="d-flex flex-column gap-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 70, borderRadius: 10 }} />
              ))}
            </div>
          )}

          {!commentsQuery.isLoading && comments.length === 0 && (
            <p className="text-muted small">No comments yet. Be the first!</p>
          )}

          <div className="d-flex flex-column gap-3">
            {comments.map((comment, i) => (
              <div key={comment.id ?? i} className="comment-card">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: 30, height: 30,
                      background: 'var(--sky-blue)',
                      color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                    }}
                  >
                    {(comment.author?.username || 'A')[0].toUpperCase()}
                  </span>
                  <span className="comment-author">{comment.author?.username}</span>
                  <span className="comment-date ms-auto">{formatDate(comment.created_at)}</span>
                </div>
                <p className="comment-body mb-0">{comment.body}</p>
              </div>
            ))}
          </div>

          {/* Add comment */}
          {user
            ? (
              <div className="mt-4">
                <h3 className="h6 fw-bold mb-2" style={{ color: 'var(--sky-dark)' }}>Leave a comment</h3>
                <CommentForm
                  slug={slug}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ['comments', slug] })}
                />
              </div>
            )
            : (
              <p className="text-muted small mt-3">
                <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link> to leave a comment.
              </p>
            )
          }
        </section>

      </div>

      {/* Lightbox */}
      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}
