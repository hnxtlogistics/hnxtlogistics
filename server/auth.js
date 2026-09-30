import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { audit } from './db.js';

const COOKIE = 'hnxt_session';
const TTL_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 24) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set to at least 24 characters in production.');
    }
    return 'dev-only-insecure-secret-do-not-ship-me';
  }
  return value;
}

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, secret(), {
    expiresIn: TTL_SECONDS
  });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TTL_SECONDS * 1000,
    path: '/'
  });
  return token;
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

export function verifyCredentials(email, password) {
  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(String(email || '').toLowerCase().trim());
  if (!user) {
    bcrypt.compareSync(password || '', '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    return null;
  }
  if (!bcrypt.compareSync(password || '', user.password_hash)) return null;
  return user;
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const claims = jwt.verify(token, secret());
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(claims.sub);
    if (!user) return res.status(401).json({ error: 'Session no longer valid.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Sign in again.' });
  }
}

export function changePassword(user, currentPassword, nextPassword) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
    return { ok: false, error: 'Current password is incorrect.' };
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(nextPassword, 12),
    user.id
  );
  audit(user.email, 'password.change', `user:${user.id}`);
  return { ok: true };
}
