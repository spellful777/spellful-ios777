import { createConnection } from 'mysql2/promise';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const configPath = join(process.env.NOMAD_TASK_DIR || '/local', 'config.json');
// eslint-disable-next-line security/detect-non-literal-fs-filename
if (!existsSync(configPath)) { console.error('No config.json found'); process.exit(1); } // safe: configPath is platform-controlled
// eslint-disable-next-line security/detect-non-literal-fs-filename
const cfg = JSON.parse(readFileSync(configPath, 'utf-8')).DATABASE.VALUE;

const conn = await createConnection({
  host: cfg.HOST, user: cfg.USERNAME, password: cfg.PASSWORD,
  database: cfg.NAME, port: parseInt(cfg.PORT),
  ssl: { rejectUnauthorized: false },
});

// Check existing columns in user table
const [cols] = await conn.execute("SHOW COLUMNS FROM user");
const existing = new Set(cols.map(c => c.Field));

const userAlters = [
  { col: 'username', sql: "ALTER TABLE user ADD COLUMN username VARCHAR(50) UNIQUE" },
  { col: 'bio', sql: "ALTER TABLE user ADD COLUMN bio VARCHAR(160) DEFAULT ''" },
  { col: 'location', sql: "ALTER TABLE user ADD COLUMN location VARCHAR(100) DEFAULT ''" },
  { col: 'witch_path', sql: "ALTER TABLE user ADD COLUMN witch_path VARCHAR(100) DEFAULT ''" },
  { col: 'profile_visibility', sql: "ALTER TABLE user ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'private'" },
];

for (const { col, sql } of userAlters) {
  if (existing.has(col)) { console.log('SKIP (exists):', col); continue; }
  try { await conn.execute(sql); console.log('OK:', col); }
  catch (e) { console.log('ERR:', col, (e instanceof Error ? e.message : String(e)).slice(0, 100)); }
}

// Check two_factor columns
const [tfCols] = await conn.execute("SHOW COLUMNS FROM two_factor");
const tfExisting = new Set(tfCols.map(c => c.Field));

const tfAlters = [
  { col: 'verified', sql: "ALTER TABLE two_factor ADD COLUMN verified BOOLEAN DEFAULT FALSE" },
  { col: 'failed_verification_count', sql: "ALTER TABLE two_factor ADD COLUMN failed_verification_count INT DEFAULT 0" },
  { col: 'locked_until', sql: "ALTER TABLE two_factor ADD COLUMN locked_until TIMESTAMP NULL" },
];

for (const { col, sql } of tfAlters) {
  if (tfExisting.has(col)) { console.log('SKIP (exists):', col); continue; }
  try { await conn.execute(sql); console.log('OK:', col); }
  catch (e) { console.log('ERR:', col, (e instanceof Error ? e.message : String(e)).slice(0, 100)); }
}

await conn.end();
console.log('Migration complete');
