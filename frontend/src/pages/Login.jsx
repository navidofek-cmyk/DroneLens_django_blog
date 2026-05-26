import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Login failed. Check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(135deg, var(--sky-dark) 0%, #112240 100%)' }}
    >
      <div className="w-100" style={{ maxWidth: 420, padding: '1rem' }}>

        {/* Icon + heading */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: 68, height: 68, background: 'rgba(0,212,255,0.12)', border: '2px solid rgba(0,212,255,0.3)' }}
          >
            <i className="bi bi-send-fill" style={{ fontSize: '2rem', color: 'var(--accent)', transform: 'rotate(-45deg)', display: 'inline-block' }}></i>
          </div>
          <h1 className="h4 fw-bold text-white mb-1">Welcome back</h1>
          <p className="text-white-50 small">Sign in to your DroneLens account</p>
        </div>

        <div className="auth-card p-4 p-md-5">
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                className="form-control"
                placeholder="your_username"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-accent w-100 py-2"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Signing in…</>
                : <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
              }
            </button>
          </form>

          <hr style={{ borderColor: 'rgba(0,212,255,0.12)', margin: '1.5rem 0' }} />

          <p className="text-center mb-0" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
