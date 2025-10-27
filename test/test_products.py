import json
from typing import List, Optional
from app.models.Product import Product  # Only import Product, not Review

class FileProductRepository:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load_products(self) -> List[Product]:
        """Load products from JSON file"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                
            products = []
            for item in data:
                # Convert string prices to floats for the Product class
                product_data = {
                    'product_id': str(item.get('id', '')),
                    'product_name': item.get('product_name', ''),
                    'category': item.get('category', ''),
                    'discounted_price': float(item.get('discounted_price', 0)),
                    'actual_price': float(item.get('actual_price', 0)),
                    'discount_percentage': float(item.get('discount_percentage', 0)),
                    'rating': float(item.get('rating', 0)),
                    'rating_count': int(item.get('rating_count', 0)),
                    'about_product': item.get('about_product', ''),
                    'img_link': item.get('img_link', ''),
                    'product_link': item.get('product_link', '')
                }
                products.append(Product.from_dict(product_data))
                
            return products
            
        except FileNotFoundError:
            print(f"File {self.file_path} not found")
            return []
        except json.JSONDecodeError:
            print(f"Invalid JSON in {self.file_path}")
            return []
        except Exception as e:
            print(f"Error loading products: {e}")
            return []

    def save_products(self, products: List[Product]):
        """Save products to JSON file"""
        try:
            data = [product.to_dict() for product in products]
            with open(self.file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving products: {e}")

    def get_all_products(self) -> List[Product]:
        return self.load_products()

    def get_product_by_id(self, product_id: str) -> Optional[Product]:
        products = self.load_products()
        for product in products:
            if product.product_id == product_id:
                return product
        return None

    def search_products(self, query: str) -> List[Product]:
        products = self.load_products()
        query = query.lower()
        return [
            product for product in products
            if query in product.product_name.lower() or query in product.category.lower()
        ]