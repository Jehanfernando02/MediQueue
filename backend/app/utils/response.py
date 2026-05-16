from typing import Any
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "OK",
    status_code: int = 200,
    meta: dict | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "data": data,
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
