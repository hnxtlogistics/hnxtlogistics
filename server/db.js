import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : resolve(here, 'data', 'site.db');

mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    mode        TEXT NOT NULL DEFAULT 'ROAD',
    summary     TEXT NOT NULL DEFAULT '',
    body        TEXT NOT NULL DEFAULT '',
    lane        TEXT NOT NULL DEFAULT '',
    transit     TEXT NOT NULL DEFAULT '',
    featured    INTEGER NOT NULL DEFAULT 0,
    published   INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS faqs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    question   TEXT NOT NULL,
    answer     TEXT NOT NULL,
    published  INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS enquiries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    kind        TEXT NOT NULL DEFAULT 'contact',
    scope       TEXT NOT NULL DEFAULT '',
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT NOT NULL DEFAULT '',
    company     TEXT NOT NULL DEFAULT '',
    subject     TEXT NOT NULL DEFAULT '',
    message     TEXT NOT NULL DEFAULT '',
    origin      TEXT NOT NULL DEFAULT '',
    destination TEXT NOT NULL DEFAULT '',
    mode        TEXT NOT NULL DEFAULT '',
    weight      TEXT NOT NULL DEFAULT '',
    dimensions  TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'new',
    ref         TEXT NOT NULL DEFAULT '',
    mailed      INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_enquiries_status  ON enquiries (status);
  CREATE INDEX IF NOT EXISTS idx_services_order    ON services (sort_order);
`);

/* Additive migrations for databases created before a column existed. */
for (const [table, column, definition] of [
  ['enquiries', 'mailed', "INTEGER NOT NULL DEFAULT 0"],
  ['enquiries', 'scope', "TEXT NOT NULL DEFAULT ''"]
]) {
  const present = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
  if (!present) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function getContent(key, fallback = null) {
  const row = db.prepare('SELECT value FROM content WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

/* Monotonic counter bumped on every content write. The rendered HTML shell
   caches against this rather than updated_at, whose one-second resolution
   lets a second edit inside the same second slip past unnoticed. */
let contentVersion = 0;

export const getContentVersion = () => contentVersion;
export const bumpContentVersion = () => (contentVersion += 1);

export function setContent(key, value) {
  db.prepare(
    `INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(key, JSON.stringify(value));
  bumpContentVersion();
  return value;
}

export default db;
