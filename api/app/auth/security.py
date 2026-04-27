import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, expected = password_hash.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return hmac.compare_digest(digest.hex(), expected)


def create_access_token(
    *, user_id: str, secret_key: str, expires_delta: timedelta
) -> str:
    expires_at = datetime.now(UTC) + expires_delta
    payload = {"sub": user_id, "exp": int(expires_at.timestamp())}
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
    payload_part = base64.urlsafe_b64encode(payload_bytes).decode().rstrip("=")
    signature = hmac.new(secret_key.encode(), payload_part.encode(), hashlib.sha256)
    signature_part = base64.urlsafe_b64encode(signature.digest()).decode().rstrip("=")
    return f"{payload_part}.{signature_part}"


def decode_access_token(token: str, secret_key: str) -> str | None:
    try:
        payload_part, signature_part = token.split(".", 1)
    except ValueError:
        return None

    expected_signature = hmac.new(
        secret_key.encode(), payload_part.encode(), hashlib.sha256
    )
    expected_part = base64.urlsafe_b64encode(expected_signature.digest()).decode().rstrip("=")
    if not hmac.compare_digest(signature_part, expected_part):
        return None

    padded = payload_part + "=" * (-len(payload_part) % 4)
    try:
        payload = json.loads(base64.urlsafe_b64decode(padded.encode()))
    except (json.JSONDecodeError, ValueError):
        return None

    if int(payload.get("exp", 0)) < int(datetime.now(UTC).timestamp()):
        return None
    return payload.get("sub")
