FROM python:3.14-slim AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_VERSION=1.8.3 \
    POETRY_HOME="/opt/poetry" \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_VIRTUALENVS_CREATE=true \
    PIPX_BIN_DIR=/usr/local/bin \
    PIPX_HOME=/usr/local/pipx \
    PATH=$PIPX_BIN_DIR:$PATH

# pipx + system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pipx \
    libgomp1 \
    libffi8 \
    openssl \
    ca-certificates \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

RUN pipx ensurepath

# Install Poetry via pipx
ENV POETRY_VERSION=2.2.1
RUN pipx install "poetry==$POETRY_VERSION"

# Create non-root user
RUN groupadd -g 1001 appuser && \
    useradd -u 1001 -g appuser -s /bin/bash -m appuser

FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libc-dev \
    libffi-dev \
    libssl-dev \
    make \
    cmake \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml poetry.lock* ./

# RUN poetry lock --no-update
RUN poetry install --no-root --no-interaction --no-ansi --without dev

FROM base AS runtime
ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -sf http://localhost:8000/health | jq -e '.status == "ok"' > /dev/null || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

