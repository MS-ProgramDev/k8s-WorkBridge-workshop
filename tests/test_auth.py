"""
Test suite for the Auth API endpoints: /register, /login, /me.
Covers both valid and invalid flows.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

# Create a test client instance to simulate HTTP requests without running a real server
client = TestClient(app)

def test_register_success():
    """
    Test registering a new user with valid email and password.
    Expect: HTTP 200 and a response with a success message.
    """
    response_message = client.post("/register", json={
    "email": "newuser@example.com",
    "password": "password1"
    })
    assert response_message.status_code == 200
    data = response_message.json()
    assert data["message"] == "User created successfully"

def test_register_duplicate():
    """
    Test attempting to register with an email that already exists.
    Expect: HTTP 400 or 409 indicating conflict of bad request.
    """
    # First registration - should succeed
    client.post("/register", json={
        "email": "duplicate@example.com",
        "password": "password1"
    })

    # Second registration - should fail.
    response_message = client.post("/register", json={
        "email": "duplicate@example.com",
        "password": "password1"
    })

    assert response_message.status_code in (400, 409)

def test_login_success():
    """
    Test login with a registered user and correct password.
    Expect: HTTP 200 and access_token in response.
    """
    client.post("/register", json={
        "email": "login@example.com",
        "password": "password1"
    })
    response_message = client.post("/login", json={
        "email": "login@example.com",
        "password": "password1"
    })
    assert response_message.status_code == 200
    data = response_message.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password():
    """
    Test login with correct email but wrong password.
    Expect: HTTP 401 Unauthorized.
    """
    client.post("/register", json={
        "email": "wrongpass@example.com",
        "password": "password1"
    })
    response_message = client.post("/login", json={
        "email": "wrongpass@example.com",
        "password": "wrongpass"
    })
    assert response_message.status_code == 401

def test_login_user_not_found():
    """
    Test login with a non-existent email.
    Expect: HTTP 401 Unauthorized.
    """
    response_message = client.post("/login", json={
        "email": "notfound@example.com",
        "password": "password1"
    })
    assert response_message.status_code == 401

def test_me_success():
    """
    Test accessing /me with valid access token.
    Expect: HTTP 200 and correct user information.
    """
    client.post("/register", json={
        "email": "me@example.com",
        "password": "password1"
    })
    login_response = client.post("/login", json={
        "email": "me@example.com",
        "password": "password1"
    })

    token = login_response.json()["access_token"]

    response_message = client.get("/me", headers={"Authorization": f"Bearer {token}"})

    assert response_message.status_code == 200
    data = response_message.json()
    assert data["email"] == "me@example.com"

def test_me_unauthorized():
    """
    Test accessing /me without any token.
    Expect: HTTP 401 Unauthorized.
    """
    response_message = client.get("/me")
    assert response_message.status_code == 401
