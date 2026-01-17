#!/bin/bash

# Load configuration from frontend .env (shared secrets)
ENV_FILE="../vibe-messenger-frontend/.env"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "❌ Error: .env file not found at $ENV_FILE"
  exit 1
fi

if [ -z "$DeployHost" ] || [ -z "$DeployPath" ]; then
  echo "❌ Error: DeployHost or DeployPath not set in .env"
  exit 1
fi

echo "🚀 Starting Vibe Messenger Desktop Build & Deploy..."

# Setup SSH/Rsync
if [ ! -z "$DeployPass" ]; then
    if ! command -v sshpass &> /dev/null; then
        echo "❌ Error: sshpass needed."
        exit 1
    fi
    SSH_CMD="sshpass -e ssh"
    RSYNC_CMD="sshpass -e rsync"
    export SSHPASS="$DeployPass"
else
    SSH_CMD="ssh"
    RSYNC_CMD="rsync"
fi

# 1. Build Mac App
echo "📦 Building Mac App (.dmg)..."
# We specifically build universal or arch-specific. 
# package.json has "build:mac" -> universal
npm run build:mac

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# 2. Rename and Upload
echo "📤 Uploading to $DeployHost:$DeployPath/downloads/..."

# Create downloads folder just in case
$SSH_CMD $DeployHost "mkdir -p $DeployPath/downloads"

# Find the dmg file (usually in dist/)
DMG_FILE=$(find dist -name "*.dmg" | head -n 1)

if [ -z "$DMG_FILE" ]; then
  echo "❌ No DMG file found in dist/"
  exit 1
fi

echo "   Found: $DMG_FILE"
echo "   Renaming to 'vibe-messenger-mac.dmg' for consistent URL..."

# Copy/Rename local or on upload
# We rename on upload to keep local versioned
$RSYNC_CMD -avz --progress "$DMG_FILE" "$DeployHost:$DeployPath/downloads/vibe-messenger-mac.dmg"

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful!"
  echo "🔗 Link: https://(your-domain)/downloads/vibe-messenger-mac.dmg"
else
  echo "❌ Upload failed!"
  exit 1
fi
