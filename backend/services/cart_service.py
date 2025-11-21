# Cart Service: Business logic for shopping cart operations

from typing import Dict, List, Optional
from datetime import datetime, timezone
import uuid
from backend.models.cart_model import CartItem, CartResponse
from backend.models.transaction_model import Transaction, TransactionItem, CheckoutResponse
from backend.repositories.cart_repository import CartRepository
from backend.repositories.user_repository import UserRepository
from backend.repositories.transaction_repository import TransactionRepository
from backend.services.product_service import ProductService


class CartService:
    # Handles all business logic for shopping cart
    
    def __init__(self, product_service: ProductService):
        # Create our own repositories internally
        self.cart_repository = CartRepository()
        self.user_repository = UserRepository()
        self.transaction_repository = TransactionRepository()
        self.product_service = product_service
    
    # Helper to get user_id from user_token by looking up in users.json
    def _get_user_id_from_token(self, user_token: str) -> str:
        # Look up the user_id (UUID) from a user_token
        users = self.user_repository.get_all()
        
        for user in users:
            if user.get("user_token") == user_token:
                return user.get("user_id")
        
        raise ValueError(f"Invalid user token: {user_token}")
    
    # Helper to load all carts from cart.json
    def _load_all_carts(self) -> Dict:
        carts = self.cart_repository.get_all()
        return carts if carts else {}
    
    # Helper to save all carts back to cart.json
    def _save_all_carts(self, carts: Dict):
        self.cart_repository.save_all(carts)
    
    
    def add_to_cart(self, user_id: str, product_id: str, quantity: int) -> dict:
        """Add a product to user's cart (or increase quantity if already exists)"""
        
        # validate product exists
        product = self.product_service.get_product_by_id(product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")
        
        # load all carts (using helper method from above)
        all_carts = self._load_all_carts()
        
        # get or create user's cart
        if user_id not in all_carts:
            all_carts[user_id] = {"items": []}
        
        user_cart = all_carts[user_id]["items"]
        
        # check if product already in cart, if it is, then add to existing quantity
        found = False
        for item in user_cart:
            if item["product_id"] == product_id:
                # Add to existing quantity
                item["quantity"] += quantity
                found = True
                break
        

        # if not found, append the product to the cart list
        if not found:
            new_item = {
                "product_id": product.product_id,
                "product_name": product.product_name,
                "img_link": product.img_link,
                "product_link": product.product_link,
                "discounted_price": product.discounted_price,
                "quantity": quantity
            }
            user_cart.append(new_item)
        
        # save back to cart.json
        self._save_all_carts(all_carts)
        
        return {"message": "Item added to cart", "product_id": product_id, "quantity": quantity}
    
    
    # gets users cart WITH total price (this uses the CartResponse class instead of normal Cart class,
    # because we want the total price of all items in the cart)
    def get_cart(self, user_id: str) -> CartResponse:
        
        # Load all carts
        all_carts = self._load_all_carts()
        
        # Get user's cart (or empty if doesn't exist)
        if user_id not in all_carts:
            return CartResponse(user_id=user_id, items=[], total_price=0.0)
        
        # Convert dict items to CartItem models
        cart_items = []
        total_price = 0.0
        
        for item_dict in all_carts[user_id]["items"]:
            cart_item = CartItem(**item_dict)
            cart_items.append(cart_item)
            
            # Calculate total
            total_price += cart_item.discounted_price * cart_item.quantity
        
        return CartResponse(
            user_id=user_id,
            items=cart_items,
            total_price=round(total_price, 2)  # Round to 2 decimal places
        )
    
    
        #remove a product completely from the cart
    def remove_from_cart(self, user_id: str, product_id: str) -> dict:
        
        # Load all carts (helper method)
        all_carts = self._load_all_carts()
        
        # Check if user has a cart
        if user_id not in all_carts:
            raise ValueError(f"Cart not found for user {user_id}")
        
        user_cart = all_carts[user_id]["items"]
        
        # Find and remove the item
        original_length = len(user_cart)
        all_carts[user_id]["items"] = [
            item for item in user_cart if item["product_id"] != product_id
        ]
        
        # Check if anything was removed
        if len(all_carts[user_id]["items"]) == original_length:
            raise ValueError(f"Product {product_id} not found in cart")
        
        # Save back to cart.json
        self._save_all_carts(all_carts)
        
        return {"message": "Item removed from cart", "product_id": product_id}
    


    
    #update the quantiy of a product in the cart (if quantity is 0 it calls the remove_from_cart method)
    def update_cart_item(self, user_id: str, product_id: str, quantity: int) -> dict:
    
        
        # If quantity is 0, remove the item
        if quantity == 0:
            return self.remove_from_cart(user_id, product_id)
        
        # Load all carts
        all_carts = self._load_all_carts()
        
        # Check if user has a cart
        if user_id not in all_carts:
            raise ValueError(f"Cart not found for user {user_id}")
        
        user_cart = all_carts[user_id]["items"]
        
        # Find and update the item
        found = False
        for item in user_cart:
            if item["product_id"] == product_id:
                item["quantity"] = quantity
                found = True
                break
        
        if not found:
            raise ValueError(f"Product {product_id} not found in cart")
        
        # Save back to cart.json
        self._save_all_carts(all_carts)
        
        return {"message": "Cart updated", "product_id": product_id, "quantity": quantity}
    



    #CHECKING OUT FUNCTIONALITY

    def checkout(self, user_id: str) -> CheckoutResponse:
        
        #get the user's cart
        cart = self.get_cart(user_id)
        
        # validate cart is not empty
        if not cart.items or len(cart.items) == 0:
            raise ValueError("Cannot checkout: cart is empty")
        
        # create transaction items from cart items.  cart item -> transaction item
        # This creates a snapshot of what they're buying right now
        transaction_items = []
        for cart_item in cart.items:
            transaction_item = TransactionItem(
                product_id=cart_item.product_id,
                product_name=cart_item.product_name,
                img_link=cart_item.img_link,
                product_link=cart_item.product_link,
                discounted_price=cart_item.discounted_price,
                quantity=cart_item.quantity
            )
            transaction_items.append(transaction_item)
        
        # create the transaction object
        transaction = Transaction(
            transaction_id=str(uuid.uuid4()),  # Generate unique UUID
            user_id=user_id,
            items=transaction_items,
            total_price=cart.total_price,
            timestamp=datetime.now(timezone.utc).isoformat(),  # ISO format with timezone
            status="completed"
        )
        
        # save transaction to transactions.json
        # Load existing transactions (now a dict: {"user_id": [transactions]})
        all_transactions = self.transaction_repository.get_all()
        if not isinstance(all_transactions, dict):
            all_transactions = {}
        
        # Get or create the user's transaction list
        if user_id not in all_transactions:
            all_transactions[user_id] = []
        
        # Append new transaction to the user's list
        all_transactions[user_id].append(transaction.model_dump())  # Convert Pydantic model to dict
        
        # Save back to file
        self.transaction_repository.save_all(all_transactions)
        
        # clear the user's cart because they've bought the items so when they go back to cart it doesnt show all the items they just bought
        all_carts = self._load_all_carts()
        if user_id in all_carts:
            all_carts[user_id]["items"] = []  # Empty the items list
            self._save_all_carts(all_carts)
        
        # return checkout response
        return CheckoutResponse(
            message="Order confirmed",
            transaction=transaction
        )

        
        return {"message": "Cart updated", "product_id": product_id, "quantity": quantity}
