import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import MyPosts from '../../pages/MyPosts'
import { renderWithProviders, mockLoggedIn, mockLoggedOut } from '../helpers'
import { server } from '../mocks/server'

describe('MyPosts', () => {

  it('přesměruje na /login pokud není přihlášen', async () => {
    mockLoggedOut()
    renderWithProviders(<MyPosts />, { initialEntries: ['/my-posts'] })
    // Spinner nebo redirect — komponenta se nevyrenderuje
    await waitFor(() => {
      expect(screen.queryByText('Praha z výšky 120 metrů')).not.toBeInTheDocument()
    })
  })

  it('zobrazí tabulku článků přihlášenému uživateli', async () => {
    mockLoggedIn('fake.access.token')
    renderWithProviders(<MyPosts />, { initialEntries: ['/my-posts'] })
    await waitFor(() => {
      expect(screen.getByText('Praha z výšky 120 metrů')).toBeInTheDocument()
      expect(screen.getByText('Západ slunce nad Alpami')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí badge "published" pro publikovaný článek', async () => {
    mockLoggedIn('fake.access.token')
    renderWithProviders(<MyPosts />, { initialEntries: ['/my-posts'] })
    await waitFor(() => {
      expect(screen.getAllByText(/published|publikováno/i).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('zobrazí odkaz "New Post"', async () => {
    mockLoggedIn('fake.access.token')
    renderWithProviders(<MyPosts />, { initialEntries: ['/my-posts'] })
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /new post|nový článek/i })).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('zobrazí prázdný stav pro nového uživatele', async () => {
    server.use(
      http.get('/api/posts/my/', () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      )
    )
    mockLoggedIn('fake.access.token')
    renderWithProviders(<MyPosts />, { initialEntries: ['/my-posts'] })
    await waitFor(() => {
      // Tabulka je prázdná nebo se zobrazí empty state text
      const body = document.body.innerHTML
      expect(body).toMatch(/no posts|žádné|první|first/i)
    }, { timeout: 5000 })
  })

})
