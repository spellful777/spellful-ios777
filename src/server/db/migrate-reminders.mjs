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

// Create reminder_preferences table if it doesn't exist
try {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS reminder_preferences (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id VARCHAR(36) NOT NULL UNIQUE,
      full_moon_reminder BOOLEAN DEFAULT FALSE,
      new_moon_reminder BOOLEAN DEFAULT FALSE,
      quarter_moon_reminder BOOLEAN DEFAULT FALSE,
      tarot_reminder BOOLEAN DEFAULT FALSE,
      dream_journal_reminder BOOLEAN DEFAULT FALSE,
      ritual_reminder BOOLEAN DEFAULT FALSE,
      email_notifications BOOLEAN DEFAULT TRUE,
      reminder_days_before INT DEFAULT 1,
      timezone VARCHAR(100) DEFAULT 'UTC',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);
  console.log('OK: reminder_preferences table created (or already exists)');
} catch (e) {
  console.log('ERR: reminder_preferences', (e instanceof Error ? e.message : String(e)).slice(0, 200));
}

await conn.end();
console.log('Migration complete.');
