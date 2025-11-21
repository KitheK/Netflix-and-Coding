# Cart Repository: Data access for cart.json

from backend.repositories.base_repository import BaseRepository
import json
from typing import Dict, Any


class CartRepository(BaseRepository):
    """Repository for cart data. Handles all data access to cart.json.
    
    Cart.json uses a dict structure (not array) for O(1) user lookup:
    {"user_id": {"items": [...]}, ...}
    """
    
    def get_filename(self) -> str:
        return "cart.json"
    
    # Override get_all abstract method from the base_repository to return dict instead of the default list (array)
    #the cart repository uses a dict structure for O(1) user lookup for finding a users cart. this couldve been converted to an array (which would match all other load/save methods, so no need to override)
    #but if we converted it to an array, then finding a users cart would be O(n) which is less efficient. the lookup speed is insignificant for small data, but if this was a real app with many users, it would be alot slower.

    def get_all(self) -> Dict[str, Any]:
        file_path = self.data_dir / self.get_filename()
        
        # Return empty dict if file doesn't exist
        if not file_path.exists():
            return {}
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Ensure we return a dict
                if isinstance(data, dict):
                    return data
                else:
                    return {}
        except (json.JSONDecodeError, IOError):
            return {}
    
    # Override save_all to accept dict
    def save_all(self, data: Dict[str, Any]) -> None:
        file_path = self.data_dir / self.get_filename()
        
        # Write data to file with pretty formatting
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

