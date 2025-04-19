# 🧩 WorkBridge - Additional Services Specification

This document is meant for new developers joining the project, and also for usage in ChatGPT or other LLM tools to assist with generating code and explanations.

It assumes that the `auth-service` is already implemented and working correctly, including user registration, login, JWT token issuance, and a `/me` endpoint to get the current user's identity.

---

## ✅ Project Overview

**WorkBridge** is a Slack-like corporate communication platform built with a microservices architecture.

Technologies used:
- **FastAPI** (Python) for backend services
- **PostgreSQL** for persistent storage
- **SQLAlchemy** as ORM
- **JWT (via python-jose)** for authentication
- **Docker** and **Kubernetes** (future stages)
- **Pytest** for testing
- **Logging** via `logging` + `RotatingFileHandler`

---

## 🧱 Services to Be Developed

### 1. `feed-service` 📢
**Purpose**: Handles organizational posts, including:
- Creating posts
- Commenting on posts
- Liking/unliking posts
- Fetching posts by date/user/team

**Entities**:
- `Post(id, author_id, content, timestamp)`
- `Comment(id, post_id, author_id, content, timestamp)`
- `Like(id, post_id, user_id)`

**Endpoints**:
- `POST /posts/`
- `GET /posts/`
- `POST /posts/{post_id}/comments/`
- `POST /posts/{post_id}/like`
- `DELETE /posts/{post_id}/like`

**Requirements**:
- Only authenticated users can create/like/comment.
- Validate JWT in all endpoints using a shared utility.
- Store `author_id` using the `sub` field from JWT.

---

### 2. `chat-service` 💬
**Purpose**: Real-time or persistent messaging system.
- One-to-one messages
- Group messages
- Message history

**Entities**:
- `Message(id, sender_id, recipient_id, content, timestamp, is_group)`
- `Group(id, name)`
- `GroupMembership(id, group_id, user_id)`

**Endpoints**:
- `POST /messages/`
- `GET /messages/{user_id}`
- `POST /groups/`
- `POST /groups/{group_id}/join`
- `GET /groups/{group_id}/messages`

**Tech Note**: Later, WebSockets or Redis pub/sub may be introduced for real-time.

---

### 3. `notification-service` 🔔
**Purpose**: Manages alerts for:
- New posts
- New messages
- Comments on your posts

**Entities**:
- `Notification(id, user_id, type, reference_id, seen, timestamp)`

**Endpoints**:
- `GET /notifications/`
- `POST /notifications/mark_seen`

---

## 🔒 Auth Integration

All services should:
- Use a shared JWT decoding utility (from `utils/auth_token.py`)
- Extract `sub` as the current `user_id`
- Reject unauthorized access with `401`

---

## 🛠 Dev Instructions

- Create a new folder under `routers/` and `schemas/` and `utils/` per service.
- Follow the pattern used in `auth-service`.
- Use proper logging (via `logger = logging.getLogger(__name__)`)
- Add unit tests under `tests/`
- Document endpoints using FastAPI's built-in OpenAPI (`@router.get(..., tags=["..."])`)

---

## 🤖 Instructions for Using ChatGPT to Help You

This file is designed to help you delegate coding tasks to ChatGPT effectively.

### 📌 Context to Share with GPT (copy/paste this to ChatGPT):

> "I’m working on a FastAPI microservices project called WorkBridge. The auth service is already complete and includes JWT authentication. I want you to help me develop the remaining services (Feed, Chat, Notification). Use Pydantic for schemas, SQLAlchemy for ORM, and JWT validation for secure endpoints. Validate tokens using `decode_access_token()` like in the auth service. Follow the same project structure and best practices."

---

## 💻 Technologies and Best Practices

Make sure to use the following technologies and conventions throughout the services:

| Layer | Technology | Notes |
|-------|------------|-------|
| API Layer | **FastAPI** | Use `APIRouter`, path operations, dependency injection |
| Models | **SQLAlchemy** | Define models inheriting from `Base`, use `Session` for DB access |
| Schemas | **Pydantic** | Input/output validation and type hinting |
| Auth | **JWT (via python-jose)** | Use shared JWT utilities for token decoding |
| Logs | **logging** | Use `logging.getLogger(__name__)` and write to file/console |
| DB | **PostgreSQL** | Run locally on port 5432 or via Docker |
| Testing | **pytest + TestClient** | Place tests under `tests/` folder |
| Dev Server | **Uvicorn** | Run with `--reload` in development |
| Docs | **OpenAPI (Swagger)** | Available by default at `/docs` in FastAPI |

---

## 📚 Example Prompt for GPT:

> "Help me build a `POST /posts/` endpoint in FastAPI. It should only allow users with valid JWT tokens (decoded with `decode_access_token`). The post should be stored in PostgreSQL with fields: id, author_id (from token), content, timestamp. Provide code for schema, model, and router."

---

## 🧠 Recommendations

- Use **Postman** or **Swagger UI** (`/docs`) for endpoint testing.
- Add logging to every service for debugging (`logs/service_name.log`).
- Keep endpoints RESTful.
- Commit frequently and follow meaningful commit messages.

---

## ✅ What You Should Build First

Start with:

1. `feed-service`
2. Add `/posts/` with JWT-based `author_id`
3. Add `/comments/` and `/like/`
4. Add unit tests
5. Log each request

Then move on to `chat-service`, and finally `notification-service`.

Good luck and feel free to ask for help via ChatGPT! 🧠✨