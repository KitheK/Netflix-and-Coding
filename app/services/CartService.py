from typing import Dict, List
from app.models.Customer import Cart, CartItem
from app.services.ProductService import ProductService

class CartService:
    def __init__(self):
        self.carts: Dict[int, Cart] = {}
        self.product_service = ProductService()
    
    def get_user_cart(self, user_id: int) -> Cart:
        """Get or create user's cart"""
        if user_id not in self.carts:
            self.carts[user_id] = Cart(cart_id=user_id, customer_id=user_id)
        return self.carts[user_id]
    
    def add_to_cart(self, user_id: int, product_id: str, quantity: int = 1) -> Cart:
        """Add item to user's cart"""
        cart = self.get_user_cart(user_id)
        
        try:
            product = self.product_service.get_product_by_id(product_id)
            
            # Check if item already exists in cart
            for item in cart.items:
                if item.product.product_id == product_id:
                    item.quantity += quantity
                    break
            else:
                # Add new item
                cart_item = CartItem(product=product, quantity=quantity)
                cart.items.append(cart_item)
            
            return cart
            
        except ValueError as e:
            raise ValueError(f"Product not found: {product_id}")
    
    def remove_from_cart(self, user_id: int, product_id: str) -> Cart:
        """Remove item from user's cart"""
        cart = self.get_user_cart(user_id)
        cart.items = [item for item in cart.items if item.product.product_id != product_id]
        return cart
    
    def update_cart_item_quantity(self, user_id: int, product_id: str, quantity: int) -> Cart:
        """Update item quantity in cart"""
        if quantity <= 0:
            return self.remove_from_cart(user_id, product_id)
        
        cart = self.get_user_cart(user_id)
        
        for item in cart.items:
            if item.product.product_id == product_id:
                item.quantity = quantity
                break
        
        return cart
    
    def clear_cart(self, user_id: int) -> Cart:
        """Clear all items from user's cart"""
        cart = self.get_user_cart(user_id)
        cart.items.clear()
        return cart
    
    def get_cart_total(self, user_id: int) -> float:
        """Calculate total price of cart"""
        cart = self.get_user_cart(user_id)
        return cart.calculate_total()
    
    def get_cart_item_count(self, user_id: int) -> int:
        """Get total number of items in cart"""
        cart = self.get_user_cart(user_id)
        return sum(item.quantity for item in cart.items)