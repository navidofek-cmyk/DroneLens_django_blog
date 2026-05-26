import { http, HttpResponse } from 'msw'
import {
  mockUser, mockTokens, mockPostsPage, mockPost, mockPost2,
  mockComment, mockCategory, mockTag, mockTag2,
} from './data'

export const handlers = [

  // ── Auth ─────────────────────────────────────────────────────────────────

  http.post('/api/auth/login/', async ({ request }) => {
    const body = await request.json()
    if (body.username === 'ivan_dron' && body.password === 'dron1234') {
      return HttpResponse.json(mockTokens)
    }
    return HttpResponse.json({ detail: 'No active account found.' }, { status: 401 })
  }),

  http.post('/api/auth/register/', async ({ request }) => {
    const body = await request.json()
    if (body.password !== body.password2) {
      return HttpResponse.json({ password: ['Hesla se neshodují.'] }, { status: 400 })
    }
    if (body.username === 'existing') {
      return HttpResponse.json({ username: ['Uživatel s tímto jménem již existuje.'] }, { status: 400 })
    }
    return HttpResponse.json({ id: 99, username: body.username, email: body.email || '' }, { status: 201 })
  }),

  http.post('/api/auth/refresh/', async ({ request }) => {
    const body = await request.json()
    if (body.refresh === mockTokens.refresh) {
      return HttpResponse.json({ access: 'new_access_token' })
    }
    return HttpResponse.json({ detail: 'Token is invalid.' }, { status: 401 })
  }),

  http.get('/api/auth/me/', ({ request }) => {
    const auth = request.headers.get('Authorization')
    // Akceptuje pouze konkrétní testovací token, ne libovolný Bearer
    if (auth === 'Bearer fake.access.token') {
      return HttpResponse.json(mockUser)
    }
    return HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 })
  }),

  // ── Posts ─────────────────────────────────────────────────────────────────

  http.get('/api/posts/', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const categorySlug = url.searchParams.get('category') || ''

    let results = mockPostsPage.results
    if (search) {
      results = results.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.location || '').toLowerCase().includes(search.toLowerCase())
      )
    }
    if (categorySlug) {
      results = results.filter(p => p.category?.slug === categorySlug)
    }
    return HttpResponse.json({ count: results.length, next: null, previous: null, results })
  }),

  http.get('/api/posts/my/', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 })
    return HttpResponse.json({ count: 2, next: null, previous: null, results: [mockPost, mockPost2] })
  }),

  http.get('/api/posts/:slug/', ({ params }) => {
    const found = [mockPost, mockPost2].find(p => p.slug === params.slug)
    if (!found) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return HttpResponse.json(found)
  }),

  http.post('/api/posts/', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 })
    return HttpResponse.json({ ...mockPost, id: 99, slug: 'novy-clanek' }, { status: 201 })
  }),

  http.patch('/api/posts/:slug/', ({ request, params }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 })
    const post = [mockPost, mockPost2].find(p => p.slug === params.slug)
    if (!post) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return HttpResponse.json(post)
  }),

  http.delete('/api/posts/:slug/', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 })
    return new HttpResponse(null, { status: 204 })
  }),

  // ── Comments ──────────────────────────────────────────────────────────────

  http.get('/api/posts/:slug/comments/', () => {
    return HttpResponse.json([mockComment])
  }),

  http.post('/api/posts/:slug/comments/', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 })
    return HttpResponse.json(mockComment, { status: 201 })
  }),

  // ── Categories & Tags ─────────────────────────────────────────────────────

  http.get('/api/categories/', () => {
    return HttpResponse.json([mockCategory, { id: 2, name: 'Město', slug: 'mesto', post_count: 1 }])
  }),

  http.get('/api/tags/', () => {
    return HttpResponse.json([mockTag, mockTag2])
  }),
]
