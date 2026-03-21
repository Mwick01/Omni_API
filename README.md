# 📢 Notice Bot — Auto Scraper + WhatsApp Sender

Automatically checks your university notice board every 15 minutes, downloads new files (PDF, DOCX, JPG, TXT), and sends them to your WhatsApp Channel.

---

## 🏗️ Project Structure

```
notice-bot/
├── scraper.py              # Scrapes website & downloads notices
├── database.py             # SQLite database handler
├── main.py                 # Entry point (runs scraper → WhatsApp)
├── whatsapp_sender.js      # Sends notices via whatsapp-web.js
├── run_once_auth.js        # One-time WhatsApp QR scanner
├── package.json            # Node.js dependencies
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── .gitignore
└── .github/
    └── workflows/
        └── notice_bot.yml  # GitHub Actions (runs every 15 min)
```

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/notice-bot.git
cd notice-bot

# Python deps
pip install -r requirements.txt

# Node deps
npm install
```

### Step 2 — Authenticate WhatsApp (ONE TIME, on your local machine)

```bash
node run_once_auth.js
```

- A QR code will appear in your terminal
- Open WhatsApp on your phone → Linked Devices → Link a Device → Scan QR
- After scanning, it will print your **Channel ID** and **Group IDs**
- Copy your Channel ID (looks like `120363XXXXXXXXXX@newsletter`)

### Step 3 — Save Session for GitHub Actions

After scanning, a `.wwebjs_auth/` folder is created. You need to upload it to GitHub Actions cache. The workflow handles this automatically — just make sure you push the folder once:

```bash
# The .gitignore excludes .wwebjs_auth by default.
# For first setup, temporarily allow it:
git add -f .wwebjs_auth/
git commit -m "Add WhatsApp session (one-time)"
git push
```

> ⚠️ After the first successful GitHub Actions run with caching, remove `.wwebjs_auth` from git tracking — the Actions cache will keep it alive.

### Step 4 — Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `SITE_USERNAME` | `XXXXXXXXXXX` |
| `SITE_PASSWORD` | Your portal password |
| `WHATSAPP_CHANNEL_ID` | e.g. `120363XXXXXXXXXX@newsletter` |

### Step 5 — Push to GitHub

```bash
git add .
git commit -m "Initial notice bot setup"
git push
```

GitHub Actions will now run every 15 minutes automatically! ✅

---

## ▶️ Run Locally (for testing)

```bash
# Copy and fill in your .env
cp .env.example .env

# Run the full bot
python main.py

# Or run just the scraper
python scraper.py

# Or run just the WhatsApp sender
node whatsapp_sender.js
```

---

## 🔧 How It Works

```
Every 15 mins (GitHub Actions)
        │
        ▼
  scraper.py
  ├── Login to portal
  ├── Scrape notice page
  ├── Download new files (PDF/DOCX/JPG/TXT)
  ├── Convert HTML → TXT
  └── Save new entries to SQLite DB
        │
        ▼
  whatsapp_sender.js
  ├── Read unsent notices from DB
  ├── Send each file + caption to WhatsApp Channel
  └── Mark notices as sent in DB
```

---

## 📝 Notes

- **SQLite database** persists between GitHub Actions runs via Actions Cache
- **WhatsApp session** persists via Actions Cache (no re-scanning needed)
- **Downloads folder** also cached to avoid re-downloading
- GitHub Actions free tier gives **2,000 minutes/month** — running every 15 min uses ~1,440 min/month, staying within limits
- WhatsApp messages are delayed 2 seconds apart to avoid spam detection

---

## ❓ Troubleshooting

**WhatsApp session expired?**
- Delete the cache in GitHub Actions UI (Actions → Caches)
- Run `node run_once_auth.js` locally again and re-push `.wwebjs_auth/`

**Login failing?**
- Check `SITE_USERNAME` and `SITE_PASSWORD` secrets are correct
- Try running locally first with `.env` file

**No notices found?**
- The scraper targets `a[href]` links with valid extensions
- If the website structure changes, update the selectors in `scraper.py`
