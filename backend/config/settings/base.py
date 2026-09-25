"""
Base Django settings shared by all environments.
Environment-specific overrides live in dev.py / prod.py.
"""

from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv
import os

# backend/config/settings/base.py -> backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")


def env(key, default=None):
    return os.environ.get(key, default)


def env_bool(key, default=False):
    val = os.environ.get(key)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def env_list(key, default=""):
    val = os.environ.get(key, default)
    return [item.strip() for item in val.split(",") if item.strip()]


SECRET_KEY = env("DJANGO_SECRET_KEY", "django-insecure-CHANGE-ME")
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "cloudinary_storage",
    "cloudinary",
]

LOCAL_APPS = [
    "apps.common",
    "apps.tenants",
    "apps.users",
    "apps.authorization",
    "apps.authentication",
    "apps.audit",
    "apps.platform_admin",
    "apps.academics",
    "apps.staff",
    "apps.students",
    "apps.parents",
    "apps.timetable",
    "apps.attendance",
    "apps.examinations",
    "apps.finance",
    "apps.library",
    "apps.transport",
    "apps.hostel",
    "apps.medical",
    "apps.discipline",
    "apps.notifications",
    "apps.communications",
    "apps.assignments",
    "apps.documents",
    "apps.records",
    "apps.inventory",
    "apps.procurement",
    "apps.reports",
    "apps.events",
    "apps.complaints",
    "apps.education",
    "apps.live_sessions",
    "apps.salary",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "apps.common.middleware.RequestSizeLimitMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "apps.tenants.middleware.TenantMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.audit.middleware.RequestContextMiddleware",
    "apps.common.middleware.SecurityHeadersMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Database (Neon PostgreSQL — SQLite is never used, dev included)
# ---------------------------------------------------------------------------
DATABASE_URL = env("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Configure backend/.env with your Neon "
        "PostgreSQL connection string before running Django."
    )

DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        ssl_require=True,
    )
}
DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True  # required behind pgbouncer/Neon pooler

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Argon2 for everything new. PBKDF2 stays only so an old hash can still be *verified* (and is then
# transparently upgraded to Argon2 on that user's next login); the weak SHA1 variant is gone.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

# Password-reset / invitation / verification links: 1 hour, not Django's 3-day default. A link that
# sits in an inbox for days is a standing account-takeover risk if that mailbox is ever exposed.
PASSWORD_RESET_TIMEOUT = 60 * 60

# Request-size limits (see also apps.common.middleware.RequestSizeLimitMiddleware). JSON/form
# bodies are capped small; file uploads beyond 5MB stream to a temp file instead of RAM, so a
# burst of large uploads can't exhaust memory.
DATA_UPLOAD_MAX_MEMORY_SIZE = 2 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000
DATA_UPLOAD_MAX_NUMBER_FILES = 20

# Two-factor authentication (authenticator app). Accounts of the platform admin and any role named
# here MUST enrol before they can sign in; everyone else may opt in from Settings.
TWO_FACTOR_ENFORCEMENT = True
TWO_FACTOR_REQUIRED_ROLES = env_list("TWO_FACTOR_REQUIRED_ROLES", "principal")
TWO_FACTOR_ISSUER = "NTS School System"
# Key material for encrypting TOTP secrets at rest. Falls back to SECRET_KEY, but set it separately
# in production so rotating SECRET_KEY doesn't silently invalidate every enrolled authenticator.
TWO_FACTOR_ENCRYPTION_KEY = env("TWO_FACTOR_ENCRYPTION_KEY")

# ---------------------------------------------------------------------------
# I18N / TZ
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static / media
# ---------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# The built React app (copied here by the production Dockerfile). Absent in development, where
# the Vite dev server serves the frontend instead.
FRONTEND_DIST_DIR = BASE_DIR / "frontend_dist"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Cloudinary (file storage)
# ---------------------------------------------------------------------------
# Django 5.1 dropped the DEFAULT_FILE_STORAGE compat shim entirely — setting
# it alone is now a silent no-op, `default_storage` only ever looks at
# STORAGES["default"]["BACKEND"]. Must mutate STORAGES directly.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": env("CLOUDINARY_API_KEY"),
    "API_SECRET": env("CLOUDINARY_API_SECRET"),
}
if CLOUDINARY_STORAGE["CLOUD_NAME"]:
    # RawMediaCloudinaryStorage, not MediaCloudinaryStorage — the latter forces
    # resource_type=image and rejects every non-image upload (PDFs, docs, zips)
    # with a Cloudinary "Invalid image file" error. Every FileField in this
    # codebase (assignment/submission attachments, etc.) is an arbitrary
    # document, not necessarily an image.
    STORAGES["default"]["BACKEND"] = "cloudinary_storage.storage.RawMediaCloudinaryStorage"

# ---------------------------------------------------------------------------
# Brevo (transactional email)
# ---------------------------------------------------------------------------
BREVO_API_KEY = env("BREVO_API_KEY")
BREVO_SENDER_EMAIL = env("BREVO_SENDER_EMAIL", "no-reply@example.com")
BREVO_SENDER_NAME = env("BREVO_SENDER_NAME", "School Management Platform")

# ---------------------------------------------------------------------------
# Daily.co (live video lessons) — blank disables the feature cleanly, same
# "gracefully degrade if unconfigured" contract as Brevo above.
# ---------------------------------------------------------------------------
DAILY_API_KEY = env("DAILY_API_KEY")

FRONTEND_URL = env("FRONTEND_URL", "http://localhost:5173")

# ---------------------------------------------------------------------------
# CORS / CSRF
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "http://localhost:5173")
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"
CSRF_COOKIE_NAME = "csrftoken"
CSRF_COOKIE_HTTPONLY = False  # SPA must read it to echo it back in a header
CSRF_COOKIE_SAMESITE = "Lax"

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

# ---------------------------------------------------------------------------
# DRF
# ---------------------------------------------------------------------------
# Number of trusted reverse proxies in front of the app (0 in development; 1 in production behind
# Caddy). Drives BOTH the client-IP used by throttling (DRF's NUM_PROXIES) and by audit logs
# (apps.common.net) — without it every user behind the proxy would share ONE throttle bucket.
TRUSTED_PROXY_COUNT = int(env("TRUSTED_PROXY_COUNT", "0"))

REST_FRAMEWORK = {
    "NUM_PROXIES": TRUSTED_PROXY_COUNT,
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.authentication.authentication.CookieJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.StandardResultsPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    # Scoped throttles only apply to views that name a `throttle_scope`; the Anon/User throttles
    # cover EVERY other endpoint, so no route is left unlimited.
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "auth_login": "10/min",
        "auth_password_reset": "5/min",
        "auth_refresh": "30/min",
        "auth_two_factor": "10/min",
        "auth_sensitive": "10/min",
        "school_branding": "30/min",
        "anon": "60/min",
        "user": "600/min",
        "default": "120/min",
    },
    "EXCEPTION_HANDLER": "apps.common.exceptions.custom_exception_handler",
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

AUTH_COOKIE_ACCESS_NAME = "access_token"
AUTH_COOKIE_REFRESH_NAME = "refresh_token"
AUTH_COOKIE_SAMESITE = "Lax"
AUTH_COOKIE_SECURE = False  # prod.py overrides to True

# Django admin is a second login surface with its own (weaker) protections; the platform console
# already covers every admin task. It is mounted only in DEBUG, or in production when
# DJANGO_ADMIN_URL is set to a non-guessable path (e.g. "ops-7f3k2/").
ADMIN_URL = env("DJANGO_ADMIN_URL", "")

# ---------------------------------------------------------------------------
# Security headers (baseline; hardened further in prod.py)
# ---------------------------------------------------------------------------
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO"},
        "security": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "audit": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "apps": {"handlers": ["console"], "level": "INFO"},
    },
}
