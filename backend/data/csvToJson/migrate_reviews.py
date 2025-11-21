"""
Script to migrate reviews from amazon.csv to reviews.json with nested dict structure
Structure: {"product_id": [review_objects]}
"""
import csv
import json
from pathlib import Path


def parse_csv_reviews():
    """Parse amazon.csv and extract reviews organized by product_id"""
    # Navigate to amazon.csv which is two directories up from this script
    csv_path = Path(__file__).parent.parent / "amazon.csv"
    
    # Will store all reviews organized by product_id
    # Structure: {"product_id": [list of review dicts]}
    reviews_by_product = {}
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        # CSV reader automatically handles quoted fields and commas within quotes
        reader = csv.DictReader(f)
        
        # Process each row (each row = one product with multiple reviews)
        for row in reader:
            product_id = row['product_id']
            
            # Each CSV field contains comma-separated values for multiple reviews
            # Example: "user1,user2,user3" becomes ["user1", "user2", "user3"]
            user_ids = row['user_id'].split(',')
            user_names = row['user_name'].split(',')
            review_ids = row['review_id'].split(',')
            review_titles = row['review_title'].split(',')
            review_contents = row['review_content'].split(',')
            
            # Use min_length in case the CSV has inconsistent counts
            # This prevents index errors when accessing the lists
            min_length = min(len(user_ids), len(user_names), len(review_ids), 
                           len(review_titles), len(review_contents))
            
            # Build review objects for this product
            product_reviews = []
            for i in range(min_length):
                # Create a review dict matching our Review model
                # No product_id field needed since it's the key in the parent dict
                review = {
                    "review_id": review_ids[i].strip(),
                    "user_id": user_ids[i].strip(),
                    "user_name": user_names[i].strip(),
                    "review_title": review_titles[i].strip(),
                    "review_content": review_contents[i].strip()
                    # rating is optional and not in the CSV data
                }
                product_reviews.append(review)
            
            # Store all reviews for this product using product_id as key
            reviews_by_product[product_id] = product_reviews
    
    return reviews_by_product


def save_reviews_json(reviews_data):
    """Save reviews to reviews.json"""
    # Save to reviews.json in the data directory (one level up)
    json_path = Path(__file__).parent.parent / "reviews.json"
    
    with open(json_path, 'w', encoding='utf-8') as f:
        # indent=2 makes it human-readable with proper formatting
        # ensure_ascii=False preserves special characters like emojis
        json.dump(reviews_data, f, indent=2, ensure_ascii=False)
    
    # Print summary statistics
    print(f"Successfully migrated reviews to {json_path}")
    print(f"Total products with reviews: {len(reviews_data)}")
    
    # Count total reviews across all products
    total_reviews = sum(len(reviews) for reviews in reviews_data.values())
    print(f"Total reviews: {total_reviews}")


if __name__ == "__main__":
    print("Starting review migration from amazon.csv...")
    
    try:
        # Step 1: Parse CSV and organize reviews by product_id
        reviews = parse_csv_reviews()
        
        # Step 2: Save to JSON file with nested dict structure
        save_reviews_json(reviews)
        
        # Step 3: Show a sample to verify it worked correctly
        sample_product = list(reviews.keys())[0]
        print(f"\nSample product: {sample_product}")
        print(f"   Reviews: {len(reviews[sample_product])}")
        print(f"   First review: {reviews[sample_product][0]['review_title']}")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        raise
