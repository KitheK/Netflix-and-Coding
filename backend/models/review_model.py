from pydantic import BaseModel, Field
from typing import Optional


class Review(BaseModel):
    """Review model - user reviews for products"""
    
    review_id: str # unique identifier for the review 14 random char/number combination
    user_id: str
    user_name: str
    review_title: str
    review_content: str 

#TODO: add rating field?
# users can add a rating from 0 to 5 stars (could be whole numbers, or half stars). this is going to take more effort because currently,
# the reviews that exist right now do not have an individual rating associated with them.
#so we will need to figure out a way to let new reviews also add a rating, and then we will
# need to update the product's overall number of ratings, as well as do some math to update
#the overall rating of the product based on the users rating, while considering the number of
#ratings for the product to figure out the level of impact a single review has on the products rating. 


class AddReviewRequest(BaseModel):
    """Request model for adding a new review"""
    
    user_id: str
    user_name: str
    review_title: str
    review_content: str
