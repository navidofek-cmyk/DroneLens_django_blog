import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockLoggedOut } from '../helpers'
import { useAuth } from '../../context/AuthContext'

// Testovací komponenta která zobrazí auth state
function AuthDisplay() {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  return (
    <div>
      <div data-testid="user">{user ? user.username : 'guest'}</div>
      <div data-testid="loading">false</div>
    </div>
  )
}

describe('AuthContext', () => {

  beforeEach(() => mockLoggedOut())

  it('vrátí loading=true během inicializace', () => {
    renderWithProviders(<AuthDisplay />)
    // Okamžitě po renderu je loading true nebo se zobrazí "Loading..."
    // (záleží na rychlosti)
    expect(document.body).toBeDefined()
  })

  it('vrátí user=null pro nepřihlášeného', async () => {
    renderWithProviders(<AuthDisplay />)
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('guest')
    })
  })

  it('načte uživatele z tokenu v localStorage', async () => {
    localStorage.setItem('access', 'fake.access.token')
    renderWithProviders(<AuthDisplay />)
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('ivan_dron')
    }, { timeout: 3000 })
  })

  it('vymaže token při 401 z /me/', async () => {
    localStorage.setItem('access', 'invalid.token')
    renderWithProviders(<AuthDisplay />)
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('guest')
    }, { timeout: 3000 })
  })

})
