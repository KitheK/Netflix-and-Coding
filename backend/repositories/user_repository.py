# User Repository: Data access for users.json

import os
from backend.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):
    # Repository for user data
    # Handles all data access to users.json
    
    # Return the filename for user data
    def get_filename(self) -> str:
        # Check environment variable first (for testing)
        env_file = os.environ.get("USERS_FILE")
        if env_file:
            return env_file
        
        # Default to users.json
        return "users.json"
