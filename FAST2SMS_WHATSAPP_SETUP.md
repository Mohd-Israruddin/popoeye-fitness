# Fast2SMS WhatsApp – Template setup guide

Fast2SMS WhatsApp only sends **pre-approved templates**. Create these in your Fast2SMS panel (WhatsApp Manager), then put each template's **Message ID** in `.env`.

API docs: https://docs.fast2sms.com/reference/sendwhatsappmessage

## .env variables

```env
FAST2SMS_API_KEY=your_api_key
FAST2SMS_PHONE_NUMBER_ID=your_waba_phone_number_id
FAST2SMS_COUNTRY_CODE=91

FAST2SMS_TEMPLATE_WELCOME=1
FAST2SMS_TEMPLATE_EXPIRY=2
```

## Active WhatsApp notifications

| Message | When |
|---------|------|
| Welcome | New member added |
| Expiry reminder | 7, 3, and 1 days before expiry (cron + bulk button) |

## Suggested template bodies (Utility ≈ ₹0.25/msg)

### Welcome (`FAST2SMS_TEMPLATE_WELCOME`)
Variables: `name | member_id | package | join_date | expiry_date | total_amount | paid_amount | gym_name`

```
Hello {{1}}, welcome to {{8}}!

Member ID: {{2}}
Package: {{3}}
Join: {{4}}
Expiry: {{5}}
Total: ₹{{6}}
Paid: ₹{{7}}
```

### Expiry reminder (`FAST2SMS_TEMPLATE_EXPIRY`)
Variables: `name | days_left | expiry_date | contact_phone | gym_name`

```
Hi {{1}}, your {{5}} membership expires in {{2}} day(s) on {{3}}.

Please renew before expiry. Contact: {{4}}
```

## Wallet

Add minimum ₹100 to Fast2SMS wallet to start sending.
