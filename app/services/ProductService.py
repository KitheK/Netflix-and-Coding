from app.repositories.FileProductRepository import FileProductRepository

class ProductService:
    def __init__(self):
        self.repo = FileProductRepository("app/data/Products.json")

    
    def get_all_products(self):
        return self.repo.load_products()
    
    def add_product(self, product):
        products = self.repo.load_products()
        products.append(product)
        self.repo.save_products(products)

    def search_products(self, keyword: str):
        products = self.repo.load_products()
        return [p for p in products if keyword.lower() in p.product_name.lower()]