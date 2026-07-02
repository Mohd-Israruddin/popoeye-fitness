# Railway MySQL Setup for Popoeye Fitness

## Part 1 — Create Railway account & MySQL

1. Go to [railway.app](https://railway.app) and sign up (GitHub login is easiest).
2. Click **New Project**.
3. Click **Deploy MySQL** (or **+ New** → **Database** → **MySQL**).
4. Wait until the MySQL service shows **Active**.

## Part 2 — Billing

Railway needs a payment method for sustained usage.

1. Open **Account Settings** → **Billing**.
2. Add your card.
3. Hobby plan is enough to start (~$5/month minimum usage).

You get a trial credit when you sign up. MySQL uses a small amount of RAM/storage.

## Part 3 — Get connection details

1. Click your **MySQL** service.
2. Open the **Variables** tab. You will see:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

### For Render (external connection)

Render is outside Railway, so you need the **public TCP proxy**:

1. MySQL service → **Settings** → **Networking** → **TCP Proxy**
2. Enable it with port **3306**
3. Railway gives you:
   - `RAILWAY_TCP_PROXY_DOMAIN` (e.g. `monorail.proxy.rlwy.net`)
   - `RAILWAY_TCP_PROXY_PORT` (e.g. `12345`)

Use the **proxy domain + proxy port** in Render, not the internal `MYSQLHOST`.

## Part 4 — Create tables

1. MySQL service → **Data** tab (or connect with MySQL Workbench using TCP proxy).
2. Open the query editor.
3. Paste and run the full contents of:

   `backend/db/railway-init.sql`

4. Confirm tables exist (`members`, `staff`, `admin_settings`, etc.).

## Part 5 — Local `.env` (testing from your PC)

```env
DB_HOST=monorail.proxy.rlwy.net
DB_PORT=12345
DB_USER=root
DB_PASSWORD=<from MYSQLPASSWORD or MYSQL_ROOT_PASSWORD>
DB_NAME=railway
DB_SSL=true
```

Restart backend and check logs for: `✅ Connected to MySQL database.`

## Part 6 — Render backend env vars

In your Render **backend** web service → **Environment**:

| Key | Value |
|-----|--------|
| `DB_HOST` | TCP proxy domain |
| `DB_PORT` | TCP proxy port |
| `DB_USER` | `MYSQLUSER` value |
| `DB_PASSWORD` | `MYSQLPASSWORD` value |
| `DB_NAME` | `MYSQLDATABASE` (usually `railway`) |
| `DB_SSL` | `true` |
| `JWT_SECRET` | long random string |
| `GYM_NAME` | Popoeye Fitness |
| `CONTACT_PHONE` | your gym phone |
| `CLOUDINARY_*` | your Cloudinary keys |

Leave Fast2SMS vars blank until WhatsApp is ready.

## Part 7 — First admin login

1. Open your live frontend URL.
2. On first visit, complete **admin setup** (Company ID + username).
3. Log in with that Company ID.
4. Start registering members.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `ECONNREFUSED` | TCP Proxy not enabled, or wrong host/port |
| `Access denied` | Wrong user/password |
| `SSL required` | Set `DB_SSL=true` |
| `Unknown table` | Run `railway-init.sql` again |
| Slow first load on Render | Free tier cold start — normal |

## Cost tip

TCP proxy traffic from Render to Railway has **egress fees**. For a small gym app this is usually a few cents/month. If you later host backend on Railway too, use internal `MYSQLHOST` instead of TCP proxy to avoid egress.
