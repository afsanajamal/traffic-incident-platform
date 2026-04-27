from enum import StrEnum


class UserRole(StrEnum):
    SUPER_ADMIN = "super_admin"
    TRAFFIC_MONITOR = "traffic_monitor"
    POLICE = "police"
    FIRE_FIGHTER = "fire_fighter"
