from pydantic import BaseModel
from typing import Optional


class Product(BaseModel):
    """Product model : uses cleaned numeric data from products.json"""

    product_id: str
    product_name: str
    category: str
    discounted_price: float     #in indian rupees (convert from rupees to something else when we add external api)
    actual_price: float         #in indian rupees (convert from rupees to something else when we add external api)
    discount_percentage: float  #is a float like 64.0 for 64%
    about_product: str
    img_link: str
    product_link: str
    
    # overall product ratings
    rating: float  
    rating_count: Optional[int] = None  

