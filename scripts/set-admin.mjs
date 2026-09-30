/**
 * Creates or updates the administrator account.
 *   node scripts/set-admin.mjs <email> <password> ["Display Name"]
 * Run it against the same DATABASE_PATH the server uses.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db, { audit } from '../server/db.js';

const [email, password, name] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/set-admin.mjs <email> <password> ["Display Name"]');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

const normalised = email.toLowerCase().trim();
const hash = bcrypt.hashSync(password, 12);
const existing = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();

if (existing) {
  db.prepare('UPDATE users SET email = ?, password_hash = ?, name = COALESCE(?, name) WHERE id = ?')
    .run(normalised, hash, name || null, existing.id);
  audit(normalised, 'account.credentials.update', `user:${existing.id}`);
  console.log(`Updated the administrator account → ${normalised}`);
} else {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(normalised, name || 'Site Administrator', hash, 'owner');
  audit(normalised, 'account.create', `user:${lastInsertRowid}`);
  console.log(`Created the administrator account → ${normalised}`);
}
