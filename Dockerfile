FROM node:22-bookworm-slim AS website-build

WORKDIR /app/website

COPY website/package.json website/package-lock.json ./
RUN npm ci

COPY website/ ./
RUN npm run build

FROM python:3.12-slim-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=website-build /app/website/dist /app/website/dist

ENV DATA_DIR=/data
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000

CMD ["python3", "-m", "http.server", "3000", "--bind", "0.0.0.0", "--directory", "/app/website/dist"]
