"""
Komplexní testovací sada pro Django REST Framework API dronového foto-blogu.

Pokrývá autentizaci (JWT), správu článků, komentáře, fotogalerie,
kategorie/tagy a oprávnění.
"""

import io

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone

from PIL import Image as PILImage
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from django_blog import settings

from .models import Category, Comment, Photo, Post, Tag


# ─── Pomocný mixin ────────────────────────────────────────────────────────────

NO_THROTTLE = override_settings(
    REST_FRAMEWORK={
        **settings.REST_FRAMEWORK,
        'DEFAULT_THROTTLE_CLASSES': [],
    }
)


def _minimal_image(filename='test.jpg'):
    """Vrátí SimpleUploadedFile obsahující minimální platný JPEG (1×1 pixel, generovaný Pillow)."""
    buf = io.BytesIO()
    PILImage.new('RGB', (1, 1), color=(255, 0, 0)).save(buf, format='JPEG')
    return SimpleUploadedFile(filename, buf.getvalue(), content_type='image/jpeg')


# ─── 1. AuthTests ─────────────────────────────────────────────────────────────

@NO_THROTTLE
class AuthTests(TestCase):
    """Testy registrace, přihlášení, refresh tokenu a /me/ endpointu."""

    def setUp(self):
        self.client = APIClient()
        self.existing_user = User.objects.create_user(
            username='existing_pilot',
            email='pilot@example.com',
            password='heslo1234',
        )

    def _get_token(self, user):
        """Vrátí JWT access token pro daného uživatele."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)

    # ── Registrace ──────────────────────────────────────────────────────────

    def test_register_creates_user(self):
        """Úspěšná registrace vrátí 201 a vytvoří uživatele v DB."""
        payload = {
            'username': 'new_pilot',
            'email': 'new@example.com',
            'password': 'bezpecne99',
            'password2': 'bezpecne99',
        }
        res = self.client.post('/api/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='new_pilot').exists())

    def test_register_returns_user_data(self):
        """Odpověď na registraci obsahuje username a email (ale ne heslo)."""
        payload = {
            'username': 'novy_pilot',
            'email': 'novy@example.com',
            'password': 'bezpecne99',
            'password2': 'bezpecne99',
        }
        res = self.client.post('/api/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['username'], 'novy_pilot')
        self.assertNotIn('password', res.data)

    def test_register_password_mismatch_returns_400(self):
        """Neshodující se hesla vrátí 400."""
        payload = {
            'username': 'xpilot',
            'email': 'x@x.cz',
            'password': 'heslo1111',
            'password2': 'heslo9999',
        }
        res = self.client.post('/api/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username_returns_400(self):
        """Duplicitní username vrátí 400."""
        payload = {
            'username': 'existing_pilot',
            'email': 'other@example.com',
            'password': 'heslo1234',
            'password2': 'heslo1234',
        }
        res = self.client.post('/api/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_fields_returns_400(self):
        """Chybějící povinná pole vrátí 400."""
        res = self.client.post('/api/auth/register/', {'username': 'x'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Přihlášení ──────────────────────────────────────────────────────────

    def test_login_success_returns_tokens(self):
        """Úspěšné přihlášení vrátí access a refresh token."""
        res = self.client.post('/api/auth/login/', {
            'username': 'existing_pilot',
            'password': 'heslo1234',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_wrong_password_returns_401(self):
        """Špatné heslo vrátí 401."""
        res = self.client.post('/api/auth/login/', {
            'username': 'existing_pilot',
            'password': 'spatne_heslo',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user_returns_401(self):
        """Neexistující uživatel vrátí 401."""
        res = self.client.post('/api/auth/login/', {
            'username': 'nikdo',
            'password': 'cokoliv',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Refresh token ────────────────────────────────────────────────────────

    def test_token_refresh_returns_new_access(self):
        """Platný refresh token vrátí nový access token."""
        refresh = RefreshToken.for_user(self.existing_user)
        res = self.client.post('/api/auth/refresh/', {'refresh': str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)

    def test_token_refresh_invalid_token_returns_401(self):
        """Neplatný refresh token vrátí 401."""
        res = self.client.post('/api/auth/refresh/', {'refresh': 'invalid.token.here'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── /me/ endpoint ────────────────────────────────────────────────────────

    def test_me_authenticated_returns_user(self):
        """Přihlášený uživatel dostane svá data z /me/."""
        token = self._get_token(self.existing_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'existing_pilot')

    def test_me_unauthenticated_returns_401(self):
        """Nepřihlášený uživatel dostane 401 z /me/."""
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_contains_expected_fields(self):
        """Odpověď z /me/ obsahuje id, username, email a full_name."""
        token = self._get_token(self.existing_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.get('/api/auth/me/')
        for field in ('id', 'username', 'email', 'full_name'):
            self.assertIn(field, res.data)


# ─── 2. PostListTests ─────────────────────────────────────────────────────────

@NO_THROTTLE
class PostListTests(TestCase):
    """Testy pro veřejný výpis článků, filtrování a stránkování."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('listuser', password='heslo1234')
        self.cat_krajina = Category.objects.create(name='Krajina')
        self.cat_mesto = Category.objects.create(name='Město')
        self.tag_drone = Tag.objects.create(name='drone')
        self.tag_sunset = Tag.objects.create(name='sunset')

        self.post1 = Post.objects.create(
            title='Záběr z Krkonoš',
            author=self.user,
            content='Krásná krajina v horách.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
            category=self.cat_krajina,
        )
        self.post1.tags.add(self.tag_drone)

        self.post2 = Post.objects.create(
            title='Praha z výšky',
            author=self.user,
            content='Pohled na Pražský hrad z dronu.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
            category=self.cat_mesto,
        )
        self.post2.tags.add(self.tag_sunset)

        # Konceptový článek — nesmí být ve veřejném výpisu
        self.draft = Post.objects.create(
            title='Nedokončený záběr',
            author=self.user,
            content='Pracuje se.',
            status=Post.STATUS_DRAFT,
        )

    def _get_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def test_list_returns_only_published(self):
        """Výpis vrátí jen publikované články, koncepty se nezobrazí."""
        res = self.client.get('/api/posts/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 2)

    def test_list_is_public(self):
        """Anonymní uživatel může číst výpis bez autentizace."""
        res = self.client.get('/api/posts/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_response_structure(self):
        """Odpověď výpisu obsahuje count, next, previous a results."""
        res = self.client.get('/api/posts/')
        for key in ('count', 'next', 'previous', 'results'):
            self.assertIn(key, res.data)

    def test_search_by_title(self):
        """Vyhledávání ?search= filtruje podle titulu."""
        res = self.client.get('/api/posts/?search=Krkonoš')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['title'], 'Záběr z Krkonoš')

    def test_search_by_content(self):
        """Vyhledávání funguje i pro obsah článku."""
        res = self.client.get('/api/posts/?search=Pražský+hrad')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)

    def test_search_no_results(self):
        """Vyhledávání bez shody vrátí prázdné results a count=0."""
        res = self.client.get('/api/posts/?search=xyznonexistent99')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 0)
        self.assertEqual(res.data['results'], [])

    def test_filter_by_category_slug(self):
        """Filtr ?category=<slug> vrátí pouze články dané kategorie."""
        res = self.client.get(f'/api/posts/?category={self.cat_krajina.slug}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['title'], 'Záběr z Krkonoš')

    def test_filter_by_nonexistent_category(self):
        """Filtr ?category=neexistujici vrátí prázdný výsledek."""
        res = self.client.get('/api/posts/?category=neexistujici')
        self.assertEqual(res.data['count'], 0)

    def test_filter_by_tag_slug(self):
        """Filtr ?tag=<slug> vrátí pouze články s daným tagem."""
        res = self.client.get(f'/api/posts/?tag={self.tag_sunset.slug}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['title'], 'Praha z výšky')

    def test_filter_by_nonexistent_tag(self):
        """Filtr ?tag=neexistujici vrátí prázdný výsledek."""
        res = self.client.get('/api/posts/?tag=neexistujici')
        self.assertEqual(res.data['count'], 0)

    def test_pagination_page_size(self):
        """Stránkování funguje — výsledky nepřesáhnou PAGE_SIZE."""
        # Vytvoříme dalších 15 článků (celkem 17 publikovaných)
        for i in range(15):
            Post.objects.create(
                title=f'Extra záběr {i}',
                author=self.user,
                content='Obsah.',
                status=Post.STATUS_PUBLISHED,
                published_at=timezone.now(),
            )
        res = self.client.get('/api/posts/')
        self.assertLessEqual(len(res.data['results']), 12)  # PAGE_SIZE = 12
        self.assertIsNotNone(res.data['next'])


# ─── 3. PostDetailTests ───────────────────────────────────────────────────────

@NO_THROTTLE
class PostDetailTests(TestCase):
    """Testy detailu článku — GET /api/posts/<slug>/."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('detailuser', password='heslo1234')
        self.category = Category.objects.create(name='Příroda')
        self.published_post = Post.objects.create(
            title='Výhled na Šumavu',
            author=self.user,
            content='Dlouhý obsah článku o Šumavě a dronech.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
            category=self.category,
            location='Šumava',
            altitude=120,
            drone_model='DJI Mini 3',
        )
        self.draft_post = Post.objects.create(
            title='Neviditelný koncept',
            author=self.user,
            content='Skrytý obsah.',
            status=Post.STATUS_DRAFT,
        )

    def _get_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def test_get_published_post_returns_200(self):
        """GET detailu publikovaného článku vrátí 200."""
        res = self.client.get(f'/api/posts/{self.published_post.slug}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_get_published_post_contains_fields(self):
        """Detail článku obsahuje title, content, author, category, comments, photos."""
        res = self.client.get(f'/api/posts/{self.published_post.slug}/')
        for field in ('title', 'content', 'author', 'category', 'comments', 'photos', 'slug'):
            self.assertIn(field, res.data)

    def test_get_published_post_drone_fields(self):
        """Detail článku obsahuje drone-specifická pole (location, altitude, drone_model)."""
        res = self.client.get(f'/api/posts/{self.published_post.slug}/')
        self.assertEqual(res.data['location'], 'Šumava')
        self.assertEqual(res.data['altitude'], 120)
        self.assertEqual(res.data['drone_model'], 'DJI Mini 3')

    def test_get_nonexistent_post_returns_404(self):
        """Neexistující slug vrátí 404."""
        res = self.client.get('/api/posts/neexistujici-slug-xyz/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_draft_post_returns_404(self):
        """Konceptový článek není veřejně dostupný — vrátí 404."""
        res = self.client.get(f'/api/posts/{self.draft_post.slug}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_slug_lookup_is_case_sensitive(self):
        """Slug lookup je přesný — velká písmena neodpovídají."""
        slug_upper = self.published_post.slug.upper()
        res = self.client.get(f'/api/posts/{slug_upper}/')
        # Buď 404, nebo slug je celý lowercase (Django slugify = lowercase)
        if slug_upper != self.published_post.slug:
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_detail_is_public(self):
        """Anonymní uživatel může číst detail bez autentizace."""
        res = self.client.get(f'/api/posts/{self.published_post.slug}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)


# ─── 4. PostCreateTests ───────────────────────────────────────────────────────

@NO_THROTTLE
class PostCreateTests(TestCase):
    """Testy vytváření článků — POST /api/posts/."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('createuser', password='heslo1234')
        self.category = Category.objects.create(name='Technologie')

    def _get_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def _auth(self, user=None):
        if user is None:
            user = self.user
        token = self._get_token(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_create_requires_auth(self):
        """Nepřihlášený uživatel dostane 401 při pokusu o vytvoření."""
        res = self.client.post('/api/posts/', {'title': 'Hack', 'content': 'x'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_with_valid_data_returns_201(self):
        """Přihlášený uživatel může vytvořit článek (201)."""
        self._auth()
        payload = {
            'title': 'Nový dronový záběr',
            'content': 'Obsah nového záběru z výšky 100 metrů.',
            'status': 'published',
        }
        res = self.client.post('/api/posts/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_auto_generates_slug(self):
        """Slug se automaticky vygeneruje z titulu."""
        self._auth()
        payload = {
            'title': 'Automatický slug test',
            'content': 'Obsah.',
            'status': 'draft',
        }
        res = self.client.post('/api/posts/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get(title='Automatický slug test')
        self.assertNotEqual(post.slug, '')
        self.assertIn('automatick', post.slug)

    def test_create_published_sets_published_at(self):
        """Vytvoření s status=published automaticky nastaví published_at."""
        self._auth()
        payload = {
            'title': 'Hned publikovaný záběr',
            'content': 'Obsah.',
            'status': 'published',
        }
        res = self.client.post('/api/posts/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get(title='Hned publikovaný záběr')
        self.assertIsNotNone(post.published_at)

    def test_create_sets_author_from_token(self):
        """Autor článku je nastaven z JWT tokenu, ne z payloadu."""
        self._auth()
        payload = {
            'title': 'Autorský záběr',
            'content': 'Obsah.',
            'status': 'draft',
        }
        res = self.client.post('/api/posts/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get(title='Autorský záběr')
        self.assertEqual(post.author, self.user)

    def test_create_with_tags_input_creates_tags(self):
        """tags_input oddělený čárkami vytvoří Tag objekty a přiřadí je k článku."""
        self._auth()
        payload = {
            'title': 'Tagovaný záběr',
            'content': 'Obsah s tagy.',
            'status': 'draft',
            'tags_input': 'dron, západ slunce, hory',
        }
        res = self.client.post('/api/posts/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get(title='Tagovaný záběr')
        tag_names = list(post.tags.values_list('name', flat=True))
        self.assertIn('dron', tag_names)
        self.assertIn('západ slunce', tag_names)
        self.assertIn('hory', tag_names)

    def test_create_with_category(self):
        """Článek lze vytvořit s přiřazenou kategorií."""
        self._auth()
        payload = {
            'title': 'Kategorizovaný záběr',
            'content': 'Obsah.',
            'status': 'draft',
            'category': self.category.pk,
        }
        res = self.client.post('/api/posts/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get(title='Kategorizovaný záběr')
        self.assertEqual(post.category, self.category)

    def test_create_with_cover_image(self):
        """Článek lze vytvořit s cover_image (SimpleUploadedFile)."""
        self._auth()
        image = _minimal_image('cover.jpg')
        payload = {
            'title': 'Záběr s titulní fotkou',
            'content': 'Obsah s fotkou.',
            'status': 'draft',
            'cover_image': image,
        }
        res = self.client.post('/api/posts/', payload, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        post = Post.objects.get(title='Záběr s titulní fotkou')
        self.assertTrue(bool(post.cover_image))

    def test_create_missing_required_fields_returns_400(self):
        """Chybějící povinná pole (title, content) vrátí 400."""
        self._auth()
        res = self.client.post('/api/posts/', {'status': 'draft'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ─── 5. PostUpdateTests ───────────────────────────────────────────────────────

@NO_THROTTLE
class PostUpdateTests(TestCase):
    """Testy úprav článku — PATCH/PUT /api/posts/<slug>/."""

    def setUp(self):
        self.client = APIClient()
        self.author = User.objects.create_user('updateauthor', password='heslo1234')
        self.other_user = User.objects.create_user('updateother', password='heslo1234')
        self.staff_user = User.objects.create_user(
            'updatestaff', password='heslo1234', is_staff=True
        )
        self.post = Post.objects.create(
            title='Originální záběr',
            author=self.author,
            content='Původní obsah záběru.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
        )

    def _get_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def test_author_can_patch_own_post(self):
        """Autor může PATCHovat svůj vlastní článek."""
        token = self._get_token(self.author)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.patch(
            f'/api/posts/{self.post.slug}/',
            {'title': 'Upravený záběr'},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        self.assertEqual(self.post.title, 'Upravený záběr')

    def test_author_can_put_own_post(self):
        """Autor může PUTovat svůj vlastní článek."""
        token = self._get_token(self.author)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.put(
            f'/api/posts/{self.post.slug}/',
            {'title': 'Kompletně přepsaný záběr', 'content': 'Nový obsah.', 'status': 'published'},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_non_author_patch_returns_403(self):
        """Neautor dostane 403 při pokusu o PATCH cizího článku."""
        token = self._get_token(self.other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.patch(
            f'/api/posts/{self.post.slug}/',
            {'title': 'Neoprávněná změna'},
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_patch_any_post(self):
        """Staff uživatel může PATCHovat jakýkoli článek."""
        token = self._get_token(self.staff_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.patch(
            f'/api/posts/{self.post.slug}/',
            {'title': 'Staff oprava záběru'},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        self.assertEqual(self.post.title, 'Staff oprava záběru')

    def test_unauthenticated_patch_returns_401(self):
        """Nepřihlášený uživatel dostane 401 při pokusu o PATCH."""
        res = self.client.patch(
            f'/api/posts/{self.post.slug}/',
            {'title': 'Anon změna'},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_updates_tags_via_tags_input(self):
        """PATCH s tags_input aktualizuje tagy článku."""
        token = self._get_token(self.author)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.patch(
            f'/api/posts/{self.post.slug}/',
            {'tags_input': 'novy-tag, dalsi-tag'},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        tag_names = list(self.post.tags.values_list('name', flat=True))
        self.assertIn('novy-tag', tag_names)
        self.assertIn('dalsi-tag', tag_names)


# ─── 6. PostDeleteTests ───────────────────────────────────────────────────────

@NO_THROTTLE
class PostDeleteTests(TestCase):
    """Testy mazání článků — DELETE /api/posts/<slug>/."""

    def setUp(self):
        self.client = APIClient()
        self.author = User.objects.create_user('delauthor', password='heslo1234')
        self.other_user = User.objects.create_user('delother', password='heslo1234')
        self.staff_user = User.objects.create_user(
            'delstaff', password='heslo1234', is_staff=True
        )
        self.post = Post.objects.create(
            title='Smazatelný záběr',
            author=self.author,
            content='Obsah ke smazání.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
        )

    def _get_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def test_author_can_delete_own_post(self):
        """Autor může smazat svůj vlastní článek (204)."""
        token = self._get_token(self.author)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.delete(f'/api/posts/{self.post.slug}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(pk=self.post.pk).exists())

    def test_non_author_delete_returns_403(self):
        """Neautor dostane 403 při pokusu o smazání cizího článku."""
        token = self._get_token(self.other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.delete(f'/api/posts/{self.post.slug}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Post.objects.filter(pk=self.post.pk).exists())

    def test_staff_can_delete_any_post(self):
        """Staff uživatel může smazat jakýkoli článek."""
        token = self._get_token(self.staff_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.delete(f'/api/posts/{self.post.slug}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_unauthenticated_delete_returns_401(self):
        """Nepřihlášený uživatel dostane 401 při pokusu o smazání."""
        res = self.client.delete(f'/api/posts/{self.post.slug}/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─── 7. CommentTests ──────────────────────────────────────────────────────────

@NO_THROTTLE
class CommentTests(TestCase):
    """Testy komentářů — GET/POST /api/posts/<slug>/comments/."""

    def setUp(self):
        self.client = APIClient()
        self.author = User.objects.create_user('commentauthor', password='heslo1234')
        self.commenter = User.objects.create_user('commenter', password='heslo1234')
        self.post = Post.objects.create(
            title='Komentovatelný záběr',
            author=self.author,
            content='Obsah článku k diskuzi.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
        )
        self.approved_comment = Comment.objects.create(
            post=self.post,
            author=self.author,
            content='Schválený komentář.',
            is_approved=True,
        )
        self.pending_comment = Comment.objects.create(
            post=self.post,
            author=self.author,
            content='Čekající komentář.',
            is_approved=False,
        )

    def _get_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def test_list_comments_is_public(self):
        """Anonymní uživatel může číst schválené komentáře."""
        res = self.client.get(f'/api/posts/{self.post.slug}/comments/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_list_returns_only_approved_comments(self):
        """Výpis vrátí pouze schválené komentáře (is_approved=True)."""
        res = self.client.get(f'/api/posts/{self.post.slug}/comments/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # results může být v paginated nebo flat formátu
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['content'], 'Schválený komentář.')

    def test_create_comment_requires_auth(self):
        """Vytvoření komentáře vyžaduje autentizaci (401)."""
        res = self.client.post(
            f'/api/posts/{self.post.slug}/comments/',
            {'content': 'Pokus o anon komentář'},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_comment_authenticated_returns_201(self):
        """Přihlášený uživatel může přidat komentář (201)."""
        token = self._get_token(self.commenter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.post(
            f'/api/posts/{self.post.slug}/comments/',
            {'content': 'Nový komentář od přihlášeného uživatele.'},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_comment_linked_to_correct_post(self):
        """Nový komentář je přiřazen ke správnému článku."""
        token = self._get_token(self.commenter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.client.post(
            f'/api/posts/{self.post.slug}/comments/',
            {'content': 'Zkušební komentář'},
        )
        comment = Comment.objects.filter(content='Zkušební komentář').first()
        self.assertIsNotNone(comment)
        self.assertEqual(comment.post, self.post)

    def test_comment_author_set_from_token(self):
        """Autor komentáře je nastaven z JWT tokenu."""
        token = self._get_token(self.commenter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        self.client.post(
            f'/api/posts/{self.post.slug}/comments/',
            {'content': 'Autorský komentář'},
        )
        comment = Comment.objects.filter(content='Autorský komentář').first()
        self.assertIsNotNone(comment)
        self.assertEqual(comment.author, self.commenter)

    def test_comment_on_nonexistent_post_returns_404(self):
        """Komentář na neexistující článek vrátí 404."""
        token = self._get_token(self.commenter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.post(
            '/api/posts/neexistujici-slug/comments/',
            {'content': 'Komentář nikam'},
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_comment_response_contains_author_data(self):
        """Odpověď komentáře obsahuje vnořená data autora."""
        token = self._get_token(self.commenter)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.post(
            f'/api/posts/{self.post.slug}/comments/',
            {'content': 'Komentář s autorem'},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('author', res.data)
        self.assertEqual(res.data['author']['username'], 'commenter')


# ─── 8. CategoryTagTests ──────────────────────────────────────────────────────

@NO_THROTTLE
class CategoryTagTests(TestCase):
    """Testy výpisu kategorií a tagů."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('catuser', password='heslo1234')

        self.cat1 = Category.objects.create(name='Hory', description='Horské záběry')
        self.cat2 = Category.objects.create(name='Moře', description='Mořské záběry')
        self.cat3 = Category.objects.create(name='Města', description='Městské záběry')

        self.tag1 = Tag.objects.create(name='dron')
        self.tag2 = Tag.objects.create(name='letní')
        self.tag3 = Tag.objects.create(name='4k')

        # Článek pro ověření post_count
        self.post = Post.objects.create(
            title='Horský záběr',
            author=self.user,
            content='Záběr z hor.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
            category=self.cat1,
        )

    def test_list_categories_returns_all(self):
        """GET /api/categories/ vrátí všechny kategorie."""
        res = self.client.get('/api/categories/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 3)

    def test_list_categories_is_public(self):
        """Anonymní uživatel může číst kategorie bez autentizace."""
        res = self.client.get('/api/categories/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_category_contains_post_count(self):
        """Kategorie obsahuje pole post_count s počtem publikovaných článků."""
        res = self.client.get('/api/categories/')
        results = res.data.get('results', res.data)
        hory = next(c for c in results if c['name'] == 'Hory')
        self.assertIn('post_count', hory)
        self.assertEqual(hory['post_count'], 1)

    def test_category_fields(self):
        """Kategorie obsahuje id, name, slug, description, post_count."""
        res = self.client.get('/api/categories/')
        results = res.data.get('results', res.data)
        cat = results[0]
        for field in ('id', 'name', 'slug', 'description', 'post_count'):
            self.assertIn(field, cat)

    def test_list_tags_returns_all(self):
        """GET /api/tags/ vrátí všechny tagy."""
        res = self.client.get('/api/tags/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 3)

    def test_list_tags_is_public(self):
        """Anonymní uživatel může číst tagy bez autentizace."""
        res = self.client.get('/api/tags/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_tag_fields(self):
        """Tag obsahuje id, name a slug."""
        res = self.client.get('/api/tags/')
        results = res.data.get('results', res.data)
        tag = results[0]
        for field in ('id', 'name', 'slug'):
            self.assertIn(field, tag)

    def test_category_slug_auto_generated(self):
        """Slug kategorie je auto-generován a není prázdný."""
        res = self.client.get('/api/categories/')
        results = res.data.get('results', res.data)
        for cat in results:
            self.assertNotEqual(cat['slug'], '')

    def test_tag_slug_auto_generated(self):
        """Slug tagu je auto-generován a není prázdný."""
        res = self.client.get('/api/tags/')
        results = res.data.get('results', res.data)
        for tag in results:
            self.assertNotEqual(tag['slug'], '')


# ─── 9. PermissionTests ───────────────────────────────────────────────────────

@NO_THROTTLE
class PermissionTests(TestCase):
    """Testy oprávnění — kdo může k čemu přistupovat."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('permuser', password='heslo1234')
        self.post = Post.objects.create(
            title='Oprávněný záběr',
            author=self.user,
            content='Obsah.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
        )

    def _get_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def test_unauthenticated_post_to_posts_returns_401(self):
        """Nepřihlášený POST na /api/posts/ vrátí 401."""
        res = self.client.post('/api/posts/', {'title': 'Hack', 'content': 'x'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_get_my_posts_returns_200(self):
        """Přihlášený GET /api/posts/my/ vrátí 200."""
        token = self._get_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.get('/api/posts/my/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_get_my_posts_returns_401(self):
        """Nepřihlášený GET /api/posts/my/ vrátí 401."""
        res = self.client.get('/api/posts/my/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_my_posts_returns_only_own_posts(self):
        """GET /api/posts/my/ vrátí pouze články přihlášeného uživatele."""
        other = User.objects.create_user('permother', password='heslo1234')
        Post.objects.create(
            title='Cizí záběr',
            author=other,
            content='Obsah.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
        )
        token = self._get_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.get('/api/posts/my/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        for post in results:
            self.assertEqual(post['author']['username'], 'permuser')

    def test_my_posts_includes_drafts(self):
        """GET /api/posts/my/ zahrnuje i konceptové články autora."""
        draft = Post.objects.create(
            title='Můj koncept',
            author=self.user,
            content='Nedokončeno.',
            status=Post.STATUS_DRAFT,
        )
        token = self._get_token(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.get('/api/posts/my/')
        results = res.data.get('results', res.data)
        slugs = [p['slug'] for p in results]
        self.assertIn(draft.slug, slugs)

    def test_unauthenticated_get_public_posts_returns_200(self):
        """Nepřihlášený GET /api/posts/ vrátí 200 (veřejný endpoint)."""
        res = self.client.get('/api/posts/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_expired_token_returns_401(self):
        """Neplatný (falešný) Bearer token vrátí 401."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid.jwt.token')
        res = self.client.get('/api/posts/my/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─── 10. ModelTests ───────────────────────────────────────────────────────────

class ModelTests(TestCase):
    """Testy modelů — save(), properties, atd."""

    def setUp(self):
        self.user = User.objects.create_user('modeluser', password='heslo1234')

    def test_post_save_auto_generates_slug(self):
        """Post.save() automaticky vygeneruje slug z titulu."""
        post = Post.objects.create(
            title='Automatický Slug Z Titulu',
            author=self.user,
            content='Obsah.',
            status=Post.STATUS_DRAFT,
        )
        self.assertEqual(post.slug, 'automaticky-slug-z-titulu')

    def test_post_existing_slug_not_overwritten(self):
        """Post.save() nepřepíše existující slug při update."""
        post = Post.objects.create(
            title='Původní titul',
            author=self.user,
            content='Obsah.',
            status=Post.STATUS_DRAFT,
        )
        original_slug = post.slug
        post.title = 'Nový titul'
        post.save()
        post.refresh_from_db()
        self.assertEqual(post.slug, original_slug)

    def test_category_save_auto_generates_slug(self):
        """Category.save() automaticky vygeneruje slug z názvu."""
        cat = Category.objects.create(name='Západ Slunce')
        self.assertEqual(cat.slug, 'zapad-slunce')

    def test_category_existing_slug_not_overwritten(self):
        """Category.save() nepřepíše existující slug."""
        cat = Category.objects.create(name='Testovací Kategorie')
        original_slug = cat.slug
        cat.name = 'Změněný Název'
        cat.save()
        cat.refresh_from_db()
        self.assertEqual(cat.slug, original_slug)

    def test_tag_save_auto_generates_slug(self):
        """Tag.save() automaticky vygeneruje slug z názvu."""
        tag = Tag.objects.create(name='Dronové Záběry')
        self.assertEqual(tag.slug, 'dronove-zabery')

    def test_post_approved_comments_property(self):
        """Post.approved_comments vrátí pouze schválené komentáře."""
        post = Post.objects.create(
            title='Komentovaný záběr',
            author=self.user,
            content='Obsah.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
        )
        Comment.objects.create(
            post=post, author=self.user, content='Schválený', is_approved=True
        )
        Comment.objects.create(
            post=post, author=self.user, content='Zamítnutý', is_approved=False
        )
        Comment.objects.create(
            post=post, author=self.user, content='Také schválený', is_approved=True
        )
        approved = post.approved_comments
        self.assertEqual(approved.count(), 2)
        for comment in approved:
            self.assertTrue(comment.is_approved)

    def test_post_short_excerpt_uses_excerpt_field(self):
        """Post.short_excerpt vrátí excerpt, pokud je vyplněný."""
        post = Post(
            title='Excerpt test',
            author=self.user,
            content='Dlouhý obsah článku.',
            excerpt='Krátký úryvek pro náhled.',
        )
        self.assertEqual(post.short_excerpt, 'Krátký úrývek pro náhled.' if False else 'Krátký úryvek pro náhled.')

    def test_post_short_excerpt_truncates_long_content(self):
        """Post.short_excerpt zkrátí obsah na 200 znaků + '...' pokud není excerpt."""
        long_content = 'A' * 300
        post = Post(
            title='Dlouhý obsah',
            author=self.user,
            content=long_content,
            excerpt='',
        )
        excerpt = post.short_excerpt
        self.assertTrue(excerpt.endswith('...'))
        self.assertEqual(len(excerpt), 203)  # 200 + '...'

    def test_post_short_excerpt_returns_full_content_when_short(self):
        """Post.short_excerpt vrátí plný obsah, pokud je kratší než 200 znaků."""
        short_content = 'Krátký obsah.'
        post = Post(
            title='Krátký článek',
            author=self.user,
            content=short_content,
            excerpt='',
        )
        self.assertEqual(post.short_excerpt, short_content)

    def test_post_str_returns_title(self):
        """str(post) vrátí titul článku."""
        post = Post(title='Titulek záběru', author=self.user, content='x')
        self.assertEqual(str(post), 'Titulek záběru')

    def test_category_str_returns_name(self):
        """str(category) vrátí název kategorie."""
        cat = Category(name='Krajina')
        self.assertEqual(str(cat), 'Krajina')

    def test_tag_str_returns_name(self):
        """str(tag) vrátí název tagu."""
        tag = Tag(name='letní')
        self.assertEqual(str(tag), 'letní')

    def test_comment_str_format(self):
        """str(comment) obsahuje jméno autora a titul článku."""
        post = Post.objects.create(
            title='Článek ke komentáři',
            author=self.user,
            content='Obsah.',
            status=Post.STATUS_DRAFT,
        )
        comment = Comment(post=post, author=self.user, content='Test')
        comment_str = str(comment)
        self.assertIn(self.user.username, comment_str)
        self.assertIn(post.title, comment_str)


# ─── 11. PhotoTests ───────────────────────────────────────────────────────────

@NO_THROTTLE
class PhotoTests(TestCase):
    """Testy nahrávání a mazání fotek galerie."""

    def setUp(self):
        self.client = APIClient()
        self.author = User.objects.create_user('photoauthor', password='heslo1234')
        self.other_user = User.objects.create_user('photoother', password='heslo1234')
        self.post = Post.objects.create(
            title='Galerie záběrů',
            author=self.author,
            content='Obsah galerie.',
            status=Post.STATUS_PUBLISHED,
            published_at=timezone.now(),
        )

    def _get_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    def test_upload_photo_requires_auth(self):
        """Nahrání fotky vyžaduje autentizaci (401)."""
        image = _minimal_image()
        res = self.client.post(
            f'/api/posts/{self.post.slug}/photos/',
            {'image': image},
            format='multipart',
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_author_can_upload_photo(self):
        """Autor může nahrát fotku do svého článku (201)."""
        token = self._get_token(self.author)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        image = _minimal_image()
        res = self.client.post(
            f'/api/posts/{self.post.slug}/photos/',
            {'image': image, 'caption': 'Záběr z dronu'},
            format='multipart',
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_non_author_cannot_upload_photo(self):
        """Neautor nemůže nahrát fotku do cizího článku (404)."""
        token = self._get_token(self.other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        image = _minimal_image()
        res = self.client.post(
            f'/api/posts/{self.post.slug}/photos/',
            {'image': image},
            format='multipart',
        )
        # get_object_or_404 filtruje i podle author → 404
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_author_can_delete_own_photo(self):
        """Autor může smazat fotku ze svého článku (204)."""
        photo = Photo.objects.create(
            post=self.post,
            image=SimpleUploadedFile('del.jpg', b'x', content_type='image/jpeg'),
        )
        token = self._get_token(self.author)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.delete(f'/api/photos/{photo.pk}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Photo.objects.filter(pk=photo.pk).exists())

    def test_non_author_cannot_delete_photo(self):
        """Neautor dostane 403 při pokusu o smazání cizí fotky."""
        photo = Photo.objects.create(
            post=self.post,
            image=SimpleUploadedFile('nd.jpg', b'x', content_type='image/jpeg'),
        )
        token = self._get_token(self.other_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.delete(f'/api/photos/{photo.pk}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_nonexistent_photo_returns_404(self):
        """Smazání neexistující fotky vrátí 404."""
        token = self._get_token(self.author)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.delete('/api/photos/99999/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
