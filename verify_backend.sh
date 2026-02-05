#!/bin/bash
set -e

# Try to find go and add to path
if [ -d "/usr/local/go/bin" ]; then
    export PATH=$PATH:/usr/local/go/bin
elif [ -d "/snap/bin" ]; then
    export PATH=$PATH:/snap/bin
fi

if ! command -v go &> /dev/null; then
    if command -v go.exe &> /dev/null; then
        echo "WARNING: Linux 'go' not found, using Windows 'go.exe'."
        GO_CMD="go.exe"
    else
        echo "ERROR: Neither 'go' nor 'go.exe' found."
        echo "PATH is: $PATH"
        exit 1
    fi
else
    GO_CMD="go"
fi

echo "Using Go: $($GO_CMD version)"

echo "Starting isolated build verification..."
rm -rf /tmp/api_check
mkdir -p /tmp/api_check

echo "Copying files..."
cp -r /home/whatpro/projects/whatpro-hub/apps/api/* /tmp/api_check/

cd /tmp/api_check

echo "Running go mod tidy..."
$GO_CMD mod tidy

echo "Running go build..."
$GO_CMD build -v ./...

echo "BUILD SUCCESSFUL"
