# backend/repositories/wishlist_repository.py

import json
from pathlib import Path
from typing import List, Dict
from backend.repositories.base_repository import BaseRepository


class WishlistRepository(BaseRepository):
    """
    Repository for managing user wishlists.
    Stores data in a JSON file in the format: {user_id: [product_id, ...], ...}
    """

    def get_filename(self) -> str:
        return "wishlist.json"

    # Override get_all to return a dict instead of a list
    def get_all(self) -> Dict[str, List[str]]:
        file_path = self.data_dir / self.get_filename()
        if not file_path.exists():
            return {}

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
                return {}
        except (json.JSONDecodeError, IOError):
            return {}

    # Override save_all to accept dict
    def save_all(self, data: Dict[str, List[str]]) -> None:
        file_path = self.data_dir / self.get_filename()
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get_wishlist(self, user_id: str) -> List[str]:
        """
        Return the wishlist for a specific user.
        """
        data = self.get_all()
        return data.get(user_id, [])

    def add_to_wishlist(self, user_id: str, product_id: str) -> None:
        """
        Add a product to a user's wishlist. Avoid duplicates.
        """
        data = self.get_all()
        if user_id not in data:
            data[user_id] = []

        if product_id not in data[user_id]:
            data[user_id].append(product_id)

        self.save_all(data)
