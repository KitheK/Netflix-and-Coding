from backend.repositories.wishlist_repository import WishlistRepository

class WishlistService:
    def __init__(self):
        self.repo = WishlistRepository()

    def add_to_wishlist(self, user_id: str, product_id: str):
        wishlist = self.repo.get_wishlist(user_id)
        wishlist.append(product_id)
        self.repo.save_wishlist(user_id, wishlist)
        return {"user_id": user_id, "wishlist": wishlist}

    def get_wishlist(self, user_id: str):
        return self.repo.get_wishlist(user_id)
