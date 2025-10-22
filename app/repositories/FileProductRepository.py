from app.repositories.IProductRepository import IProductRepository
from app.repositories.FileStorageManager import FileStorageManager
from app.models.Product import Product, Review
import json

class FileProductRepository(IProductRepository):
    def __init__(self, file_path: str = "app/data/Products.json"):
        self.file_path = file_path
        self.storage = FileStorageManager()

    def load_products(self) -> list[Product]:
        """Loads product data from JSON, builds Product and Review objects."""
        data = self.storage.read_json(self.file_path)
        products = []

        for item in data:
            product = Product(
                product_id=item.get("product_id", ""),
                product_name=item.get("product_name", ""),
                category=item.get("category", ""),
                discounted_price=item.get("discounted_price", ""),
                actual_price=item.get("actual_price", ""),
                discount_percentage=item.get("discount_percentage", ""),
                rating=item.get("rating", ""),
                rating_count=int(item.get("rating_count", "0").replace(",", "")) if item.get("rating_count") else 0,
                about_product=item.get("about_product", ""),
                img_link=item.get("img_link", ""),
                product_link=item.get("product_link", "")
            )

            # Add reviews
            if "user_id" in item:
                user_ids = item.get("user_id", "").split(",")
                user_names = item.get("user_name", "").split(",")
                review_ids = item.get("review_id", "").split(",")
                review_titles = item.get("review_title", "").split(",")
                review_contents = item.get("review_content", "").split(",")

                for i in range(len(user_ids)):
                    review = Review(
                        review_id=review_ids[i] if i < len(review_ids) else "N/A",
                        user_id=user_ids[i],
                        user_name=user_names[i] if i < len(user_names) else "Unknown",
                        rating=0.0,
                        title=review_titles[i] if i < len(review_titles) else "",
                        content=review_contents[i] if i < len(review_contents) else ""
                    )
                    product.add_review(review)

            products.append(product)

        return products

    def save_products(self, products: list[Product]) -> None:
        """Saves product data back to JSON (including any new reviews)."""
        self.storage.write_json(self.file_path, [p.to_dict() for p in products])
