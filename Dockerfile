# syntax=docker/dockerfile:1
# One image that serves the API *and* the built React app (see backend/apps/common/spa.py).
# Built from the repository root by Render (render.yaml).

# ---- Stage 1: build the React app --------------------------------------------------------------
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# Same-origin API (/api/v1) is the default, so no VITE_API_URL is needed.
RUN npm run build

# ---- Stage 2: Django + gunicorn ----------------------------------------------------------------
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod

# Unprivileged user: a bug in the app must never hand an attacker root in the container.
RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --home-dir /app --shell /usr/sbin/nologin app
WORKDIR /app

COPY backend/requirements/base.txt backend/requirements/prod.txt requirements/
RUN pip install -r requirements/prod.txt

COPY --chown=app:app backend/ ./
COPY --from=frontend --chown=app:app /app/dist ./frontend_dist

# collectstatic only needs the settings to import; throwaway values, used for this build step only.
RUN DJANGO_SECRET_KEY=build-only-not-a-real-secret-build-only-not-a-real-secret-0000 \
    DJANGO_ALLOWED_HOSTS=localhost \
    DATABASE_URL=postgresql://build:build@localhost/build \
    CORS_ALLOWED_ORIGINS=https://localhost CSRF_TRUSTED_ORIGINS=https://localhost FRONTEND_URL=https://localhost \
    TRUSTED_PROXY_COUNT=1 \
    python manage.py collectstatic --noinput \
 && chown -R app:app /app/staticfiles

USER app
EXPOSE 10000

# Render injects $PORT (default 10000); gunicorn reads it in deploy/gunicorn.conf.py.
# start.sh runs migrations, then hands over to gunicorn.
CMD ["sh", "deploy/start.sh"]
