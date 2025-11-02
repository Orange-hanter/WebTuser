# CI/CD Configuration Guide

## Обзор

Этот проект использует GitHub Actions для автоматизации процессов тестирования, сборки и развертывания.

## Pipeline Jobs

### 1. Test & Lint
- TypeScript проверка типов
- ESLint проверка кода
- Playwright E2E тесты
- Загрузка отчетов о тестировании

### 2. Build Application
- Сборка production версии
- Создание deployment архива
- Сохранение артефактов

### 3. Deploy to Staging (develop branch)
- Автоматический деплой на staging сервер
- Бэкап предыдущей версии
- Health check

### 4. Deploy to Production (main branch)
- Деплой на production сервер
- Автоматический бэкап
- Health check
- Уведомления

### 5. Rollback on Failure
- Автоматический откат при ошибке
- Восстановление из последнего бэкапа

## Необходимые GitHub Secrets

Добавьте следующие секреты в настройках репозитория (Settings → Secrets and variables → Actions):

### Staging Environment
```
STAGING_HOST          # IP или домен staging сервера (например: staging.example.com)
STAGING_USER          # SSH пользователь (например: deployer)
STAGING_URL           # URL приложения (например: https://staging.example.com)
```

### Production Environment
```
PRODUCTION_HOST       # IP или домен production сервера
PRODUCTION_USER       # SSH пользователь
PRODUCTION_URL        # URL приложения (например: https://example.com)
```

### SSH Configuration
```
SSH_PRIVATE_KEY       # Приватный SSH ключ для доступа к серверам
SSH_PORT             # SSH порт (по умолчанию 22, опционально)
```

### Application Configuration
```
VITE_API_BASE_URL    # URL бэкенд API (например: https://api.example.com)
```

## Настройка сервера

### 1. Создание пользователя для деплоя

```bash
# На сервере
sudo adduser deployer
sudo usermod -aG www-data deployer
```

### 2. Настройка SSH ключей

```bash
# Локально сгенерируйте SSH ключ
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Скопируйте публичный ключ на сервер
ssh-copy-id -i ~/.ssh/github_deploy.pub deployer@your-server.com

# Добавьте приватный ключ в GitHub Secrets (SSH_PRIVATE_KEY)
cat ~/.ssh/github_deploy
```

### 3. Создание директорий на сервере

```bash
# На сервере
sudo mkdir -p /var/www/event-app-v2/staging
sudo mkdir -p /var/www/event-app-v2/production
sudo chown -R deployer:www-data /var/www/event-app-v2
sudo chmod -R 755 /var/www/event-app-v2
```

### 4. Настройка Nginx

```nginx
# /etc/nginx/sites-available/event-app-staging
server {
    listen 80;
    server_name staging.example.com;
    
    root /var/www/event-app-v2/staging/current;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Кеширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

# /etc/nginx/sites-available/event-app-production
server {
    listen 80;
    server_name example.com www.example.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    root /var/www/event-app-v2/production/current;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Кеширование статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/event-app-staging /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/event-app-production /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Настройка SSL (Let's Encrypt)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

### 6. Настройка sudo для перезагрузки Nginx

```bash
# Добавьте в /etc/sudoers.d/deployer
deployer ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
deployer ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
```

## Использование

### Деплой на Staging
```bash
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop
```

### Деплой на Production
```bash
git checkout main
git merge develop
git push origin main
```

### Ручной запуск workflow
1. Перейдите в GitHub → Actions
2. Выберите "CI/CD Pipeline"
3. Нажмите "Run workflow"
4. Выберите ветку

## Мониторинг

### Просмотр логов деплоя
- GitHub → Actions → выберите workflow run
- Просмотр каждого job и шага

### Проверка статуса на сервере
```bash
# SSH на сервер
ssh deployer@your-server.com

# Проверка текущей версии
ls -la /var/www/event-app-v2/production/current

# Просмотр бэкапов
ls -la /var/www/event-app-v2/production/
```

### Ручной откат
```bash
cd /var/www/event-app-v2/production
rm -rf current
mv backup_YYYYMMDD_HHMMSS current
sudo systemctl reload nginx
```

## Troubleshooting

### Ошибка: Permission denied
```bash
# На сервере проверьте права
ls -la /var/www/event-app-v2
sudo chown -R deployer:www-data /var/www/event-app-v2
```

### Ошибка: Connection refused
```bash
# Проверьте SSH доступ
ssh -vvv deployer@your-server.com

# Проверьте firewall
sudo ufw status
sudo ufw allow 22/tcp
```

### Ошибка: Nginx не перезагружается
```bash
# Проверьте права sudo
sudo -l

# Проверьте конфигурацию nginx
sudo nginx -t
```

## Security Best Practices

1. **Используйте отдельные ключи** для staging и production
2. **Регулярно ротируйте** SSH ключи
3. **Ограничьте доступ** по IP если возможно
4. **Используйте secrets** для всех чувствительных данных
5. **Включите 2FA** на GitHub
6. **Регулярно обновляйте** зависимости и actions
7. **Настройте мониторинг** и алерты

## Environments Protection

В настройках репозитория можно настроить защиту environments:

1. Settings → Environments → production
2. Добавьте required reviewers
3. Настройте deployment branches (только main)
4. Добавьте environment secrets

Это потребует ручного подтверждения перед деплоем на production.
