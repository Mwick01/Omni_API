// run_once_auth.js
// Run this via GitHub Actions "WhatsApp Auth" workflow to scan QR and save session

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("\n📱 Scan this QR code with WhatsApp:\n");
  qrcode.generate(qr, { small: true });
  console.log("\n⏳ You have 60 seconds to scan...\n");
});

client.on("ready", () => {
  console.log("\n✅ Authentication successful! Session saved to .wwebjs_auth/");

  // Print channel/group IDs
  client.getChats().then((chats) => {
    const channels = chats.filter(
      (c) => c.isChannel || c.id._serialized.includes("newsletter")
    );
    const groups = chats.filter((c) => c.isGroup);

    console.log("\n📢 Your Channels:");
    if (channels.length === 0) console.log("  (none found)");
    channels.forEach((c) => console.log(`  - ${c.name}: ${c.id._serialized}`));

    console.log("\n👥 Your Groups:");
    if (groups.length === 0) console.log("  (none found)");
    groups.forEach((g) => console.log(`  - ${g.name}: ${g.id._serialized}`));

    process.exit(0);
  });
});

client.on("auth_failure", (msg) => {
  console.error("❌ Auth failed:", msg);
  process.exit(1);
});

client.initialize();