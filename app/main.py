from fastapi import FastAPI
from app.routers import ProductRouter



app = FastAPI(title = "Web Shopping Service")

app.include_router(ProductRouter.router)


app.get("/")
def root():
    return {"message": "Welcome to the Web Shopping Service"}