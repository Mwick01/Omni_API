// run_once_auth.js
// Run this ONCE locally to scan the QR code and save your WhatsApp session.
// After scanning, the session is saved in .wwebjs_auth/ — upload that to GitHub Secrets.

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
  puppeteer: { headless: false }, // Show browser so you can scan
});

client.on("qr", (qr) => {
  console.log("\n📱 Scan this QR code with WhatsApp:\n");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("\n✅ Authentication successful!");
  console.log("📁 Session saved to .wwebjs_auth/");
  console.log("\nNext steps:");
  console.log("1. Zip the .wwebjs_auth folder");
  console.log("2. Base64 encode it: base64 -i .wwebjs_auth.zip > session.txt");
  console.log("3. Add contents of session.txt as GitHub Secret: WWEBJS_AUTH");
  console.log("\nAlso run this to get your Channel ID:");
  client.getChats().then((chats) => {
    const channels = chats.filter((c) => c.isChannel || c.id._serialized.includes("newsletter"));
    console.log("\n📢 Your Channels:");
    channels.forEach((c) => console.log(`  - ${c.name}: ${c.id._serialized}`));
    const groups = chats.filter((c) => c.isGroup);
    console.log("\n👥 Your Groups:");
    groups.forEach((g) => console.log(`  - ${g.name}: ${g.id._serialized}`));
    process.exit(0);
  });
});

client.initialize();
