#!/bin/bash

# Server setup script - run on your deployment server
# Usage: sudo bash server-setup.sh

set -e

APP_NAME="event-app-v2"
DEPLOY_USER="deployer"
WEB_ROOT="/var/www"

echo "🔧 Setting up server for deployment..."

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx ufw

# Create deployment user
if ! id "$DEPLOY_USER" &>/dev/null; then
    echo "Creating deployment user..."
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG www-data "$DEPLOY_USER"
    echo "User $DEPLOY_USER created"
else
    echo "User $DEPLOY_USER already exists"
fi

# Create directories
echo "Creating application directories..."
mkdir -p "$WEB_ROOT/$APP_NAME"/{staging,production}
chown -R "$DEPLOY_USER:www-data" "$WEB_ROOT/$APP_NAME"
chmod -R 755 "$WEB_ROOT/$APP_NAME"

# Setup SSH for deployment user
echo "Setting up SSH for deployment user..."
sudo -u "$DEPLOY_USER" mkdir -p "/home/$DEPLOY_USER/.ssh"
sudo -u "$DEPLOY_USER" chmod 700 "/home/$DEPLOY_USER/.ssh"
sudo -u "$DEPLOY_USER" touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
sudo -u "$DEPLOY_USER" chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

echo ""
echo "⚠️  Add your GitHub Actions public key to:"
echo "   /home/$DEPLOY_USER/.ssh/authorized_keys"
echo ""

# Configure sudo for nginx reload
echo "Configuring sudo permissions..."
cat > "/etc/sudoers.d/$DEPLOY_USER" << EOF
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
EOF

chmod 440 "/etc/sudoers.d/$DEPLOY_USER"

# Configure firewall
echo "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw status

# Create Nginx configuration for staging
echo "Creating Nginx configuration for staging..."
cat > /etc/nginx/sites-available/event-app-staging << 'NGINX_STAGING'
server {
    listen 80;
    server_name staging.tuserduser.online;
    
    root /var/www/event-app-v2/staging/current;
    index index.html;
    
    # Logging
    access_log /var/log/nginx/event-app-staging-access.log;
    error_log /var/log/nginx/event-app-staging-error.log;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
}
NGINX_STAGING

# Create Nginx configuration for production
echo "Creating Nginx configuration for production..."
cat > /etc/nginx/sites-available/event-app-production << 'NGINX_PROD'
server {
    listen 80;
    server_name tuserduser.online www.tuserduser.online;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tuserduser.online www.tuserduser.online;
    
    # SSL certificates (will be configured by certbot)
    # ssl_certificate /etc/letsencrypt/live/tuserduser.online/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/tuserduser.online/privkey.pem;
    
    root /var/www/event-app-v2/production/current;
    index index.html;
    
    # Logging
    access_log /var/log/nginx/event-app-production-access.log;
    error_log /var/log/nginx/event-app-production-error.log;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
}
NGINX_PROD

# Enable sites
echo "Enabling Nginx sites..."
ln -sf /etc/nginx/sites-available/event-app-staging /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/event-app-production /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "Reloading Nginx..."
systemctl reload nginx

echo ""
echo "✅ Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Add GitHub Actions SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "2. Update domain names in Nginx configs:"
echo "   - /etc/nginx/sites-available/event-app-staging"
echo "   - /etc/nginx/sites-available/event-app-production"
echo "3. Set up SSL with: sudo certbot --nginx -d tuserduser.online -d www.tuserduser.online"
echo "4. Configure GitHub Secrets with server details"
echo "5. Test deployment with: git push origin develop"
echo ""
