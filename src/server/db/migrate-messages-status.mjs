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

const [cols] = await conn.execute("SHOW COLUMNS FROM messages");
const existing = new Set(cols.map(c => c.Field));

const alters = [
  { col: 'status', sql: "ALTER TABLE messages ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'sent'" },
];

for (const { col, sql } of alters) {
  if (existing.has(col)) { console.log('SKIP (exists):', col); continue; }
  try { await conn.execute(sql); console.log('OK:', col); }
  catch (e) { console.log('ERR:', col, (e instanceof Error ? e.message : String(e)).slice(0, 100)); }
}

await conn.end();
console.log('Migration complete.');
