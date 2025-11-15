# Main FastAPI application

from fastapi import FastAPI
from backend.routers import product_router
from backend.routers import auth_router, cart_router
# from backend.routers import (
#     review_router,
#     penalty_router,
#     export_router,
#     external_router
# )

# Create app
app = FastAPI(title="Netflix and Coding Store API")

#all routers
app.include_router(product_router.router)
app.include_router(auth_router.router)
app.include_router(cart_router.router)
# app.include_router(review_router.router)
# app.include_router(penalty_router.router)
# app.include_router(export_router.router)
# app.include_router(external_router.router)

# Root endpoint.
@app.get("/")
async def root():
    return {"message": "Welcome to the store API"}
