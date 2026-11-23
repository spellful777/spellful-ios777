/**
 * Migration: Spellful Academy tables
 * Run with: node src/server/db/migrate-academy.mjs
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

const statements = [
  `CREATE TABLE IF NOT EXISTS academy_lesson_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    topic_slug VARCHAR(100) NOT NULL,
    lesson_slug VARCHAR(100) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    quiz_score INT DEFAULT NULL,
    last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_lesson (user_id, topic_slug, lesson_slug),
    INDEX idx_academy_user (user_id),
    INDEX idx_academy_topic (user_id, topic_slug)
  )`,
  `CREATE TABLE IF NOT EXISTS academy_bookmarks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    topic_slug VARCHAR(100) NOT NULL,
    lesson_slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_bookmark (user_id, topic_slug, lesson_slug),
    INDEX idx_bookmark_user (user_id)
  )`,
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    console.log('OK:', sql.slice(0, 60).replace(/\n/g, ' '));
  } catch (e) {
    console.error('FAILED:', e.message);
  }
}

await conn.end();
console.log('Academy migration complete.');
