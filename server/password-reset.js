import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import db, { audit, getContent } from './db.js';
import { sendMail } from './mailer.js';

const TTL_MINUTES = 60;

/* Tokens are stored hashed. A leaked database backup should not hand
   somebody a working set of reset links. */
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export function createResetToken(email) {
  const user = db
    .prepare('SELECT id, email, name FROM users WHERE email = ?')
    .get(String(email || '').toLowerCase().trim());
  if (!user) return null;

  // One live token per user: issuing a new one invalidates the old.
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(user.id);

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000).toISOString();
  db.prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
    .run(user.id, hashToken(token), expiresAt);

  return { token, user, expiresAt };
}

export function consumeResetToken(token, newPassword) {
  if (!token || typeof token !== 'string') return { ok: false, error: 'That reset link is not valid.' };

  const row = db
    .prepare(`SELECT r.*, u.email FROM password_resets r
              JOIN users u ON u.id = r.user_id
              WHERE r.token_hash = ?`)
    .get(hashToken(token));

  if (!row) return { ok: false, error: 'That reset link is not valid. Request a new one.' };
  if (row.used_at) return { ok: false, error: 'That reset link has already been used. Request a new one.' };
  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, error: 'That reset link has expired. Request a new one.' };
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 12), row.user_id);
  db.prepare("UPDATE password_resets SET used_at = datetime('now') WHERE id = ?").run(row.id);

  audit(row.email, 'password.reset', `user:${row.user_id}`);
  return { ok: true, email: row.email };
}

/** Checks a token without spending it, so the reset form can refuse early. */
export function isResetTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  const row = db
    .prepare('SELECT used_at, expires_at FROM password_resets WHERE token_hash = ?')
    .get(hashToken(token));
  return Boolean(row) && !row.used_at && new Date(row.expires_at) >= new Date();
}

export async function sendResetEmail({ token, user, expiresAt }, origin) {
  const company = getContent('company', {});
  const link = `${origin}/admin/reset?token=${encodeURIComponent(token)}`;
  const minutes = Math.round((new Date(expiresAt) - Date.now()) / 60000);

  const text = [
    `Someone asked to reset the password for the ${company.name || 'website'} admin console.`,
    '',
    'Open this link to choose a new password:',
    link,
    '',
    `The link works once and expires in about ${minutes} minutes.`,
    'If this was not you, ignore this email — nothing has changed.'
  ].join('\n');

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#F2F4F8;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #E2E7EF;border-top:4px solid #0090D8;padding:26px">
    <p style="font-size:18px;font-weight:700;margin:0 0 14px;color:#11143A">Reset your password</p>
    <p style="margin:0 0 18px;color:#11143A;line-height:1.6">
      Someone asked to reset the password for the ${company.name || 'website'} admin console.
    </p>
    <p style="margin:0 0 22px">
      <a href="${link}" style="display:inline-block;background:#0090D8;color:#06081A;font-weight:600;
         padding:12px 22px;text-decoration:none;border-radius:4px">Choose a new password</a>
    </p>
    <p style="margin:0 0 8px;color:#11143A;opacity:.7;font-size:13px;line-height:1.6">
      The link works once and expires in about ${minutes} minutes.
      If this was not you, ignore this email — nothing has changed.
    </p>
    <p style="margin:18px 0 0;font-size:12px;color:#11143A;opacity:.5;word-break:break-all">${link}</p>
  </div>
</div>`;

  const sent = await sendMail({
    to: user.email,
    subject: `Reset your ${company.name || 'website'} admin password`,
    text,
    html
  });

  /* Without SMTP the link cannot be delivered, so it goes to the server log
     instead. That keeps the owner able to get back in on a fresh install,
     and the log is only readable by whoever already runs the server. */
  if (!sent) {
    console.log(`\n[password reset] SMTP is not configured. Open this link within ${minutes} minutes:\n  ${link}\n`);
  }
  return sent;
}
