#!/bin/bash

# Production server startup script

# Navigate to project directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Build frontend if needed
if [ ! -f "frontend/static/frontend/main.js" ]; then
    echo "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

# Collect static files if needed
if [ ! -d "staticfiles" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
fi

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Start production server
echo "Starting production server..."
gunicorn music_controller.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120

