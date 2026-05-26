import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-md navbar-drone sticky-top">
      <div className="container">
        {/* Brand */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
          <i className="bi bi-send-fill" style={{ transform: 'rotate(-45deg)', display: 'inline-block' }}></i>
          DroneLens
        </Link>

        {/* Mobile toggler */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Links */}
        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav me-auto mb-2 mb-md-0">
            <li className="nav-item">
              <NavLink to="/" className="nav-link" end>
                <i className="bi bi-house me-1"></i>Home
              </NavLink>
            </li>

            {user && (
              <>
                <li className="nav-item">
                  <NavLink to="/new" className="nav-link">
                    <i className="bi bi-plus-circle me-1"></i>New Post
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/my-posts" className="nav-link">
                    <i className="bi bi-collection me-1"></i>My Posts
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          {/* Right side */}
          <ul className="navbar-nav ms-auto mb-2 mb-md-0">
            {user ? (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle d-flex align-items-center gap-1 bg-transparent border-0"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ cursor: 'pointer' }}
                >
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: 30,
                      height: 30,
                      background: 'var(--accent)',
                      color: 'var(--sky-dark)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {(user.username || 'U')[0].toUpperCase()}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.9rem' }}>
                    {user.username}
                  </span>
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="userDropdown"
                >
                  <li>
                    <Link to="/my-posts" className="dropdown-item">
                      <i className="bi bi-collection me-2"></i>My Posts
                    </Link>
                  </li>
                  <li>
                    <Link to="/new" className="dropdown-item">
                      <i className="bi bi-plus-circle me-2"></i>New Post
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link">
                    <i className="bi bi-person me-1"></i>Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/register" className="nav-link">
                    <i className="bi bi-person-plus me-1"></i>Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
