import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../../pages/Register'
import { renderWithProviders, mockLoggedOut } from '../helpers'

describe('Register', () => {

  beforeEach(() => mockLoggedOut())

  it('renderuje pole username', () => {
    renderWithProviders(<Register />, { initialEntries: ['/register'] })
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
  })

  it('renderuje pole email', () => {
    renderWithProviders(<Register />, { initialEntries: ['/register'] })
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renderuje dvě pole pro heslo', () => {
    renderWithProviders(<Register />, { initialEntries: ['/register'] })
    expect(screen.getAllByLabelText(/password|heslo/i).length).toBeGreaterThanOrEqual(2)
  })

  it('zobrazí tlačítko pro registraci', () => {
    renderWithProviders(<Register />, { initialEntries: ['/register'] })
    expect(screen.getByRole('button', { name: /register|registr/i })).toBeInTheDocument()
  })

  it('obsahuje odkaz zpět na přihlášení', () => {
    renderWithProviders(<Register />, { initialEntries: ['/register'] })
    // Odkaz na login stránku
    const links = screen.getAllByRole('link')
    const loginLink = links.find(l => l.href?.includes('/login') || l.textContent?.match(/login|přihlás/i))
    expect(loginLink).toBeDefined()
  })

  it('zobrazí chybu při neshodě hesel (klientská validace)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Register />, { initialEntries: ['/register'] })

    await user.type(screen.getByLabelText(/username/i), 'testpilot')
    const passwords = screen.getAllByLabelText(/password|heslo/i)
    await user.type(passwords[0], 'heslo1234')
    await user.type(passwords[1], 'jine5678')
    await user.click(screen.getByRole('button', { name: /register|registr/i }))

    await waitFor(() => {
      const body = document.body.innerHTML
      expect(body).toMatch(/neshodují|mismatch|match|neodpovídají/i)
    })
  })

  it('úspěšná registrace uloží access token', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Register />, { initialEntries: ['/register'] })

    await user.type(screen.getByLabelText(/username/i), 'novy_pilot')
    await user.type(screen.getByLabelText(/email/i), 'novy@test.cz')
    const passwords = screen.getAllByLabelText(/password|heslo/i)
    await user.type(passwords[0], 'heslo1234')
    await user.type(passwords[1], 'heslo1234')
    await user.click(screen.getByRole('button', { name: /register|registr/i }))

    await waitFor(() => {
      expect(localStorage.getItem('access')).toBeTruthy()
    }, { timeout: 5000 })
  })

})
