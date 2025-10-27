from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.ProductService import ProductService
from app.models.Product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])
product_service = ProductService()


@router.get("/", response_model=List[ProductResponse])
def get_products(
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
    return [p.to_dict() for p in paginated_products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int):
    """Get a specific product by ID"""
    try:
        product = product_service.get_product_by_id(product_id)
        return product.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/", response_model=ProductResponse)
def create_product(product_data: ProductCreate):
    """Create a new product"""
    try:
        product = product_service.create_product(product_data.model_dump())
        return product.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_data: ProductUpdate):
    """Update an existing product"""
    try:
        product = product_service.update_product(product_id, product_data.model_dump(exclude_unset=True))
        return product.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{product_id}")
def delete_product(product_id: int):
    """Delete a product"""
    try:
        product_service.delete_product(product_id)
        return {"message": "Product deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search/{keyword}", response_model=List[ProductResponse])
def search_products(keyword: str):
    """Search products by keyword"""
    products = product_service.search_products(keyword)
    return [p.to_dict() for p in products]