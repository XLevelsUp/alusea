# Sara for ai.alusea.in. Railway and Render build this when the service's root directory is services/ai.
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1

# Dependencies first, so code changes don't reinstall them.
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --locked --no-dev --no-install-project

COPY src ./src
RUN uv sync --locked --no-dev

# DATA_DIR must be a persistent volume mounted at /data, or chats, leads and limit counts are lost on every deploy.
# The host's proxy is the only way in, so its forwarded visitor addresses are trusted.
# The host sets PORT; 8000 is only the fallback.
ENV HOST=0.0.0.0 PORT=8000 DATA_DIR=/data COOKIE_SECURE=true FORWARDED_ALLOW_IPS=*
EXPOSE 8000

CMD ["uv", "run", "--no-sync", "alusea-ai-service"]
