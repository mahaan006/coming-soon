// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Config
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const OTP_TTL_MIN = Number(process.env.OTP_TTL_MIN || 10);
const OTP_TTL_MS = OTP_TTL_MIN * 60 * 1000;
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 5);

// DB
const dbFile = path.join(__dirname, 'db.sqlite');
const db = new Database(dbFile);

// OTP table
db.exec(`
CREATE TABLE IF NOT EXISTS email_otps (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  sent_count_minute INTEGER NOT NULL DEFAULT 0,
  window_start_ms INTEGER NOT NULL DEFAULT 0
);
`);

// USERS table
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`);

const now = () => Date.now();
const randCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// cleanup old OTPs
setInterval(() => {
  const cutoff = now() - OTP_TTL_MS;
  const info = db.prepare('DELETE FROM email_otps WHERE created_at < ?').run(cutoff);
  if (info.changes) console.log('OTP cleanup removed', info.changes);
}, 60 * 1000);

// SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: String(process.env.SMTP_SECURE) === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
transporter.verify()
  .then(() => console.log('SMTP ready'))
  .catch(err => console.warn('SMTP verify failed:', err.message));

// Health
app.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ===== OTP ROUTES =====
app.post('/send-email-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: 'Email required' });

    // rate limit window
    const t = now();
    const sel = db.prepare('SELECT sent_count_minute, window_start_ms FROM email_otps WHERE email = ?').get(email);
    if (sel) {
      let { sent_count_minute: count = 0, window_start_ms: start = 0 } = sel;
      if (t - start > 60 * 1000) { count = 0; start = t; }
      if (count >= RATE_LIMIT_PER_MIN) return res.status(429).json({ ok: false, error: 'Too many requests' });
      db.prepare('UPDATE email_otps SET sent_count_minute=?, window_start_ms=? WHERE email=?')
        .run(count + 1, start || t, email);
    }

    const code = randCode();
    db.prepare(`
      INSERT INTO email_otps (email, code, created_at, sent_count_minute, window_start_ms)
      VALUES (?, ?, ?, 1, ?)
      ON CONFLICT(email) DO UPDATE SET
        code=excluded.code,
        created_at=excluded.created_at,
        sent_count_minute = CASE WHEN email_otps.window_start_ms < (? - 60000) THEN 1 ELSE email_otps.sent_count_minute + 1 END,
        window_start_ms   = CASE WHEN email_otps.window_start_ms < (? - 60000) THEN ? ELSE email_otps.window_start_ms END
    `).run(email, code, t, t, t, t, t);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${code}. It expires in ${OTP_TTL_MIN} minutes.`,
      html: `<p>Your OTP code is <b>${code}</b>. It expires in ${OTP_TTL_MIN} minutes.</p>`,
    });

    console.log('OTP created for', email, '->', code);
    res.json({ ok: true });
  } catch (e) {
    console.error('send-email-otp error:', e.message);
    res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
});

app.post('/verify-email-otp', (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code  = String(req.body?.code  || '').trim();
    if (!email || !code) return res.status(400).json({ ok: false, error: 'Email & code required' });

    const rec = db.prepare('SELECT code, created_at FROM email_otps WHERE email = ?').get(email);
    if (!rec) return res.status(400).json({ ok: false, error: 'Code not found' });
    if (rec.code !== code) return res.status(400).json({ ok: false, error: 'Invalid code' });
    if (now() - rec.created_at > OTP_TTL_MS) {
      db.prepare('DELETE FROM email_otps WHERE email = ?').run(email);
      return res.status(400).json({ ok: false, error: 'Code expired' });
    }
    db.prepare('DELETE FROM email_otps WHERE email = ?').run(email);
    console.log('OTP verified for', email);
    res.json({ ok: true });
  } catch (e) {
    console.error('verify-email-otp error:', e.message);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// ===== AUTH ROUTES =====

// Create user (call this after OTP success)
app.post('/signup', (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const email    = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, error: 'username, email, password required' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const created_at = now();

    try {
      const info = db.prepare(`
        INSERT INTO users (username, email, password_hash, created_at)
        VALUES (?, ?, ?, ?)
      `).run(username, email, password_hash, created_at);

      return res.json({
        ok: true,
        user: { id: info.lastInsertRowid, username, email, created_at }
      });
    } catch (err) {
      if (String(err?.message || '').includes('UNIQUE')) {
        return res.status(409).json({ ok: false, error: 'User already exists' });
      }
      throw err;
    }
  } catch (e) {
    console.error('signup error:', e.message);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Login with username OR email + password
app.post('/login', (req, res) => {
  try {
    const id       = String(req.body?.id || '').trim(); // username OR email
    const password = String(req.body?.password || '');

    if (!id || !password) {
      return res.status(400).json({ ok: false, error: 'id and password required' });
    }

    const row = db.prepare(`
      SELECT id, username, email, password_hash, created_at
      FROM users
      WHERE email = ? OR username = ?
      LIMIT 1
    `).get(id.toLowerCase(), id);

    if (!row) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const okPass = bcrypt.compareSync(password, row.password_hash);
    if (!okPass) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    return res.json({
      ok: true,
      user: { id: row.id, username: row.username, email: row.email, created_at: row.created_at }
    });
  } catch (e) {
    console.error('login error:', e.message);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Simple admin utilities
app.get('/users', (_req, res) => {
  const rows = db.prepare('SELECT id, username, email, created_at FROM users ORDER BY id').all();
  res.json({ ok: true, users: rows });
});

app.delete('/users/:idOrKey', (req, res) => {
  const key = String(req.params.idOrKey || '');
  const info = db.prepare('DELETE FROM users WHERE id=? OR email=? OR username=?')
                 .run(Number(key)||-1, key.toLowerCase(), key);
  res.json({ ok: true, deleted: info.changes });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
