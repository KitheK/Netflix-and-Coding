# Penalty Repository: Data access for penalties.json

from backend.repositories.base_repository import BaseRepository


class PenaltyRepository(BaseRepository):
    """Repository for penalty data. Handles all data access to penalties.json."""
    
    def get_filename(self) -> str:
        return "penalties.json"
