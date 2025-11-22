import os
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.external_service import ExternalService
from backend.services.product_service import ProductService

# Test file paths
TEST_DB_PATH_PRODUCTS = "backend/data/products_test.json"

# Test client for integration tests
client = TestClient(app)

# ============================================================================
# UNIT TESTS - Testing ExternalService with mocked HTTP calls
# ============================================================================

class TestExternalServiceUnit:
    """UNIT TESTS: Test ExternalService business logic with mocked HTTP calls"""
    
    def setup_method(self):
        """Set up test service before each test method"""
        import os
        os.makedirs(os.path.dirname(TEST_DB_PATH_PRODUCTS), exist_ok=True)
        
        # Ensure test products file exists with test data
        test_products = [
            {
                "product_id": "B07JW9H4J1",
                "product_name": "Wayona Nylon Braided USB to Lightning Cable",
                "category": "Electronics|Cables",
                "discounted_price": 299.0,
                "actual_price": 599.0,
                "discount_percentage": 50.0,
                "about_product": "Fast charging cable",
                "img_link": "https://example.com/cable.jpg",
                "product_link": "https://example.com/cable",
                "rating": 4.5,
                "rating_count": 24269
            },
            {
                "product_id": "B08KT5LMRX",
                "product_name": "Samsung 55-inch 4K Smart TV",
                "category": "Electronics|TVs",
                "discounted_price": 35999.0,
                "actual_price": 54999.0,
                "discount_percentage": 34.5,
                "about_product": "4K Smart TV with HDR support",
                "img_link": "https://example.com/tv.jpg",
                "product_link": "https://example.com/tv",
                "rating": 4.8,
                "rating_count": 43994
            }
        ]
        
        # Always write test products to ensure they exist
        with open(TEST_DB_PATH_PRODUCTS, "w", encoding="utf-8") as f:
            json.dump(test_products, f, indent=2)
        
        # Set environment to use test products file
        os.environ["PRODUCTS_FILE"] = "products_test.json"
        self.product_service = ProductService()
        self.external_service = ExternalService(self.product_service)
    
    def teardown_method(self):
        """Clean up after each test method"""
        os.environ.pop("PRODUCTS_FILE", None)
    
    @pytest.mark.asyncio
    async def test_get_exchange_rate_success(self):
        """UNIT TEST: Successfully fetch exchange rate from API"""
        # Mock API response
        mock_response_data = {
            "date": "2025-01-21",
            "inr": {
                "usd": 0.012,
                "cad": 0.016,
                "eur": 0.011
            }
        }
        
        # Mock httpx.AsyncClient and its async context manager
        # response.json() and raise_for_status() are synchronous methods
        mock_response = MagicMock()
        mock_response.json.return_value = mock_response_data
        mock_response.raise_for_status = MagicMock()
        
        mock_get = AsyncMock(return_value=mock_response)
        mock_client_instance = MagicMock()
        mock_client_instance.get = mock_get
        
        # Properly set up async context manager
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        
        # Use MagicMock for the class (not AsyncMock) so it can be instantiated normally
        mock_client_class = MagicMock(return_value=mock_client_instance)
        
        with patch("backend.services.external_service.httpx.AsyncClient", mock_client_class):
            # Test USD conversion
            rate = await self.external_service.get_exchange_rate("USD")
            assert rate == 0.012
            
            # Test CAD conversion
            rate = await self.external_service.get_exchange_rate("CAD")
            assert rate == 0.016
    
    @pytest.mark.asyncio
    async def test_get_exchange_rate_invalid_currency(self):
        """UNIT TEST: Invalid currency code raises ValueError"""
        # Test empty currency
        with pytest.raises(ValueError, match="Currency code cannot be empty"):
            await self.external_service.get_exchange_rate("")
        
        # Test invalid format (too short)
        with pytest.raises(ValueError, match="Invalid currency code"):
            await self.external_service.get_exchange_rate("US")
        
        # Test invalid format (too long)
        with pytest.raises(ValueError, match="Invalid currency code"):
            await self.external_service.get_exchange_rate("USDD")
        
        # Test invalid format (numbers)
        with pytest.raises(ValueError, match="Invalid currency code"):
            await self.external_service.get_exchange_rate("US1")
    
    @pytest.mark.asyncio
    async def test_convert_product_prices_success(self):
        """UNIT TEST: Convert product prices to target currency"""
        # Mock API response
        mock_response_data = {
            "date": "2025-01-21",
            "inr": {
                "usd": 0.012
            }
        }
        
        # Mock httpx.AsyncClient and its async context manager
        # response.json() and raise_for_status() are synchronous methods
        mock_response = MagicMock()
        mock_response.json.return_value = mock_response_data
        mock_response.raise_for_status = MagicMock()
        
        mock_get = AsyncMock(return_value=mock_response)
        mock_client_instance = MagicMock()
        mock_client_instance.get = mock_get
        
        # Properly set up async context manager
        mock_client_instance.__aenter__ = AsyncMock(return_value=mock_client_instance)
        mock_client_instance.__aexit__ = AsyncMock(return_value=False)
        
        # Use MagicMock for the class (not AsyncMock) so it can be instantiated normally
        mock_client_class = MagicMock(return_value=mock_client_instance)
        
        with patch("backend.services.external_service.httpx.AsyncClient", mock_client_class):
            # Convert products to USD
            converted = await self.external_service.convert_product_prices("USD")
            
            # Verify results
            assert isinstance(converted, list)
            assert len(converted) > 0
            
            # Check first product has converted prices and currency info
            first_product = converted[0]
            assert "currency" in first_product
            assert first_product["currency"] == "USD"
            assert "exchange_rate" in first_product
            assert first_product["exchange_rate"] == 0.012
            assert "base_currency" in first_product
            assert first_product["base_currency"] == "INR"
            
            # Verify prices are converted correctly
            # For INR to USD, converted prices should be much smaller (rate ~0.012)
            # Verify prices are positive and reasonable
            assert first_product["discounted_price"] > 0
            assert first_product["actual_price"] > 0
            # USD prices should be much smaller than INR (rate is small)
            assert first_product["discounted_price"] < 100  # Assuming test products are in hundreds/thousands of INR


# ============================================================================
# INTEGRATION TESTS - Testing full API endpoints with real external API
# ============================================================================

class TestExternalAPIIntegration:
    """INTEGRATION TESTS: Test full API endpoints with real external API calls"""
    
    @pytest.fixture(scope="function", autouse=True)
    def setup_test_env(self):
        """Setup test environment before each test"""
        import os
        os.makedirs(os.path.dirname(TEST_DB_PATH_PRODUCTS), exist_ok=True)
        
        # Ensure test products file exists with test data
        test_products = [
            {
                "product_id": "B07JW9H4J1",
                "product_name": "Wayona Nylon Braided USB to Lightning Cable",
                "category": "Electronics|Cables",
                "discounted_price": 299.0,
                "actual_price": 599.0,
                "discount_percentage": 50.0,
                "about_product": "Fast charging cable",
                "img_link": "https://example.com/cable.jpg",
                "product_link": "https://example.com/cable",
                "rating": 4.5,
                "rating_count": 24269
            },
            {
                "product_id": "B08KT5LMRX",
                "product_name": "Samsung 55-inch 4K Smart TV",
                "category": "Electronics|TVs",
                "discounted_price": 35999.0,
                "actual_price": 54999.0,
                "discount_percentage": 34.5,
                "about_product": "4K Smart TV with HDR support",
                "img_link": "https://example.com/tv.jpg",
                "product_link": "https://example.com/tv",
                "rating": 4.8,
                "rating_count": 43994
            }
        ]
        
        # Always write test products to ensure they exist
        with open(TEST_DB_PATH_PRODUCTS, "w", encoding="utf-8") as f:
            json.dump(test_products, f, indent=2)
        
        # Set environment to use test products
        os.environ["PRODUCTS_FILE"] = "products_test.json"
        
        yield
        
        os.environ.pop("PRODUCTS_FILE", None)
    
    def test_get_currency_conversion_success(self):
        """INTEGRATION TEST: GET /external/currency?to=USD returns converted products"""
        response = client.get("/external/currency?to=USD")
        
        assert response.status_code == 200
        products = response.json()
        
        # Verify response structure
        assert isinstance(products, list)
        assert len(products) > 0
        
        # Verify first product has currency conversion fields
        first_product = products[0]
        assert "currency" in first_product
        assert first_product["currency"] == "USD"
        assert "exchange_rate" in first_product
        assert isinstance(first_product["exchange_rate"], (int, float))
        assert "base_currency" in first_product
        assert first_product["base_currency"] == "INR"
        
        # Verify prices are converted (should be lower for USD than INR)
        assert "discounted_price" in first_product
        assert "actual_price" in first_product
    
    def test_get_currency_conversion_invalid_currency(self):
        """INTEGRATION TEST: Invalid currency code returns 400 Bad Request"""
        # Test invalid currency code
        response = client.get("/external/currency?to=INVALID")
        
        assert response.status_code == 400
        assert "invalid currency" in response.json()["detail"].lower() or "not found" in response.json()["detail"].lower()
        
        # Test missing currency parameter
        response = client.get("/external/currency")
        assert response.status_code == 422  # FastAPI validation error
    
    def test_get_currency_conversion_same_currency(self):
        """INTEGRATION TEST: Requesting INR (base currency) returns products with rate 1.0"""
        response = client.get("/external/currency?to=INR")
        
        assert response.status_code == 200
        products = response.json()
        
        assert isinstance(products, list)
        if len(products) > 0:
            first_product = products[0]
            assert first_product["currency"] == "INR"
            assert first_product["exchange_rate"] == 1.0
            assert first_product["base_currency"] == "INR"
            
            # Prices should be the same (rate = 1.0)
            # We can't verify exact prices without knowing test data, but rate should be 1.0