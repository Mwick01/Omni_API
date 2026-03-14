// whatsapp_sender.js
// Sends unsent notices to a WhatsApp channel using whatsapp-web.js

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const sqlite3 = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// ─── CONFIG ────────────────────────────────────────────────────────────────
// Your WhatsApp Channel or Group ID
// To get Channel ID: open WhatsApp Web, go to your channel, copy the ID from URL
// Format: "1234567890-1234567890@newsletter"  ← for channels
//         "1234567890-1234567890@g.us"         ← for groups
const CHANNEL_ID = process.env.WHATSAPP_CHANNEL_ID;
const DB_PATH = path.join(__dirname, "database.db");
const DOWNLOAD_DIR = path.join(__dirname, "downloads");
// ───────────────────────────────────────────────────────────────────────────

const db = new sqlite3(DB_PATH);

function getUnsentNotices() {
  return db
    .prepare("SELECT * FROM notices WHERE sent_to_whatsapp = 0")
    .all();
}

function markAsSent(id) {
  db.prepare("UPDATE notices SET sent_to_whatsapp = 1 WHERE id = ?").run(id);
}

function getFileExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

async function sendNotices(client) {
  const unsent = getUnsentNotices();

  if (unsent.length === 0) {
    console.log("📭 No new notices to send.");
    return;
  }

  console.log(`📤 Sending ${unsent.length} notice(s) to WhatsApp...`);

  for (const notice of unsent) {
    const { id, title, url, file_path, downloaded_at } = notice;

    try {
      // Build caption message
      const caption =
        `📢 *New Notice*\n\n` +
        `📌 *${title}*\n` +
        `🕐 ${downloaded_at.split("T")[0]}\n` +
        `🔗 ${url}`;

      const ext = getFileExtension(file_path);
      const fileExists = fs.existsSync(file_path);

      if (fileExists && ext !== ".txt") {
        // Send file as media with caption
        const media = MessageMedia.fromFilePath(file_path);
        await client.sendMessage(CHANNEL_ID, media, { caption });
        console.log(`✅ Sent with file: ${title}`);
      } else if (fileExists && ext === ".txt") {
        // Send text content inline for .txt files
        const textContent = fs.readFileSync(file_path, "utf-8").slice(0, 3000);
        const message = `${caption}\n\n─────────────\n${textContent}`;
        await client.sendMessage(CHANNEL_ID, message);
        console.log(`✅ Sent text notice: ${title}`);
      } else {
        // File missing, send link only
        await client.sendMessage(CHANNEL_ID, caption);
        console.log(`✅ Sent link only (file missing): ${title}`);
      }

      markAsSent(id);

      // Small delay between messages to avoid spam detection
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`❌ Failed to send "${title}":`, err.message);
    }
  }

  console.log("✅ All notices sent.");
}

// ─── WHATSAPP CLIENT SETUP ──────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
  },
});

client.on("qr", (qr) => {
  console.log("\n📱 Scan this QR code with WhatsApp:\n");
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("✅ WhatsApp client is ready!");
  await sendNotices(client);
  process.exit(0); // Exit after sending (GitHub Actions runs it as a job)
});

client.on("auth_failure", (msg) => {
  console.error("❌ Authentication failed:", msg);
  process.exit(1);
});

client.initialize();
