// Testovací fixture data — zrcadlí reálné API odpovědi

export const mockUser = {
  id: 1,
  username: 'ivan_dron',
  first_name: 'Ivan',
  last_name: '',
  full_name: 'Ivan',
  email: 'i.dofek@seznam.cz',
}

export const mockCategory = {
  id: 1,
  name: 'Krajina',
  slug: 'krajina',
  description: 'Přírodní krajiny z výšky',
  post_count: 2,
}

export const mockTag = { id: 1, name: 'DJI', slug: 'dji' }
export const mockTag2 = { id: 2, name: 'Praha', slug: 'praha' }

export const mockPost = {
  id: 1,
  title: 'Praha z výšky 120 metrů',
  slug: 'praha-z-vysky-120-metru',
  author: mockUser,
  cover_image: null,
  excerpt: 'Historické centrum Prahy z ptačí perspektivy.',
  content: 'Záběry historického centra Prahy pořízené za jasného letního dne.',
  category: mockCategory,
  tags: [mockTag, mockTag2],
  status: 'published',
  published_at: '2026-05-26T10:00:00Z',
  created_at: '2026-05-26T09:00:00Z',
  updated_at: '2026-05-26T09:00:00Z',
  location: 'Praha, Česká republika',
  altitude: 120,
  drone_model: 'DJI Mini 4 Pro',
  comment_count: 2,
  photo_count: 3,
  comments: [],
  photos: [],
}

export const mockPost2 = {
  id: 2,
  title: 'Západ slunce nad Alpami',
  slug: 'zapad-slunce-nad-alpami',
  author: mockUser,
  cover_image: null,
  excerpt: 'Zlatá hodina v Alpách.',
  content: 'Nezapomenutelný let při západu slunce.',
  category: { id: 2, name: 'Západ slunce', slug: 'zapad-slunce', post_count: 1 },
  tags: [mockTag],
  status: 'published',
  published_at: '2026-05-25T18:00:00Z',
  created_at: '2026-05-25T17:00:00Z',
  updated_at: '2026-05-25T17:00:00Z',
  location: 'Alpy, Rakousko',
  altitude: 350,
  drone_model: 'DJI Mavic 3',
  comment_count: 0,
  photo_count: 5,
  comments: [],
  photos: [],
}

export const mockComment = {
  id: 1,
  author: mockUser,
  content: 'Skvělé záběry!',
  created_at: '2026-05-26T11:00:00Z',
  is_approved: true,
}

export const mockPostsPage = {
  count: 2,
  next: null,
  previous: null,
  results: [mockPost, mockPost2],
}

export const mockTokens = {
  access: 'eyJhbGciOiJIUzI1NiJ9.test_access.sig',
  refresh: 'eyJhbGciOiJIUzI1NiJ9.test_refresh.sig',
}
