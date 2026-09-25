"""Serving the built React app from Django (production, single origin).

In production one web service answers everything on school.ntsdigitalsolutions.com:
  /api/*            -> Django REST API
  /assets/*, files  -> WhiteNoise, straight from the frontend build (long-cached, fingerprinted)
  any other path    -> index.html, so client-side routes like /students/123 survive a page reload

One origin means no CORS at all, and the auth cookies can be SameSite=Strict.
"""

from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from django.views.defaults import page_not_found

# No inline script, no eval, no third-party script: an XSS bug would find almost nothing to run.
# Cloudinary hosts uploaded images/videos; Daily.co hosts the live-lesson room (iframe + signalling).
SPA_CONTENT_SECURITY_POLICY = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self'; style-src-attr 'unsafe-inline'; "
    "img-src 'self' data: blob: https://res.cloudinary.com; "
    "media-src 'self' blob: https://res.cloudinary.com; "
    "font-src 'self'; "
    "connect-src 'self' https://*.daily.co wss://*.daily.co; "
    "frame-src https://*.daily.co; "
    "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; "
    "upgrade-insecure-requests"
)

# Camera/microphone/screen-share only for our own origin and the Daily room (live lessons).
SPA_PERMISSIONS_POLICY = (
    'camera=(self "https://*.daily.co"), microphone=(self "https://*.daily.co"), '
    'display-capture=(self "https://*.daily.co"), fullscreen=(self "https://*.daily.co"), '
    "geolocation=(), payment=(), usb=(), interest-cohort=()"
)


def apply_document_headers(headers) -> None:
    """Headers every HTML document (the SPA shell) must carry."""
    headers["Content-Security-Policy"] = SPA_CONTENT_SECURITY_POLICY
    headers["Permissions-Policy"] = SPA_PERMISSIONS_POLICY
    headers["Cross-Origin-Resource-Policy"] = "same-origin"
    # The shell must be revalidated on every load so a new deploy is picked up immediately.
    headers["Cache-Control"] = "no-cache"


def whitenoise_headers(headers, path, url):
    """WhiteNoise hook (WHITENOISE_ADD_HEADERS_FUNCTION): runs for each static file it serves."""
    if str(path).endswith(".html"):
        apply_document_headers(headers)
    elif url.startswith("/assets/"):
        # Vite fingerprints these names by content, so they can be cached forever.
        headers["Cache-Control"] = "public, max-age=31536000, immutable"


def spa_index(request, *args, **kwargs):
    """Fallback for any non-API, non-file path: the React app's HTML shell."""
    if request.method not in ("GET", "HEAD"):
        raise Http404
    index = Path(settings.FRONTEND_DIST_DIR) / "index.html"
    if not index.is_file():
        raise Http404("Frontend build not found.")
    response = FileResponse(open(index, "rb"), content_type="text/html; charset=utf-8")
    apply_document_headers(response.headers)
    return response


def not_found(request, exception=None):
    """404 handler: API clients always get the JSON envelope, never an HTML page."""
    if request.path.startswith("/api/"):
        return JsonResponse(
            {"success": False, "message": "Not found.", "code": "NOT_FOUND", "errors": []}, status=404
        )
    return page_not_found(request, exception)
