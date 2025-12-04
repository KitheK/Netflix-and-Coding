from fastapi import APIRouter, Depends
from pydantic import BaseModel
from backend.services.wishlist_service import WishlistService
from backend.repositories.wishlist_repository import WishlistRepository

router = APIRouter(prefix="/wishlist", tags=["wishlist"])
service = WishlistService()

# Pydantic model for POST requests
class WishlistItem(BaseModel):
    user_id: str
    product_id: str

@router.get("/{user_id}")
def get_wishlist(user_id: str, repo: WishlistRepository = Depends(WishlistRepository)):
    return repo.get_wishlist(user_id)

@router.post("/add")
def add_to_wishlist(item: WishlistItem, repo: WishlistRepository = Depends(WishlistRepository)):
    repo.add_to_wishlist(item.user_id, item.product_id)
    return {"message": "Added to wishlist"}

@router.delete("/{user_id}/{product_id}")
def remove_from_wishlist(user_id: str, product_id: str, repo: WishlistRepository = Depends(WishlistRepository)):
    data = repo.get_all()
    if user_id in data and product_id in data[user_id]:
        data[user_id] = [pid for pid in data[user_id] if pid != product_id]
        repo.save_all(data)
        return {"message": "Removed from wishlist"}
    return {"message": "Item not in wishlist"}
