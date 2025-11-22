"""External Service: Handles external API integrations like currency conversion"""

import httpx
from typing import Dict, Optional
from backend.services.product_service import ProductService
from backend.models.product_model import Product


class ExternalService:
    """Handles external API integrations"""
    
    def __init__(self, product_service: Optional[ProductService] = None):
        # Use provided product service or create our own
        self.product_service = product_service if product_service is not None else ProductService()
        # Base currency (products are stored in INR - Indian Rupees)
        self.base_currency = "INR"
    
    async def get_exchange_rate(self, to_currency: str) -> float:
        """
        Fetch exchange rate from INR to target currency using a public API.
        
        Args:
            to_currency: Target currency code (e.g., "USD", "CAD", "EUR", "GBP")
            
        Returns:
            float: Exchange rate (1 INR = X target_currency)
            
        Raises:
            ValueError: If currency code is invalid or API request fails
        """
        if not to_currency or len(to_currency.strip()) == 0:
            raise ValueError("Currency code cannot be empty")
        
        to_currency = to_currency.strip().upper()
        
        # Validate currency code (basic check - 3 uppercase letters)
        if len(to_currency) != 3 or not to_currency.isalpha():
            raise ValueError(f"Invalid currency code: {to_currency}. Must be 3 letters (e.g., USD, CAD, EUR)")
        
        # Don't convert if target currency is the same as base currency
        if to_currency == self.base_currency:
            return 1.0
        
        # Use fawazahmed0 currency-api (free, no API key required)
        # API format: https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{base}.json
        # Response format: {"date": "...", "inr": {"usd": 0.012, "eur": 0.011, ...}}
        base_currency_lower = self.base_currency.lower()
        url = f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{base_currency_lower}.json"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                
                # API returns: {"date": "...", "inr": {"usd": 0.012, ...}}
                # Access rates using lowercase base currency key
                rates = data.get(base_currency_lower, {})
                if not rates:
                    raise ValueError(f"No exchange rates found for base currency {self.base_currency}")
                
                # Access target currency rate using lowercase
                to_currency_lower = to_currency.lower()
                if to_currency_lower not in rates:
                    raise ValueError(f"Currency {to_currency} not found in exchange rates")
                
                return float(rates[to_currency_lower])
                
        except httpx.HTTPError as e:
            raise ValueError(f"Failed to fetch exchange rates: {str(e)}")
        except (KeyError, ValueError, TypeError) as e:
            raise ValueError(f"Invalid response from exchange rate API: {str(e)}")
    
    async def convert_product_prices(self, to_currency: str) -> list[Dict]:
        """
        Get all products with prices converted to target currency.
        
        Args:
            to_currency: Target currency code (e.g., "USD", "CAD", "EUR", "GBP")
            Products are stored in INR (Indian Rupees) and will be converted to the target currency.
            
        Returns:
            List of product dictionaries with converted prices
            
        Raises:
            ValueError: If currency conversion fails
        """
        # Get exchange rate
        exchange_rate = await self.get_exchange_rate(to_currency)
        
        # Get all products
        products = self.product_service.get_all_products()
        
        # Convert prices for each product
        converted_products = []
        for product in products:
            product_dict = product.model_dump()
            
            # Convert both discounted_price and actual_price
            product_dict["discounted_price"] = round(product.discounted_price * exchange_rate, 2)
            product_dict["actual_price"] = round(product.actual_price * exchange_rate, 2)
            
            # Add currency information
            product_dict["currency"] = to_currency
            product_dict["exchange_rate"] = exchange_rate
            product_dict["base_currency"] = self.base_currency
            
            converted_products.append(product_dict)
        
        return converted_products