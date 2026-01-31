# ============================================
# WhatPro Hub API - Multi-stage Dockerfile
# ============================================
# Build: docker build -t whatpro/hub-api:latest .
# Run: docker run -p 3000:3000 whatpro/hub-api:latest
# ============================================

# Stage 1: Build
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum* ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /build/whatpro-api \
    ./cmd/server

# Stage 2: Runtime
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache ca-certificates curl tzdata

# Set timezone
ENV TZ=America/Sao_Paulo

# Create non-root user
RUN addgroup -S whatpro && adduser -S whatpro -G whatpro

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/whatpro-api .

# Change ownership
RUN chown -R whatpro:whatpro /app

# Switch to non-root user
USER whatpro

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health/live || exit 1

# Run the binary
ENTRYPOINT ["./whatpro-api"]
