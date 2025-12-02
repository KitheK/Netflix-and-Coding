"""Metrics Router: API endpoints for business metrics (Admin-only)"""

from fastapi import APIRouter, Depends
from backend.models.user_model import User
from backend.services.auth_service import admin_required_dep
from backend.services.metrics_service import MetricsService

# Create router with prefix /admin/metrics and tag "metrics"
router = APIRouter(prefix="/admin/metrics", tags=["metrics"])

# Initialize metrics service
metrics_service = MetricsService()


@router.get("/product/category")
async def get_category_metrics(current_user: User = Depends(admin_required_dep)):
    """
    Admin-only: Get business metrics grouped by product category.
    
    Returns:
    - Summary: Total revenue, total transactions, total users, returning users
    - Categories: Breakdown by category with revenue, transaction count, and top products
    - Most purchased products: Overall ranking of most purchased products
    """
    metrics = metrics_service.get_category_metrics()
    return metrics


@router.get("/product/charts")
async def get_chart_data(current_user: User = Depends(admin_required_dep)):
    """
    Admin-only: Get chart-ready aggregated data for visualization.
    
    Returns:
    - top_products_by_sales: Bar chart data for top 10 products by sales (quantity)
    - category_distribution: Pie chart data for category distribution by revenue
    - new_vs_returning_users: Pie chart data for new vs returning users
    """
    chart_data = metrics_service.get_chart_data()
    return chart_data


@router.get("/anomalies")
async def get_anomalies(current_user: User = Depends(admin_required_dep)):
    """
    Admin-only: Get basic anomaly alerts.
    
    Detects:
    - Sudden spike in penalties (last 24 hours vs historical average)
    - Products with unusually high number of reviews (compared to average)
    
    Returns:
    - penalty_spike: Alert if penalties in last 24h are 3x+ historical average
    - review_anomalies: List of products with review counts 2x+ the average
    
    Note: All checks are rule-based and generated on request (no persistent storage)
    """
    anomalies = metrics_service.get_anomalies()
    return anomalies

