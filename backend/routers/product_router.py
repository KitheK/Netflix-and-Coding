from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.services.product_service import ProductService
from backend.models.product_model import Product, ProductCreate, ProductUpdate

router = APIRouter()
product_service = ProductService()

@router.get("/", response_model=List[Product])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    category: Optional[str] = None
):
    """Get all products with optional pagination and filtering"""
    products = product_service.get_all_products()
    
    # Apply category filter if provided
    if category:
        products = [p for p in products if p.category.lower() == category.lower()]
    
    # Apply pagination
    paginated_products = products[skip:skip + limit]
    return paginated_products

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: int):
    """Get a specific product by numeric ID"""
    try:
        product = product_service.get_product_by_id(product_id)
        return product
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/by-id/{product_id}", response_model=Product)
async def get_product_by_string_id(product_id: str):
    """Get a specific product by alphanumeric ID (e.g., ASIN)"""
    try:
        product = product_service.get_product_by_id(product_id)
        return product
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/", response_model=Product)
async def create_product(product_data: ProductCreate):
    """Create a new product"""
    try:
        product = product_service.create_product(product_data)
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{product_id}", response_model=Product)
async def update_product(product_id: int, product_data: ProductUpdate):
    """Update an existing product"""
    try:
        product = product_service.update_product(product_id, product_data)
        return product
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/by-id/{product_id}", response_model=Product)
async def update_product_by_string_id(product_id: str, product_data: ProductUpdate):
    """Update an existing product by alphanumeric ID"""
    try:
        product = product_service.update_product(product_id, product_data)
        return product
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{product_id}")
async def delete_product(product_id: int):
    """Delete a product"""
    try:
        product_service.delete_product(product_id)
        return {"message": "Product deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/by-id/{product_id}")
async def delete_product_by_string_id(product_id: str):
    """Delete a product by alphanumeric ID"""
    try:
        product_service.delete_product(product_id)
        return {"message": "Product deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/search/{keyword}", response_model=List[Product])
async def search_products(keyword: str):
    """Search products by keyword"""
    products = product_service.search_products(keyword)
    return products