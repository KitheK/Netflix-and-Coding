from fastapi import APIRouter
from app.services.ProductService import ProductService

router = APIRouter(prefix="/products", tags=["Products"])
product_service = ProductService()


@router.get("/")
def get_products():
    products = product_service.get_all_products()
    return [p.to_dict() for p in products]


@router.get("/search/{keyword}")
def search_products(keyword: str):
    products = product_service.search_products(keyword)
    return [p.to_dict() for p in products]
