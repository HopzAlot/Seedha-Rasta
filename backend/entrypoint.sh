
#!/usr/bin/env sh

# Wait for DB (optional but recommended)
echo "Running migrations..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

echo "Starting Gunicorn..."
# The 'exec' here is CRITICAL. It replaces the shell with Gunicorn
# making Gunicorn PID 1 so it can handle signals correctly.
exec gunicorn backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 30000 \
    --access-logfile - \
    --error-logfile -