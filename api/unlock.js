// api/unlock.js
import crypto from 'crypto';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const COOKIE_NAME = 'overtime_unlocked';
const COOKIE_MAX_AGE = 15 * 60; // 15 minutes in seconds

// simple in-memory rate limiter (per-instance). Works reasonably for low traffic.
const attempts = new Map();

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

function recordAttempt(ip) {
  const now = Date.now();
  const entry = attempts.get(ip) || { count: 0, first: now };
  if (now - entry.first > WINDOW_MS) {
    entry.count = 1;
    entry.first = now;
  } else {
    entry.count += 1;
  }
  attempts.set(ip, entry);
  return entry.count;
}

function isRateLimited(ip) {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string') {
    recordAttempt(ip);
    return res.status(400).json({ error: 'Missing password' });
  }

  const ADMIN = process.env.ADMIN_PASSWORD;
  if (!ADMIN) return res.status(500).json({ error: 'Server misconfigured' });

  // constant-time compare
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(ADMIN);
    let ok = false;
    if (a.length === b.length) {
      ok = crypto.timingSafeEqual(a, b);
    } else {
      // still call timingSafeEqual on equal-length buffers to avoid timing leaks
      const pad = Buffer.alloc(Math.max(a.length, b.length));
      ok = false;
    }

    if (!ok) {
      const count = recordAttempt(ip);
      return res.status(401).json({ error: 'Invalid password', attempts: count });
    }

    // success: set HttpOnly cookie (short-lived)
    const cookieValue = '1';
    const cookieParts = [
      `${COOKIE_NAME}=${cookieValue}`,
      `Max-Age=${COOKIE_MAX_AGE}`,
      'HttpOnly',
      'Path=/',
      'SameSite=Strict',
      'Secure'
    ];
    res.setHeader('Set-Cookie', cookieParts.join('; '));
    // reset attempts for this IP on success
    attempts.delete(ip);
    return res.status(200).json({ ok: true, expires_in: COOKIE_MAX_AGE });
  } catch (err) {
    console.error('unlock error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}