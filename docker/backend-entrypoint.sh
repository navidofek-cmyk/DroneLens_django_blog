#!/bin/sh
set -e

echo "⏳ Waiting for database..."
# Simple wait loop — only needed for Postgres
if [ -n "$DATABASE_URL" ]; then
  until uv run python -c "
import urllib.parse, socket, sys, os
url = urllib.parse.urlparse(os.environ['DATABASE_URL'])
host, port = url.hostname, url.port or 5432
try:
    s = socket.create_connection((host, port), timeout=2)
    s.close()
    print('DB ready')
except:
    sys.exit(1)
" 2>/dev/null; do
    echo "  ...waiting for DB at $DATABASE_URL"
    sleep 2
  done
fi

echo "📦 Running migrations..."
uv run python manage.py migrate --noinput

echo "📁 Collecting static files..."
uv run python manage.py collectstatic --noinput

echo "🚀 Starting Gunicorn..."
exec uv run gunicorn django_blog.wsgi:application \
  --bind 0.0.0.0:8555 \
  --workers 3 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
