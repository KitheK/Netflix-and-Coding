from fastapi import APIRouter, HTTPException
from typing import List
from backend.services.cart_service import CartService
from backend.models.cart_model import Cart, CartItem, AddToCartRequest

router = APIRouter()
cart_service = CartService()

@router.get("/{user_id}", response_model=Cart)
async def get_cart(user_id: str):
    """Get user's cart"""
    try:
        cart = cart_service.get_cart(user_id)
        return cart
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{user_id}/add", response_model=Cart)
async def add_to_cart(user_id: str, request: AddToCartRequest):
    """Add item to cart"""
    try:
        cart = cart_service.add_to_cart(user_id, request.product_id, request.quantity)
        return cart
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{user_id}/update", response_model=Cart)
async def update_cart_item(user_id: str, product_id: str, quantity: int):
    """Update cart item quantity"""
    try:
        cart = cart_service.update_cart_item_quantity(user_id, product_id, quantity)
        return cart
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{user_id}/remove/{product_id}", response_model=Cart)
async def remove_from_cart(user_id: str, product_id: str):
    """Remove item from cart"""
    try:
        cart = cart_service.remove_from_cart(user_id, product_id)
        return cart
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{user_id}/clear")
async def clear_cart(user_id: str):
    """Clear all items from cart"""
    try:
        cart_service.clear_cart(user_id)
        return {"message": "Cart cleared successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))