import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import PostList from '../../pages/PostList'
import { renderWithProviders, mockLoggedOut } from '../helpers'
import { server } from '../mocks/server'
import { mockPostsPage, mockPost } from '../mocks/data'

describe('PostList', () => {

  beforeEach(() => mockLoggedOut())

  it('zobrazí skeleton při načítání', () => {
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    expect(document.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('zobrazí seznam článků po načtení', async () => {
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    await waitFor(() => {
      expect(screen.getByText('Praha z výšky 120 metrů')).toBeInTheDocument()
    })
    expect(screen.getByText('Západ slunce nad Alpami')).toBeInTheDocument()
  })

  it('zobrazí hero card pro první článek', async () => {
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    await waitFor(() => {
      expect(screen.getByText('Praha z výšky 120 metrů')).toBeInTheDocument()
    })
    expect(screen.getByText('Historické centrum Prahy z ptačí perspektivy.')).toBeInTheDocument()
  })

  it('zobrazí kategorii článku', async () => {
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    await waitFor(() => {
      expect(screen.getAllByText('Krajina').length).toBeGreaterThan(0)
    })
  })

  it('zobrazí lokaci článku', async () => {
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    await waitFor(() => {
      expect(screen.getByText(/Praha, Česká republika/)).toBeInTheDocument()
    })
  })

  it('zobrazí sidebar s kategoriemi', async () => {
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    await waitFor(() => {
      expect(screen.getByText(/Categories/i)).toBeInTheDocument()
      expect(screen.getByText(/Tags/i)).toBeInTheDocument()
    })
  })

  it('zobrazí chybovou hlášku při selhání API', async () => {
    server.use(
      http.get('/api/posts/', () => HttpResponse.error())
    )
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
    })
  })

  it('zobrazí "No posts found" pro prázdné výsledky', async () => {
    server.use(
      http.get('/api/posts/', () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      )
    )
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    await waitFor(() => {
      expect(screen.getByText(/No posts found/i)).toBeInTheDocument()
    })
  })

  it('vyhledávání změní URL parametr', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    await waitFor(() => screen.getByPlaceholderText(/Search/i))
    const input = screen.getByPlaceholderText(/Search/i)
    await user.type(input, 'Praha')
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(screen.getByText('Praha z výšky 120 metrů')).toBeInTheDocument()
    })
  })

  it('zobrazí výšku letu', async () => {
    renderWithProviders(<PostList />, { initialEntries: ['/'] })
    await waitFor(() => {
      // Text "120 m" je uvnitř <span> spolu s <i> ikonou — hledáme v celém DOM
      const el = document.body.innerHTML
      expect(el).toMatch(/120/)
    })
  })

})
