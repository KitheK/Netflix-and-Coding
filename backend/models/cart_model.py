"""Cart models for shopping cart functionality"""

from pydantic import BaseModel
from typing import List



    #this is an individual item in a user's cart it contains everything that would be displayed when looking at cart.
    #like it would show the product name, and then we have img link so it can show an image of the product in the cart,
    #and a link so maybe when you click on the item it takes you to the products page
    #we use discounted_price instead of normal price because it will always be the correct price, if no discount, discounted_price = price.
class CartItem(BaseModel):
    product_id: str
    product_name: str
    img_link: str
    product_link: str
    discounted_price: float
    quantity: int  # How many of this product


    #this is the full cart with all the CartItems
class Cart(BaseModel):
    items: List[CartItem] = []  # Default to empty list


    #this is what returns when you GET /cart (try to view your cart) it is seperate because it includes the total price of your cart
class CartResponse(BaseModel): 
    user_id: str
    items: List[CartItem]
    total_price: float  # Sum of all (price × quantity)


    #this is what you send when you POST /cart (try to add something to your cart)
class AddToCartRequest(BaseModel):
    user_id: str  # 28-character user identifier
    product_id: str
    quantity: int = 1  # Default to 1 if not specified


    #this is what you send when you PUT /cart (try to update quantity of something in your cart)
class UpdateCartRequest(BaseModel):
    user_id: str
    quantity: int  # New quantity (0 = remove item)
