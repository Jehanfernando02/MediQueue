from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.middleware.auth_middleware import get_current_user, require_admin
from app.services.department_service import department_service
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.utils.response import success_response

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get(
    "",
    summary="Get all departments",
    response_model=None,
    dependencies=[Depends(get_current_user)],
)
async def get_departments(db: AsyncSession = Depends(get_db)):
    """Get list of all departments (accessible to all authenticated users)."""
    departments = await department_service.get_all_departments(db)
    return success_response(
        data=[
            {
                "id": d.id,
                "name": d.name,
                "description": d.description,
                "created_at": d.created_at.isoformat(),
            }
            for d in departments
        ],
        message="Departments retrieved successfully.",
    )


@router.post(
    "",
    summary="Create a new department",
    status_code=201,
)
async def create_department(
    body: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new department (admin only)."""
    department = await department_service.create_department(db, body)
    return success_response(
        data={
            "id": department.id,
            "name": department.name,
            "description": department.description,
            "created_at": department.created_at.isoformat(),
        },
        message="Department created successfully.",
        status_code=201,
    )


@router.get("/{department_id}", summary="Get department by ID")
async def get_department(
    department_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single department by ID."""
    department = await department_service.get_department_by_id(db, department_id)
    return success_response(
        data={
            "id": department.id,
            "name": department.name,
            "description": department.description,
            "created_at": department.created_at.isoformat(),
        },
        message="Department retrieved successfully.",
    )


@router.patch("/{department_id}", summary="Update a department")
async def update_department(
    department_id: str,
    body: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update a department (admin only)."""
    department = await department_service.update_department(db, department_id, body)
    return success_response(
        data={
            "id": department.id,
            "name": department.name,
            "description": department.description,
            "created_at": department.created_at.isoformat(),
        },
        message="Department updated successfully.",
    )


@router.delete("/{department_id}", summary="Delete a department")
async def delete_department(
    department_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete a department (admin only)."""
    await department_service.delete_department(db, department_id)
    return success_response(message="Department deleted successfully.")
