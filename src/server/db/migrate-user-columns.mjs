/**
 * Migration: add all missing user table columns.
 *
 * Adds columns that exist in schema.ts but may be absent from the live DB
 * (e.g. after a project restore that rolled back the schema without touching
 * the database). Each ALTER is guarded by a SHOW COLUMNS check so it is safe
 * to re-run at any time.
 */
import { createConnection } from 'mysql2/promise';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const configPath = join(process.env.NOMAD_TASK_DIR || '/local', 'config.json');
// eslint-disable-next-line security/detect-non-literal-fs-filename
if (!existsSync(configPath)) { console.error('No config.json found at', configPath); process.exit(1); } // safe: platform-controlled path
// eslint-disable-next-line security/detect-non-literal-fs-filename
const cfg = JSON.parse(readFileSync(configPath, 'utf-8')).DATABASE.VALUE; // safe: platform-controlled path

const conn = await createConnection({
  host: cfg.HOST,
  user: cfg.USERNAME,
  password: cfg.PASSWORD,
  database: cfg.NAME,
  port: parseInt(cfg.PORT),
  ssl: { rejectUnauthorized: false },
});

// ── user table ───────────────────────────────────────────────────────────────
const [cols] = await conn.execute('SHOW COLUMNS FROM user');
const existing = new Set(cols.map(c => c.Field));

const userAlters = [
  { col: 'is_admin',           sql: "ALTER TABLE user ADD COLUMN is_admin BOOLEAN DEFAULT FALSE" },
  { col: 'phone_number',       sql: "ALTER TABLE user ADD COLUMN phone_number VARCHAR(30)" },
  { col: 'two_factor_enabled', sql: "ALTER TABLE user ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE" },
  { col: 'birth_date',         sql: "ALTER TABLE user ADD COLUMN birth_date VARCHAR(20)" },
  { col: 'birth_time',         sql: "ALTER TABLE user ADD COLUMN birth_time VARCHAR(10)" },
  { col: 'birth_location',     sql: "ALTER TABLE user ADD COLUMN birth_location VARCHAR(255)" },
  { col: 'sun_sign',           sql: "ALTER TABLE user ADD COLUMN sun_sign VARCHAR(50)" },
  { col: 'moon_sign',          sql: "ALTER TABLE user ADD COLUMN moon_sign VARCHAR(50)" },
  { col: 'rising_sign',        sql: "ALTER TABLE user ADD COLUMN rising_sign VARCHAR(50)" },
  { col: 'username',           sql: "ALTER TABLE user ADD COLUMN username VARCHAR(50) UNIQUE" },
  { col: 'bio',                sql: "ALTER TABLE user ADD COLUMN bio VARCHAR(160) DEFAULT ''" },
  { col: 'location',           sql: "ALTER TABLE user ADD COLUMN location VARCHAR(100) DEFAULT ''" },
  { col: 'witch_path',         sql: "ALTER TABLE user ADD COLUMN witch_path VARCHAR(100) DEFAULT ''" },
  { col: 'profile_visibility', sql: "ALTER TABLE user ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'private'" },
  { col: 'backup_email',      sql: "ALTER TABLE user ADD COLUMN backup_email VARCHAR(255)" },
  { col: 'referral_source',   sql: "ALTER TABLE user ADD COLUMN referral_source VARCHAR(100)" },
];

for (const { col, sql } of userAlters) {
  if (existing.has(col)) {
    console.log('SKIP (exists):', col);
    continue;
  }
  try {
    await conn.execute(sql);
    console.log('OK:', col);
  } catch (e) {
    console.log('ERR:', col, (e instanceof Error ? e.message : String(e)).slice(0, 120));
  }
}

// ── two_factor table (create if missing, add columns if partial) ─────────────
try {
  await conn.execute(`CREATE TABLE IF NOT EXISTS two_factor (
    id VARCHAR(36) PRIMARY KEY,
    secret VARCHAR(255) NOT NULL,
    backup_codes TEXT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    failed_verification_count INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  )`);
  console.log('OK: two_factor table ensured');
} catch (e) {
  console.log('ERR two_factor create:', (e instanceof Error ? e.message : String(e)).slice(0, 120));
}

const [tfCols] = await conn.execute('SHOW COLUMNS FROM two_factor');
const tfExisting = new Set(tfCols.map(c => c.Field));

const tfAlters = [
  { col: 'verified',                  sql: 'ALTER TABLE two_factor ADD COLUMN verified BOOLEAN DEFAULT FALSE' },
  { col: 'failed_verification_count', sql: 'ALTER TABLE two_factor ADD COLUMN failed_verification_count INT DEFAULT 0' },
  { col: 'locked_until',              sql: 'ALTER TABLE two_factor ADD COLUMN locked_until TIMESTAMP NULL' },
];

for (const { col, sql } of tfAlters) {
  if (tfExisting.has(col)) {
    console.log('SKIP (exists):', col);
    continue;
  }
  try {
    await conn.execute(sql);
    console.log('OK:', col);
  } catch (e) {
    console.log('ERR:', col, (e instanceof Error ? e.message : String(e)).slice(0, 120));
  }
}

await conn.end();
console.log('Migration complete.');
