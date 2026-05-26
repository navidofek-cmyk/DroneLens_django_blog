import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from '../../components/Navbar'
import { renderWithProviders, mockLoggedIn, mockLoggedOut } from '../helpers'

describe('Navbar', () => {

  beforeEach(() => mockLoggedOut())

  it('zobrazí název DroneView / DroneLens', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByText(/DroneLens|DroneView/i)).toBeInTheDocument()
  })

  it('zobrazí odkaz Login pro nepřihlášeného', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByText(/Login/i)).toBeInTheDocument()
  })

  it('zobrazí odkaz Register pro nepřihlášeného', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByText(/Register/i)).toBeInTheDocument()
  })

  it('nezobrazí "New Post" pro nepřihlášeného', () => {
    renderWithProviders(<Navbar />)
    expect(screen.queryByText(/New Post/i)).not.toBeInTheDocument()
  })

  it('zobrazí username po přihlášení', async () => {
    mockLoggedIn('fake.access.token')
    renderWithProviders(<Navbar />)
    await waitFor(() => {
      expect(screen.getByText('ivan_dron')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí "New Post" po přihlášení', async () => {
    mockLoggedIn('fake.access.token')
    renderWithProviders(<Navbar />)
    await waitFor(() => {
      // Navbar má "New Post" v nav i v dropdown — použij getAllByText
      expect(screen.getAllByText(/New Post/i).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('zobrazí "My Posts" po přihlášení', async () => {
    mockLoggedIn('fake.access.token')
    renderWithProviders(<Navbar />)
    await waitFor(() => {
      expect(screen.getAllByText(/My Posts/i).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

})
