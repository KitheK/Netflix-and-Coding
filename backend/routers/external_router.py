"""External Router: API endpoints for external integrations (currency conversion, etc.)"""

from fastapi import APIRouter, HTTPException, Query
from backend.services.external_service import ExternalService
from backend.services.product_service import ProductService

# Create router with prefix /external and tag "external"
router = APIRouter(prefix="/external", tags=["external"])

# Initialize dependencies (services create their own repositories internally)
product_service = ProductService()
external_service = ExternalService(product_service)


# GET /external/currency?to=CAD - Get all products with prices converted to target currency
@router.get("/currency")
async def get_products_in_currency(
    to: str = Query(..., description="Target currency code (e.g., CAD, EUR, GBP)", alias="to")
):
    """
    Get all products with prices converted to the specified currency.
    
    Products are stored in INR (Indian Rupees) and will be converted to the target currency.
    
    - IN: query param `to` = currency code (3 letters, e.g., "USD", "CAD", "EUR", "GBP")
    - OUT: JSON array of products with converted prices
    
    Example:
        GET /external/currency?to=USD
        Returns all products with prices converted from INR to US Dollars
        
        GET /external/currency?to=CAD
        Returns all products with prices converted from INR to Canadian Dollars
    """
    try:
        converted_products = await external_service.convert_product_prices(to_currency=to)
        return converted_products
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert currency: {str(e)}"
        )

