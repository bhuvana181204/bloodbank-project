// backend/utils/encryption.js
const crypto = require("crypto");

// Load secret key from .env
const SECRET_KEY =
  process.env.SECRET_KEY || "fallback_secret_key_32chars_long!";

// Key must be exactly 32 bytes for aes-256-cbc
const KEY = crypto.createHash("sha256").update(SECRET_KEY).digest();

// ============================
// ✅ Encrypt Data (FIXED - uses createCipheriv)
// ============================
function encryptData(text) {
  const iv = crypto.randomBytes(16); // Random IV each time
  const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
  let encrypted = cipher.update(text.toString(), "utf8", "hex");
  encrypted += cipher.final("hex");
  // Prepend IV so we can use it during decryption
  return iv.toString("hex") + ":" + encrypted;
}

// ============================
// ✅ Decrypt Data (FIXED - uses createDecipheriv)
// ============================
function decryptData(encryptedText) {
  try {
    const [ivHex, encrypted] = encryptedText.split(":");
    if (!ivHex || !encrypted) return encryptedText;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return encryptedText; // Return as-is if decryption fails
  }
}

module.exports = { encryptData, decryptData };
