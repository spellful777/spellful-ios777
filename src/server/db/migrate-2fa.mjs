import { createConnection } from 'mysql2/promise';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const configPath = join(process.env.NOMAD_TASK_DIR || '/local', 'config.json');
// eslint-disable-next-line security/detect-non-literal-fs-filename
const cfg = JSON.parse(readFileSync(configPath, 'utf-8')).DATABASE.VALUE; // safe: configPath is platform-controlled (/local/config.json)
const conn = await createConnection({ host: cfg.HOST, user: cfg.USERNAME, password: cfg.PASSWORD, database: cfg.NAME, port: parseInt(cfg.PORT), ssl: { rejectUnauthorized: false } });

// Create two_factor table with all required columns
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
  console.log('OK: two_factor table created');
} catch(e) { console.log('ERR two_factor:', e.message?.slice(0,100)); }

await conn.end();
console.log('Done');
