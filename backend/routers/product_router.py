# Product Router: API endpoints for product operations

from fastapi import APIRouter, HTTPException, Depends
from backend.services.product_service import ProductService
from backend.repositories.json_repository import JsonRepository
from backend.models.product_model import Product, CreateProductRequest
from backend.services.auth_service import admin_required_dep
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


# ADMIN ONLY: Create a new product
@router.post("/", response_model=Product)
async def create_product(
    request: CreateProductRequest,
    current_user: dict = Depends(admin_required_dep)
):
    """
    ADMIN ONLY: Create a new product
    - Validates all required fields
    - Generates unique ASIN-like product ID (10 uppercase alphanumeric characters)
    - Saves to products.json
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create products")
    
    try:
        # Create product using service
        new_product = product_service.create_product(
            product_name=request.product_name,
            category=request.category,
            discounted_price=request.discounted_price,
            actual_price=request.actual_price,
            discount_percentage=request.discount_percentage,
            about_product=request.about_product,
            img_link=request.img_link,
            product_link=request.product_link,
            rating=request.rating,
            rating_count=request.rating_count
        )
        return new_product
    except ValueError as e:
        # Validation errors
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Unexpected errors
        raise HTTPException(status_code=500, detail=f"Failed to create product: {str(e)}")