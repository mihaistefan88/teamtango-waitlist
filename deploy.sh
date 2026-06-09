#!/bin/bash

# Deployment script for TeamTango Waitlist
# Deploys to nexus.webarch.ro:/var/www/teamtango-waitlist

set -e  # Exit on error

SERVER="root@nexus.webarch.ro"
DEPLOY_PATH="/var/www/teamtango-waitlist"

echo "🚀 Deploying TeamTango Waitlist to nexus.webarch.ro..."

# Create deployment directory if it doesn't exist
echo "📁 Ensuring deployment directory exists..."
ssh $SERVER "mkdir -p $DEPLOY_PATH"

# Sync files to server (excluding node_modules, .git, etc.)
echo "📤 Syncing files to server..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.claude' \
  --exclude 'emails.json' \
  --exclude 'deploy.sh' \
  ./ $SERVER:$DEPLOY_PATH/

# Install dependencies and restart on server
echo "📦 Installing dependencies on server..."
ssh $SERVER "source ~/.nvm/nvm.sh && cd $DEPLOY_PATH && npm install --production"

# Restart the application using PM2 (if installed) or systemd
echo "🔄 Restarting application..."
ssh $SERVER "source ~/.nvm/nvm.sh && cd $DEPLOY_PATH && (pm2 restart teamtango-waitlist || pm2 start server.js --name teamtango-waitlist) 2>/dev/null || systemctl restart teamtango-waitlist 2>/dev/null || echo 'Note: Please manually restart the application'"

echo "✅ Deployment complete!"
echo "🌐 Application should be running at nexus.webarch.ro"

# Notify search engines via IndexNow (Bing/Yandex family; feeds ChatGPT/Copilot indexes)
INDEXNOW_KEY="fad54fff0271f9b6b6ba5bbc42f3caac"
echo "📣 Pinging IndexNow..."
curl -s -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{
    \"host\": \"teamtango.io\",
    \"key\": \"$INDEXNOW_KEY\",
    \"keyLocation\": \"https://teamtango.io/$INDEXNOW_KEY.txt\",
    \"urlList\": [
      \"https://teamtango.io/\",
      \"https://teamtango.io/roadmap\",
      \"https://teamtango.io/changelog\",
      \"https://teamtango.io/vs/workvivo\",
      \"https://teamtango.io/vs/slack\"
    ]
  }" -o /dev/null -w "IndexNow HTTP %{http_code}\n"
