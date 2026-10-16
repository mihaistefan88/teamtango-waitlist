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
  --exclude 'marketing-assets' \
  ./ $SERVER:$DEPLOY_PATH/

# Install dependencies and restart on server
echo "📦 Installing dependencies on server..."
ssh $SERVER "source ~/.nvm/nvm.sh && cd $DEPLOY_PATH && npm install --production"

# systemd (teamtango-waitlist.service) is the only process manager. Never start it
# under pm2 as well: the two fight over :3001 and whichever loses crash-loops silently.
echo "🔄 Restarting application..."
ssh $SERVER "systemctl restart teamtango-waitlist && sleep 2 && systemctl is-active teamtango-waitlist && ss -tlnp | grep -q \"pid=\$(systemctl show -p MainPID --value teamtango-waitlist),\" && echo 'systemd owns :3001'"

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
