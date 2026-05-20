import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.database import AsyncSessionLocal
from app.models.audit_log import AuditLog
import json

logger = logging.getLogger("mediqueue.audit")

def get_natural_description(method: str, path: str) -> str | None:
    """
    Map a request to a natural language description.
    Returns None if the action is not relevant for the audit log.
    """
    parts = [p for p in path.split("/") if p]
    if len(parts) < 3: 
        return None
    
    # parts: ['api', 'v1', 'entity', ...]
    entity = parts[2]
    sub_action = parts[-1] if len(parts) > 3 else None
    
    # -------------------------------------------------------------------------
    # Appointment Actions
    # -------------------------------------------------------------------------
    if entity == "appointments":
        if method == "POST" and sub_action == "notes":
            return "Added consultation notes"
        if method == "POST":
            return "Booked a new appointment"
        if method == "DELETE":
            return "Cancelled an appointment"
        if method == "PATCH" and sub_action == "status":
            return "Updated appointment status"
        if method == "PATCH":
            return "Modified appointment details"
            
    # -------------------------------------------------------------------------
    # Doctor Actions
    # -------------------------------------------------------------------------
    if entity == "doctors":
        if method == "POST":
            return "Registered a new doctor"
        if method == "PATCH":
            return "Updated doctor profile"
        if method == "DELETE":
            return "Removed a doctor from the system"
            
    # -------------------------------------------------------------------------
    # Department Actions
    # -------------------------------------------------------------------------
    if entity == "departments":
        if method == "POST":
            return "Created a new department"
        if method == "PATCH":
            return "Modified department details"
        if method == "DELETE":
            return "Deleted a department"
            
    # -------------------------------------------------------------------------
    # User / Auth Actions
    # -------------------------------------------------------------------------
    if entity == "users":
        if method == "PATCH" and "me" in parts:
            return "Updated account profile"
            
    if entity == "auth":
        if method == "POST" and sub_action == "logout":
            return "User logged out"

    return None

def get_friendly_entity(entity: str) -> str:
    """Map technical entity names to friendly versions."""
    mapping = {
        "appointments": "Appointment",
        "doctors": "Doctor Profile",
        "departments": "Department",
        "users": "Account",
        "auth": "Security"
    }
    return mapping.get(entity, entity.capitalize())


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Initialize state to track if a manual log was created
        request.state.audit_logged = False
        
        # We only care about mutating requests for the safety net
        if request.method not in ["POST", "PATCH", "DELETE", "PUT"]:
            return await call_next(request)

        # Skip login/register to avoid logging passwords
        if "/auth/login" in request.url.path or "/auth/register" in request.url.path:
            return await call_next(request)

        # Process the request
        response = await call_next(request)

        # Only log successful operations AND only if not already logged by a service
        if 200 <= response.status_code < 300 and not getattr(request.state, "audit_logged", False):
            try:
                # Safety net mapping
                description = get_natural_description(request.method, request.url.path)
                
                if not description:
                    return response

                user = getattr(request.state, "user", None)
                user_id = user.id if user else None
                
                # Extract entity name and make it friendly
                path_parts = [p for p in request.url.path.split("/") if p]
                entity_raw = path_parts[2] if len(path_parts) > 2 else "unknown"
                entity_friendly = get_friendly_entity(entity_raw)
                
                # Try to get entity_id from path
                entity_id = None
                if len(path_parts) > 3 and path_parts[3] != "me":
                    entity_id = path_parts[3]

                async with AsyncSessionLocal() as db:
                    audit_entry = AuditLog(
                        user_id=user_id,
                        action=description, 
                        entity=entity_friendly,
                        entity_id=entity_id,
                        ip_address=request.client.host if request.client else None,
                        request_id=request.headers.get("X-Request-ID"),
                        metadata_={
                            "path": request.url.path,
                            "method": request.method,
                            "status": response.status_code,
                            "type": "safety_net"
                        }
                    )
                    db.add(audit_entry)
                    await db.commit()
            except Exception as e:
                logger.error(f"Failed to write safety-net audit log: {e}")

        return response
