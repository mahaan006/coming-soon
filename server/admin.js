const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const db = new Database(path.join(__dirname, "db.sqlite"));

// Ensure table exists
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`);

const cmd = (process.argv[2] || "").toLowerCase();

if (cmd === "list") {
  const rows = db.prepare("SELECT id, username, email, created_at FROM users ORDER BY id").all();
  console.table(rows);
  process.exit(0);
}

if (cmd === "delete") {
  const id = process.argv[3];
  if (!id) { console.log("Usage: node admin.js delete <email|username|id>"); process.exit(1); }
  const info = db.prepare("DELETE FROM users WHERE email=? OR username=? OR id=?").run(id, id, Number(id)||-1);
  console.log("Deleted rows:", info.changes);
  process.exit(0);
}

if (cmd === "setpass") {
  const id = process.argv[3];
  const pass = process.argv[4];
  if (!id || !pass) { console.log("Usage: node admin.js setpass <email|username|id> <newpassword>"); process.exit(1); }
  const hash = bcrypt.hashSync(pass, 10);
  const info = db.prepare("UPDATE users SET password_hash=? WHERE email=? OR username=? OR id=?")
                 .run(hash, id, id, Number(id)||-1);
  console.log("Updated rows:", info.changes);
  process.exit(0);
}

console.log("Usage:");
console.log("  node admin.js list");
console.log("  node admin.js delete <email|username|id>");
console.log("  node admin.js setpass <email|username|id> <newpassword>");
