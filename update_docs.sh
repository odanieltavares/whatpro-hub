#!/bin/bash
set -e

# Detect Go
if command -v go &> /dev/null; then
    GO_CMD="go"
elif [ -d "$HOME/go_dist/go/bin" ]; then
    export PATH="$HOME/go_dist/go/bin:$PATH"
    GO_CMD="$HOME/go_dist/go/bin/go"
else
    echo "ERROR: Go not found. Run ./run_backend.sh first to install it."
    exit 1
fi

echo "🚀 Setting up Swagger Generator..."
# Ensure GOPATH/bin is in PATH for 'swag' command
export GOPATH=$(go env GOPATH)
export PATH=$PATH:$GOPATH/bin

# Install swag if missing
if ! command -v swag &> /dev/null; then
    echo "⬇️  Installing swag tool..."
    $GO_CMD install github.com/swaggo/swag/cmd/swag@latest
fi

echo "📝 Generating Swagger Documentation..."
cd apps/api
swag init -g cmd/server/main.go --parseDependency --parseInternal

echo "✅ Docs updated! Restart your backend server to see changes."
