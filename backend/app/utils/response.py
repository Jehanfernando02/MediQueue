from typing import Any
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json
import uuid


def serialize_value(obj: Any) -> Any:
    """Recursively convert non-JSON-serializable types to JSON-serializable ones."""
    if isinstance(obj, uuid.UUID):
        return str(obj)
    elif isinstance(obj, BaseModel):
        return serialize_value(obj.model_dump(mode='json'))
    elif isinstance(obj, dict):
        return {k: serialize_value(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [serialize_value(item) for item in obj]
    else:
        return obj


def success_response(
    data: Any = None,
    message: str = "OK",
    status_code: int = 200,
    meta: dict | None = None,
) -> JSONResponse:
    # Recursively serialize all values to ensure UUIDs and other non-JSON types are converted
    serialized_data = serialize_value(data)
    
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "data": serialized_data,
            "error": None,
            "message": message,
            "meta": meta or {},
        },
    )


def error_response(
    message: str,
    status_code: int = 400,
    error_code: str | None = None,
    details: Any = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "data": None,
            "error": {
                "message": message,
                "code": error_code,
                "details": details,
            },
            "message": message,
            "meta": {},
        },
    )
