#!/bin/sh
# Container entrypoint. On Render's free plan there is no "pre-deploy command", so the schema
# migration and permission-catalog seed run here, before the web server starts. A failing
# migration stops the container (and Render keeps serving the previous version).
set -e
python manage.py migrate --noinput
python manage.py seed_permissions
exec gunicorn config.wsgi:application -c deploy/gunicorn.conf.py
