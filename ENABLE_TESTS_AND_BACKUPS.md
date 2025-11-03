# How to Enable Tests and Backups

## Current Status: TEMPORARILY DISABLED ⚠️

Both E2E tests and backups are currently disabled for faster deployment during initial setup.

## To Enable E2E Tests

**File:** `.github/workflows/ci-cd.yml`

**Line ~108:** Change the `test` job condition:

```yaml
# FROM (disabled):
  test:
    name: E2E Tests (Disabled)
    runs-on: ubuntu-latest
    needs: [build]
    if: false  # Set to 'github.event_name == 'push' && ...' to enable

# TO (enabled):
  test:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'push' && (github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main')
```

**Line ~183 & ~249:** Add `test` back to deployment dependencies:

```yaml
# FROM:
    needs: [build]  # test removed temporarily

# TO:
    needs: [build, test]
```

## To Enable Backups

### Staging Deployment (Line ~212):

```yaml
# UNCOMMENT these lines:
# Бэкап предыдущей версии - TEMPORARILY DISABLED
if [ -d "/var/www/${{ env.APP_NAME }}/staging/current" ]; then
  mv /var/www/${{ env.APP_NAME }}/staging/current /var/www/${{ env.APP_NAME }}/staging/backup_$(date +%Y%m%d_%H%M%S)
fi

# REMOVE this line:
rm -rf /var/www/${{ env.APP_NAME }}/staging/current
```

### Production Deployment (Line ~278):

```yaml
# UNCOMMENT these lines:
# Бэкап предыдущей версии - TEMPORARILY DISABLED
if [ -d "/var/www/${{ env.APP_NAME }}/production/current" ]; then
  mv /var/www/${{ env.APP_NAME }}/production/current /var/www/${{ env.APP_NAME }}/production/backup_$(date +%Y%m%d_%H%M%S)
fi

# REMOVE this line:
rm -rf /var/www/${{ env.APP_NAME }}/production/current
```

## To Enable Rollback

**Line ~320:** Change the `rollback` job condition:

```yaml
# FROM (disabled):
  rollback:
    name: Rollback (Disabled - No Backups)
    if: false  # Disabled because backups are disabled

# TO (enabled):
  rollback:
    name: Rollback on Failure
    if: failure()
```

## Quick Enable Everything

Search and replace in `.github/workflows/ci-cd.yml`:

1. **Enable tests:**
   - Find: `if: false  # Set to 'github.event_name`
   - Replace with: `if: github.event_name`
   - Find: `needs: [build]  # test removed temporarily`
   - Replace with: `needs: [build, test]`

2. **Enable backups:**
   - Find: `# Бэкап предыдущей версии - TEMPORARILY DISABLED`
   - Uncomment the 3 lines below it
   - Remove: `rm -rf /var/www/${{ env.APP_NAME }}/staging/current`
   - Remove: `rm -rf /var/www/${{ env.APP_NAME }}/production/current`

3. **Enable rollback:**
   - Find: `if: false  # Disabled because backups are disabled`
   - Replace with: `if: failure()`

## Why Disabled?

- **Tests:** Speed up initial deployments during infrastructure setup
- **Backups:** Save disk space and deployment time during frequent testing
- **Rollback:** No point without backups

## Recommendation

**Enable after:**
- ✅ Infrastructure is stable
- ✅ SSL certificates configured
- ✅ First successful production deployment
- ✅ Ready for real traffic
