import random
from datetime import UTC, datetime
import os


INCIDENT_TYPES = [
    "stopped_vehicle",
    "debris",
    "congestion",
    "wrong_way_driver",
    "pedestrian",
    "accident",
    "other",
]

SEVERITY_BY_TYPE = {
    "stopped_vehicle": ["medium", "high"],
    "debris": ["low", "medium", "high"],
    "congestion": ["low", "medium"],
    "wrong_way_driver": ["critical"],
    "pedestrian": ["high", "critical"],
    "accident": ["high", "critical"],
    "other": ["low", "medium"],
}

CAMERAS = [
    {
        "camera_id": "CAM-101",
        "camera_name": "I-95 South Mile Marker 18",
        "location_name": "I-95 Southbound near Exit 18",
        "latitude": 39.9402,
        "longitude": -75.1698,
    },
    {
        "camera_id": "CAM-102",
        "camera_name": "I-95 North Mile Marker 24",
        "location_name": "I-95 Northbound near Exit 24",
        "latitude": 39.9526,
        "longitude": -75.1652,
    },
    {
        "camera_id": "CAM-203",
        "camera_name": "Route 1 East Junction",
        "location_name": "Route 1 East near Industrial Parkway",
        "latitude": 40.0084,
        "longitude": -75.1272,
    },
    {
        "camera_id": "CAM-304",
        "camera_name": "Airport Connector West",
        "location_name": "Airport Connector westbound ramp",
        "latitude": 39.8744,
        "longitude": -75.2424,
    },
]

TITLE_BY_TYPE = {
    "stopped_vehicle": "Stopped vehicle detected",
    "debris": "Road debris detected",
    "congestion": "Abnormal congestion detected",
    "wrong_way_driver": "Wrong-way driver detected",
    "pedestrian": "Pedestrian detected near roadway",
    "accident": "Possible accident detected",
    "other": "Traffic anomaly detected",
}


SNAPSHOT_COUNT = 25


def build_event() -> dict:
    incident_type = random.choice(INCIDENT_TYPES)
    severity = random.choice(SEVERITY_BY_TYPE[incident_type])
    camera = random.choice(CAMERAS)
    confidence = round(random.uniform(0.72, 0.99), 3)

    title = f"{TITLE_BY_TYPE[incident_type]} at {camera['camera_name']}"
    description = (
        f"Automated camera analysis detected {incident_type.replace('_', ' ')} "
        f"near {camera['location_name']} with {confidence:.0%} confidence."
    )

    return {
        "type": incident_type,
        "severity": severity,
        "title": title,
        "description": description,
        "camera_id": camera["camera_id"],
        "camera_name": camera["camera_name"],
        "location_name": camera["location_name"],
        "latitude": camera["latitude"],
        "longitude": camera["longitude"],
        "image_url": _snapshot_url(),
        "confidence": confidence,
        "detected_at": datetime.now(UTC).isoformat(),
    }


def _snapshot_url() -> str:
    base_url = os.getenv("SNAPSHOT_BASE_URL", "http://localhost:3000/snapshots")
    image_number = random.randint(1, SNAPSHOT_COUNT)
    return f"{base_url.rstrip('/')}/incident-{image_number:03}.png"
