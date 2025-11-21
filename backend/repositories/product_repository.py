# Product Repository: Data access for products.json

import os
from backend.repositories.base_repository import BaseRepository


# Repository for product data
#inherits from BaseRepository to get common load/save logic
class ProductRepository(BaseRepository):
    # Repository for product data
    # Handles all data access to products.json (or products_test.json in tests)
    
    # Return the filename for product data
    def get_filename(self) -> str:
        # Check environment variable first (for testing)
        env_file = os.environ.get("PRODUCTS_FILE")
        if env_file:
            return env_file
        
        # Default to products.json
        return "products.json"

#this repository is LOCKED to products.json (or products_test.json)
#it cannot access any other files like cart.json or users.json
