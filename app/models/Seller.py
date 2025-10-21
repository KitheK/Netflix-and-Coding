from app.models.Users import User, UserRole
from app.models.Product import Product
from app.models.Admin import AnalyticsDashboard
from typing import List

class Seller(User):
    def __init__(self, user_id: int, name: str, email: str, password_hash: str, analytics: AnalyticsDashboard):
        super().__init__(user_id, name, email, password_hash, UserRole.SELLER)
        self.products = []
        self.analytics = analytics

    def add_product(self, product):
        self.products.append(product)

    def update_product(self, product_id, details):
        for p in self.products:
            if p.product_id == product_id:
                p.__dict__.update(details)
                print(f"Product {product_id} updated.")
                return
            print(f"Product {product_id} not found.")

    def remove_product(self, product_id):
        self.products = [p for p in self.products if p.product_id != product_id]
        print(f"Product {product_id} removed.")

    def view_sales_report(self):
        return self.analytics.generate_report(self.user_id)
