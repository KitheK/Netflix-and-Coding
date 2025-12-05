# API Documentation

API documentation can also be at http://localhost:8000/docs#/ when running backend. This was generated documentation showing all 48 endpoints.

Base URL: `http://localhost:8000`

## Authentication
Most endpoints require authentication via JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

Admin-only endpoints also require the user to have `role: "admin"`.

---

## Auth Endpoints

### `POST /auth/register`
Register a new user account.
- **Body**: `{ name, email, password }`
- **Returns**: User object with token

### `POST /auth/login`
Login with email and password.
- **Body**: `{ email, password }`
- **Returns**: User object with token

### `GET /auth/me`
Get current authenticated user details.
- **Auth**: Required
- **Returns**: User object

### `GET /auth/users`
Get all users (admin only).
- **Auth**: Admin required
- **Returns**: Array of user objects

### `GET /auth/users/{user_id}`
Get specific user by ID.
- **Auth**: Required
- **Returns**: User object

### `GET /auth/email/{email}`
Get user by email address.
- **Auth**: Required
- **Returns**: User object

### `POST /auth/users/{user_id}/role`
Set user role (admin/customer).
- **Auth**: Admin required
- **Body**: `{ role }`
- **Returns**: Updated user object

### `POST /auth/users/{user_id}/promote-admin`
Promote user to admin role.
- **Auth**: Admin required
- **Returns**: Updated user object

### `GET /auth/admin-only`
Test endpoint for admin access.
- **Auth**: Admin required
- **Returns**: Success message

---

## Product Endpoints

### `GET /products/`
Get all products with optional sorting.
- **Query**: `sort` (optional) - Sort order
- **Returns**: Array of products

### `GET /products/search/{keyword}`
Search products by keyword.
- **Params**: `keyword` - Search term
- **Query**: `sort` (optional)
- **Returns**: Array of matching products

### `GET /products/{product_id}`
Get product by ID.
- **Params**: `product_id`
- **Returns**: Product object

### `GET /products/{product_id}/fetch-image`
Fetch and cache product image.
- **Params**: `product_id`
- **Returns**: Product with updated image link

### `POST /products/`
Create new product (admin only).
- **Auth**: Admin required
- **Body**: Product object
- **Returns**: Created product

### `PUT /products/{product_id}`
Update product (admin only).
- **Auth**: Admin required
- **Params**: `product_id`
- **Body**: Product fields to update
- **Returns**: Updated product

### `DELETE /products/{product_id}`
Delete product (admin only).
- **Auth**: Admin required
- **Params**: `product_id`
- **Returns**: Deleted product

### `POST /products/fetch-images-all`
Fetch and cache images for all products.
- **Returns**: Success message with count

---

## Cart Endpoints

### `GET /cart/`
Get current user's cart.
- **Auth**: Required (via user_token query param)
- **Returns**: Cart object with items

### `POST /cart/add`
Add item to cart.
- **Auth**: Required
- **Body**: `{ user_token, product_id, quantity }`
- **Returns**: Updated cart

### `PUT /cart/update/{product_id}`
Update item quantity in cart.
- **Auth**: Required
- **Params**: `product_id`
- **Body**: `{ user_token, quantity }`
- **Returns**: Updated cart

### `DELETE /cart/remove/{product_id}`
Remove item from cart.
- **Auth**: Required
- **Params**: `product_id`
- **Query**: `user_token`
- **Returns**: Updated cart

### `POST /cart/checkout`
Checkout cart and create transaction.
- **Auth**: Required
- **Body**: `{ user_token }`
- **Returns**: Transaction object

---

## Wishlist Endpoints

### `GET /wishlist/{user_id}`
Get user's wishlist.
- **Params**: `user_id`
- **Returns**: Array of product IDs

### `POST /wishlist/add`
Add product to wishlist.
- **Body**: `{ user_id, product_id }`
- **Returns**: Success message

### `DELETE /wishlist/{user_id}/{product_id}`
Remove product from wishlist.
- **Params**: `user_id`, `product_id`
- **Returns**: Success message

---

## Transaction Endpoints

### `GET /transactions/`
Get current user's transactions.
- **Auth**: Required
- **Returns**: Array of transactions

### `GET /transactions/{transaction_id}`
Get specific transaction by ID.
- **Auth**: Required
- **Params**: `transaction_id`
- **Returns**: Transaction object

---

## Review Endpoints

### `GET /reviews/{product_id}`
Get all reviews for a product.
- **Params**: `product_id`
- **Returns**: Array of reviews

### `POST /reviews/{product_id}`
Add review for a product.
- **Auth**: Required
- **Params**: `product_id`
- **Body**: `{ user_id, user_name, review_title, review_content }`
- **Returns**: Created review

### `DELETE /reviews/{product_id}/{review_id}`
Delete a review.
- **Auth**: Required
- **Params**: `product_id`, `review_id`
- **Returns**: Success message

---

## Refund Endpoints

### `POST /refunds`
Create refund request for a transaction.
- **Auth**: Required
- **Body**: `{ transaction_id, message }`
- **Returns**: Created refund object

### `GET /refunds/my-requests`
Get current user's refund requests.
- **Auth**: Required
- **Returns**: Array of refunds

### `GET /refunds/all`
Get all refund requests (admin only).
- **Auth**: Admin required
- **Returns**: Array of all refunds

### `PUT /refunds/{refund_id}/approve`
Approve a refund request (admin only).
- **Auth**: Admin required
- **Params**: `refund_id`
- **Returns**: Updated refund object

### `PUT /refunds/{refund_id}/deny`
Deny a refund request (admin only).
- **Auth**: Admin required
- **Params**: `refund_id`
- **Returns**: Updated refund object

---

## Penalty Endpoints

### `GET /penalties/my-penalties`
Get current user's penalties.
- **Auth**: Required
- **Returns**: Array of penalties

### `GET /penalties/{user_id}`
Get penalties for specific user.
- **Auth**: Required
- **Params**: `user_id`
- **Returns**: Array of penalties

### `POST /penalties/apply`
Apply penalty to user (admin only).
- **Auth**: Admin required
- **Body**: `{ user_id, reason }`
- **Returns**: Created penalty object

### `POST /penalties/{penalty_id}/resolve`
Resolve a penalty (admin only).
- **Auth**: Admin required
- **Params**: `penalty_id`
- **Returns**: Updated penalty object

---

## Metrics Endpoints (Admin)

### `GET /admin/metrics/product/category`
Get products grouped by category.
- **Auth**: Admin required
- **Returns**: Category statistics

### `GET /admin/metrics/product/charts`
Get product chart data.
- **Auth**: Admin required
- **Returns**: Chart data for products

### `GET /admin/metrics/anomalies`
Get data anomalies and issues.
- **Auth**: Admin required
- **Returns**: Array of anomalies

### `GET /admin/metrics/users`
Get user engagement metrics.
- **Auth**: Admin required
- **Returns**: User statistics and metrics

---

## Export Endpoints (Admin)

### `GET /export/`
Export data file (users, products, transactions, etc.).
- **Auth**: Admin required
- **Query**: `file` - File name (e.g., "users", "products")
- **Returns**: File download

### `GET /export/available`
Get list of available export files.
- **Auth**: Admin required
- **Returns**: Array of filenames

---

## External/Currency Endpoints

### `GET /external/currency`
Get products with currency conversion.
- **Query**: `to` - Target currency code (INR, USD, CAD, EUR, GBP)
- **Returns**: Array of products with converted prices and exchange rate

---

## Response Models

### User
```json
{
  "user_id": "uuid",
  "name": "string",
  "email": "string",
  "role": "customer|admin",
  "user_token": "string"
}
```

### Product
```json
{
  "product_id": "string",
  "product_name": "string",
  "category": "string",
  "discounted_price": 0,
  "actual_price": 0,
  "discount_percentage": 0,
  "rating": 0,
  "rating_count": 0,
  "about_product": "string",
  "img_link": "string",
  "product_link": "string"
}
```

### Cart
```json
{
  "user_id": "uuid",
  "items": [
    {
      "product_id": "string",
      "quantity": 0
    }
  ]
}
```

### Transaction
```json
{
  "transaction_id": "uuid",
  "user_id": "uuid",
  "customer_name": "string",
  "customer_email": "string",
  "items": [],
  "total_price": 0,
  "timestamp": "ISO8601",
  "estimated_delivery": "ISO8601",
  "status": "completed|refunded"
}
```

### Refund
```json
{
  "refund_id": "uuid",
  "transaction_id": "uuid",
  "user_id": "uuid",
  "message": "string",
  "status": "pending|approved|denied",
  "created_at": "ISO8601",
  "updated_at": "ISO8601|null"
}
```

### Penalty
```json
{
  "penalty_id": "uuid",
  "user_id": "uuid",
  "reason": "string",
  "resolved": false,
  "created_at": "ISO8601"
}
```

### Review
```json
{
  "review_id": "uuid",
  "product_id": "string",
  "user_id": "uuid",
  "user_name": "string",
  "review_title": "string",
  "review_content": "string",
  "img_link": "string",
  "product_link": "string",
  "timestamp": "ISO8601"
}
```

---

## Error Responses

All endpoints return standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "detail": "Error message"
}
```
