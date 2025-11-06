from fastapi import FastAPI
from app.controllers import APIController


app = FastAPI(title="Web Shopping Service")

# Mount all versioned API routes under /api
app.include_router(APIController.router)


@app.get("/")
def root():
    return {"message": "Welcome to the Web Shopping Service"}