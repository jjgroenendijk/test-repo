FROM node:22-bookworm-slim AS website-build

WORKDIR /app/website

COPY website/package.json website/package-lock.json ./
RUN npm ci

COPY website/ ./
RUN npm run build

FROM python:3.12-slim-bookworm

# Install UV and ffmpeg
COPY --from=ghcr.io/astral-sh/uv:0.5.21 /uv /uvx /bin/
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy backend script
COPY server.py ./

# Copy frontend static files
COPY --from=website-build /app/website/dist /app/website/dist

ENV DATA_DIR=/data
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000

CMD ["uv", "run", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "3000"]
