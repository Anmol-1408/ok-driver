# okDriver Smart Dashcams

Full-stack smart dashcam monitoring prototype built with Django REST Framework and React.

## Features

- JWT authentication with Djoser + SimpleJWT
- Camera registration and management
- Camera audit logging
- Video-source adapter architecture
- HLS / RTSP / ONVIF / Simulator source boundaries
- Unified monitoring dashboard
- Camera search and status filtering
- Detection, alert and event APIs
- Docker deployment with separate frontend/backend containers
- Nginx reverse proxy for `/api/*`

## Architecture

```text
Browser
   |
   v
+---------------------------+
| Frontend Container        |
| React + Vite + Nginx      |
| :80                       |
+-------------+-------------+
              |
              | /api/*
              v
+---------------------------+
| Backend Container         |
| Django + DRF + Gunicorn   |
| :8000                     |
+-------------+-------------+
              |
       +------+------+------+
       |      |      |      |
       v      v      v      v
   Accounts Cameras Video Monitoring
             |      |      |
             |      |      +-- Detection
             |      |      +-- Alert
             |      |      +-- Event
             |      |
             |      +-- HLS
             |      +-- RTSP
             |      +-- ONVIF
             |      +-- Simulator
             |
             +-- Audit
```

### Containers

| Container | Technology | Purpose |
|---|---|---|
| `okdriver-frontend` | Nginx + React | Serves frontend and proxies `/api/*` |
| `okdriver-backend` | Django + Gunicorn | REST API and application logic |

## Project Structure

```text
project/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env
│   ├── requirements.txt
│   ├── manage.py
│   ├── backend/
│   ├── accounts/
│   ├── cameras/
│   ├── audit/
│   ├── video/
│   └── monitoring/
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf
    ├── package.json
    └── src/
```

## Prerequisites

For Docker deployment:

- Docker
- Docker Compose

For local development:

- Python 3.12+
- Bun or Node.js
- Git

## Environment Variables

Create `backend/.env`:

```env
DEBUG=False
SECRET_KEY=change-this-to-a-long-random-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost
```

### Variables

| Variable | Description |
|---|---|
| `DEBUG` | Django debug mode. Use `False` for deployment. |
| `SECRET_KEY` | Django secret key. Use a strong random value. |
| `ALLOWED_HOSTS` | Comma-separated allowed Django hosts. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed browser origins. |

Never commit production secrets or `.env` files.

## Database Setup

The Django project can use SQLite for the challenge/demo environment.

Local setup:

```bash
cd backend

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

Run locally:

```bash
python manage.py runserver
```

### Docker database setup

The backend container runs migrations during startup:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

For production, PostgreSQL is recommended instead of SQLite.

## Docker Deployment

From the project root:

```bash
docker compose build
docker compose up -d
```

Check:

```bash
docker compose ps
```

Open:

```text
http://localhost
```

Useful commands:

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
docker compose down
docker compose up -d --build
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

### API routing

The browser calls:

```text
/api/cameras/
/api/video/sources/
/api/monitoring/dashboard/
```

Nginx forwards `/api/*` to:

```text
http://backend:8000/api/*
```

Therefore the frontend API client should use a relative base URL:

```ts
const API_BASE_URL = "";
```

## Authentication APIs

Authentication is provided by Djoser + SimpleJWT.

### Login

```http
POST /api/auth/jwt/create/
```

Example:

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

Response:

```json
{
  "access": "...",
  "refresh": "..."
}
```

Authenticated requests use:

```http
Authorization: Bearer <access-token>
```

## Camera APIs

Base URL:

```text
/api/cameras/
```

### List

```http
GET /api/cameras/
```

Supported query filters include:

```text
?search=C001
?status=ONLINE
?department=Traffic
?camera_type=TRAFFIC
?source_protocol=HLS
?zone=Central
?is_active=true
```

### Get

```http
GET /api/cameras/{id}/
```

### Create

```http
POST /api/cameras/
```

Example:

```json
{
  "camera_id": "C001",
  "name": "MG Road Camera",
  "department": "Traffic Police",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "camera_type": "TRAFFIC",
  "source_protocol": "HLS",
  "stream_endpoint": "https://example.com/live.m3u8",
  "status": "OFFLINE",
  "zone": "Central",
  "storage_metadata": {},
  "is_active": true
}
```

### Update / partial update / delete

```http
PUT /api/cameras/{id}/
PATCH /api/cameras/{id}/
DELETE /api/cameras/{id}/
```

### Enable / disable

```http
POST /api/cameras/{id}/enable/
POST /api/cameras/{id}/disable/
```

Camera management is restricted to authenticated administrators or Django superusers.

### Camera statuses

```text
ONLINE
OFFLINE
DEGRADED
```

### Camera types

```text
TRAFFIC
RTO
CITY
OTHER
```

### Source protocols

```text
RTSP
ONVIF
HTTP
HLS
WEBRTC
SIMULATOR
```

## Audit

Camera lifecycle operations are recorded in the audit system, including:

```text
CREATED
UPDATED
DISABLED
ENABLED
```

Audit data includes camera ID, action, user, changes and timestamp.

Audit routes are mounted under:

```text
/api/audit/
```

Check `backend/backend/urls.py` for the exact configured audit routes.

## Video APIs

Base URL:

```text
/api/video/sources/
```

### List

```http
GET /api/video/sources/
```

### Create

```http
POST /api/video/sources/
```

Example:

```json
{
  "camera": 1,
  "source_type": "HLS",
  "stream_format": "HLS",
  "endpoint": "https://example.com/live.m3u8",
  "is_enabled": true,
  "configuration": {}
}
```

### Get / update / delete

```http
GET /api/video/sources/{id}/
PUT /api/video/sources/{id}/
DELETE /api/video/sources/{id}/
```

### Stream information

```http
GET /api/video/sources/{id}/stream/
```

### Health

```http
GET /api/video/sources/{id}/health/
```

Video adapters expose:

```python
get_stream()
health_check()
```

## Monitoring APIs

Base URL:

```text
/api/monitoring/
```

### Dashboard statistics

```http
GET /api/monitoring/dashboard/
```

### Detections

```http
GET /api/monitoring/detections/
```

Detection types:

```text
VEHICLE
PERSON
PLATE
HELMET
FACE
OTHER
```

### Alerts

```http
GET /api/monitoring/alerts/
```

Alert severities:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Alert statuses:

```text
ACTIVE
ACKNOWLEDGED
RESOLVED
```

Example:

```http
GET /api/monitoring/alerts/?status=ACTIVE
```

### Events

```http
GET /api/monitoring/events/
```

Event types:

```text
DETECTION
ALERT
CAMERA_ONLINE
CAMERA_OFFLINE
CAMERA_DEGRADED
SYSTEM
```

## Dashboard

The unified monitoring dashboard provides:

- Total/online/offline/degraded camera counts
- Active alerts
- Detection statistics
- Camera search and status filters
- Camera grid
- Active alerts
- Recent activity
- Vehicle/entity search
- Camera health
- Recent detections
- Add Camera modal

Creating a camera from the dashboard calls:

```http
POST /api/cameras/
```

Creating a camera does **not** automatically create a separate `VideoSource`. A video source must be configured separately for live streaming.

## Local Frontend Development

```bash
cd frontend
bun install
bun run dev
```

The Vite development server normally runs on:

```text
http://localhost:5173
```

When developing without Nginx, configure the frontend API base URL to point to the local Django server if needed:

```text
http://127.0.0.1:8000
```

For Docker deployment, use:

```ts
const API_BASE_URL = "";
```

## API Documentation

The backend includes `drf-spectacular`.

Check `backend/backend/urls.py` for the configured OpenAPI schema, Swagger UI and/or ReDoc paths.

## Known Limitations

### 1. RTSP browser playback

Browsers generally do not directly play RTSP.

A production implementation needs a media relay/transcoding layer:

```text
RTSP Camera
    |
    v
Media Gateway
    |
    v
HLS / WebRTC
    |
    v
Browser
```

### 2. ONVIF

The ONVIF adapter represents the integration boundary. Complete ONVIF discovery, device communication and stream negotiation are not implemented as a production-ready service.

### 3. AI inference

Detection, alert and event models/APIs exist, but a complete computer-vision pipeline that consumes live frames and produces AI detections is not included.

### 4. Real-time updates

The current dashboard primarily uses REST polling/request-based refreshes. A production deployment would benefit from WebSockets or Server-Sent Events for immediate alerts, detections and camera-status updates.

### 5. Camera heartbeat automation

The data model supports `last_heartbeat` and camera statuses, but a production background service is needed to continuously process heartbeats and automatically transition cameras between online/offline/degraded states.

### 6. Camera and video-source creation are separate

Creating a camera does not automatically create its `VideoSource`.

### 7. SQLite

SQLite is suitable for the challenge/demo environment. PostgreSQL is recommended for production.

### 8. Background jobs

Production workloads such as AI inference, health checks, event processing, notifications and retention management would normally use background workers such as Celery with Redis.

### 9. Video storage

The current prototype does not implement a complete production video-retention/storage lifecycle, including object storage, retention policies and automatic deletion.

### 10. Production security hardening

Before production deployment, review:

- HTTPS/TLS
- secret management
- secure token storage
- CORS and CSRF configuration
- rate limiting
- API permissions
- audit logging
- firewall/network rules
- Nginx security headers

## Recommended Production Architecture

```text
Internet
   |
   v
HTTPS / Nginx
   |
   +------------------+
   |                  |
   v                  v
React Frontend    Django API
                      |
        +-------------+-------------+
        |             |             |
        v             v             v
    PostgreSQL      Redis        Video Gateway
                      |
                      v
                   Workers
                      |
                      v
                 AI / Events
```

## Deployment Checklist

- [ ] Set `DEBUG=False`
- [ ] Set a strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Configure `CORS_ALLOWED_ORIGINS`
- [ ] Keep `.env` out of Git
- [ ] Run migrations
- [ ] Create an admin user
- [ ] Build both Docker images
- [ ] Start both containers
- [ ] Verify Nginx `/api/*` proxying
- [ ] Verify JWT login
- [ ] Verify camera creation
- [ ] Verify monitoring endpoints
- [ ] Configure video sources
- [ ] Verify health endpoints
- [ ] Configure HTTPS for production
- [ ] Replace SQLite with PostgreSQL for production

## Quick Start

```bash
git clone <repository-url>
cd <project-directory>

# Create backend/.env

docker compose build
docker compose up -d

docker compose ps

docker compose exec backend python manage.py createsuperuser
```

Open:

```text
http://localhost
```

## Technology Stack

### Backend

- Python
- Django
- Django REST Framework
- Djoser
- SimpleJWT
- drf-spectacular
- Gunicorn

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Bun

### Deployment

- Docker
- Docker Compose
- Nginx

### Monitoring

- Cameras
- Detections
- Alerts
- Events
- Camera health
- Dashboard statistics
- Audit logs
