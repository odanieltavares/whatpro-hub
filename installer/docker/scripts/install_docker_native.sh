#!/bin/bash
set -e

echo "🐳 Removing Docker Desktop integration (if present)..."
# Just to be safe, though users usually need to uncheck it in Windows settings.
# We focus on installing the native engine.

echo "📦 Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

echo "🔑 Adding Docker GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --yes --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "📝 Adding Docker repository..."
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "📥 Installing Docker Engine..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "👤 Configuring user permissions..."
sudo usermod -aG docker $USER

echo "🚀 Starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "✅ Docker installation complete!"
echo "⚠️ You may need to logout/login or close/open this terminal for group permissions to take effect."
