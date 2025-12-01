from backend.repositories.base_repository import BaseRepository
from typing import Dict, List, Any
import json

class WishlistRepository(BaseRepository):
    """Handles reading and writing to wishlist.json"""

    def get_filename(self) -> str:
        return "wishlist.json"

    def get_all(self) -> Dict[str, List[str]]:
        file_path = self.data_dir / self.get_filename()

        if not file_path.exists():
            return {}

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    def save_all(self, data: Dict[str, List[str]]):
        file_path = self.data_dir / self.get_filename()
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
