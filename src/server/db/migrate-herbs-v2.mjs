/**
 * Herbal Grimoire 2.0 — schema migration
 * Adds trust-layer, safety, botanical identity, and editorial fields to the herbs table.
 * Safe: each column is added in its own try/catch so re-runs are idempotent.
 * Run with: node src/server/db/migrate-herbs-v2.mjs
 */
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const configPath = join(process.env.NOMAD_TASK_DIR || '/local', 'config.json');
// eslint-disable-next-line security/detect-non-literal-fs-filename
const cfg = JSON.parse(readFileSync(configPath, 'utf-8')).DATABASE.VALUE; // safe: platform-controlled path

const conn = await createConnection({
  host: cfg.HOST, user: cfg.USERNAME, password: cfg.PASSWORD,
  database: cfg.NAME, port: parseInt(cfg.PORT),
  ssl: { rejectUnauthorized: false },
});

const columns = [
  // ── Botanical identity ────────────────────────────────────────────────────
  "ALTER TABLE herbs ADD COLUMN botanical_name VARCHAR(255) DEFAULT ''",
  "ALTER TABLE herbs ADD COLUMN plant_family VARCHAR(100) DEFAULT ''",
  "ALTER TABLE herbs ADD COLUMN plant_part VARCHAR(100) DEFAULT ''",
  "ALTER TABLE herbs ADD COLUMN region VARCHAR(255) DEFAULT ''",
  "ALTER TABLE herbs ADD COLUMN identity_warning TEXT",
  // ── Safety lens ───────────────────────────────────────────────────────────
  "ALTER TABLE herbs ADD COLUMN safety_notes TEXT",
  "ALTER TABLE herbs ADD COLUMN pregnancy_caution TINYINT(1) DEFAULT 0",
  "ALTER TABLE herbs ADD COLUMN pet_toxicity TINYINT(1) DEFAULT 0",
  "ALTER TABLE herbs ADD COLUMN drug_interactions TEXT",
  "ALTER TABLE herbs ADD COLUMN ingestion_warning TEXT",
  "ALTER TABLE herbs ADD COLUMN smoke_warning TEXT",
  "ALTER TABLE herbs ADD COLUMN topical_warning TEXT",
  // ── Source transparency ───────────────────────────────────────────────────
  "ALTER TABLE herbs ADD COLUMN source_label VARCHAR(60) DEFAULT 'TRADITIONAL CORRESPONDENCE'",
  "ALTER TABLE herbs ADD COLUMN citation_url VARCHAR(500) DEFAULT ''",
  "ALTER TABLE herbs ADD COLUMN last_verified_date VARCHAR(20) DEFAULT ''",
  // ── Tradition & provenance ────────────────────────────────────────────────
  "ALTER TABLE herbs ADD COLUMN tradition_attribution TEXT",
  "ALTER TABLE herbs ADD COLUMN correspondence_provenance TEXT",
  // ── Editorial workflow ────────────────────────────────────────────────────
  "ALTER TABLE herbs ADD COLUMN status VARCHAR(20) DEFAULT 'approved'",
  "ALTER TABLE herbs ADD COLUMN reported_at TIMESTAMP NULL DEFAULT NULL",
];

let added = 0;
let skipped = 0;
for (const sql of columns) {
  try {
    await conn.execute(sql);
    added++;
    console.log('✓', sql.match(/ADD COLUMN (\w+)/)?.[1]);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      skipped++;
      console.log('↩ already exists:', sql.match(/ADD COLUMN (\w+)/)?.[1]);
    } else {
      console.error('✗ Unexpected error on:', sql.match(/ADD COLUMN (\w+)/)?.[1], err.message);
    }
  }
}

await conn.end();
console.log(`\nMigration complete. Added: ${added}, Already existed (skipped): ${skipped}`);
