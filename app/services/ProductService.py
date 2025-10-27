from typing import List
from app.repositories.FileProductRepository import FileProductRepository

class ProductService:
    def __init__(self):
        self.repo = FileProductRepository("app/data/Products.json")

    
    def get_all_products(self):
        return self.repo.load_products()
    
    def get_product_by_id(self, product_id: str):
        return self.repo.get_product_by_id(product_id)
    
    def update_product(self, product_id: str, updated_product):
        self.repo.update_product(product_id, updated_product)
    
    def delete_product(self, product_id: str):
        self.repo.delete_product(product_id)
    
    def get_products_by_category(self, category: str) -> List:
        return self.repo.get_products_by_category(category)

    def add_product(self, product):
        products = self.repo.load_products()
        products.append(product)
        self.repo.save_products(products)

    def search_products(self, keyword: str):
        products = self.repo.load_products()
        return [p for p in products if keyword.lower() in p.product_name.lower()]