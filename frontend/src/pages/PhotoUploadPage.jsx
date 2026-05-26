import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import PhotoUploader from '../components/PhotoUploader'

export default function PhotoUploadPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => api.get(`/posts/${slug}/`).then(r => r.data),
  })

  if (isLoading) return (
    <div className="text-center py-5">
      <div className="spinner-border" style={{ color: 'var(--accent)' }} />
    </div>
  )

  return (
    <div className="row justify-content-center">
      <div className="col-lg-10">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1">
              <i className="bi bi-images me-2" style={{ color: 'var(--accent)' }} />
              Nahrát fotografie
            </h3>
            <p className="text-muted mb-0">
              Článek: <strong>{post?.title}</strong>
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate(`/post/${slug}`)}
          >
            <i className="bi bi-arrow-left me-1" />
            Zpět na článek
          </button>
        </div>

        {/* Uploader */}
        <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 16 }}>
          <PhotoUploader
            postSlug={slug}
            onUploaded={(photos) => {
              if (photos.length > 0) {
                navigate(`/post/${slug}`)
              }
            }}
          />
        </div>

        {/* Tip */}
        <div className="alert alert-info mt-3 border-0" style={{ borderRadius: 12 }}>
          <i className="bi bi-lightbulb me-2" />
          <strong>Tip:</strong> Z DJI fotek se automaticky načte GPS poloha a výška letu z EXIF dat.
        </div>

      </div>
    </div>
  )
}
