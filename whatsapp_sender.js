// whatsapp_sender.js
// Sends all unsent notices to WhatsApp channel — caption + file attachment

const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const sqlite3 = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const CHANNEL_ID = process.env.WHATSAPP_CHANNEL_ID;
const DB_PATH = path.join(__dirname, "database.db");
const db = new sqlite3(DB_PATH);

function getUnsentNotices() {
  return db.prepare("SELECT * FROM notices WHERE sent_to_whatsapp = 0").all();
}

function markAsSent(id) {
  db.prepare("UPDATE notices SET sent_to_whatsapp = 1 WHERE id = ?").run(id);
}

function buildCaption(notice) {
  const { title, url, file_type, date_on_site } = notice;
  const lines = [
    `📢 *New Notice*`,
    ``,
    `📌 *${title}*`,
    `🕐 ${date_on_site}`,
    `🔗 ${url}`,
  ];
  return lines.join("\n");
}

async function sendNotices(client) {
  const unsent = getUnsentNotices();

  if (unsent.length === 0) {
    console.log("📭 No new notices to send.");
    return;
  }

  console.log(`📤 Sending ${unsent.length} notice(s) to WhatsApp...`);

  for (const notice of unsent) {
    const { id, file_path, file_type } = notice;
    const caption = buildCaption(notice);

    try {
      const ext = path.extname(file_path || "").toLowerCase();
      const fileExists = file_path && fs.existsSync(file_path);

      if (fileExists && ext === ".txt") {
        // Send text content inline
        const content = fs.readFileSync(file_path, "utf-8").slice(0, 3000);
        await client.sendMessage(CHANNEL_ID, `${caption}\n\n─────────────\n${content}`);

      } else if (fileExists) {
        // Send file (PDF, JPG, DOCX) with caption
        const media = MessageMedia.fromFilePath(file_path);
        await client.sendMessage(CHANNEL_ID, media, { caption });

      } else {
        // No file — send caption + link only
        await client.sendMessage(CHANNEL_ID, caption);
      }

      markAsSent(id);
      console.log(`✅ Sent: ${notice.title}`);

      // Small delay to avoid spam detection
      await new Promise((r) => setTimeout(r, 2500));

    } catch (err) {
      console.error(`❌ Failed "${notice.title}": ${err.message}`);
    }
  }

  console.log("✅ All done.");
}

// ── WhatsApp Client ───────────────────────────────────────────────────────────
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
  console.log("\n📱 Scan this QR code:\n");
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("✅ WhatsApp ready!");
  await sendNotices(client);
  process.exit(0);
});

client.on("auth_failure", (msg) => {
  console.error("❌ Auth failed:", msg);
  process.exit(1);
});

client.initialize();
