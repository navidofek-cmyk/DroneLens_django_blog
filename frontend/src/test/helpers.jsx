import { render } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../context/AuthContext'

/**
 * Renderuje komponentu s všemi potřebnými providery.
 * @param {ReactElement} ui
 * @param {{ route?: string, initialEntries?: string[] }} options
 */
export function renderWithProviders(ui, { route = '/', initialEntries } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  const Router = initialEntries
    ? ({ children }) => <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    : ({ children }) => <BrowserRouter>{children}</BrowserRouter>

  return render(
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>{ui}</AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

/**
 * Simuluje přihlášeného uživatele přes localStorage.
 */
export function mockLoggedIn(token = 'fake.access.token') {
  localStorage.setItem('access', token)
}

export function mockLoggedOut() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}
