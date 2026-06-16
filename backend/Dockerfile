# ──────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Installs dependencies in an isolated stage to keep the final image lean.
# ──────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies needed to compile Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt


# ──────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# Copies only the installed packages and app code — no build tools.
# ──────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# OCI image labels (industry standard metadata)
LABEL org.opencontainers.image.title="MediQueue Backend"
LABEL org.opencontainers.image.description="FastAPI clinical appointment & patient flow management API"
LABEL org.opencontainers.image.source="https://github.com/Jehanfernando02/MediQueue"
LABEL org.opencontainers.image.licenses="MIT"

# Install runtime-only system libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user — security best practice
RUN groupadd --gid 1001 appgroup \
 && useradd  --uid 1001 --gid appgroup --shell /bin/sh --create-home appuser

WORKDIR /app

# Copy installed Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

EXPOSE 8000

# Docker health check — monitors /api/health every 30 seconds
# Allows 40s start period for migrations + Uvicorn startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -sf http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
