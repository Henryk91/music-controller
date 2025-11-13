# House Party – Music Controller

A Django + React app for hosting shared listening rooms that control a Spotify playback session. The host authenticates with Spotify; guests can join via a short room code, see the currently playing track, play/pause (if allowed), and vote to skip.

## Features
- Room management (create, join, update settings, leave)
- Host-authenticated Spotify control (OAuth)
- Live "Now Playing" with album art, progress, and play/pause state
- Vote-to-skip logic with per-room threshold
- Session-based hosting and membership (no username/password)

## Tech Stack
- Backend: Django 5, Django REST Framework
- Frontend: React (Webpack, Babel, Material-UI v4)
- Integrations: Spotify Web API (Authorization Code flow)

## Monorepo Layout
- `api/`: Room model and REST endpoints
- `spotify/`: Spotify OAuth, token storage, and control endpoints
- `frontend/`: React SPA served by Django
- `music_controller/`: Django project config

## Prerequisites
- Python 3.10+ (matching your environment)
- Node.js 14+ and npm
- A Spotify Developer account and application
  - Get `Client ID` and `Client Secret`
  - Set a Redirect URI in the Spotify app settings (e.g., `http://localhost:8000/spotify/redirect`)

## Environment Variables
Create a `.env` file at the project root with:
```
# Django Settings (for production, set DEBUG=False and provide SECRET_KEY)
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Spotify API Settings
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://localhost:8000/spotify/redirect

# Database (optional – SQLite is used when these stay empty)
DATABASE_URL=postgres://<user>:<password>@<host>/<db_name>
```

For production, update your `.env`:
```
DEBUG=False
SECRET_KEY=your-production-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
REDIRECT_URI=https://yourdomain.com/spotify/redirect
```

## Backend Setup
```bash
# From repo root
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```
Backend runs on `http://localhost:8000`.

## Frontend Setup
```bash
# In a second terminal
cd frontend
npm install
# For active rebuilds during development
npm run dev
# Or build once for production assets
npm run build
```
The compiled bundle outputs to `frontend/static/frontend/` and is served by Django. Visit `http://localhost:8000/`.

## Using the App (Local)
1. Open `http://localhost:8000/`.
2. Create a room (set guest play/pause permission and votes-to-skip).
3. As host, you’ll be prompted to authenticate with Spotify.
4. Guests can join using the room code, see the current song, and vote to skip.

Notes:
- Spotify requires an active device logged into the same Spotify account to control playback (e.g., the Spotify desktop or mobile app open and active).
- Votes to skip reset when the song changes.

## Key REST Endpoints
Base paths are relative to `http://localhost:8000`.

- Rooms (`/api/...`)
  - `GET /api/room` – list rooms
  - `POST /api/create-room` – create or update host’s room
  - `GET /api/get-room?code=ROOMCODE` – room details (+ `is_host`)
  - `POST /api/join-room` – body `{ code }`
  - `GET /api/user-in-room` – returns `{ code }` from session
  - `POST /api/leave-room` – leave current room (deletes if host)
  - `PATCH /api/update-room` – body `{ code, votes_to_skip, guest_can_pause }`

- Spotify (`/spotify/...`)
  - `GET /spotify/get-auth-url` – returns Spotify consent URL
  - `GET /spotify/redirect` – OAuth callback (uses `.env` values)
  - `GET /spotify/is-authenticated` – `{ status: boolean }`
  - `GET /spotify/current-song` – current track payload
  - `PUT /spotify/play` – resume playback (host or allowed guests)
  - `PUT /spotify/pause` – pause playback (host or allowed guests)
  - `POST /spotify/skip` – vote or skip when threshold reached

## Development Tips
- Sessions: The app uses Django sessions to identify the host and guests. No user accounts required.
- CORS: Not needed locally because React bundle is served by Django.
- Secrets: Do not commit your `.env` to version control.

## Troubleshooting
- Blank now-playing: Ensure a Spotify device is active and authenticated as the host.
- OAuth redirect mismatch: The `REDIRECT_URI` in `.env` must match exactly the one configured in your Spotify app settings.
- 403 on play/pause: Guests need the room setting "Guest Can Pause" enabled; otherwise only the host can control playback.

## Production Deployment

### Quick Start (Production)
```bash
# 1. Install dependencies
pip install -r requirements.txt
cd frontend && npm install && cd ..

# 2. Build frontend
cd frontend
npm run build
cd ..

# 3. Collect static files
python manage.py collectstatic --noinput

# 4. Run migrations
python manage.py migrate

# 5. Start production server with Gunicorn
gunicorn music_controller.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

### Using Deployment Scripts
```bash
# Full deployment (builds frontend, collects static files, runs migrations)
./deploy.sh

# Run production server
./run_production.sh
```

### Production Settings
- Set `DEBUG=False` in your `.env` file
- Set `SECRET_KEY` to a secure random key (use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- Set `ALLOWED_HOSTS` to your domain(s)
- Update `REDIRECT_URI` to your production domain
- The app will automatically enable security settings (HSTS, secure cookies, etc.) when `DEBUG=False`

### Production Server Options
- **Gunicorn** (recommended): `gunicorn music_controller.wsgi:application --bind 0.0.0.0:8000`
- **Django runserver** (development only): `python manage.py runserver 0.0.0.0:8000`

### Static Files
- Static files are automatically collected to `staticfiles/` directory
- WhiteNoise middleware serves static files in production
- Run `python manage.py collectstatic --noinput` after frontend builds

## Scripts Quick Reference
- **Development Backend**: `python manage.py runserver`
- **Frontend dev**: `cd frontend && npm run dev`
- **Frontend build**: `cd frontend && npm run build`
- **Production**: `gunicorn music_controller.wsgi:application --bind 0.0.0.0:8000`
- **Deploy**: `./deploy.sh`
- **Run Production**: `./run_production.sh`

## License
This project is for educational/demo purposes. Adapt licensing as needed.

