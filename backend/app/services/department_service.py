from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from app.utils.exceptions import NotFoundError, ConflictError


class DepartmentService:
    """Service for department CRUD operations."""

    async def get_all_departments(self, db: AsyncSession) -> list[Department]:
        """Fetch all departments."""
        result = await db.execute(select(Department))
        return result.scalars().all()

    async def get_department_by_id(self, db: AsyncSession, department_id: str) -> Department:
        """Fetch a single department."""
        result = await db.execute(
            select(Department).where(Department.id == department_id)
        )
        department = result.scalar_one_or_none()
        if not department:
            raise NotFoundError("Department")
        return department

    async def create_department(
        self,
        db: AsyncSession,
        data: DepartmentCreate,
    ) -> Department:
        """Create a new department."""
        # Check duplicate name
        result = await db.execute(
            select(Department).where(Department.name == data.name)
        )
        if result.scalar_one_or_none():
            raise ConflictError(f"Department with name '{data.name}' already exists.")

        department = Department(
            name=data.name,
            description=data.description,
        )
        db.add(department)
        await db.commit()
        await db.refresh(department)
        return department

    async def update_department(
        self,
        db: AsyncSession,
        department_id: str,
        data: DepartmentUpdate,
    ) -> Department:
        """Update a department."""
        department = await self.get_department_by_id(db, department_id)

        # Check if new name conflicts with another department
        if data.name and data.name != department.name:
            result = await db.execute(
                select(Department).where(Department.name == data.name)
            )
            if result.scalar_one_or_none():
                raise ConflictError(f"Department with name '{data.name}' already exists.")

        if data.name:
            department.name = data.name
        if data.description is not None:
            department.description = data.description

        await db.commit()
        await db.refresh(department)
        return department

    async def delete_department(self, db: AsyncSession, department_id: str) -> None:
        """Delete a department."""
        department = await self.get_department_by_id(db, department_id)
        await db.delete(department)
        await db.commit()


department_service = DepartmentService()
