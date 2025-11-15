# Product Router: API endpoints for product operations

from fastapi import APIRouter, HTTPException
from backend.services.product_service import ProductService
from backend.repositories.json_repository import JsonRepository
from typing import Optional

#create router with /products prefix and "products" tag
router = APIRouter(prefix="/products", tags=["products"])

#create repository and service
repository = JsonRepository()
product_service = ProductService(repository)



"""Product router endpoints"""

# Endpoint to get ALL products. url would be /products      this is the defualt endpoint for this router, it shows all list of all the products
@router.get("/")
async def get_all_products(sort: Optional[str] = None):
    # call product_service's method to get all products
    products = product_service.get_all_products()
    # Return all products

    #sort if requested
    if sort:
        products = product_service.sort_products(products, sort)

    return products

# Endpoint to get product by ID.  url would be like /products/B07JW9H4J1 for product with ID B07JW9H4J1
@router.get("/{product_id}")
async def get_product_by_id(product_id: str):
    # call product_service's method to find the product by id
    product = product_service.get_product_by_id(product_id)
    
    # if not found, return 404 error
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    # Return the product
    return product

# Endpoint to search products by keyword in name or category.  url would be like /products/search/laptop to search for "laptop"
@router.get("/search/{keyword}")
async def search_products(keyword: str, sort: Optional[str] = None):
    # call product_service's method to search products by keyword
    products = product_service.get_product_by_keyword(keyword)

    # sort if requested
    if sort:
        products = product_service.sort_products(products, sort)

    # return the list (empty if no matches - for frontend to handle "no results" case)
    return products

