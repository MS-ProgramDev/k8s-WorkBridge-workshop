import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
from routers import auth as auth_routes
app = FastAPI()

app.include_router(auth_routes.router)





@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}



if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)
  #uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True, access_log=False)