import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container py-5 text-center">
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3rem', color: '#ef4444' }} />
          <h4 className="mt-3 fw-bold">Něco se pokazilo</h4>
          <p className="text-muted">{this.state.error.message}</p>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-clockwise me-1" />Obnovit stránku
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-3 text-start bg-dark text-danger p-3 rounded small overflow-auto">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
