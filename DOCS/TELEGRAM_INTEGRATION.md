# Telegram Bot Integration - Implementation Guide

## Overview
This document describes the complete Telegram binding integration for the event application. The system enables secure, user-initiated Telegram binding via deep links with full API, webhook, and frontend integration.

## Architecture

### Flow Summary
1. **User initiates binding** → Frontend requests binding link from backend
2. **Backend generates** → Time-limited HMAC-signed token + deep link
3. **User clicks link** → Opens Telegram app/bot
4. **User sends /start** → Bot validates token, binds user
5. **Frontend polls status** → Detects binding and updates UI
6. **User can unbind** → Via bot command `/unsubscribe` or future API endpoint

## API Contracts

### 1. Request Binding Link
**Endpoint:** `POST /v1/api/notifications/telegram/link`

**Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "deeplink": "https://t.me/<bot_username>?start=<binding_token>",
  "token": "<binding_token>",
  "expires_at": "2025-11-18T12:34:56Z"
}
```

**Security:**
- Token is HMAC-signed (secret known only to backend)
- 1-hour TTL (configurable)
- Single-use (invalidated after successful binding)

### 2. Check Binding Status
**Endpoint:** `GET /v1/api/notifications/telegram/status`

**Headers:**
```
Authorization: Bearer <JWT>
```

**Response (200 OK - Bound):**
```json
{
  "status": "active",
  "chat_id": 555666777,
  "username": "user_telegram",
  "updated_at": "2025-11-18T12:40:02Z"
}
```

**Response (404 - Not Bound):**
```json
{
  "error": "telegram_not_bound"
}
```

### 3. User Profile with Telegram Info
**Endpoint:** `GET /v1/api/me`

**Headers:**
```
Authorization: Bearer <JWT>
```

**Response (200 OK):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "telegram_registered": true,
  "telegram_info": {
    "username": "user_telegram",
    "chat_id": 555666777,
    "status": "active",
    "updated_at": "2025-11-18T12:40:02Z"
  }
}
```

### 4. Unbind Telegram (Future)
**Endpoint:** `POST /v1/api/notifications/telegram/unbind`

**Headers:**
```
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Telegram successfully unbound"
}
```

**Note:** Currently, unbinding is handled via bot command `/unsubscribe`. The API endpoint is optional.

### 5. Webhook Endpoint
**Endpoint:** `POST /webhooks/telegram/primary`

**Required Header:**
```
X-Telegram-Bot-Api-Secret-Token: <webhook_secret>
```

**Security:**
- Missing/invalid secret → `403 Forbidden`
- Prevents unauthorized webhook calls
- Secret stored in backend configuration

**Body:** Standard Telegram update payload

## Telegram Bot Commands

### `/start <binding_token>`
- Validates token (signature + expiry)
- Binds user's `chat_id` to account
- Responds with success message
- Marks token as used

### `/start` (no token)
- Instructs user to get a fresh binding link from app settings

### `/unsubscribe`
- Immediately deactivates binding
- Sets status to `inactive`
- Confirms to user
- Idempotent (can be called multiple times)

## Frontend Implementation

### Type Definitions
**Location:** `src/types/index.ts`

```typescript
interface User {
  // ... existing fields
  telegram_registered?: boolean;
  telegram_info?: TelegramInfo;
}

interface TelegramInfo {
  username?: string;
  chat_id: number;
  status: 'active' | 'blocked' | 'inactive';
  updated_at: string;
}

interface TelegramBindingLink {
  deeplink: string;
  token: string;
  expires_at: string;
}

interface TelegramStatus {
  status: 'active' | 'blocked' | 'inactive';
  chat_id?: number;
  username?: string;
  updated_at?: string;
}
```

### Service Layer
**Location:** `src/services/telegramService.ts`

**Methods:**
- `requestBindingLink()` → Request new binding link
- `checkStatus()` → Check current binding status
- `unbind()` → Attempt to unbind (or instruct user to use `/unsubscribe`)
- `openTelegramLink(deeplink)` → Open deep link in new tab
- `copyToClipboard(deeplink)` → Copy link to clipboard
- `isTokenExpired(expiresAt)` → Check if token expired
- `getTimeRemaining(expiresAt)` → Get seconds until expiry
- `formatTimeRemaining(seconds)` → Human-readable time format

### Authentication Context
**Location:** `src/contexts/AuthContext.tsx`

**New Methods:**
- `refreshTelegramStatus()` → Refresh user data to get latest Telegram info
- `bindTelegram()` → Request binding link and return it
- `unbindTelegram()` → Unbind Telegram and refresh user data

**Updated Method:**
- `getCurrentUser(token)` → Now calls actual `/me` endpoint to get Telegram info

### UI Component
**Location:** `src/components/modals/SettingsModal.tsx`

**New Component:** `TelegramBindingSection`

**Features:**
- Conditional rendering based on `telegram_registered` status
- **When NOT bound:**
  - Shows "Connect Telegram" button
  - After clicking, displays deep link with countdown timer
  - Options to open link or copy to clipboard
  - Auto-polls status every 5 seconds to detect binding
- **When bound:**
  - Shows username, chat_id, status badge
  - Shows last updated timestamp
  - "Disconnect Telegram" button with confirmation

**Styling:** `src/components/modals/SettingsModal.css`

## Security Considerations

### Token Security
- **HMAC Signing:** Backend signs tokens with secret key
- **Time-Limited:** 1-hour expiry (adjust as needed)
- **Single-Use:** Token invalidated after successful binding
- **No Replay:** Old tokens cannot be reused

### Webhook Security
- **Secret Token:** Required header for all webhook calls
- **403 on Mismatch:** Silent drop or explicit rejection
- **No Information Leak:** Invalid requests don't reveal system state

### Error Handling
- **Expired Token:** Clear error message, prompt for new link
- **Blocked by User:** Backend marks as `blocked`, stops delivery
- **Network Failures:** User-friendly error messages
- **Rate Limiting:** Consider adding to prevent abuse

## Testing Strategy

### Manual Testing Sequence
1. **Generate Link:**
   - Open settings modal
   - Click "Connect Telegram"
   - Verify link created with countdown timer
   
2. **Bind Account:**
   - Click "Open Telegram" or copy link
   - Send `/start <token>` to bot
   - Verify bot responds with success
   
3. **Verify Status:**
   - Wait for auto-refresh or refresh manually
   - Verify UI shows "Connected" status
   - Verify username and timestamp appear
   
4. **Unbind:**
   - Send `/unsubscribe` to bot
   - Verify bot confirms
   - Verify UI returns to "not connected" state

### Edge Cases to Test
- **Expired Token:** Wait for countdown to reach 0, verify error
- **Invalid Token:** Manually craft invalid token, verify rejection
- **Multiple Bindings:** Try binding same account to multiple users (should fail)
- **Rapid Rebinding:** Unbind and immediately rebind
- **Network Interruption:** Disconnect during binding process

### Automated Tests (Future)
- E2E test with mock Telegram API
- Unit tests for token validation
- Integration tests for webhook endpoint

## Observability & Logging

### Backend Logging Requirements
- **Before Telegram API Call:** Log binding attempt with user ID and token
- **After Telegram API Call:** Log success/failure with response
- **Webhook Received:** Log incoming updates (sanitized)
- **Token Validation:** Log validation failures
- **Status Changes:** Log transitions (active → blocked → inactive)

### Metrics to Track
- Binding success rate
- Token expiry before use rate
- Webhook delivery success rate
- Average time from link creation to binding
- Unbind frequency

## Environment Configuration

### Backend Environment Variables
```bash
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=<bot_token>

# Webhook Secret
TELEGRAM_WEBHOOK_SECRET=<webhook_secret>

# HMAC Secret for Binding Tokens
TELEGRAM_BINDING_SECRET=<binding_secret>

# Token TTL (seconds)
TELEGRAM_TOKEN_TTL=3600

# Bot Username (for deep links)
TELEGRAM_BOT_USERNAME=<bot_username>
```

### Frontend Environment Variables
```bash
# API Base URL
VITE_API_BASE_URL=https://api.tuserduser.online/v1/api
```

## Deployment Checklist

### Backend
- [ ] Set all required environment variables
- [ ] Configure webhook endpoint with Telegram API
- [ ] Test webhook secret validation
- [ ] Enable logging for binding attempts
- [ ] Set up monitoring for binding success rate

### Frontend
- [ ] Update API base URL for production
- [ ] Test deep link generation on all platforms (iOS, Android, Web)
- [ ] Verify auto-refresh polling interval (currently 5s)
- [ ] Test UI on mobile devices (responsive design)
- [ ] Verify error messages are user-friendly

### Telegram Bot
- [ ] Set bot description and commands
- [ ] Test `/start` with and without token
- [ ] Test `/unsubscribe` command
- [ ] Configure webhook URL
- [ ] Add bot to appropriate groups (if applicable)

## Future Enhancements

### Potential Features
1. **Notification Preferences:**
   - Allow users to choose which event types trigger notifications
   - Time-based muting (e.g., "Do Not Disturb" hours)

2. **API Unbind Endpoint:**
   - Add dedicated unbind endpoint as alternative to bot command
   - Support unbind from web UI directly

3. **Multiple Bots:**
   - Support different bots for different regions/languages
   - Allow users to choose preferred bot

4. **Rich Notifications:**
   - Send event cards with inline buttons
   - Support quick actions (RSVP, Share, View Details)

5. **Admin Dashboard:**
   - View binding statistics
   - Monitor webhook health
   - Manually unbind users (for support)

## Troubleshooting

### User Can't Bind
- **Check:** Token expiry (countdown shows 0?)
- **Check:** Bot responding to `/start`?
- **Check:** Webhook configured correctly?
- **Check:** Backend logs for validation errors

### Status Not Updating
- **Check:** `/me` endpoint returning `telegram_info`?
- **Check:** Auto-refresh polling working (5s interval)?
- **Check:** User actually completed binding in bot?
- **Action:** Manually call `refreshTelegramStatus()`

### Notifications Not Sending
- **Check:** User's `status` is `active` (not `blocked`)?
- **Check:** Bot has permission to send messages?
- **Check:** Webhook receiving updates?
- **Check:** Backend notification service running?

### Webhook Fails
- **Check:** Secret header present and correct?
- **Check:** SSL certificate valid (Telegram requires HTTPS)?
- **Check:** Endpoint publicly accessible?
- **Check:** Telegram IP ranges not blocked by firewall?

## Contact & Support

For questions or issues:
- Backend Issues: Check backend repository issues
- Frontend Issues: Check this repository issues
- Bot Issues: Contact bot administrator
- General: Create issue with `[Telegram]` prefix

---

**Last Updated:** November 18, 2025  
**Implementation Status:** ✅ Complete  
**Documentation Version:** 1.0
