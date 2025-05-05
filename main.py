import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
from routers import auth as auth_routes
from routers import chat as chat_routes
from utils import logging_config
from fastapi.middleware.cors import CORSMiddleware



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
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(chat_routes.router, prefix="/chat", tags=["chat"])

@app.get("/")
async def root():
    return {"message": "Welcome to WorkBridge API", "docs": "/docs"}

@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)