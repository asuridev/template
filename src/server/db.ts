import Database from 'better-sqlite3';
import { join } from 'node:path';

let db: Database.Database;

export function getDb(): Database.Database {
  return db;
}

export function initDb(): void {
  const dbPath = process.env['DB_PATH']
    ? join(process.cwd(), process.env['DB_PATH'])
    : join(process.cwd(), 'data', 'partners.db');

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS partners (
      id          TEXT PRIMARY KEY,
      is_active   INTEGER NOT NULL DEFAULT 0,
      config      TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_by  TEXT
    );

    CREATE TABLE IF NOT EXISTS partner_config_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id  TEXT    NOT NULL REFERENCES partners(id),
      config      TEXT    NOT NULL,
      changed_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      changed_by  TEXT,
      change_type TEXT    NOT NULL CHECK (change_type IN ('CREATE','UPDATE','DELETE'))
    );
  `);

  console.log(`[DB] SQLite initialized at: ${dbPath}`);
}
