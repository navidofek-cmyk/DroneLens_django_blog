import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../../pages/Login'
import { renderWithProviders, mockLoggedOut } from '../helpers'

describe('Login', () => {

  beforeEach(() => mockLoggedOut())

  it('renderuje formulář s poli username a password', () => {
    renderWithProviders(<Login />, { initialEntries: ['/login'] })
    expect(screen.getByLabelText(/username|jméno/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password|heslo/i)).toBeInTheDocument()
  })

  it('obsahuje tlačítko pro odeslání', () => {
    renderWithProviders(<Login />, { initialEntries: ['/login'] })
    expect(screen.getByRole('button', { name: /přihlásit|login|sign in/i })).toBeInTheDocument()
  })

  it('zobrazí chybu při špatném heslu', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />, { initialEntries: ['/login'] })

    await user.type(screen.getByLabelText(/username|jméno/i), 'ivan_dron')
    await user.type(screen.getByLabelText(/password|heslo/i), 'spatne_heslo')
    await user.click(screen.getByRole('button', { name: /přihlásit|login|sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/No active account|neplatné|invalid/i)).toBeInTheDocument()
    })
  })

  it('úspěšné přihlášení uloží tokeny do localStorage', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />, { initialEntries: ['/login'] })

    await user.type(screen.getByLabelText(/username|jméno/i), 'ivan_dron')
    await user.type(screen.getByLabelText(/password|heslo/i), 'dron1234')
    await user.click(screen.getByRole('button', { name: /přihlásit|login|sign in/i }))

    await waitFor(() => {
      expect(localStorage.getItem('access')).toBeTruthy()
    })
  })

  it('obsahuje odkaz na registraci', () => {
    renderWithProviders(<Login />, { initialEntries: ['/login'] })
    expect(screen.getByRole('link', { name: /register|registr/i })).toBeInTheDocument()
  })

})
