const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createUser, verifyUser, findUserByUsername, findUserById } = require('../db/database');
const supabaseService = require('../services/supabaseService');

const SECRET = 'compressx_secret_key_2026';

function generateToken(user) {
  const payload = JSON.stringify({ id: user.id, username: user.username, ts: Date.now() });
  const b64 = Buffer.from(payload).toString('base64');
  const sig = crypto.createHmac('sha256', SECRET).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;

  // 1. Check CompressX HMAC token (b64.sig)
  const parts = token.split('.');
  if (parts.length === 2) {
    const [b64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(b64).digest('hex');
    if (sig === expectedSig) {
      try {
        const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        return payload;
      } catch (e) {}
    }
  }

  // 2. Check standard JWT (header.payload.signature) - e.g. from Supabase
  if (parts.length === 3) {
    try {
      const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadStr);
      if (payload && (payload.sub || payload.id)) {
        return {
          id: payload.sub || payload.id,
          username: payload.user_metadata?.username || payload.email?.split('@')[0] || 'user'
        };
      }
    } catch (e) {}
  }

  // 3. Fallback: check if it's a raw user id
  const user = findUserById(token);
  if (user) {
    return { id: user.id, username: user.username };
  }

  return null;
}

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    let supabaseUser = null;

    // 1. Try Supabase Auth
    if (supabaseService.isConfigured()) {
      try {
        const sbRes = await supabaseService.signUp(username, password);
        if (sbRes) {
          supabaseUser = sbRes;
        }
      } catch (sbErr) {
        console.warn('[Supabase Auth] Registration notice:', sbErr.message);
      }
    }

    // 2. Also record in local DB as fallback
    let localUser = findUserByUsername(username);
    if (!localUser) {
      localUser = createUser(username, password);
    }

    const finalUser = {
      id: supabaseUser?.id || localUser.id,
      username: username.trim(),
      email: supabaseUser?.email || `${username}@compressx.local`
    };

    // Associate any prior guest jobs to this user
    try {
      const { db } = require('../db/database');
      db.prepare(`UPDATE jobs SET user_id = ? WHERE user_id = 'guest'`).run(finalUser.id);
    } catch (e) {}

    const token = generateToken(finalUser);
    res.json({ user: finalUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    let finalUser = null;

    // 1. Try Supabase Auth
    if (supabaseService.isConfigured()) {
      try {
        const sbRes = await supabaseService.signIn(username, password);
        if (sbRes) {
          finalUser = {
            id: sbRes.id,
            username: sbRes.username || username,
            email: sbRes.email
          };
        }
      } catch (sbErr) {
        console.warn('[Supabase Auth] Sign in notice:', sbErr.message);
      }
    }

    // 2. Local fallback if Supabase not configured or failed
    if (!finalUser) {
      const localUser = verifyUser(username, password);
      if (localUser) {
        finalUser = localUser;
      }
    }

    if (!finalUser) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Associate any prior guest jobs to this user so their recent work appears
    try {
      const { db } = require('../db/database');
      db.prepare(`UPDATE jobs SET user_id = ? WHERE user_id = 'guest'`).run(finalUser.id);
    } catch (e) {}

    const token = generateToken(finalUser);
    res.json({ user: finalUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = findUserById(decoded.id) || { id: decoded.id, username: decoded.username };
  res.json({ user });
});

module.exports = {
  router,
  verifyToken
};
