import { useState, useRef, useCallback } from 'react'
import exifr from 'exifr'
import api from '../api/axios'

/**
 * Drag & drop multi-photo uploader s EXIF čtením.
 * Props:
 *   postSlug  — slug článku kam se fotky nahrávají
 *   onUploaded(photos) — callback po úspěšném uploadu
 */
export default function PhotoUploader({ postSlug, onUploaded }) {
  const [files, setFiles]       = useState([])   // { file, preview, caption, exif, status }
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  // ── Zpracuj vybrané soubory ──────────────────────────────────────────────
  const processFiles = useCallback(async (rawFiles) => {
    const items = await Promise.all(
      Array.from(rawFiles).filter(f => f.type.startsWith('image/')).map(async (file) => {
        const preview = URL.createObjectURL(file)

        // Přečti EXIF data z fotky (GPS, kamera, datum…)
        let exif = {}
        try {
          exif = await exifr.parse(file, {
            pick: ['Make', 'Model', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
                   'DateTimeOriginal', 'ImageWidth', 'ImageHeight']
          }) || {}
        } catch { /* EXIF nemusí být přítomno */ }

        return { file, preview, caption: '', exif, status: 'pending' }
      })
    )
    setFiles(prev => [...prev, ...items])
  }, [])

  // ── Drag & drop handlery ─────────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  // ── Upload všech fotek ───────────────────────────────────────────────────
  const uploadAll = async () => {
    const pending = files.filter(f => f.status === 'pending')
    const uploaded = []

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i]

      // Ukaž progress
      setFiles(prev => prev.map(f =>
        f.file === item.file ? { ...f, status: 'uploading' } : f
      ))

      try {
        const formData = new FormData()
        formData.append('image', item.file)
        formData.append('caption', item.caption)
        formData.append('order', i)

        const { data } = await api.post(
          `/posts/${postSlug}/photos/`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )

        setFiles(prev => prev.map(f =>
          f.file === item.file ? { ...f, status: 'done' } : f
        ))
        uploaded.push(data)

      } catch {
        setFiles(prev => prev.map(f =>
          f.file === item.file ? { ...f, status: 'error' } : f
        ))
      }
    }

    if (uploaded.length > 0 && onUploaded) onUploaded(uploaded)
  }

  const removeFile = (file) => {
    setFiles(prev => prev.filter(f => f.file !== file))
  }

  const updateCaption = (file, caption) => {
    setFiles(prev => prev.map(f => f.file === file ? { ...f, caption } : f))
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const doneCount    = files.filter(f => f.status === 'done').length

  return (
    <div>
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : '#ced4da'}`,
          borderRadius: 12,
          background: dragging ? 'rgba(0,212,255,.05)' : '#f8f9fa',
          padding: '2.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all .2s',
        }}
      >
        <i className="bi bi-cloud-arrow-up" style={{ fontSize: '2.5rem', color: dragging ? 'var(--accent)' : '#adb5bd' }} />
        <p className="mb-1 mt-2 fw-bold">
          {dragging ? 'Pusť fotky zde!' : 'Přetáhni fotky nebo klikni pro výběr'}
        </p>
        <p className="text-muted small mb-0">JPG, PNG, HEIC — více fotek najednou</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="d-none"
          onChange={e => processFiles(e.target.files)}
        />
      </div>

      {/* Náhled fotek */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">
              {files.length} foto{files.length > 4 ? 'grafií' : files.length > 1 ? 'grafie' : 'grafie'}
              {doneCount > 0 && <span className="text-success ms-2">({doneCount} nahráno ✓)</span>}
            </h6>
            {pendingCount > 0 && (
              <button className="btn btn-primary btn-sm px-3" onClick={uploadAll}>
                <i className="bi bi-cloud-upload me-1" />
                Nahrát {pendingCount} {pendingCount === 1 ? 'fotku' : 'fotek'}
              </button>
            )}
          </div>

          <div className="row g-3">
            {files.map(({ file, preview, caption, exif, status }) => (
              <div className="col-6 col-md-4 col-lg-3" key={file.name + file.size}>
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 10, overflow: 'hidden' }}>

                  {/* Náhled obrázku */}
                  <div style={{ position: 'relative' }}>
                    <img
                      src={preview}
                      alt={file.name}
                      style={{ width: '100%', height: 150, objectFit: 'cover' }}
                    />
                    {/* Status overlay */}
                    {status === 'uploading' && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <div className="spinner-border text-light spinner-border-sm" />
                      </div>
                    )}
                    {status === 'done' && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,200,100,.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <i className="bi bi-check-circle-fill text-white" style={{ fontSize: '2rem' }} />
                      </div>
                    )}
                    {status === 'error' && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(200,0,0,.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <i className="bi bi-x-circle-fill text-white" style={{ fontSize: '2rem' }} />
                      </div>
                    )}
                    {/* Smazat */}
                    {status !== 'uploading' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeFile(file)}
                        style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px', fontSize: '0.75rem' }}
                      >
                        <i className="bi bi-x" />
                      </button>
                    )}
                  </div>

                  <div className="card-body p-2">
                    {/* EXIF info */}
                    {(exif.GPSLatitude || exif.Make || exif.GPSAltitude) && (
                      <div className="mb-2 small" style={{ color: 'var(--accent2)' }}>
                        {exif.Make && (
                          <div><i className="bi bi-camera me-1" />{exif.Make} {exif.Model || ''}</div>
                        )}
                        {exif.GPSAltitude && (
                          <div><i className="bi bi-arrow-up me-1" />{Math.round(exif.GPSAltitude)} m</div>
                        )}
                        {exif.GPSLatitude && (
                          <div>
                            <i className="bi bi-geo-alt me-1" />
                            {exif.GPSLatitude.toFixed(4)}, {exif.GPSLongitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Popis */}
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Popis fotky..."
                      value={caption}
                      onChange={e => updateCaption(file, e.target.value)}
                      disabled={status !== 'pending'}
                    />

                    {/* Název souboru */}
                    <div className="text-muted mt-1" style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
