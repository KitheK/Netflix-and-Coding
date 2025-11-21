# Review Repository: Data access for reviews.json

from backend.repositories.base_repository import BaseRepository


class ReviewRepository(BaseRepository):
    """Repository for review data. Handles all data access to reviews.json."""
    
    def get_filename(self) -> str:
        return "reviews.json"
