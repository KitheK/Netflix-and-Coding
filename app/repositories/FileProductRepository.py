from app.repositories.IProductRepository import IProductRepository
from app.repositories.FileStorageManager import FileStorageManager
from app.models.Product import Product
from app.models.Review import Review
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
            # Clean numeric fields by removing currency symbols and percentage signs
            def clean_price(price_str):
                if isinstance(price_str, (int, float)):
                    return float(price_str)
                if isinstance(price_str, str):
                    try:
                        # Remove currency symbols, commas, and extra whitespace
                        clean_str = price_str.replace('₹', '').replace(',', '').replace('$', '').strip()
                        if clean_str:
                            return max(0.0, float(clean_str))
                    except ValueError:
                        pass
                return 0.0
            
            def clean_percentage(percent_str):
                if isinstance(percent_str, (int, float)):
                    return float(percent_str)
                if isinstance(percent_str, str):
                    try:
                        clean_str = percent_str.replace('%', '').strip()
                        if clean_str:
                            percentage = float(clean_str)
                            # Clamp between 0 and 100
                            return max(0.0, min(100.0, percentage))
                    except ValueError:
                        pass
                return 0.0
            
            def clean_rating(rating_str):
                if isinstance(rating_str, (int, float)):
                    return float(rating_str)
                if isinstance(rating_str, str) and rating_str.strip():
                    # Handle edge cases like "|", empty strings, or non-numeric values
                    clean_str = rating_str.strip()
                    try:
                        # Try to extract numeric part if it contains numbers
                        import re
                        numeric_match = re.search(r'[\d.]+', clean_str)
                        if numeric_match:
                            rating_val = float(numeric_match.group())
                            # Clamp rating between 0 and 5
                            return max(0.0, min(5.0, rating_val))
                        return 0.0
                    except (ValueError, AttributeError):
                        return 0.0
                return 0.0
            
            # Truncate product name if too long
            product_name = item.get("product_name", "")
            if len(product_name) > 200:
                product_name = product_name[:197] + "..."
            
            product = Product(
                product_id=item.get("product_id", ""),
                product_name=product_name,
                category=item.get("category", ""),
                discounted_price=clean_price(item.get("discounted_price", "0")),
                actual_price=clean_price(item.get("actual_price", "0")),
                discount_percentage=clean_percentage(item.get("discount_percentage", "0")),
                rating=clean_rating(item.get("rating", "0")),
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

    # --- Additional operations used by ProductService ---
    def get_product_by_id(self, product_id):
        """Return a single product by ID (supports string IDs like ASINs)."""
        pid = str(product_id)
        for p in self.load_products():
            if str(p.product_id) == pid:
                return p
        raise ValueError(f"Product not found: {product_id}")

    def update_product(self, product_id, updated_fields: dict):
        """Update fields of a product and persist to storage."""
        pid = str(product_id)
        products = self.load_products()
        found = False
        for p in products:
            if str(p.product_id) == pid:
                for k, v in (updated_fields or {}).items():
                    if hasattr(p, k) and v is not None:
                        setattr(p, k, v)
                found = True
                break
        if not found:
            raise ValueError(f"Product not found: {product_id}")
        self.save_products(products)
        return self.get_product_by_id(pid)

    def delete_product(self, product_id):
        """Delete a product by ID and persist to storage."""
        pid = str(product_id)
        products = self.load_products()
        new_products = [p for p in products if str(p.product_id) != pid]
        if len(new_products) == len(products):
            raise ValueError(f"Product not found: {product_id}")
        self.save_products(new_products)
