from fastapi import APIRouter, HTTPException, Depends
from app.services.CartService import CartService
from app.services.AuthService import AuthService
from app.models.Customer import CartItemAdd, CartResponse

router = APIRouter(prefix="/cart", tags=["Cart"])
cart_service = CartService()


@router.get("/{user_id}", response_model=CartResponse)
def get_cart(user_id: int):
    """Get user's cart"""
    try:
        cart = cart_service.get_user_cart(user_id)
        return cart.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{user_id}/items")
def add_to_cart(user_id: int, item_data: CartItemAdd):
    """Add item to cart"""
    try:
        cart_service.add_to_cart(user_id, item_data.product_id, item_data.quantity)
        return {"message": "Item added to cart successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{user_id}/items/{product_id}")
def remove_from_cart(user_id: int, product_id: int):
    """Remove item from cart"""
    try:
        cart_service.remove_from_cart(user_id, product_id)
        return {"message": "Item removed from cart successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{user_id}/clear")
def clear_cart(user_id: int):
    """Clear entire cart"""
    try:
        cart_service.clear_cart(user_id)
        return {"message": "Cart cleared successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))