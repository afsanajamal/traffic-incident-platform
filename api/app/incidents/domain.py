from enum import StrEnum


class IncidentType(StrEnum):
    STOPPED_VEHICLE = "stopped_vehicle"
    DEBRIS = "debris"
    CONGESTION = "congestion"
    WRONG_WAY_DRIVER = "wrong_way_driver"
    PEDESTRIAN = "pedestrian"
    ACCIDENT = "accident"
    OTHER = "other"


class Severity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Status(StrEnum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"
