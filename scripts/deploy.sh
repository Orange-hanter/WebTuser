#!/bin/bash

# Deployment script for manual execution
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
APP_NAME="event-app-v2"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    source ".env.$ENVIRONMENT"
else
    echo -e "${RED}Error: .env.$ENVIRONMENT file not found${NC}"
    exit 1
fi

# Validate required variables
required_vars=("DEPLOY_HOST" "DEPLOY_USER" "DEPLOY_PATH")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set in .env.$ENVIRONMENT${NC}"
        exit 1
    fi
done

# Build application
echo -e "${YELLOW}Building application...${NC}"
cd event-app_v2
npm run build

# Create deployment archive
echo -e "${YELLOW}Creating deployment archive...${NC}"
cd dist
tar -czf "../../deployment_${TIMESTAMP}.tar.gz" .
cd ../..

# Upload to server
echo -e "${YELLOW}Uploading to server...${NC}"
scp -P "${SSH_PORT:-22}" "deployment_${TIMESTAMP}.tar.gz" \
    "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/"

# Execute deployment on server
echo -e "${YELLOW}Executing deployment script on server...${NC}"
ssh -p "${SSH_PORT:-22}" "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
    set -e
    
    # Create directories
    mkdir -p "${DEPLOY_PATH}/${ENVIRONMENT}"
    
    # Backup current version
    if [ -d "${DEPLOY_PATH}/${ENVIRONMENT}/current" ]; then
        echo "Creating backup..."
        mv "${DEPLOY_PATH}/${ENVIRONMENT}/current" \
           "${DEPLOY_PATH}/${ENVIRONMENT}/backup_${TIMESTAMP}"
    fi
    
    # Create new current directory
    mkdir -p "${DEPLOY_PATH}/${ENVIRONMENT}/current"
    
    # Extract new version
    echo "Extracting new version..."
    tar -xzf "/tmp/deployment_${TIMESTAMP}.tar.gz" \
        -C "${DEPLOY_PATH}/${ENVIRONMENT}/current"
    
    # Clean up
    rm "/tmp/deployment_${TIMESTAMP}.tar.gz"
    
    # Reload nginx
    sudo systemctl reload nginx || echo "Nginx reload skipped"
    
    # Clean old backups (keep last 5)
    cd "${DEPLOY_PATH}/${ENVIRONMENT}"
    ls -t | grep backup | tail -n +6 | xargs -r rm -rf
    
    echo "Deployment completed successfully!"
EOF

# Clean up local archive
rm "deployment_${TIMESTAMP}.tar.gz"

# Health check
echo -e "${YELLOW}Performing health check...${NC}"
sleep 5
if curl -f "${HEALTH_CHECK_URL}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Deployment successful! Application is healthy.${NC}"
    echo -e "${GREEN}URL: ${HEALTH_CHECK_URL}${NC}"
else
    echo -e "${RED}❌ Health check failed! Application may not be running correctly.${NC}"
    exit 1
fi
