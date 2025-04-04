"""
utils/auth_token.py

This module handles creation and decoding of JWT access tokens.

Note:
    In the future, this module may be extended to support:
    - create_refresh_token: for generating long-term refresh tokens
    - decode_refresh_token: to verify and parse refresh tokens
    - get_user_from_token: helper to extract user identity
    - blacklist / revoke: mechanism for invalidating tokens manually
"""


from datetime import datetime, timedelta, UTC
import jwt

SECRET_KEY = "MTA"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=30)):
    to_encode = data.copy()
    expire = datetime.now(UTC) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")
