"""
Script to clean products.json data - converts string prices/percentages to numbers.
Run this once to create a cleaned version of the products data.
"""

import json
from pathlib import Path


def clean_price(value):
    """Convert '₹399' or '₹1,099' to 399.0"""
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = value.replace('₹', '').replace(',', '').strip()
    return float(cleaned) if cleaned else 0.0


def clean_percentage(value):
    """Convert '64%' to 64.0"""
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = value.replace('%', '').strip()
    return float(cleaned) if cleaned else 0.0


def clean_rating_count(value):
    """Convert '24,269' to 24269"""
    if value is None or value == '':
        return None
    if isinstance(value, int):
        return value
    cleaned = str(value).replace(',', '').strip()
    return int(cleaned) if cleaned else None


def clean_rating(value):
    """Convert rating string to float"""
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(value) if value else 0.0
    except (ValueError, TypeError):
        # Handle invalid ratings like '|'
        return 0.0


def main():
    # Load original products
    products_path = Path(__file__).parent / 'products.json'
    with open(products_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Loaded {len(products)} products")
    
    # Clean each product
    cleaned_products = []
    for product in products:
        cleaned = {
            'product_id': product['product_id'],
            'product_name': product['product_name'],
            'category': product['category'],
            'discounted_price': clean_price(product['discounted_price']),
            'actual_price': clean_price(product['actual_price']),
            'discount_percentage': clean_percentage(product['discount_percentage']),
            'rating': clean_rating(product['rating']),
            'rating_count': clean_rating_count(product.get('rating_count')),
            'about_product': product['about_product'],
            'user_id': product['user_id'],
            'user_name': product['user_name'],
            'review_id': product['review_id'],
            'review_title': product['review_title'],
            'review_content': product['review_content'],
            'img_link': product['img_link'],
            'product_link': product['product_link'],
        }
        cleaned_products.append(cleaned)
    
    # Overwrite products.json with cleaned data
    with open(products_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_products, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Cleaned and updated {len(cleaned_products)} products in {products_path.name}")
    print("\nExample cleaned product:")
    print(f"  Discounted Price: {cleaned_products[0]['discounted_price']}")
    print(f"  Discount: {cleaned_products[0]['discount_percentage']}%")
    print(f"  Rating Count: {cleaned_products[0]['rating_count']}")


if __name__ == '__main__':
    main()
