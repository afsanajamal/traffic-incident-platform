from simulator.event_factory import INCIDENT_TYPES, build_event


def test_build_event_produces_valid_payload_shape() -> None:
    event = build_event()

    assert event["type"] in INCIDENT_TYPES
    assert event["severity"] in {"low", "medium", "high", "critical"}
    assert -90 <= event["latitude"] <= 90
    assert -180 <= event["longitude"] <= 180
    assert 0 <= event["confidence"] <= 1
    assert event["detected_at"]
