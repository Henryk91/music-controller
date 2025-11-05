#!/bin/bash

# Production deployment script for Music Controller

echo "Starting production deployment..."

# Navigate to project directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "Running database migrations..."
python manage.py migrate

echo "Deployment complete!"
echo ""
echo "To run the production server, use:"
echo "  gunicorn music_controller.wsgi:application --bind 0.0.0.0:8000"

