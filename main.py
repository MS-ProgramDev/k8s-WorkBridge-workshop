import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
from routers import auth as auth_routes
from routers import chat as chat_routes
from routers import feed as post_routes
from utils import logging_config
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.models import APIKey, APIKeyIn, SecuritySchemeType



app = FastAPI(
    title="WorkBridge API",
    description="Slack-like corporate communication platform API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(post_routes.router)
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(chat_routes.router, prefix="/chat", tags=["chat"])


bearer_scheme = HTTPBearer()

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="WorkBridge API",
        version="1.0.0",
        description="API for login, register and feed.",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", []).append({"BearerAuth": []})
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
@app.get("/")
async def root():
    return {"message": "Welcome to WorkBridge API", "docs": "/docs"}

@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)