#!/bin/bash
set -e

# Define local Go path
LOCAL_GO_DIR="$HOME/go_dist"
LOCAL_GO_BIN="$LOCAL_GO_DIR/go/bin/go"
export GOPATH="$HOME/go"
export PATH="$LOCAL_GO_DIR/go/bin:$PATH"

# Function to install Go locally
install_go() {
    echo "⚠️  Linux Go binary not found. Installing local copy..."
    mkdir -p "$LOCAL_GO_DIR"
    cd "$LOCAL_GO_DIR"
    
    # Download Go 1.22.4 (stable)
    if [ ! -f "go1.22.4.linux-amd64.tar.gz" ]; then
        echo "⬇️  Downloading Go 1.22.4..."
        wget -q https://go.dev/dl/go1.22.4.linux-amd64.tar.gz
    fi
    
    echo "📦 Extracting..."
    rm -rf go
    tar -xzf go1.22.4.linux-amd64.tar.gz
    
    echo "✅ Go installed to $LOCAL_GO_DIR/go"
    cd - > /dev/null
}

# Check if Go exists and is the Linux version (not .exe)
if ! command -v go &> /dev/null || [[ "$(which go)" == *".exe" ]]; then
    if [ -f "$LOCAL_GO_BIN" ]; then
        echo "✅ Found local Go at $LOCAL_GO_BIN"
    else
        install_go
    fi
fi

GO_CMD="go"

echo "🚀 Starting WhatPro Hub Backend..."
echo "Running with: $($GO_CMD version)"

cd apps/api

echo "📦 Tiding dependencies..."
# Force cache cleanup to be safe
$GO_CMD clean -modcache
$GO_CMD mod tidy

echo "🔥 Starting API Server..."
$GO_CMD run cmd/server/main.go
