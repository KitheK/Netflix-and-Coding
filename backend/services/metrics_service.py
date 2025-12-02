# Metrics Service: Business logic for calculating business metrics

from typing import Dict, List, Any
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from backend.repositories.transaction_repository import TransactionRepository
from backend.repositories.user_repository import UserRepository
from backend.repositories.product_repository import ProductRepository
from backend.repositories.penalty_repository import PenaltyRepository
from backend.repositories.review_repository import ReviewRepository
from backend.models.transaction_model import Transaction
from backend.models.penalty_model import Penalty


class MetricsService:
    """Service for calculating business metrics from transactions and users"""
    
    def __init__(self):
        self.transaction_repository = TransactionRepository()
        self.user_repository = UserRepository()
        self.product_repository = ProductRepository()
        self.penalty_repository = PenaltyRepository()
        self.review_repository = ReviewRepository()
    
    def _load_all_transactions(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load all transactions from repository"""
        return self.transaction_repository.get_all() or {}
    
    def _load_all_users(self) -> List[Dict[str, Any]]:
        """Load all users from repository"""
        return self.user_repository.get_all() or []
    
    def _load_all_products(self) -> Dict[str, Dict[str, Any]]:
        """Load all products and create a lookup dict by product_id"""
        products = self.product_repository.get_all() or []
        # Create a dict mapping product_id to product data for quick lookup
        product_lookup = {}
        for product in products:
            if isinstance(product, dict) and "product_id" in product:
                product_lookup[product["product_id"]] = product
        return product_lookup
    
    def get_category_metrics(self) -> Dict[str, Any]:
        """
        Calculate business metrics grouped by product category.
        Returns:
        - Total revenue per category
        - Number of transactions per category
        - Number of returning users (users with >1 transaction)
        - Most purchased product (count-based ranking)
        """
        transactions_data = self._load_all_transactions()
        products_lookup = self._load_all_products()
        
        # Track metrics per category
        category_revenue = defaultdict(float)
        category_transactions = defaultdict(set)  # Use set to avoid double-counting transactions
        category_product_counts = defaultdict(lambda: defaultdict(int))  # category -> {product_id: count}
        
        # Track all users who made transactions
        users_with_transactions = set()
        user_transaction_counts = defaultdict(int)
        all_transaction_ids = set()
        
        # Process all transactions
        for user_id, user_transactions in transactions_data.items():
            if not user_transactions:
                continue
            
            user_transaction_counts[user_id] = len(user_transactions)
            users_with_transactions.add(user_id)
            
            for transaction_dict in user_transactions:
                try:
                    # Parse transaction
                    transaction = Transaction(**transaction_dict)
                    transaction_id = transaction.transaction_id
                    all_transaction_ids.add(transaction_id)
                    
                    # Track which categories this transaction touches
                    transaction_categories = set()
                    
                    # Process each item in the transaction
                    for item in transaction.items:
                        product_id = item.product_id
                        
                        # Get product category from lookup
                        product = products_lookup.get(product_id)
                        if product:
                            category = product.get("category", "Unknown")
                        else:
                            category = "Unknown"
                        
                        transaction_categories.add(category)
                        
                        # Calculate revenue for this item
                        item_revenue = item.discounted_price * item.quantity
                        category_revenue[category] += item_revenue
                        category_revenue["all"] += item_revenue  # Total revenue across all categories
                        
                        # Count product purchases
                        category_product_counts[category][product_id] += item.quantity
                        category_product_counts["all"][product_id] += item.quantity
                    
                    # Count this transaction for each category it touches
                    for category in transaction_categories:
                        category_transactions[category].add(transaction_id)
                    category_transactions["all"].add(transaction_id)
                        
                except Exception:
                    # Skip malformed transactions
                    continue
        
        # Calculate returning users (users with >1 transaction)
        returning_users = sum(1 for count in user_transaction_counts.values() if count > 1)
        total_users_with_transactions = len(users_with_transactions)
        
        # Build most purchased products ranking (across all categories)
        all_product_counts = category_product_counts["all"]
        most_purchased_products = []
        for product_id, count in sorted(all_product_counts.items(), key=lambda x: x[1], reverse=True):
            product = products_lookup.get(product_id, {})
            most_purchased_products.append({
                "product_id": product_id,
                "product_name": product.get("product_name", "Unknown Product"),
                "purchase_count": count
            })
        
        # Build category breakdown
        category_breakdown = {}
        for category in sorted(category_revenue.keys()):
            if category == "all":
                continue
            category_breakdown[category] = {
                "total_revenue": round(category_revenue[category], 2),
                "transaction_count": len(category_transactions.get(category, set())),
                "most_purchased_products": []
            }
            
            # Get top products for this category
            category_products = category_product_counts.get(category, {})
            for product_id, count in sorted(category_products.items(), key=lambda x: x[1], reverse=True)[:5]:
                product = products_lookup.get(product_id, {})
                category_breakdown[category]["most_purchased_products"].append({
                    "product_id": product_id,
                    "product_name": product.get("product_name", "Unknown Product"),
                    "purchase_count": count
                })
        
        return {
            "summary": {
                "total_revenue": round(category_revenue.get("all", 0), 2),
                "total_transactions": len(category_transactions.get("all", set())),
                "total_users_with_transactions": total_users_with_transactions,
                "returning_users": returning_users
            },
            "categories": category_breakdown,
            "most_purchased_products": most_purchased_products[:10]  # Top 10 overall
        }
    
    def get_chart_data(self) -> Dict[str, Any]:
        """
        Generate chart-ready aggregated data for visualization.
        Returns:
        - top_products_by_sales: Bar chart data for top products by sales (quantity)
        - category_distribution: Pie chart data for category distribution (by revenue)
        - new_vs_returning_users: Pie chart data for new vs returning users
        """
        transactions_data = self._load_all_transactions()
        products_lookup = self._load_all_products()
        
        # Initialize data structures
        product_sales = defaultdict(int)  # product_id -> total quantity sold
        category_revenue = defaultdict(float)  # category -> total revenue
        user_transaction_counts = defaultdict(int)  # user_id -> number of transactions
        
        # Process all transactions
        for user_id, user_transactions in transactions_data.items():
            if not user_transactions:
                continue
            
            user_transaction_counts[user_id] = len(user_transactions)
            
            for transaction_dict in user_transactions:
                try:
                    transaction = Transaction(**transaction_dict)
                    
                    # Process items
                    for item in transaction.items:
                        product_id = item.product_id
                        
                        # Top products by sales (quantity)
                        product_sales[product_id] += item.quantity
                        
                        # Category distribution (by revenue)
                        product = products_lookup.get(product_id)
                        if product:
                            category = product.get("category", "Unknown")
                        else:
                            category = "Unknown"
                        
                        item_revenue = item.discounted_price * item.quantity
                        category_revenue[category] += item_revenue
                        
                except Exception:
                    # Skip malformed transactions
                    continue
        
        # 1. Top products by sales (Bar chart)
        top_products_by_sales = []
        for product_id, quantity in sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:10]:
            product = products_lookup.get(product_id, {})
            top_products_by_sales.append({
                "product_name": product.get("product_name", "Unknown Product"),
                "sales": quantity
            })
        
        # 2. Category distribution (Pie chart - by revenue)
        category_distribution = []
        total_category_revenue = sum(category_revenue.values())
        for category, revenue in sorted(category_revenue.items(), key=lambda x: x[1], reverse=True):
            if category == "Unknown" and revenue == 0:
                continue
            percentage = (revenue / total_category_revenue * 100) if total_category_revenue > 0 else 0
            category_distribution.append({
                "category": category,
                "revenue": round(revenue, 2),
                "percentage": round(percentage, 2)
            })
        
        # 4. New vs returning users (Pie chart)
        new_users = sum(1 for count in user_transaction_counts.values() if count == 1)
        returning_users = sum(1 for count in user_transaction_counts.values() if count > 1)
        total_users = new_users + returning_users
        
        new_vs_returning_users = []
        if total_users > 0:
            new_users_percentage = (new_users / total_users * 100)
            returning_users_percentage = (returning_users / total_users * 100)
            
            new_vs_returning_users = [
                {
                    "user_type": "New Users",
                    "count": new_users,
                    "percentage": round(new_users_percentage, 2)
                },
                {
                    "user_type": "Returning Users",
                    "count": returning_users,
                    "percentage": round(returning_users_percentage, 2)
                }
            ]
        else:
            new_vs_returning_users = [
                {
                    "user_type": "New Users",
                    "count": 0,
                    "percentage": 0.0
                },
                {
                    "user_type": "Returning Users",
                    "count": 0,
                    "percentage": 0.0
                }
            ]
        
        return {
            "top_products_by_sales": top_products_by_sales,
            "category_distribution": category_distribution,
            "new_vs_returning_users": new_vs_returning_users
        }
    
    def get_anomalies(self) -> Dict[str, Any]:
        """
        Detect basic anomalies in the system.
        Simple rule-based checks - no persistent storage.
        
        Returns:
        - penalty_spike: Detects sudden spike in penalties (last 24h vs historical average)
        - review_anomalies: Products with unusually high number of reviews
        """
        anomalies = {
            "penalty_spike": None,
            "review_anomalies": []
        }
        
        # 1. Check for penalty spike
        all_penalties_data = self.penalty_repository.get_all() or []
        
        if all_penalties_data:
            # Parse penalties
            penalties = []
            for penalty_dict in all_penalties_data:
                try:
                    penalty = Penalty(**penalty_dict)
                    penalties.append(penalty)
                except Exception:
                    continue
            
            if len(penalties) > 0:
                # Get current time and 24 hours ago
                now = datetime.now(timezone.utc)
                last_24h = now - timedelta(hours=24)
                
                # Count penalties in last 24 hours
                recent_penalties = []
                older_penalties = []
                
                for penalty in penalties:
                    try:
                        # Parse timestamp
                        timestamp_str = penalty.timestamp
                        if timestamp_str.endswith('Z'):
                            timestamp_str = timestamp_str[:-1] + '+00:00'
                        
                        penalty_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                        
                        if penalty_time >= last_24h:
                            recent_penalties.append(penalty)
                        else:
                            older_penalties.append(penalty)
                    except Exception:
                        continue
                
                recent_count = len(recent_penalties)
                
                # Calculate historical average (penalties per day)
                if len(older_penalties) > 0:
                    # Find oldest penalty to calculate time range
                    oldest_time = None
                    for penalty in older_penalties:
                        try:
                            timestamp_str = penalty.timestamp
                            if timestamp_str.endswith('Z'):
                                timestamp_str = timestamp_str[:-1] + '+00:00'
                            penalty_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                            
                            if oldest_time is None or penalty_time < oldest_time:
                                oldest_time = penalty_time
                        except Exception:
                            continue
                    
                    if oldest_time:
                        time_range_days = (now - oldest_time).total_seconds() / 86400
                        if time_range_days > 0:
                            historical_avg_per_day = len(older_penalties) / time_range_days
                            
                            # Alert if recent count is 3x or more than historical average per day
                            threshold = historical_avg_per_day * 3
                            if recent_count >= threshold and recent_count >= 3:
                                anomalies["penalty_spike"] = {
                                    "message": f"Sudden spike detected: {recent_count} penalties in last 24 hours",
                                    "recent_count": recent_count,
                                    "historical_average_per_day": round(historical_avg_per_day, 2),
                                    "threshold": round(threshold, 2)
                                }
                elif recent_count >= 3:
                    # If no historical data but we have 3+ recent penalties, flag it
                    anomalies["penalty_spike"] = {
                        "message": f"Sudden spike detected: {recent_count} penalties in last 24 hours (no historical data for comparison)",
                        "recent_count": recent_count,
                        "historical_average_per_day": 0,
                        "threshold": 3
                    }
        
        # 2. Check for review anomalies
        all_reviews = self.review_repository.get_all() or {}
        products_lookup = self._load_all_products()
        
        # Calculate review counts per product
        product_review_counts = {}
        for product_id, reviews_list in all_reviews.items():
            if isinstance(reviews_list, list):
                product_review_counts[product_id] = len(reviews_list)
        
        if product_review_counts:
            # Calculate average and standard deviation
            review_counts = list(product_review_counts.values())
            if len(review_counts) > 0:
                avg_reviews = sum(review_counts) / len(review_counts)
                
                # Calculate simple threshold (2x average or more)
                threshold = avg_reviews * 2
                
                # Find products exceeding threshold
                for product_id, count in product_review_counts.items():
                    if count >= threshold and count >= 5:  # At least 5 reviews to be considered
                        product = products_lookup.get(product_id, {})
                        anomalies["review_anomalies"].append({
                            "product_id": product_id,
                            "product_name": product.get("product_name", "Unknown Product"),
                            "review_count": count,
                            "average_reviews": round(avg_reviews, 2),
                            "threshold": round(threshold, 2),
                            "message": f"Unusually high number of reviews: {count} (average: {avg_reviews:.1f})"
                        })
                
                # Sort by review count (descending)
                anomalies["review_anomalies"].sort(key=lambda x: x["review_count"], reverse=True)
                # Limit to top 5
                anomalies["review_anomalies"] = anomalies["review_anomalies"][:5]
        
        return anomalies