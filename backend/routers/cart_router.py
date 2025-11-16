"""Cart Router: API endpoints for shopping cart operations"""

#this file has 4 API endpoints for cart operations: add to cart, get cart, remove from cart, update cart item quantity
# Frontend sends user_token for authentication, backend translates it to user_id (UUID) for cart storage

from fastapi import APIRouter, HTTPException, Query
from backend.models.cart_model import AddToCartRequest, UpdateCartRequest, CartResponse
from backend.services.cart_service import CartService
from backend.services.product_service import ProductService
from backend.repositories.json_repository import JsonRepository

# Create router with prefix /cart.  so they will be like /cart/add, /cart/, etc.
router = APIRouter(prefix="/cart", tags=["cart"])

# initialize dependencies (repository -> services)
repository = JsonRepository()
product_service = ProductService(repository)
cart_service = CartService(repository, product_service)


# POST /cart/add - Add a product to users cart
#how it works:
# IN: Request body JSON → {"user_token": "...", "product_id": "...", "quantity": 2}
# MIDDLE: cart_service looks up user_id from token, then does the work (validate, load, update, save)
# OUT: Returns → {"message": "Item added to cart", "product_id": "...", "quantity": 2}
@router.post("/add")
def add_to_cart(request: AddToCartRequest):
    # Get user_id from token
    user_id = cart_service._get_user_id_from_token(request.user_token)
    
    result = cart_service.add_to_cart(
        user_id=user_id,
        product_id=request.product_id,
        quantity=request.quantity
    )
    return result


# GET /cart - get users cart with total price (uses token in query param)
@router.get("/", response_model=CartResponse)
def get_cart(user_token: str = Query(..., description="User authentication token")):
    # Get user_id from token
    user_id = cart_service._get_user_id_from_token(user_token)
    cart = cart_service.get_cart(user_id)
    return cart


# DELETE /cart/remove/{product_id} - Remove a product from cart
@router.delete("/remove/{product_id}")
def remove_from_cart(
    product_id: str,
    user_token: str = Query(..., description="User authentication token")
):
    """Remove a product completely from user's cart"""
    # Get user_id from token
    user_id = cart_service._get_user_id_from_token(user_token)
    result = cart_service.remove_from_cart(user_id, product_id)
    return result


# PUT /cart/update/{product_id} - Update quantity of a product in cart
@router.put("/update/{product_id}")
def update_cart_item(product_id: str, request: UpdateCartRequest):
    # Get user_id from token
    user_id = cart_service._get_user_id_from_token(request.user_token)
    
    result = cart_service.update_cart_item(
        user_id=user_id,
        product_id=product_id,
        quantity=request.quantity
    )
    return result
