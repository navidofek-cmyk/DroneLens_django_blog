import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'

const EMPTY_FORM = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tags_input: '',
  status: 'draft',
  location: '',
  altitude: '',
  drone_model: '',
}

export default function PostForm({ editMode = false }) {
  const { slug }   = useParams()
  const navigate   = useNavigate()
  const fileRef    = useRef(null)

  const [form, setForm]           = useState(EMPTY_FORM)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [errors, setErrors]       = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [loadingPost, setLoadingPost] = useState(editMode)

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories/')
      return data
    },
  })

  const categories = categoriesQuery.data?.results ?? categoriesQuery.data ?? []

  // Load existing post when editing
  useEffect(() => {
    if (!editMode || !slug) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingPost(true)
    api.get(`/posts/${slug}/`)
      .then(({ data }) => {
        setForm({
          title:       data.title       ?? '',
          excerpt:     data.excerpt     ?? '',
          content:     data.content     ?? '',
          category:    data.category    != null ? String(data.category) : '',
          tags_input:  Array.isArray(data.tags)
            ? data.tags.map(t => (typeof t === 'string' ? t : t.name)).join(', ')
            : (data.tags_input ?? ''),
          status:      data.status      ?? 'draft',
          location:    data.location    ?? '',
          altitude:    data.altitude    != null ? String(data.altitude) : '',
          drone_model: data.drone_model ?? '',
        })
        if (data.cover_image) setCoverPreview(data.cover_image)
      })
      .catch(() => setErrors({ general: 'Failed to load post data.' }))
      .finally(() => setLoadingPost(false))
  }, [editMode, slug])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const reader = new FileReader()
    reader.onload = ev => setCoverPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function removeCover() {
    setCoverFile(null)
    setCoverPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Basic client validation
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required.'
    if (!form.content.trim()) errs.content = 'Content is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setErrors({})

    try {
      const fd = new FormData()
      fd.append('title',       form.title)
      fd.append('excerpt',     form.excerpt)
      fd.append('content',     form.content)
      if (form.category)   fd.append('category',    form.category)
      if (form.tags_input) fd.append('tags_input',  form.tags_input)
      fd.append('status',      form.status)
      if (form.location)   fd.append('location',    form.location)
      if (form.altitude)   fd.append('altitude',    form.altitude)
      if (form.drone_model) fd.append('drone_model', form.drone_model)
      if (coverFile)       fd.append('cover_image', coverFile)

      let savedSlug
      if (editMode && slug) {
        const { data } = await api.patch(`/posts/${slug}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        savedSlug = data.slug
      } else {
        const { data } = await api.post('/posts/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        savedSlug = data.slug
      }

      navigate(`/post/${savedSlug}`)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const mapped = {}
        for (const [key, val] of Object.entries(data)) {
          mapped[key] = Array.isArray(val) ? val.join(' ') : String(val)
        }
        setErrors(mapped)
      } else {
        setErrors({ general: 'Could not save the post. Please try again.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingPost) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="skeleton mb-3" style={{ height: 40, width: '50%' }} />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton mb-3" style={{ height: 48 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: 760 }}>

        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{ width: 46, height: 46, background: 'var(--sky-dark)', border: '2px solid rgba(0,212,255,0.3)' }}
          >
            <i className="bi bi-send-fill" style={{ color: 'var(--accent)', fontSize: '1.1rem', transform: 'rotate(-45deg)', display: 'inline-block' }}></i>
          </div>
          <div>
            <h1 className="h3 fw-bold mb-0" style={{ color: 'var(--sky-dark)' }}>
              {editMode ? 'Edit Post' : 'New Post'}
            </h1>
            <p className="text-muted small mb-0">
              {editMode ? 'Update your aerial story' : 'Share a new aerial adventure'}
            </p>
          </div>
        </div>

        <div className="form-page-card p-4 p-md-5">
          {errors.general && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
              <i className="bi bi-exclamation-triangle-fill"></i>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="form-label fw-semibold">
                Title <span className="text-danger">*</span>
              </label>
              <input
                id="title" name="title" type="text"
                className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
                placeholder="A stunning aerial view of…"
                value={form.title}
                onChange={handleChange}
                required
                style={{ borderRadius: 8 }}
              />
              {errors.title && <div className="invalid-feedback">{errors.title}</div>}
            </div>

            {/* Cover image */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Cover Image</label>
              {coverPreview && (
                <div className="position-relative mb-2" style={{ display: 'inline-block' }}>
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    style={{ height: 160, maxWidth: '100%', objectFit: 'cover', borderRadius: 10, display: 'block' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute"
                    style={{ top: 6, right: 6 }}
                    onClick={removeCover}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleFileChange}
                style={{ borderRadius: 8 }}
              />
              <div className="form-text">JPG, PNG or WebP. Recommended: 1200 × 630 px.</div>
            </div>

            {/* Excerpt */}
            <div className="mb-4">
              <label htmlFor="excerpt" className="form-label fw-semibold">Excerpt</label>
              <textarea
                id="excerpt" name="excerpt"
                className="form-control"
                rows={2}
                placeholder="A short description shown in the post list…"
                value={form.excerpt}
                onChange={handleChange}
                style={{ borderRadius: 8, resize: 'vertical' }}
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label htmlFor="content" className="form-label fw-semibold">
                Content <span className="text-danger">*</span>
              </label>
              <textarea
                id="content" name="content"
                className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                rows={10}
                placeholder="Tell the story behind this flight…"
                value={form.content}
                onChange={handleChange}
                required
                style={{ borderRadius: 8, resize: 'vertical' }}
              />
              {errors.content && <div className="invalid-feedback">{errors.content}</div>}
            </div>

            {/* Category + Status row */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label htmlFor="category" className="form-label fw-semibold">Category</label>
                <select
                  id="category" name="category"
                  className="form-select"
                  value={form.category}
                  onChange={handleChange}
                  style={{ borderRadius: 8 }}
                >
                  <option value="">— Select category —</option>
                  {categories.map(cat => (
                    <option key={cat.id || cat.slug} value={String(cat.id || cat.slug)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="status" className="form-label fw-semibold">Status</label>
                <select
                  id="status" name="status"
                  className="form-select"
                  value={form.status}
                  onChange={handleChange}
                  style={{ borderRadius: 8 }}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label htmlFor="tags_input" className="form-label fw-semibold">Tags</label>
              <input
                id="tags_input" name="tags_input" type="text"
                className="form-control"
                placeholder="landscape, sunrise, dji-mini-4-pro"
                value={form.tags_input}
                onChange={handleChange}
                style={{ borderRadius: 8 }}
              />
              <div className="form-text">Comma-separated list of tags.</div>
            </div>

            {/* Drone details section */}
            <div
              className="p-4 mb-4 rounded-3"
              style={{ background: 'var(--sky-dark)', border: '1px solid rgba(0,212,255,0.15)' }}
            >
              <h2 className="h6 fw-bold mb-3" style={{ color: 'var(--accent)' }}>
                <i className="bi bi-cpu me-2"></i>Flight Details
              </h2>
              <div className="row g-3">
                <div className="col-md-5">
                  <label htmlFor="location" className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                    Location
                  </label>
                  <input
                    id="location" name="location" type="text"
                    className="form-control"
                    placeholder="Brno, Czech Republic"
                    value={form.location}
                    onChange={handleChange}
                    style={{ borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', color: '#fff' }}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="altitude" className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                    Altitude (m)
                  </label>
                  <input
                    id="altitude" name="altitude" type="number"
                    className="form-control"
                    placeholder="120"
                    min="0"
                    max="10000"
                    value={form.altitude}
                    onChange={handleChange}
                    style={{ borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', color: '#fff' }}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="drone_model" className="form-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                    Drone Model
                  </label>
                  <input
                    id="drone_model" name="drone_model" type="text"
                    className="form-control"
                    placeholder="DJI Mini 4 Pro"
                    value={form.drone_model}
                    onChange={handleChange}
                    style={{ borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', color: '#fff' }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-3 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={() => navigate(editMode && slug ? `/post/${slug}` : '/')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-accent px-5 py-2"
                disabled={submitting}
              >
                {submitting
                  ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving…</>
                  : editMode
                    ? <><i className="bi bi-check2-circle me-2"></i>Save Changes</>
                    : <><i className="bi bi-send me-2"></i>Publish Post</>
                }
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
