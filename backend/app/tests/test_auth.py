import pytest
from app.security.password import get_password_hash, verify_password
from app.security.jwt import create_access_token, create_refresh_token, decode_token


def test_password_hashing():
    raw_pwd = "SuperSecretPassword123!"
    hashed = get_password_hash(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_generation_and_decoding():
    data = {"sub": "user-12345", "email": "test@optimizer.ai", "role": "Admin"}
    access_token = create_access_token(data)
    assert isinstance(access_token, str)

    payload = decode_token(access_token)
    assert payload.get("sub") == "user-12345"
    assert payload.get("email") == "test@optimizer.ai"
    assert payload.get("role") == "Admin"
    assert payload.get("type") == "access"


def test_refresh_token_generation():
    data = {"sub": "user-12345"}
    refresh_token = create_refresh_token(data)
    assert isinstance(refresh_token, str)

    payload = decode_token(refresh_token)
    assert payload.get("sub") == "user-12345"
    assert payload.get("type") == "refresh"
