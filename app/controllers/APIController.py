from fastapi import APIRouter
from app.services.ProductService import ProductService
from app.controllers.productAPI import router as product_router
from app.controllers.auth import router as auth_router
from app.controllers.UserAPI import router as user_router
from app.controllers.cartAPI import router as cart_router


"All The API calls will go through this controller"
"Each of the routers point to a specific API for the system"
"We need to make test cases for this, ive made a few but idk if they are sufficent yet"
"Integration fo the reviews in both the product class under models hasnt been done yet"
"We also need to add something for the reviews to update autmoatically"

router = APIRouter(prefix="/api", tags=["API"])
router.include_router(product_router)
router.include_router(auth_router)
router.include_router(user_router)
router.include_router(cart_router)

product_service = ProductService()

