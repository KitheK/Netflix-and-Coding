"""Product Service: Business logic for product operations"""

from typing import Optional, List
from backend.models.product_model import Product
from backend.repositories.json_repository import JsonRepository


class ProductService:
    """Handles all business logic related to products"""
    
    def __init__(self, repository: JsonRepository):
        # JsonRepository is the data access class that gets data from json files
        self.repository = repository


    # helper method that basically loads and converts all products from the products.json to Product objects
    # so you call this at the beginning of your functions to get the full list of products, then you can filter/search as needed
    def _load_all_products(self) -> List[Product]:
        # Get raw data from repository
        raw_products = self.repository.load("products.json")
        
        # Convert each dictionary to Product object
        products = []
        for product_dict in raw_products:
            product = Product(**product_dict)
            products.append(product)
        
        return products
    


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
        
        #checks if keyword is in product name or category (case insensitive) and adds to the list of matching products then returns all matches (the list)
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


    

