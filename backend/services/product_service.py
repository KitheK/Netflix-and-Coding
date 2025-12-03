# Product Service: Business logic for product operations

import uuid
import string
import random
from typing import List, Optional
from backend.models.product_model import Product
from backend.services.image_scraper_service import ImageScraperService
from backend.repositories.product_repository import ProductRepository


class ProductService:
    # Handles all business logic related to products
    
    def __init__(self):
        # Create our own ProductRepository internally
        # ProductRepository is locked to products.json (or products_test.json in tests)
        self.repository = ProductRepository()
        self.image_scraper = ImageScraperService()

    # Load all products from repository
    def _repo_load(self) -> List[dict]:
        return self.repository.get_all()

    # Save all products to repository
    def _repo_save(self, data: List[dict]) -> None:
        self.repository.save_all(data)
    

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

    def update_product(self, product_id: str, product_name: Optional[str] = None,
                      category: Optional[str] = None, discounted_price: Optional[float] = None,
                      actual_price: Optional[float] = None, discount_percentage: Optional[float] = None,
                      about_product: Optional[str] = None, img_link: Optional[str] = None,
                      product_link: Optional[str] = None, rating: Optional[float] = None,
                      rating_count: Optional[int] = None) -> Product:
        """
        Update an existing product (admin only).
        Only updates fields that are provided (not None).
        Raises ValueError if product doesn't exist or validation fails.
        """
        products = self._load_all_products()
        
        # Find the product to update
        product_index = None
        existing_product = None
        for idx, product in enumerate(products):
            if product.product_id == product_id:
                product_index = idx
                existing_product = product
                break
        
        if existing_product is None:
            raise ValueError(f"Product with ID {product_id} not found")
        
        # Validate fields if provided
        if product_name is not None and len(product_name.strip()) == 0:
            raise ValueError("Product name cannot be empty")
        if category is not None and len(category.strip()) == 0:
            raise ValueError("category cannot be empty")
        if discounted_price is not None and discounted_price <= 0:
            raise ValueError("discounted_price must be greater than 0")
        if actual_price is not None and actual_price <= 0:
            raise ValueError("actual_price must be greater than 0")
        if discount_percentage is not None and (discount_percentage < 0 or discount_percentage > 100):
            raise ValueError("discount percentage must be between 0 and 100")
        if about_product is not None and len(about_product.strip()) == 0:
            raise ValueError("description cannot be empty")
        if img_link is not None and len(img_link.strip()) == 0:
            raise ValueError("image link cannot be empty")
        if product_link is not None and len(product_link.strip()) == 0:
            raise ValueError("product link cannot be empty")
        if rating is not None and (rating < 0 or rating > 5):
            raise ValueError("rating must be between 0 and 5")
        
        # Update only provided fields
        updated_product = Product(
            product_id=existing_product.product_id,
            product_name=product_name.strip() if product_name is not None else existing_product.product_name,
            category=category.strip() if category is not None else existing_product.category,
            discounted_price=discounted_price if discounted_price is not None else existing_product.discounted_price,
            actual_price=actual_price if actual_price is not None else existing_product.actual_price,
            discount_percentage=discount_percentage if discount_percentage is not None else existing_product.discount_percentage,
            about_product=about_product.strip() if about_product is not None else existing_product.about_product,
            img_link=img_link.strip() if img_link is not None else existing_product.img_link,
            product_link=product_link.strip() if product_link is not None else existing_product.product_link,
            rating=rating if rating is not None else existing_product.rating,
            rating_count=rating_count if rating_count is not None else existing_product.rating_count
        )
        
        # Replace the product in the list
        products[product_index] = updated_product
        
        # Persist changes
        updated_list = [p.model_dump() for p in products]
        self._repo_save(updated_list)
        
        return updated_product

    def delete_product(self, product_id: str) -> Product:
        """
        Delete a product by ID (admin only).
        Raises ValueError if product doesn't exist.
        Returns the deleted product for confirmation.
        """
        products = self._load_all_products()
        
        # Find the product to delete
        product_to_delete = None
        remaining_products = []
        
        for product in products:
            if product.product_id == product_id:
                product_to_delete = product
            else:
                remaining_products.append(product)
        
        if product_to_delete is None:
            raise ValueError(f"Product with ID {product_id} not found")
        
        # Save the updated list (without the deleted product)
        updated_list = [p.model_dump() for p in remaining_products]
        self._repo_save(updated_list)
        
        return product_to_delete

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
    
    def fetch_and_update_image(self, product_id: str) -> Product:
        """
        Fetch the product image from Amazon and update the product.
        
        Args:
            product_id: ID of the product to update
            
        Returns:
            Updated Product with new image URL
            
        Raises:
            ValueError: If product not found or image fetch fails
        """
        # Get the product first
        product = self.get_product_by_id(product_id)
        if product is None:
            raise ValueError(f"Product with ID {product_id} not found")
        
        # Fetch the image URL from Amazon
        new_image_url = self.image_scraper.fetch_image_url(product.product_link)
        
        if not new_image_url:
            raise ValueError(f"Failed to fetch image from product link: {product.product_link}")
        
        # Update the product with the new image URL
        updated_product = self.update_product(
            product_id=product_id,
            img_link=new_image_url
        )
        
        return updated_product
    
    def fetch_all_images(self) -> dict:
        """
        Fetch images for all products and update them.
        
        Returns:
            Dictionary with statistics about the operation:
            - total: Total number of products
            - updated: Number of products successfully updated
            - failed: Number of products that failed to update
            - errors: List of product IDs that failed
        """
        products = self._load_all_products()
        total = len(products)
        updated = 0
        failed = 0
        errors = []
        
        for product in products:
            try:
                self.fetch_and_update_image(product.product_id)
                updated += 1
            except Exception as e:
                failed += 1
                errors.append({
                    "product_id": product.product_id,
                    "product_name": product.product_name,
                    "error": str(e)
                })
        
        return {
            "total": total,
            "updated": updated,
            "failed": failed,
            "errors": errors
        }