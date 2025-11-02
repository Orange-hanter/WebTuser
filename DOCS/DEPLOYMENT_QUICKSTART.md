# Quick Setup Guide

## 🚀 Quick Start

### 1. Настройка GitHub Secrets

Перейдите в `Settings → Secrets and variables → Actions` и добавьте:

**Обязательные секреты:**
- `SSH_PRIVATE_KEY` - приватный SSH ключ для доступа к серверам
- `VITE_API_BASE_URL` - URL вашего API

**Для Staging:**
- `STAGING_HOST` - домен или IP (например: staging.example.com)
- `STAGING_USER` - SSH пользователь (например: deployer)
- `STAGING_URL` - URL приложения (например: https://staging.example.com)

**Для Production:**
- `PRODUCTION_HOST` - домен или IP
- `PRODUCTION_USER` - SSH пользователь
- `PRODUCTION_URL` - URL приложения

### 2. Подготовка сервера

На вашем сервере выполните:

```bash
# Скачайте скрипт
wget https://raw.githubusercontent.com/YOUR_REPO/develop/scripts/server-setup.sh

# Запустите с правами root
sudo bash server-setup.sh
```

Или выполните вручную команды из `scripts/server-setup.sh`

### 3. Настройка SSH ключа

Сгенерируйте SSH ключ для деплоя:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
```

Скопируйте публичный ключ на сервер:

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub deployer@your-server.com
```

Добавьте приватный ключ в GitHub Secrets:

```bash
cat ~/.ssh/github_deploy
# Скопируйте весь вывод в SSH_PRIVATE_KEY
```

### 4. Обновите Nginx конфигурацию

На сервере отредактируйте файлы:
- `/etc/nginx/sites-available/event-app-staging`
- `/etc/nginx/sites-available/event-app-production`

Замените `example.com` на ваш домен.

### 5. Настройте SSL

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

### 6. Тестовый деплой

```bash
# Для staging
git checkout develop
git push origin develop

# Для production
git checkout main
git merge develop
git push origin main
```

## 📋 Checklist

- [ ] GitHub Secrets настроены
- [ ] Сервер подготовлен (server-setup.sh выполнен)
- [ ] SSH ключи настроены
- [ ] Nginx сконфигурирован
- [ ] SSL сертификаты установлены
- [ ] Тестовый деплой успешен
- [ ] Health check проходит

## 🔍 Проверка деплоя

После деплоя проверьте:

1. **GitHub Actions**: все jobs зеленые
2. **Сервер**: файлы в `/var/www/event-app-v2/[staging|production]/current`
3. **Nginx**: `sudo nginx -t && sudo systemctl status nginx`
4. **Приложение**: откройте URL в браузере

## 🆘 Troubleshooting

**Ошибка: Permission denied**
```bash
# На сервере
sudo chown -R deployer:www-data /var/www/event-app-v2
sudo chmod -R 755 /var/www/event-app-v2
```

**Ошибка: Connection refused**
```bash
# Проверьте SSH доступ
ssh -vvv deployer@5.35.127.138

# Проверьте firewall
sudo ufw status
```

**Ошибка: Nginx не перезагружается**
```bash
# Проверьте sudo права
sudo -l

# Проверьте конфигурацию
sudo nginx -t
```

**Откат деплоя**
```bash
cd /var/www/event-app-v2/production
rm -rf current
mv backup_YYYYMMDD_HHMMSS current
sudo systemctl reload nginx
```

## 📚 Полная документация

Смотрите [CI_CD_SETUP.md](./CI_CD_SETUP.md) для детальной информации.
