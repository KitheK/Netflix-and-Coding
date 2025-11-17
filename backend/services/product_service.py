"""Product Service: Business logic for product operations"""

import os
import uuid
import string
import random
from typing import Optional, List
from backend.models.product_model import Product
from backend.repositories.json_repository import JsonRepository


class ProductService:
    """Handles all business logic related to products"""
    
    def __init__(self, repository: JsonRepository):
        # JsonRepository is the data access class that gets data from json files
        self.repository = repository
        # choose product file:
        # 1) explicit env var PRODUCTS_FILE (expected to be a filename under data dir)
        # 2) products_test.json if present (tests create this file)
        # 3) fallback to products.json
        self.product_file = os.environ.get("PRODUCTS_FILE")
        if not self.product_file:
            test_path = os.path.join("backend", "data", "products_test.json")
            if os.path.exists(test_path):
                self.product_file = "products_test.json"
            else:
                self.product_file = "products.json"

    def _repo_load(self, filename: Optional[str] = None) -> List[dict]:
        """Load data from repository. Use configured product_file by default."""
        filename = filename or self.product_file
        for name in ("load", "get_all", "read", "read_all"):
            fn = getattr(self.repository, name, None)
            if callable(fn):
                try:
                    return fn(filename)
                except TypeError:
                    return fn()
        raise AttributeError("Repository has no load/get_all/read method")

    def _repo_save(self, data: List[dict], filename: Optional[str] = None) -> None:
        """Save data to repository. Use configured product_file by default."""
        filename = filename or self.product_file
        for name in ("save", "write", "write_all", "save_all"):
            fn = getattr(self.repository, name, None)
            if callable(fn):
                try:
                    return fn(filename, data)
                except TypeError:
                    return fn(data)
        raise AttributeError("Repository has no save/write method")
    

    # helper method that basically loads and converts all products from the products.json to Product objects
    # so you call this at the beginning of your functions to get the full list of products, then you can filter/search as needed
    def _load_all_products(self) -> List[Product]:
        # Get raw data from repository
        raw_products = self._repo_load() or []
        
        # Convert each dictionary to Product object (skip malformed entries)
        products = []
        for product_dict in raw_products:
            try:
                product = Product(**product_dict)
                products.append(product)
            except Exception:
                # ignore malformed entries (keeps backward compatibility with mixed data files)
                continue
        
        return products
    
    def _generate_productID(self, existing_ids: set, length: int = 10, max_attempts: int = 10000) -> str:
        """
        Generate a 10-character ASIN-like ID (uppercase letters + digits) and ensure uniqueness
        against existing_ids. Raises RuntimeError if unique id cannot be found within attempts.
        """
        alphabet = string.ascii_uppercase + string.digits
        for _ in range(max_attempts):
            candidate = "".join(random.choice(alphabet) for _ in range(length))
            if candidate not in existing_ids:
                return candidate
        raise RuntimeError("Unable to generate unique product_id after many attempts")
    
    def create_product(self, product_name: str, category: str, discounted_price: float, 
                      actual_price: float, discount_percentage: float, about_product: str, 
                      img_link: str, product_link: str, rating: float = 0.0, 
                      rating_count: Optional[int] = None) -> Product:
        """
        Create a new product (admin only).
        Validates fields and assigns unique product_id.
        """
        products = self._load_all_products()
        existing_ids = {p.product_id for p in products if getattr(p, "product_id", None)}

        # Validate fields (use messages that tests expect)
        if not product_name or len(product_name.strip()) == 0:
            raise ValueError("Product name cannot be empty")
        if not category or len(category.strip()) == 0:
            raise ValueError("category cannot be empty")
        if discounted_price <= 0:
            raise ValueError("discounted_price must be greater than 0")
        if actual_price <= 0:
            raise ValueError("actual_price must be greater than 0")
        if discount_percentage < 0 or discount_percentage > 100:
            raise ValueError("discount percentage must be between 0 and 100")
        if not about_product or len(about_product.strip()) == 0:
            raise ValueError("description cannot be empty")
        if not img_link or len(img_link.strip()) == 0:
            raise ValueError("image link cannot be empty")
        if not product_link or len(product_link.strip()) == 0:
            raise ValueError("product link cannot be empty")
        if rating < 0 or rating > 5:
            raise ValueError("rating must be between 0 and 5")
         
         
        product_id = self._generate_productID(existing_ids)

        # Generate unique product ID
        
        new_product = Product(
            product_id=product_id,
            product_name=product_name.strip(),
            category=category.strip(),
            discounted_price=discounted_price,
            actual_price=actual_price,
            discount_percentage=discount_percentage,
            about_product=about_product.strip(),
            img_link=img_link.strip(),
            product_link=product_link.strip(),
            rating=rating,
            rating_count=rating_count
        )

        # Persist to configured products file
        updated_list = [p.model_dump() for p in products]
        updated_list.append(new_product.model_dump())
        self._repo_save(updated_list)

        return new_product

    def get_all_products(self) -> List[Product]:
        # Load and return all products (no filtering)
        return self._load_all_products()
    

    def get_product_by_id(self, product_id: str) -> Optional[Product]:
        # Load all products using helper method
        products = self._load_all_products()
        
        # Search through products to find matching ID
        for product in products:
            if product.product_id == product_id:
                return product  # Return the found product
        
        # If we get here, product wasn't found
        print(f"Product not found: {product_id}")
        return None
    

    def get_product_by_keyword(self, keyword: str) -> List[Product]:
        # Load all products using helper method
        products = self._load_all_products()
        
        # checks if keyword is in product name or category (case insensitive) and adds to the list of matching products then returns all matches (the list)
        matching_products = []
        for product in products:
            if keyword.lower() in product.product_name.lower() or keyword.lower() in product.category.lower():
                matching_products.append(product)
            
        return matching_products
    

    def sort_products(self, products: List[Product], sort_by: str) -> List[Product]:
        # Sort a list of products by the specified field.
        # sort_by options:
        # - 'price_asc': Price low to high
        # - 'price_desc': Price high to low
        # - 'rating_asc': Rating low to high
        # - 'rating_desc': Rating high to low
        # - 'discount_asc': Discount low to high
        # - 'discount_desc': Discount high to low
        
        if sort_by == "price_asc":
            return sorted(products, key=lambda p: p.discounted_price)
        elif sort_by == "price_desc":
            return sorted(products, key=lambda p: p.discounted_price, reverse=True)
        elif sort_by == "rating_asc":
            return sorted(products, key=lambda p: p.rating)
        elif sort_by == "rating_desc":
            return sorted(products, key=lambda p: p.rating, reverse=True)
        elif sort_by == "discount_asc":
            return sorted(products, key=lambda p: p.discount_percentage)
        elif sort_by == "discount_desc":
            return sorted(products, key=lambda p: p.discount_percentage, reverse=True)
        else:
            return products  # no sorting if invalid option