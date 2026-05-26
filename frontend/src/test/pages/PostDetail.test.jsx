import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import PostDetail from '../../pages/PostDetail'
import { renderWithProviders, mockLoggedIn, mockLoggedOut } from '../helpers'
import { server } from '../mocks/server'

// PostDetail používá useParams() — musí být v Route kontextu
function PostDetailRoute() {
  return (
    <Routes>
      <Route path="/post/:slug" element={<PostDetail />} />
      <Route path="*" element={<div>not found page</div>} />
    </Routes>
  )
}

describe('PostDetail', () => {

  beforeEach(() => mockLoggedOut())

  it('zobrazí titulek článku v nadpisu', async () => {
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/praha-z-vysky-120-metru'],
    })
    await waitFor(() => {
      // Title se vyskytuje v breadcrumb i h1 — hledáme heading
      expect(screen.getByRole('heading', { name: /Praha z výšky 120 metrů/ })).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí drone meta box s lokací', async () => {
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/praha-z-vysky-120-metru'],
    })
    await waitFor(() => {
      expect(screen.getByText(/Praha, Česká republika/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí model dronu', async () => {
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/praha-z-vysky-120-metru'],
    })
    await waitFor(() => {
      expect(screen.getByText(/DJI Mini 4 Pro/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí obsah článku', async () => {
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/praha-z-vysky-120-metru'],
    })
    await waitFor(() => {
      expect(screen.getByText(/historického centra Prahy/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí kategorii článku', async () => {
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/praha-z-vysky-120-metru'],
    })
    await waitFor(() => {
      expect(screen.getByText('Krajina')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí tagy', async () => {
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/praha-z-vysky-120-metru'],
    })
    await waitFor(() => {
      expect(screen.getByText('#DJI')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí sekci komentářů', async () => {
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/praha-z-vysky-120-metru'],
    })
    await waitFor(() => {
      expect(screen.getByText('Skvělé záběry!')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('nezobrazí tlačítka editace nepřihlášenému', async () => {
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/praha-z-vysky-120-metru'],
    })
    await waitFor(() => {
      expect(screen.queryByText(/Upravit|Edit/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí tlačítka editace autorovi', async () => {
    mockLoggedIn('fake.access.token')
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/praha-z-vysky-120-metru'],
    })
    await waitFor(() => {
      expect(screen.getByText(/Upravit|Edit/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('zobrazí chybový stav pro neexistující článek', async () => {
    renderWithProviders(<PostDetailRoute />, {
      initialEntries: ['/post/neexistujici-clanek'],
    })
    await waitFor(() => {
      expect(screen.getByText(/not found|nenalezen|failed to load/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

})
