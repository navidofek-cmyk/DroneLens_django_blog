# 🚁 DroneLens

> **Drone photo blog** — Django REST API + React SPA pro sdílení leteckých fotografií z dronu.

[![CI](https://github.com/navidofek-cmyk/DroneLens_django_blog/actions/workflows/ci.yml/badge.svg)](https://github.com/navidofek-cmyk/DroneLens_django_blog/actions/workflows/ci.yml)
[![Backend Coverage](https://img.shields.io/badge/backend%20coverage-99%25-brightgreen)](#testy)
[![Django](https://img.shields.io/badge/Django-6.0-092e20?logo=django)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 Dokumentace

**Kompletní dokumentace je dostupná jako statický web:**

👉 **[navidofek-cmyk.github.io/DroneLens_django_blog](https://navidofek-cmyk.github.io/DroneLens_django_blog/)**

Nebo lokálně otevřete `docs/index.html` v prohlížeči.

| Sekce | Odkaz |
|-------|-------|
| ⚡ Rychlý start | [docs/getting-started.html](docs/getting-started.html) |
| 🏗️ Architektura | [docs/architecture.html](docs/architecture.html) |
| 🗄️ DB modely | [docs/models.html](docs/models.html) |
| 📡 API Reference | [docs/api.html](docs/api.html) |
| 🔐 JWT autentizace | [docs/auth.html](docs/auth.html) |
| ⚛️ React komponenty | [docs/frontend.html](docs/frontend.html) |
| 🐳 Docker | [docs/docker.html](docs/docker.html) |
| 🚀 CI/CD & Deploy | [docs/deployment.html](docs/deployment.html) |
| 🧪 Testy | [docs/testing.html](docs/testing.html) |

---

## Co to je?

DroneLens je full-stack webová aplikace pro sdílení drone fotografií. Pilot dronu může:

- 📝 Psát články s titulní fotkou a popisem místa focení
- 📸 Nahrávat fotogalerii s automatickým čtením **EXIF dat** (GPS, výška, model dronu)
- 🏷️ Organizovat články do kategorií a tagů
- 💬 Diskutovat v komentářích
- ✏️ Editovat a mazat vlastní obsah

---

## Technologický stack

| | Technologie |
|-|------------|
| **Backend** | Django 6 · DRF · SimpleJWT · django-ratelimit · Gunicorn |
| **Frontend** | React 19 · Vite 8 · TanStack Query · React Router 7 · Bootstrap 5 |
| **DB (dev)** | SQLite |
| **DB (prod)** | PostgreSQL 16 |
| **Media (prod)** | AWS S3 (django-storages + boto3) |
| **Ops** | Docker · Nginx · GitHub Actions |
| **Testy** | pytest + coverage · Vitest + MSW |
| **Packaging** | UV (Python) · npm |

---

## ⚡ Rychlý start

### Lokálně (bez Dockeru)

```bash
# Backend
git clone https://github.com/navidofek-cmyk/DroneLens_django_blog.git
cd DroneLens_django_blog
uv sync
uv run python manage.py migrate
uv run python manage.py runserver 8001

# Frontend (nový terminál)
cd frontend
npm install
npm run dev
```

Aplikace běží na **http://localhost:5173**

### Docker (celý stack)

```bash
docker compose up --build
docker compose exec backend uv run python manage.py migrate
docker compose exec backend uv run python manage.py createsuperuser
```

---

## Struktura projektu

```
DroneLens_django_blog/
├── blog/                    # Django app (models, views, serializers)
├── django_blog/             # Django konfigurace (settings, urls)
├── frontend/                # React SPA
│   └── src/
│       ├── pages/           # PostList, PostDetail, PostForm, MyPosts…
│       ├── components/      # Navbar, PhotoUploader, ErrorBoundary
│       ├── context/         # AuthContext (JWT)
│       └── test/            # Vitest + MSW testy
├── docker/                  # nginx.conf, backend-entrypoint.sh
├── docs/                    # 📖 Statická dokumentace (otevřete v prohlížeči)
├── .github/workflows/       # CI (test+lint+build) + CD (SSH deploy)
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml       # Dev stack
├── docker-compose.prod.yml  # Produkční stack
└── pyproject.toml           # Python deps (UV)
```

---

## Testy

### Backend

```bash
uv run pytest -v            # 93 testů
uv run pytest --cov=blog    # coverage report (99 %)
```

### Frontend

```bash
cd frontend
npm test                    # Vitest + MSW
npm run test:coverage
```

---

## Env proměnné

Zkopírujte šablonu a vyplňte hodnoty:

```bash
cp .env.example .env
```

Klíčové proměnné:

| Proměnná | Popis |
|----------|-------|
| `DJANGO_SECRET_KEY` | Django secret key (min. 50 znaků) |
| `DATABASE_URL` | PostgreSQL connection string |
| `AWS_STORAGE_BUCKET_NAME` | S3 bucket pro media soubory |
| `DJANGO_DEBUG` | `True` (vývoj) / `False` (produkce) |

---

## CI/CD

Pipeline v `.github/workflows/`:

- **CI** (`ci.yml`) — ruff lint · bandit security scan · 93 pytest testů · ESLint · Vite build · Docker push do ghcr.io
- **CD** (`cd.yml`) — SSH deploy na server · health check · Slack notifikace

---

## Licence

MIT © 2026 [navidofek-cmyk](https://github.com/navidofek-cmyk)
