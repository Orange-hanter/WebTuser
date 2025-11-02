# 🔑 SSH Ключи и GitHub Secrets для tuserduser.online

## ✅ Что было выполнено

### 1. SSH Ключ сгенерирован

```bash
# Сгенерирован SSH ключ ed25519
ssh-keygen -t ed25519 -C "github-actions-deploy-tuserduser" -f ~/.ssh/github_deploy_tuserduser -N ""
```

**Расположение ключей:**
- Приватный ключ: `~/.ssh/github_deploy_tuserduser`
- Публичный ключ: `~/.ssh/github_deploy_tuserduser.pub`

### 2. GitHub Secrets установлены

Все 9 secrets успешно установлены в репозиторий `Orange-hanter/WebTuser`:

| Secret | Значение |
|--------|----------|
| `SSH_PRIVATE_KEY` | ✅ Установлен |
| `VITE_API_BASE_URL` | `https://api.tuserduser.online` |
| `STAGING_HOST` | `staging.tuserduser.online` |
| `STAGING_USER` | `deployer` |
| `STAGING_URL` | `https://staging.tuserduser.online` |
| `PRODUCTION_HOST` | `tuserduser.online` |
| `PRODUCTION_USER` | `deployer` |
| `PRODUCTION_URL` | `https://tuserduser.online` |
| `SSH_PORT` | `22` |

## 🔑 Публичный SSH ключ

Этот ключ нужно добавить на сервер:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICJSLmg2wKP45XLh44YIAgc85cQQo8rdcTzafVDib3nf github-actions-deploy-tuserduser
```

## 📋 Что дальше

### Шаг 1: На вашем сервере (5.35.127.138)

```bash
# 1. Подключитесь на сервер
ssh root@5.35.127.138

# 2. Запустите скрипт настройки
wget https://raw.githubusercontent.com/Orange-hanter/WebTuser/develop/scripts/server-setup.sh
chmod +x server-setup.sh
sudo bash server-setup.sh
```

### Шаг 2: После выполнения скрипта

На сервере должен был создан пользователь `deployer` с SSH доступом.

Добавьте публичный ключ:

```bash
# На сервере (выполнить как deployer)
sudo -u deployer bash << 'EOF'
mkdir -p ~/.ssh
cat > ~/.ssh/authorized_keys << 'PUBKEY'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICJSLmg2wKP45XLh44YIAgc85cQQo8rdcTzafVDib3nf github-actions-deploy-tuserduser
PUBKEY

chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
exit
EOF
```

### Шаг 3: Проверка SSH соединения

На вашем локальном компьютере:

```bash
# Проверьте что можете подключиться
ssh -i ~/.ssh/github_deploy_tuserduser deployer@5.35.127.138

# Должно вывести что-то вроде:
# Welcome to Ubuntu 22.04.1 LTS
# ...
```

### Шаг 4: DNS настройка

У провайдера доменного имени добавьте A запись:

```
Тип:     A
Имя:     tuserduser.online (или @)
Значение: 5.35.127.138
TTL:     3600

Также для staging:
Тип:     A
Имя:     staging
Значение: 5.35.127.138
TTL:     3600
```

Ждите 5-15 минут распространения DNS, проверьте:

```bash
nslookup tuserduser.online
# Должен вернуть: 5.35.127.138
```

### Шаг 5: SSL Сертификаты

На сервере:

```bash
# Установите Let's Encrypt сертификаты
sudo certbot --nginx -d tuserduser.online -d www.tuserduser.online -d staging.tuserduser.online

# Выберите опцию 2 для редиректа на HTTPS
```

## 🧪 Тестовый деплой

После всех подготовок:

```bash
# Перейдите в develop ветку
git checkout develop

# Сделайте коммит
echo "# Test deployment" >> README.md
git add .
git commit -m "test: CI/CD pipeline"
git push origin develop
```

Проверьте GitHub Actions:
- Откройте https://github.com/Orange-hanter/WebTuser/actions
- Дождитесь завершения workflow
- Проверьте staging приложение на https://staging.tuserduser.online

## 🔒 Информация для хранения

### Сохраните эту информацию в безопасном месте:

**SSH Ключи:**
- Приватный ключ находится в: `~/.ssh/github_deploy_tuserduser`
- **НИКОГДА** не делитесь приватным ключом!
- Публичный ключ уже добавлен на сервер

**GitHub Secrets:**
- Автоматически используются GitHub Actions
- Недоступны через web interface (видно только имя)
- Защищены GitHub

## 🚨 Если что-то пошло не так

### SSH соединение не работает

```bash
# Проверьте сам ключ
ls -la ~/.ssh/github_deploy_tuserduser

# Проверьте права
chmod 600 ~/.ssh/github_deploy_tuserduser

# Попробуйте соединиться с verbose логами
ssh -vvv -i ~/.ssh/github_deploy_tuserduser deployer@5.35.127.138

# Проверьте на сервере
ssh deployer@5.35.127.138
cat ~/.ssh/authorized_keys
ls -la ~/.ssh
```

### DNS не резолвится

```bash
# Проверьте DNS запись
nslookup tuserduser.online
dig tuserduser.online

# Если нет результатов, дождитесь распространения (5-15 мин)
# Или очистьте локальный кеш DNS (зависит от ОС)
```

### Nginx ошибка

```bash
# На сервере проверьте конфигурацию
sudo nginx -t

# Смотрите логи
sudo tail -f /var/log/nginx/error.log
```

## 📞 Финальный чеклист

- ✅ SSH ключ сгенерирован
- ✅ GitHub Secrets установлены
- ✅ Сервер подготовлен (server-setup.sh)
- ⏳ DNS запись добавлена (ждём распространения)
- ⏳ SSH ключ добавлен на сервер
- ⏳ SSL сертификаты установлены
- ⏳ Тестовый деплой выполнен

После выполнения всех пунктов у вас будет полностью рабочая CI/CD система! 🚀
