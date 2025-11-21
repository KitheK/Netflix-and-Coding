# Product Repository: Data access for products.json

import os
from backend.repositories.base_repository import BaseRepository


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
