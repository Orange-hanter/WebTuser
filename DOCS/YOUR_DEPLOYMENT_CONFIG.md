# 🚀 Ваша персональная конфигурация

## 📋 Информация о вашем сервере

- **Основной домен**: tuserduser.online
- **IP адрес**: 5.35.127.138
- **Staging домен**: staging.tuserduser.online
- **Production домен**: tuserduser.online

## ✅ Что уже адаптировано

Все конфигурационные файлы обновлены под ваши параметры:

- ✅ `.env.staging.example`
- ✅ `.env.production.example`
- ✅ `scripts/server-setup.sh`
- ✅ Nginx конфигурации для staging и production

## 🔧 Шаги для полной настройки

### 1️⃣ Подготовка домена (на стороне хостера)

Добавьте A запись у вашего провайдера доменного имени:

```
Тип:  A
Имя:  tuserduser.online (или @)
Значение: 5.35.127.138
TTL: 3600

И также для staging:
Тип:  A
Имя:  staging
Значение: 5.35.127.138
TTL: 3600

Для www (опционально):
Тип:  CNAME
Имя:  www
Значение: tuserduser.online
TTL: 3600
```

⏱️ **Ждите 5-15 минут пока DNS распространится:**

```bash
nslookup tuserduser.online
# Должен вернуть: 5.35.127.138
```

### 2️⃣ Подготовка SSH ключа

На вашем локальном компьютере:

```bash
# Сгенерируйте SSH ключ
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_tuserduser

# Скопируйте публичный ключ
cat ~/.ssh/github_deploy_tuserduser.pub
# Сохраните вывод куда-то
```

### 3️⃣ Инициальная настройка сервера

На вашем сервере (5.35.127.138):

```bash
# Подключитесь по SSH
ssh root@5.35.127.138

# Обновите систему
apt update && apt upgrade -y

# Скачайте и запустите скрипт настройки
wget https://raw.githubusercontent.com/YOUR_USERNAME/WebTuser/develop/scripts/server-setup.sh
chmod +x server-setup.sh
sudo bash server-setup.sh
```

### 4️⃣ Добавьте SSH публичный ключ

На сервере (после выполнения скрипта):

```bash
# Перейдите на пользователя deployer
sudo -u deployer bash

# Добавьте публичный ключ
cat > ~/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... github-actions-deploy
EOF

# Проверьте права
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 5️⃣ Настройка SSL сертификата

На сервере:

```bash
# Установите Let's Encrypt сертификат
sudo certbot --nginx -d tuserduser.online -d www.tuserduser.online -d staging.tuserduser.online

# Выберите опцию 2 (редирект на HTTPS)
# Это происходит автоматически
```

✅ Сертификаты будут обновляться автоматически каждые 90 дней!

### 6️⃣ GitHub Secrets

В репозитории добавьте secrets (`Settings → Secrets and variables → Actions`):

```
SSH_PRIVATE_KEY
Значение: содержимое ~/.ssh/github_deploy_tuserduser (БЕЗ расширения .pub)

VITE_API_BASE_URL
Значение: https://api.tuserduser.online (или что-то другое)

STAGING_HOST
Значение: staging.tuserduser.online

STAGING_USER
Значение: deployer

STAGING_URL
Значение: https://staging.tuserduser.online

PRODUCTION_HOST
Значение: tuserduser.online

PRODUCTION_USER
Значение: deployer

PRODUCTION_URL
Значение: https://tuserduser.online
```

### 7️⃣ Тестовый деплой

```bash
# Перейдите в ветку develop
git checkout develop

# Сделайте какое-то изменение
echo "# Test" >> README.md

# Зафиксируйте и отправьте
git add .
git commit -m "test: CI/CD deployment"
git push origin develop

# Проверьте GitHub Actions на результат
# → Откройте https://github.com/YOUR_USERNAME/WebTuser/actions
```

⏳ Первый деплой займёт 5-10 минут. Дождитесь завершения всех jobs.

### 8️⃣ Проверка

После успешного деплоя:

```bash
# Проверьте staging
curl https://staging.tuserduser.online

# Проверьте production (после merge в main)
curl https://tuserduser.online

# Проверьте логи на сервере
ssh deployer@5.35.127.138
sudo journalctl -u nginx -f
```

## 📊 Структура на сервере

После всех настроек на сервере будет:

```
/var/www/event-app-v2/
├── staging/
│   ├── current/          ← текущая версия staging
│   ├── backup_...        ← бэкапы предыдущих версий
│   └── backup_...
│
└── production/
    ├── current/          ← текущая версия production
    ├── backup_...        ← бэкапы
    └── backup_...

/etc/letsencrypt/live/
├── tuserduser.online/
└── staging.tuserduser.online/

/var/log/nginx/
├── event-app-staging-access.log
├── event-app-staging-error.log
├── event-app-production-access.log
└── event-app-production-error.log
```

## 🔍 Мониторинг

### Проверить статус Nginx

```bash
ssh deployer@5.35.127.138
sudo systemctl status nginx
sudo nginx -t  # проверить конфигурацию
```

### Просмотреть логи

```bash
# Staging логи
sudo tail -f /var/log/nginx/event-app-staging-error.log

# Production логи
sudo tail -f /var/log/nginx/event-app-production-error.log

# Общие логи Nginx
sudo tail -f /var/log/nginx/error.log
```

### Проверить статус SSL

```bash
# Проверить дату истечения сертификата
sudo certbot certificates

# Кол-во дней до истечения
echo $(( ($(date -d "$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/tuserduser.online/fullchain.pem | cut -d= -f2)" +%s) - $(date +%s) ) / 86400 )) дней
```

## 🚨 Troubleshooting

### Домен не резолвится

```bash
# Проверьте DNS
nslookup tuserduser.online
dig tuserduser.online

# Дождитесь распространения DNS (обычно 5-15 минут)
# Может потребоваться очистить кеш браузера Ctrl+Shift+Del
```

### SSH соединение отказывает

```bash
# Проверьте IP
ping 5.35.127.138

# Проверьте SSH порт
ssh -vvv -p 22 deployer@5.35.127.138

# Проверьте rights на authorized_keys
# Должны быть: -rw------- (600)
```

### Certbot ошибка: "domain not found"

```bash
# Убедитесь что DNS правильно настроен
nslookup tuserduser.online

# Проверьте что порт 80 открыт
sudo ufw status
```

### Ошибка при деплое: "Permission denied"

```bash
# Проверьте права
ls -la /var/www/event-app-v2/

# Исправьте если нужно
sudo chown -R deployer:www-data /var/www/event-app-v2
sudo chmod -R 755 /var/www/event-app-v2
```

## 📞 Поддержка

Если что-то пошло не так:

1. Проверьте логи GitHub Actions
2. Проверьте логи на сервере (`/var/log/nginx/`)
3. Проверьте DNS запись
4. Проверьте SSH соединение
5. Проверьте конфигурацию Nginx (`sudo nginx -t`)

## 🎉 Готово!

После выполнения всех шагов у вас будет:

✅ Полностью автоматизированный CI/CD pipeline
✅ Автоматический деплой при push в develop (staging)
✅ Автоматический деплой при push в main (production)
✅ Бесплатные SSL сертификаты с автоматическим продлением
✅ Бэкапы предыдущих версий
✅ Автоматический откат при ошибках
✅ Health checks после деплоя
✅ Сжатие статики (gzip)
✅ Кеширование файлов

Приложение будет доступно по адресам:
- 🔗 https://staging.tuserduser.online (develop branch)
- 🔗 https://tuserduser.online (main branch)
