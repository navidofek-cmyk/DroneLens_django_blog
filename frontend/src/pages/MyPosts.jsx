import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function StatusBadge({ status }) {
  if (status === 'published') {
    return <span className="badge-status-published"><i className="bi bi-check-circle me-1"></i>Published</span>
  }
  return <span className="badge-status-draft"><i className="bi bi-pencil me-1"></i>Draft</span>
}

export default function MyPosts() {
  const queryClient = useQueryClient()
  const [deletingSlug, setDeletingSlug] = useState(null)
  const [deleteError, setDeleteError]   = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-posts'],
    queryFn: async () => {
      const { data } = await api.get('/posts/my/')
      return data
    },
  })

  const posts = data?.results ?? data ?? []

  async function handleDelete(slug) {
    if (!window.confirm('Delete this post? This action cannot be undone.')) return
    setDeletingSlug(slug)
    setDeleteError('')
    try {
      await api.delete(`/posts/${slug}/`)
      queryClient.invalidateQueries({ queryKey: ['my-posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    } catch {
      setDeleteError('Failed to delete the post. Please try again.')
    } finally {
      setDeletingSlug(null)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="container">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--sky-dark)' }}>
              <i className="bi bi-collection me-2" style={{ color: 'var(--accent)' }}></i>
              My Posts
            </h1>
            <p className="text-muted small mb-0">Manage your aerial photo posts</p>
          </div>
          <Link to="/new" className="btn btn-accent px-4 py-2">
            <i className="bi bi-plus-lg me-2"></i>New Post
          </Link>
        </div>

        {deleteError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            {deleteError}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="d-flex flex-column gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="alert alert-danger">Failed to load your posts.</div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && posts.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-send-fill" style={{ fontSize: '4rem', color: 'var(--sky-blue)', opacity: 0.18 }}></i>
            <p className="text-muted mt-3 mb-4">You haven&apos;t created any posts yet.</p>
            <Link to="/new" className="btn btn-accent px-5">
              <i className="bi bi-plus-lg me-2"></i>Create your first post
            </Link>
          </div>
        )}

        {/* Table */}
        {!isLoading && posts.length > 0 && (
          <div className="rounded-3 overflow-hidden shadow-sm">
            <table className="table mb-0 my-posts-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="d-none d-md-table-cell">Category</th>
                  <th>Status</th>
                  <th className="d-none d-sm-table-cell">Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.slug}>
                    <td>
                      <Link
                        to={`/post/${post.slug}`}
                        className="fw-semibold text-decoration-none"
                        style={{ color: 'var(--sky-dark)' }}
                      >
                        {post.title}
                      </Link>
                      {post.location && (
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-geo-alt me-1"></i>{post.location}
                        </div>
                      )}
                    </td>
                    <td className="d-none d-md-table-cell">
                      {post.category?.name
                        ? <span className="badge-cat">{post.category.name}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td><StatusBadge status={post.status} /></td>
                    <td className="d-none d-sm-table-cell text-muted">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <Link
                          to={`/edit/${post.slug}`}
                          className="btn btn-sm btn-outline-secondary"
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                          <span className="d-none d-lg-inline ms-1">Edit</span>
                        </Link>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => handleDelete(post.slug)}
                          disabled={deletingSlug === post.slug}
                        >
                          {deletingSlug === post.slug
                            ? <span className="spinner-border spinner-border-sm" role="status" />
                            : <i className="bi bi-trash"></i>
                          }
                          <span className="d-none d-lg-inline ms-1">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
