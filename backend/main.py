# Main FastAPI application

from fastapi import FastAPI
from backend.routers import product_router
from backend.routers import auth_router, cart_router, transaction_router, penalty_router, review_router, external_router, wishlist_router
# from backend.routers import (
#     export_router,
# )

# Create app
app = FastAPI(title="Netflix and Coding Store API")

#all routers
app.include_router(product_router.router)
app.include_router(auth_router.router)
app.include_router(cart_router.router)
app.include_router(transaction_router.router)
app.include_router(penalty_router.router)  # Enable penalty router
app.include_router(review_router.router)
app.include_router(external_router.router)  # Enable external router (currency conversion)
app.include_router(wishlist_router.router)  # Enable wishlist router
# app.include_router(export_router.router)

# Root endpoint.
@app.get("/")
async def root():
    return {"message": "Welcome to the store API"}
