# Fast2SMS WhatsApp – Template setup (Popoeye Fitness)

Create **2 templates** in Fast2SMS → WhatsApp Manager. After approval, add each **message_id** to `backend/.env`.

API docs: https://docs.fast2sms.com/reference/sendwhatsappmessage

---

## .env (after templates are approved)

```env
FAST2SMS_API_KEY=your_api_key
FAST2SMS_PHONE_NUMBER_ID=1178477602008773
FAST2SMS_COUNTRY_CODE=91
SERVER_URL=https://popoeye-fitness.onrender.com
GYM_NAME=Popoeye Fitness
CONTACT_PHONE=8309844034

FAST2SMS_TEMPLATE_WELCOME=<message_id from welcome template>
FAST2SMS_TEMPLATE_EXPIRY=<message_id from expiry template>
```

Check status anytime:
```bash
cd backend
node setup-fast2sms.js
```

Test welcome message:
```bash
node setup-fast2sms.js --test 9876543210
```

---

# TEMPLATE 1 — Welcome (new member + invoice PDF)

| Field | Value |
|-------|--------|
| **Template name** | `member_welcome` |
| **Category** | UTILITY |
| **Header type** | **Document (PDF)** ← required for invoice |
| **Body variables** | 4 |

### How invoice works (important)

Do **not** put the invoice link in the message body — WhatsApp rejects that.

Instead:
1. Set template **header** to **Document (PDF)**
2. Upload any sample PDF when creating the template (for approval only)
3. When sending, the app passes the real member invoice via `media_url` API parameter

### Body (copy into Fast2SMS — text only, 4 variables)

```
Hello {{1}}, welcome to {{4}}!

Member ID: {{2}}
Package: {{3}}

Thank you for joining us!
```

### Sample for review

```
Hello Sudheer, welcome to Popoeye Fitness!

Member ID: 0013
Package: 1 month

Thank you for joining us!
```

### Variable mapping

| Variable | App sends |
|----------|-----------|
| {{1}} | Member name |
| {{2}} | Member ID |
| {{3}} | Package |
| {{4}} | Gym name → Popoeye Fitness |

### Header (Document)

- Type: **Document**
- Upload a sample PDF (any membership invoice sample for Meta review)
- At send time, app attaches: `https://popoeye-fitness.onrender.com/api/members/{id}/invoice`

---

# TEMPLATE 2 — Expiry reminder

| Field | Value |
|-------|--------|
| **Template name** | `membership_expiry_reminder` |
| **Category** | UTILITY |
| **Variable count** | 5 |

**Note:** Not sent for **1 day** or **1 week** packages (app skips those automatically).

### Body (copy into Fast2SMS)

```
Hi {{1}}, your {{5}} membership expires in {{2}} day(s) on {{3}}.

Please renew before expiry. Contact: {{4}}
```

### Sample for review

```
Hi Sudheer, your Popoeye Fitness membership expires in 3 day(s) on 2026-08-10.

Please renew before expiry. Contact: 8309844034
```

### Variable mapping

| Variable | App sends |
|----------|-----------|
| {{1}} | Member name |
| {{2}} | Days left (7, 3, or 1) |
| {{3}} | Expiry date |
| {{4}} | Contact phone → 8309844034 |
| {{5}} | Gym name → Popoeye Fitness |

---

## After both are approved

1. Run `node setup-fast2sms.js` — you should see both templates listed.
2. Update `.env`:
   ```env
   FAST2SMS_TEMPLATE_WELCOME=xxxxx
   FAST2SMS_TEMPLATE_EXPIRY=xxxxx
   ```
3. Redeploy backend on Render (or restart locally).
4. Test: `node setup-fast2sms.js --test YOUR_10_DIGIT_PHONE`

---

## When messages are sent

| Template | Trigger |
|----------|---------|
| Welcome | New member added (if phone number exists) |
| Expiry | 7, 3, and 1 days before expiry (daily cron + bulk button on Members page) |

## Wallet

Keep at least ₹50–100 in Fast2SMS wallet. Utility messages ≈ ₹0.25 each.
