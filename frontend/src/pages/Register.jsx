import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '', password: '', password2: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.username.trim())  errs.username  = 'Username is required.'
    if (!form.email.trim())     errs.email     = 'Email is required.'
    if (!form.password)         errs.password  = 'Password is required.'
    if (form.password !== form.password2) errs.password2 = 'Passwords do not match.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const mapped = {}
        for (const [key, val] of Object.entries(data)) {
          mapped[key] = Array.isArray(val) ? val.join(' ') : String(val)
        }
        setErrors(mapped)
      } else {
        setErrors({ general: 'Registration failed. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center py-5"
      style={{ minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(135deg, var(--sky-dark) 0%, #112240 100%)' }}
    >
      <div className="w-100" style={{ maxWidth: 480, padding: '1rem' }}>

        {/* Icon + heading */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: 68, height: 68, background: 'rgba(0,212,255,0.12)', border: '2px solid rgba(0,212,255,0.3)' }}
          >
            <i className="bi bi-person-plus-fill" style={{ fontSize: '1.8rem', color: 'var(--accent)' }}></i>
          </div>
          <h1 className="h4 fw-bold text-white mb-1">Create account</h1>
          <p className="text-white-50 small">Join DroneLens and share your aerial shots</p>
        </div>

        <div className="auth-card p-4 p-md-5">
          {errors.general && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Row: first + last name */}
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label htmlFor="first_name" className="form-label">First name</label>
                <input
                  id="first_name" name="first_name" type="text"
                  className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                  placeholder="Ada"
                  value={form.first_name}
                  onChange={handleChange}
                />
                {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
              </div>
              <div className="col-6">
                <label htmlFor="last_name" className="form-label">Last name</label>
                <input
                  id="last_name" name="last_name" type="text"
                  className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                  placeholder="Lovelace"
                  value={form.last_name}
                  onChange={handleChange}
                />
                {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input
                id="username" name="username" type="text"
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                placeholder="coolpilot42"
                value={form.username}
                onChange={handleChange}
                required
                autoFocus
              />
              {errors.username && <div className="invalid-feedback">{errors.username}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input
                id="email" name="email" type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="pilot@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input
                id="password" name="password" type="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="mb-4">
              <label htmlFor="password2" className="form-label">Confirm password <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input
                id="password2" name="password2" type="password"
                className={`form-control ${errors.password2 ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={form.password2}
                onChange={handleChange}
                required
              />
              {errors.password2 && <div className="invalid-feedback">{errors.password2}</div>}
            </div>

            <button
              type="submit"
              className="btn btn-accent w-100 py-2"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Creating account…</>
                : <><i className="bi bi-person-check me-2"></i>Create Account</>
              }
            </button>
          </form>

          <hr style={{ borderColor: 'rgba(0,212,255,0.12)', margin: '1.5rem 0' }} />

          <p className="text-center mb-0" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
