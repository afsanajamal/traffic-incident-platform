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
