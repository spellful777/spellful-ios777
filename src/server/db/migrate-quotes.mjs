/**
 * One-time migration: create quotes and user_quote_history tables.
 * Safe to re-run — uses CREATE TABLE IF NOT EXISTS.
 */
import { createConnection } from 'mysql2/promise';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const configPath = join(process.env.NOMAD_TASK_DIR || '/local', 'config.json');
// eslint-disable-next-line security/detect-non-literal-fs-filename
if (!existsSync(configPath)) { console.error('No config.json found'); process.exit(1); }
// eslint-disable-next-line security/detect-non-literal-fs-filename
const cfg = JSON.parse(readFileSync(configPath, 'utf-8')).DATABASE.VALUE;

const conn = await createConnection({
  host: cfg.HOST, user: cfg.USERNAME, password: cfg.PASSWORD,
  database: cfg.NAME, port: parseInt(cfg.PORT),
  ssl: { rejectUnauthorized: false },
});

await conn.execute(`CREATE TABLE IF NOT EXISTS quotes (
  id INT NOT NULL AUTO_INCREMENT,
  text TEXT NOT NULL,
  normalized_hash VARCHAR(64) NOT NULL,
  theme VARCHAR(50) NOT NULL DEFAULT 'general',
  accent VARCHAR(20) NOT NULL DEFAULT 'gold',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quote_hash (normalized_hash),
  INDEX idx_quotes_active (active)
)`);
console.log('quotes table: ok');

await conn.execute(`CREATE TABLE IF NOT EXISTS user_quote_history (
  id INT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(36) NOT NULL,
  quote_id INT NOT NULL,
  shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_quote (user_id, quote_id),
  INDEX idx_uqh_user (user_id),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
)`);
console.log('user_quote_history table: ok');

await conn.end();
console.log('Migration complete');
