# API

## Create Incident

```http
POST /api/incidents
Content-Type: application/json
```

```json
{
  "type": "stopped_vehicle",
  "severity": "high",
  "title": "Stopped vehicle detected on I-95 North",
  "description": "Vehicle stopped in a live lane near the right shoulder.",
  "camera_id": "CAM-102",
  "camera_name": "I-95 North Mile Marker 24",
  "location_name": "I-95 Northbound near Exit 24",
  "latitude": 39.9526,
  "longitude": -75.1652,
  "image_url": "https://example.com/snapshots/CAM-102/latest.jpg",
  "confidence": 0.91,
  "detected_at": "2026-04-25T05:42:00Z"
}
```

The response includes `id`, `status`, `created_at`, and `updated_at`.

## List Incidents

```http
GET /api/incidents?severity=high&type=stopped_vehicle&status=new&sort=-detected_at&page=1&page_size=25
```

Supported filters:

- `type`
- `severity`
- `status`
- `camera_id`
- `from`
- `to`

Supported sorting:

- `detected_at`
- `-detected_at`
- `created_at`
- `-created_at`
- `severity`
- `-severity`

## Get One Incident

```http
GET /api/incidents/{incident_id}
```

## Update Status

```http
PATCH /api/incidents/{incident_id}/status
Content-Type: application/json
```

```json
{
  "status": "acknowledged"
}
```

Valid statuses are `new`, `acknowledged`, `resolved`, and `dismissed`.

## WebSocket

```text
ws://localhost:8000/ws/incidents
```

Payload:

```json
{
  "event": "incident.created",
  "data": {
    "id": "11111111-1111-1111-1111-111111111111"
  }
}
```

## Authentication

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@example.com",
  "password": "admin12345"
}
```

Use the returned token on protected endpoints:

```http
Authorization: Bearer <token>
```

User registration is invitation-only:

```http
POST /api/invitations
POST /api/auth/register
```

## Roles

- `super_admin`: all pages, user invitations, fake event generation, incident CRUD.
- `traffic_monitor`: observe incidents and notify police/fire responders.
- `police`: receive notifications, update incident status, and submit reports.
- `fire_fighter`: receive notifications, update incident status, and submit reports.

## Simulator Settings

The continuous simulator reads this endpoint before each wait cycle:

```http
GET /api/simulator/settings
```

Super admins can update the interval:

```http
PATCH /api/simulator/settings
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "interval_seconds": 120,
  "is_enabled": true
}
```
