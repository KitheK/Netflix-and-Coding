"""Export Router: API endpoints for data export (admin only)"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from backend.services.export_service import ExportService
from backend.services.auth_service import admin_required_dep
from backend.models.user_model import User


router = APIRouter(prefix="/export", tags=["export"])

# Initialize export service
export_service = ExportService()


@router.get("/")
async def export_data(
    file: str = Query(..., description="File to export: users, products, cart, transactions, reviews, penalties"),
    current_user: User = Depends(admin_required_dep)
):
    """
    Admin-only: Export a specific JSON data file.
    
    Returns the file contents with metadata and a suggested download filename.
    
    Query Parameters:
        - file: One of [users, products, cart, transactions, reviews, penalties]
    
    Returns:
        JSON response with file data and metadata
    
    Raises:
        400: Invalid file key
        403: User is not admin
        404: File not found
        500: Server error
    """
    try:
        # Export the requested file
        export_data = export_service.export_file(file)
        
        # Generate download filename with timestamp
        download_filename = export_service.generate_export_filename(file)
        
        # Return as JSON response with download headers
        return JSONResponse(
            content=export_data,
            headers={
                "Content-Disposition": f'attachment; filename="{download_filename}"',
                "Content-Type": "application/json"
            }
        )
        
    except ValueError as e:
        # Invalid file key
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        # File doesn't exist
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # Unexpected error
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/available")
async def get_available_exports(
    current_user: User = Depends(admin_required_dep)
):
    """
    Admin-only: Get list of available files that can be exported.
    
    Returns:
        List of file keys that can be used in the /export endpoint
    """
    available = export_service.get_available_files()
    return {
        "available_files": available,
        "total": len(available)
    }
